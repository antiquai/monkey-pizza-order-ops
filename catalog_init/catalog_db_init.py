import json
import os
import re
import time
from decimal import Decimal

import psycopg2
from psycopg2.extras import Json

def db_connect():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "db"),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD")
    )

def wait_for_db():
    print("Waiting for database...")
    for _ in range(30):
        try:
            conn = db_connect()
            conn.close()
            print("Database is ready.")
            return
        except psycopg2.OperationalError:
            time.sleep(1)
    raise Exception("Could not connect to database after 30 seconds.")

def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", text.lower().strip()).strip("_")


def add_movement(cur, ingredient_code: str, delta, reason: str, ref_type=None, ref_id=None, note=None):
    cur.execute("""
        INSERT INTO inventory_movements (
            ingredient_code, delta, reason, ref_type, ref_id, note
        )
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (ingredient_code, delta, reason, ref_type, ref_id, note))

    cur.execute("""
        UPDATE ingredients
        SET current_stock = current_stock + %s
        WHERE code = %s
    """, (delta, ingredient_code))


def upsert_ingredient(cur, code: str, name: str, unit: str, stock=0, reorder_level=0):
    cur.execute("""
        INSERT INTO ingredients (code, name, unit, current_stock, reorder_level)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (code) DO UPDATE SET
            name = EXCLUDED.name,
            unit = EXCLUDED.unit
    """, (code, name, unit, stock, reorder_level))


def create_recipe(cur, source_key: str, recipe_type: str, product_name=None, size_key=None, modifier_code=None):
    cur.execute("""
        INSERT INTO recipes (source_key, recipe_type, product_name, size_key, modifier_code)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (source_key) DO NOTHING
        RETURNING id
    """, (source_key, recipe_type, product_name, size_key, modifier_code))
    row = cur.fetchone()
    return row[0] if row else None


def add_recipe_item(cur, recipe_id: int, ingredient_code: str, quantity, unit: str):
    cur.execute("""
        INSERT INTO recipe_items (recipe_id, ingredient_code, quantity, unit)
        VALUES (%s, %s, %s, %s)
    """, (recipe_id, ingredient_code, quantity, unit))

# ─────────────────────────────────────────────────────────────────────────────
# Init
# ───────────────────────────────────────────────────────────────────────────── 

def init():
    wait_for_db()
    conn = db_connect()
    cur = conn.cursor()
    
    cur.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto;")

    cur.execute("""
        CREATE TABLE IF NOT EXISTS catalog (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            category VARCHAR(100) NOT NULL,
            base_price NUMERIC(10, 2) DEFAULT NULL,
            ingredients TEXT,
            image VARCHAR(255) DEFAULT 'pizza.gif',
            sizes JSONB DEFAULT NULL
        );
    """)
    print("Table CATALOG created", flush=True)
    
    cur.execute("""
        CREATE TABLE IF NOT EXISTS shifts (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            opened_at TIMESTAMP NOT NULL DEFAULT NOW(),
            closed_at TIMESTAMP DEFAULT NULL,
            total_duration INTERVAL GENERATED ALWAYS AS (closed_at - opened_at) STORED
        );
    """)
    print("Table SHIFTS created", flush=True)
    
    cur.execute("""
        CREATE TABLE IF NOT EXISTS personal (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            color VARCHAR(20) DEFAULT '#22c55e'
        );
    """)
    print("Table PERSONAL created", flush=True)
    
    cur.execute("""
        CREATE TABLE IF NOT EXISTS timetable (
            id SERIAL PRIMARY KEY,
            week_start DATE NOT NULL,
            week_end DATE NOT NULL,
            day VARCHAR(10) NOT NULL,
            time_slot VARCHAR(10) NOT NULL,
            staff_name VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        );
    """)
    print("Table TIMETABLE created", flush=True)
    
    cur.execute("""
        CREATE TABLE IF NOT EXISTS timetable_weeks (
            id SERIAL PRIMARY KEY,
            week_start DATE NOT NULL UNIQUE,
            week_end DATE NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        );
    """)
    print("Table TIMETABLE_WEEKS created", flush=True)
    
    cur.execute("""
        CREATE TABLE IF NOT EXISTS pizza_orders (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            kitchen_id VARCHAR(50),
            customer VARCHAR(255),
            address VARCHAR(255),
            type_of_delivery VARCHAR(50),
            items JSONB,
            total_price NUMERIC(10,2),
            shift_name VARCHAR(100) DEFAULT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'in delivery', 'done', 'cancelled')),
            inventory_status VARCHAR(50) NOT NULL DEFAULT 'pending'
                CHECK (inventory_status IN ('pending', 'deducted', 'blocked', 'error')),
            inventory_note TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    print("Table PIZZS_ORDERS created", flush=True)
    
    # ── Inventory tables ─────────────────────────────────────────────────────
    
    cur.execute("""
        CREATE TABLE IF NOT EXISTS ingredients (
            code VARCHAR(100) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            unit VARCHAR(20) NOT NULL,
            current_stock NUMERIC(12,3) NOT NULL DEFAULT 0,
            reorder_level NUMERIC(12,3) NOT NULL DEFAULT 0,
            active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS inventory_movements (
            id BIGSERIAL PRIMARY KEY,
            ingredient_code VARCHAR(100) NOT NULL REFERENCES ingredients(code),
            delta NUMERIC(12,3) NOT NULL,
            reason VARCHAR(100) NOT NULL,
            ref_type VARCHAR(50),
            ref_id VARCHAR(100),
            note TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS prep_batches (
            id BIGSERIAL PRIMARY KEY,
            batch_code VARCHAR(100) NOT NULL UNIQUE,
            batch_type VARCHAR(50) NOT NULL DEFAULT 'dough',
            notes TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS prep_batch_inputs (
            id BIGSERIAL PRIMARY KEY,
            batch_id BIGINT NOT NULL REFERENCES prep_batches(id) ON DELETE CASCADE,
            ingredient_code VARCHAR(100) NOT NULL REFERENCES ingredients(code),
            quantity NUMERIC(12,3) NOT NULL,
            unit VARCHAR(20) NOT NULL
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS prep_batch_outputs (
            id BIGSERIAL PRIMARY KEY,
            batch_id BIGINT NOT NULL REFERENCES prep_batches(id) ON DELETE CASCADE,
            ingredient_code VARCHAR(100) NOT NULL REFERENCES ingredients(code),
            quantity NUMERIC(12,3) NOT NULL,
            unit VARCHAR(20) NOT NULL
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS recipes (
            id BIGSERIAL PRIMARY KEY,
            source_key VARCHAR(200) NOT NULL UNIQUE,
            recipe_type VARCHAR(20) NOT NULL
                CHECK (recipe_type IN ('product', 'modifier')),
            product_name VARCHAR(255),
            size_key VARCHAR(50),
            modifier_code VARCHAR(100),
            active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW()
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS recipe_items (
            id BIGSERIAL PRIMARY KEY,
            recipe_id BIGINT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
            ingredient_code VARCHAR(100) NOT NULL REFERENCES ingredients(code),
            quantity NUMERIC(12,3) NOT NULL,
            unit VARCHAR(20) NOT NULL
        );
    """)

    print("Inventory tables created", flush=True)

    with open("catalog.json", "r", encoding="utf-8") as f:
        items = json.load(f)
    
    with open('personal.json', "r", encoding="utf-8") as t:
        staff = json.load(t)

    cur.execute("SELECT COUNT(*) FROM catalog;")
    if cur.fetchone()[0] == 0:
        print(f"Inserting {len(items)} items...")
        for item in items:
            cur.execute("""
                INSERT INTO catalog (name, category, base_price, ingredients, sizes)
                VALUES (%s, %s, %s, %s, %s);
            """, (
                item["name"],
                item["category"],
                item.get("base_price"),
                item.get("ingredients"),
                json.dumps(item["sizes"]) if item.get("sizes") else None
            ))
        print(f"Done. {len(items)} items inserted.")
    else:
        print("Table already populated, skipping insert.")
        
    cur.execute("SELECT COUNT(*) FROM personal;")
    if cur.fetchone()[0] == 0:
        print(f"Inserting {len(staff)} personal...")
        for p in staff:
            cur.execute("""
                INSERT INTO personal (name, color)
                VALUES (%s, %s);
            """, (
                p["name"],
                p["color"]
            ))
        print(f"Done. {len(staff)} items inserted.")
    else:
        print("Table already populated, skipping insert.")
        
    # ── Ingredients seed ─────────────────────────────────────────────────────
    cur.execute("SELECT COUNT(*) FROM ingredients;")
    if cur.fetchone()[0] == 0:
        ingredients = [
            ("flour", "Flour", "g"),
            ("sugar", "Sugar", "g"),
            ("salt", "Salt", "g"),
            ("yeast", "Yeast", "g"),
            ("olive_oil", "Olive oil", "ml"),
            ("water", "Water", "ml"),
            ("dough_ball_300g", "Dough ball 300g", "pcs"),
            ("salami_slice", "Salami slice", "pcs"),
            ("tomato_sauce", "Tomato sauce", "ml"),
            ("cheese", "Cheese", "g"),
            ("tuna", "Tuna", "g"),
            ("onion", "Onion", "g"),
            ("sucuk", "Sucuk", "g"),
            ("becks_bottle", "Becks bottle", "bottle"),
            ("cola_500ml", "Cola 0.5L", "bottle"),
            ("sprite_1l", "Sprite 1L", "bottle"),
        ]
        for code, name, unit in ingredients:
            upsert_ingredient(cur, code, name, unit, stock=0, reorder_level=0)

        print("Ingredients seed done.", flush=True)

    # ── Demo initial stock ────────────────────────────────────────────────────
    # Run only once on an empty inventory table.
    cur.execute("SELECT COUNT(*) FROM inventory_movements;")
    if cur.fetchone()[0] == 0:
        print("Seeding demo inventory...", flush=True)

        # Yesterday evening stock
        initial_stock = [
            ("flour", 10000, "INITIAL_INVENTORY", None, None, "10kg"),
            ("sugar", 3000, "INITIAL_INVENTORY", None, None, "3kg"),
            ("salt", 500, "INITIAL_INVENTORY", None, None, "500g"),
            ("yeast", 500, "INITIAL_INVENTORY", None, None, "500g"),
            ("olive_oil", 2000, "INITIAL_INVENTORY", None, None, "2L"),
            ("water", 20000, "INITIAL_INVENTORY", None, None, "20L"),
            ("salami_slice", 50, "INITIAL_INVENTORY", None, None, "50 slices"),
            ("tomato_sauce", 4000, "INITIAL_INVENTORY", None, None, "4L"),
            ("cheese", 30000, "INITIAL_INVENTORY", None, None, "30kg"),
            ("tuna", 3000, "INITIAL_INVENTORY", None, None, "3 cans demo"),
            ("onion", 1000, "INITIAL_INVENTORY", None, None, "1kg"),
            ("sucuk", 3000, "INITIAL_INVENTORY", None, None, "3kg"),
            ("becks_bottle", 72, "INITIAL_INVENTORY", None, None, "3 packs x 24"),
            ("cola_500ml", 24, "INITIAL_INVENTORY", None, None, "2 packs x 12"),
            ("sprite_1l", 6, "INITIAL_INVENTORY", None, None, "1 pack x 6"),
        ]

        for code, delta, reason, ref_type, ref_id, note in initial_stock:
            add_movement(cur, code, delta, reason, ref_type, ref_id, note)

        # Dough batch from yesterday
        cur.execute("""
            INSERT INTO prep_batches (batch_code, batch_type, notes)
            VALUES (%s, %s, %s)
            RETURNING id
        """, ("dough_batch_2025_01_15", "dough", "10kg dough batch for tomorrow"))
        batch_id = cur.fetchone()[0]

        dough_inputs = [
            ("flour", 6000, "g"),
            ("water", 3550, "ml"),
            ("olive_oil", 300, "ml"),
            ("yeast", 100, "g"),
            ("salt", 120, "g"),
            ("sugar", 60, "g"),
        ]
        for code, qty, unit in dough_inputs:
            cur.execute("""
                INSERT INTO prep_batch_inputs (batch_id, ingredient_code, quantity, unit)
                VALUES (%s, %s, %s, %s)
            """, (batch_id, code, qty, unit))
            add_movement(cur, code, -qty, "PREP_BATCH", "prep_batch", str(batch_id), "dough production consumption")

        cur.execute("""
            INSERT INTO prep_batch_outputs (batch_id, ingredient_code, quantity, unit)
            VALUES (%s, %s, %s, %s)
        """, (batch_id, "dough_ball_300g", 33, "pcs"))
        add_movement(cur, "dough_ball_300g", 33, "PREP_BATCH", "prep_batch", str(batch_id), "dough balls produced")

        print("Demo inventory seeded.", flush=True)

    # ── Demo recipes ─────────────────────────────────────────────────────────
    cur.execute("SELECT COUNT(*) FROM recipes;")
    if cur.fetchone()[0] == 0:
        print("Seeding demo recipes...", flush=True)

        # Helper to create product recipe
        def seed_product(name, size_key, items_list):
            source_key = f"product:{name}:{size_key}" if size_key else f"product:{name}"
            recipe_id = create_recipe(cur, source_key, "product", product_name=name, size_key=size_key)
            if recipe_id:
                for ingredient_code, qty, unit in items_list:
                    add_recipe_item(cur, recipe_id, ingredient_code, qty, unit)

        # Helper to create modifier recipe
        def seed_modifier(code, items_list):
            source_key = f"modifier:{code}"
            recipe_id = create_recipe(cur, source_key, "modifier", modifier_code=code)
            if recipe_id:
                for ingredient_code, qty, unit in items_list:
                    add_recipe_item(cur, recipe_id, ingredient_code, qty, unit)

        # Examples for your current catalog
        pizza_sizes = {
            "26cm": {"dough_ball_300g": 1, "tomato_sauce": 30, "cheese": 100},
            "30cm": {"dough_ball_300g": 1, "tomato_sauce": 40, "cheese": 120},
            "36cm": {"dough_ball_300g": 1, "tomato_sauce": 55, "cheese": 150},
        }

        for size, base in pizza_sizes.items():
            seed_product(
                "Pepperoni",
                size,
                [
                    ("dough_ball_300g", base["dough_ball_300g"], "pcs"),
                    ("tomato_sauce", base["tomato_sauce"], "ml"),
                    ("cheese", base["cheese"], "g"),
                    ("salami_slice", 8 if size == "26cm" else 10 if size == "30cm" else 12, "pcs"),
                ],
            )

            seed_product(
                "Tonno",
                size,
                [
                    ("dough_ball_300g", 1, "pcs"),
                    ("tomato_sauce", base["tomato_sauce"], "ml"),
                    ("cheese", base["cheese"], "g"),
                    ("tuna", 60 if size == "26cm" else 75 if size == "30cm" else 90, "g"),
                    ("onion", 25 if size == "26cm" else 35 if size == "30cm" else 45, "g"),
                ],
            )

            seed_product(
                "Boston",
                size,
                [
                    ("dough_ball_300g", 1, "pcs"),
                    ("tomato_sauce", base["tomato_sauce"], "ml"),
                    ("cheese", base["cheese"], "g"),
                ],
            )

            seed_product(
                "Hawaii",
                size,
                [
                    ("dough_ball_300g", 1, "pcs"),
                    ("tomato_sauce", base["tomato_sauce"], "ml"),
                    ("cheese", base["cheese"], "g"),
                ],
            )

            seed_product(
                "Veggie",
                size,
                [
                    ("dough_ball_300g", 1, "pcs"),
                    ("tomato_sauce", base["tomato_sauce"], "ml"),
                    ("cheese", base["cheese"], "g"),
                ],
            )

        # Pizzabrötchen
        seed_product(
            "Pizzabrötchen mit Sucuk",
            None,
            [
                ("dough_ball_300g", 1, "pcs"),
                ("tomato_sauce", 20, "ml"),
                ("sucuk", 60, "g"),
            ],
        )
        seed_product(
            "Pizzabrötchen mit Thunfisch",
            None,
            [
                ("dough_ball_300g", 1, "pcs"),
                ("tomato_sauce", 20, "ml"),
                ("tuna", 30, "g"),
                ("onion", 15, "g"),
            ],
        )
        seed_product(
            "Pizzabrötchen mit Salami",
            None,
            [
                ("dough_ball_300g", 1, "pcs"),
                ("tomato_sauce", 20, "ml"),
                ("salami_slice", 4, "pcs"),
            ],
        )
        seed_product(
            "Pizzabrötchen mit Käse",
            None,
            [
                ("dough_ball_300g", 1, "pcs"),
                ("tomato_sauce", 20, "ml"),
                ("cheese", 50, "g"),
            ],
        )

        # Drinks
        seed_product("Cola 0.5L", None, [("cola_500ml", 1, "bottle")])
        seed_product("Cola 0.33L", None, [("cola_500ml", 0.66, "bottle")])
        seed_product("Fanta 0.5L", None, [("cola_500ml", 1, "bottle")])   # replace with own soda code later
        seed_product("Water 0.5L", None, [("cola_500ml", 1, "bottle")])   # replace with own water code later
        seed_product("Ayran", None, [("cola_500ml", 1, "bottle")])         # replace with own code later

        # Modifiers / extras
        seed_modifier("extra_onion", [("onion", 50, "g")])
        seed_modifier("extra_cheese", [("cheese", 50, "g")])
        seed_modifier("extra_salami", [("salami_slice", 4, "pcs")])
        seed_modifier("extra_tuna", [("tuna", 30, "g")])

        print("Demo recipes seeded.", flush=True)

    conn.commit()
    cur.close()
    conn.close()

if __name__ == "__main__":
    init()
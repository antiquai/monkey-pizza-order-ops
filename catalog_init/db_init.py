from __future__ import annotations

import json
import os
import time
from typing import Any

import psycopg2
from psycopg2.extensions import cursor as Cursor

# IMPORTANT TO MANU, REFRACT 

# Database connection
def _db_connect() -> psycopg2.extensions.connection:
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "db"),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
    )


def _wait_for_db(retries: int = 30, delay: float = 1.0) -> None:
    print("Waiting for database…", flush=True)
    for attempt in range(retries):
        try:
            _db_connect().close()
            print("Database is ready.", flush=True)
            return
        except psycopg2.OperationalError:
            time.sleep(delay)
    raise RuntimeError(f"Could not connect to the database after {retries} attempts.")



# helpers

_DDL = """
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS catalog (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255)     NOT NULL,
    category    VARCHAR(100)     NOT NULL,
    base_price  NUMERIC(10, 2)   DEFAULT NULL,
    ingredients JSONB            DEFAULT NULL,
    image       VARCHAR(255)     DEFAULT 'pizza.gif',
    sizes       JSONB            DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS shifts (
    id             SERIAL PRIMARY KEY,
    name           VARCHAR(100) NOT NULL,
    opened_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    closed_at      TIMESTAMPTZ    DEFAULT NULL,
    total_duration INTERVAL     GENERATED ALWAYS AS (closed_at - opened_at) STORED
);

CREATE TABLE IF NOT EXISTS personal (
    id    SERIAL PRIMARY KEY,
    name  VARCHAR(100) NOT NULL,
    color VARCHAR(20)  DEFAULT '#22c55e',
    role  VARCHAR(50)  NOT NULL DEFAULT 'delivery_staff',
    code  VARCHAR(50)  UNIQUE
);

CREATE TABLE IF NOT EXISTS timetable (
    id         SERIAL PRIMARY KEY,
    week_start DATE         NOT NULL,
    week_end   DATE         NOT NULL,
    day        VARCHAR(10)  NOT NULL,
    time_slot  VARCHAR(10)  NOT NULL,
    staff_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ    DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS timetable_weeks (
    id         SERIAL PRIMARY KEY,
    week_start DATE      NOT NULL UNIQUE,
    week_end   DATE      NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pizza_orders (
    id               UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    kitchen_id       VARCHAR(50),
    customer         VARCHAR(255),
    address          VARCHAR(255),
    type_of_delivery VARCHAR(50),
    items            JSONB,
    total_price      NUMERIC(10, 2),
    shift_name       VARCHAR(100) DEFAULT NULL,
    shift_id         INT REFERENCES shifts(id) DEFAULT NULL,
    is_preorder      BOOLEAN NOT NULL DEFAULT FALSE,
    preorder_date    VARCHAR(20),
    preorder_time    VARCHAR(20),
    status           VARCHAR(50)  NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'in_oven', 'awaiting for delivery', 'in delivery', 'done', 'cancelled')),
    inventory_status VARCHAR(50)  NOT NULL DEFAULT 'pending'
        CHECK (inventory_status IN ('pending', 'deducted', 'blocked', 'error')),
    inventory_note   TEXT,
    created_at       TIMESTAMPTZ    DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ingredients (
    code          VARCHAR(100)   PRIMARY KEY,
    name          VARCHAR(255)   NOT NULL,
    unit          VARCHAR(20)    NOT NULL,
    category      VARCHAR(100)   NOT NULL,
    current_stock NUMERIC(12, 2) NOT NULL DEFAULT 0,
    reorder_level NUMERIC(12, 2) NOT NULL DEFAULT 0,
    is_modifier   BOOLEAN        NOT NULL DEFAULT FALSE,
    price_modifier NUMERIC(10,2) NOT NULL DEFAULT 0,
    qty_modifier   NUMERIC(10,2) NOT NULL DEFAULT 0,
    active        BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ      DEFAULT NOW(),
    updated_at    TIMESTAMPTZ      DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_movements (
    id               BIGSERIAL PRIMARY KEY,
    ingredient_code  VARCHAR(100)   NOT NULL REFERENCES ingredients(code),
    delta            NUMERIC(12, 3) NOT NULL,
    reason           VARCHAR(100)   NOT NULL,
    ref_type         VARCHAR(50),
    ref_id           VARCHAR(100),
    note             TEXT,
    created_at       TIMESTAMPTZ      DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prep_batches (
    id         BIGSERIAL        PRIMARY KEY,
    batch_code VARCHAR(100)     NOT NULL UNIQUE,
    batch_type VARCHAR(50)      NOT NULL DEFAULT 'dough',
    notes      TEXT,
    created_at TIMESTAMPTZ        DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prep_batch_inputs (
    id               BIGSERIAL      PRIMARY KEY,
    batch_id         BIGINT         NOT NULL REFERENCES prep_batches(id) ON DELETE CASCADE,
    ingredient_code  VARCHAR(100)   NOT NULL REFERENCES ingredients(code),
    quantity         NUMERIC(12, 3) NOT NULL,
    unit             VARCHAR(20)    NOT NULL
);

CREATE TABLE IF NOT EXISTS prep_batch_outputs (
    id               BIGSERIAL      PRIMARY KEY,
    batch_id         BIGINT         NOT NULL REFERENCES prep_batches(id) ON DELETE CASCADE,
    ingredient_code  VARCHAR(100)   NOT NULL REFERENCES ingredients(code),
    quantity         NUMERIC(12, 3) NOT NULL,
    unit             VARCHAR(20)    NOT NULL
);

CREATE TABLE IF NOT EXISTS recipes (
    id            BIGSERIAL         PRIMARY KEY,
    source_key    VARCHAR(200)      NOT NULL UNIQUE,
    recipe_type   VARCHAR(20)       NOT NULL CHECK (recipe_type IN ('product', 'modifier')),
    product_name  VARCHAR(255),
    size_key      VARCHAR(50),
    modifier_code VARCHAR(100),
    active        BOOLEAN           NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ        DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipe_items (
    id               BIGSERIAL      PRIMARY KEY,
    recipe_id        BIGINT         NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_code  VARCHAR(100)   NOT NULL REFERENCES ingredients(code),
    quantity         NUMERIC(12, 3) NOT NULL,
    unit             VARCHAR(20)    NOT NULL
);

CREATE TABLE IF NOT EXISTS supply (
    id              BIGSERIAL   PRIMARY KEY,
    delivered_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    supplier        VARCHAR(255),
    price           NUMERIC(10, 2),
    note            TEXT,
    created_by      VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS supply_items (
    id              BIGSERIAL      PRIMARY KEY,
    supply_id       BIGINT         NOT NULL REFERENCES supply(id) ON DELETE CASCADE,
    ingredient_code VARCHAR(100)   NOT NULL REFERENCES ingredients(code),
    quantity        NUMERIC(12, 3) NOT NULL,
    unit            VARCHAR(20)    NOT NULL,
    price_per_unit  NUMERIC(10, 2) NOT NULL
);
"""


def _apply_ddl(cur: Cursor) -> None:
    cur.execute(_DDL)
    print("DDL applied (all tables ensured).", flush=True)


# Inventory helpers

def _upsert_ingredient(cur: Cursor, code: str, name: str, unit: str, category: str , is_modifier: bool | None = None, price_modifier: float | None = None, qty_modifier: float | None = None, reorder_level: float = 0.0) -> None:
    cur.execute(
        """
        INSERT INTO ingredients (code, name, unit, category, is_modifier, price_modifier, qty_modifier, reorder_level)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (code) DO UPDATE SET
            name = EXCLUDED.name,
            unit = EXCLUDED.unit,
            category = EXCLUDED.category,
            is_modifier = EXCLUDED.is_modifier,
            price_modifier = EXCLUDED.price_modifier,
            qty_modifier = EXCLUDED.qty_modifier,
            reorder_level  = EXCLUDED.reorder_level
        """,
        (code, name, unit, category, is_modifier, price_modifier, qty_modifier, reorder_level),
    )


def _add_movement(
    cur: Cursor,
    ingredient_code: str,
    delta: float,
    reason: str,
    ref_type: str | None = None,
    ref_id: str | None = None,
    note: str | None = None,
) -> None:
    cur.execute(
        """
        INSERT INTO inventory_movements
            (ingredient_code, delta, reason, ref_type, ref_id, note)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (ingredient_code, delta, reason, ref_type, ref_id, note),
    )
    cur.execute(
        "UPDATE ingredients SET current_stock = current_stock + %s WHERE code = %s",
        (delta, ingredient_code),
    )



# Recipe helpers
def _create_recipe(
    cur: Cursor,
    source_key: str,
    recipe_type: str,
    product_name: str | None = None,
    size_key: str | None = None,
    modifier_code: str | None = None,
) -> int | None:
    cur.execute(
        """
        INSERT INTO recipes (source_key, recipe_type, product_name, size_key, modifier_code)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (source_key) DO NOTHING
        RETURNING id
        """,
        (source_key, recipe_type, product_name, size_key, modifier_code),
    )
    row = cur.fetchone()
    return row[0] if row else None


def _add_recipe_item(
    cur: Cursor, recipe_id: int, ingredient_code: str, quantity: float, unit: str
) -> None:
    cur.execute(
        """
        INSERT INTO recipe_items (recipe_id, ingredient_code, quantity, unit)
        VALUES (%s, %s, %s, %s)
        """,
        (recipe_id, ingredient_code, quantity, unit),
    )


def _resolve_recipe_items(
    size_data: dict[str, Any], packs: dict[str, list]
) -> list[tuple[str, float, str]]:
    items: list[tuple[str, float, str]] = []

    for pack_name in size_data.get("packs", []):
        for entry in packs.get(pack_name, []):
            items.append((entry["ingredient"], entry["qty"], entry["unit"]))

    for entry in size_data.get("ingredients", []):
        items.append((entry["ingredient"], entry["qty"], entry["unit"]))

    return items



# Seed functions  (each is idempotent – guarded by a COUNT(*) check)
def _seed_catalog(cur: Cursor, items: list[dict]) -> None:
    cur.execute("SELECT COUNT(*) FROM catalog;")
    if cur.fetchone()[0] > 0:
        print("catalog: already populated, skipping.", flush=True)
        return

    for item in items:
        cur.execute(
            """
            INSERT INTO catalog (name, category, base_price, ingredients, sizes)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                item["name"],
                item["category"],
                item.get("price"),
                json.dumps(item["ingredients"]) if item.get("ingredients") else None,
                json.dumps(item["sizes"]) if item.get("sizes") else None,
            ),
        )
    print(f"catalog: {len(items)} items inserted.", flush=True)


def _seed_personal(cur: Cursor, staff: list[dict]) -> None:
    cur.execute("SELECT COUNT(*) FROM personal;")
    if cur.fetchone()[0] > 0:
        print("personal: already populated, skipping.", flush=True)
        return

    for person in staff:
        cur.execute(
            "INSERT INTO personal (name, color, role, code) VALUES (%s, %s, %s, %s)",
            (person["name"], person["color"], person["role"], person["code"]),
        )
    print(f"personal: {len(staff)} staff members inserted.", flush=True)


def _seed_ingredients(cur: Cursor, ingredients: list[dict]) -> None:
    cur.execute("SELECT COUNT(*) FROM ingredients;")
    if cur.fetchone()[0] > 0:
        print("ingredients: already populated, skipping.", flush=True)
        return

    for ing in ingredients:
        _upsert_ingredient(cur, ing["code"], ing["name"], ing["unit"], ing.get("category"), ing.get("is_modifier", False), ing.get("price_modifier", 1.0), ing.get("qty_modifier", 0.0), ing.get("reorder_level", 0.0))
    print(f"ingredients: {len(ingredients)} rows inserted.", flush=True)


def _seed_recipes(
    cur: Cursor,
    items: list[dict],
    packs: dict[str, list],
    ingredients: list[dict],
) -> None:
    cur.execute("SELECT COUNT(*) FROM recipes;")
    if cur.fetchone()[0] > 0:
        print("recipes: already populated, skipping.", flush=True)
        return

    recipe_count = 0

    #Products
    for product in items:
        if "sizes" in product:
            # Multi-size product (e.g. Pizza)
            for size_name, size_data in product["sizes"].items():
                source_key = f"product:{product['name']}:{size_name}"
                recipe_id = _create_recipe(
                    cur, source_key, "product",
                    product_name=product["name"], size_key=size_name,
                )
                if recipe_id is None:
                    continue
                for ingredient, qty, unit in _resolve_recipe_items(size_data, packs):
                    _add_recipe_item(cur, recipe_id, ingredient, qty, unit)
                recipe_count += 1
        else:
            # Single-size product
            source_key = f"product:{product['name']}"
            recipe_id = _create_recipe(
                cur, source_key, "product", product_name=product["name"]
            )
            if recipe_id is None:
                continue
            for entry in product.get("ingredients", []):
                _add_recipe_item(cur, recipe_id, entry["ingredient"], entry["qty"], entry["unit"])
            recipe_count += 1

    #Modifiers
    for ing in ingredients:
        if not ing.get("is_modifier", False):
            continue
        modifier_qty = ing.get("qty_modifier", 0.0)
        if not modifier_qty or modifier_qty <= 0:
            continue

        source_key = f"modifier:{ing['code']}"
        recipe_id = _create_recipe(
            cur, source_key, "modifier", modifier_code=ing["code"]
        )
        if recipe_id is None:
            continue
        _add_recipe_item(cur, recipe_id, ing["code"], float(modifier_qty), ing["unit"])
        recipe_count += 1

    print(f"recipes: {recipe_count} recipes generated.", flush=True)


def _seed_opening_stock(cur: Cursor) -> None:
    cur.execute("SELECT COUNT(*) FROM inventory_movements;")
    if cur.fetchone()[0] > 0:
        print("inventory_movements: already populated, skipping.", flush=True)
        return

    # Opening stock entries 
    opening_stock: list[tuple[str, float, str]] = [
        ("dough_ball",    150,    "50 pre-made dough balls"),
        ("tomato_sauce",  10000,  "10 L tomato sauce"),
        ("holland_sauce", 5000,  "5 L holland sauce"),
        ("cheese",        10500, "10,5 kg cheese"),
        ("tuna",          5000,  "5 kg tuna"),
        ("onion",         7000,  "7 kg onion"),
        ("salami",        250,   "250 slices salami"),
        ("ham",           200,   "200 slices ham"),
        ("broccoli",      4500,  "4,5 kg broccoli"),
        ("sucuk",         2000,  "2 kg sucuk"),
        ("cola_03",       48,    "4 packs × 12 bottles"),
        ("monster_05",    24,    "24 cans"),
        ("aioli_dip",     20,    "20 aioli dip portions"),
        ("ketchup_dip",   20,    "20 ketchup dip portions"),
    ]

    for code, delta, note in opening_stock:
        _add_movement(cur, code, delta, "INITIAL_INVENTORY", note=note)

    print(f"inventory_movements: opening stock for {len(opening_stock)} ingredients recorded.", flush=True)



#Entry point
def init() -> None:
    _wait_for_db()

    with open("menu.json", encoding="utf-8") as f:
        menu: dict = json.load(f)

    with open("personal.json", encoding="utf-8") as f:
        staff: list[dict] = json.load(f)

    conn = _db_connect()
    try:
        cur = conn.cursor()
        
        _apply_ddl(cur)
        
        _seed_catalog(cur, menu["items"])
        _seed_personal(cur, staff)

        _seed_ingredients(cur, menu["ingredients"])

        _seed_recipes(cur, menu["items"], menu["packs"], menu["ingredients"])

        _seed_opening_stock(cur)

        conn.commit()
        print("Initialisation complete.", flush=True)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    init()
    
# CREATE TABLE fiscal_transactions (
#     id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
#     order_id            UUID NOT NULL REFERENCES pizza_orders(id),
#     tse_transaction_id  TEXT,
#     tse_serial_number   TEXT,
#     signature           TEXT,
#     signature_counter   BIGINT,
#     timestamp_start     TIMESTAMPTZ,
#     timestamp_end       TIMESTAMPTZ,
#     raw_response        JSONB,
#     status              VARCHAR(50)
#         CHECK(status IN ('pending','completed','failed')),
#     created_at          TIMESTAMPTZ DEFAULT NOW()
# );
import json
import os
import re

import psycopg2
from redis import Redis
from psycopg2.extras import Json


# ─────────────────────────────────────────────────────────────────────────────
# DB / Redis
# ─────────────────────────────────────────────────────────────────────────────

def db_connect():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "db"),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
    )


redis_h = os.getenv("REDIS_HOST", "localhost")
redis_p = os.getenv("REDIS_PORT", "6379")
r = Redis(host=redis_h, port=int(redis_p), decode_responses=True)


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", text.lower().strip()).strip("_")


def normalize_size(size):
    if size is None:
        return None
    return str(size).strip()


def recipe_key_for_product(name: str, size: str | None):
    size = normalize_size(size)
    if size:
        return f"product:{name}:{size}"
    return f"product:{name}"


def recipe_key_for_modifier(mod_name: str):
    return f"modifier:{slugify(mod_name)}"


def database_operator(order_data):
    """
    Saves the order first, then we do inventory deduction in a second step.
    That way the order never disappears even if inventory is blocked.
    """
    conn = db_connect()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO pizza_orders (
            kitchen_id, customer, address, type_of_delivery,
            items, total_price, shift_name, inventory_status
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, 'pending')
        RETURNING id
    """, (
        order_data.get("order_id"),
        order_data.get("customer"),
        order_data.get("address"),
        order_data.get("type_of_delivery"),
        Json(order_data.get("items")),
        order_data.get("total_price"),
        order_data.get("shift_name"),
    ))

    db_order_id = cursor.fetchone()[0]
    conn.commit()
    cursor.close()
    conn.close()

    print(f"Order {db_order_id} saved to database", flush=True)
    return db_order_id


def load_recipe_items(cur, source_key: str):
    cur.execute("""
        SELECT r.id
        FROM recipes r
        WHERE r.source_key = %s AND r.active = TRUE
        LIMIT 1
    """, (source_key,))
    recipe_row = cur.fetchone()
    if not recipe_row:
        return None, []

    recipe_id = recipe_row[0]
    cur.execute("""
        SELECT ingredient_code, quantity, unit
        FROM recipe_items
        WHERE recipe_id = %s
    """, (recipe_id,))
    return recipe_id, cur.fetchall()


def build_required_ingredients(cur, order_items):
    """
    Turns order items into a single ingredient map:
    {
        'tomato_sauce': Decimal('70'),
        'cheese': Decimal('250'),
        ...
    }
    """
    totals = {}

    for item in order_items:
        qty = int(item.get("q", 1))
        name = item.get("name")
        size = item.get("size")
        modifiers = item.get("modifiers") or []

        # Base product
        product_key = recipe_key_for_product(name, size)
        _, recipe_items = load_recipe_items(cur, product_key)

        if not recipe_items:
            raise ValueError(f"Recipe not found for product: {product_key}")

        for ingredient_code, amount, unit in recipe_items:
            totals[ingredient_code] = totals.get(ingredient_code, 0) + (amount * qty)

        # Modifiers / extras
        for mod in modifiers:
            mod_count = int(mod.get("count", 1) or 1)
            if mod_count <= 0:
                continue

            mod_key = recipe_key_for_modifier(mod.get("name", ""))
            _, mod_recipe_items = load_recipe_items(cur, mod_key)
            if not mod_recipe_items:
                continue  # harmless if modifier is only price/UI, no inventory effect

            for ingredient_code, amount, unit in mod_recipe_items:
                totals[ingredient_code] = totals.get(ingredient_code, 0) + (amount * qty * mod_count)

    return totals


def check_stock(cur, required_totals):
    """
    Returns a list of missing items if stock is insufficient.
    """
    missing = []

    for ingredient_code, required_qty in required_totals.items():
        cur.execute("""
            SELECT name, unit, current_stock
            FROM ingredients
            WHERE code = %s
            FOR UPDATE
        """, (ingredient_code,))
        row = cur.fetchone()

        if not row:
            missing.append((ingredient_code, required_qty, 0, "ingredient not found"))
            continue

        name, unit, current_stock = row
        if current_stock < required_qty:
            missing.append((ingredient_code, required_qty, current_stock, f"{name} insufficient"))

    return missing


def apply_inventory_deduction(cur, required_totals, order_db_id: str):
    for ingredient_code, required_qty in required_totals.items():
        cur.execute("""
            INSERT INTO inventory_movements (
                ingredient_code, delta, reason, ref_type, ref_id, note
            )
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            ingredient_code,
            -required_qty,
            "ORDER",
            "pizza_order",
            str(order_db_id),
            "auto deduction from order",
        ))

        cur.execute("""
            UPDATE ingredients
            SET current_stock = current_stock - %s,
                updated_at = NOW()
            WHERE code = %s
        """, (required_qty, ingredient_code))


def set_order_inventory_status(order_db_id, status, note=None):
    conn = db_connect()
    cur = conn.cursor()
    cur.execute("""
        UPDATE pizza_orders
        SET inventory_status = %s,
            inventory_note = %s
        WHERE id = %s
    """, (status, note, order_db_id))
    conn.commit()
    cur.close()
    conn.close()


print("--- WORKER DB SETUP AND READY FOR TASKS ---", flush=True)


while True:
    task = r.blpop("handle_order", timeout=0)
    if not task:
        continue

    try:
        order = json.loads(task[1])
        print(f"Processing order: {order}", flush=True)

        # 1) save order to pizza_orders
        db_order_id = database_operator(order)

        # 2) calculate inventory needs
        conn = db_connect()
        cur = conn.cursor()

        try:
            required_totals = build_required_ingredients(cur, order.get("items", []))
            missing = check_stock(cur, required_totals)

            if missing:
                conn.rollback()
                set_order_inventory_status(
                    db_order_id,
                    "blocked",
                    note=json.dumps([
                        {
                            "ingredient": x[0],
                            "required": str(x[1]),
                            "available": str(x[2]),
                            "reason": x[3],
                        }
                        for x in missing
                    ])
                )
                print(f"Inventory blocked for order {db_order_id}: {missing}", flush=True)
            else:
                apply_inventory_deduction(cur, required_totals, db_order_id)
                conn.commit()
                set_order_inventory_status(db_order_id, "deducted", note="inventory deducted successfully")
                print(f"Inventory deducted for order {db_order_id}", flush=True)

        except Exception as inventory_error:
            conn.rollback()
            set_order_inventory_status(db_order_id, "error", note=str(inventory_error))
            print(f"Inventory error for order {db_order_id}: {inventory_error}", flush=True)

        finally:
            cur.close()
            conn.close()

        # 3) keep your existing print flow
        r.lpush("print_order", json.dumps({"order_id": db_order_id}))

    except json.JSONDecodeError:
        print(f"Error: received invalid JSON: {task[1]}", flush=True)
    except Exception as e:
        print(f"Worker error: {e}", flush=True)
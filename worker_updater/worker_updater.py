import requests
import os
import json

import psycopg2

from redis import Redis

from datetime import datetime

# Setting Redis
redis_h = os.getenv("REDIS_HOST", "localhost")
redis_p = os.getenv("REDIS_PORT", "6379")

r = Redis(host=redis_h, port=int(redis_p), decode_responses=True)

# Setting Postgres 
def db_connect():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "db"),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD")
    )
# Helps functions 
def database_updater_non_delivery(order_id, shift):
    conn = db_connect()
    cursor = conn.cursor()
    
    formated = f'order_{order_id}'
    
    cursor.execute("UPDATE pizza_orders SET status = 'done' WHERE kitchen_id = %s AND shift_name = %s", (formated, shift,))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print(f"Order {order_id} marked as done in database", flush=True)
    
def database_updater_delivery(order_id, shift):
    conn = db_connect()
    cursor = conn.cursor()
    
    formated = f'order_{order_id}'
    
    cursor.execute("UPDATE pizza_orders SET status = 'in delivery' WHERE kitchen_id = %s AND shift_name = %s", (formated, shift,))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print(f"Order {order_id} marked as in delivery in database", flush=True)
    
def cancel_order(order_id, shift):
    conn = db_connect()
    cursor = conn.cursor()
    
    formated = f'order_{order_id}'
    
    cursor.execute("UPDATE pizza_orders SET status = 'cancelled' WHERE kitchen_id = %s AND shift_name = %s", (formated, shift,))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print(f"Order {order_id} marked as cancelled in database", flush=True)
    
while True:
    
    task = r.brpop("update_status")
    
    if task:  
        data = json.loads(task[1])
        order_id = str(data.get("order_id"))
        type_of_delivery = data.get("type_of_delivery")
        shift_name = data.get("shift_name")
        status = data.get("status")
        print(f"Received update for order {order_id} with type of delivery {type_of_delivery}", flush=True)

        if status == "cancelled":
            try:
                cancel_order(order_id, shift_name)
            except Exception as e:
                print(f"Error occurred while cancelling order {order_id}: {e}", flush=True)
        elif type_of_delivery == "Lieferservice":
            try:
                database_updater_delivery(order_id, shift_name)
            except Exception as e:
                print(f"Error occurred while updating order {order_id}: {e}", flush=True)
        else:
            try:
                database_updater_non_delivery(order_id, shift_name)
            except Exception as e:
                print(f"Error occurred while updating order {order_id}: {e}", flush=True)

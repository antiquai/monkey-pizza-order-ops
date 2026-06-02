import json
import os

from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder

from redis import Redis

from pydantic import BaseModel

from socket_manager import sio, sio_app

import psycopg2

from datetime import datetime

r_h = str(os.getenv("REDIS_HOST", "redis"))
r_p = int(os.getenv("REDIS_PORT", "6379"))

r = Redis(host=r_h, port=r_p, decode_responses=True)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001","http://localhost:3002", "http://192.168.2.35:3000", "http://192.168.2.35:3001", "http://192.168.2.35:3002"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Common function 

def db_connect():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "db"),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD")
    )

def get_shift_name() -> str:
    hour = datetime.now().hour
    if 6 <= hour < 14:
        return f"{datetime.now().date()}_morning"
    elif 14 <= hour < 22:
        return f"{datetime.now().date()}_afternoon"
    else:
        return f"{datetime.now().date()}_evening"

def get_shift_from_db() -> str:
    conn = db_connect()
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM shifts WHERE closed_at IS NULL LIMIT 1")
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    return row[0] if row else None

# Time Table 

# TimeTable placeholder
class TimetableEntry(BaseModel):
    week_start: str
    week_end: str
    day: str
    time_slot: str
    staff_name: str

# From to
class TimetableCreate(BaseModel):
    week_start: str
    week_end: str

# Stuff 
class StaffMember(BaseModel):
    name: str
    color: str = "#22c55e"
    
# Order of Items list in Order
class Modifier(BaseModel):
    name: str
    price: float
    category: str 
    count: int = 0 
    
class Items(BaseModel):
    product_id: Optional[int] = None
    name: str
    size: Optional[str] = None
    q: int
    base_price: float
    modifiers: Optional[List[Modifier]] = [] 
    
    @property
    def total_item_price(self) -> float:
        modifier_price = sum(m.price * m.count for m in self.modifiers) if self.modifiers else 0
        return (self.base_price + modifier_price) * self.q


# Model of Order
class Order(BaseModel):
    customer: Optional[str] = None
    address: Optional[str] = None
    type_of_delivery: str
    items: list[Items]
    total_price: float
    
# Model of status
class Status(BaseModel):
    order_id: int

class StatusUpdate(BaseModel):
    order_id: int
    type_of_delivery: str

# Basic route to check if API and Socket are running
@app.get("/")
async def status():
    return {"status": "ok", "message": "API and Socket are running"}

# Shifts routes 
# OPEN SHIFT
@app.post("/shift/open")
def open_shift():
    conn = db_connect()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM shifts WHERE closed_at IS NULL")
    if cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="A shift is already open.")
        
    shift_name = get_shift_name()
    cursor.execute("""INSERT INTO shifts (name, opened_at) VALUES (%s, CURRENT_TIMESTAMP) RETURNING id, name, opened_at""", (shift_name,))
    row = cursor.fetchone() 
    conn.commit()
    cursor.close()
    conn.close()
    
    return {"id": row[0], "name": row[1], "opened_at": row[2].isoformat()}

# CLOSE SHIFT
@app.post("/shift/close")
def close_shift():
    conn = db_connect()
    cursor = conn.cursor()
    
    cursor.execute("""UPDATE shifts SET closed_at = CURRENT_TIMESTAMP WHERE closed_at IS NULL RETURNING id, name, opened_at, closed_at""")
    
    row = cursor.fetchone()
    if not row:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="No open shift to close.")
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return {"id": row[0], "name": row[1], "opened_at": row[2].isoformat(), "closed_at": row[3].isoformat()}

# GET CURRENT SHIFT
@app.get("/shift/current")
def get_current_shift():
    conn = db_connect()
    cursor = conn.cursor()
    
    cursor.execute("""SELECT id, name, opened_at FROM shifts WHERE closed_at IS NULL ORDER BY opened_at DESC LIMIT 1""")
    
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="No open shift found.")
    return {"id": row[0], "name": row[1], "opened_at": row[2].isoformat()}
    

# Loading catalog from database
@app.get("/load_catalog")
async def load_catalog():
    try:
        conn = db_connect()
        cur = conn.cursor()
        cur.execute("""
            SELECT id, name, category, base_price, ingredients, image, sizes
            FROM catalog
            ORDER BY category, name;
        """)
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return [
            {
                "id": r[0],
                "name": r[1],
                "category": r[2],
                "base_price": float(r[3]) if r[3] is not None else None,
                "ingredients": r[4],
                "image": r[5],
                "sizes": r[6]
            }
            for r in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/get_modifiers")
async def get_modifiers():
    try:
        conn = db_connect()
        cur = conn.cursor()
        cur.execute("""
            SELECT code, name, category, price_modifier
            FROM ingredients
            WHERE active = TRUE AND is_modifier = TRUE
            ORDER BY category, name;
        """)
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return [
            {
                "code": r[0],
                "name": r[1],
                "category": r[2],
                "price": float(r[3]),
                "count": 0
            }
            for r in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Fetch all orders from database
@app.get("/get_orders")
async def get_orders():
    shift = get_shift_name()
    conn = db_connect()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT kitchen_id, customer, address, type_of_delivery, items, total_price, status
        FROM pizza_orders WHERE shift_name = %s
        ORDER BY created_at DESC
        LIMIT 200
    """, (shift,))   
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    
    
    orders = []
    if rows != None:
        for row in rows:
            kitchen_id = row[0]  
            order_id = int(kitchen_id.replace("order_", "")) if kitchen_id else 0
            orders.append({
                "order_id": order_id,
                "customer": row[1],
                "address": row[2],
                "type_of_delivery": row[3],
                "items": row[4],       
                "total_price": row[5],
                "status": row[6],
            })
    else:
        print("No orders found in the database.")
        
    return orders

@app.get("/admin_dashboard/analytics")
def get_admin_dashboard_analytics():
    try:
        conn = db_connect()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT TO_CHAR(created_at, 'Mon DD') as order_date, COUNT(*) as order_count
            FROM pizza_orders
            WHERE created_at >= CURRENT_DATE - INTERVAL '6 days'
            GROUP BY TO_CHAR(created_at, 'Mon DD'), DATE(created_at)
            ORDER BY DATE(created_at) ASC;
        """)
        
        chart_rows = cur.fetchall()
        visitor_data = [{"date": row[0], "visitors": row[1]} for row in chart_rows]
        
        # Fallback if no order data existed
        if not visitor_data:
            visitor_data = [{"date": datetime.now().strftime("%b %d"), "visitors": 0}]
            
        
        cur.execute("""
                    SELECT COALESCE(SUM(total_price), 0.0)
                    FROM pizza_orders
                    WHERE DATE(created_at) = CURRENT_DATE AND status != 'cancelled';
        """)
        today_revenue = cur.fetchone()[0]
        
        cur.execute("""
                    SELECT COUNT(DISTINCT customer)
                    FROM pizza_orders
                    WHERE DATE(CREATED_at) = CURRENT_DATE AND customer IS NOT NULL;
        """)
        new_customers = cur.fetchone()[0]
        
        cur.execute("""
            SELECT COUNT(DISTINCT customer) 
            FROM pizza_orders 
            WHERE customer IS NOT NULL;
        """)
        active_accounts = cur.fetchone()[0]
        
        cur.execute("""
            SELECT COUNT(*) 
            FROM pizza_orders 
            WHERE status = 'done';
        """)
        completed_orders = cur.fetchone()[0]
        
        cur.close()
        conn.close()
        
        # MOCK UP DATA FOR ANALYTICS
        stats = [
            {
                "label": "Total Revenue (Today)",
                "value": f"${today_revenue:,.2f}",
                "change": "+12.5%", 
                "trend": "up",
                "sub": "Live revenue stream",
                "hint": "Refreshed instantly from completed checkouts",
            },
            {
                "label": "New Customers",
                "value": f"{new_customers:,}",
                "change": "+5%",
                "trend": "up",
                "sub": "Unique buyers today",
                "hint": "Acquisition health metric",
            },
            {
                "label": "Active Accounts",
                "value": f"{active_accounts:,}",
                "change": "+1.2%",
                "trend": "up",
                "sub": "Total unique customer base",
                "hint": "Overall retention scope",
            },
            {
                "label": "Completed Orders",
                "value": f"{completed_orders:,}",
                "change": "+4.5%",
                "trend": "up",
                "sub": "Orders successfully delivered",
                "hint": "Lifetime total volume",
            },
        ]
        
        return {
            "visitorData": visitor_data,
            "stats": stats
        }
        
    except Exception as e:
        if 'conn' in locals() and conn:
            conn.close()
        raise HTTPException(status_code=500, detail=str(e))
        

# GET storage
@app.get("/storage")
def get_storage():

    conn = db_connect()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            code,
            name,
            unit,
            current_stock,
            reorder_level,
            updated_at
        FROM ingredients
        WHERE active = TRUE
        ORDER BY name ASC
    """)

    rows = cur.fetchall()

    cur.close()
    conn.close()

    return [
        {
            "code": r[0],
            "name": r[1],
            "unit": r[2],
            "quantity": float(r[3]),
            "reorder_level": float(r[4]),
            "updated_at": r[5].isoformat()
        }
        for r in rows
    ]

# GET all stuff
@app.get("/personal")
def get_personal():
    conn = db_connect()
    cur = conn.cursor()
    cur.execute("SELECT id, name, color FROM personal ORDER BY name")
    rows = cur.fetchall()
    cur.close(); conn.close()
    return [{"id": r[0], "name": r[1], "color": r[2]} for r in rows]

# POST all stuff
@app.post("/personal")
def add_personal(data: StaffMember):
    conn = db_connect()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO personal (name, color) VALUES (%s, %s) RETURNING id",
        (data.name, data.color)
    )
    new_id = cur.fetchone()[0]
    conn.commit(); cur.close(); conn.close()
    return {"id": new_id, "name": data.name, "color": data.color}

# GET timetable for week
@app.get("/timetable")
def get_timetable(week_start: str):
    conn = db_connect()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, day, time_slot, staff_name
        FROM timetable
        WHERE week_start = %s
        ORDER BY time_slot, day
    """, (week_start,))
    rows = cur.fetchall()
    cur.close(); conn.close()
    return [{"id": r[0], "day": r[1], "time_slot": r[2], "staff_name": r[3]} for r in rows]

# POST create timetable (just registers the week)
@app.post("/timetable/create")
def create_timetable(data: TimetableCreate):
    conn = db_connect()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO timetable_weeks (week_start, week_end)
        VALUES (%s, %s)
        ON CONFLICT (week_start) DO NOTHING
        RETURNING id, week_start, week_end
    """, (data.week_start, data.week_end))
    row = cur.fetchone()
    conn.commit(); cur.close(); conn.close()
    if not row:
        raise HTTPException(status_code=400, detail="Week already exists")
    return {"id": row[0], "week_start": str(row[1]), "week_end": str(row[2])}

# POST add entry to timetable
@app.post("/timetable/entry")
def add_entry(data: TimetableEntry):
    conn = db_connect()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO timetable (week_start, week_end, day, time_slot, staff_name)
        VALUES (%s, %s, %s, %s, %s) RETURNING id
    """, (data.week_start, data.week_end, data.day, data.time_slot, data.staff_name))
    new_id = cur.fetchone()[0]
    conn.commit(); cur.close(); conn.close()
    return {"id": new_id, **data.dict()}

# DELETE entry from timetable
@app.delete("/timetable/entry/{entry_id}")
def delete_entry(entry_id: int):
    conn = db_connect()
    cur = conn.cursor()
    cur.execute("DELETE FROM timetable WHERE id = %s", (entry_id,))
    conn.commit(); cur.close(); conn.close()
    return {"status": "deleted"}

# GET all weeks for timetable
@app.get("/timetable/weeks")
def get_timetable_weeks():
    conn = db_connect()
    cur = conn.cursor()
    cur.execute("""
        SELECT DISTINCT id, week_start, week_end
        FROM timetable_weeks
        ORDER BY week_start DESC
    """)
    rows = cur.fetchall()
    cur.close(); conn.close()
    return [{"id": r[0], "week_start": str(r[1]), "week_end": str(r[2])} for r in rows]

# Route to receive order from frontend 
@app.post("/checkout")
async def checkout(data: Order):
    conn = db_connect()
    cursor = conn.cursor()
    
    cursor.execute("""SELECT name FROM shifts WHERE closed_at IS NULL LIMIT 1""")
    
    shift_row = cursor.fetchone()
    
    shift_name = shift_row[0] if shift_row else None
    
    cursor.close()
    conn.close()
    
    order_id = r.incr("order_id")
    
    print(f'Order {order_id} received !', flush=True)
    
    # Refracting data into a dict
    clean_data = jsonable_encoder(data) 
    
    # Addin data to the scoket room "kitchen"
    await sio.emit("new_order_kitchen", {
        "order_id": order_id,
        **clean_data  
    }, room='kitchen')

    # Adding into Redis queue for next proccessing by Worker
    clean_data["order_id"] = f"order_{order_id}"
    clean_data["shift_name"] = shift_name
    r.lpush("handle_order", json.dumps(clean_data))

    return {"status": "Order sent to kitchen !"}

# Changing status of order and sending to the packstation for next step (oven, packing, delivery etc.)
@app.post("/order_in_oven")
async def order_in_oven(data: Status):
    order_id = data.order_id
    
    print(f'Order {order_id} sent to the oven !', flush=True)
    await sio.emit("order_sent_to_oven", {"order_id": order_id}, room='kitchen')
    return {"status": f"Order {order_id} marked as sent to the oven !"}

# When order is packed, send to delivery and update status in database
@app.post("/order_packed")
async def order_packed(data: StatusUpdate):
    shift_name = get_shift_from_db()
    order_id = data.order_id
    type_of_delivery = data.type_of_delivery
    
    await sio.emit('order_packed', { "order_id": order_id }, room='kitchen')

    r.lpush("update_status", json.dumps({"order_id": order_id, "type_of_delivery": type_of_delivery, "shift_name": shift_name}))

# Cancel order in emerhency case 
@app.post("/cancel_order")
async def cancel_order(data: Status):
    shift_name = get_shift_from_db()
    order_id = data.order_id
    
    print(f'Order {order_id} cancelled !', flush=True)
    
    await sio.emit("order_cancelled", {"order_id": order_id}, room='kitchen')
    
    r.lpush("update_status", json.dumps({"order_id": order_id, "status": "cancelled", "shift_name": shift_name}))
    return {"status": f"Order {order_id} marked as cancelled !"}


app.mount("/socket.io", sio_app)





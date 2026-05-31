import socketio
from starlette.config import environ

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins=["http://localhost:3000", "http://localhost:3001","http://localhost:3002","http://192.168.2.35:3000", "http://192.168.2.35:3001", "http://192.168.2.35:3002"])

sio_app = socketio.ASGIApp(sio)

@sio.event
async def connect(sid, environ):
    print(f"🌊 Client Connected: {sid}")


@sio.event
async def disconnect(sid):
    print(f"❄️ Client Disconnected: {sid}")

@sio.event
async def join_room(sid, data):
    room = data.get("room")
    await sio.enter_room(sid, room)
    print(f"Client {sid} joined room: {room}")
    
@sio.on("all_fully_done")
async def handle_all_done(sid, data):
    order_id = data.get("order_id")
    print(f"Order {order_id} is fully completed by Packstation", flush=True)
    
    await sio.emit("all_fully_done", {"order_id": order_id}, room="kitchen")
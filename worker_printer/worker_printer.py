import os
import json


from redis import Redis

redis_h = os.getenv("REDIS_HOST", "localhost")
redis_p = os.getenv("REDIS_PORT", "6379")

r = Redis(host=redis_h, port=int(redis_p), decode_responses=True)

print("---WORKER PRINTER SETTED UP AND READY FOR TASK---", flush=True)

while True:
    task = r.blpop('print_order', timeout=0)
    if task:
         order_id = json.loads(task[1])
         
         print(f"Received order ID for printing: {order_id.get('order_id')}", flush=True)
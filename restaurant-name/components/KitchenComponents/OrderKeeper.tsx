'use client'

import { useEffect, useState } from "react";
import {io, Socket} from "socket.io-client";
import ReceiptComponent from "./ReciepComponent";
import { toast } from "sonner";
import { AlertComponent } from "./BricksComponent/AlertComponents/AlertComponent";
import { DectructiveAlertComponent } from "./BricksComponent/AlertComponents/DesctructiveAlertComponent";


export interface OrderModifier {
  name: string;
  price: number;
  category: 'topping' | 'dip' | 'drink';
  count? : number | null;
}

export interface OrderItem {
    name: string;
    q: number;
    base_price: number;
    modifiers?: OrderModifier[];
    size?: string | null;
}

export interface Order {
    order_id : number;
    customer: string;
    address: string; 
    type_of_delivery: string;
    items: OrderItem[];
    total_price: number;
    status?: string;
}

const SOCKET_URL = "http://192.168.2.32:8000";
const GATEWAY_URL = "http://192.168.2.32:8000";
let socket: Socket;

export default function OrderKeeper() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isConn, setIsConn] = useState(false);

    // AFTER CLICKING DONE, SEND API REQUEST TO BACKEND TO MARK ORDER AS DONE, THEN REMOVE FROM LIST 
    const handleDone = async (orderId: number) => {
        const sendData = {
            order_id: orderId,
        }

        try {
            // Send API response and json of order_id number
            const response = await fetch(`${GATEWAY_URL}/order_in_oven`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(sendData),
            })
            if (response.ok) {
                toast.custom((t) => (
                    <div className="w-full flex justify-center">
                      <AlertComponent />
                    </div>
                ))
            }
        } catch (error) {
            console.error("Error sending order done:", error);

            toast.custom((t) => (
                <div className="w-full flex justify-center">
                  <DectructiveAlertComponent />
                </div>
            ))
        } finally {
            console.log("Order marked as done: ", orderId);
        }
    }

    const handleCancel = async (orderId: number) => {
        setOrders(prev => prev.filter(o => o.order_id !== orderId));
    }

    // Fetch orders, if network drop
    useEffect(() => {
        fetch(`${GATEWAY_URL}/get_orders/kitchen`)
          .then(r => r.json())
          .then((data) => {
            console.log("API response:", data); 
            setOrders(Array.isArray(data) ? data : data.orders ?? []);
          })
          .catch(console.error)
          .finally(() => console.log("Initial orders fetched"));
      }, []);

    // Socket io connecting
    useEffect(() => {
        socket = io(SOCKET_URL, {
            transports: ["websocket"],
        })

        socket.on('connect', () => {
            setIsConn(true);
            console.log('Connected to Gateway, SID: ', socket.id);
            socket.emit('join_room', { room: "kitchen" });
        })

        socket.on('new_order_kitchen', (data: Order) => {
            console.log('New order received in kitchen: ', data);
            setOrders((prevOrders) => [ data, ...prevOrders]);
        })

        socket.on('order_packed', (data: { order_id: number }) => {
            setOrders(prev => prev.filter(o => o.order_id !== data.order_id));
        });

        socket.on('order_cancelled', (data: { order_id: number }) => {
            console.log('Order cancelled received in kitchen: ', data);
            setOrders(prev => prev.filter(o => o.order_id !== data.order_id));
        })
        
        socket.on('disconnect', () => {
            setIsConn(false);
            console.log('Disconnected from Gateway');
        })

        return () => {
            socket.off('connect');
            socket.off('new_order_kitchen');
            socket.off('order_packed');
            socket.off('order_cancelled');
            socket.off('disconnect');
            socket.disconnect();
        }
    }, [])

    return (
        <div className=" bg-zinc-50 min-h-screen min-w-screen justify-center items-center pt-4 mx-auto px-4 p-8 w-full max-w-6xl">
            <div className="flex justify-between items-center mb-10">
              <h1 className="text-4xl font-black uppercase tracking-tighter">Kitchen Dashboard</h1>
              <div className={`flex items-center gap-2 text-xs font-bold uppercase ${isConn ? 'text-green-500' : 'text-red-500'}`}>
                <span className={`w-2 h-2 rounded-full ${isConn ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                {isConn ? 'Live' : 'Offline'}
              </div>
            </div>

            {/* Orders List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
            {orders
                .sort((a, b) => a.order_id - b.order_id)
                .map((order) => (
                <ReceiptComponent key={order.order_id} order={order} onDone={() => handleDone(order.order_id)} onCancel={() => handleCancel(order.order_id)} />
            ))}
            </div>
        
            {orders.length === 0 && (
            <div className="text-center text-zinc-300 font-mono uppercase">
                Waiting for new orders...
            </div>
            )}
        </div>
        
    )
}
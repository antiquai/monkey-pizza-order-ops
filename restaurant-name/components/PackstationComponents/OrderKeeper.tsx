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
  is_preorder?: boolean;
  preorder_date?: string | null;
  preorder_time?: string | null;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SERVER_IP
const GATEWAY_URL = process.env.NEXT_PUBLIC_SERVER_IP

let socket: Socket;

export default function OrderKeeper() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isConn, setIsConn] = useState(false);

    const handleDone = async (orderId: number, typeOfDelivery: string) => {   
        setOrders((prevOrders) => prevOrders.filter((order) => order.order_id !== orderId));

        const sendData = {
            order_id: orderId,
            type_of_delivery: typeOfDelivery
        }
        
        try {
            const response = await fetch(`${GATEWAY_URL}/order_packed`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(sendData)
            })

            if (response.ok) {
                toast.custom(() => <AlertComponent />);
            }
        }
        catch (error) {
            toast.custom(() => <DectructiveAlertComponent />);
        }

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

        socket.on('order_sent_to_oven', (data: { order_id: number }) => {
            console.log('Order sent to oven received in kitchen: ', data);
            setOrders((prevOrders) => 
                prevOrders.map((order) => 
                    order.order_id === data.order_id
                    ? { ...order, status: 'in_oven' }
                    : order
                )
            )
        })

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
            socket.off('order_sent_to_oven');
            socket.off('order_cancelled');
            socket.off('disconnect');
            socket.disconnect();
        }
    }, [])

    return (
        <div className=" bg-zinc-50 min-h-screen min-w-screen justify-center items-center pt-4 mx-auto px-4 p-8 w-full max-w-6xl">
            <div className="flex justify-between items-center mb-10">
              <h1 className="text-4xl font-black uppercase tracking-tighter">Packstation Dashboard</h1>
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
                <ReceiptComponent key={order.order_id} order={order} onDone={() => handleDone(order.order_id, order.type_of_delivery)}/>
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
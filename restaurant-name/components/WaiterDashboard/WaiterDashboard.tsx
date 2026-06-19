'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect, useState } from "react";

import ReceiptComponent from './ReciepComponent';
import ReceiptComponentCancelFunction from "./ReciepComponentCancelFunction";
import { AlertComponent } from "../BricksComponent/AlertComponents/AlertComponent";

import { toast } from "sonner";

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

const GATEWAY_URL = process.env.NEXT_PUBLIC_SERVER_IP

export default function WaiterDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const handleCancel = async (orderId: number) => {
    const sendData = { 
        order_id: orderId,
        statusbar: "cancelled"
    }

    try {
      const response = await fetch(`${GATEWAY_URL}/cancel_order`, {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify(sendData)
      });

      if (response.ok) {
          toast.custom((t) => (
              <div className="w-full flex justify-center">
                <AlertComponent />
              </div>
          ))
      }
    } catch (error) {
      console.error("Error canceling order:", error);
    }
  }

  useEffect(() => {
    setLoading(true);
    fetch(`${GATEWAY_URL}/get_orders`)
      .then(r => r.json())
      .then((data) => {
        console.log("API response:", data); 
        setOrders(Array.isArray(data) ? data : data.orders ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const activeOrders    = orders.filter(o => o.status === "pending" || o.status === "in_oven");
  const deliveryOrders  = orders.filter(o => o.status === "awaiting_for_delivery");
  const archivedOrders  = orders.filter(o => o.status === "done");
  const cancelledOrders = orders.filter(o => o.status === "cancelled");
  const preorders        = orders.filter(o => o.is_preorder).sort((a, b) => {
    // date time sort
    const aKey = `${a.preorder_date}T${a.preorder_time}`;
    const bKey = `${b.preorder_date}T${b.preorder_time}`;
    return aKey.localeCompare(bKey);
  });

  if (loading) {
    return (  
      <div className="flex items-center justify-center w-full h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            Loading orders...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[97vh] flex rounded-2xl m-3 bg-white backdrop-blur-xl font-sans overflow-hidden">
      <div className="p-8 w-full max-w-6xl mx-auto overflow-y-auto">
        <h1 className="text-3xl font-black uppercase mb-8 tracking-tighter">Order Management</h1>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8 bg-zinc-100 p-1">
            <TabsTrigger value="active" className="font-bold uppercase text-xs">
              In Progress ({activeOrders.length})
            </TabsTrigger>
            <TabsTrigger value="archived" className="font-bold uppercase text-xs">
              History ({archivedOrders.length})
            </TabsTrigger>
            <TabsTrigger value="in_delivery" className="font-bold uppercase text-xs">
              In Delivery ({deliveryOrders.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="font-bold uppercase text-xs">
              Canceled ({cancelledOrders.length})
            </TabsTrigger>
            <TabsTrigger value="preorders" className="font-bold uppercase text-xs">
              Preorders ({preorders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeOrders.sort((a, b) => a.order_id - b.order_id).map(order => (
                <ReceiptComponentCancelFunction key={order.order_id} order={order} onDone={() => handleCancel(order.order_id)} />
              ))}
            </div>
            {activeOrders.length === 0 && (
              <div className="text-center py-20 text-zinc-300 font-mono">No active orders.</div>
            )}
          </TabsContent>

          <TabsContent value="archived">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {archivedOrders.sort((a, b) => b.order_id - a.order_id).map(order => (
                <ReceiptComponent key={order.order_id} order={order} />
              ))}
            </div>
            {archivedOrders.length === 0 && (
              <div className="text-center py-20 text-zinc-300 font-mono">No archived orders.</div>
            )}
          </TabsContent>

          <TabsContent value="in_delivery">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {deliveryOrders.sort((a, b) => b.order_id - a.order_id).map(order => (
                <ReceiptComponent key={order.order_id} order={order} />
              ))}
            </div>
            {deliveryOrders.length === 0 && (
              <div className="text-center py-20 text-zinc-300 font-mono">No orders in delivery.</div>
            )}
          </TabsContent>

          <TabsContent value="cancelled">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cancelledOrders.sort((a, b) => b.order_id - a.order_id).map(order => (
                <ReceiptComponent key={order.order_id} order={order} />
              ))}
            </div>
            {cancelledOrders.length === 0 && (
              <div className="text-center py-20 text-zinc-300 font-mono">No cancelled orders.</div>
            )}
          </TabsContent>

          <TabsContent value="preorders">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {preorders.map(order => (
                <ReceiptComponentCancelFunction key={order.order_id} order={order} onDone={() => handleCancel(order.order_id)} />
              ))}
            </div>
            {preorders.length === 0 && (
              <div className="text-center py-20 text-zinc-300 font-mono">No preorders.</div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Order } from "@/components/WaiterDashboard";

const SOCKET_URL = "http://192.168.2.35:8000";
const API_URL    = "http://192.168.2.35:8000";

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const socketRef = useRef<Socket | null>(null);

  // Load from DB on mount
  useEffect(() => {
    fetch(`${API_URL}/get_orders`)
      .then(r => r.json())
      .then((data: Order[]) => setOrders(data))
      .catch(console.error);
  }, []);

  // Socket for live updates
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_room", { room: "kitchen" });
    });

    socket.on("new_order_kitchen", (data: Order) => {
      setOrders(prev =>
        prev.map(o =>
          o.order_id === data.order_id
            ? { ...o, status: "pending" }
            : o
        )
      );
    });

    socket.on("order_sent_to_oven", (data: { order_id: number }) => {
      setOrders(prev =>
        prev.map(o =>
          o.order_id === data.order_id
            ? { ...o, status: "SENT TO THE OVEN" }
            : o
        )
      );
    });

    socket.on("order_packed", (data: { order_id: number }) => {
      // Don't remove — update status so it moves to the right tab
      setOrders(prev =>
        prev.map(o =>
          o.order_id === data.order_id
            ? { ...o, status: "done" }
            : o
        )
      );
    });

    return () => { socket.disconnect(); };
  }, []);

  return orders;
}
"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface StorageItem {
    id: number;
    code: string;
    name: string;
    unit: string;
    quantity: number;
    reorder_level: number;
    updated_at: string;
}

const GATEWAY_URL = "http://192.168.2.35:8000";

export default function Storage() {

    const [items, setItems] = useState<StorageItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${GATEWAY_URL}/storage`)
            .then(res => res.json())
            .then(data => setItems(data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const getStatus = (qty: number, reorder_level: number) => {
        const status_tresholds = (qty / reorder_level) * 100;
        if (status_tresholds > 100) return "OK";
        if (status_tresholds <= 100 && status_tresholds > 20) return "LOW";
        return "CRITICAL";
    };

    if (loading) {
        return(
            <div className="h-[97vh] flex items-center justify-center bg-white m-3 rounded-2xl">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
                <p className="text-sm font-medium text-zinc-500">Loading live business metrics...</p>
              </div>
            </div>
        )
    }

    return (
        <div className="relative min-h-[97vh] flex flex-col rounded-2xl m-3 bg-white font-sans overflow-hidden">
            <div className="flex-1 overflow-y-auto p-8">
                <h1 className="text-3xl font-black uppercase mb-8 tracking-tighter">Storage</h1>

                {/* Header */}
                <div className="flex items-end justify-between mb-10">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-400 font-bold mt-2">
                            Real-time ingredient inventory
                        </p>
                    </div>

                    <div className="border-2 border-black px-5 py-3 rounded-2xl">
                        <p className="text-xs uppercase font-black tracking-widest">
                            {items.length} Items
                        </p>
                    </div>
                </div>

                {/* Table */}
                <div className="border border-zinc-200 rounded-3xl overflow-hidden">
                    <div className="grid grid-cols-4 divide-x divide-zinc-200">
                        {Array.from({ length: 4 }, (_, colIndex) => {
                            const colItems = items.filter((_, i) => i % 4 === colIndex);
                            return (
                                <div key={colIndex} className="flex flex-col">
                                    {/* Column header */}
                                    <div className="bg-zinc-50 border-b border-zinc-200 px-4 py-4 text-[11px] uppercase tracking-[0.25em] font-black text-zinc-500">
                                        Ingredient
                                    </div>
                                    {/* Column items */}
                                    <div className="divide-y divide-zinc-100">
                                        {colItems.map(item => {
                                            // Add status based on quantity and pack into badge 
                                            const status = getStatus(item.quantity, item.reorder_level);
                                            return (
                                                <div
                                                    key={item.code}
                                                    className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 transition-colors gap-2"
                                                >
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-black uppercase tracking-wide text-xs truncate">
                                                            {item.name}
                                                        </span>
                                                        <span className="font-mono font-bold text-sm text-zinc-700">
                                                            {item.quantity}
                                                            <span className="text-zinc-400 font-normal text-[11px] ml-1 uppercase">
                                                                {item.unit}
                                                            </span>
                                                        </span>
                                                    </div>
                                                    <span className={`
                                                        shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest
                                                        ${status === "OK"
                                                            ? "bg-black text-white"
                                                            : status === "LOW"
                                                                ? "bg-zinc-200 text-black"
                                                                : "bg-red-500 text-white"
                                                        }
                                                    `}>
                                                        {status}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
"use client";

import { useEffect, useState } from "react";

interface StorageItem {
    id: number;
    name: string;
    unit: string;
    quantity: number;
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

    const getStatus = (qty: number) => {
        if (qty <= 0) return "EMPTY";
        if (qty < 1000) return "LOW";
        return "OK";
    };

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

                    <div className="grid grid-cols-4 bg-zinc-50 border-b border-zinc-200 px-6 py-4 text-[11px] uppercase tracking-[0.25em] font-black text-zinc-500">
                        <div>Ingredient</div>
                        <div>Quantity</div>
                        <div>Unit</div>
                        <div>Status</div>
                    </div>

                    <div className="divide-y divide-zinc-100">

                        {loading ? (
                            <div className="p-10 text-center text-zinc-400 font-bold uppercase">
                                Loading storage...
                            </div>
                        ) : items.length === 0 ? (
                            <div className="p-10 text-center text-zinc-400 font-bold uppercase">
                                Storage empty
                            </div>
                        ) : (
                            items.map(item => {

                                const status = getStatus(item.quantity);

                                return (
                                    <div
                                        key={item.id}
                                        className="grid grid-cols-4 items-center px-6 py-5 hover:bg-zinc-50 transition-colors"
                                    >

                                        {/* NAME */}
                                        <div className="font-black uppercase tracking-wide">
                                            {item.name}
                                        </div>

                                        {/* QUANTITY */}
                                        <div className="font-mono text-lg font-bold">
                                            {item.quantity}
                                        </div>

                                        {/* UNIT */}
                                        <div className="text-zinc-500 font-bold uppercase text-sm">
                                            {item.unit}
                                        </div>

                                        {/* STATUS */}
                                        <div>
                                            <span className={`
                                                px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
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
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
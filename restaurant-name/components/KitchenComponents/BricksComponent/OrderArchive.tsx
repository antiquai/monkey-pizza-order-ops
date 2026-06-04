'use client'

import { useState } from "react";
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle, 
    SheetTrigger 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Order } from "../OrderKeeper";
import { History, User, Hash } from "lucide-react";

interface Props {
    archivedOrders: Order[];
}

export function OrderArchive({ archivedOrders }: Props) {
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <Sheet>
                <SheetTrigger asChild>
                    <Button 
                        variant="outline" 
                        className="h-14 w-14 rounded-full bg-black text-white shadow-2xl hover:bg-zinc-800 border-none group"
                    >
                        <History className="w-6 h-6 group-hover:-rotate-45 transition-transform" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-100 sm:w-125 font-mono bg-zinc-50 overflow-y-auto">
                    <SheetHeader className="border-b pb-4 mb-4">
                        <SheetTitle className="text-2xl font-black uppercase italic tracking-tighter">
                            Kitchen Archive
                        </SheetTitle>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase">Last 50 orders processed</p>
                    </SheetHeader>

                    <div className="space-y-3">
                        {archivedOrders.length === 0 && (
                            <div className="py-20 text-center text-zinc-300 text-xs uppercase italic">
                                History is empty...
                            </div>
                        )}

                        {archivedOrders.map((order) => (
                            <div 
                                key={`${order.order_id}-${Math.random()}`}
                                onClick={() => setSelectedOrder(order)}
                                className={`p-4 border-2 transition-all cursor-pointer bg-white hover:border-black ${selectedOrder?.order_id === order.order_id ? 'border-black shadow-md' : 'border-zinc-100'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="text-lg font-black italic">#{order.order_id}</p>
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase">{order.method}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-blue-600">{order.total_price}$</p>
                                        <span className="text-[8px] bg-zinc-100 px-1 py-0.5 rounded uppercase font-bold">Done</span>
                                    </div>
                                </div>
                                
                                <div className="flex gap-4 text-[10px] text-zinc-500 font-bold uppercase">
                                    <div className="flex items-center gap-1"><User className="w-3 h-3"/> {order.customer.slice(0, 10)}</div>
                                    <div className="flex items-center gap-1"><Hash className="w-3 h-3"/> {order.items.length} items</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Detailed View when an order is clicked */}
                    {selectedOrder && (
                        <div className="mt-8 pt-8 border-t-4 border-black border-double">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-black italic uppercase">Details Report</h3>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(null)} className="text-[10px] uppercase font-bold">Close</Button>
                            </div>
                            
                            <div className="bg-white p-4 text-xs space-y-2 border shadow-inner">
                                {selectedOrder.items.map((item, i) => (
                                    <div key={i} className="border-b border-dotted pb-1">
                                        <div className="flex justify-between">
                                            <span className="font-bold">{item.q}x {item.name}</span>
                                        </div>
                                        {item.modifiers?.map((m, mi) => (
                                            <div key={mi} className="text-zinc-400 pl-2">+ {m.name}</div>
                                        ))}
                                    </div>
                                ))}
                                <div className="pt-2 flex justify-between font-black text-sm">
                                    <span>FINAL TOTAL</span>
                                    <span>{selectedOrder.total_price}$</span>
                                </div>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
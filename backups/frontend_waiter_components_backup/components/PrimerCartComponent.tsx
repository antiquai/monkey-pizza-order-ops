"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CartItem, Modifier } from "./Catalog"; 
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

import { AlertComponent } from "./BricksComponent/AlertComponents/AlertComponent";
import { DectructiveAlertComponent } from "./BricksComponent/AlertComponents/DesctructiveAlertComponent";

import { toast } from "sonner";

interface Props {
  items: CartItem[];
  onRemove: (id: string) => void; // Must be string to match unique ID
  onClear: () => void;
}

export default function PrimerCart({ items, onRemove, onClear }: Props) {

    const [user_name, setUserName] = useState("");
    const [address, setAddress] = useState("");
    const [method, setMethod] = useState("Lieferservice");
    const [loading, setLoading] = useState(false);

    const total = items.reduce((acc, item) => {
      const modsPrice = item.modifiers?.reduce((mAcc, m) => mAcc + (m.price * m.count), 0) || 0;
      return acc + (item.base_price + modsPrice) * item.qty;
    }, 0);

    // --- PRODUCTION SORTING ORDER ---
    const categoryPriority: Record<string, number> = {
      "extra": 1,
      "drink": 2,
      "dip": 3
    };

    const sortModifiers = (mods: Modifier[]) => {
      return [...mods].sort((a, b) => 
        (categoryPriority[a.category] || 99) - (categoryPriority[b.category] || 99)
      );
    };

    const handleCheckout = async () => {
        if (items.length === 0) return;

        setLoading(true);

        const orderData = {
          customer: user_name || " ",
          address: address || " ",
          type_of_delivery: method,
          items: items.map(item => ({
            name: item.name,
            q: item.qty,
            base_price: item.base_price,
            modifiers: item.modifiers || [],
          })),
          total_price: total,
        }

        try {
          const response = await fetch("http://192.168.48.1:8000/checkout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(orderData),
          })
          if (response.ok) {
            toast.custom((t) => (
              <div className="w-full flex justify-center">
                <AlertComponent />
              </div>
            ))
            onClear();
            setAddress("");
            setMethod("");
            console.log(orderData)
          }
        } catch (error) {
          console.error("Error placing order:", error);
          toast.custom((t) => (
              <div className="w-full flex justify-center">
                <DectructiveAlertComponent />
              </div>
            ))
          onClear();
          setAddress("");
          setMethod("");
          console.log(orderData)
        } finally {
          setLoading(false);
        }
    }

    return (
      <div className="flex flex-col h-full rounded-2xl gap-3">
        <h2 className="text-3xl font-black uppercase">Bag</h2>
        <h3 className="text-[10px] tracking-[0.3em] text-zinc-400 uppercase font-medium">
          Drag left to remove item
        </h3>

        <div className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden no-scrollbar pr-2">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.div
                key={item.cart_unique_id}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                drag="x"
                dragConstraints={{ left: -100, right: 0 }}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -50) onRemove(item.cart_unique_id);
                }}
                className="flex flex-col bg-white border-b border-zinc-100 pb-3 cursor-grab active:cursor-grabbing"
              >
                {/* Product Header Block */}
                <div className="flex justify-between items-baseline">
                  <div className="flex gap-2 items-baseline">
                    <span className="text-sm font-black uppercase">{item.name}</span>
                    {item.qty > 1 && (
                      <span className="text-[10px] text-orange-500 font-bold">x{item.qty}</span>
                    )}
                  </div>
                  <span className="text-xs font-bold">{item.base_price}$</span>
                </div>

                {/* Modifier Block - Organized for Production */}
                {item.modifiers && item.modifiers.length > 0 && (
                  <div className="mt-1 flex flex-col gap-0.5 border-l-2 border-zinc-100 ml-1 pl-3">
                    {sortModifiers(item.modifiers).map((mod, idx) => (
                      <div key={idx} className="flex justify-between text-[11px] font-bold uppercase text-zinc-500 italic">
                        <span>+ {mod.name} {mod.count > 1 ? `(x${mod.count})` : ''}</span>
                        <span className="text-zinc-400">
                          {mod.price > 0 ? `+${(mod.price * mod.count).toFixed(2)}$` : 'FREE'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-auto pt-6 space-y-4">
          <div className="border-t-4 border-black pt-2 flex justify-between items-center font-black text-2xl uppercase">
            <span>Total</span>
            <span>{total.toFixed(2)}$</span>
          </div>

          <div className="space-y-2">
             <Select value={method} onValueChange={setMethod}>
               <SelectTrigger className="w-full rounded-none border-2 border-black h-12 uppercase font-bold text-xs">
                 <SelectValue placeholder="Payment Method" />
               </SelectTrigger>
               <SelectContent>
                  <SelectItem value="Lieferservice">Lieferservice</SelectItem>
                  <SelectItem value="Zum Mitnehmen">Zum Mitnehmen</SelectItem>
                  <SelectItem value="Restaurant">Restaurant</SelectItem>
               </SelectContent>
             </Select>

             {method === "Lieferservice" && (
               <div className="space-y-2">
                  <Input 
                    placeholder="NAME, SURNAME" 
                    value={user_name} 
                    onChange={(e) => setUserName(e.target.value)}
                    className="rounded-none border-zinc-200 h-10 text-xs font-bold uppercase"
                  />
                  <Input 
                    placeholder="SHIPPING ADDRESS" 
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)}
                    className="rounded-none border-zinc-200 h-10 text-xs font-bold uppercase"
                  />
               </div>
             )}

             <Button 
               disabled={items.length === 0 || loading} 
               onClick={handleCheckout} 
               className="w-full rounded-none h-14 bg-black text-white font-black uppercase tracking-widest text-sm hover:bg-zinc-800"
             >
               {loading ? "..." : "Checkout →"}
             </Button>
          </div>
        </div>
      </div>
    );
}
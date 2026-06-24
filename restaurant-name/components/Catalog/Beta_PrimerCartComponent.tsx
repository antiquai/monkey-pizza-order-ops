"use client";

import { useState, useEffect } from "react";

import { motion, AnimatePresence } from "framer-motion";

import { CartItem, Modifier } from "./Beta_Catalog"; 
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { format, parseISO } from "date-fns"
import { Calendar as CalendarIcon, Clock, ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Address Autocomplete
import { AddressAutocomplete } from "./AutocompleteComponent";

// CustomerSearch
import { CustomerSearch, Customer } from "./CustomerSearch";
import { UserPlus, UserSearch } from "lucide-react";

// Alerts
import { AlertComponent } from "../BricksComponent/AlertComponents/AlertComponent";
import { DectructiveAlertComponent } from "../BricksComponent/AlertComponents/DesctructiveAlertComponent";


import { toast } from "sonner";

interface Props {
  items: CartItem[];
  onRemove: (id: string) => void;
  onClear: () => void;
  deliveryType: string;
  onOrderComplete: () => void;
}

// Helpers for clocks
function snapMinutes(m: number): number {
  return (Math.round(m / 5) * 5) % 60;
}

function padTwo(n: number): string {
  return String(n).padStart(2, "0");
}

const GATEWAY_URL = process.env.NEXT_PUBLIC_SERVER_IP

export default function PrimerCart({ items, onRemove, deliveryType, onOrderComplete }: Props) {
  // Customer Data
  const [user_name, setUserName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [saveCustomer, setSaveCustomer] = useState(true);
  const [customerMode, setCustomerMode] = useState<"new" | "find" | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  // Preorder Data
  const [isPreorder, setIsPreorder] = useState(false)
  const [date, setDate] = useState("")
  const [time, setTiem] = useState("")
  
  // Helps for Preorders
  const now = new Date();
  const [hour, setHour] = useState<number>(now.getHours());
  const [minute, setMinute] = useState<number>(snapMinutes(now.getMinutes()));
  
  // Loading
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isPreorder) {
      setTiem(`${padTwo(hour)}:${padTwo(minute)}`);
    } else {
      setTiem("");
    }
  }, [hour, minute, isPreorder]);

  const handleHourChange = (delta: number) => {
    setHour((prev) => (prev + delta + 24) % 24);
  };

  const handleMinuteChange = (delta: number) => {
    setMinute((prev) => {
      let next = prev + delta * 5;
      if (next < 0) next = 55;
      if (next >= 60) next = 0;
      return snapMinutes(next);
    });
  };

  const handleWheelHour = (e: React.WheelEvent) => {
    e.preventDefault();
    handleHourChange(e.deltaY > 0 ? -1 : 1);
  };

  const handleWheelMinute = (e: React.WheelEvent) => {
    e.preventDefault();
    handleMinuteChange(e.deltaY > 0 ? -1 : 1);
  };

  const total = items.reduce((acc, item) => {
    const modsPrice = item.modifiers?.reduce((mAcc, m) => mAcc + (m.price * m.count), 0) || 0;
    return acc + ((item.base_price ?? 0) + modsPrice) * item.qty;
  }, 0);

  const categoryPriority: Record<string, number> = { "extra": 1, "drink": 2, "dip": 3 };

  const sortModifiers = (mods: Modifier[]) => [...mods].sort((a, b) => (categoryPriority[a.category] || 99) - (categoryPriority[b.category] || 99));

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setLoading(true);

    const orderData = {
      customer: user_name || " ",
      phone: phone || " ",
      address: address || " ",
      type_of_delivery: deliveryType,
      is_preorder: isPreorder,
      preorder_date: date || " ",
      preorder_time: time || " ",        
      items: items.map(item => ({
        product_id: item.id,   
        name: item.name,
        size: item.selected_size ?? null,
        q: item.qty,
        base_price: item.base_price,
        modifiers: item.modifiers || [],
      })),
      total_price: total,
      save_customer: customerMode === "new" ? saveCustomer : false,
    };

    try {
      const res = await fetch(`${GATEWAY_URL}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });
      if (res.ok) {
        toast.custom(() => 
          <div className="w-full flex justify-center">
            <AlertComponent />
          </div>
        );

        setAddress("");
        setUserName("");
        setPhone("");
        setCustomerMode(null);
        setDate("");
        setHour(now.getHours());
        setMinute(snapMinutes(now.getMinutes()));
        onOrderComplete();
      }
    } catch (error) {
      toast.custom(() => 
        <div className="w-full flex justify-center">
          <DectructiveAlertComponent />
        </div>
      );
    } finally {
      setLoading(false);
    }
  };
  
  // Customer saving buttons
  const handleSelectCustomer = (c: Customer) => {
    setUserName(c.name);
    setPhone(c.phone ?? "");
    setAddress(c.address ?? "");
    setCustomerMode("find");
  };

  const handleNewCustomer = () => {
    setUserName("");
    setPhone("");
    setAddress("");
    setCustomerMode("new");
  };

  return (
    <div className="flex flex-col h-full rounded-2xl gap-3 p-6">

      {/* Delivery type badge at top always visible, not changeable */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black uppercase">Bag</h2>
        <span className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-3 py-1.5 rounded-full">
          {deliveryType}
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {/* Switch and Label Row */}
        <div className="flex items-center space-x-2">
          <Switch 
            id="preorder-mode" 
            checked={isPreorder} 
            onCheckedChange={setIsPreorder}
          />
          <Label htmlFor="preorder-mode">Preorder Mode</Label>
        </div>

        {/* Popover Calendar with Integrated Clock */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">From</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                disabled={!isPreorder} 
                variant={"outline"}
                className={cn(
                  "w-56 justify-start text-left font-medium text-sm rounded-xl border-zinc-200 bg-white h-10 outline-none hover:bg-white focus:border-black transition-all",
                  (!date || !isPreorder) && "text-muted-foreground opacity-50" 
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-zinc-400" />
                {/* Dynamically shows both Date and Clock choice in button title */}
                {date ? `${format(parseISO(date), "yyyy-MM-dd")} · ${time}` : <span>Pick date & time</span>}
              </Button>
            </PopoverTrigger>
              
            <PopoverContent className="w-auto p-0 rounded-xl border-zinc-200 shadow-xl" align="start">
              <div className="flex">
                {/* Left Side: Your Original Shadcn Calendar */}
                <Calendar
                  mode="single"
                  selected={date ? parseISO(date) : undefined}
                  onSelect={(selectedDay) => setDate(selectedDay ? format(selectedDay, "yyyy-MM-dd") : "")}
                  disabled={{ before: new Date() }}
                />

                {/* Right Side: Extracted Custom Clock Drums */}
                <div className="flex flex-col justify-center items-center border-l border-zinc-100 px-4 gap-3 min-w-22.5">
                  <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
                    <Clock className="h-3 w-3" />
                    Time
                  </div>

                  {/* Hour Drum */}
                  <div
                    className="flex flex-col items-center gap-1 select-none"
                    onWheel={handleWheelHour}
                  >
                    <button
                      onClick={() => handleHourChange(1)}
                      className="text-zinc-300 hover:text-black transition-colors"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <span className="text-xl font-black tabular-nums w-8 text-center">
                      {padTwo(hour)}
                    </span>
                    <button
                      onClick={() => handleHourChange(-1)}
                      className="text-zinc-300 hover:text-black transition-colors"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>

                  <span className="text-zinc-300 font-black text-lg">:</span>

                  {/* Minute Drum */}
                  <div
                    className="flex flex-col items-center gap-1 select-none"
                    onWheel={handleWheelMinute}
                  >
                    <button
                      onClick={() => handleMinuteChange(1)}
                      className="text-zinc-300 hover:text-black transition-colors"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <span className="text-xl font-black tabular-nums w-8 text-center">
                      {padTwo(minute)}
                    </span>
                    <button
                      onClick={() => handleMinuteChange(-1)}
                      className="text-zinc-300 hover:text-black transition-colors"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <h3 className="text-[10px] tracking-[0.3em] text-zinc-400 uppercase font-medium">
        Drag left to remove item
      </h3>

      <div className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden no-scrollbar pr-2">
        <AnimatePresence initial={false}>
          {items.map(item => (
            <motion.div
              key={item.cart_unique_id}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              drag="x"
              dragConstraints={{ left: -100, right: 0 }}
              onDragEnd={(_, info) => { if (info.offset.x < -50) onRemove(item.cart_unique_id); }}
              className="flex flex-col bg-white border-b border-zinc-100 pb-3 cursor-grab active:cursor-grabbing"
            >
              <div className="flex justify-between items-baseline">
                <div className="flex gap-2 items-baseline">
                  <span className="text-sm font-black uppercase">{item.name}</span>
                  {item.selected_size && (
                    <span className="text-[10px] text-zinc-400 font-bold">{item.selected_size}</span>
                  )}
                  {item.qty > 1 && (
                    <span className="text-[10px] text-orange-500 font-bold">x{item.qty}</span>
                  )}
                </div>
                <span className="text-xs font-bold">{item.base_price ?? 0}$</span>
              </div>

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
          {deliveryType === "Lieferservice" && (
            <div className="space-y-2">
              {customerMode === null ? (
                // ADD / FIND Customer
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleNewCustomer}
                    className="flex items-center justify-center gap-2 border-2 border-zinc-200 rounded-xl py-3 text-xs font-black uppercase tracking-widest hover:border-black transition-colors"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    New
                  </button>
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="flex items-center justify-center gap-2 border-2 border-zinc-200 rounded-xl py-3 text-xs font-black uppercase tracking-widest hover:border-black transition-colors"
                  >
                    <UserSearch className="h-3.5 w-3.5" />
                    Find
                  </button>
                </div>
              ) : (
                <>
                  {/* Fallback */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                      {customerMode === "new" ? "New Customer" : "Existing Customer"}
                    </span>
                    <button
                      onClick={() => setCustomerMode(null)}
                      className="text-[10px] font-bold text-zinc-400 hover:text-black underline"
                    >
                      Change
                    </button>
                  </div>
              
                  <Input
                    placeholder="NAME, SURNAME"
                    value={user_name}
                    onChange={e => setUserName(e.target.value)}
                    disabled={customerMode === "find"}
                    className="rounded-xl border-zinc-200 h-10 text-xs font-bold uppercase disabled:opacity-60"
                  />

                  <Input
                    placeholder="PHONE"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    disabled={customerMode === "find"}
                    className="rounded-xl border-zinc-200 h-10 text-xs font-bold disabled:opacity-60"
                  />

                  <AddressAutocomplete
                    value={address}
                    onChange={setAddress}
                    placeholder="ADDRESS"
                  />

                  {customerMode === "new" && (
                    <div className="flex items-center gap-2 pt-1">
                      <Switch
                        id="save-customer"
                        checked={saveCustomer}
                        onCheckedChange={setSaveCustomer}
                      />
                      <Label htmlFor="save-customer" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                        Save customer
                      </Label>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <Button
            disabled={items.length === 0 || loading}
            onClick={handleCheckout}
            className="w-full rounded-md h-14 bg-black text-white font-black uppercase tracking-widest text-sm hover:bg-zinc-800"
          >
            {loading ? "..." : "Checkout →"}
          </Button>

          <CustomerSearch
            open={searchOpen}
            onOpenChange={setSearchOpen}
            onSelect={handleSelectCustomer}
          />

        </div>
      </div>
    </div>
  );
}
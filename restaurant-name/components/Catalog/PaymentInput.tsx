"use client";

import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Banknote, CreditCard, Smartphone, Clock } from "lucide-react";

export type PaymentMethod = "cash" | "card" | "online" | "pay_later";

interface PaymentInputProps {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "card", label: "Card", icon: CreditCard },
  { value: "online", label: "Online", icon: Smartphone },
  { value: "pay_later", label: "Pay Later", icon: Clock },
];

export function PaymentInput({ value, onChange }: PaymentInputProps) {
  const selected = PAYMENT_METHODS.find(pm => pm.value === value);

  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] tracking-[0.3em] text-zinc-400 uppercase font-medium">
        Payment
      </label>

      <Select value={value} onValueChange={(v) => onChange(v as PaymentMethod)}>
        <SelectTrigger
          className="w-full rounded-xl border-zinc-200 h-10 text-xs font-black uppercase tracking-widest hover:border-zinc-400 focus:border-black focus:ring-0 data-[state=open]:border-black [&>span]:flex [&>span]:items-center [&>span]:gap-2"
        >
          <SelectValue placeholder="Select payment">
            {selected && (
              <span className="flex items-center gap-2">
                <selected.icon className="h-3.5 w-3.5 text-zinc-400" />
                {selected.label}
              </span>
            )}
          </SelectValue>
        </SelectTrigger>

        <SelectContent className="rounded-xl border-zinc-200">
          <SelectGroup>
            <SelectLabel className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
              Payment Method
            </SelectLabel>
            {PAYMENT_METHODS.map(pm => (
              <SelectItem
                key={pm.value}
                value={pm.value}
                className="text-xs font-bold uppercase tracking-wide focus:bg-zinc-100 [&>span]:flex [&>span]:items-center [&>span]:gap-2"
              >
                <pm.icon className="h-3.5 w-3.5 text-zinc-400" />
                {pm.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
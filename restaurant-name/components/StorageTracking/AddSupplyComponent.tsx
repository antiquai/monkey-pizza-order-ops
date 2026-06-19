'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { DectructiveAlertComponent } from "./Alert/DesctructiveAlertComponent"
import { AlertComponent } from "./Alert/AlertComponent";

import { useState } from "react";
import { toast } from "sonner";

interface Props {
    items: string[];
    isOpen: boolean;
    onClose: () => void
}

const GATEWAY_URL = process.env.NEXT_PUBLIC_SERVER_IP

export default function AddSupply({ items, isOpen, onClose } : Props) {
    const [ingName, setIngName] = useState<string>("")
    const [supplier, setSupplier] = useState<string>("")
    const [amount, setAmount] = useState("")

    const suppliers = [
        "Edeka",
        "METRO",
        "Privat Delivery",
        "Preparation"
    ] as const

    const handleSave = async () => {
        const SupplyData = {
            ing_name: ingName,
            sup: supplier,
            amount: amount
        }

        try{
            const res = await fetch(`${GATEWAY_URL}/supply`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(SupplyData),
            })
            if (res.ok) {
                toast.custom(() => <div className="w-full flex justify-center"><AlertComponent /></div>);
                setIngName("")
                setSupplier("")
                setAmount("")
            }
        } catch (error){
            toast.custom(() => <div className="w-full flex justify-center"><DectructiveAlertComponent /></div>);
        }
    }
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none text-black">
                <DialogHeader className="p-6 pb-4">
                    <DialogTitle className="text-2xl font-bold uppercase tracking-tighter">
                        Add Supply
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-3 px-6 pb-6">

                    {/* Ingredient selector */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
                            Ingredient
                        </label>
                        <Select value={ingName} onValueChange={setIngName}>
                            <SelectTrigger className="w-full h-10 rounded-xl border-zinc-200 text-sm font-medium">
                                <SelectValue placeholder="Select ingredient" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    {items.map(item => (
                                        <SelectItem key={item} value={item}>
                                            {item}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Supplier selector */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
                            Supplier
                        </label>
                        <Select value={supplier} onValueChange={setSupplier}>
                            <SelectTrigger className="w-full h-10 rounded-xl border-zinc-200 text-sm font-medium">
                                <SelectValue placeholder="Select supplier" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    {suppliers.map(sup => (
                                        <SelectItem key={sup} value={sup}>
                                            {sup}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Amount */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
                            Amount
                        </label>
                        <Input
                            placeholder="e.g. 500"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            className="h-10 rounded-xl border-zinc-200 text-sm font-medium"
                        />
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end pt-2 border-t border-zinc-100 mt-1">
                        <Button
                            onClick={handleSave}
                            disabled={!ingName || !supplier || !amount}
                            className="bg-black px-8 py-5 text-xs font-black uppercase tracking-widest text-white hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl"
                        >
                            Submit
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

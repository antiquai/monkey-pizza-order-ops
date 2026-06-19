'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

import { useEffect, useMemo, useState } from "react";
import { Product, Modifier, ProductSize } from "../Catalog/Beta_Catalog";


interface Props {
    product: Product;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (selectedModifiers: Modifier[], selectedSize?: ProductSize) => void;
}

const GATEWAY_URL = process.env.NEXT_PUBLIC_SERVER_IP

export default function ModifierSelector({ product, isOpen, onClose, onConfirm }: Props) {
    const [allModifiers, setAllModifiers] = useState<Modifier[]>([]);
    const [selected, setSelected] = useState<Modifier[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);

    const hasSizes = product.sizes && product.sizes.length > 0;

    useEffect(() => {
        fetch(`${GATEWAY_URL}/load_modifiers`)
            .then(res => res.json())
            .then(data => {
                console.log("modifiers response:", data); 
                setAllModifiers(Array.isArray(data) ? data : data.modifiers ?? []);
            })
            .catch(err => console.error("Failed to fetch modifiers:", err));
    }, []);

    const filteredGroupedModifiers = useMemo(() => {
        const filteredList = allModifiers.filter(mod =>
            mod.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return filteredList.reduce((acc, mod) => {
            (acc[mod.category] = acc[mod.category] || []).push(mod);
            return acc;
        }, {} as Record<string, Modifier[]>);
    }, [searchTerm, allModifiers]);

    const CATEGORY_ORDER = ["Extra", "Dip", "Drink"];
    const categories = useMemo(
        () => CATEGORY_ORDER.filter(cat => 
            allModifiers.some(m => m.category === cat)
        ),
        [allModifiers]
    );

    const handleModifierClick = (mod: Omit<Modifier, 'count'>) => {
        setSelected(prev => {
            const existing = prev.find(m => m.name === mod.name);
            if (existing) {
                return prev.map(m =>
                    m.name === mod.name ? { ...m, count: m.count + 1 } : m
                );
            }
            return [...prev, { ...mod, count: 1 } as Modifier];
        });
    };

    const handleMinusClick = (e: React.MouseEvent, modName: string) => {
        e.stopPropagation();
        setSelected(prev =>
            prev.map(m => m.name === modName ? { ...m, count: m.count - 1 } : m)
                .filter(m => m.count > 0)
        );
    };

    const handleSave = () => {
        onConfirm(selected, selectedSize ?? undefined);
        setSelected([]);
        setSearchTerm("");
        setSelectedSize(null);
        onClose();
    }

    // Block confirm for pizzas until size is chosen
    const canConfirm = !hasSizes || selectedSize !== null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-106.25 p-0 overflow-hidden border-none rounded-2xl text-black">
                <DialogHeader className="p-6 pb-2">
                    <div className="flex justify-between items-center gap-4">
                        <DialogTitle className="text-2xl font-bold uppercase tracking-tighter">
                            ADD TO {product.name}
                        </DialogTitle>
                        <div className="w-40 sm:w-48 pt-7">
                            <Input
                                placeholder="Search modifier(s)..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="rounded-xl border-gray-200 focus:ring-orange-500"
                            />
                        </div>
                    </div>
                </DialogHeader>

                {/* Size picker — only for pizzas */}
                {hasSizes && (
                    <div className="px-6 pb-2">
                        <p className="text-[10px] text-zinc-400 uppercase font-bold mb-3 tracking-widest">
                            Choose size
                        </p>
                        <div className="flex gap-2">
                            {product.sizes!.map(s => (
                                <button
                                    key={s.size}
                                    onClick={() => setSelectedSize(s)}
                                    className={`flex-1 py-3 border-2 rounded-none text-xs font-black uppercase transition-all ${
                                        selectedSize?.size === s.size
                                            ? "border-black bg-black text-white"
                                            : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                                    }`}
                                >
                                    <div>{s.size}</div>
                                    <div className="font-normal">${s.price}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {categories.length > 0 ? (
                    <Tabs defaultValue={categories[0]} className="w-full">
                        <div className="px-6">
                            <TabsList className="grid w-full grid-cols-3 bg-zinc-100 p-1">
                                {categories.map(cat => (
                                    <TabsTrigger
                                        key={cat}
                                        value={cat}
                                        disabled={!filteredGroupedModifiers[cat]}
                                        className="uppercase text-[10px] font-bold data-[state=active]:bg-white disabled:opacity-30"
                                    >
                                        {cat}s
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>

                        <div className="py-4 px-6 min-h-87.5 max-h-72 overflow-y-auto">
                            {Object.entries(filteredGroupedModifiers).map(([category, mods]) => (
                                <TabsContent key={category} value={category} className="mt-0 space-y-2 outline-none">
                                    <p className="text-[10px] text-zinc-400 uppercase font-bold mb-4 tracking-widest text-center">
                                        Select your {category}
                                    </p>
                                    <div className="grid grid-cols-1 gap-2">
                                        {mods.map(mod => {
                                            const selectedItem = selected.find(m => m.name === mod.name);
                                            const count = selectedItem ? selectedItem.count : 0;
                                            return (
                                                <Button
                                                    key={mod.name}
                                                    variant={count > 0 ? "default" : "outline"}
                                                    className={`justify-between text-sm h-16 border-2 transition-all rounded-none ${
                                                        count > 0 ? 'border-black bg-zinc-50' : 'border-zinc-200'
                                                    }`}
                                                    onClick={() => handleModifierClick(mod)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {count > 0 && (
                                                            <span className="bg-black text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                                                                {count}X
                                                            </span>
                                                        )}
                                                        <span className="font-bold uppercase text-black">{mod.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {count > 0 && (
                                                            <div
                                                                onClick={e => handleMinusClick(e, mod.name)}
                                                                className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center hover:bg-zinc-800 transition-colors"
                                                            >
                                                                -
                                                            </div>
                                                        )}
                                                        <span className="font-bold text-zinc-500">
                                                            {mod.price > 0 ? `+${mod.price}$` : 'FREE'}
                                                        </span>
                                                    </div>
                                                </Button>
                                            );
                                        })}
                                    </div>
                                </TabsContent>
                            ))}
                        </div>
                    </Tabs>
                ) : (
                    <div className="min-h-87.5 flex items-center justify-center text-[10px] text-zinc-400 uppercase">
                        No modifiers found
                    </div>
                )}

                <div className="flex justify-between items-center p-6 border-t bg-zinc-50">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-zinc-400 font-bold uppercase">Total items</span>
                        <span className="font-black text-lg">
                            {selected.reduce((acc, m) => acc + m.count, 0)}
                        </span>
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={!canConfirm}
                        className="relative overflow-hidden rounded-xl bg-black px-12 py-6 text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {hasSizes && !selectedSize ? "Choose a size first" : "Confirm"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
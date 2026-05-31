"use client";

import { useMemo, useState } from "react";
import { Input } from "./ui/input";

import ModifierSelector from "./BricksComponent/ModifierSelector";
import ProductCardComponent from "./BricksComponent/CardComponents/ProductCardComponent";

import PrimerCart from "./PrimerCartComponent";

export interface Modifier {
  name: string;
  price: number;
  category: 'extra' | 'dip' | 'drink';
  count: number; 
}

export interface Product {
  id: number;
  name: string;
  categotry: string;
  base_price: number;
  image: string;
}

export interface CartItem extends Product {
  qty: number;
  cart_unique_id: string;
  modifiers?: Modifier[]; // "?" is optional, because not all items will have modifiers
}

const products: Product[] = [
  {
    id: 1,
    name: "Margharita",
    categotry: "Pizza",
    base_price: 11,
    image: "pizza.gif",
  },
  {
    id: 2,
    name: "Pepperoni",
    categotry: "Pizza",
    base_price: 14,
    image: "pizza.gif",
  },
  {
    id: 3,
    name: "Boston",
    categotry: "Pizza",
    base_price: 13.5,
    image: "pizza.gif",
  },
  {
    id: 4,
    name: "Hawaii",
    categotry: "Pizza",
    base_price: 14,
    image: "pizza.gif",
  },
  {
    id: 5,
    name: "Veggie",
    categotry: "Pizza",
    base_price: 18,
    image: "pizza.gif",
  },
  {
    id: 6,
    name: "Pizzabrötchen mit Sucuk",
    categotry: "Pizzabrötchen",
    base_price: 6,
    image: "pizza.gif",
  },
  {
    id: 7,
    name: "Pizzabrötchen mit Thunfisch",
    categotry: "Pizzabrötchen",
    base_price: 8,
    image: "pizza.gif",
  },
  {
    id: 8,
    name: "Pizzabrötchen mit Salami",
    categotry: "Pizzabrötchen",
    base_price: 5,
    image: "pizza.gif",
  },
    
];

export default function Catalog() {

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const [ modSelectorState, setModSelectorState ] = useState<{ isOpen: boolean, product : Product | null  }>({
    isOpen: false,
    product: null,
  })

  const categories = ["All", ...Array.from(new Set(products.map(p => p.categotry)))];

  const filterProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === "All" || p.categotry === activeCategory;
      return matchesSearch && matchesCategory;
    })
  }, [searchTerm, activeCategory]);
  
  

  const handleAddClick = ( product: Product ) => {
    setModSelectorState({isOpen: true, product})
  }

  const handleConfiemAddItem = ( selectedModifiers : Modifier[] ) => {
    const product = modSelectorState.product;
        if (!product) return;

        const modsPrice = selectedModifiers.reduce((acc, m) => acc + (m.price * m.count), 0);
        const finalItemPrice = product.base_price + modsPrice;

        setCart((prev) => {
            const modsHash = selectedModifiers.map(m => `${m.name}:${m.count}`).sort().join('|');
            const cartItemId = `${product.id}-${modsHash}`;
        
            const existing = prev.find((item) => item.cart_unique_id === cartItemId);

            if (existing) {
                return prev.map((item) =>
                    item.cart_unique_id === cartItemId ? { ...item, qty: item.qty + 1 } : item
                );
            }

            return [
                ...prev,
                { 
                    ...product, 
                    cart_unique_id: cartItemId, 
                    base_price: product.base_price, 
                    qty: 1, 
                    modifiers: selectedModifiers 
                },
            ];
        });
      
        setModSelectorState({ isOpen: false, product: null });
  };

const removeFromCart = (cartUniqueId: string) => {
  setCart(prev => prev.filter(item => item.cart_unique_id !== cartUniqueId));
};

  const clearCart = () => {
    setCart([]);
  }

 return (
  <div className="relative h-[97vh] flex rounded-2xl m-3 bg-white backdrop-blur-xl font-sans overflow-hidden">

    <div className="flex-1 overflow-y-auto px-6 md:px-12 py-8">
      <header className="px-10">
        <div className="flex justify-between items-end gap-4">
            <h2 className="text-[4rem] font-black leading-tight tracking-tighter">
              Catalog
            </h2>
            
            <div className="w-64 mb-3"> 
              <Input 
                placeholder="Search items..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-2xl border-gray-200 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4 overflow-x-auto pb-2 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-2xl text-sm font-medium transition-colors ${
                  activeCategory === cat 
                  ? "bg-black text-white" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
      </header>

      <main className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-12 pl-10 pb-20">
          {filterProducts.length > 0 ? (
            filterProducts.map((p) => (
              <ProductCardComponent key={p.id} product={p} onAdd={handleAddClick} />
            ))
          ) : (
            <div className="col-span-full text-center py-20 text-gray-400">
              No items found matching your search.
            </div>
          )}
        </main>
      </div>


    {/* Cart Component */}
    <aside className="w-120 border-l border-gray-100 bg-white">
      <PrimerCart items={cart} onRemove={removeFromCart} onClear={clearCart}/>
    </aside>
    
    {modSelectorState.product && (
      <ModifierSelector 
        product={modSelectorState.product}
        isOpen = {modSelectorState.isOpen}
        onClose={() => setModSelectorState({ isOpen: false, product: null })}
        onConfirm={handleConfiemAddItem}
      />
    )}
    </div>
);
};
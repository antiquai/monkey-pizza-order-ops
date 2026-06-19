"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "../ui/input";
import ModifierSelector from "../BricksComponent/Beta_ModifierSelector";
import ProductCardComponent from "../BricksComponent/CardComponents/Beta_ProductCardComponent";
import PrimerCart from "./Beta_PrimerCartComponent";

export interface Modifier {
  code: string;
  name: string;
  price: number;
  category: string;
  count: number;
}

export interface ProductSize {
  size: string;   
  price: number;  
}

export interface Product {
  id: number;
  name: string;
  category: string;
  base_price: number | null;
  image: string;
  ingredients?: string;
  sizes?: ProductSize[]; 
}

export interface CartItem extends Product {
  qty: number;
  cart_unique_id: string;
  selected_size?: string;
  modifiers?: Modifier[];
}

const GATEWAY_URL = process.env.NEXT_PUBLIC_SERVER_IP
const DELIVERY_TYPES = ["Lieferservice", "Zum Mitnehmen", "Restaurant"];

function normaliseSizes(raw: Record<string, { price: number }> | null | undefined): ProductSize[] | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const entries = Object.entries(raw).map(([size, data]) => ({
    size,
    price: Number(data.price ?? 0),
  }));
  return entries.length > 0 ? entries : undefined;
}

export default function Catalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [deliveryType, setDeliveryType] = useState<string | null>(null);

  const [modSelectorState, setModSelectorState] = useState<{
    isOpen: boolean;
    product: Product | null;
  }>({ isOpen: false, product: null });

  useEffect(() => {
    fetch(`${GATEWAY_URL}/load_catalog`)
      .then(res => res.json())
      .then((data: any[]) => {
        const mapped: Product[] = data.map(p => ({
          id:         p.id,
          name:       p.name,
          category:   p.category,
          base_price: p.base_price !== null ? Number(p.base_price) : null,
          image:      p.image,
          ingredients: p.ingredients,
          sizes:      normaliseSizes(p.sizes),
        }));
        setProducts(mapped);
      })
      .catch(err => console.error("Failed to load catalog:", err))
      .finally(() => setLoadingProducts(false));
  }, []);

  const CATALOG_CATEGORY_ORDER = ["Pizza", "Pizzabrötchen", "Dip", "Drink"];
  const categories = useMemo(() => {
      const existing = new Set(products.map(p => p.category));
      return [
          "All",
          ...CATALOG_CATEGORY_ORDER.filter(c => existing.has(c)),
          ...Array.from(existing).filter(c => !CATALOG_CATEGORY_ORDER.includes(c)),
      ];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch   = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === "All" || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, activeCategory, products]);

  const handleAddClick = (product: Product) => {
    setModSelectorState({ isOpen: true, product });
  };

  const handleConfirmAddItem = (selectedModifiers: Modifier[], selectedSize?: ProductSize) => {
    const product = modSelectorState.product;
    if (!product) return;

    const basePrice  = selectedSize?.price ?? product.base_price ?? 0;
    const sizeKey    = selectedSize ? selectedSize.size : "default";
    const modsHash   = selectedModifiers.map(m => `${m.name}:${m.count}`).sort().join("|");
    const cartItemId = `${product.id}-${sizeKey}-${modsHash}`;

    setCart(prev => {
      const existing = prev.find(item => item.cart_unique_id === cartItemId);
      if (existing) {
        return prev.map(item =>
          item.cart_unique_id === cartItemId ? { ...item, qty: item.qty + 1 } : item,
        );
      }
      return [
        ...prev,
        {
          ...product,
          cart_unique_id: cartItemId,
          base_price:     basePrice,
          qty:            1,
          selected_size:  selectedSize?.size,
          modifiers:      selectedModifiers,
        },
      ];
    });

    setModSelectorState({ isOpen: false, product: null });
  };

  const removeFromCart = (cartUniqueId: string) => {
    setCart(prev => prev.filter(item => item.cart_unique_id !== cartUniqueId));
  };

  const handleOrderComplete = () => {
    setDeliveryType(null);
    setCart([]);
    setSearchTerm("");
    setActiveCategory("All");
  };

  // Delivery picker screen
  if (!deliveryType) {
    return (
      <div className="relative h-[97vh] flex flex-col items-center justify-center rounded-2xl m-3 bg-white font-sans gap-6">
        <div className="flex flex-col items-center gap-2 mb-4">
          <h2 className="text-[3.5rem] font-black leading-tight tracking-tighter uppercase">
            New Order
          </h2>
          <p className="text-[11px] tracking-[0.3em] text-zinc-400 uppercase font-medium">
            Choose delivery type to start
          </p>
        </div>

        <div className="flex flex-col gap-3 w-96">
          {DELIVERY_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setDeliveryType(type)}
              className="w-full py-5 border-2 border-zinc-200 rounded-xl text-sm font-black uppercase tracking-widest hover:border-black hover:bg-black hover:text-white transition-all duration-150"
            >
              {type}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Catalog + cart screen

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
                onChange={e => setSearchTerm(e.target.value)}
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
          {loadingProducts ? (
            <div className="col-span-full text-center py-20 text-gray-400">
              Loading catalog…
            </div>
          ) : filteredProducts.length > 0 ? (
            filteredProducts.map(p => (
              <ProductCardComponent key={p.id} product={p} onAdd={handleAddClick} />
            ))
          ) : (
            <div className="col-span-full text-center py-20 text-gray-400">
              No items found matching your search.
            </div>
          )}
        </main>
      </div>

      <aside className="w-120 border-l border-gray-100 bg-white">
        <PrimerCart
          items={cart}
          onRemove={removeFromCart}
          onClear={() => setCart([])}
          deliveryType={deliveryType}
          onOrderComplete={handleOrderComplete}
        />
      </aside>

      {/* Modifier selector */}
      {modSelectorState.product && (
        <ModifierSelector
          product={modSelectorState.product}
          isOpen={modSelectorState.isOpen}
          onClose={() => setModSelectorState({ isOpen: false, product: null })}
          onConfirm={handleConfirmAddItem}
        />
      )}
    </div>
  );
}
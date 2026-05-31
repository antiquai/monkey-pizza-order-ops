import Image from "next/image";
import { Order } from "./OrderKeeper";
import { useState } from "react";
import { Badge } from "./BricksComponent/BadgeComponent";

interface ReceiptProps {
  order: Order; 
  onDone: () => void;
  onCancel: () => void;
}


export default function ProductCard({ order, onDone, onCancel }: ReceiptProps) {
  const [isSent, setIsSent] = useState(order.status === 'SENT TO THE OVEN');

  const handleClick = () => {
    setIsSent(true);   // update UI immediately
    onDone();          // send API in OrderKeeper
  };

  const handleCancelClick = () => {
    onCancel()       // send API in OrderKeeper
  };

  return (
    <div className="relative bg-white text-black shadow-md border-t-4 border-black font-mono w-full max-w-sm">

      {/* Тег "IN OVEN" (Shadcn Badge или просто div) */}
      {isSent ? (
        <div className="absolute top-2 right-2 z-10">
          <Badge type="sent_to_oven" />
        </div>
      ) : order.status === 'CANCELLED' ? (
        <div className="absolute top-2 right-2 z-10">
          <Badge type="cancelled" />
        </div>
      ) : null}

      {/* Header of Receip */}
      <div className="text-center border-b border-dashed border-zinc-300 pb-4 mb-4">
        <Image src="/logo_m.png" alt="Logo" width={40} height={40} className="mx-auto mb-2" />
        <h2 className="text-md text-blue-950 font-black uppercase">Order #{order.order_id}</h2>
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Kitchen Receipt</p>
        <p className="font-black text-[20px] uppercase">{order.type_of_delivery}</p>
      </div>
      {/* Cleint info */}
      {order.type_of_delivery === 'Lieferservice' && (
        <div className="space-y-1 mb-4 text-xs uppercase">
          <p><span className="font-bold">Customer:</span> {order.customer}</p>
          <p><span className="font-bold">Address:</span> {order.address}</p>
        </div>
      )}
      {/* Items List */}
      <div className="border-b border-dashed border-zinc-300 pb-4 mb-4">
        <p className="text-lg font-bold uppercase mb-2">Items</p>
        {order.items.map((item, index) => (
            <div key={index} className="flex flex-col mb-2 text-sm">
                {/* Item, qty, price */}
                <div className="flex justify-between items-baseline gap-2">
                    <span className="font-bold">{item.q}x {item.name}  ({item.size})</span>
                    {/* Calculate the total price of the item for the receipt */}
                    <span className="text-xs font-medium">
                        {((item.base_price + (item.modifiers?.reduce((a,m)=>a+m.price, 0) || 0)) * item.q)}$
                    </span>
                </div>
        
                {/* Modification Block */}
                {item.modifiers && item.modifiers.length > 0 && (
                    <div className="pl-4 text-md text-black border-l border-zinc-200 mt-1 space-y-0.5">
                        {item.modifiers.map((mod, mIndex) => (
                            <div key={mIndex}>+ {mod.name} x {mod.count || 1} ({mod.category})</div>
                        ))}
                    </div>
                )}
            </div>
        ))}
      </div>
      {/* Total */}
      <div className="flex justify-between font-black text-lg uppercase">
        <span>Total</span>
        <span>{order.total_price}$</span>
      </div>
      
      <div className="mt-4 text-center text-[8px] text-zinc-400 uppercase">
        Ready for production
      </div>
      {order.status === 'CANCELLED' ? (
          <button
            className="w-full mt-2 bg-black text-white hover:bg-zinc-700 transition-all rounded-md text-lg font-bold py-2 disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={handleCancelClick}
            disabled={isSent}
          >
            TAP TO DELETE 
          </button> 
      ) : (
          <button
            className="w-full mt-2 bg-black text-white hover:bg-zinc-700 transition-all rounded-md text-lg font-bold py-2 disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={handleClick}
            disabled={isSent}
          >
            {isSent ? "In the oven ✓" : "To the oven"}
          </button> 
        )
      }
    </div>
  );
};
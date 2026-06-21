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
    setIsSent(true);   
    onDone();          
  };

  const handleCancelClick = () => {
    onCancel()       
  };

  return (
    <div className="relative bg-white text-black rounded-2xl w-full max-w-sm overflow-hidden shadow-[0_16px_40px_rgb(0,0,0,0.10),0_4px_12px_rgb(0,0,0,0.06)]">

      {/* In oven tag*/}
      <div className="flex justify-between items-center bg-zinc-100 border-b border-zinc-200 px-4 py-3">
        <h2 className="text-sm font-bold uppercase tracking-wide">ORD-{order.order_id}</h2>
        <div className="flex items-center gap-2">
          {order.is_preorder && (
            <span className="text-[10px] font-bold uppercase bg-amber-200 text-amber-900 px-2 py-1 rounded-md tracking-wide">
              {order.preorder_date} · {order.preorder_time}
            </span>
          )}
          {isSent ? (
            <Badge type="sent_to_oven" />
          ) : order.status === 'CANCELLED' ? (
            <Badge type="cancelled" />
          ) : null}
        </div>
      </div>
      {/* Items List */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-lg font-bold uppercase mb-2">Items</p>
        {order.items.map((item, index) => (
            <div key={index} className="flex flex-col mb-2 text-sm">
                {/* Item and qty*/}
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-base font-semibold">{item.name} ({item.size})</span>
                  <span className="text-base font-semibold shrink-0">x{item.q}</span>
                </div>
        
                {/* Modificators */}
                {item.modifiers && item.modifiers.length > 0 && (
                  <div className="pl-3 mt-0.5 space-y-0.5">
                    {item.modifiers.map((mod, mIndex) => (
                      <div key={mIndex} className="text-sm text-zinc-600">
                        + {mod.name} x {mod.count || 1} ({mod.category})
                      </div>
                    ))}
                  </div>
                )}
            </div>
        ))}
      </div>

      {/* Button */}
      <div className="px-4 pb-4">
        {order.status === 'CANCELLED' ? (
          <button
            className="w-full bg-black text-white hover:bg-zinc-800 transition-colors rounded-xl text-sm font-bold py-3 uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={handleCancelClick}
            disabled={isSent}
          >
            Tap to delete
          </button>
        ) : (
          <button
            className="w-full bg-black text-white hover:bg-zinc-800 transition-colors rounded-xl text-sm font-bold py-3 uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={handleClick}
            disabled={isSent}
          >
            {isSent ? "In the oven →" : "To the oven"}
          </button>
        )}
      </div>
    </div>
  );
};
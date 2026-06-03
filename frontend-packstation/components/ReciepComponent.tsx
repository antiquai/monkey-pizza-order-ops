import Image from "next/image";
import { Order } from "./OrderKeeper";
import { Badge } from "./BricksComponent/BadgeComponent";

interface ReceiptProps {
  order: Order; 
  onDone: () => void;
}


export default function ProductCard({ order, onDone }: ReceiptProps) {
  const isInOven = order.status === 'SENT TO THE OVEN';

  return (
    <div className={`relative bg-white text-black rounded-2xl w-full max-w-sm overflow-hidden shadow-[0_16px_40px_rgb(0,0,0,0.10),0_4px_12px_rgb(0,0,0,0.06)] ${order.status ? 'bg-blue-500/15' : 'border-black'}`}>
      
      {/* Header of Receipt */}
      <div className="flex justify-between items-center bg-zinc-100 border-b border-zinc-200 px-4 py-3">
        <h2 className="text-sm font-bold uppercase tracking-wide">ORD-{order.order_id}</h2>
        <Badge type={
          order.status === 'SENT TO THE OVEN' ? 'sent_to_oven' :
          order.status === 'CANCELLED' ? 'cancelled' :
          'pending'
        } />
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
      
      <div className="px-4 pb-4">
        <button className={`w-full bg-black text-white hover:bg-zinc-800 transition-colors rounded-xl text-sm font-bold py-3 uppercase tracking-widest ${!isInOven ? 'opacity-50 grayscale cursor-not-allowed' : 'opacity-100'}`} onClick={onDone} disabled={!isInOven}>
          Packed
        </button>
      </div>
    </div>
  )
};
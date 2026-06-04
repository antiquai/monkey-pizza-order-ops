import Image from "next/image";
import { Order } from "./WaiterDashboard";
import { Badge } from "../BricksComponent/BadgeComponent";

interface ReceiptProps {
  order: Order; 
}

export default function ProductCard({ order}: ReceiptProps) {
  return (
    <div className={`relative bg-white text-black rounded-2xl w-full max-w-sm overflow-hidden shadow-[0_16px_40px_rgb(0,0,0,0.10),0_4px_12px_rgb(0,0,0,0.06)] ${order.status ? 'bg-blue-500/15' : 'border-black'}`}>

      <div className="flex justify-between items-center bg-zinc-100 border-b border-zinc-200 px-4 py-3">
        <h2 className="text-sm font-bold uppercase tracking-wide">ORD-{order.order_id}</h2>
        <Badge type={
          order.status === 'done'        ? 'success'     :
          order.status === 'in delivery' ? 'delivery' :
          order.status === 'cancelled'   ? 'cancelled'   :
          'pending'
        } />
      </div>
      {/* Header of Receip */}
      <div className="px-4 pt-4 pb-2 text-left">
        <p className="font-bold text-[20px] uppercase">{order.type_of_delivery}</p>
        {/* Cleint info */}
        {order.type_of_delivery === 'Lieferservice' && (
          <div className="space-y-1 mb-4 font-bold text-[10px] uppercase">
            <p><span>Customer:</span> {order.customer}</p>
            <p><span>Address:</span> {order.address}</p>
          </div>
        )}
      </div>

      {/* Items List */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-lg font-bold uppercase mb-2">Items</p>
        {order.items.map((item, index) => (
            <div key={index} className="flex flex-col mb-2 text-sm">
                {/* Item, qty, price */}
                <div className="flex justify-between items-baseline gap-2">
                    <span className="text-base font-semibold">{item.name} ({item.size})</span>
                    <span className="text-base font-semibold shrink-0">x{item.q}</span>
                    {/* Calculate the total price of the item for the receipt */}
                    <span className="text-xs font-medium">
                        {((item.base_price + (item.modifiers?.reduce((a,m)=>a+m.price, 0) || 0)) * item.q)}$
                    </span>
                </div>
        
                {/* Modification Block */}
                {item.modifiers && item.modifiers.length > 0 && (
                    <div className="pl-3 mt-0.5 space-y-0.5">
                        {item.modifiers.map((mod, mIndex) => (
                            <div key={mIndex} className="text-xs text-zinc-600">
                                + {mod.name} x {mod.count || 1} ({mod.category})
                            </div>
                        ))}
                    </div>
                )}
            </div>
        ))}
        {/* Total */}
        <div className="flex justify-between text-lg font-bold uppercase mb-2">
          <span>Total</span>
          <span>{order.total_price}$</span>
        </div>
      </div>
    </div>
  );
};
import { 
  Card, 
  CardContent, 
  CardFooter, 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

import { Product } from "../../Catalog";

interface Props {
  product: Product;
  onAdd: (product: Product) => void;
}

export default function ProductCard({product, onAdd}: Props) {
    return (
    <Card className="group relative overflow-hidden border-none rounded-2xl bg-white transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
      {/* Image Container */}
      <div className="relative aspect-4/5 w-3/4 overflow-hidden bg-white p-6 flex justify-center items-center mx-auto">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Small item badge */}
        <div className="absolute top-1 right-0.5 rounded-full bg-white text-[10px] font-bold uppercase tracking-widest backdrop-blur-md">
        </div>
      </div>

      <CardContent className="p-4 pb-2">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            {product.categotry}
          </h3>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-black transition-colors ">
              {product.name}
            </h2>
            <span className="text-lg font-light text-slate-700">
              ${product.base_price}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button 
          onClick={() => onAdd(product)}
          className="relative w-full overflow-hidden rounded-lg bg-black py-6 text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-zinc-800 active:scale-[0.98]"
        >
          <Plus className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90" />
          Add to cart
        </Button>
      </CardFooter>
    </Card>
    )
}
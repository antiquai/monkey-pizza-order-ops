import { LayoutDashboard, ShoppingBag, BarChart2, Bike, Clock, Store } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar"
import Image from "next/image"

const items = [
  { title: "Catalog",      value: "catalog",      icon: ShoppingBag  },
  { title: "Dashboard",    value: "dashboard",    icon: LayoutDashboard },
  { title: "Analytics",    value: "analytics",    icon: BarChart2    },
  { title: "Storage",    value: "storage",    icon: Store    },
  { title: "Delivery",     value: "delivery",     icon: Bike         },
  { title: "Time Table",      value: "time",         icon: Clock        },
]

export function SidebarComponent({
  activeTab,
  onTabChange,
}: {
  activeTab: string
  onTabChange: (tab: string) => void
}) {
  return (
    <Sidebar className="border-r border-zinc-100 bg-white w-56">
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>

            {/* Logo header */}
            <div className="flex items-center gap-2.5 px-3 py-4 mb-2">
              <Image
                src="/logo_m.png"
                alt="Logo"
                width={32}
                height={32}
                className="rounded-full"
              />
              <span className="text-[15px] font-bold tracking-tight text-zinc-900">
                Pizza Monkey
              </span>
            </div>

            {/* Nav items */}
            {items.map((item) => (
              <SidebarMenuItem key={item.value}>
                <SidebarMenuButton
                  isActive={activeTab === item.value}
                  onClick={() => onTabChange(item.value)}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium
                    transition-all duration-150 cursor-pointer
                    ${activeTab === item.value
                      ? "bg-zinc-900 text-white hover:bg-zinc-800"
                      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                    }
                  `}
                >
                  <item.icon size={16} />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}

          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
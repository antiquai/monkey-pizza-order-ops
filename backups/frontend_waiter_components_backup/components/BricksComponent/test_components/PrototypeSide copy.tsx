'use client'

import { ShoppingBag, LayoutDashboard, BarChart2, Bike, Clock } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"

const items = [
  { title: "Catalog",   value: "catalog",   icon: ShoppingBag    },
  { title: "Dashboard", value: "dashboard", icon: LayoutDashboard },
  { title: "Analytics", value: "analytics", icon: BarChart2       },
  { title: "Delivery",  value: "delivery",  icon: Bike            },
  { title: "My Time",   value: "time",      icon: Clock           },
]

export function PrototypeSidebarComponent({
  activeTab,
  onTabChange,
}: {
  activeTab: string
  onTabChange: (tab: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <motion.aside
      onHoverStart={() => setOpen(true)}
      onHoverEnd={() => setOpen(false)}
      animate={{ width: open ? 220 : 64 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="
        absolute flex flex-col h-[97vh] shrink-0
        m-3 px-3 py-4 rounded-2xl overflow-hidden
        bg-white/60 backdrop-blur-xl
        border border-white/80
        shadow-[0_8px_32px_rgba(0,0,0,0.08)]
        z-50
      "
    >
      {/* Logo */}
      <div className="flex items-center gap-3 mb-6 px-1 h-9">
        {/* Monkey emoji as logo */}
        <span className="text-[26px] leading-none shrink-0 select-none">🐒</span>

        <AnimatePresence>
          {open && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="text-[14px] font-bold tracking-tight text-zinc-900 whitespace-nowrap overflow-hidden"
            >
              Pizza Monkey
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const isActive = activeTab === item.value
          return (
            <button
              key={item.value}
              onClick={() => onTabChange(item.value)}
              className={`
                relative flex items-center gap-3 px-2 py-2.5 rounded-xl
                w-full text-left transition-colors duration-150
                ${isActive
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-400 hover:bg-black/5 hover:text-zinc-800"
                }
              `}
            >
              {/* Active indicator bar */}
              {isActive && (
                <motion.div
                  layoutId="activeBar"
                  className="absolute inset-0 bg-zinc-900 rounded-xl -z-10"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}

              <item.icon size={18} strokeWidth={1.75} className="shrink-0" />

              <AnimatePresence>
                {open && (
                  <motion.span
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="text-[13px] font-medium whitespace-nowrap overflow-hidden"
                  >
                    {item.title}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          )
        })}
      </nav>
    </motion.aside>
  )
}
'use client'

import { ShoppingBag, LayoutDashboard, BarChart2, Bike, Clock, PowerOff, Store, Banknote, PiggyBank } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"

const items = [
  { title: "Catalog",           value: "catalog",       icon: ShoppingBag     },
  { title: "Dashboard",         value: "dashboard",     icon: LayoutDashboard },
  { title: "Analytics",         value: "analytics",     icon: BarChart2       },
  { title: "Storage",           value: "storage",       icon: Store           },
  { title: "Delivery",          value: "delivery",      icon: Bike            },
  { title: "Time Management",   value: "time",          icon: Clock           },
  { title: "Finance",           value: "finance",       icon: PiggyBank       },
]

interface Shift {
  id: number
  name: string
  opened_at: string
}

interface Props {
  activeTab: string
  onTabChange: (tab: string) => void
  shift: Shift | null
  onCloseShift: () => void
}

export function PrototypeSidebarComponent({ activeTab, onTabChange, shift, onCloseShift }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <motion.aside
      onHoverStart={() => setOpen(true)}
      onHoverEnd={() => setOpen(false)}
      animate={{ width: open ? 220 : 64 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="
        sticky top-3
        flex flex-col self-start shrink-0
        m-3 px-3 py-4 rounded-2xl overflow-hidden
        bg-white/60 backdrop-blur-xl
        border border-white/80
        shadow-[0_8px_32px_rgba(0,0,0,0.08)]
        z-50
      "
    >
      {/* Logo */}
      <div className="flex items-center gap-3 mb-6 px-1 h-9">
        <span className="text-[26px] leading-none shrink-0 select-none">🐒</span>
        <AnimatePresence>
          {open && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="text-[14px] font-bold tracking-tight text-zinc-900 whitespace-nowrap"
            >
              Pizza Monkey
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {items.map(item => {
          const isActive = activeTab === item.value
          return (
            <button
              key={item.value}
              onClick={() => onTabChange(item.value)}
              className={`
                relative flex items-center gap-3 px-2 py-2.5 rounded-xl
                w-full text-left transition-colors duration-150
                ${isActive ? "bg-zinc-900 text-white" : "text-zinc-400 hover:bg-black/5 hover:text-zinc-800"}
              `}
            >
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
                    className="text-[13px] font-medium whitespace-nowrap"
                  >
                    {item.title}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          )
        })}
      </nav>

      {/* Bottom — shift info + close button */}
      <div className="mt-4 pt-3 border-t border-zinc-100 flex flex-col gap-2">

        {/* Shift name — only when expanded */}
        <AnimatePresence>
          {open && shift && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="px-2 py-1"
            >
              <p className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">
                Active shift
              </p>
              <p className="text-[11px] font-black text-zinc-700 truncate">
                {shift.name}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Close shift button */}
        <button
          onClick={onCloseShift}
          className="flex items-center gap-3 px-2 py-2.5 rounded-xl w-full text-left text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors duration-150"
        >
          <PowerOff size={18} strokeWidth={1.75} className="shrink-0" />
          <AnimatePresence>
            {open && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15 }}
                className="text-[13px] font-medium whitespace-nowrap"
              >
                Close Shift
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  )
}
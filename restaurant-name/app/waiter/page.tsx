'use client'

import { useEffect, useState } from "react"

import { Order } from "@/components/WaiterDashboard/WaiterDashboard";

import Catalog from "@/components/Catalog/Beta_Catalog";
import WaiterDashboard from "@/components/WaiterDashboard/WaiterDashboard"
import { PrototypeSidebarComponent } from "@/components/BricksComponent/test_components/PrototypeSide"

import AdminDashboard from "@/components/AdminDashboard/AdminDashboardComponent";
import TimeTableComponent from "@/components/TimeTable/TimeTableComponent";
import Storage from "@/components/StorageTracking/StorageComponent";
import DeliveryComponent from "@/components/DeliveryDashborad/DeliveryComponent";
import FinanceComponent from "@/components/FinanceDashboard/FinanceComponent";

import { useRouter } from "next/navigation"

const GATEWAY_URL = process.env.NEXT_PUBLIC_SERVER_IP

interface Shift {
  id: number
  name: string
  opened_at: string
}


export default function Home() {
  const [activeTab, setActiveTab] = useState('catalog');
  const [shift, setShift] = useState<Shift | null>(null)
  const [orders, setOrders] = useState<Order[]>([])


  const [screen, setScreen] = useState<'welcome' | 'active'>('welcome')
  const [adminError, setAdminError] = useState(false)
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  useEffect(() => {
    fetch(`${GATEWAY_URL}/shift/current`)
      .then(res => res.json())
      .then(data => {
        if (data?.id) {
          setShift(data)
          setScreen('active')
        }
      })
      .catch(() => {})
  }, [])

  const handleAdminLogin = async () => {
    setLoading(true)
      try {
        const res = await fetch(`${GATEWAY_URL}/shift/open`, { method: "POST" })
        if (!res.ok) throw new Error()
        const data = await res.json()
        setShift(data)
        setScreen('active')
      } catch {
        setAdminError(true)
        setTimeout(() => setAdminError(false), 1500)
      } finally {
        setLoading(false)
      }
  }

  const handleCloseShift = async () => {
    if (!confirm("Close the current shift?")) return
    try {
      await fetch(`${GATEWAY_URL}/shift/close`, { method: "POST" })
      setShift(null)
      setOrders([])
      setScreen('welcome')
    } catch {
      console.error("Failed to close shift")
    }
  }

// WELCOME
  if (screen === 'welcome') {
    return (
      <div className="flex w-full h-screen bg-zinc-100 items-center justify-center">
        <div className="flex flex-col items-center gap-4 w-80">
          <span className="text-5xl select-none mb-2">🔐</span>
          <h2 className="text-2xl font-black uppercase tracking-tighter">Admin Login</h2>
          <p className="text-[11px] text-zinc-400 uppercase tracking-widest text-center">
            Enter password to open shift
          </p>
          <button
            onClick={handleAdminLogin}
            disabled={loading}
            className="w-full py-4 bg-black text-white text-sm font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all disabled:opacity-40"
          >
            {loading ? "Opening shift..." : "Start Shift"}
          </button>

          <button
            onClick={() => router.push('/')}
            className="text-xs text-zinc-400 uppercase tracking-widest hover:text-zinc-700 transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full h-auto bg-zinc-100">
      <PrototypeSidebarComponent activeTab={activeTab} onTabChange={setActiveTab} shift={shift} onCloseShift={handleCloseShift}/>
      <main className="flex-1 min-w-0 ">
        {activeTab === 'catalog'    && <Catalog />}
        {activeTab === 'dashboard'  && <WaiterDashboard />}
        {activeTab === 'analytics'  && <AdminDashboard />}
        {activeTab === 'storage'    && <Storage />}
        {activeTab === 'delivery'   && <DeliveryComponent />}
        {activeTab === 'time'       && <TimeTableComponent />}
        {activeTab === 'finance'    && <FinanceComponent />}
      </main>
    </div>
  );
}

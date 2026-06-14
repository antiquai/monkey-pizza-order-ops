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
import Image from "next/image";

const GATEWAY_URL = "http://192.168.2.32:8000"

interface Shift {
  id: number
  name: string
  opened_at: string
}

const ADMIN_PASSWORD = "admin01"

export default function Home() {
  const [activeTab, setActiveTab] = useState('catalog');
  const [shift, setShift] = useState<Shift | null>(null)
  const [orders, setOrders] = useState<Order[]>([])


  const [screen, setScreen] = useState<'welcome' | 'admin_login' | 'active'>('welcome')
  const [adminInput, setAdminInput] = useState("")
  const [adminError, setAdminError] = useState(false)
  const [loading, setLoading] = useState(false)

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
    if (adminInput !== ADMIN_PASSWORD) {
      setAdminError(true)
      setTimeout(() => setAdminError(false), 1500)
      return
    }

    setLoading(true)
      try {
        const res = await fetch(`${GATEWAY_URL}/shift/open`, { method: "POST" })
        if (!res.ok) throw new Error()
        const data = await res.json()
        setShift(data)
        setScreen('active')
        setAdminInput("")
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

// WELCOME screen
  if (screen === 'welcome') {
    return (
      <div className="flex w-full h-screen bg-zinc-100 items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <Image src="/pizza_monkey.svg" alt="logo" width={325} height={325}/>
          <h1 className="text-4xl font-black tracking-tighter uppercase">Pizza Monkey</h1>
          <p className="text-sm text-zinc-400 uppercase tracking-widest font-medium">
            Restaurant POS System
          </p>
          <button
            onClick={() => setScreen('admin_login')}
            className="mt-4 px-12 py-4 bg-black text-white text-sm font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all"
          >
            Start Shift
          </button>
        </div>
      </div>
    )
  }

// Login screen
  if (screen === 'admin_login') {
    return (
      <div className="flex w-full h-screen bg-zinc-100 items-center justify-center">
        <div className="flex flex-col items-center gap-4 w-80">
          <span className="text-5xl select-none mb-2">🔐</span>
          <h2 className="text-2xl font-black uppercase tracking-tighter">Admin Login</h2>
          <p className="text-[11px] text-zinc-400 uppercase tracking-widest text-center">
            Enter password to open shift
          </p>

          <input
            type="password"
            value={adminInput}
            onChange={e => setAdminInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdminLogin()}
            placeholder="Password"
            className={`w-full px-4 py-3 border-2 rounded-xl text-sm font-bold outline-none transition-all ${
              adminError ? 'border-red-400 bg-red-50' : 'border-zinc-200 focus:border-black'
            }`}
          />

          {adminError && (
            <p className="text-xs text-red-500 font-bold uppercase tracking-widest">
              Wrong password
            </p>
          )}

          <button
            onClick={handleAdminLogin}
            disabled={loading}
            className="w-full py-4 bg-black text-white text-sm font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all disabled:opacity-40"
          >
            {loading ? "Opening shift..." : "Confirm"}
          </button>

          <button
            onClick={() => setScreen('welcome')}
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

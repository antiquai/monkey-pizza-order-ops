"use client"

import { TrendingUp, TrendingDown, Users, Activity, BarChart3, Loader2 } from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { useState, useEffect } from "react"

interface VisitorDataPoint {
  date: string
  visitors: number
}

interface StatItem {
  label: string
  value: string
  change: string
  trend: string
  sub: string
  hint: string
}

interface DashboardData {
  visitorData: VisitorDataPoint[]
  stats: StatItem[]
}

type Period = "3m" | "30d" | "7d"

const GATEWAY_URL = "http://192.168.2.32:8000";


export default function AdminDashboard() {
  const [activePeriod, setActivePeriod] = useState<Period>("7d") 
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${GATEWAY_URL}/admin_dashboard/analytics`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch analytics payload")
        return res.json()
      })
      .then((data: DashboardData) => {
        setData(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="h-[97vh] flex items-center justify-center bg-white m-3 rounded-2xl">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
          <p className="text-sm font-medium text-zinc-500">Loading live business metrics...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="h-[97vh] flex items-center justify-center bg-white m-3 rounded-2xl p-8">
        <div className="text-center max-w-sm">
          <p className="text-sm font-bold text-red-500 mb-1">Database Sync Error</p>
          <p className="text-xs text-zinc-500">{error || "Could not retrieve live analytical feeds."}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-[97vh] flex rounded-2xl m-3 bg-white backdrop-blur-xl font-sans overflow-hidden">
      <div className="p-8 w-full max-w-6xl mx-auto overflow-y-auto">
        <h1 className="text-3xl font-black uppercase mb-8 tracking-tighter">Analytics</h1>

        {/* Chart card */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-base font-black text-zinc-900">Total Orders Breakdown</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Frequency sorted sequentially by calendar date</p>
            </div>

            {/* Period toggle */}
            <div className="flex gap-1 bg-zinc-100 p-1 rounded-xl">
              {(["3m", "30d", "7d"] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setActivePeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activePeriod === p
                      ? "bg-white text-zinc-900 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-600"
                  }`}
                >
                  {p === "3m" ? "Last 3 months" : p === "30d" ? "Last 30 days" : "Last 7 days"}
                </button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.visitorData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#a1a1aa" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#a1a1aa" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #f4f4f5",
                  fontSize: "12px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                }}
              />
              <Area
                type="monotone"
                dataKey="visitors"
                stroke="#ef4444"
                strokeWidth={2.5}
                fill="url(#colorVisitors)"
                dot={false}
                activeDot={{ r: 4, fill: "#ef4444" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {data.stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl border border-zinc-100 p-5 flex flex-col gap-3 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500 font-medium">{stat.label}</span>
                <span
                  className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                    stat.trend === "up"
                      ? "bg-green-50 text-green-600"
                      : "bg-red-50 text-red-500"
                  }`}
                >
                  {stat.trend === "up" ? (
                    <TrendingUp size={11} />
                  ) : (
                    <TrendingDown size={11} />
                  )}
                  {stat.change}
                </span>
              </div>

              <span className="text-3xl font-black tracking-tight text-zinc-900">
                {stat.value}
              </span>

              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-zinc-700 flex items-center gap-1">
                  {stat.trend === "up" ? (
                    <TrendingUp size={12} className="text-green-500" />
                  ) : (
                    <TrendingDown size={12} className="text-red-400" />
                  )}
                  {stat.sub}
                </span>
                <span className="text-[11px] text-zinc-400">{stat.hint}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
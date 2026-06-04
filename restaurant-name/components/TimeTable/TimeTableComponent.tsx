"use client"

import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import TableComponent from "./TableComponent"
import { DectructiveAlertComponent } from "./Alert/DesctructiveAlertComponent"

import { toast } from "sonner";

// TODO: Use calendar from shadcn instead of self-wroten

const GATEWAY_URL = "http://192.168.2.35:8000"

export interface StaffMember {
  id: number
  name: string
  color: string
}

export interface TimetableEntry {
  id: number
  day: string
  time_slot: string
  staff_name: string
}

export interface WeekRecord {
  id: number
  week_start: string
  week_end: string
}

const DAYS = ["MON", "DIE", "MIT", "DON", "FRE", "SAM", "SON"]
const TIME_SLOTS = ["11:00", "11:30", "16:30", "16:45", "17:00", "17:30", "18:00"]

type Mode = "view" | "edit"

export default function TimeTableComponent() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [entries, setEntries] = useState<TimetableEntry[]>([])
  const [weeks, setWeeks] = useState<WeekRecord[]>([])
  const [selectedWeek, setSelectedWeek] = useState<WeekRecord | null>(null)
  const [weekDropdownOpen, setWeekDropdownOpen] = useState(false)

  // Create form
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [weekStart, setWeekStart] = useState("")
  const [weekEnd, setWeekEnd] = useState("")
  const [creating, setCreating] = useState(false)

  // Drag
  const [draggedName, setDraggedName] = useState<string | null>(null)
  const [draggedColor, setDraggedColor] = useState<string | null>(null)

  // Mode: view (read-only) or edit
  const [mode, setMode] = useState<Mode>("view")

  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch staff + all weeks on mount
  useEffect(() => {
    fetch(`${GATEWAY_URL}/personal`)
      .then(r => r.json())
      .then(setStaff)
      .catch(console.error)

    fetchWeeks()
  }, [])

  const fetchWeeks = async () => {
    try {
      const res = await fetch(`${GATEWAY_URL}/timetable/weeks`)
      const data = await res.json()
      setWeeks(data)
      // Auto-select the most recent week
      if (data.length > 0) {
        const latest = data[0]
        setSelectedWeek(latest)
        fetchEntries(latest.week_start)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchEntries = async (weekStart: string) => {
    try {
      const res = await fetch(`${GATEWAY_URL}/timetable?week_start=${weekStart}`)
      const data = await res.json()
      setEntries(data)
    } catch (e) {
      console.error(e)
    }
  }

  const handleSelectWeek = (week: WeekRecord) => {
    setSelectedWeek(week)
    setWeekDropdownOpen(false)
    setMode("view")
    fetchEntries(week.week_start)
  }

  const handleCreateTable = async () => {
    if (!weekStart || !weekEnd) return

    // Check if this week already exists
    const exists = weeks.find(w => w.week_start === weekStart)
    if (exists) {
      toast.custom(() => <div className="w-full flex justify-center"><DectructiveAlertComponent /></div>);
      return
    }

    setCreating(true)
    try {
      const res = await fetch(`${GATEWAY_URL}/timetable/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ week_start: weekStart, week_end: weekEnd })
      })
      const newWeek = await res.json()
      await fetchWeeks()
      setSelectedWeek(newWeek)
      setEntries([])
      setMode("edit")
      setShowCreateForm(false)
      setWeekStart("")
      setWeekEnd("")
    } finally {
      setCreating(false)
    }
  }

  const handleDrop = async (day: string, timeSlot: string) => {
    if (!draggedName || !selectedWeek || mode !== "edit") return
    try {
      const res = await fetch(`${GATEWAY_URL}/timetable/entry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week_start: selectedWeek.week_start,
          week_end: selectedWeek.week_end,
          day,
          time_slot: timeSlot,
          staff_name: draggedName
        })
      })
      const newEntry = await res.json()
      setEntries(prev => [...prev, newEntry])
    } catch (e) {
      console.error(e)
    }
    setDraggedName(null)
    setDraggedColor(null)
  }

  const handleRemoveEntry = async (entryId: number) => {
    if (mode !== "edit") return
    await fetch(`${GATEWAY_URL}/timetable/entry/${entryId}`, { method: "DELETE" })
    setEntries(prev => prev.filter(e => e.id !== entryId))
  }

  return (
    <div className="relative min-h-[97vh] flex flex-col rounded-2xl m-3 bg-white font-sans overflow-hidden">
      <div className="flex-1 overflow-y-auto p-8">
        <h1 className="text-3xl font-black uppercase mb-8 tracking-tighter">Timetable</h1>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex flex-col gap-2">

            {/* Week selector */}
            {weeks.length > 0 && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setWeekDropdownOpen(p => !p)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#bde2fd] hover:bg-[#e1f2ff] text-white text-xs font-black rounded-full transition-all"
                >
                  {selectedWeek
                    ? `${selectedWeek.week_start} — ${selectedWeek.week_end}`
                    : "Select week"
                  }
                  <span className={`transition-transform ${weekDropdownOpen ? "rotate-180" : ""}`}>▾</span>
                </button>

                <AnimatePresence>
                  {weekDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full mt-2 left-0 bg-white border border-zinc-100 rounded-2xl shadow-lg z-50 overflow-hidden min-w-[200px]"
                    >
                      {weeks.map(week => (
                        <button
                          key={week.id}
                          onClick={() => handleSelectWeek(week)}
                          className={`w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-zinc-50 transition-colors ${
                            selectedWeek?.id === week.id ? "bg-cyan-50 text-cyan-600" : "text-zinc-700"
                          }`}
                        >
                          {week.week_start} — {week.week_end}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Edit */}
            {selectedWeek && (
              <button
                onClick={() => setMode(m => m === "view" ? "edit" : "view")}
                className={`px-4 py-2 text-xs font-black uppercase rounded-xl border-2 transition-all ${
                  mode === "edit"
                    ? "border-black bg-black text-white"
                    : "border-zinc-200 text-zinc-500 hover:border-black hover:text-black"
                }`}
              >
                {mode === "edit" ? "Submit" : "Edit"}
              </button>
            )}

            {/* Create new week */}
            <button
              onClick={() => setShowCreateForm(p => !p)}
              className="px-4 py-2 text-xs font-black uppercase rounded-xl border-2 border-zinc-200 text-zinc-500 hover:border-black hover:text-black transition-all"
            >
              + New week
            </button>
          </div>
        </div>

        {/* Create form */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="flex items-end gap-3 bg-zinc-50 border border-zinc-200 rounded-2xl p-4 w-fit">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">From</label>
                  <input
                    type="date"
                    value={weekStart}
                    onChange={e => setWeekStart(e.target.value)}
                    className="px-3 py-2 border border-zinc-200 rounded-xl text-sm font-medium outline-none focus:border-black transition-all bg-white"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">To</label>
                  <input
                    type="date"
                    value={weekEnd}
                    onChange={e => setWeekEnd(e.target.value)}
                    className="px-3 py-2 border border-zinc-200 rounded-xl text-sm font-medium outline-none focus:border-black transition-all bg-white"
                  />
                </div>
                <button
                  onClick={handleCreateTable}
                  disabled={!weekStart || !weekEnd || creating}
                  className="px-6 py-2 bg-black text-white text-sm font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all disabled:opacity-40"
                >
                  {creating ? "..." : "Create"}
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-2 bg-white text-black text-sm font-black uppercase tracking-widest rounded-xl hover:bg-[#121212] hover:text-white transition-all disabled:opacity-40"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table */}
        <AnimatePresence mode="wait">
          {selectedWeek && (
            <motion.div
              key={selectedWeek.week_start}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <TableComponent
                days={DAYS}
                timeSlots={TIME_SLOTS}
                entries={entries}
                staff={staff}
                draggedName={draggedName}
                draggedColor={draggedColor}
                onDrop={handleDrop}
                onRemoveEntry={handleRemoveEntry}
                readOnly={mode === "view"}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Staff badges */}
        <AnimatePresence>
          {selectedWeek && mode === "edit" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mt-8"
            >
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold mb-3">
                Drag name to assign
              </p>
              <div className="flex flex-wrap gap-2">
                {staff.map(member => (
                  <div
                    key={member.id}
                    draggable
                    onDragStart={() => {
                      setDraggedName(member.name)
                      setDraggedColor(member.color)
                    }}
                    className="px-4 py-2 rounded-full text-white text-xs font-black uppercase cursor-grab active:cursor-grabbing select-none transition-transform hover:scale-105 active:scale-95"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.name}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {weeks.length === 0 && !showCreateForm && (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <p className="text-zinc-300 text-4xl">📅</p>
            <p className="text-zinc-400 text-sm font-medium uppercase tracking-widest">No timetables yet</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="mt-2 px-6 py-3 bg-black text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all"
            >
              + Create first week
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { StaffMember, TimetableEntry } from "./TimeTableComponent"

interface Props {
  days: string[]
  timeSlots: string[]
  entries: TimetableEntry[]
  staff: StaffMember[]
  draggedName: string | null
  draggedColor: string | null
  onDrop: (day: string, timeSlot: string) => void
  onRemoveEntry: (id: number) => void
  readOnly?: boolean
}

export default function TableComponent({
  days, timeSlots, entries, staff,
  draggedName, draggedColor,
  onDrop, onRemoveEntry, readOnly
}: Props) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null)

  const getEntriesForCell = (day: string, slot: string) =>
    entries.filter(e => e.day === day && e.time_slot === slot)

  const getColor = (name: string) =>
    staff.find(s => s.name === name)?.color ?? "#888"

  const handleDragOver = (e: React.DragEvent, cellKey: string) => {
    e.preventDefault()
    setHoveredCell(cellKey)
  }

  const handleDrop = (e: React.DragEvent, day: string, slot: string) => {
    e.preventDefault()
    setHoveredCell(null)
    onDrop(day, slot)
  }

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-zinc-100 shadow-sm">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {/* Time column header */}
            <th className="w-16 py-3 text-left pl-4 text-[11px] uppercase tracking-widest text-zinc-400 font-bold border-b border-zinc-100 bg-zinc-50 rounded-tl-2xl">
              S
            </th>
            {days.map((day, i) => (
              <th
                key={day}
                className={`py-3 px-2 text-center text-[11px] uppercase tracking-widest text-zinc-600 font-black border-b border-zinc-100 bg-zinc-50 ${
                  i === days.length - 1 ? "rounded-tr-2xl" : ""
                }`}
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {timeSlots.map((slot, slotIdx) => (
            <tr key={slot} className="group">
              {/* Time label */}
              <td className="pl-4 py-1 text-xs font-black text-zinc-400 whitespace-nowrap align-top border-b border-zinc-50 w-16">
                {slot}
              </td>

              {days.map(day => {
                const cellKey = `${day}-${slot}`
                const cellEntries = getEntriesForCell(day, slot)
                const isHovered = hoveredCell === cellKey && draggedName

                return (
                  <td
                    key={cellKey}
                    onDragOver={e => !readOnly && handleDragOver(e, cellKey)}
                    onDragLeave={() => setHoveredCell(null)}
                    onDrop={e => !readOnly && handleDrop(e, day, slot)}
                    className={`
                      px-1 py-1 align-top border-b border-zinc-50
                      transition-colors duration-150 min-w-22.5
                      ${isHovered ? "bg-zinc-100 rounded-xl" : ""}
                    `}
                  >
                    <AnimatePresence>
                      {/* Existing entries */}
                      {cellEntries.map(entry => (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, scale: 0.8, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.7, x: -10 }}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          onClick={() => !readOnly && onRemoveEntry(entry.id)}
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-white text-[10px] font-black uppercase cursor-pointer mr-1 mb-1 hover:opacity-70 transition-opacity select-none ${!readOnly ? "cursor-pointer hover:opacity-70" : "cursor-default"}`}
                          style={{ backgroundColor: getColor(entry.staff_name) }}
                          title="Click to remove"
                        >
                          {entry.staff_name}
                        </motion.div>
                      ))}

                      {/* Drop preview ghost */}
                      {isHovered && draggedName && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 0.5, scale: 1 }}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-white text-[10px] font-black uppercase mr-1 mb-1 pointer-events-none"
                          style={{ backgroundColor: draggedColor ?? "#888" }}
                        >
                          {draggedName}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Empty cell placeholder */}
                    {cellEntries.length === 0 && !isHovered && (
                      <div className="h-5 w-full" />
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
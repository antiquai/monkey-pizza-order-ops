"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PreorderValue {
  is_preorder: boolean;
  scheduled_for_date: string | null;  // "YYYY-MM-DD"
  scheduled_for_time: string | null;  // "HH:MM"
}

interface PreorderBlockProps {
  onChange: (val: PreorderValue) => void;
}

// ─── Drum Column ─────────────────────────────────────────────────────────────

const ITEM_H = 40; // px per item in the drum

interface DrumProps {
  items: string[];
  selected: number;        // index
  onSelect: (idx: number) => void;
  disabled?: boolean;
}

function DrumColumn({ items, selected, onSelect, disabled }: DrumProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startIdx = useRef(selected);

  // Scroll wheel
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (disabled) return;
    e.preventDefault();
    const next = Math.min(items.length - 1, Math.max(0, selected + (e.deltaY > 0 ? 1 : -1)));
    onSelect(next);
  }, [disabled, selected, items.length, onSelect]);

  // Touch / mouse drag
  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    isDragging.current = true;
    startY.current = e.clientY;
    startIdx.current = selected;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || disabled) return;
    const delta = Math.round((startY.current - e.clientY) / ITEM_H);
    const next = Math.min(items.length - 1, Math.max(0, startIdx.current + delta));
    onSelect(next);
  };

  const handlePointerUp = () => { isDragging.current = false; };

  return (
    <div
      className={cn(
        "relative flex flex-col items-center overflow-hidden select-none",
        "h-[200px] w-[72px]",
        disabled && "pointer-events-none"
      )}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Fade top */}
      <div className="absolute top-0 left-0 right-0 h-16 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, white 0%, transparent 100%)" }} />
      {/* Fade bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-16 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to top, white 0%, transparent 100%)" }} />

      {/* Selection highlight */}
      <div className="absolute top-1/2 left-2 right-2 -translate-y-1/2 h-[40px] rounded-lg bg-zinc-100 z-0" />

      {/* Items */}
      <motion.div
        className="flex flex-col items-center"
        animate={{ y: -(selected * ITEM_H) + 80 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {items.map((item, idx) => {
          const dist = Math.abs(idx - selected);
          const opacity = dist === 0 ? 1 : dist === 1 ? 0.45 : 0.2;
          const scale = dist === 0 ? 1 : 0.88;
          return (
            <div
              key={item}
              onClick={() => !disabled && onSelect(idx)}
              className="flex items-center justify-center cursor-pointer"
              style={{ height: ITEM_H, width: 72 }}
            >
              <motion.span
                animate={{ opacity: disabled ? 0.25 : opacity, scale }}
                transition={{ duration: 0.15 }}
                className={cn(
                  "text-xl tabular-nums font-black",
                  idx === selected ? "text-black" : "text-zinc-400"
                )}
              >
                {item}
              </motion.span>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}

interface ToggleProps {
  value: boolean;
  onChange: (v: boolean) => void;
}

function IOSToggle({ value, onChange }: ToggleProps) {
  return (
    <div
      onClick={() => onChange(!value)}
      className={cn(
        "relative w-12 h-7 rounded-full cursor-pointer transition-colors duration-300",
        value ? "bg-black" : "bg-zinc-200"
      )}
    >
      <motion.div
        className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md"
        animate={{ x: value ? 22 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
      />
    </div>
  );
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

const now = new Date();
const DEFAULT_HOUR_IDX = now.getHours();
const DEFAULT_MIN_IDX = Math.round(now.getMinutes() / 5) % 12;

export function PreorderBlock({ onChange }: PreorderBlockProps) {
  const [enabled, setEnabled] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [hourIdx, setHourIdx] = useState(DEFAULT_HOUR_IDX);
  const [minIdx, setMinIdx] = useState(DEFAULT_MIN_IDX);

  const emit = useCallback((
    on: boolean,
    d: Date | undefined,
    h: number,
    m: number
  ) => {
    if (!on) {
      onChange({ is_preorder: false, scheduled_for_date: null, scheduled_for_time: null });
    } else {
      onChange({
        is_preorder: true,
        scheduled_for_date: d ? format(d, "yyyy-MM-dd") : null,
        scheduled_for_time: `${HOURS[h]}:${MINUTES[m]}`,
      });
    }
  }, [onChange]);

  const handleToggle = (v: boolean) => {
    setEnabled(v);
    emit(v, date, hourIdx, minIdx);
  };

  const handleDate = (d: Date | undefined) => {
    setDate(d);
    emit(enabled, d, hourIdx, minIdx);
  };

  const handleHour = (idx: number) => {
    setHourIdx(idx);
    emit(enabled, date, idx, minIdx);
  };

  const handleMin = (idx: number) => {
    setMinIdx(idx);
    emit(enabled, date, hourIdx, idx);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Toggle row */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs font-black uppercase tracking-widest">Preorder</span>
          <span className="text-[10px] text-zinc-400 font-medium">
            {enabled ? "Pick date & time below" : "Order for right now"}
          </span>
        </div>
        <IOSToggle value={enabled} onChange={handleToggle} />
      </div>

      {/* Picker area */}
      <AnimatePresence initial={false}>
        {(
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className={cn(
              "flex flex-col gap-3 transition-opacity duration-200",
              !enabled && "opacity-30 pointer-events-none"
            )}>

              {/* Calendar trigger */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={!enabled}
                    className="w-full justify-start text-left font-bold text-xs rounded-none border-zinc-200 bg-white h-10 hover:bg-zinc-50 uppercase tracking-widest"
                  >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    {date ? format(date, "dd.MM.yyyy") : <span className="text-zinc-400">Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-xl border-zinc-200 shadow-xl" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleDate}
                    disabled={{ before: new Date() }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* Time drums */}
              <div className="flex items-center justify-center gap-1 border border-zinc-100 rounded-xl overflow-hidden bg-white py-2">
                <DrumColumn
                  items={HOURS}
                  selected={hourIdx}
                  onSelect={handleHour}
                  disabled={!enabled}
                />
                <span className="text-2xl font-black text-zinc-300 mb-1">:</span>
                <DrumColumn
                  items={MINUTES}
                  selected={minIdx}
                  onSelect={handleMin}
                  disabled={!enabled}
                />
              </div>

              {/* Summary */}
              {enabled && date && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[10px] text-orange-500 font-bold uppercase tracking-widest text-center"
                >
                  Preorder · {format(date, "dd.MM.yyyy")} · {HOURS[hourIdx]}:{MINUTES[minIdx]}
                </motion.span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "../ui/input";

interface Suggestion {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const GATEWAY_URL = process.env.NEXT_PUBLIC_SERVER_IP

export function AddressAutocomplete({ value, onChange, placeholder }: Props) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const sessionToken = useRef(crypto.randomUUID());

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchSuggestions = async (input: string) => {
    if (input.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(
        `${GATEWAY_URL}/places/autocomplete?input=${encodeURIComponent(input)}&sessiontoken=${sessionToken.current}`
      );
      const data = await res.json();
      
      setSuggestions(
        (data.predictions ?? []).map((p: any) => ({
          place_id: p.place_id,
          description: p.description,
          main_text: p.structured_formatting.main_text,
          secondary_text: p.structured_formatting.secondary_text,
        }))
      );
      setOpen(true);
      setActiveIdx(0);
    } catch {
      /* silent fail */
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 250);
  };

  const handleSelect = (s: Suggestion) => {
    setQuery(s.description);
    onChange(s.description);
    setSuggestions([]);
    setOpen(false);
    sessionToken.current = crypto.randomUUID();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions[activeIdx]) handleSelect(suggestions[activeIdx]);
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full text-zinc-900">
      <Input
        value={query}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder ?? "SHIPPING ADDRESS"}
        className="w-full rounded-xl border-zinc-200 h-10 text-xs font-bold uppercase"
        autoComplete="off"
      />
      
      {open && suggestions.length > 0 && (
        <ul className="absolute z-100 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-zinc-200 shadow-xl rounded-none text-xs">
          {suggestions.map((s, idx) => (
            <li
              key={s.place_id}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(s);
              }}
              className={`flex gap-3 px-3 py-2.5 cursor-pointer border-b border-zinc-100 last:border-0 items-center transition-colors ${
                idx === activeIdx ? "bg-zinc-100 text-black" : "hover:bg-zinc-50 text-zinc-700"
              }`}
            >
              <span className="text-sm shrink-0">📍</span>
              <div className="flex flex-col text-left overflow-hidden">
                <p className="font-black uppercase truncate text-zinc-900">{s.main_text}</p>
                <p className="text-zinc-400 font-medium normal-case truncate">{s.secondary_text}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "../ui/input";
import { Search, Phone, MapPin, User } from "lucide-react";

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (customer: Customer) => void;
}

const GATEWAY_URL = process.env.NEXT_PUBLIC_SERVER_IP;

export function CustomerSearch({ open, onOpenChange, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback((q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    fetch(`${GATEWAY_URL}/customers/search?q=${encodeURIComponent(q)}`)
      .then(res => res.json())
      .then(data => setResults(data))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, []);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  const handleSelect = (c: Customer) => {
    onSelect(c);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl font-black uppercase tracking-tight">
            Find Customer
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              autoFocus
              placeholder="Name or phone number..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="pl-9 rounded-xl border-zinc-200 h-11 text-sm font-medium"
            />
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto px-3 pb-3">
          {loading && (
            <div className="py-8 text-center text-xs text-zinc-400 font-bold uppercase tracking-widest">
              Searching...
            </div>
          )}

          {!loading && query.trim().length >= 2 && results.length === 0 && (
            <div className="py-8 text-center text-xs text-zinc-400 font-bold uppercase tracking-widest">
              No customers found
            </div>
          )}

          {!loading && query.trim().length < 2 && (
            <div className="py-8 text-center text-xs text-zinc-300 font-medium">
              Type at least 2 characters
            </div>
          )}

          {results.map(c => (
            <button
              key={c.id}
              onClick={() => handleSelect(c)}
              className="w-full text-left px-3 py-3 rounded-xl hover:bg-zinc-50 transition-colors flex flex-col gap-1 border-b border-zinc-100 last:border-0"
            >
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                <span className="text-sm font-bold uppercase">{c.name}</span>
              </div>
              {c.phone && (
                <div className="flex items-center gap-2 pl-5.5">
                  <Phone className="h-3 w-3 text-zinc-300 shrink-0" />
                  <span className="text-xs text-zinc-500 font-medium">{c.phone}</span>
                </div>
              )}
              {c.address && (
                <div className="flex items-center gap-2 pl-5.5">
                  <MapPin className="h-3 w-3 text-zinc-300 shrink-0" />
                  <span className="text-xs text-zinc-500 font-medium truncate">{c.address}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
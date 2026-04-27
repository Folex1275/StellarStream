"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, Tag } from "lucide-react";
import { useOrgDirectory, type OrgContact } from "@/lib/use-org-directory";

interface OrgDirectoryComboboxProps {
  value: string;
  onChange: (address: string, contact?: OrgContact) => void;
  placeholder?: string;
  label?: string;
}

export function OrgDirectoryCombobox({ value, onChange, placeholder = "Search name or paste address…", label }: OrgDirectoryComboboxProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const { results, isLoading } = useOrgDirectory(query);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleSelect(c: OrgContact) {
    setQuery(c.name);
    onChange(c.address, c);
    setOpen(false);
  }

  function handleInputChange(v: string) {
    setQuery(v);
    onChange(v);
    setOpen(true);
  }

  return (
    <div ref={containerRef} className="relative">
      {label && <p className="font-body text-[10px] uppercase tracking-widest text-white/30 mb-1.5">{label}</p>}
      <div className={`flex items-center gap-2 rounded-2xl border bg-white/[0.03] px-4 py-3 transition-all duration-200 ${
        focused ? "border-[#00f5ff]/40 shadow-[0_0_0_1px_rgba(0,245,255,0.1)]" : "border-white/10"
      }`}>
        {isLoading
          ? <Loader2 className="h-4 w-4 shrink-0 text-white/30 animate-spin" />
          : <Search className="h-4 w-4 shrink-0 text-white/30" />
        }
        <input
          type="text"
          value={query}
          onChange={e => handleInputChange(e.target.value)}
          onFocus={() => { setFocused(true); if (query) setOpen(true); }}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="flex-1 bg-transparent font-body text-sm text-white/90 outline-none placeholder:text-white/20"
          style={{ caretColor: "#00f5ff" }}
          autoComplete="off"
        />
      </div>

      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-4 }}
            className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl border border-white/10 bg-[#0a0a0f]/95 backdrop-blur-2xl overflow-hidden shadow-xl">
            {results.map((c, i) => (
              <button key={c.id} onMouseDown={() => handleSelect(c)}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.05] ${i > 0 ? "border-t border-white/[0.05]" : ""}`}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#00f5ff]/20 bg-[#00f5ff]/10 text-xs font-bold text-[#00f5ff]">
                  {c.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-medium text-white truncate">{c.name}</p>
                  <p className="font-ticker text-xs text-white/40 truncate mt-0.5">{c.address.slice(0,14)}…</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {c.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 rounded-full border border-[#8a00ff]/25 bg-[#8a00ff]/10 px-1.5 py-0.5 text-[9px] font-medium text-[#c084fc]">
                        <Tag className="h-2.5 w-2.5" />{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

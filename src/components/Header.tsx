"use client";

import { useState } from "react";
import { Plus, ExternalLink, Menu, X } from "lucide-react";

interface Props {
  onNewBooking: () => void;
}

const ECOSYSTEM_LINKS = [
  { label: "EV Exec Main",     href: "https://evexec.co.uk",                    abbr: "evexec.co.uk" },
  { label: "Driver App",       href: "https://evexecdriverapp.vercel.app",       abbr: "Driver App" },
  { label: "Operator Portal",  href: "https://evexecoperator.vercel.app",        abbr: "Operator" },
];

export default function Header({ onNewBooking }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="flex items-center justify-between px-4 pt-4 pb-2">
      {/* Logo */}
      <div className="flex items-center gap-3">
        {/* EV chevron mark */}
        <div className="relative w-9 h-9 flex items-center justify-center">
          <svg viewBox="0 0 36 36" fill="none" className="w-full h-full">
            <polygon
              points="4,28 13,8 18,18 13,18 22,8 31,28"
              stroke="#C9A550"
              strokeWidth="2.5"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>

        <div className="leading-none">
          <div className="text-xs font-black tracking-[0.2em] text-gold uppercase">
            EV EXEC
          </div>
          <div className="text-[9px] font-medium tracking-[0.15em] text-slate-500 uppercase mt-0.5">
            Airport Transfers
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Ecosystem links — desktop */}
        <div className="hidden md:flex items-center gap-1">
          {ECOSYSTEM_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-gold hover:bg-navy-700 transition-colors"
            >
              {link.abbr}
              <ExternalLink size={10} />
            </a>
          ))}
        </div>

        {/* New booking button */}
        <button
          onClick={onNewBooking}
          className="
            flex items-center justify-center w-9 h-9 rounded-full
            bg-gold-gradient text-navy-900 font-bold
            shadow-gold-sm hover:shadow-gold-md active:scale-95
            transition-all
          "
          aria-label="New booking"
        >
          <Plus size={18} strokeWidth={3} />
        </button>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="md:hidden p-2 text-slate-400 hover:text-slate-200"
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="absolute top-16 right-4 z-50 w-48 rounded-xl border border-white/10 bg-navy-800 shadow-card overflow-hidden slide-up md:hidden">
          {ECOSYSTEM_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-between px-4 py-3 text-sm text-slate-300 hover:bg-navy-700 hover:text-gold transition-colors"
            >
              {link.label}
              <ExternalLink size={12} />
            </a>
          ))}
        </div>
      )}
    </header>
  );
}

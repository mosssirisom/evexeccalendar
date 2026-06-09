"use client";

import type { BookingStatus } from "@/lib/types";

interface Props {
  status: BookingStatus;
  compact?: boolean;
}

const CONFIG: Record<
  BookingStatus,
  { label: string; dot: string; bg: string; text: string }
> = {
  pending:            { label: "Pending",          dot: "bg-slate-400",   bg: "bg-slate-800/60",   text: "text-slate-300" },
  assigned:           { label: "Assigned",          dot: "bg-blue-400",    bg: "bg-blue-900/40",    text: "text-blue-300" },
  dispatched:         { label: "Dispatched",        dot: "bg-gold-500",    bg: "bg-gold-900/30",    text: "text-gold-300" },
  at_airport:         { label: "At Airport",        dot: "bg-orange-400",  bg: "bg-orange-900/30",  text: "text-orange-300" },
  passenger_on_board: { label: "Passenger On Board",dot: "bg-purple-400",  bg: "bg-purple-900/30",  text: "text-purple-300" },
  completed:          { label: "Completed",         dot: "bg-emerald-400", bg: "bg-emerald-900/30", text: "text-emerald-300" },
  cancelled:          { label: "Cancelled",         dot: "bg-red-500",     bg: "bg-red-900/30",     text: "text-red-400" },
};

export default function StatusBadge({ status, compact = false }: Props) {
  const { label, dot, bg, text } = CONFIG[status];

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
        {label}
      </span>
    );
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
        ${bg} ${text} border border-white/5
      `}
    >
      <span className={`w-2 h-2 rounded-full ${dot} ${
        ["dispatched","at_airport","passenger_on_board"].includes(status)
          ? "animate-gold-pulse"
          : ""
      }`} />
      {label}
    </span>
  );
}

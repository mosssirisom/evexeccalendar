"use client";

import { Plane, Clock, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { FlightLog } from "@/lib/types";

interface Props {
  flightNumber: string | null;
  terminal: string | null;
  flightLog?: FlightLog | null;
}

const STATUS_MAP = {
  scheduled: {
    icon: Clock,
    label: "Scheduled",
    color: "text-blue-400",
    bg: "bg-blue-900/30",
  },
  delayed: {
    icon: AlertTriangle,
    label: "Delayed",
    color: "text-gold",
    bg: "bg-gold-900/20",
  },
  landed: {
    icon: CheckCircle2,
    label: "Landed",
    color: "text-emerald-400",
    bg: "bg-emerald-900/30",
  },
  cancelled: {
    icon: XCircle,
    label: "Cancelled",
    color: "text-red-400",
    bg: "bg-red-900/30",
  },
};

export default function FlightInfo({ flightNumber, terminal, flightLog }: Props) {
  if (!flightNumber) return null;

  const status = flightLog?.flight_status ?? "scheduled";
  const { icon: Icon, label, color, bg } = STATUS_MAP[status];

  const etaStr = flightLog
    ? format(parseISO(flightLog.estimated_arrival_time), "HH:mm")
    : null;

  const isDelayed =
    flightLog &&
    flightLog.estimated_arrival_time !== flightLog.standard_arrival_time;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${bg} border border-white/5`}>
      <Plane size={13} className={`${color} shrink-0 -rotate-45`} />

      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs font-bold tracking-wide ${color}`}>
          {flightNumber}
        </span>

        {terminal && (
          <span className="text-xs text-slate-400 font-medium">
            {terminal}
          </span>
        )}

        <span className={`flex items-center gap-1 text-xs font-medium ${color}`}>
          <Icon size={10} />
          {label}
        </span>

        {etaStr && (
          <span className="text-xs text-slate-400">
            ETA {etaStr}
            {isDelayed && (
              <span className="text-gold ml-1">
                (was {format(parseISO(flightLog!.standard_arrival_time), "HH:mm")})
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}

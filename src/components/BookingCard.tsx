"use client";

import { useState } from "react";
import {
  Clock, MapPin, Users, Briefcase, Phone,
  ChevronDown, ChevronUp, MessageSquare,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import type { Booking, BookingStatus, Driver, FlightLog } from "@/lib/types";
import StatusBadge from "./StatusBadge";
import DriverDropdown from "./DriverDropdown";
import FlightInfo from "./FlightInfo";
import { formatRoute, formatPrice } from "@/lib/logistics";

interface Props {
  booking: Booking;
  drivers: Driver[];
  flightLog?: FlightLog | null;
  onStatusChange: (bookingId: string, status: BookingStatus) => void;
  onDriverAssign: (bookingId: string, driverId: string | null) => void;
}

const STATUS_FLOW: Record<BookingStatus, BookingStatus | null> = {
  pending:            "assigned",
  assigned:           "dispatched",
  dispatched:         "at_airport",
  at_airport:         "passenger_on_board",
  passenger_on_board: "completed",
  completed:          null,
  cancelled:          null,
};

const NEXT_LABEL: Record<BookingStatus, string> = {
  pending:            "Mark Assigned",
  assigned:           "Mark Dispatched",
  dispatched:         "Mark At Airport",
  at_airport:         "Passenger On Board",
  passenger_on_board: "Complete",
  completed:          "",
  cancelled:          "",
};

export default function BookingCard({
  booking,
  drivers,
  flightLog,
  onStatusChange,
  onDriverAssign,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const pickupTime = format(parseISO(booking.pickup_datetime), "HH:mm");
  const route      = formatRoute(booking.pickup_address, booking.dropoff_address);
  const nextStatus = STATUS_FLOW[booking.status];

  return (
    <div className="rounded-2xl border border-white/8 bg-navy-800 shadow-card overflow-hidden transition-all hover:border-gold/20">
      {/* Top bar — time + status */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-gold/70" />
          <span className="text-xl font-bold text-slate-100 tracking-tight">
            {pickupTime}
          </span>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      {/* Body */}
      <div className="px-4 pt-3 pb-4 space-y-3">
        {/* Customer & Route */}
        <div>
          <p className="font-semibold text-slate-100 text-sm leading-tight">
            {booking.customer_name}
          </p>
          <div className="flex items-start gap-1.5 mt-1">
            <MapPin size={12} className="text-gold/60 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-400 leading-relaxed">{route}</p>
          </div>
        </div>

        {/* Flight info */}
        <FlightInfo
          flightNumber={booking.flight_number}
          terminal={booking.terminal}
          flightLog={flightLog}
        />

        {/* Pax / Luggage / Price row */}
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Users size={11} className="text-gold/60" />
            {booking.passenger_count} pax
          </span>
          <span className="flex items-center gap-1">
            <Briefcase size={11} className="text-gold/60" />
            {booking.luggage_count} bags
          </span>
          <span className="ml-auto font-semibold text-gold text-sm">
            {formatPrice(booking.price)}
          </span>
        </div>

        {/* Driver assignment */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 w-16 shrink-0">Driver</span>
          <DriverDropdown
            drivers={drivers}
            selectedDriverId={booking.driver_id}
            onAssign={(id) => onDriverAssign(booking.id, id)}
            disabled={booking.status === "completed" || booking.status === "cancelled"}
          />
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? "Less details" : "More details"}
        </button>

        {/* Expanded details */}
        {expanded && (
          <div className="space-y-2 pt-1 border-t border-white/5 slide-up">
            <DetailRow label="Pickup" value={booking.pickup_address} />
            <DetailRow label="Drop-off" value={booking.dropoff_address} />
            <div className="flex items-center gap-1.5">
              <Phone size={11} className="text-gold/60 shrink-0" />
              <span className="text-xs text-slate-400">{booking.customer_phone}</span>
            </div>
            {booking.notes && (
              <div className="flex items-start gap-1.5">
                <MessageSquare size={11} className="text-gold/60 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-400 italic">{booking.notes}</span>
              </div>
            )}
          </div>
        )}

        {/* Status advance button */}
        {nextStatus && (
          <button
            onClick={() => onStatusChange(booking.id, nextStatus)}
            className="
              w-full mt-1 py-2 rounded-xl text-xs font-semibold
              bg-gold/10 text-gold border border-gold/25
              hover:bg-gold/20 hover:border-gold/40
              active:scale-[0.98] transition-all
            "
          >
            {NEXT_LABEL[booking.status]}
          </button>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs text-slate-600 w-16 shrink-0 mt-0.5">{label}</span>
      <span className="text-xs text-slate-400 leading-relaxed">{value}</span>
    </div>
  );
}

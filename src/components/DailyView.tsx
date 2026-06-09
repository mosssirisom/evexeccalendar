"use client";

import { format } from "date-fns";
import { Calendar } from "lucide-react";
import type { Booking, BookingStatus, Driver, FlightLog } from "@/lib/types";
import BookingCard from "./BookingCard";

interface Props {
  date: Date;
  bookings: Booking[];
  drivers: Driver[];
  flightLogs: FlightLog[];
  onStatusChange: (bookingId: string, status: BookingStatus) => void;
  onDriverAssign: (bookingId: string, driverId: string | null) => void;
}

export default function DailyView({
  date,
  bookings,
  drivers,
  flightLogs,
  onStatusChange,
  onDriverAssign,
}: Props) {
  const sorted = [...bookings].sort(
    (a, b) =>
      new Date(a.pickup_datetime).getTime() - new Date(b.pickup_datetime).getTime()
  );

  return (
    <div className="space-y-3">
      {/* Date heading */}
      <div className="flex items-center gap-2 py-1">
        <Calendar size={14} className="text-gold/70" />
        <h3 className="text-sm font-semibold text-slate-300">
          {format(date, "EEEE d MMMM yyyy")}
        </h3>
        <span className="ml-auto text-xs text-slate-500">
          {bookings.length} transfer{bookings.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Booking cards */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 rounded-2xl border border-dashed border-white/10 text-slate-600">
          <Calendar size={28} className="mb-2 text-slate-700" />
          <p className="text-sm">No transfers scheduled</p>
          <p className="text-xs mt-1">Tap + to add a booking</p>
        </div>
      ) : (
        sorted.map((booking) => (
          <BookingCard
            key={booking.id}
            booking={booking}
            drivers={drivers}
            flightLog={flightLogs.find((f) => f.booking_id === booking.id)}
            onStatusChange={onStatusChange}
            onDriverAssign={onDriverAssign}
          />
        ))
      )}
    </div>
  );
}

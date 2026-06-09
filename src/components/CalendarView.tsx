"use client";

import { useMemo } from "react";
import {
  startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, format, isSameDay, isToday, isSameMonth,
  addMonths, subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plane, Car } from "lucide-react";
import type { DbBooking } from "@/lib/database.types";
type CalendarBookingMap = Record<string, DbBooking[]>;

interface Props {
  currentMonth: Date;
  bookings: DbBooking[];
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  onMonthChange: (date: Date) => void;
}

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

/** Returns 0 (Mon) – 6 (Sun) — ISO weekday convention */
function isoWeekday(date: Date): number {
  return (getDay(date) + 6) % 7;
}

export default function CalendarView({
  currentMonth,
  bookings,
  selectedDate,
  onDateSelect,
  onMonthChange,
}: Props) {
  // Build a map of dateStr → bookings for quick lookup
  const bookingMap = useMemo<CalendarBookingMap>(() => {
    const map: CalendarBookingMap = {};
    for (const b of bookings) {
      if (!b.travel_date) continue;
      const key = b.travel_date.slice(0, 10); // YYYY-MM-DD
      if (!map[key]) map[key] = [];
      map[key].push(b);
    }
    return map;
  }, [bookings]);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end:   endOfMonth(currentMonth),
  });

  // Leading empty cells so the grid aligns to Mon
  const leadingBlanks = isoWeekday(days[0]);

  const cells: Array<Date | null> = [
    ...Array(leadingBlanks).fill(null),
    ...days,
  ];

  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const monthTotal = bookings
    .filter((b) => {
      if (!b.travel_date) return false;
      const d = new Date(b.travel_date);
      return isSameMonth(d, currentMonth) && b.status !== "Cancelled";
    })
    .reduce((sum, b) => sum + (b.quoted_price ?? 0), 0);

  return (
    <div className="flex flex-col gap-3">
      {/* Month header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monthly total{" "}
            <span className="text-gold font-semibold">
              £{monthTotal.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onMonthChange(subMonths(currentMonth, 1))}
            className="p-2 rounded-lg hover:bg-navy-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => onMonthChange(addMonths(currentMonth, 1))}
            className="p-2 rounded-lg hover:bg-navy-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Confirmed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gold" />
          Pending
        </span>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 text-center">
        {DAYS.map((d) => (
          <div key={d} className="text-[10px] font-semibold text-slate-600 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`blank-${i}`} />;

          const dateKey     = format(day, "yyyy-MM-dd");
          const dayBookings = bookingMap[dateKey] ?? [];
          const isSelected  = selectedDate ? isSameDay(day, selectedDate) : false;
          const isTodayDate = isToday(day);

          const confirmedCount = dayBookings.filter(
            (b) => !["Unassigned", "Cancelled"].includes(b.status)
          ).length;
          const pendingCount = dayBookings.filter(
            (b) => b.status === "Unassigned" || b.status === "Unassigned / Missed Call Recovery"
          ).length;

          // Pick indicator icon — airport vs city run
          const hasAirport = dayBookings.some(
            (b) => b.flight_number !== null
          );

          return (
            <button
              key={dateKey}
              onClick={() => onDateSelect(day)}
              className={`
                relative flex flex-col items-center justify-start
                py-2 px-1 rounded-xl transition-all
                ${isSelected
                  ? "bg-gold text-navy-900 shadow-gold-md"
                  : isTodayDate
                  ? "bg-navy-700 text-slate-100 ring-1 ring-gold/40"
                  : "text-slate-400 hover:bg-navy-700 hover:text-slate-200"
                }
              `}
            >
              <span
                className={`text-sm font-semibold leading-none mb-1.5 ${
                  isSelected ? "text-navy-900" : ""
                }`}
              >
                {format(day, "d")}
              </span>

              {/* Booking indicators */}
              {dayBookings.length > 0 && (
                <div className="flex flex-col items-center gap-0.5">
                  {hasAirport ? (
                    <Plane
                      size={9}
                      className={
                        isSelected ? "text-navy-800" : "text-gold/80"
                      }
                    />
                  ) : (
                    <Car
                      size={9}
                      className={
                        isSelected ? "text-navy-800" : "text-slate-400"
                      }
                    />
                  )}

                  {/* Dots for confirmed / pending */}
                  <div className="flex gap-0.5">
                    {confirmedCount > 0 && (
                      <span
                        className={`w-1 h-1 rounded-full ${
                          isSelected ? "bg-navy-800" : "bg-emerald-500"
                        }`}
                      />
                    )}
                    {pendingCount > 0 && (
                      <span
                        className={`w-1 h-1 rounded-full ${
                          isSelected ? "bg-navy-700" : "bg-gold"
                        }`}
                      />
                    )}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

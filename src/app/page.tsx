"use client";

import { useState, useCallback, useMemo } from "react";
import { isSameDay, isSameMonth, parseISO } from "date-fns";
import { LayoutList, CalendarDays, Users, ExternalLink } from "lucide-react";
import type { Booking, BookingStatus, Driver } from "@/lib/types";
import { MOCK_BOOKINGS, MOCK_DRIVERS, MOCK_FLIGHT_LOGS, JUNE_2026_STATS } from "@/data/mockData";
import { checkDriverClash } from "@/lib/logistics";

import Header from "@/components/Header";
import CalendarView from "@/components/CalendarView";
import DailyView from "@/components/DailyView";
import StatsBar from "@/components/StatsBar";
import AddBookingModal from "@/components/AddBookingModal";

type Tab = "calendar" | "transfers" | "fleet";

export default function Dashboard() {
  const [bookings, setBookings]   = useState<Booking[]>(MOCK_BOOKINGS);
  const [drivers]                 = useState<Driver[]>(MOCK_DRIVERS);
  const [currentMonth, setMonth]  = useState<Date>(new Date("2026-06-01"));
  const [selectedDate, setDate]   = useState<Date | null>(new Date("2026-06-09"));
  const [activeTab, setTab]       = useState<Tab>("calendar");
  const [showAddModal, setAdd]    = useState(false);
  const [clashWarning, setClash]  = useState<string | null>(null);

  // Bookings for the selected day
  const dayBookings = useMemo(() => {
    if (!selectedDate) return [];
    return bookings.filter((b) =>
      isSameDay(parseISO(b.pickup_datetime), selectedDate)
    );
  }, [bookings, selectedDate]);

  // Stats for the current month
  const monthStats = useMemo(() => {
    const monthBks = bookings.filter(
      (b) =>
        isSameMonth(parseISO(b.pickup_datetime), currentMonth) &&
        b.status !== "cancelled"
    );
    const revenue = monthBks.reduce((sum, b) => sum + b.price, 0);
    const destinations = new Set(monthBks.map((b) => b.dropoff_address)).size;

    return {
      bookingCount:     monthBks.length,
      totalHours:       JUNE_2026_STATS.totalHours,
      destinationCount: destinations,
      revenue,
    };
  }, [bookings, currentMonth]);

  // ─── Status update ──────────────────────────────────────────────────────────
  const handleStatusChange = useCallback(
    (bookingId: string, status: BookingStatus) => {
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
      );
    },
    []
  );

  // ─── Driver assignment (with clash check) ───────────────────────────────────
  const handleDriverAssign = useCallback(
    (bookingId: string, driverId: string | null) => {
      const booking = bookings.find((b) => b.id === bookingId);
      if (!booking) return;

      if (driverId) {
        const clash = checkDriverClash(driverId, bookings, booking.pickup_datetime);
        if (clash) {
          setClash(
            `Driver clash detected with booking for ${clash.customer_name} at ${clash.pickup_datetime.slice(11, 16)}`
          );
          setTimeout(() => setClash(null), 4000);
          return;
        }
      }

      const driver = driverId ? drivers.find((d) => d.id === driverId) ?? null : null;

      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? {
                ...b,
                driver_id: driverId,
                driver,
                status: driverId && b.status === "pending" ? "assigned" : b.status,
              }
            : b
        )
      );
    },
    [bookings, drivers]
  );

  // ─── New booking ────────────────────────────────────────────────────────────
  const handleAddBooking = useCallback(
    (data: Omit<Booking, "id" | "created_at" | "driver">) => {
      const driver = data.driver_id
        ? drivers.find((d) => d.id === data.driver_id) ?? null
        : null;

      const newBooking: Booking = {
        ...data,
        id:         crypto.randomUUID(),
        driver,
        created_at: new Date().toISOString(),
      };

      setBookings((prev) => [newBooking, ...prev]);
      setAdd(false);

      // Navigate to the booking's date
      const bookingDate = parseISO(newBooking.pickup_datetime);
      setMonth(new Date(bookingDate.getFullYear(), bookingDate.getMonth(), 1));
      setDate(bookingDate);
      setTab("calendar");
    },
    [drivers]
  );

  // ─── All upcoming transfers (sorted) ────────────────────────────────────────
  const upcomingBookings = useMemo(() => {
    const now = new Date();
    return [...bookings]
      .filter((b) => new Date(b.pickup_datetime) >= now && b.status !== "cancelled")
      .sort((a, b) => new Date(a.pickup_datetime).getTime() - new Date(b.pickup_datetime).getTime());
  }, [bookings]);

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col">
      {/* ── Sticky header ── */}
      <div className="relative z-30 bg-navy-900 border-b border-white/5">
        <Header onNewBooking={() => setAdd(true)} />

        {/* Tab bar */}
        <nav className="flex px-4 gap-1 pb-2 mt-1">
          {(
            [
              { id: "calendar",  label: "Calendar",   icon: CalendarDays },
              { id: "transfers", label: "Transfers",   icon: LayoutList },
              { id: "fleet",     label: "Fleet",       icon: Users },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all
                ${activeTab === id
                  ? "bg-gold/15 text-gold border border-gold/25"
                  : "text-slate-500 hover:text-slate-300"
                }
              `}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Clash warning toast ── */}
      {clashWarning && (
        <div className="mx-4 mt-3 px-4 py-2.5 rounded-xl bg-red-900/60 border border-red-500/30 text-sm text-red-300 fade-in">
          ⚠ {clashWarning}
        </div>
      )}

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

          {/* ── CALENDAR TAB ── */}
          {activeTab === "calendar" && (
            <>
              <CalendarView
                currentMonth={currentMonth}
                bookings={bookings}
                selectedDate={selectedDate}
                onDateSelect={(d) => {
                  setDate(d);
                  setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
                }}
                onMonthChange={setMonth}
              />

              <StatsBar stats={monthStats} />

              {/* Daily view — inline below calendar */}
              {selectedDate && (
                <DailyView
                  date={selectedDate}
                  bookings={dayBookings}
                  drivers={drivers}
                  flightLogs={MOCK_FLIGHT_LOGS}
                  onStatusChange={handleStatusChange}
                  onDriverAssign={handleDriverAssign}
                />
              )}

              {/* View Upcoming CTA */}
              <button
                onClick={() => setTab("transfers")}
                className="
                  w-full flex items-center justify-center gap-2 py-4 rounded-2xl
                  border border-gold/20 bg-navy-800 text-sm font-semibold text-gold
                  hover:bg-gold/10 hover:border-gold/40 active:scale-[0.99]
                  transition-all shadow-card
                "
              >
                <CalendarDays size={15} />
                View Upcoming Transfers
              </button>
            </>
          )}

          {/* ── TRANSFERS TAB ── */}
          {activeTab === "transfers" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-100">All Transfers</h2>
                <span className="text-xs text-slate-500">
                  {upcomingBookings.length} upcoming
                </span>
              </div>

              {upcomingBookings.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-slate-600">
                  <LayoutList size={32} className="mb-2 text-slate-700" />
                  <p className="text-sm">No upcoming transfers</p>
                </div>
              ) : (
                upcomingBookings.map((booking) => (
                  <div key={booking.id}>
                    {/* Date divider */}
                    <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-2 pt-1">
                      {new Date(booking.pickup_datetime).toLocaleDateString("en-GB", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </div>
                    <div
                      key={booking.id}
                      className="rounded-2xl border border-white/8 bg-navy-800 shadow-card overflow-hidden"
                    >
                      {/* Compact transfer row */}
                      <div className="px-4 py-3 flex items-center gap-3">
                        <div className="text-center min-w-[44px]">
                          <div className="text-base font-bold text-slate-100">
                            {new Date(booking.pickup_datetime).toLocaleTimeString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-200 truncate">
                            {booking.customer_name}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {booking.pickup_address.split(",")[0]} →{" "}
                            {booking.dropoff_address.split(",")[0]}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className="text-xs font-bold text-gold">
                            £{booking.price}
                          </span>
                          <StatusBadgeInline status={booking.status} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── FLEET TAB ── */}
          {activeTab === "fleet" && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-slate-100">Fleet Overview</h2>

              {drivers.map((driver) => {
                const assigned = bookings.filter(
                  (b) =>
                    b.driver_id === driver.id &&
                    !["completed", "cancelled"].includes(b.status)
                ).length;

                return (
                  <div
                    key={driver.id}
                    className="rounded-2xl border border-white/8 bg-navy-800 px-4 py-4 shadow-card"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-navy-700 border border-gold/20 flex items-center justify-center text-sm font-bold text-gold shrink-0">
                        {driver.name.split(" ").map((n) => n[0]).join("")}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-100 text-sm">
                          {driver.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {driver.vehicle_details.make} {driver.vehicle_details.model}
                        </p>
                        <p className="text-xs text-slate-600 font-mono mt-0.5">
                          {driver.vehicle_details.reg}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            driver.status === "active"
                              ? "bg-emerald-900/40 text-emerald-400"
                              : "bg-slate-800 text-slate-500"
                          }`}
                        >
                          {driver.status}
                        </span>
                        {assigned > 0 && (
                          <span className="text-xs text-gold font-medium">
                            {assigned} active
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/5">
                      <div className="text-center">
                        <div className="text-sm font-bold text-slate-200">
                          {bookings.filter((b) => b.driver_id === driver.id && b.status === "completed").length}
                        </div>
                        <div className="text-[10px] text-slate-600 mt-0.5">Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-gold">
                          £{bookings
                            .filter((b) => b.driver_id === driver.id && b.status === "completed")
                            .reduce((s, b) => s + b.price, 0)
                            .toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-600 mt-0.5">Revenue</div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Ecosystem links */}
              <div className="rounded-2xl border border-white/8 bg-navy-800 px-4 py-4 space-y-2 shadow-card">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  EV Exec Ecosystem
                </p>
                {[
                  { label: "EV Exec Main Site",    href: "https://evexec.co.uk" },
                  { label: "Driver App",            href: "https://evexecdriverapp.vercel.app" },
                  { label: "Operator Portal",       href: "https://evexecoperator.vercel.app" },
                ].map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-navy-700 hover:bg-navy-600 border border-white/5 hover:border-gold/20 transition-all group"
                  >
                    <span className="text-sm text-slate-300 group-hover:text-gold transition-colors">
                      {link.label}
                    </span>
                    <ExternalLink size={13} className="text-slate-600 group-hover:text-gold/60 transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Add Booking Modal ── */}
      {showAddModal && (
        <AddBookingModal
          drivers={drivers}
          defaultDate={selectedDate ?? new Date()}
          onSave={handleAddBooking}
          onClose={() => setAdd(false)}
        />
      )}
    </div>
  );
}

// ─── Inline compact status badge used in the transfers list ──────────────────
function StatusBadgeInline({ status }: { status: BookingStatus }) {
  const MAP: Record<BookingStatus, { label: string; cls: string }> = {
    pending:            { label: "Pending",   cls: "text-slate-400 bg-slate-800/50" },
    assigned:           { label: "Assigned",  cls: "text-blue-400 bg-blue-900/30" },
    dispatched:         { label: "En Route",  cls: "text-gold bg-gold/10" },
    at_airport:         { label: "Airport",   cls: "text-orange-400 bg-orange-900/20" },
    passenger_on_board: { label: "On Board",  cls: "text-purple-400 bg-purple-900/20" },
    completed:          { label: "Done",      cls: "text-emerald-400 bg-emerald-900/20" },
    cancelled:          { label: "Cancelled", cls: "text-red-400 bg-red-900/20" },
  };
  const { label, cls } = MAP[status];
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      {label}
    </span>
  );
}


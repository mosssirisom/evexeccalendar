"use client";

import { useState, useMemo } from "react";
import { parseISO, isSameDay, isSameMonth } from "date-fns";
import { LayoutList, CalendarDays, Users, ExternalLink, Wifi, WifiOff } from "lucide-react";
import type { DbBooking, BookingStatus } from "@/lib/database.types";
import { useBookings } from "@/hooks/useBookings";
import { useDrivers } from "@/hooks/useDrivers";

import Header from "@/components/Header";
import CalendarView from "@/components/CalendarView";
import DailyView from "@/components/DailyView";
import StatsBar from "@/components/StatsBar";
import AddBookingModal from "@/components/AddBookingModal";
import StatusBadge from "@/components/StatusBadge";

type Tab = "calendar" | "transfers" | "fleet";

export default function Dashboard() {
  const { bookings, loading, error, updateStatus, assignDriver, createBooking } = useBookings();
  const { drivers } = useDrivers();

  const [currentMonth, setMonth]  = useState<Date>(new Date());
  const [selectedDate, setDate]   = useState<Date | null>(new Date());
  const [activeTab, setTab]       = useState<Tab>("calendar");
  const [showAddModal, setAdd]    = useState(false);
  const [clashWarning, setClash]  = useState<string | null>(null);

  // Bookings for the selected day
  const dayBookings = useMemo(() => {
    if (!selectedDate) return [];
    return bookings.filter((b) =>
      b.travel_date && isSameDay(parseISO(b.travel_date), selectedDate)
    );
  }, [bookings, selectedDate]);

  // Stats for current month
  const monthStats = useMemo(() => {
    const month = bookings.filter((b) => {
      if (!b.travel_date) return false;
      return isSameMonth(parseISO(b.travel_date), currentMonth) && b.status !== "Cancelled";
    });
    const revenue      = month.reduce((s, b) => s + (b.quoted_price ?? 0), 0);
    const destinations = new Set(month.map((b) => b.dropoff_address).filter(Boolean)).size;
    const unassigned   = month.filter((b) =>
      b.status === "Unassigned" || b.status === "Unassigned / Missed Call Recovery"
    ).length;
    return { bookingCount: month.length, unassignedCount: unassigned, destinationCount: destinations, revenue };
  }, [bookings, currentMonth]);

  // Upcoming bookings for the transfers tab
  const upcomingBookings = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return [...bookings]
      .filter((b) => b.travel_date && b.travel_date >= today && b.status !== "Cancelled")
      .sort((a, b) => {
        const da = `${a.travel_date}T${a.travel_time ?? "00:00"}`;
        const db = `${b.travel_date}T${b.travel_time ?? "00:00"}`;
        return da.localeCompare(db);
      });
  }, [bookings]);

  const handleStatusChange = (ref: string, status: BookingStatus) => {
    updateStatus(ref, status);
  };

  const handleDriverAssign = (ref: string, driverId: string | null) => {
    // Check for clash among active bookings for that driver
    if (driverId) {
      const booking = bookings.find((b) => b.ref === ref);
      if (booking?.travel_date && booking.travel_time) {
        const clash = bookings.find(
          (b) =>
            b.ref !== ref &&
            b.driver_id === driverId &&
            b.travel_date === booking.travel_date &&
            !["Completed", "Cancelled"].includes(b.status)
        );
        if (clash) {
          setClash(`Driver already has a job on ${clash.travel_date} at ${clash.travel_time?.slice(0, 5)}`);
          setTimeout(() => setClash(null), 4000);
          return;
        }
      }
    }
    assignDriver(ref, driverId);
  };

  const handleAddBooking = async (data: Omit<DbBooking, "ref" | "created_at" | "updated_at" | "drivers">) => {
    await createBooking(data);
    setAdd(false);
    if (data.travel_date) {
      const d = parseISO(data.travel_date);
      setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
      setDate(d);
      setTab("calendar");
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col">
      {/* Header */}
      <div className="relative z-30 bg-navy-900 border-b border-white/5">
        <Header onNewBooking={() => setAdd(true)} />

        {/* Live sync indicator */}
        <div className="flex items-center gap-1.5 px-4 py-1.5 border-b border-white/5">
          {error ? (
            <>
              <WifiOff size={10} className="text-red-400" />
              <span className="text-[10px] text-red-400">Offline — showing cached data</span>
            </>
          ) : (
            <>
              <Wifi size={10} className="text-emerald-400" />
              <span className="text-[10px] text-emerald-500">Live sync · evexec.co.uk</span>
            </>
          )}
        </div>

        {/* Tab bar */}
        <nav className="flex px-4 gap-1 py-2">
          {(
            [
              { id: "calendar",  label: "Calendar",  icon: CalendarDays },
              { id: "transfers", label: "Transfers",  icon: LayoutList },
              { id: "fleet",     label: "Fleet",      icon: Users },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === id
                  ? "bg-gold/15 text-gold border border-gold/25"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Clash warning */}
      {clashWarning && (
        <div className="mx-4 mt-3 px-4 py-2.5 rounded-xl bg-red-900/60 border border-red-500/30 text-sm text-red-300 fade-in">
          ⚠ {clashWarning}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="flex items-center justify-center py-12 text-slate-600 text-sm gap-2">
          <span className="w-4 h-4 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
          Loading live data…
        </div>
      )}

      {/* Main */}
      {!loading && (
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

                {selectedDate && (
                  <DailyView
                    date={selectedDate}
                    bookings={dayBookings}
                    drivers={drivers}
                    onStatusChange={handleStatusChange}
                    onDriverAssign={handleDriverAssign}
                  />
                )}

                <button
                  onClick={() => setTab("transfers")}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-gold/20 bg-navy-800 text-sm font-semibold text-gold hover:bg-gold/10 hover:border-gold/40 active:scale-[0.99] transition-all shadow-card"
                >
                  <CalendarDays size={15} />
                  View Upcoming Transfers
                </button>
              </>
            )}

            {/* ── TRANSFERS TAB ── */}
            {activeTab === "transfers" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold text-slate-100">Upcoming Transfers</h2>
                  <span className="text-xs text-slate-500">{upcomingBookings.length} total</span>
                </div>

                {upcomingBookings.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-slate-600">
                    <LayoutList size={32} className="mb-2 text-slate-700" />
                    <p className="text-sm">No upcoming transfers</p>
                  </div>
                ) : (
                  upcomingBookings.map((b) => (
                    <div key={b.ref} className="rounded-2xl border border-white/8 bg-navy-800 px-4 py-3 flex items-center gap-3 shadow-card">
                      <div className="text-center min-w-[44px]">
                        <div className="text-base font-bold text-slate-100">{b.travel_time?.slice(0, 5) ?? "—"}</div>
                        <div className="text-[10px] text-slate-600">{b.travel_date?.slice(5) ?? ""}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-200 truncate">{b.customer_name}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {(b.airport ?? "").split(",")[0]} → {(b.dropoff_address ?? "").split(",")[0]}
                        </p>
                        {b.flight_number && (
                          <p className="text-[10px] text-blue-400 font-mono mt-0.5">{b.flight_number}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="text-xs font-bold text-gold">
                          {b.quoted_price != null ? `£${b.quoted_price}` : "TBC"}
                        </span>
                        <StatusBadge status={b.status} compact />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── FLEET TAB ── */}
            {activeTab === "fleet" && (
              <div className="space-y-3">
                <h2 className="text-lg font-bold text-slate-100">Fleet</h2>

                {drivers.map((d) => {
                  const active    = bookings.filter((b) => b.driver_id === d.id && !["Completed", "Cancelled"].includes(b.status)).length;
                  const completed = bookings.filter((b) => b.driver_id === d.id && b.status === "Completed").length;
                  const revenue   = bookings.filter((b) => b.driver_id === d.id && b.status === "Completed").reduce((s, b) => s + (b.quoted_price ?? 0), 0);

                  return (
                    <div key={d.id} className="rounded-2xl border border-white/8 bg-navy-800 px-4 py-4 shadow-card">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-navy-700 border border-gold/20 flex items-center justify-center text-sm font-bold text-gold shrink-0">
                          {d.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-100 text-sm">{d.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{d.vehicle ?? "—"}</p>
                          {d.plate && <p className="text-xs text-slate-600 font-mono mt-0.5">{d.plate}</p>}
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            d.status === "active" || d.status === "Available"
                              ? "bg-emerald-900/40 text-emerald-400"
                              : "bg-slate-800 text-slate-500"
                          }`}>
                            {d.status ?? "—"}
                          </span>
                          {active > 0 && <span className="text-xs text-gold font-medium">{active} active</span>}
                          {d.rating != null && (
                            <span className="text-xs text-slate-500">★ {d.rating.toFixed(1)}</span>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/5">
                        <div className="text-center">
                          <div className="text-sm font-bold text-slate-200">{completed}</div>
                          <div className="text-[10px] text-slate-600 mt-0.5">Completed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-bold text-gold">£{revenue.toLocaleString()}</div>
                          <div className="text-[10px] text-slate-600 mt-0.5">Revenue</div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Ecosystem links */}
                <div className="rounded-2xl border border-white/8 bg-navy-800 px-4 py-4 space-y-2 shadow-card">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">EV Exec Ecosystem</p>
                  {[
                    { label: "EV Exec Main Site",   href: "https://evexec.co.uk" },
                    { label: "Driver App",           href: "https://evexecdriverapp.vercel.app" },
                    { label: "Operator Portal",      href: "https://evexecoperator.vercel.app" },
                  ].map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-navy-700 hover:bg-navy-600 border border-white/5 hover:border-gold/20 transition-all group"
                    >
                      <span className="text-sm text-slate-300 group-hover:text-gold transition-colors">{link.label}</span>
                      <ExternalLink size={13} className="text-slate-600 group-hover:text-gold/60 transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            )}

          </div>
        </main>
      )}

      {/* Add Booking Modal */}
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

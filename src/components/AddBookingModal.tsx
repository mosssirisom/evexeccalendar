"use client";

import { useState } from "react";
import { X, Plane, MapPin, Users, Calendar, type LucideIcon } from "lucide-react";
import { format } from "date-fns";
import type { Booking, Driver } from "@/lib/types";

interface Props {
  drivers: Driver[];
  defaultDate?: Date;
  onSave: (booking: Omit<Booking, "id" | "created_at" | "driver">) => void;
  onClose: () => void;
}

export default function AddBookingModal({
  drivers,
  defaultDate,
  onSave,
  onClose,
}: Props) {
  const today = defaultDate ?? new Date();
  const dateStr = format(today, "yyyy-MM-dd");

  const [form, setForm] = useState({
    pickup_date:       dateStr,
    pickup_time:       "09:00",
    customer_name:     "",
    customer_phone:    "",
    customer_email:    "",
    pickup_address:    "",
    dropoff_address:   "",
    passenger_count:   1,
    luggage_count:     1,
    flight_number:     "",
    terminal:          "",
    driver_id:         "",
    price:             "",
    notes:             "",
  });

  const set = (key: string, val: string | number) =>
    setForm((f) => ({ ...f, [key]: val }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const pickup_datetime = `${form.pickup_date}T${form.pickup_time}:00Z`;

    onSave({
      pickup_datetime,
      customer_name:   form.customer_name,
      customer_phone:  form.customer_phone,
      customer_email:  form.customer_email,
      pickup_address:  form.pickup_address,
      dropoff_address: form.dropoff_address,
      passenger_count: Number(form.passenger_count),
      luggage_count:   Number(form.luggage_count),
      flight_number:   form.flight_number || null,
      terminal:        form.terminal      || null,
      status:          "pending",
      driver_id:       form.driver_id     || null,
      price:           Number(form.price) || 0,
      notes:           form.notes         || null,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md bg-navy-800 rounded-2xl border border-white/10 shadow-card overflow-y-auto max-h-[90vh] slide-up"
      >
        {/* Header */}
        <div className="sticky top-0 bg-navy-800 border-b border-white/8 px-5 py-4 flex items-center justify-between z-10">
          <h2 className="text-base font-bold text-slate-100">New Transfer</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-navy-700"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Date & Time */}
          <section>
            <SectionLabel icon={Calendar} label="Pick-up Date & Time" />
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Input
                type="date"
                value={form.pickup_date}
                onChange={(v) => set("pickup_date", v)}
                required
              />
              <Input
                type="time"
                value={form.pickup_time}
                onChange={(v) => set("pickup_time", v)}
                required
              />
            </div>
          </section>

          {/* Customer */}
          <section>
            <SectionLabel icon={Users} label="Customer" />
            <div className="space-y-2 mt-2">
              <Input
                placeholder="Full name *"
                value={form.customer_name}
                onChange={(v) => set("customer_name", v)}
                required
              />
              <Input
                placeholder="Phone number *"
                type="tel"
                value={form.customer_phone}
                onChange={(v) => set("customer_phone", v)}
                required
              />
              <Input
                placeholder="Email address"
                type="email"
                value={form.customer_email}
                onChange={(v) => set("customer_email", v)}
              />
            </div>
          </section>

          {/* Addresses */}
          <section>
            <SectionLabel icon={MapPin} label="Route" />
            <div className="space-y-2 mt-2">
              <Input
                placeholder="Pickup address *"
                value={form.pickup_address}
                onChange={(v) => set("pickup_address", v)}
                required
              />
              <Input
                placeholder="Drop-off address *"
                value={form.dropoff_address}
                onChange={(v) => set("dropoff_address", v)}
                required
              />
            </div>
          </section>

          {/* Pax & Luggage */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Passengers</label>
              <input
                type="number"
                min={1}
                max={16}
                value={form.passenger_count}
                onChange={(e) => set("passenger_count", e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Luggage</label>
              <input
                type="number"
                min={0}
                value={form.luggage_count}
                onChange={(e) => set("luggage_count", e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Flight */}
          <section>
            <SectionLabel icon={Plane} label="Flight (optional)" />
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Input
                placeholder="Flight no. e.g. BA1490"
                value={form.flight_number}
                onChange={(v) => set("flight_number", v)}
              />
              <Input
                placeholder="Terminal e.g. T2"
                value={form.terminal}
                onChange={(v) => set("terminal", v)}
              />
            </div>
          </section>

          {/* Driver & Price */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Driver</label>
              <select
                value={form.driver_id}
                onChange={(e) => set("driver_id", e.target.value)}
                className={inputCls}
              >
                <option value="">Unassigned</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Price (£)</label>
              <Input
                type="number"
                placeholder="0"
                value={form.price}
                onChange={(v) => set("price", v)}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              placeholder="Special instructions, meet & greet, etc."
              className={`${inputCls} resize-none`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-navy-800 border-t border-white/8 px-5 py-4 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/15 text-sm text-slate-300 hover:bg-navy-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="
              flex-1 py-2.5 rounded-xl text-sm font-semibold
              bg-gold-gradient text-navy-900
              hover:opacity-90 active:scale-[0.98] transition-all
            "
          >
            Create Booking
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

const inputCls =
  "w-full bg-navy-700 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-gold/40 transition-colors";

function Input({
  placeholder,
  value,
  onChange,
  type = "text",
  required,
}: {
  placeholder?: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className={inputCls}
    />
  );
}

function SectionLabel({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
      <Icon size={11} className="text-gold/70" />
      {label}
    </div>
  );
}

import { addMinutes, isWithinInterval, parseISO } from "date-fns";
import type { Booking } from "./types";

// ─── Airport Buffer Constants ─────────────────────────────────────────────────

export const BUFFER = {
  DOMESTIC: 30,       // minutes before flight for domestic runs
  INTERNATIONAL: 45,  // minutes before flight for international / checked luggage
};

/**
 * Returns the datetime when the driver should arrive on-site at the airport.
 *
 * For airport PICKUP jobs the driver needs to be there *after* the flight
 * lands (add buffer for landing → arrivals hall → luggage).
 * For airport DROP-OFF jobs the driver leaves the origin address timed to
 * arrive before the scheduled departure — this function isn't used in that
 * path (handled by separate departure_buffer logic in the booking form).
 *
 * @param flightEta   ISO string — estimated arrival time of the flight
 * @param bufferMins  How many minutes after ETA the driver should be on-site
 */
export function calculateDriverPickupTime(
  flightEta: string,
  bufferMins: number = BUFFER.INTERNATIONAL
): Date {
  return addMinutes(parseISO(flightEta), bufferMins);
}

/**
 * Checks whether assigning a driver to a new job would cause a clash.
 *
 * A clash exists when the new job's active window overlaps an existing
 * confirmed/active booking for the same driver, accounting for a minimum
 * 30-minute travel/reset buffer between jobs.
 *
 * @returns null if no clash, or the conflicting Booking if there is one
 */
export function checkDriverClash(
  driverId: string,
  existingBookings: Booking[],
  newPickupDatetime: string,
  durationMins: number = 120,
  travelBufferMins: number = 30
): Booking | null {
  const ACTIVE_STATUSES = new Set([
    "assigned",
    "dispatched",
    "at_airport",
    "passenger_on_board",
  ]);

  const newStart = parseISO(newPickupDatetime);
  // Add buffer on both sides for travel time
  const newWindowStart = addMinutes(newStart, -travelBufferMins);
  const newWindowEnd   = addMinutes(newStart, durationMins + travelBufferMins);

  for (const booking of existingBookings) {
    if (booking.driver_id !== driverId) continue;
    if (!ACTIVE_STATUSES.has(booking.status))  continue;

    const existingStart = parseISO(booking.pickup_datetime);
    const existingEnd   = addMinutes(existingStart, durationMins);

    // Check if either end of the new window falls within the existing booking
    const clashes =
      isWithinInterval(newWindowStart, { start: existingStart, end: existingEnd }) ||
      isWithinInterval(newWindowEnd,   { start: existingStart, end: existingEnd }) ||
      isWithinInterval(existingStart,  { start: newWindowStart, end: newWindowEnd });

    if (clashes) return booking;
  }

  return null;
}

/**
 * Derives a human-readable route label from pickup/dropoff addresses.
 * Strips full postcode/country for brevity.
 */
export function formatRoute(pickup: string, dropoff: string): string {
  const short = (addr: string) =>
    addr
      .replace(/,\s*(UK|England|United Kingdom)$/i, "")
      .split(",")
      .slice(0, 2)
      .join(",")
      .trim();
  return `${short(pickup)} → ${short(dropoff)}`;
}

/**
 * Formats a price in GBP.
 */
export function formatPrice(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
  }).format(pence);
}

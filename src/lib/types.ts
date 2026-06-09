// ─── Domain Types ────────────────────────────────────────────────────────────

export type BookingStatus =
  | "pending"
  | "assigned"
  | "dispatched"
  | "at_airport"
  | "passenger_on_board"
  | "completed"
  | "cancelled";

export type FlightStatus = "scheduled" | "delayed" | "landed" | "cancelled";

export type DriverStatus = "active" | "inactive";

export interface VehicleDetails {
  make: string;
  model: string;
  reg: string;
  colour: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  vehicle_details: VehicleDetails;
  status: DriverStatus;
  created_at: string;
}

export interface Booking {
  id: string;
  pickup_datetime: string; // ISO 8601
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  pickup_address: string;
  dropoff_address: string;
  passenger_count: number;
  luggage_count: number;
  flight_number: string | null;
  terminal: string | null;
  status: BookingStatus;
  driver_id: string | null;
  driver?: Driver | null;
  price: number;
  notes: string | null;
  created_at: string;
}

export interface FlightLog {
  id: string;
  booking_id: string;
  standard_arrival_time: string;
  estimated_arrival_time: string;
  actual_arrival_time: string | null;
  flight_status: FlightStatus;
  last_updated: string;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface MonthStats {
  bookingCount: number;
  totalHours: number;
  destinationCount: number;
  revenue: number;
}

// ─── Calendar helpers ─────────────────────────────────────────────────────────

/** Map of date string (YYYY-MM-DD) → bookings on that day */
export type CalendarBookingMap = Record<string, Booking[]>;

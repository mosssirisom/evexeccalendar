// Auto-typed to match the live evexec.co.uk Supabase schema

export type BookingStatus =
  | "Unassigned"
  | "Dispatched"
  | "En Route"
  | "Passenger On Board"
  | "Completed"
  | "Cancelled"
  | "Unassigned / Missed Call Recovery";

export type PaymentStatus = "Unpaid" | "Paid" | "Invoiced";

export interface DbBooking {
  id: string;
  ref: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  flight_number: string | null;
  direction: string | null;          // e.g. "Airport → Destination"
  airport: string | null;            // pickup airport / address
  dropoff_address: string | null;
  travel_date: string | null;        // "YYYY-MM-DD"
  travel_time: string | null;        // "HH:MM:SS"
  pickup_time: string | null;        // full ISO datetime (analytics)
  driver_id: string | null;
  quoted_price: number | null;
  status: BookingStatus;
  payment_status: PaymentStatus | null;
  priority: boolean | null;
  notes: string | null;
  updated_at: string | null;
  created_at: string | null;
  drivers?: { name: string } | null; // joined
}

export interface DbDriver {
  id: string;
  name: string;
  status: string | null;
  vehicle: string | null;
  plate: string | null;
  phone: string | null;
  email: string | null;
  rating: number | null;
}

export interface DbMissedCall {
  id: string;
  ref: string;
  caller: string | null;
  created_at: string | null;
  attempts: number | null;
  notes: string | null;
  resolved: boolean;
}

// Booking Brain intake — submitted via the public site, triaged here
export interface DbQuoteRequest {
  id: string;
  customer_name: string;
  phone: string;
  email: string | null;
  pickup_location: string | null;
  destination: string | null;
  pickup_date: string | null; // "YYYY-MM-DD"
  pickup_time: string | null;
  passengers: number | null;
  luggage: string | null;
  return_required: boolean | null;
  return_date: string | null;
  return_time: string | null;
  return_pickup: string | null;
  return_destination: string | null;
  return_airport: string | null;
  return_flight_number: string | null;
  journey_type: string | null;
  airport: string | null;
  flight_number: string | null;
  contact_method: string | null;
  notes: string | null;
  status: string | null; // "new" | "converted" | "dismissed"
  created_at: string | null;
}

export const QUOTE_REQUEST_STATUS = {
  NEW: "new",
  CONVERTED: "converted",
  DISMISSED: "dismissed",
} as const;

// Supabase database shape for createClient<Database>
export interface Database {
  public: {
    Tables: {
      bookings: {
        Row: DbBooking;
        Insert: Omit<DbBooking, "id" | "created_at" | "updated_at" | "drivers">;
        Update: Partial<Omit<DbBooking, "ref" | "created_at" | "drivers">>;
      };
      drivers: {
        Row: DbDriver;
        Insert: Omit<DbDriver, "id">;
        Update: Partial<DbDriver>;
      };
      missed_calls: {
        Row: DbMissedCall;
        Insert: Omit<DbMissedCall, "id" | "created_at">;
        Update: Partial<DbMissedCall>;
      };
      quote_requests: {
        Row: DbQuoteRequest;
        Insert: Omit<DbQuoteRequest, "id" | "created_at">;
        Update: Partial<DbQuoteRequest>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Status transition graph — matches operator app exactly
export const STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  "Unassigned":                    ["Dispatched", "Cancelled", "Unassigned / Missed Call Recovery"],
  "Unassigned / Missed Call Recovery": ["Dispatched", "Cancelled"],
  "Dispatched":                    ["En Route", "Cancelled"],
  "En Route":                      ["Passenger On Board", "Cancelled"],
  "Passenger On Board":            ["Completed", "Cancelled"],
  "Completed":                     [],
  "Cancelled":                     [],
};

export const STATUS_NEXT_PRIMARY: Record<BookingStatus, BookingStatus | null> = {
  "Unassigned":                    "Dispatched",
  "Unassigned / Missed Call Recovery": "Dispatched",
  "Dispatched":                    "En Route",
  "En Route":                      "Passenger On Board",
  "Passenger On Board":            "Completed",
  "Completed":                     null,
  "Cancelled":                     null,
};

export const STATUS_NEXT_LABEL: Record<BookingStatus, string> = {
  "Unassigned":                    "Mark Dispatched",
  "Unassigned / Missed Call Recovery": "Mark Dispatched",
  "Dispatched":                    "Driver En Route",
  "En Route":                      "Passenger On Board",
  "Passenger On Board":            "Complete Job",
  "Completed":                     "",
  "Cancelled":                     "",
};

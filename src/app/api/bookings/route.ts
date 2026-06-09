import { NextRequest, NextResponse } from "next/server";
import { MOCK_BOOKINGS } from "@/data/mockData";
import type { Booking } from "@/lib/types";

// In production: replace mock arrays with `query()` calls from @/lib/db

let store: Booking[] = [...MOCK_BOOKINGS];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date   = searchParams.get("date");   // YYYY-MM-DD
  const status = searchParams.get("status");

  let results = store;

  if (date) {
    results = results.filter((b) => b.pickup_datetime.startsWith(date));
  }

  if (status) {
    results = results.filter((b) => b.status === status);
  }

  results = results.sort(
    (a, b) =>
      new Date(a.pickup_datetime).getTime() - new Date(b.pickup_datetime).getTime()
  );

  return NextResponse.json({ data: results });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Omit<Booking, "id" | "created_at">;

    const newBooking: Booking = {
      ...body,
      id:         crypto.randomUUID(),
      status:     "pending",
      created_at: new Date().toISOString(),
    };

    store = [newBooking, ...store];

    return NextResponse.json({ data: newBooking }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

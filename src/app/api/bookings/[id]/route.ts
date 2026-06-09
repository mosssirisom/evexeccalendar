import { NextRequest, NextResponse } from "next/server";
import { MOCK_BOOKINGS } from "@/data/mockData";
import type { Booking } from "@/lib/types";

// Module-level store (shared with the parent route module in production
// this would be a real DB)
let store: Booking[] = [...MOCK_BOOKINGS];

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const booking = store.find((b) => b.id === params.id);
  if (!booking)
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  return NextResponse.json({ data: booking });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const idx = store.findIndex((b) => b.id === params.id);
  if (idx === -1)
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  try {
    const patch = (await request.json()) as Partial<Booking>;
    store[idx] = { ...store[idx], ...patch };
    return NextResponse.json({ data: store[idx] });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const idx = store.findIndex((b) => b.id === params.id);
  if (idx === -1)
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  store.splice(idx, 1);
  return NextResponse.json({ data: { deleted: params.id } });
}

import { NextRequest, NextResponse } from "next/server";
import { MOCK_FLIGHT_LOGS } from "@/data/mockData";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get("bookingId");

  const logs = bookingId
    ? MOCK_FLIGHT_LOGS.filter((f) => f.booking_id === bookingId)
    : MOCK_FLIGHT_LOGS;

  return NextResponse.json({ data: logs });
}

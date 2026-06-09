import { NextResponse } from "next/server";
import { MOCK_DRIVERS } from "@/data/mockData";

export async function GET() {
  const active = MOCK_DRIVERS.filter((d) => d.status === "active");
  return NextResponse.json({ data: active });
}

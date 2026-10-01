import { NextResponse } from "next/server";
import { fetchTrendSource } from "@/lib/trend-source";

export async function GET() {
  const items = await fetchTrendSource();

  return NextResponse.json({
    topics: items.map((item) => item.keyword),
    items,
    source: "trend-source",
    updatedAt: new Date().toISOString(),
  });
}
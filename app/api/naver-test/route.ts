import { NextResponse } from "next/server";
import { getNaverSearchTrend } from "@/lib/trends";

export async function GET() {
  const keyword = "AI";
  const ratio = await getNaverSearchTrend(keyword);

  return NextResponse.json({
    keyword,
    ratio,
    connected: ratio !== null,
  });
}
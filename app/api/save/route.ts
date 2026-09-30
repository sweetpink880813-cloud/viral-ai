import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const title = String(body.title ?? "").trim();
    const hook = String(body.hook ?? "").trim();
    const summary = String(body.summary ?? "").trim();
    const target = String(body.target ?? "").trim();
    const script = String(body.script ?? "").trim();

    if (!title || !script) {
      return NextResponse.json(
        { error: "제목과 릴스 대본이 필요합니다." },
        { status: 400 }
      );
    }

    if (
      title.length > 300 ||
      hook.length > 1000 ||
      summary.length > 5000 ||
      target.length > 1000 ||
      script.length > 20000
    ) {
      return NextResponse.json(
        { error: "저장할 콘텐츠가 너무 깁니다." },
        { status: 413 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("contents")
      .insert({
        title,
        hook: hook || null,
        summary: summary || null,
        target: target || null,
        script,
      })
      .select("id, created_at")
      .single();

    if (error) {
      console.error("Supabase save error:", error);

      return NextResponse.json(
        { error: "콘텐츠 저장에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      id: data.id,
      createdAt: data.created_at,
    });
  } catch (error) {
    console.error("Save API error:", error);

    return NextResponse.json(
      { error: "콘텐츠 저장 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
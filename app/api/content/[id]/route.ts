import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "삭제할 콘텐츠 ID가 없습니다." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from("contents")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Supabase delete error:", error);

      return NextResponse.json(
        { error: "콘텐츠 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete API error:", error);

    return NextResponse.json(
      { error: "콘텐츠 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
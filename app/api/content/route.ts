import { NextResponse } from "next/server";
import { generateContent, ContentGenerationError } from "@/lib/ai";
import { topicSchema } from "@/types/content";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {

  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > 4096) {
      return NextResponse.json({ error: "요청 내용이 너무 깁니다." }, { status: 413 });
    }
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "올바른 요청 형식이 아닙니다." }, { status: 400 });
  }
  const parsed = topicSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "콘텐츠 주제를 1~200자로 입력해주세요." }, { status: 400 });
  }
  try {
  const data = await generateContent(
  parsed.data.topic,
  parsed.data.platform,
  parsed.data.account,
  parsed.data.angle
);
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ContentGenerationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "콘텐츠 생성에 실패했습니다. 잠시 후 다시 시도해주세요." }, { status: 502 });
  }
}


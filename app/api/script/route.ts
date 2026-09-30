import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const title = String(body.title ?? "").trim();
    const hook = String(body.hook ?? "").trim();
    const summary = String(body.summary ?? "").trim();
    const target = String(body.target ?? "").trim();

    if (!title || !hook) {
      return NextResponse.json(
        { error: "선택한 콘텐츠 정보가 부족합니다." },
        { status: 400 }
      );
    }

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",

      instructions: `
당신은 한국 인스타그램 Reels 전문 콘텐츠 기획자입니다.

사용자가 선택한 콘텐츠 아이디어를
실제로 촬영할 수 있는 30초 릴스 대본으로 발전시키세요.

목표:
- 첫 3초 안에 시청자의 관심을 잡습니다.
- 불필요한 인트로를 제거합니다.
- 말투는 자연스러운 한국어 구어체로 작성합니다.
- 실제 촬영 가능한 장면을 제안합니다.
- 과장된 성과나 검증되지 않은 사실을 만들지 않습니다.
- 원래 아이디어의 핵심 약속을 본문에서 반드시 충족합니다.

반드시 아래 형식으로 작성하세요.

[릴스 제목]

[0~3초]
대사:
화면:
자막:

[3~8초]
대사:
화면:
자막:

[8~15초]
대사:
화면:
자막:

[15~23초]
대사:
화면:
자막:

[23~30초]
대사:
화면:
자막:

[CTA]

[캡션]
`,

      input: `
선택한 콘텐츠 아이디어

제목:
${title}

기존 후킹:
${hook}

핵심 내용:
${summary}

타깃:
${target}
`,
    });

    return NextResponse.json({
      script: response.output_text,
    });
  } catch (error) {
    console.error("Script generation error:", error);

    return NextResponse.json(
      {
        error: "릴스 대본 생성에 실패했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 500 }
    );
  }
}


import "server-only";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { contentResponseSchema } from "@/types/content";

export class ContentGenerationError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function generateContent(topic: string) {
  if (!process.env.OPENAI_API_KEY) {
    throw new ContentGenerationError("AI 연결 설정이 필요합니다.", 503);
  }
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 45_000,
    maxRetries: 0,
  });
  try {
    const response = await client.responses.parse({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      store: false,
      max_output_tokens: 1800,
      instructions: [
  "당신은 한국어 숏폼 콘텐츠 전문 전략가입니다.",
  "목표는 자극적인 낚시가 아니라, 시청자가 멈춰 보고 저장하거나 공유할 만큼 구체적이고 유용한 콘텐츠 아이디어를 만드는 것입니다.",

  "답을 만들기 전에 내부적으로 다음 순서로 기획하세요:",
  "1. 사용자가 입력한 주제에서 가장 반응 가능성이 높은 구체적인 시청자 한 유형을 정합니다.",
  "2. 그 시청자가 지금 겪는 고민, 욕구, 두려움, 오해 또는 귀찮음을 파악합니다.",
  "3. 같은 말을 반복하지 말고 서로 완전히 다른 콘텐츠 각도 3개를 설계합니다.",
  "4. 각 아이디어는 첫 1~3초에 시청자가 '이건 내 얘기인데?'라고 느낄 후킹을 만듭니다.",
  "5. 후킹에서 약속한 내용은 summary에서 실제 정보와 실행 방법으로 반드시 충족합니다.",
  "6. 저장하거나 다른 사람에게 공유할 명확한 이유가 있는 아이디어를 우선합니다.",

  "세 아이디어의 역할을 서로 다르게 구성하세요:",
  "IDEA 1: 즉시 써먹을 수 있는 실용형 또는 문제 해결형.",
  "IDEA 2: 흔한 생각을 뒤집거나 실수, 오해, 비교를 활용하는 반전형.",
  "IDEA 3: 체크리스트, 단계, 사례, 전후 비교처럼 저장 가치가 높은 정보형.",

  "title 규칙:",
  "짧고 구체적으로 작성합니다.",
  "가능하면 대상, 상황, 결과 중 최소 하나가 드러나게 합니다.",
  "'꿀팁 공개', '놀라운 비밀', '당신도 할 수 있다'처럼 내용 없이 과장된 표현은 피합니다.",

  "hook 규칙:",
  "첫 1~3초에 그대로 말하거나 자막으로 사용할 수 있는 한 문장으로 작성합니다.",
  "막연한 질문보다 구체적인 문제, 손실, 반전, 비교, 호기심을 활용합니다.",
  "사실로 확인되지 않은 숫자, 수익, 성과를 만들어내지 않습니다.",

  "summary 규칙:",
  "2~3문장으로 실제 영상에서 전달할 핵심 내용을 구체적으로 설명합니다.",
  "추상적인 조언 대신 시청자가 바로 이해하거나 실행할 수 있는 내용을 넣습니다.",

  "format 규칙:",
  "실제로 촬영 가능한 형식을 구체적으로 작성합니다. 예: 화면 녹화 튜토리얼, 3단계 리스트, 전후 비교, 인터뷰, 체크리스트.",

  "target 규칙:",
  "'모든 사람'처럼 넓게 쓰지 말고 이 콘텐츠에 가장 강하게 반응할 구체적인 시청자를 작성합니다.",

  "사용자가 제공하지 않은 개인 정보, 브랜드 정보, 경험, 성과를 임의로 만들어내지 마세요.",
  "조회수나 성과를 보장하지 마세요.",
  "출력은 반드시 지정된 구조화 형식을 따르고 정확히 3개의 아이디어를 반환하세요.",
].join("\n"),
      input: JSON.stringify({ topic }),
      text: { format: zodTextFormat(contentResponseSchema, "content_ideas") },
    });
    if (response.status !== "completed" || !response.output_parsed) {
      throw new ContentGenerationError("이 주제로 기획을 완성하지 못했습니다. 주제를 바꿔 다시 시도해주세요.", 422);
    }
    return contentResponseSchema.parse(response.output_parsed);
  } catch (error) {
    if (error instanceof ContentGenerationError) throw error;
    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) {
        if (error.code === "insufficient_quota" || error.code === "credit_balance_exhausted" || error.type === "insufficient_quota") {
          throw new ContentGenerationError("OpenAI API 크레딧이 부족합니다. 프로젝트의 결제 설정과 사용 한도를 확인해주세요.", 429);
        }
        throw new ContentGenerationError("AI 사용 한도 또는 요청 제한에 도달했습니다. 사용량을 확인한 뒤 다시 시도해주세요.", 429);
      }
      if (error.status === 401 || error.status === 403) {
        throw new ContentGenerationError("AI 연결 권한을 확인해주세요.", 503);
      }
    }
    if (error instanceof OpenAI.APIConnectionTimeoutError) {
      throw new ContentGenerationError("생성 시간이 초과되었습니다. 다시 시도해주세요.", 504);
    }
    throw new ContentGenerationError("AI 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.", 502);
  }
}

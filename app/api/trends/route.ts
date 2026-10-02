import {
  getLatestTrends,
  getNaverSearchTrend,
} from "@/lib/trends";
import { routeTrendForAccount } from "@/lib/ai";
import { NextResponse } from "next/server";

const categories = [
  "trending",
  "money",
  "life",
  "work",
  "ai",
  "growth",
] as const;

type Category = (typeof categories)[number];

const topics = {
  draw_boni: {
    trending: [
      "요즘 부모들이 공감하는 순간",
      "아이의 예상 밖 한마디",
      "엄마 아빠 현실 대화",
      "우리 집만 이런가 싶은 순간",
    ],
    money: [
      "아이와 돈 때문에 생긴 대화",
      "마트에서 벌어진 가족 이야기",
      "아이의 순수한 돈 개념",
      "부부의 현실적인 소비 대화",
    ],
    life: [
      "아이의 엉뚱한 행동",
      "부모가 당황한 순간",
      "등원 전쟁",
      "잠들기 전 가족 풍경",
    ],
    work: [
      "육아와 일을 함께하는 부모",
      "퇴근한 부모의 현실",
      "엄마 아빠의 숨겨진 속마음",
      "일하는 부모의 하루",
    ],
    ai: [
      "아이에게 AI를 설명한다면",
      "AI를 처음 본 아이의 반응",
      "부모가 AI를 쓰다 생긴 일",
      "AI 시대 가족의 웃픈 순간",
    ],
    growth: [
      "아이에게 배우게 된 것",
      "부모가 되고 달라진 생각",
      "육아하면서 깨달은 순간",
      "부모도 함께 자라는 과정",
    ],
  },

  moni_moneylog: {
    trending: [
      "요즘 2030 돈 고민",
      "최근 달라진 소비 습관",
      "월급쟁이가 요즘 확인할 것",
      "지금 돈 공부할 주제",
    ],
    money: [
      "월급 관리",
      "고정지출 점검",
      "소비 습관",
      "저축과 투자 공부",
      "청년 금융·지원 제도",
      "보험과 세금",
    ],
    life: [
      "생활비 관리",
      "뷰티비용 관리",
      "다이어트와 식비",
      "여행비 관리",
      "구독 서비스 점검",
      "쇼핑 후회 줄이기",
    ],
    work: [
      "직장인 월급 관리",
      "부업 시작하기",
      "연봉과 커리어",
      "직장인의 자기계발비",
      "퇴근 후 돈 공부",
    ],
    ai: [
      "AI로 돈 관리하기",
      "AI로 소비 기록하기",
      "AI 활용 부업",
      "AI로 시간 절약하기",
    ],
    growth: [
      "돈 공부 시작하기",
      "경제 뉴스 읽는 법",
      "소비 습관 바꾸기",
      "재테크 초보 공부법",
    ],
  },

  ttoni_on: {
    trending: [
      "요즘 부모들의 생활비 고민",
      "아이 키우며 달라진 소비",
      "엄마들이 요즘 찾는 절약법",
      "육아와 경제력 고민",
    ],
    money: [
      "세 아이 생활비",
      "육아비 관리",
      "교육비 고민",
      "가족 보험",
      "엄마의 부수입",
      "가족 자산관리 공부",
    ],
    life: [
      "장보기와 식비",
      "육아용품",
      "아이 셋 외출비",
      "가족 고정지출",
      "집안일과 시간 절약",
    ],
    work: [
      "엄마의 경제력 다시 만들기",
      "육아하며 부업하기",
      "경력단절 이후 다시 시작하기",
      "아이 키우며 공부하기",
    ],
    ai: [
      "엄마의 AI 활용",
      "AI로 집안일 줄이기",
      "AI로 육아 기록하기",
      "AI 활용 부업 공부",
    ],
    growth: [
      "엄마의 자기계발",
      "육아하며 공부 습관 만들기",
      "경제 공부 시작하기",
      "나를 위한 시간 만들기",
    ],
  },
} as const;

type Account = keyof typeof topics;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const account = searchParams.get("account") as Account | null;
  const categoryParam = searchParams.get("category") ?? "trending";

  if (!account || !(account in topics)) {
    return NextResponse.json(
      { error: "올바른 계정을 선택해주세요." },
      { status: 400 }
    );
  }

  if (!categories.includes(categoryParam as Category)) {
    return NextResponse.json(
      { error: "올바른 분야를 선택해주세요." },
      { status: 400 }
    );
  }

  const category = categoryParam as Category;

if (category === "trending") {
  const latestTrends = await getLatestTrends();
console.log("[USIA TREND] latestTrends:", latestTrends);
  // 1차: 빠른 키워드 기반 계정 DNA 필터

 // 실시간 후보는 키워드 일치로 미리 버리지 않고
// AI가 계정과 연결 가능한지 판단하도록 넘긴다.
const candidates = latestTrends.slice(0, 24);

console.log("[USIA TREND] candidates:", candidates);
  if (candidates.length > 0) {
  const routed = await Promise.all(
    candidates.map(async (item) => {
      const [result, naverRatio] = await Promise.all([
        routeTrendForAccount(
          item.keyword,
          account
        ),
        getNaverSearchTrend(item.keyword),
      ]);

      return {
  ...item,
  ...result,
  rank: item.rank ?? 25,
  naverRatio,
};
    })
  );

 const scoredTrends = routed
     .filter(
  (item) =>
    item.source === "fallback" ||
    (item.relevant && (item.fitScore ?? 0) >= 70)
)

  .map((item) => {
    // Google Trends 순위: 1위=100점, 25위=4점
    const rankScore = Math.max(
      0,
      100 - ((item.rank ?? 25) - 1) * 4
    );

    // 계정 적합도
    const fitScore = item.fitScore ?? 0;
    // 네이버 검색 관심도
    const naverScore = item.naverRatio ?? 0;

    // 최종 바이럴 점수
// 계정 적합도를 가장 중요하게 보고,
// 실시간 순위와 검색 관심도를 보조 신호로 사용
const opportunityScore = Math.min(item.opportunityScore ?? 0, item.rank === 25 ? 50 : 100);

const viralScore = Math.round(
  opportunityScore * 0.35 +
  fitScore * 0.30 +
  rankScore * 0.25 +
  naverScore * 0.10
);

    return {
  ...item,
  rankScore,
  opportunityScore,
  viralScore,
};
  });

const relevantTrends = scoredTrends
  .sort((a, b) => b.viralScore - a.viralScore)
  .slice(0, 4);

console.log(
  "[USIA TREND] scored:",
  relevantTrends.map((item) => ({
    keyword: item.keyword,
    rank: item.rank,
    rankScore: item.rankScore,
    fitScore: item.fitScore,
    opportunityScore: item.opportunityScore,
    naverRatio: item.naverRatio,
    viralScore: item.viralScore,
  }))
);

  if (relevantTrends.length > 0) {
    return NextResponse.json({
      account,
      category,
      topics: relevantTrends.map((item) => item.keyword),
      trendDetails: relevantTrends.map((item) => ({
  keyword: item.keyword,
  rank: item.rank,
  fitScore: item.fitScore,
  viralScore: item.viralScore,
  angle: item.angle,
  reason: item.reason,
  naverRatio: item.naverRatio,
})),
      updatedAt: relevantTrends[0].fetchedAt,
      source: "live-ai",
    });
  }
}

  // 실시간 후보가 없거나 AI가 모두 부적합 판정 → 기존 추천 유지
  return NextResponse.json({
    account,
    category,
    topics: topics[account].trending,
    trendDetails: [],
    updatedAt: new Date().toISOString(),
    source: "curated",
  });
}

return NextResponse.json({
  account,
  category,
  topics: topics[account][category],
  updatedAt: new Date().toISOString(),
  source: "curated",
});
}
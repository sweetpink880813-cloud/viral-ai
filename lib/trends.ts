import { fetchTrendSource } from "@/lib/trend-source";
import "server-only";

export type TrendItem = {
  keyword: string;
  rank?: number;
  source: "google-trends" | "fallback";
  fetchedAt: string;
};

export type TrendAccount =
  | "draw_boni"
  | "moni_moneylog"
  | "ttoni_on";

function cleanKeyword(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/[\r\n\t]/g, " ")
    .trim()
    .slice(0, 80);
}

function uniqueKeywords(items: TrendItem[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = item.keyword.toLowerCase();

    if (!key || seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

const accountSignals: Record<TrendAccount, string[]> = {
  draw_boni: [
    "아이",
    "부모",
    "엄마",
    "아빠",
    "육아",
    "가족",
    "부부",
    "학교",
    "유치원",
    "어린이",
    "생활",
  ],

  moni_moneylog: [
    "돈",
    "소비",
    "생활비",
    "물가",
    "금리",
    "주식",
    "ETF",
    "투자",
    "저축",
    "연금",
    "세금",
    "청년",
    "주거",
    "월급",
    "부업",
    "경제",
    "대출",
    "공매도",
    "우선주",
  ],

  ttoni_on: [
    "아이",
    "엄마",
    "육아",
    "생활비",
    "교육",
    "장보기",
    "식비",
    "가족",
    "부업",
    "절약",
    "지원",
    "연금",
    "주거",
  ],
};

export function filterTrendsForAccount(
  items: TrendItem[],
  account: TrendAccount
) {
  const signals = accountSignals[account];

  const matched = items.filter((item) =>
    signals.some((signal) =>
      item.keyword.toLowerCase().includes(signal.toLowerCase())
    )
  );

  return matched.slice(0, 8);
}

export async function getLatestTrends(): Promise<TrendItem[]> {
  try {
    const sourceItems = await fetchTrendSource();

    return uniqueKeywords(
      sourceItems
        .map((item) => cleanKeyword(item.keyword))
        .filter(Boolean)
        .map((keyword) => ({
          keyword,
          source: "google-trends" as const,
          fetchedAt: new Date().toISOString(),
        }))
    ).slice(0, 50);
  } catch (error) {
    console.error("Trend fetch failed:", error);
    return [];
  }
}
export async function getNaverSearchTrend(
  keyword: string
): Promise<number | null> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn("NAVER Search Trend credentials are missing.");
    return null;
  }

  const endDate = new Date();
  const startDate = new Date(endDate);

  // 최근 7일 검색 관심도 확인
  startDate.setDate(endDate.getDate() - 6);

  const formatDate = (date: Date) =>
    date.toISOString().slice(0, 10);

  try {
    const response = await fetch(
  "https://naverapihub.apigw.ntruss.com/search-trend/v1/search",
  {
    method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-NCP-APIGW-API-KEY-ID": clientId,
          "X-NCP-APIGW-API-KEY": clientSecret,
        },
        body: JSON.stringify({
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
          timeUnit: "date",
          keywordGroups: [
            {
              groupName: keyword,
              keywords: [keyword],
            },
          ],
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(8_000),
      }
    );

    if (!response.ok) {
      console.error(
        "NAVER Search Trend failed:",
        response.status,
        await response.text()
      );
      return null;
    }

    const data = (await response.json()) as {
      results?: Array<{
        data?: Array<{
          period: string;
          ratio: number;
        }>;
      }>;
    };

    const values = data.results?.[0]?.data ?? [];

    if (values.length === 0) {
      return null;
    }

    return values[values.length - 1].ratio;
  } catch (error) {
    console.error("NAVER Search Trend request failed:", error);
    return null;
  }
}
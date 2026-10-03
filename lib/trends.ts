import { fetchTrendSource } from "@/lib/trend-source";
import { getSupabaseAdmin } from "@/lib/supabase";
import "server-only";

export type TrendItem = {
  keyword: string;
  rank?: number;
  source: "google-trends" | "fallback";
  fetchedAt: string;
  previousRank?: number | null;
  rankChange?: number | null;
  movement?: "NEW" | "UP" | "DOWN" | "SAME";
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

   const liveItems = uniqueKeywords(
  sourceItems
    .map((item) => ({
      ...item,
      keyword: cleanKeyword(item.keyword),
    }))
    .filter((item) => Boolean(item.keyword))
).slice(0, 50);

    if (liveItems.length > 0) {
  try {
    const supabase = getSupabaseAdmin();

    const { data: snapshots, error: snapshotError } = await supabase
      .from("trend_snapshots")
      .select("id, keyword, rank, captured_at")
      .order("captured_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(200);

    if (snapshotError) {
      console.error(
        "[USIA TREND] movement fetch failed:",
        snapshotError
      );
      return liveItems;
    }

    const history = new Map<
      string,
      { rank: number; capturedAt: string }[]
    >();

    for (const row of snapshots ?? []) {
      const key = cleanKeyword(String(row.keyword ?? "")).toLowerCase();
      if (!key) continue;

      const rows = history.get(key) ?? [];

      const capturedAt = String(row.captured_at ?? "");
      const rank = Number(row.rank ?? 0);

      // 같은 수집 시점의 중복 행은 하나로 취급
      if (!rows.some((entry) => entry.capturedAt === capturedAt)) {
        rows.push({ rank, capturedAt });
      }

      history.set(key, rows);
    }

    const enrichedItems: TrendItem[] = liveItems.map((item) => {
      const key = item.keyword.toLowerCase();
      const rows = history.get(key) ?? [];

      const currentRank = item.rank;
      const previousRank = rows[1]?.rank ?? null;

      if (previousRank === null || currentRank == null) {
        return {
          ...item,
          previousRank,
          rankChange: null,
          movement: "NEW" as const,
        };
      }

      const rankChange = previousRank - currentRank;

      return {
        ...item,
        previousRank,
        rankChange: Math.abs(rankChange),
        movement:
          rankChange > 0
            ? ("UP" as const)
            : rankChange < 0
              ? ("DOWN" as const)
              : ("SAME" as const),
      };
    });

    return enrichedItems;
  } catch (error) {
    console.error("[USIA TREND] movement enrichment failed:", error);
    return liveItems;
  }
}
  } catch (error) {
    console.error("Trend fetch failed:", error);
  }

  // BigQuery를 사용할 수 없을 때 계정 관심 키워드를 후보군으로 사용
  const fetchedAt = new Date().toISOString();

  const fallbackKeywords = Array.from(
    new Set(Object.values(accountSignals).flat())
  );

  console.warn(
    `[USIA TREND] using account-signal fallback: ${fallbackKeywords.length} keywords`
  );

  return fallbackKeywords.slice(0, 50).map((keyword) => ({
    keyword: cleanKeyword(keyword),
    source: "fallback" as const,
    fetchedAt,
  }));
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
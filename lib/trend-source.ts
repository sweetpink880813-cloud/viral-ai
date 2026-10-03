import "server-only";
import { BigQuery } from "@google-cloud/bigquery";
import { getSupabaseAdmin } from "./supabase";

export type TrendSourceItem = {
  keyword: string;
  rank?: number;
  source: "google-trends" | "fallback";
  fetchedAt: string;
};

type BigQueryTrendRow = {
  term: string;
  rank: number;
};

const projectId = process.env.GOOGLE_PROJECT_ID ?? "usia-510306";
const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

const bigquery = new BigQuery({
  projectId,
  credentials:
    clientEmail && privateKey
      ? {
          client_email: clientEmail,
          private_key: privateKey,
        }
      : undefined,
});

// 캐시는 반드시 함수 바깥에 둔다.
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

let trendCache: TrendSourceItem[] | null = null;
let trendCacheTime = 0;

function cleanKeyword(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/[\r\n\t]/g, " ")
    .trim()
    .slice(0, 80);
}

export async function fetchTrendSource(): Promise<TrendSourceItem[]> {
  const now = Date.now();

  // 6시간 이내 캐시가 있으면 BigQuery 호출 생략
  if (
    trendCache &&
    trendCache.length > 0 &&
    now - trendCacheTime < CACHE_TTL_MS
  ) {
    console.log(
      `[USIA TREND] cache hit: ${trendCache.length} keywords`
    );

    return trendCache;
  }

  try {
    const query = `
      WITH latest AS (
        SELECT MAX(refresh_date) AS refresh_date
        FROM \`bigquery-public-data.google_trends.international_top_terms\`
        WHERE country_code = 'KR'
      )
      SELECT
        term,
        MIN(rank) AS rank
      FROM \`bigquery-public-data.google_trends.international_top_terms\` AS t
      CROSS JOIN latest
      WHERE t.country_code = 'KR'
        AND t.refresh_date = latest.refresh_date
      GROUP BY term
      ORDER BY rank ASC
      LIMIT 50
    `;

    const [rows] = await bigquery.query({
      query,
      location: "US",
      useLegacySql: false,
    });
    
    console.log("[USIA TREND] BigQuery raw rows:", rows.slice(0, 10));

    const fetchedAt = new Date().toISOString();

    const items: TrendSourceItem[] = (rows as BigQueryTrendRow[])
  .map((row) => ({
    keyword: cleanKeyword(String(row.term ?? "")),
    rank: Number(row.rank ?? 0),
    source: "google-trends" as const,
    fetchedAt,
  }))
  .filter((item) => Boolean(item.keyword));

   if (items.length > 0) {
      try {
        const supabase = getSupabaseAdmin();

        const snapshots = items.map((item) => ({
          keyword: item.keyword,
          rank: item.rank ?? 0,
          source: item.source,
          captured_at: fetchedAt,
        }));

        const { error: snapshotError } = await supabase
          .from("trend_snapshots")
          .insert(snapshots);

        if (snapshotError) {
          console.error("[USIA TREND] snapshot save failed:", snapshotError);
        } else {
          console.log(
            `[USIA TREND] saved ${snapshots.length} trend snapshots`
          );
        }
      } catch (snapshotError) {
        console.error("[USIA TREND] snapshot save failed:", snapshotError);
      }

      trendCache = items;
      trendCacheTime = now;
    }

    console.log(
      `[USIA TREND] BigQuery loaded ${items.length} Korean trend keywords`
    );

    return items;
  } catch (error) {
    console.error("[USIA TREND] BigQuery fetch failed:", error);

    // BigQuery 일시 장애 시 기존 캐시 사용
    if (trendCache && trendCache.length > 0) {
      console.warn(
        `[USIA TREND] using stale cache: ${trendCache.length} keywords`
      );

      return trendCache;
    }

    return [];
  }
}
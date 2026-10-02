import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase";
import SavedContentActions from "@/components/SavedContentActions";

export const dynamic = "force-dynamic";

type SavedContent = {
  id: string;
  title: string;
  hook: string | null;
  summary: string | null;
  target: string | null;
  script: string;
  created_at: string;
};

export default async function DashboardPage() {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("contents")
    .select("id, title, hook, summary, target, script, created_at")
    .order("created_at", { ascending: false });

  const contents = (data ?? []) as SavedContent[];
  type TrendDetail = {
  keyword: string;
  rank?: number;
  fitScore: number;
  viralScore: number;
  angle: string;
  reason: string;
  naverRatio: number | null;
};

let trendDetails: TrendDetail[] = [];

try {
  
const trendResponse = await fetch(
  "https://viral-ai-delta.vercel.app/api/trends?account=draw_boni&category=trending",
  { cache: "no-store" }
);

if (trendResponse.ok) {
  const contentType = trendResponse.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const trendData = await trendResponse.json();
    trendDetails = trendData.trendDetails ?? [];
  } else {
    console.error(
      "Dashboard trend fetch returned non-JSON:",
      trendResponse.status,
      contentType
    );
  }
}
    
} catch (error) {
  console.error("Dashboard trend fetch failed:", error);
}

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 flex items-start justify-between gap-6">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-lime-300">
              USIA
            </p>

            <h1 className="text-4xl font-bold tracking-tight">
              저장한 콘텐츠
            </h1>

            <p className="mt-3 text-sm text-neutral-400">
              만든 릴스 대본을 한곳에서 다시 확인하세요.
            </p>
          </div>

          <Link
            href="/"
            className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-black transition hover:bg-lime-300"
          >
            + 새 콘텐츠
          </Link>
        </div>
        {/* 실시간 트렌드 추천 */}
<section className="mb-10">
  <div className="mb-5 flex items-end justify-between gap-4">
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-lime-300">
        LIVE TREND
      </p>

      <h2 className="text-2xl font-bold">
        🔥 오늘의 실시간 콘텐츠 기회
      </h2>

      <p className="mt-2 text-sm text-neutral-400">
        실시간 트렌드와 계정 적합도를 분석해 추천합니다.
      </p>
    </div>
  </div>

  {trendDetails.length > 0 ? (
    <div className="grid gap-4 md:grid-cols-2">
      {trendDetails.slice(0, 4).map((trend) => (
        <article
          key={trend.keyword}
          className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6"
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="mb-1 text-xs text-neutral-500">
                실시간 추천
              </p>

              <h3 className="text-2xl font-bold">
                {trend.keyword}
              </h3>
            </div>

            <div className="rounded-2xl bg-lime-300 px-3 py-2 text-center text-black">
              <p className="text-[10px] font-bold uppercase">
                Viral
              </p>
              <p className="text-xl font-black">
                {trend.viralScore}
              </p>
            </div>
          </div>

          <div className="mb-5 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-neutral-950 p-3">
              <p className="text-xs text-neutral-500">
                AI 적합도
              </p>
              <p className="mt-1 font-bold">
                {trend.fitScore}
              </p>
            </div>

            <div className="rounded-2xl bg-neutral-950 p-3">
              <p className="text-xs text-neutral-500">
                검색 관심도
              </p>
              <p className="mt-1 font-bold">
                {trend.naverRatio ?? "-"}
              </p>
            </div>

            <div className="rounded-2xl bg-neutral-950 p-3">
              <p className="text-xs text-neutral-500">
                실시간 순위
              </p>
              <p className="mt-1 font-bold">
                {trend.rank ? `${trend.rank}위` : "-"}
              </p>
            </div>
          </div>

          <div className="mb-5">
            <p className="mb-2 text-xs font-bold text-lime-300">
              추천 콘텐츠 관점
            </p>

            <p className="text-sm leading-6 text-neutral-200">
              {trend.angle}
            </p>

            <p className="mt-3 text-xs leading-5 text-neutral-500">
              {trend.reason}
            </p>
          </div>

          <Link
            href={`/?topic=${encodeURIComponent(
              trend.keyword
            )}&angle=${encodeURIComponent(trend.angle)}`}
            className="block rounded-xl bg-white px-4 py-3 text-center text-sm font-bold text-black transition hover:bg-lime-300"
          >
            이 주제로 콘텐츠 만들기 →
          </Link>
        </article>
      ))}
    </div>
  ) : (
    <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 text-sm text-neutral-400">
      현재 추천할 실시간 트렌드를 불러오지 못했습니다.
    </div>
  )}
</section>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-900 bg-red-950/30 p-4 text-sm text-red-300">
            저장된 콘텐츠를 불러오지 못했습니다.
          </div>
        )}

        {!error && contents.length === 0 && (
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-10 text-center">
            <p className="font-bold">아직 저장한 콘텐츠가 없습니다.</p>
            <p className="mt-2 text-sm text-neutral-400">
              릴스 대본을 만든 뒤 저장해보세요.
            </p>
          </div>
        )}

        <div className="space-y-5">
          {contents.map((item) => (
            <article
              key={item.id}
              className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6"
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="mb-2 text-xs font-bold text-lime-300">
                    SAVED CONTENT
                  </p>

                  <h2 className="text-xl font-bold">{item.title}</h2>
                </div>

                <time className="text-xs text-neutral-500">
                  {new Date(item.created_at).toLocaleDateString("ko-KR")}
                </time>
              </div>

              {item.hook && (
                <p className="my-4 border-l-2 border-lime-300 pl-4 text-neutral-200">
                  {item.hook}
                </p>
              )}

              {item.summary && (
                <p className="text-sm leading-7 text-neutral-400">
                  {item.summary}
                </p>
              )}

              {item.target && (
                <p className="mt-4 text-xs text-neutral-500">
                  추천 타깃 · {item.target}
                </p>
              )}

              <details className="mt-6 rounded-2xl border border-neutral-800 bg-black p-4">
                <summary className="cursor-pointer font-bold">
                  🎬 릴스 대본 보기
                </summary>

                <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-neutral-300">
                  {item.script}
                </div>
              </details>
              <SavedContentActions
  id={item.id}
  script={item.script}
/>

            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
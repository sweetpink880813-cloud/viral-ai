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

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 flex items-start justify-between gap-6">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-lime-300">
              VIRAL AI
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
"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import ContentCard from "@/components/ContentCard";
import { contentResponseSchema, type ContentIdea } from "@/types/content";

export default function Home() {
  const [topic, setTopic] = useState("");
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedTopic, setGeneratedTopic] = useState("");
  const pending = useRef(false);

  async function handleCreate() {
    if (pending.current) return;
    const value = topic.trim();
    if (!value || value.length > 200) {
      setError("콘텐츠 주제를 1~200자로 입력해주세요!");
      return;
    }
    pending.current = true;
    setLoading(true);
    setError("");
    setIdeas([]);
    try {
      const response = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: value }),
        signal: AbortSignal.timeout(55_000),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "콘텐츠 생성에 실패했습니다.");
      }
      const parsed = contentResponseSchema.safeParse(data);
      if (!parsed.success) throw new Error("결과를 읽지 못했습니다. 다시 시도해주세요.");
      setIdeas(parsed.data.ideas);
      setGeneratedTopic(value);
    } catch (error) {
      setError(error instanceof Error && error.name === "TimeoutError"
        ? "생성 시간이 초과되었습니다. 다시 시도해주세요."
        : error instanceof Error && error.name !== "TypeError"
          ? error.message
          : "서버에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      pending.current = false;
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0b0b] text-white">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-16">
        {/* Top navigation */}
<div className="mb-20 flex items-center justify-between">
  <span className="text-xl font-black tracking-tight">
    VIRAL AI
  </span>

  <Link
    href="/dashboard"
    className="rounded-xl border border-neutral-800 px-4 py-2 text-sm font-bold text-neutral-300 transition hover:border-lime-300 hover:text-white"
  >
    저장한 콘텐츠 →
  </Link>
</div>

        {/* Hero */}
        <section className="flex flex-1 flex-col justify-center">
          <div className="mb-4 inline-flex w-fit rounded-full border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm text-neutral-300">
            AI CONTENT STRATEGIST
          </div>

          <h1 className="mb-6 text-5xl font-black leading-tight tracking-tight md:text-7xl">
            오늘 뭐
            <br />
            올리지?
          </h1>

          <p className="mb-10 max-w-xl text-lg leading-8 text-neutral-400">
            만들고 싶은 주제를 입력하면
            <br />
            오늘 만들 콘텐츠를 AI가 기획합니다.
          </p>

          {/* Input */}
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-3">
            <textarea
              aria-label="콘텐츠 주제"
              aria-describedby={error ? "topic-error" : undefined}
              aria-invalid={!!error}
              maxLength={200}
              disabled={loading}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="예: AI 생산성, 재테크, 다이어트, 사업..."
              className="min-h-28 w-full resize-none bg-transparent p-4 text-lg text-white outline-none placeholder:text-neutral-600"
            />

            <div className="flex items-center justify-between gap-3">
              <span className="hidden pl-4 text-sm text-neutral-600 sm:block">
                막막하다면 아래 추천 주제를 골라보세요.
              </span>

              <button
                onClick={handleCreate}
                disabled={loading}
                className="ml-auto rounded-2xl bg-white px-6 py-4 font-bold text-black transition hover:bg-neutral-200 disabled:cursor-wait disabled:opacity-50"
              >
                {loading ? "콘텐츠 기획 중…" : "🔥 콘텐츠 만들기"}
              </button>
            </div>
          </div>

          {/* Suggestions */}
          <div className="mt-6 flex flex-wrap gap-2">
            {["AI 활용법", "직장인 자기계발", "사업", "재테크"].map(
              (item) => (
                <button
                  key={item}
                  disabled={loading}
                  onClick={() => setTopic(item)}
                  className="rounded-full border border-neutral-800 px-4 py-2 text-sm text-neutral-400 transition hover:border-neutral-600 hover:text-white"
                >
                  {item}
                </button>
              )
            )}
          </div>
          {error && <p id="topic-error" role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
          <div aria-live="polite" aria-busy={loading}>
            {loading && <p role="status" className="mt-8 animate-pulse text-neutral-400">서로 다른 콘텐츠 아이디어 3개를 기획하고 있어요.</p>}
            {ideas.length > 0 && (
              <section className="mt-12" aria-labelledby="results-title">
                <p className="mb-2 text-sm text-lime-300">오늘의 콘텐츠 기획</p>
                <h2 id="results-title" className="mb-6 break-words text-2xl font-bold">“{generatedTopic}” 아이디어 3개</h2>
                <div className="grid gap-4">
                  {ideas.map((idea, index) => <ContentCard key={index} idea={idea} index={index} />)}
                </div>
              </section>
            )}
          </div>
        </section>

        {/* Bottom */}
        <section className="mt-20 border-t border-neutral-900 pt-8">
          <p className="text-sm text-neutral-600">
            100만 조회수를 목표로 콘텐츠를 실험하고
            <br />
            내 계정만의 성공 패턴을 찾아갑니다.
          </p>
        </section>
      </div>
    </main>
  );
}

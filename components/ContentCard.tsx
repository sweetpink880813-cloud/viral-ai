"use client";

import { useState } from "react";
import type { ContentIdea } from "@/types/content";

export default function ContentCard({
  idea,
  index,
}: {
  idea: ContentIdea;
  index: number;
}) {
  const [script, setScript] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
const [saving, setSaving] = useState(false);
const [saved, setSaved] = useState(false);
  async function handleCreateScript() {
    try {
      setLoading(true);
      setError("");
      setScript("");
      setSaved(false);

      const response = await fetch("/api/script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: idea.title,
          hook: idea.hook,
          summary: idea.summary,
          target: idea.target,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "릴스 대본 생성에 실패했습니다."
        );
      }

      setScript(data.script);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "릴스 대본 생성에 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  }
async function handleSaveScript() {
  if (!script || saving) return;

  try {
    setSaving(true);
    setError("");

    const response = await fetch("/api/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: idea.title,
        hook: idea.hook,
        summary: idea.summary,
        target: idea.target,
        script,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "콘텐츠 저장에 실패했습니다.");
    }

    setSaved(true);
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "콘텐츠 저장에 실패했습니다."
    );
  } finally {
    setSaving(false);
  }
}
  return (
    <article className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6">
      <div className="mb-4 flex items-center justify-between gap-4 text-sm">
        <span className="font-bold text-lime-300">
          IDEA {String(index + 1).padStart(2, "0")}
        </span>

        <span className="text-neutral-400">
          {idea.format}
        </span>
      </div>

      <h3 className="text-xl font-bold leading-relaxed">
        {idea.title}
      </h3>

      <p className="my-4 border-l-2 border-lime-300 pl-4 text-neutral-200">
        {idea.hook}
      </p>

      <p className="whitespace-pre-line text-sm leading-7 text-neutral-400">
        {idea.summary}
      </p>

      <p className="mt-4 text-xs leading-5 text-neutral-400">
        추천 타깃 · {idea.target}
      </p>

      <button
        type="button"
        onClick={handleCreateScript}
        disabled={loading}
        className="mt-6 w-full rounded-2xl bg-white px-5 py-4 font-bold text-black transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "🎬 AI가 릴스 제작 중..."
          : "🎬 이 아이디어로 릴스 만들기 →"}
      </button>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-900 bg-red-950/30 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {script && (
  <div className="mt-6 rounded-2xl border border-lime-900 bg-black p-5">
    <div className="mb-4 flex items-center justify-between">
      <div>
        <p className="text-xs font-bold text-lime-300">
          REELS SCRIPT
        </p>

        <h4 className="mt-1 font-bold text-white">
          🎬 30초 릴스 대본
        </h4>
      </div>
    </div>

    <div className="whitespace-pre-wrap text-sm leading-7 text-neutral-300">
      {script}
    </div>

    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(script)}
      className="mt-5 rounded-xl border border-neutral-700 px-4 py-2 text-sm text-neutral-300 transition hover:border-neutral-500 hover:text-white"
    >
      📋 대본 복사
    </button>

    <button
      type="button"
      onClick={handleSaveScript}
      disabled={saving || saved}
      className="ml-2 mt-5 rounded-xl border border-lime-500/50 bg-lime-400 px-4 py-2 text-sm font-bold text-black transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {saving ? "💾 저장 중..." : saved ? "✓ 저장 완료" : "💾 저장"}
    </button>
  </div>
)}
    </article>
  );
}
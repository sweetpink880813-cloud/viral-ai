"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SavedContentActions({
  id,
  script,
}: {
  id: string;
  script: string;
}) {
  const router = useRouter();

  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "이 저장 콘텐츠를 삭제할까요? 삭제하면 되돌릴 수 없습니다."
    );

    if (!confirmed || deleting) return;

    try {
      setDeleting(true);
      setError("");

      const response = await fetch(`/api/content/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "삭제에 실패했습니다.");
      }

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "삭제 중 오류가 발생했습니다."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-xl border border-neutral-700 px-4 py-2 text-sm font-bold text-neutral-300 transition hover:border-lime-300 hover:text-white"
        >
          {copied ? "✓ 복사 완료" : "📋 대본 복사"}
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-xl border border-red-900 px-4 py-2 text-sm font-bold text-red-300 transition hover:border-red-500 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deleting ? "삭제 중..." : "🗑 삭제"}
        </button>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
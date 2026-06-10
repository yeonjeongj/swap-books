"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteBookButton({ bookId }: { bookId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("이 책을 목록에서 삭제하시겠습니까?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/user-books/${bookId}`, { method: "DELETE" });
      if (res.status === 409) {
        alert("교환독서를 한 책은 삭제할 수 없습니다");
        return;
      }
      if (res.ok || res.status === 204) router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      aria-label="책 삭제"
      className="w-6 h-6 flex items-center justify-center transition-colors hover:text-red-400 disabled:opacity-40"
      style={{ color: "#aaaaaa" }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v6M14 11v6" />
        <path d="M9 6V4h6v2" />
      </svg>
    </button>
  );
}

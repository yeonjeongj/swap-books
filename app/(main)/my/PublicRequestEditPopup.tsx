"use client";

import { useState } from "react";
import Popup from "@/components/ui/Popup";

type OfferedBook = {
  id: string;
  title: string;
  author: string;
  cover_image: string | null;
};

type UserBook = {
  id: string;
  title: string;
  author: string;
};

type Props = {
  swapId: string;
  initialOfferedBook: OfferedBook | null;
  initialMessage: string | null;
  userBooks: UserBook[];
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
};

const labelStyle = { fontSize: "0.6875rem", fontWeight: 700 as const, color: "#888888" };

export default function PublicRequestEditPopup({
  swapId,
  initialOfferedBook,
  initialMessage,
  userBooks,
  onClose,
  onSaved,
  onDeleted,
}: Props) {
  const [selectedBookId, setSelectedBookId] = useState(initialOfferedBook?.id ?? userBooks[0]?.id ?? "");
  const [message, setMessage] = useState(initialMessage ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!selectedBookId) {
      setError("책을 선택해주세요.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/swaps/${swapId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offeredBookId: selectedBookId,
          requesterMessage: message.trim() || null,
        }),
      });
      if (!res.ok) {
        let errMsg = "저장에 실패했습니다.";
        try { const json = await res.json(); errMsg = json.error ?? errMsg; } catch {}
        setError(errMsg);
        return;
      }
      onSaved();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/swaps/${swapId}`, { method: "DELETE" });
      if (!res.ok) {
        let errMsg = "삭제에 실패했습니다.";
        try { const json = await res.json(); errMsg = json.error ?? errMsg; } catch {}
        setError(errMsg);
        setConfirmDelete(false);
        return;
      }
      onDeleted();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Popup onClose={onClose}>
      <div className="px-7 pt-7 pb-8">
        <span
          style={{
            display: "inline-block",
            backgroundColor: "#f4d23d",
            border: "1.5px solid #030505",
            borderRadius: "9999px",
            padding: "3px 12px",
            fontSize: "0.6875rem",
            fontWeight: 700,
            marginBottom: "0.5rem",
          }}
        >
          내 요청 수정
        </span>
        <h2
          style={{
            fontFamily: "var(--font-fredoka)",
            fontSize: "1.35rem",
            fontWeight: 700,
            color: "#030505",
            marginBottom: "1.5rem",
          }}
        >
          요청 수정하기
        </h2>

        <div className="flex flex-col gap-4">
          <div>
            <label style={labelStyle} className="block mb-1.5">내가 제안하는 책</label>
            <select
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              className="w-full px-3 py-2 text-sm outline-none"
              style={{ border: "1.5px solid #dddddd", borderRadius: "8px", color: "#030505", backgroundColor: "#ffffff" }}
            >
              {userBooks.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.title} — {book.author}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle} className="block mb-1.5">
              하고 싶은 말{" "}
              <span style={{ fontSize: "0.625rem", fontWeight: 400, color: "#aaaaaa" }}>Optional</span>
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="좋아하는 문구나 이 책을 추천하는 이유를 자유롭게 적어주세요"
              className="w-full px-3 py-2 text-sm outline-none resize-none"
              style={{ border: "1.5px solid #dddddd", borderRadius: "8px", color: "#030505" }}
            />
          </div>

          {error && (
            <p style={{ fontSize: "0.6875rem", color: "#ef4444" }}>{error}</p>
          )}

          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: confirmDelete ? "#ef4444" : "#ffffff",
                border: `2px solid ${confirmDelete ? "#ef4444" : "#dddddd"}`,
                borderRadius: "9999px",
                padding: "10px 16px",
                fontWeight: 700,
                fontSize: "0.8125rem",
                color: confirmDelete ? "#ffffff" : "#888888",
                flexShrink: 0,
              }}
            >
              {deleting ? "삭제 중..." : confirmDelete ? "삭제 확인" : "삭제"}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={submitting || !selectedBookId}
              className="flex-1 transition-colors hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "#f4d23d",
                border: "2px solid #030505",
                borderRadius: "9999px",
                padding: "10px 0",
                fontWeight: 700,
                fontSize: "0.875rem",
                boxShadow: "0px 1px 4px rgba(3,5,5,0.06)",
                color: "#030505",
              }}
            >
              {submitting ? "저장 중..." : "저장하기"}
            </button>
          </div>
        </div>
      </div>
    </Popup>
  );
}

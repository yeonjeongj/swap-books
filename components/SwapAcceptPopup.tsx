"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Popup from "./ui/Popup";
import { highResCover } from "@/lib/utils/cover";

export type IncomingRequest = {
  id: string;
  requester_id: string;
  status: string;
  created_at: string;
  requester_message: string | null;
  offered_book: {
    id: string;
    title: string;
    author: string;
    cover_image: string | null;
  } | null;
  requester: {
    id: string;
    nickname: string | null;
    avatar_url: string | null;
  } | null;
};

type KakaoBook = {
  title: string;
  authors: string[];
  publisher: string;
  thumbnail: string;
  isbn: string;
};

type UserBook = {
  id: string;
  title: string;
  author: string;
  cover_image: string | null;
};

type Props = {
  request: IncomingRequest;
  onClose: () => void;
  onDone?: (requestId: string) => void;
};

function SearchIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

const labelStyle = { fontSize: "0.6875rem", fontWeight: 700 as const, color: "#888888" };
const dropdownStyle = {
  border: "1px solid #E0E0E0",
  borderRadius: "8px",
  boxShadow: "0px 2px 8px rgba(3,5,5,0.08)",
  backgroundColor: "#ffffff",
};

export default function SwapAcceptPopup({ request, onClose, onDone }: Props) {
  const [userBooks, setUserBooks] = useState<UserBook[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  const [bookQuery, setBookQuery] = useState("");
  const [bookResults, setBookResults] = useState<KakaoBook[]>([]);
  const [selectedNewBook, setSelectedNewBook] = useState<KakaoBook | null>(null);
  const [bookSearching, setBookSearching] = useState(false);

  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/user-books")
      .then((r) => r.json())
      .then((data) => setUserBooks(Array.isArray(data) ? data : []));
  }, []);

  async function runBookSearch(query: string) {
    if (!query.trim()) return;
    setBookSearching(true);
    try {
      const res = await fetch(`/api/books?q=${encodeURIComponent(query.trim())}`);
      if (res.ok) setBookResults((await res.json()).documents ?? []);
    } finally {
      setBookSearching(false);
    }
  }

  function selectNewBook(book: KakaoBook) {
    setSelectedNewBook(book);
    setBookQuery(book.title);
    setBookResults([]);
    setSelectedBookId(null);
  }

  function clearNewBook() {
    setSelectedNewBook(null);
    setBookQuery("");
    setBookResults([]);
  }

  function toggleExistingBook(id: string) {
    setSelectedBookId((prev) => (prev === id ? null : id));
    setSelectedNewBook(null);
    setBookQuery("");
    setBookResults([]);
  }

  async function handleDecision(status: "accepted" | "rejected") {
    setSubmitting(true);
    setError(null);
    try {
      let wantedBookId: string | undefined;
      if (status === "accepted") {
        if (selectedBookId) {
          wantedBookId = selectedBookId;
        } else if (selectedNewBook) {
          const isbn = selectedNewBook.isbn.split(" ")[1] || selectedNewBook.isbn.split(" ")[0];
          const bookRes = await fetch("/api/user-books", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              isbn,
              title: selectedNewBook.title,
              author: selectedNewBook.authors.join(", "),
              publisher: selectedNewBook.publisher,
              coverImage: highResCover(selectedNewBook.thumbnail),
            }),
          });
          if (!bookRes.ok) {
            const json = await bookRes.json();
            setError(json.error ?? "책 등록에 실패했습니다.");
            return;
          }
          wantedBookId = (await bookRes.json()).id;
        }
      }

      const body: Record<string, unknown> = { status };
      if (wantedBookId) body.wantedBookId = wantedBookId;
      if (status === "accepted") body.receiverMessage = message.trim() || null;

      const res = await fetch(`/api/swaps/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? "처리에 실패했습니다.");
        return;
      }
      onDone?.(request.id);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  const book = request.offered_book;
  const requester = request.requester;

  return (
    <Popup onClose={onClose}>
      <div className="px-7 pt-7 pb-8 max-h-[90vh] overflow-y-auto">
        <span
          style={{
            display: "inline-block",
            backgroundColor: "#a0e4f2",
            border: "1.5px solid #030505",
            borderRadius: "9999px",
            padding: "3px 12px",
            fontSize: "0.6875rem",
            fontWeight: 700,
            marginBottom: "0.5rem",
          }}
        >
          Book Exchange
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
          교환 요청 확인
        </h2>

        {/* Requester */}
        <div className="mb-5">
          <p style={labelStyle} className="mb-1.5">요청자</p>
          <p style={{ fontSize: "0.875rem", color: "#030505" }}>{requester?.nickname ?? "알 수 없음"}</p>
        </div>

        {/* Offered book */}
        {book && (
          <div
            className="mb-5 flex gap-3 p-3"
            style={{ backgroundColor: "#f5f5f5", border: "1.5px solid #dddddd", borderRadius: "12px" }}
          >
            {book.cover_image ? (
              <div className="relative w-14 h-[74px] flex-shrink-0 overflow-hidden" style={{ borderRadius: "4px", border: "1px solid #dddddd" }}>
                <Image src={highResCover(book.cover_image)!} alt="" fill className="object-cover object-top" />
              </div>
            ) : (
              <div className="w-14 h-[74px] flex-shrink-0" style={{ backgroundColor: "#a0e4f2", borderRadius: "4px", border: "1px solid #dddddd" }} />
            )}
            <div className="min-w-0">
              <p style={labelStyle} className="mb-1">제안 도서</p>
              <p style={{ fontSize: "0.875rem", color: "#030505", lineHeight: 1.4 }}>{book.title}</p>
              <p style={{ fontSize: "0.6875rem", color: "#888888", marginTop: "2px" }}>{book.author}</p>
            </div>
          </div>
        )}

        {/* Requester message */}
        {request.requester_message && (
          <div
            className="mb-5 p-3"
            style={{ backgroundColor: "#fffde7", border: "1.5px solid #dddddd", borderRadius: "12px" }}
          >
            <p style={labelStyle} className="mb-1.5">메시지</p>
            <p style={{ fontSize: "0.875rem", color: "#555555", lineHeight: 1.5 }}>
              {request.requester_message}
            </p>
          </div>
        )}

        {/* Receiver's book selection */}
        <div className="mb-5">
          <p style={labelStyle} className="mb-2">
            교환할 내 책{" "}
            <span style={{ fontSize: "0.625rem", fontWeight: 400, color: "#aaaaaa" }}>Optional</span>
          </p>

          {userBooks.length > 0 && (
            <div className="relative mb-3">
              <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-1 px-1">
                {userBooks.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => toggleExistingBook(b.id)}
                    className="relative flex-shrink-0 w-[72px] text-left transition-opacity group"
                    style={{ opacity: selectedBookId === b.id ? 1 : 0.65 }}
                  >
                    <div
                      className="relative w-[72px] h-[96px] overflow-hidden transition-colors"
                      style={{
                        borderRadius: "6px",
                        border: selectedBookId === b.id ? "2px solid #030505" : "2px solid transparent",
                      }}
                    >
                      {b.cover_image ? (
                        <Image src={highResCover(b.cover_image)!} alt="" fill className="object-cover object-top" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: "#f5f5f5" }}>
                          <span className="text-center px-1 leading-tight" style={{ fontSize: "0.5625rem", color: "#aaaaaa" }}>{b.title}</span>
                        </div>
                      )}
                      {selectedBookId === b.id && (
                        <span
                          className="absolute top-1 right-1 p-0.5"
                          style={{ backgroundColor: "#f4d23d", border: "1px solid #030505", borderRadius: "9999px" }}
                        >
                          <CheckIcon />
                        </span>
                      )}
                    </div>
                    <p className="leading-tight line-clamp-2 mt-1" style={{ fontSize: "0.5625rem", color: "#030505" }}>{b.title}</p>
                  </button>
                ))}
              </div>
              {userBooks.length > 4 && (
                <div className="absolute right-0 top-0 bottom-2 w-10 bg-gradient-to-l from-white via-white/70 to-transparent pointer-events-none" />
              )}
            </div>
          )}

          {/* New book search */}
          <p style={{ fontSize: "0.625rem", color: "#aaaaaa", marginBottom: "6px" }}>
            {userBooks.length > 0 ? "또는 새 책 검색" : "책 검색"}
          </p>
          <div className="relative">
            <div className="flex gap-1.5">
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#aaaaaa" }}>
                  {selectedNewBook ? <CheckIcon /> : <SearchIcon />}
                </div>
                <input
                  type="text"
                  value={bookQuery}
                  onChange={(e) => { const v = e.target.value; setBookQuery(v); if (selectedNewBook) clearNewBook(); else if (!v.trim()) setBookResults([]); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); runBookSearch(bookQuery); } }}
                  placeholder="제목 또는 저자를 검색하세요"
                  className="w-full pl-8 pr-8 py-2 text-sm outline-none transition-colors focus:border-[#030505] bg-white"
                  style={{ border: "1.5px solid #dddddd", borderRadius: "8px 0 0 8px", color: "#030505" }}
                  autoComplete="off"
                />
                {selectedNewBook && (
                  <button type="button" onClick={clearNewBook} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs" style={{ color: "#aaaaaa" }}>✕</button>
                )}
              </div>
              <button
                type="button"
                onClick={() => runBookSearch(bookQuery)}
                disabled={!bookQuery.trim() || !!selectedNewBook}
                className="px-3 py-2 text-xs font-bold transition-colors hover:bg-[#f5f5f5] disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                style={{ border: "1.5px solid #dddddd", borderRadius: "0 8px 8px 0", borderLeft: "none", color: "#030505" }}
              >
                검색
              </button>
            </div>
            {bookSearching && (
              <p style={{ fontSize: "0.625rem", color: "#888888", marginTop: "4px" }}>검색 중...</p>
            )}
            {bookResults.length > 0 && (
              <ul className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto" style={dropdownStyle}>
                {bookResults.map((b, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => selectNewBook(b)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#f5f5f5] text-left transition-colors"
                    >
                      {b.thumbnail ? (
                        <div className="relative w-8 h-10 flex-shrink-0 overflow-hidden" style={{ borderRadius: "4px" }}>
                          <Image src={b.thumbnail} alt="" fill className="object-cover object-top" />
                        </div>
                      ) : (
                        <div className="w-8 h-10 flex-shrink-0" style={{ backgroundColor: "#f5f5f5", borderRadius: "4px" }} />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm truncate" style={{ color: "#030505" }}>{b.title}</p>
                        <p className="truncate" style={{ fontSize: "0.6875rem", color: "#888888" }}>{b.authors.join(", ")}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Receiver message */}
        <div className="mb-5">
          <label htmlFor="receiver-message" style={labelStyle} className="block mb-1.5">
            하고 싶은 말{" "}
            <span style={{ fontSize: "0.625rem", fontWeight: 400, color: "#aaaaaa" }}>Optional</span>
          </label>
          <textarea
            id="receiver-message"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="이 교환독서에 대해 하고 싶은 말을 자유롭게 적어주세요"
            className="w-full px-3 py-2 text-sm outline-none transition-colors focus:border-[#030505] bg-white resize-none"
            style={{ border: "1.5px solid #dddddd", borderRadius: "8px", color: "#030505" }}
          />
        </div>

        {error && <p style={{ fontSize: "0.6875rem", color: "#ef4444", marginBottom: "12px" }}>{error}</p>}

        <div className="flex gap-2 mt-1">
          <button
            onClick={() => handleDecision("rejected")}
            disabled={submitting}
            className="flex-1 transition-colors hover:bg-[#f5f5f5] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              border: "2px solid #030505",
              borderRadius: "9999px",
              padding: "10px 0",
              fontWeight: 700,
              fontSize: "0.875rem",
              color: "#030505",
              backgroundColor: "#ffffff",
            }}
          >
            거절
          </button>
          <button
            onClick={() => handleDecision("accepted")}
            disabled={submitting}
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
            {submitting ? "처리 중..." : "수락"}
          </button>
        </div>
      </div>
    </Popup>
  );
}

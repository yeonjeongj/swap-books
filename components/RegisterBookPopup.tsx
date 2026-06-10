"use client";

import { useState } from "react";
import Image from "next/image";
import Popup from "./ui/Popup";
import { highResCover } from "@/lib/utils/cover";

type KakaoBook = {
  title: string;
  authors: string[];
  publisher: string;
  thumbnail: string;
  isbn: string;
};

type Props = {
  onClose: () => void;
  onSuccess?: () => void;
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

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star === value ? 0 : star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="text-2xl leading-none transition-colors"
          style={{ color: star <= (hovered || value) ? "#f4d23d" : "#dddddd" }}
          aria-label={`${star}점`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

const inputClass = "w-full px-3 py-2 text-sm outline-none transition-colors focus:border-[#030505] bg-white";
const inputStyle = { border: "1.5px solid #dddddd", borderRadius: "8px", color: "#030505" };
const labelStyle = { fontSize: "0.6875rem", fontWeight: 700 as const, color: "#888888" };

export default function RegisterBookPopup({ onClose, onSuccess }: Props) {
  const [bookQuery, setBookQuery] = useState("");
  const [bookResults, setBookResults] = useState<KakaoBook[]>([]);
  const [selectedBook, setSelectedBook] = useState<KakaoBook | null>(null);
  const [bookSearching, setBookSearching] = useState(false);
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function selectBook(book: KakaoBook) {
    setSelectedBook(book);
    setBookQuery(book.title);
    setBookResults([]);
  }

  function clearBook() {
    setSelectedBook(null);
    setBookQuery("");
    setBookResults([]);
  }

  async function runSearch(query: string) {
    if (!query.trim()) return;
    setBookSearching(true);
    try {
      const res = await fetch(`/api/books?q=${encodeURIComponent(query.trim())}`);
      if (res.ok) setBookResults((await res.json()).documents ?? []);
    } finally {
      setBookSearching(false);
    }
  }

  function handleSearchKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { e.preventDefault(); runSearch(bookQuery); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBook) {
      setError("책을 선택해주세요.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const isbn = selectedBook.isbn.split(" ")[1] || selectedBook.isbn.split(" ")[0];
      const res = await fetch("/api/user-books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isbn,
          title: selectedBook.title,
          author: selectedBook.authors.join(", "),
          publisher: selectedBook.publisher,
          coverImage: highResCover(selectedBook.thumbnail),
          rating: rating || undefined,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? "책 등록에 실패했습니다.");
        return;
      }
      onSuccess?.();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Popup onClose={onClose}>
      <div className="px-7 pt-7 pb-8">
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
          My Books
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
          책 등록하기
        </h2>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {/* Book search */}
          <div className="relative">
            <label style={labelStyle} className="block mb-1.5">책 검색</label>
            <div className="flex gap-1.5">
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#aaaaaa" }}>
                  {selectedBook ? <CheckIcon /> : <SearchIcon />}
                </div>
                <input
                  id="book-search"
                  type="text"
                  value={bookQuery}
                  onChange={(e) => { const v = e.target.value; setBookQuery(v); if (selectedBook) clearBook(); else if (!v.trim()) setBookResults([]); }}
                  onKeyDown={handleSearchKey}
                  placeholder="제목 또는 저자를 검색하세요"
                  className={`${inputClass} pl-8 pr-8`}
                  style={{ ...inputStyle, borderRadius: "8px 0 0 8px" }}
                  autoComplete="off"
                />
                {selectedBook && (
                  <button type="button" onClick={clearBook} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs" style={{ color: "#aaaaaa" }}>✕</button>
                )}
              </div>
              <button
                type="button"
                onClick={() => runSearch(bookQuery)}
                disabled={!bookQuery.trim() || !!selectedBook}
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
              <ul
                className="absolute z-10 w-full bg-white mt-1 max-h-52 overflow-y-auto"
                style={{ border: "1px solid #E0E0E0", borderRadius: "8px", boxShadow: "0px 2px 8px rgba(3,5,5,0.08)" }}
              >
                {bookResults.map((book, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => selectBook(book)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#f5f5f5] text-left transition-colors"
                    >
                      {book.thumbnail ? (
                        <div className="relative w-8 h-10 flex-shrink-0 overflow-hidden" style={{ borderRadius: "4px" }}>
                          <Image src={book.thumbnail} alt="" fill className="object-cover object-top" />
                        </div>
                      ) : (
                        <div className="w-8 h-10 flex-shrink-0" style={{ backgroundColor: "#f5f5f5", borderRadius: "4px" }} />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm truncate" style={{ color: "#030505" }}>{book.title}</p>
                        <p className="truncate" style={{ fontSize: "0.6875rem", color: "#888888" }}>{book.authors.join(", ")}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Star rating */}
          <div>
            <label style={labelStyle} className="block mb-1.5">
              별점{" "}
              <span style={{ fontSize: "0.625rem", fontWeight: 400, color: "#aaaaaa" }}>Optional</span>
            </label>
            <StarRating value={rating} onChange={setRating} />
          </div>

          {error && (
            <p style={{ fontSize: "0.6875rem", color: "#ef4444" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !selectedBook}
            className="mt-1 transition-colors hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
            {submitting ? "등록 중..." : "등록하기"}
          </button>
        </form>
      </div>
    </Popup>
  );
}

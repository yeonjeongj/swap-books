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
          style={{ color: star <= (hovered || value) ? "#5a633a" : "#d1d5db" }}
          aria-label={`${star}점`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

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
        <p className="text-[10px] tracking-[0.2em] uppercase text-primary font-body mb-1">
          My Books
        </p>
        <h2 className="font-headline text-xl text-neutral mb-6">책 등록하기</h2>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {/* Book search */}
          <div className="relative">
            <label htmlFor="book-search" className="text-[10px] tracking-[0.15em] uppercase text-neutral/45 font-body block mb-1.5">
              책 검색
            </label>
            <div className="flex gap-1.5">
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral/35 pointer-events-none">
                  {selectedBook ? <CheckIcon /> : <SearchIcon />}
                </div>
                <input
                  id="book-search"
                  type="text"
                  value={bookQuery}
                  onChange={(e) => { const v = e.target.value; setBookQuery(v); if (selectedBook) clearBook(); else if (!v.trim()) setBookResults([]); }}
                  onKeyDown={handleSearchKey}
                  placeholder="제목 또는 저자를 검색하세요"
                  className="w-full border border-neutral/15 bg-white/60 pl-8 pr-8 py-2 text-sm font-body text-neutral placeholder:text-neutral/30 focus:outline-none focus:border-neutral/40 transition-colors"
                  autoComplete="off"
                />
                {selectedBook && (
                  <button type="button" onClick={clearBook} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral/30 hover:text-neutral/60 text-xs">✕</button>
                )}
              </div>
              <button
                type="button"
                onClick={() => runSearch(bookQuery)}
                disabled={!bookQuery.trim() || !!selectedBook}
                className="border border-neutral/20 px-3 py-2 text-[11px] font-body text-neutral/60 hover:border-neutral/40 hover:text-neutral/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                검색
              </button>
            </div>
            {bookSearching && (
              <p className="text-[10px] text-neutral/40 font-body mt-1">검색 중...</p>
            )}
            {bookResults.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-neutral/15 shadow-sm mt-0.5 max-h-52 overflow-y-auto">
                {bookResults.map((book, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => selectBook(book)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-neutral/5 text-left transition-colors"
                    >
                      {book.thumbnail ? (
                        <div className="relative w-8 h-10 flex-shrink-0 overflow-hidden">
                          <Image src={book.thumbnail} alt="" fill className="object-cover object-top" />
                        </div>
                      ) : (
                        <div className="w-8 h-10 bg-neutral/10 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-body text-neutral truncate">{book.title}</p>
                        <p className="text-[11px] text-neutral/50 font-body truncate">{book.authors.join(", ")}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Star rating */}
          <div>
            <label className="text-[10px] tracking-[0.15em] uppercase text-neutral/45 font-body block mb-1.5">
              별점
              <span className="ml-1.5 normal-case tracking-normal text-[9px] text-neutral/30">Optional</span>
            </label>
            <StarRating value={rating} onChange={setRating} />
          </div>

          {error && (
            <p className="text-[11px] text-red-500 font-body">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !selectedBook}
            className="mt-1 w-full bg-primary text-secondary text-[10px] tracking-[0.2em] uppercase py-3 font-body hover:bg-tertiary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "등록 중..." : "등록하기"}
          </button>
        </form>
      </div>
    </Popup>
  );
}

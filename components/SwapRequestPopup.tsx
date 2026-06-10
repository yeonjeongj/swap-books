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

type UserResult = {
  id: string;
  nickname: string;
};

type ExistingBook = {
  id: string;
  isbn: string | null;
  title: string;
};

type Props = {
  userBooks: ExistingBook[];
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

const inputClass = "w-full px-3 py-2 text-sm outline-none transition-colors focus:border-[#030505] bg-white";
const labelStyle = { fontSize: "0.6875rem", fontWeight: 700 as const, color: "#888888" };

export default function SwapRequestPopup({ userBooks, onClose, onSuccess }: Props) {
  const [bookQuery, setBookQuery] = useState("");
  const [bookResults, setBookResults] = useState<KakaoBook[]>([]);
  const [selectedBook, setSelectedBook] = useState<KakaoBook | null>(null);
  const [matchedBook, setMatchedBook] = useState<ExistingBook | null>(null);
  const [bookSearching, setBookSearching] = useState(false);

  const [partnerQuery, setPartnerQuery] = useState("");
  const [partnerResults, setPartnerResults] = useState<UserResult[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<UserResult | null>(null);
  const [partnerSearching, setPartnerSearching] = useState(false);
  const [isPublicRecruit, setIsPublicRecruit] = useState(false);

  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function findExistingBook(kakaoIsbn: string, kakaoTitle: string): ExistingBook | null {
    const isbns = kakaoIsbn.split(" ").filter(Boolean);
    return (
      userBooks.find((b) => b.isbn && isbns.includes(b.isbn)) ??
      userBooks.find((b) => b.title === kakaoTitle) ??
      null
    );
  }

  function selectBook(book: KakaoBook) {
    setSelectedBook(book);
    setBookQuery(book.title);
    setBookResults([]);
    setMatchedBook(findExistingBook(book.isbn, book.title));
  }

  function clearBook() {
    setSelectedBook(null);
    setMatchedBook(null);
    setBookQuery("");
    setBookResults([]);
  }

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

  function handleBookSearchKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { e.preventDefault(); runBookSearch(bookQuery); }
  }

  async function runPartnerSearch(query: string) {
    if (!query.trim()) return;
    setPartnerSearching(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query.trim())}`);
      if (res.ok) setPartnerResults(await res.json() ?? []);
    } finally {
      setPartnerSearching(false);
    }
  }

  function handlePartnerSearchKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { e.preventDefault(); runPartnerSearch(partnerQuery); }
  }

  function selectPartner(user: UserResult) {
    setSelectedPartner(user);
    setPartnerQuery(user.nickname);
    setPartnerResults([]);
    setIsPublicRecruit(false);
  }

  function clearPartner() {
    setSelectedPartner(null);
    setPartnerQuery("");
    setPartnerResults([]);
  }

  function togglePublicRecruit() {
    const next = !isPublicRecruit;
    setIsPublicRecruit(next);
    if (next) clearPartner();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBook) {
      setError("책을 선택해주세요.");
      return;
    }
    if (!selectedPartner && !isPublicRecruit) {
      setError("교환 상대를 선택하거나 공개 모집을 선택해주세요.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      let bookId: string;
      if (matchedBook) {
        bookId = matchedBook.id;
      } else {
        const isbn = selectedBook.isbn.split(" ")[1] || selectedBook.isbn.split(" ")[0];
        const bookRes = await fetch("/api/user-books", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isbn,
            title: selectedBook.title,
            author: selectedBook.authors.join(", "),
            publisher: selectedBook.publisher,
            coverImage: highResCover(selectedBook.thumbnail),
          }),
        });
        if (!bookRes.ok) {
          const json = await bookRes.json();
          setError(json.error ?? "책 등록에 실패했습니다.");
          return;
        }
        const newBook = await bookRes.json();
        bookId = newBook.id;
      }

      const swapRes = await fetch("/api/swaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offeredBookId: bookId,
          receiverId: selectedPartner?.id ?? null,
          isPublic: isPublicRecruit,
          requesterMessage: message.trim() || undefined,
        }),
      });
      if (!swapRes.ok) {
        const json = await swapRes.json();
        setError(json.error ?? "교환 요청 생성에 실패했습니다.");
        return;
      }
      onSuccess?.();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  const dropdownStyle = {
    border: "1px solid #E0E0E0",
    borderRadius: "8px",
    boxShadow: "0px 2px 8px rgba(3,5,5,0.08)",
    backgroundColor: "#ffffff",
  };

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
          교환하기
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
                  onKeyDown={handleBookSearchKey}
                  placeholder="제목 또는 저자를 검색하세요"
                  className={`${inputClass} pl-8 pr-8`}
                  style={{ border: "1.5px solid #dddddd", borderRadius: "8px 0 0 8px", color: "#030505" }}
                  autoComplete="off"
                />
                {selectedBook && (
                  <button type="button" onClick={clearBook} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs" style={{ color: "#aaaaaa" }}>✕</button>
                )}
              </div>
              <button
                type="button"
                onClick={() => runBookSearch(bookQuery)}
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
            {matchedBook && (
              <p style={{ fontSize: "0.625rem", color: "#555555", marginTop: "4px" }}>이미 등록된 책입니다. 기존 정보를 사용합니다.</p>
            )}
            {bookResults.length > 0 && (
              <ul className="absolute z-10 w-full mt-1 max-h-52 overflow-y-auto" style={dropdownStyle}>
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

          {/* Message */}
          <div>
            <label htmlFor="requester-message" style={labelStyle} className="block mb-1.5">
              하고 싶은 말{" "}
              <span style={{ fontSize: "0.625rem", fontWeight: 400, color: "#aaaaaa" }}>Optional</span>
            </label>
            <textarea
              id="requester-message"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="좋아하는 문구나 이 책을 추천하는 이유를 자유롭게 적어주세요"
              className="w-full px-3 py-2 text-sm outline-none transition-colors focus:border-[#030505] bg-white resize-none"
              style={{ border: "1.5px solid #dddddd", borderRadius: "8px", color: "#030505" }}
            />
          </div>

          {/* Partner search */}
          <div className="relative">
            <label htmlFor="partner-nickname" style={labelStyle} className="block mb-1.5">
              교환할 상대의 닉네임 검색
            </label>
            <div className="flex gap-1.5">
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#aaaaaa" }}>
                  {selectedPartner ? <CheckIcon /> : <SearchIcon />}
                </div>
                <input
                  id="partner-nickname"
                  type="text"
                  value={partnerQuery}
                  onChange={(e) => { const v = e.target.value; setPartnerQuery(v); if (selectedPartner) clearPartner(); else if (!v.trim()) setPartnerResults([]); }}
                  onKeyDown={handlePartnerSearchKey}
                  placeholder="닉네임을 입력하세요"
                  className={`${inputClass} pl-8 pr-8`}
                  style={{ border: "1.5px solid #dddddd", borderRadius: "8px 0 0 8px", color: "#030505" }}
                  autoComplete="off"
                />
                {selectedPartner && (
                  <button type="button" onClick={clearPartner} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs" style={{ color: "#aaaaaa" }}>✕</button>
                )}
              </div>
              <button
                type="button"
                onClick={() => runPartnerSearch(partnerQuery)}
                disabled={!partnerQuery.trim() || !!selectedPartner}
                className="px-3 py-2 text-xs font-bold transition-colors hover:bg-[#f5f5f5] disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                style={{ border: "1.5px solid #dddddd", borderRadius: "0 8px 8px 0", borderLeft: "none", color: "#030505" }}
              >
                검색
              </button>
            </div>
            {partnerSearching && (
              <p style={{ fontSize: "0.625rem", color: "#888888", marginTop: "4px" }}>검색 중...</p>
            )}
            {partnerResults.length > 0 && (
              <ul className="absolute z-10 w-full mt-1 max-h-40 overflow-y-auto" style={dropdownStyle}>
                {partnerResults.map((user) => (
                  <li key={user.id}>
                    <button
                      type="button"
                      onClick={() => selectPartner(user)}
                      className="w-full px-3 py-2 hover:bg-[#f5f5f5] text-left text-sm transition-colors"
                      style={{ color: "#030505" }}
                    >
                      {user.nickname}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Public recruit toggle */}
          <button
            type="button"
            onClick={togglePublicRecruit}
            className="flex items-center gap-2.5 w-full text-left transition-colors"
            style={{
              border: isPublicRecruit ? "1.5px solid #030505" : "1.5px solid #dddddd",
              borderRadius: "8px",
              padding: "10px 12px",
              backgroundColor: isPublicRecruit ? "#a0e4f2" : "#ffffff",
            }}
          >
            <span
              className="w-3.5 h-3.5 flex-shrink-0 flex items-center justify-center transition-colors"
              style={{
                border: isPublicRecruit ? "1.5px solid #030505" : "1.5px solid #aaaaaa",
                borderRadius: "3px",
                backgroundColor: isPublicRecruit ? "#030505" : "transparent",
                color: "#ffffff",
              }}
            >
              {isPublicRecruit && <CheckIcon />}
            </span>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#030505" }}>파트너 공개 모집하기</span>
            <span className="ml-auto" style={{ fontSize: "0.625rem", color: "#888888" }}>특정 상대 없이 공개 요청</span>
          </button>

          {error && (
            <p style={{ fontSize: "0.6875rem", color: "#ef4444" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !selectedBook || (!selectedPartner && !isPublicRecruit)}
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
            {submitting ? "처리 중..." : "교환하기"}
          </button>
        </form>
      </div>
    </Popup>
  );
}

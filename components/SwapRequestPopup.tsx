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
        // 새 책 등록
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

  return (
    <Popup onClose={onClose}>
      <div className="px-7 pt-7 pb-8">
        <p className="text-[10px] tracking-[0.2em] uppercase text-primary font-body mb-1">
          Book Exchange
        </p>
        <h2 className="font-headline text-xl text-neutral mb-6">교환하기</h2>

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
                  onKeyDown={handleBookSearchKey}
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
                onClick={() => runBookSearch(bookQuery)}
                disabled={!bookQuery.trim() || !!selectedBook}
                className="border border-neutral/20 px-3 py-2 text-[11px] font-body text-neutral/60 hover:border-neutral/40 hover:text-neutral/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                검색
              </button>
            </div>
            {bookSearching && (
              <p className="text-[10px] text-neutral/40 font-body mt-1">검색 중...</p>
            )}
            {matchedBook && (
              <p className="text-[10px] text-primary/70 font-body mt-1">이미 등록된 책입니다. 기존 정보를 사용합니다.</p>
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

          {/* Message */}
          <div>
            <label htmlFor="requester-message" className="text-[10px] tracking-[0.15em] uppercase text-neutral/45 font-body block mb-1.5">
              하고 싶은 말
              <span className="ml-1.5 normal-case tracking-normal text-[9px] text-neutral/30">Optional</span>
            </label>
            <textarea
              id="requester-message"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="좋아하는 문구나 이 책을 추천하는 이유를 자유롭게 적어주세요"
              className="w-full border border-neutral/15 bg-white/60 px-3 py-2 text-sm font-body text-neutral placeholder:text-neutral/30 focus:outline-none focus:border-neutral/40 transition-colors resize-none"
            />
          </div>

          {/* Partner search */}
          <div className="relative">
            <label htmlFor="partner-nickname" className="text-[10px] tracking-[0.15em] uppercase text-neutral/45 font-body block mb-1.5">
              교환할 상대의 닉네임 검색
            </label>
            <div className="flex gap-1.5">
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral/35 pointer-events-none">
                  {selectedPartner ? <CheckIcon /> : <SearchIcon />}
                </div>
                <input
                  id="partner-nickname"
                  type="text"
                  value={partnerQuery}
                  onChange={(e) => { const v = e.target.value; setPartnerQuery(v); if (selectedPartner) clearPartner(); else if (!v.trim()) setPartnerResults([]); }}
                  onKeyDown={handlePartnerSearchKey}
                  placeholder="닉네임을 입력하세요"
                  className="w-full border border-neutral/15 bg-white/60 pl-8 pr-8 py-2 text-sm font-body text-neutral placeholder:text-neutral/30 focus:outline-none focus:border-neutral/40 transition-colors"
                  autoComplete="off"
                />
                {selectedPartner && (
                  <button type="button" onClick={clearPartner} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral/30 hover:text-neutral/60 text-xs">✕</button>
                )}
              </div>
              <button
                type="button"
                onClick={() => runPartnerSearch(partnerQuery)}
                disabled={!partnerQuery.trim() || !!selectedPartner}
                className="border border-neutral/20 px-3 py-2 text-[11px] font-body text-neutral/60 hover:border-neutral/40 hover:text-neutral/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                검색
              </button>
            </div>
            {partnerSearching && (
              <p className="text-[10px] text-neutral/40 font-body mt-1">검색 중...</p>
            )}
            {partnerResults.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-neutral/15 shadow-sm mt-0.5 max-h-40 overflow-y-auto">
                {partnerResults.map((user) => (
                  <li key={user.id}>
                    <button
                      type="button"
                      onClick={() => selectPartner(user)}
                      className="w-full px-3 py-2 hover:bg-neutral/5 text-left text-sm font-body text-neutral transition-colors"
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
            className={`flex items-center gap-2.5 w-full border px-3 py-2.5 text-left transition-colors ${
              isPublicRecruit
                ? "border-primary/40 bg-primary/5 text-primary"
                : "border-neutral/15 text-neutral/55 hover:border-neutral/30"
            }`}
          >
            <span className={`w-3.5 h-3.5 border flex-shrink-0 flex items-center justify-center transition-colors ${
              isPublicRecruit ? "border-primary bg-primary text-secondary" : "border-neutral/30"
            }`}>
              {isPublicRecruit && <CheckIcon />}
            </span>
            <span className="text-[11px] font-body">파트너 공개 모집하기</span>
            <span className="ml-auto text-[9px] tracking-[0.1em] text-neutral/35 font-body normal-case">특정 상대 없이 공개 요청</span>
          </button>

          {error && (
            <p className="text-[11px] text-red-500 font-body">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !selectedBook || (!selectedPartner && !isPublicRecruit)}
            className="mt-1 w-full bg-primary text-secondary text-[10px] tracking-[0.2em] uppercase py-3 font-body hover:bg-tertiary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "처리 중..." : "교환하기"}
          </button>
        </form>
      </div>
    </Popup>
  );
}

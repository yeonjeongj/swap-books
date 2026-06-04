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
        <p className="text-[10px] tracking-[0.2em] uppercase text-primary font-body mb-1">
          Book Exchange
        </p>
        <h2 className="font-headline text-xl text-neutral mb-6">교환 요청 확인</h2>

        {/* Requester */}
        <div className="mb-5">
          <p className="text-[10px] tracking-[0.15em] uppercase text-neutral/45 font-body mb-1.5">요청자</p>
          <p className="text-sm font-body text-neutral">{requester?.nickname ?? "알 수 없음"}</p>
        </div>

        {/* Offered book */}
        {book && (
          <div className="mb-5 flex gap-3">
            {book.cover_image ? (
              <div className="relative w-14 h-[74px] flex-shrink-0 overflow-hidden">
                <Image src={highResCover(book.cover_image)!} alt="" fill className="object-cover object-top" />
              </div>
            ) : (
              <div className="w-14 h-[74px] bg-neutral/10 flex-shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-[10px] tracking-[0.15em] uppercase text-neutral/45 font-body mb-1">제안 도서</p>
              <p className="text-sm font-body text-neutral leading-snug">{book.title}</p>
              <p className="text-[11px] text-neutral/50 font-body mt-0.5">{book.author}</p>
            </div>
          </div>
        )}

        {/* Requester message */}
        {request.requester_message && (
          <div className="mb-5 bg-white/60 border border-neutral/10 px-4 py-3">
            <p className="text-[10px] tracking-[0.15em] uppercase text-neutral/40 font-body mb-1.5">메시지</p>
            <p className="text-sm font-body text-neutral/70 leading-relaxed">{request.requester_message}</p>
          </div>
        )}

        {/* Receiver's book selection */}
        <div className="mb-5">
          <p className="text-[10px] tracking-[0.15em] uppercase text-neutral/45 font-body mb-2">
            교환할 내 책
            <span className="ml-1.5 normal-case tracking-normal text-[9px] text-neutral/30">Optional</span>
          </p>

          {/* Existing books — horizontal scroll */}
          {userBooks.length > 0 && (
            <div className="relative mb-3">
            <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-1 px-1">

              {userBooks.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => toggleExistingBook(b.id)}
                  className={`relative flex-shrink-0 w-[72px] text-left transition-colors group ${
                    selectedBookId === b.id ? "opacity-100" : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <div className={`relative w-[72px] h-[96px] border-2 overflow-hidden transition-colors ${
                    selectedBookId === b.id ? "border-primary" : "border-transparent"
                  }`}>
                    {b.cover_image ? (
                      <Image src={highResCover(b.cover_image)!} alt="" fill className="object-cover object-top" />
                    ) : (
                      <div className="w-full h-full bg-neutral/10 flex items-center justify-center">
                        <span className="text-[9px] text-neutral/30 font-body text-center px-1 leading-tight">{b.title}</span>
                      </div>
                    )}
                    {selectedBookId === b.id && (
                      <span className="absolute top-1 right-1 bg-primary text-secondary rounded-full p-0.5">
                        <CheckIcon />
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-body text-neutral mt-1 leading-tight line-clamp-2">{b.title}</p>
                </button>
              ))}
            </div>
            {userBooks.length > 4 && (
              <div className="absolute right-0 top-0 bottom-2 w-10 bg-gradient-to-l from-white via-white/70 to-transparent pointer-events-none" />
            )}
            </div>
          )}

          {/* New book search */}
          <p className="text-[10px] text-neutral/35 font-body mb-1.5">
            {userBooks.length > 0 ? "또는 새 책 검색" : "책 검색"}
          </p>
          <div className="relative">
            <div className="flex gap-1.5">
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral/35 pointer-events-none">
                  {selectedNewBook ? <CheckIcon /> : <SearchIcon />}
                </div>
                <input
                  type="text"
                  value={bookQuery}
                  onChange={(e) => {
                    const v = e.target.value;
                    setBookQuery(v);
                    if (selectedNewBook) clearNewBook();
                    else if (!v.trim()) setBookResults([]);
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); runBookSearch(bookQuery); } }}
                  placeholder="제목 또는 저자를 검색하세요"
                  className="w-full border border-neutral/15 bg-white/60 pl-8 pr-8 py-2 text-sm font-body text-neutral placeholder:text-neutral/30 focus:outline-none focus:border-neutral/40 transition-colors"
                  autoComplete="off"
                />
                {selectedNewBook && (
                  <button type="button" onClick={clearNewBook} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral/30 hover:text-neutral/60 text-xs">✕</button>
                )}
              </div>
              <button
                type="button"
                onClick={() => runBookSearch(bookQuery)}
                disabled={!bookQuery.trim() || !!selectedNewBook}
                className="border border-neutral/20 px-3 py-2 text-[11px] font-body text-neutral/60 hover:border-neutral/40 hover:text-neutral/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                검색
              </button>
            </div>
            {bookSearching && (
              <p className="text-[10px] text-neutral/40 font-body mt-1">검색 중...</p>
            )}
            {bookResults.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-neutral/15 shadow-sm mt-0.5 max-h-48 overflow-y-auto">
                {bookResults.map((b, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => selectNewBook(b)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-neutral/5 text-left transition-colors"
                    >
                      {b.thumbnail ? (
                        <div className="relative w-8 h-10 flex-shrink-0 overflow-hidden">
                          <Image src={b.thumbnail} alt="" fill className="object-cover object-top" />
                        </div>
                      ) : (
                        <div className="w-8 h-10 bg-neutral/10 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-body text-neutral truncate">{b.title}</p>
                        <p className="text-[11px] text-neutral/50 font-body truncate">{b.authors.join(", ")}</p>
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
          <label htmlFor="receiver-message" className="text-[10px] tracking-[0.15em] uppercase text-neutral/45 font-body block mb-1.5">
            하고 싶은 말
            <span className="ml-1.5 normal-case tracking-normal text-[9px] text-neutral/30">Optional</span>
          </label>
          <textarea
            id="receiver-message"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="이 교환독서에 대해 하고 싶은 말을 자유롭게 적어주세요"
            className="w-full border border-neutral/15 bg-white/60 px-3 py-2 text-sm font-body text-neutral placeholder:text-neutral/30 focus:outline-none focus:border-neutral/40 transition-colors resize-none"
          />
        </div>

        {error && <p className="text-[11px] text-red-500 font-body mb-3">{error}</p>}

        <div className="flex gap-2 mt-1">
          <button
            onClick={() => handleDecision("rejected")}
            disabled={submitting}
            className="flex-1 border border-neutral/20 py-2.5 text-[10px] tracking-[0.2em] uppercase text-neutral/60 font-body hover:border-neutral/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            거절
          </button>
          <button
            onClick={() => handleDecision("accepted")}
            disabled={submitting}
            className="flex-1 bg-primary text-secondary py-2.5 text-[10px] tracking-[0.2em] uppercase font-body hover:bg-tertiary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "처리 중..." : "수락"}
          </button>
        </div>
      </div>
    </Popup>
  );
}

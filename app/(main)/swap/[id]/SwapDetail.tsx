"use client";

import { useState } from "react";
import type { Book, ReadingNote } from "@/types/book";

type SwapBook = Pick<Book, "id" | "title" | "author"> & {
  tabLabel: string;
  coverColor: string;
  curatorQuote: string;
  curatorAttribution: string;
  readingNotes: ReadingNote[];
};

const SWAP_BOOKS: SwapBook[] = [
  {
    id: "secret-history",
    tabLabel: "The Secret History",
    title: "The Secret History",
    author: "Donna Tartt",
    coverColor: "#3a4430",
    curatorQuote:
      "책은 다른 사람의 생각을 빌려오는 것이 아니라, 그들의 시선을 통해 세상을 보는 것이다.",
    curatorAttribution: "Bibliotheca Curation Team",
    readingNotes: [
      {
        id: "note-1",
        authorId: "user-1",
        authorNickname: "Ji-won Lee",
        bookId: "secret-history",
        swapRequestId: "swap-1",
        page: 14,
        quote:
          "Beauty is terror. Whatever we call beautiful, we quiver before it.",
        featuredComment: {
          id: "comment-1",
          noteId: "note-1",
          authorNickname: "Ji-won Lee",
          text: "이 구절을 읽을 때마다 우리가 함께했던 그 가을의 도서관이 생각나요. 당신이 이 책을 추천해줬던 그날의 공기가 아직도 생생합니다.",
          createdAt: "2024.03.12",
          replyCount: 1,
        },
        createdAt: "2024.03.12",
      },
      {
        id: "note-2",
        authorId: "user-2",
        authorNickname: "Min-ho Park",
        bookId: "secret-history",
        swapRequestId: "swap-1",
        page: 284,
        quote:
          "It is better to know one thing well than a hundred things poorly.",
        featuredComment: {
          id: "comment-2",
          noteId: "note-2",
          authorNickname: "Min-ho Park",
          text: "학문적 열정이 집착으로 변해가는 과정을 보며 소름이 돋았습니다. 우리가 공부하는 목적에 대해 다시 생각해보게 된 페이지예요.",
          createdAt: "2024.03.15",
          replyCount: 0,
        },
        createdAt: "2024.03.15",
      },
    ],
  },
  {
    id: "briefly-gorgeous",
    tabLabel: "Briefly Gorgeous",
    title: "On Earth We're Briefly Gorgeous",
    author: "Ocean Vuong",
    coverColor: "#6b7a52",
    curatorQuote:
      "글쓰기는 공감의 형태입니다. 쓴다는 것은 '나는 당신을 이해하려 했다'고 말하는 것입니다.",
    curatorAttribution: "Bibliotheca Curation Team",
    readingNotes: [
      {
        id: "note-3",
        authorId: "user-3",
        authorNickname: "Amara Kim",
        bookId: "briefly-gorgeous",
        swapRequestId: "swap-2",
        page: 32,
        quote: "Let me begin again.",
        featuredComment: {
          id: "comment-3",
          noteId: "note-3",
          authorNickname: "Amara Kim",
          text: "이 세 단어만으로 책 전체의 감정을 담아낸 것 같아요. 처음부터 다시 읽고 싶어졌습니다.",
          createdAt: "2024.03.14",
          replyCount: 2,
        },
        createdAt: "2024.03.14",
      },
    ],
  },
];

const AVATAR_COLORS = ["#5a633a", "#3e432e", "#7a6a52", "#4a5a3a"];

function getInitials(name: string) {
  return name.charAt(0).toUpperCase();
}

function getAvatarColor(name: string) {
  const index = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

function BookCover({ color }: { color: string }) {
  return (
    <div
      className="w-full aspect-[3/4] flex flex-col items-center justify-center gap-3"
      style={{ backgroundColor: color }}
    >
      <svg
        width="68"
        height="68"
        viewBox="0 0 68 68"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M34 10C34 10 16 15 16 34C16 50 34 58 34 58C34 58 52 50 52 34C52 15 34 10 34 10Z"
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1.5"
        />
        <path
          d="M19 22L34 12L34 56C34 56 19 48 19 34Z"
          fill="rgba(255,255,255,0.12)"
        />
        <path
          d="M49 22L34 12L34 56C34 56 49 48 49 34Z"
          fill="rgba(255,255,255,0.08)"
        />
        <line
          x1="34"
          y1="12"
          x2="34"
          y2="56"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="1"
        />
      </svg>
      <span className="text-white/40 text-[9px] tracking-[0.35em] uppercase font-body">
        BookSwap
      </span>
    </div>
  );
}

function PencilIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function NoteCard({ note }: { note: ReadingNote }) {
  const { featuredComment } = note;
  const replyLabel =
    featuredComment && featuredComment.replyCount > 0
      ? `댓글 ${featuredComment.replyCount}개 보기`
      : "댓글 달기";

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-neutral/50 text-sm font-body tabular-nums">
          {note.page}p
        </span>
        <div className="flex-1 h-px bg-neutral/15" />
      </div>

      <blockquote className="font-headline italic text-neutral text-[1.05rem] leading-relaxed mb-4">
        &ldquo;{note.quote}&rdquo;
      </blockquote>

      {featuredComment && (
        <div className="bg-white/60 border border-neutral/8 rounded-sm p-4">
          <div className="flex gap-3.5">
            <div className="w-[90px] h-[68px] flex-shrink-0 rounded-sm bg-neutral/10 overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-neutral/12 to-neutral/5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[9px] text-secondary font-body font-semibold flex-shrink-0"
                  style={{
                    backgroundColor: getAvatarColor(
                      featuredComment.authorNickname
                    ),
                  }}
                >
                  {getInitials(featuredComment.authorNickname)}
                </div>
                <span className="text-[11px] font-body font-medium text-neutral">
                  {featuredComment.authorNickname}
                </span>
                <span className="text-[10px] text-neutral/35 font-body">
                  {featuredComment.createdAt}
                </span>
              </div>
              <p className="text-[11.5px] text-neutral/65 font-body leading-relaxed line-clamp-3">
                {featuredComment.text}
              </p>
            </div>
          </div>
          <button className="flex items-center gap-1.5 mt-3 text-[10px] text-neutral/40 hover:text-neutral/60 font-body tracking-wide transition-colors">
            <CommentIcon />
            {replyLabel}
          </button>
        </div>
      )}
    </div>
  );
}

export default function SwapDetail() {
  const [activeIndex, setActiveIndex] = useState(0);
  const book = SWAP_BOOKS[activeIndex];

  return (
    <div className="w-full">
      {/* Tab bar */}
      <div className="border-b border-neutral/10">
        <div className="max-w-4xl mx-auto px-8 flex">
          {SWAP_BOOKS.map((b, i) => (
            <button
              key={b.id}
              onClick={() => setActiveIndex(i)}
              className={`py-4 mr-8 text-[10px] tracking-[0.22em] uppercase transition-colors ${
                activeIndex === i
                  ? "text-neutral border-b-2 border-neutral -mb-px"
                  : "text-neutral/35 hover:text-neutral/55"
              }`}
            >
              {b.tabLabel.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-8 py-10 grid grid-cols-[5fr_7fr] gap-12">
        {/* Left: Book info */}
        <div>
          <BookCover color={book.coverColor} />
          <h1 className="font-headline text-[1.75rem] text-neutral mt-5 leading-snug">
            {book.title}
          </h1>
          <p className="text-neutral/45 text-sm mt-1.5 font-body">
            {book.author}
          </p>
          <div className="mt-5 bg-white/50 px-5 py-4 border border-neutral/10 rounded-sm">
            <p className="font-headline italic text-neutral/80 text-[0.88rem] leading-relaxed">
              &ldquo;{book.curatorQuote}&rdquo;
            </p>
            <p className="text-[9px] tracking-[0.2em] uppercase text-neutral/35 mt-3 font-body">
              — {book.curatorAttribution}
            </p>
          </div>
        </div>

        {/* Right: Reading notes */}
        <div>
          <div className="flex items-center justify-between mb-7">
            <p className="text-[10px] tracking-[0.28em] uppercase text-neutral/45 font-body">
              Reading Note
            </p>
            <button className="flex items-center gap-2 bg-primary text-secondary text-[10px] tracking-[0.18em] uppercase px-4 py-2.5 hover:bg-tertiary transition-colors">
              <PencilIcon />
              등록하기
            </button>
          </div>

          <div className="flex flex-col gap-9">
            {book.readingNotes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

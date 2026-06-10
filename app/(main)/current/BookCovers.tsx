"use client";

import { useState } from "react";
import Image from "next/image";
import BookDetailPopup from "@/components/BookDetailPopup";
import { highResCover } from "@/lib/utils/cover";

export type BookSide = {
  title: string;
  cover_image: string | null;
  coverColor: string;
  nickname: string;
  message: string | null;
};

type Props = {
  left: BookSide;
  right: BookSide;
};

function SwapArrowIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 16V4m0 0L3 8m4-4l4 4" />
      <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  );
}

function Cover({ book }: { book: BookSide }) {
  const src = highResCover(book.cover_image);
  if (src) {
    return (
      <div
        className="relative w-full aspect-[3/4] overflow-hidden"
        style={{ borderRadius: "8px", border: "1px solid #E0E0E0" }}
      >
        <Image src={src} alt={book.title} fill className="object-cover object-top" quality={90} />
      </div>
    );
  }
  return (
    <div
      className="w-full aspect-[3/4]"
      style={{
        backgroundColor: book.coverColor,
        borderRadius: "8px",
        border: "1px solid #E0E0E0",
      }}
    />
  );
}

export default function BookCovers({ left, right }: Props) {
  const [open, setOpen] = useState<"left" | "right" | null>(null);
  const selected = open === "left" ? left : open === "right" ? right : null;

  return (
    <>
      <div className="flex items-center gap-4">
        <button
          className="flex-1 overflow-hidden transition-transform hover:scale-[1.02]"
          onClick={() => setOpen("left")}
          aria-label={`${left.nickname}님의 책 정보 보기`}
        >
          <Cover book={left} />
        </button>
        <div
          className="flex-shrink-0 flex items-center justify-center"
          style={{ color: "#030505" }}
          aria-hidden="true"
        >
          <SwapArrowIcon />
        </div>
        <button
          className="flex-1 overflow-hidden transition-transform hover:scale-[1.02]"
          onClick={() => setOpen("right")}
          aria-label={`${right.nickname}님의 책 정보 보기`}
        >
          <Cover book={right} />
        </button>
      </div>

      {selected && (
        <BookDetailPopup
          reason={selected.message ?? undefined}
          userNickname={selected.nickname}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
}

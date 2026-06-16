"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { highResCover } from "@/lib/utils/cover";
import PublicRequestEditPopup from "./PublicRequestEditPopup";

type BookRef = { id: string; title: string; author: string; cover_image: string | null } | null;

type Swap = {
  id: string;
  created_at: string;
  requester_message: string | null;
  offered_book: BookRef;
  wanted_book: BookRef;
  receiver: { id: string; nickname: string | null } | null;
};

type UserBook = {
  id: string;
  title: string;
  author: string;
};

type Props = {
  swap: Swap;
  userBooks: UserBook[];
};

export default function MyPublicRequestActions({ swap, userBooks }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);

  if (deleted) return null;

  const book = swap.offered_book;
  const wantedBook = swap.wanted_book;
  const dateStr = swap.created_at.slice(0, 10).replace(/-/g, ".");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-left"
      >
        <div
          className="flex items-center gap-4 px-4 py-3"
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #E0E0E0",
            borderRadius: "12px",
            cursor: "pointer",
          }}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              {book?.cover_image ? (
                <div
                  className="relative w-9 h-12 flex-shrink-0 overflow-hidden"
                  style={{ borderRadius: "4px", border: "1px solid #E0E0E0" }}
                >
                  <Image src={highResCover(book.cover_image)!} alt="" fill className="object-cover object-top" sizes="36px" />
                </div>
              ) : (
                <div
                  className="w-9 h-12 flex-shrink-0"
                  style={{ backgroundColor: "#a0e4f2", borderRadius: "4px", border: "1px solid #E0E0E0" }}
                />
              )}
              <div className="min-w-0 max-w-[110px]">
                <p className="text-xs leading-snug line-clamp-2" style={{ color: "#030505" }}>{book?.title ?? "—"}</p>
              </div>
            </div>
            {wantedBook && (
              <>
                <span style={{ color: "#aaaaaa", fontSize: "0.75rem" }}>→</span>
                <div className="flex items-center gap-2 min-w-0">
                  {wantedBook.cover_image ? (
                    <div
                      className="relative w-9 h-12 flex-shrink-0 overflow-hidden"
                      style={{ borderRadius: "4px", border: "1px solid #E0E0E0" }}
                    >
                      <Image src={highResCover(wantedBook.cover_image)!} alt="" fill className="object-cover object-top" sizes="36px" />
                    </div>
                  ) : (
                    <div
                      className="w-9 h-12 flex-shrink-0"
                      style={{ backgroundColor: "#f7a8c7", borderRadius: "4px", border: "1px solid #E0E0E0" }}
                    />
                  )}
                  <div className="min-w-0 max-w-[110px]">
                    <p className="text-xs leading-snug line-clamp-2" style={{ color: "#030505" }}>{wantedBook.title}</p>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="flex-shrink-0 text-right">
            <span
              style={{
                display: "inline-block",
                backgroundColor: "#f4d23d",
                border: "1px solid #030505",
                borderRadius: "9999px",
                padding: "1px 8px",
                fontSize: "0.5625rem",
                fontWeight: 700,
                color: "#030505",
              }}
            >
              내가 요청
            </span>
            <p className="text-xs mt-1" style={{ color: "#555555" }}>공개 모집 중</p>
            <p style={{ fontSize: "0.5625rem", color: "#aaaaaa", marginTop: "2px" }}>{dateStr}</p>
          </div>
        </div>
      </button>

      {open && (
        <PublicRequestEditPopup
          swapId={swap.id}
          initialOfferedBook={swap.offered_book}
          initialMessage={swap.requester_message}
          userBooks={userBooks}
          onClose={() => setOpen(false)}
          onSaved={() => { setOpen(false); router.refresh(); }}
          onDeleted={() => { setOpen(false); setDeleted(true); }}
        />
      )}
    </>
  );
}

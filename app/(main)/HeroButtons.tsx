"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import SwapRequestPopup from "@/components/SwapRequestPopup";

type ExistingBook = { id: string; isbn: string | null; title: string };

export default function HeroButtons() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [userBooks, setUserBooks] = useState<ExistingBook[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleStartSwapping() {
    if (!session) {
      signIn("kakao");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/user-books");
      const data = await res.json();
      setUserBooks(Array.isArray(data) ? data : []);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={handleStartSwapping}
          disabled={loading}
          style={{
            backgroundColor: "#f4d23d",
            border: "2px solid #030505",
            borderRadius: "9999px",
            padding: "11px 24px",
            fontWeight: 700,
            fontSize: "0.875rem",
            boxShadow: "0px 1px 4px rgba(3,5,5,0.06)",
            color: "#030505",
            fontFamily: "var(--font-fredoka)",
            transition: "transform 150ms, box-shadow 150ms",
            cursor: loading ? "wait" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
          className="hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0px_#030505] active:translate-x-0.5 active:translate-y-0.5"
        >
          {loading ? "Loading…" : "Start Swapping →"}
        </button>
        <Link
          href="/current"
          style={{
            backgroundColor: "transparent",
            border: "2px solid #030505",
            borderRadius: "9999px",
            padding: "11px 24px",
            fontWeight: 700,
            fontSize: "0.875rem",
            color: "#030505",
            textDecoration: "none",
            display: "inline-block",
            fontFamily: "var(--font-fredoka)",
          }}
          className="hover:bg-[#f5f5f5] transition-colors"
        >
          Current Swap
        </Link>
      </div>

      {open && (
        <SwapRequestPopup
          userBooks={userBooks}
          onClose={() => setOpen(false)}
          onSuccess={() => setOpen(false)}
        />
      )}
    </>
  );
}

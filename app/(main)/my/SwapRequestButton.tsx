"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SwapRequestPopup from "@/components/SwapRequestPopup";

type ExistingBook = {
  id: string;
  isbn: string | null;
  title: string;
};

export default function SwapRequestButton({ userBooks }: { userBooks: ExistingBook[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="transition-colors hover:bg-[#f5f5f5]"
        style={{
          backgroundColor: "#ffffff",
          border: "2px solid #030505",
          borderRadius: "9999px",
          padding: "7px 16px",
          fontWeight: 700,
          fontSize: "0.75rem",
          boxShadow: "0px 1px 4px rgba(3,5,5,0.06)",
          color: "#030505",
        }}
      >
        교환독서 신청하기
      </button>
      {open && (
        <SwapRequestPopup
          userBooks={userBooks}
          onClose={() => setOpen(false)}
          onSuccess={() => router.refresh()}
        />
      )}
    </>
  );
}

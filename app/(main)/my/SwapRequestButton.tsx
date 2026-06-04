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
        className="flex items-center gap-1.5 border border-neutral/20 px-3 py-1.5 text-[11px] font-body text-neutral/60 hover:border-neutral/40 transition-colors"
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

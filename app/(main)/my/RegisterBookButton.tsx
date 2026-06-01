"use client";

import { useState } from "react";
import RegisterBookPopup from "@/components/RegisterBookPopup";

function PlusIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export default function RegisterBookButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 border border-neutral/20 px-3 py-1.5 text-[11px] font-body text-neutral/60 hover:border-neutral/40 transition-colors"
      >
        <PlusIcon />
        책 등록하기
      </button>
      {open && <RegisterBookPopup onClose={() => setOpen(false)} />}
    </>
  );
}

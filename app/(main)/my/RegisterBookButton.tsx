"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RegisterBookPopup from "@/components/RegisterBookPopup";

export default function RegisterBookButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="transition-colors hover:brightness-95"
        style={{
          backgroundColor: "#f4d23d",
          border: "2px solid #030505",
          borderRadius: "9999px",
          padding: "7px 16px",
          fontWeight: 700,
          fontSize: "0.75rem",
          boxShadow: "0px 1px 4px rgba(3,5,5,0.06)",
          color: "#030505",
        }}
      >
        + 책 등록하기
      </button>
      {open && (
        <RegisterBookPopup
          onClose={() => setOpen(false)}
          onSuccess={() => router.refresh()}
        />
      )}
    </>
  );
}

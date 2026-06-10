"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function HamburgerMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (status !== "authenticated") return null;

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="메뉴 열기"
        aria-expanded={open}
        style={{ color: "#030505", padding: "4px" }}
      >
        <svg width="22" height="16" viewBox="0 0 22 16" fill="none" aria-hidden="true">
          <line x1="0" y1="1" x2="22" y2="1" stroke="currentColor" strokeWidth="1.5" />
          <line x1="0" y1="8" x2="22" y2="8" stroke="currentColor" strokeWidth="1.5" />
          <line x1="0" y1="15" x2="22" y2="15" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-36 py-1 z-50"
          style={{ backgroundColor: "#ffffff", border: "1px solid #E0E0E0", borderRadius: "12px", boxShadow: "0px 2px 8px rgba(3,5,5,0.08)" }}
        >
          {session && (
            <>
              <Link
                href="/current"
                onClick={() => setOpen(false)}
                className="block w-full px-4 py-2.5 transition-colors hover:bg-[#f5f5f5]"
                style={{ fontSize: "0.75rem", color: "#030505", textDecoration: "none" }}
              >
                나의 교환독서
              </Link>
              <Link
                href="/my"
                onClick={() => setOpen(false)}
                className="block w-full px-4 py-2.5 transition-colors hover:bg-[#f5f5f5]"
                style={{ fontSize: "0.75rem", color: "#030505", textDecoration: "none" }}
              >
                마이페이지
              </Link>
              <button
                onClick={() => { setOpen(false); signOut(); }}
                className="w-full text-left px-4 py-2.5 transition-colors hover:bg-[#f5f5f5]"
                style={{ fontSize: "0.75rem", color: "#030505" }}
              >
                로그아웃
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

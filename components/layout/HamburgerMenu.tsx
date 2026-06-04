"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function HamburgerMenu() {
  const { data: session } = useSession();
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

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="메뉴 열기"
        aria-expanded={open}
        className="text-primary p-1"
      >
        <svg width="22" height="16" viewBox="0 0 22 16" fill="none" aria-hidden="true">
          <line x1="0" y1="1" x2="22" y2="1" stroke="currentColor" strokeWidth="1.5" />
          <line x1="0" y1="8" x2="22" y2="8" stroke="currentColor" strokeWidth="1.5" />
          <line x1="0" y1="15" x2="22" y2="15" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-36 bg-secondary border border-primary/10 shadow-sm py-1 z-50">
          {session && (
            <>
              <Link
                href="/my"
                onClick={() => setOpen(false)}
                className="block w-full px-4 py-2.5 text-[11px] font-body text-primary/70 hover:text-primary hover:bg-primary/5 tracking-wide transition-colors"
              >
                마이페이지
              </Link>
              <button
                onClick={() => { setOpen(false); signOut(); }}
                className="w-full text-left px-4 py-2.5 text-[11px] font-body text-primary/70 hover:text-primary hover:bg-primary/5 tracking-wide transition-colors"
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

"use client";

import { ReactNode, useEffect } from "react";

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

type PopupProps = {
  onClose: () => void;
  children: ReactNode;
};

export default function Popup({ onClose, children }: PopupProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(3,5,5,0.45)" }}
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md mx-4 bg-white overflow-hidden"
        style={{ border: "1px solid #E0E0E0", borderRadius: "12px", boxShadow: "0px 2px 8px rgba(3,5,5,0.08)" }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 transition-opacity hover:opacity-60"
          style={{ color: "#888888" }}
          aria-label="닫기"
        >
          <XIcon />
        </button>
        {children}
      </div>
    </div>
  );
}

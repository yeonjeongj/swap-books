"use client";

import { ReactNode } from "react";

function XIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-neutral/40" onClick={onClose} />
      <div className="relative bg-secondary border border-neutral/15 w-full max-w-md mx-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral/40 hover:text-neutral/70 transition-colors"
          aria-label="닫기"
        >
          <XIcon />
        </button>
        {children}
      </div>
    </div>
  );
}

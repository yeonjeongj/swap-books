"use client";

import Popup from "./ui/Popup";

type Props = {
  onClose: () => void;
  quote?: string;
  reason?: string;
  userNickname: string;
};

export default function BookDetailPopup({ onClose, quote, reason, userNickname }: Props) {
  return (
    <Popup onClose={onClose}>
      <div className="px-7 pt-8 pb-7">
        {quote && (
          <blockquote className="font-headline italic text-neutral text-[1.15rem] leading-relaxed mb-6">
            &ldquo;{quote}&rdquo;
          </blockquote>
        )}

        {reason && (
          <div className="mb-6">
            <p className="text-[10px] tracking-[0.15em] uppercase text-neutral/40 font-body mb-2">
              추천하는 이유
            </p>
            <p className="text-sm font-body text-neutral/65 leading-relaxed">{reason}</p>
          </div>
        )}

        <p className="text-[10px] text-neutral/35 font-body">From. {userNickname}</p>
      </div>
    </Popup>
  );
}

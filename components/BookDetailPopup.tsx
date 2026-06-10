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
      <div className="px-6 pt-7 pb-6">
        {quote && (
          <blockquote
            style={{
              fontFamily: "var(--font-fredoka)",
              fontSize: "1.1rem",
              color: "#030505",
              lineHeight: 1.5,
              marginBottom: "1.25rem",
            }}
          >
            &ldquo;{quote}&rdquo;
          </blockquote>
        )}

        {reason && (
          <div style={{ marginBottom: "1.25rem" }}>
            <span
              style={{
                display: "inline-block",
                backgroundColor: "#a0e4f2",
                border: "1.5px solid #030505",
                borderRadius: "9999px",
                padding: "2px 10px",
                fontSize: "0.625rem",
                fontWeight: 700,
                marginBottom: "0.5rem",
              }}
            >
              추천 이유
            </span>
            <p style={{ fontSize: "0.875rem", color: "#555555", lineHeight: 1.6 }}>
              {reason}
            </p>
          </div>
        )}

        <p style={{ fontSize: "0.6875rem", color: "#aaaaaa" }}>From. {userNickname}</p>
      </div>
    </Popup>
  );
}

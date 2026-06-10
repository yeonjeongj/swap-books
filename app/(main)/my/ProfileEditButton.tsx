"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import OnboardingPopup from "@/components/OnboardingPopup";

export default function ProfileEditButton() {
  const { data: session, update } = useSession();
  const [show, setShow] = useState(false);

  if (!session) return null;

  return (
    <>
      <button
        onClick={() => setShow(true)}
        className="transition-colors hover:bg-[#f5f5f5]"
        style={{
          backgroundColor: "#ffffff",
          border: "1.5px solid #dddddd",
          borderRadius: "9999px",
          padding: "7px 16px",
          fontWeight: 600,
          fontSize: "0.75rem",
          color: "#555555",
        }}
      >
        프로필 수정
      </button>

      {show && (
        <OnboardingPopup
          title="프로필 수정"
          defaultNickname={session.user.nickname ?? session.user.name ?? ""}
          defaultAvatarUrl={session.user.avatarUrl ?? session.user.image ?? ""}
          onComplete={async (nickname, avatarUrl) => {
            await Promise.all([
              update({ nickname, avatarUrl }),
              fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nickname, avatarUrl }),
              }),
            ]);
            setShow(false);
          }}
          onClose={() => setShow(false)}
        />
      )}
    </>
  );
}

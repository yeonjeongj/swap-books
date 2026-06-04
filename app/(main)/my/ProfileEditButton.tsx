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
        className="flex items-center gap-1.5 border border-neutral/20 px-3 py-1.5 text-[11px] font-body text-neutral/60 hover:border-neutral/40 hover:text-neutral/80 transition-colors"
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

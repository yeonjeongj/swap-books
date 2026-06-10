"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import OnboardingPopup from "@/components/OnboardingPopup";

export default function OnboardingController() {
  const { data: session, status, update } = useSession();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;
    if (!session.user.nickname) {
      queueMicrotask(() => setShow(true));
    }
  }, [status, session?.user?.id, session?.user?.nickname]);

  if (!show || !session) return null;

  return (
    <OnboardingPopup
      title="프로필을 설정해주세요"
      defaultNickname={session.user.name || ""}
      defaultAvatarUrl={session.user.image || ""}
      onComplete={async (nickname, avatarUrl) => {
        const [, response] = await Promise.all([
          update({ nickname, avatarUrl }),
          fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nickname, avatarUrl }),
          }),
        ]);
        if (!response.ok) {
          throw new Error("Failed to save user profile to database");
        }
        setShow(false);
      }}
      onClose={() => setShow(false)}
    />
  );
}

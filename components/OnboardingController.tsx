"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import OnboardingPopup from "@/components/OnboardingPopup";

const getStorageKey = (userId: string) => `bibliotheca_onboarded_${userId}`;

export default function OnboardingController() {
  const { data: session, status, update } = useSession();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;
    const key = getStorageKey(session.user.id);
    // If user already completed onboarding (has a saved profile), mark and skip
    if (session.user.hasCompletedOnboarding) {
      localStorage.setItem(key, "1");
      return;
    }
    if (!localStorage.getItem(key)) {
      queueMicrotask(() => setShow(true));
    }
  }, [status, session?.user?.id, session?.user?.hasCompletedOnboarding]);

  if (!show || !session) return null;

  return (
    <OnboardingPopup
      title="프로필을 설정해주세요"
      defaultNickname={session.user.name || ""}
      defaultAvatarUrl={session.user.image || ""}
      onComplete={async (nickname, avatarUrl) => {
        const [, response] = await Promise.all([
          update({ nickname, avatarUrl, hasCompletedOnboarding: true }),
          fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nickname, avatarUrl }),
          }),
        ]);
        if (!response.ok) {
          throw new Error("Failed to save user profile to database");
        }
        if (session?.user?.id) {
          localStorage.setItem(getStorageKey(session.user.id), "1");
        }
        setShow(false);
      }}
      onClose={() => setShow(false)}
    />
  );
}

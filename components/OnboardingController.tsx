"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import OnboardingPopup from "@/components/OnboardingPopup";

const STORAGE_KEY = "bibliotheca_onboarded";

export default function OnboardingController() {
  const { data: session, status, update } = useSession();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && !localStorage.getItem(STORAGE_KEY)) {
      setShow(true);
    }
  }, [status]);

  if (!show || !session) return null;

  return (
    <OnboardingPopup
      defaultNickname={session.user.nickname || session.user.name || ""}
      defaultAvatarUrl={session.user.avatarUrl || session.user.image || ""}
      onComplete={async (nickname, avatarUrl) => {
        await update({ nickname, avatarUrl });
        localStorage.setItem(STORAGE_KEY, "1");
        setShow(false);
      }}
      onClose={() => setShow(false)}
    />
  );
}

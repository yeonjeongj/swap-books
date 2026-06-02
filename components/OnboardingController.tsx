"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import OnboardingPopup from "@/components/OnboardingPopup";

const getStorageKey = (userId: string) => `bibliotheca_onboarded_${userId}`;

export default function OnboardingController() {
  const { data: session, status, update } = useSession();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      if (!localStorage.getItem(getStorageKey(session.user.id))) {
        setShow(true);
      }
    }
  }, [status, session]);

  if (!show || !session) return null;

  return (
    <OnboardingPopup
      defaultNickname={session.user.nickname || session.user.name || ""}
      defaultAvatarUrl={session.user.avatarUrl || session.user.image || ""}
      onComplete={async (nickname, avatarUrl) => {
        await update({ nickname, avatarUrl });
        if (session?.user?.id) {
          localStorage.setItem(getStorageKey(session.user.id), "1");
        }
        setShow(false);
      }}
      onClose={() => setShow(false)}
    />
  );
}

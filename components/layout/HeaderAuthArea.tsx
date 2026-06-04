"use client";

import { useSession, signIn } from "next-auth/react";
import Image from "next/image";
import NotificationBell from "./NotificationBell";

export default function HeaderAuthArea() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="w-7 h-7 rounded-full bg-primary/10 animate-pulse" />;
  }

  if (!session) {
    return (
      <button
        onClick={() => signIn("kakao")}
        className="text-[10px] tracking-[0.2em] uppercase text-primary/60 hover:text-primary border border-primary/20 hover:border-primary/50 px-3 py-1.5 transition-colors font-body"
      >
        로그인
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <NotificationBell />
      <span className="text-[11px] font-body text-primary/60 hidden sm:block">
        {session.user.nickname}
      </span>
      <div className="flex-shrink-0">
        {session.user.avatarUrl ? (
          <div className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-primary/15">
            <Image
              src={session.user.avatarUrl}
              alt={session.user.nickname ?? ""}
              width={28}
              height={28}
              className="object-cover w-full h-full"
            />
          </div>
        ) : (
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[11px] text-primary font-body font-semibold ring-1 ring-primary/15">
            {session.user.nickname?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
      </div>
    </div>
  );
}

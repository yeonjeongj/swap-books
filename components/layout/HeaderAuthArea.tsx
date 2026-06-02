"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";

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
      <span className="text-[11px] font-body text-primary/60 hidden sm:block">
        {session.user.nickname}
      </span>
      <button
        onClick={() => signOut()}
        className="group relative flex-shrink-0"
        aria-label="로그아웃"
        title="로그아웃"
      >
        {session.user.avatarUrl ? (
          <Image
            src={session.user.avatarUrl}
            alt={session.user.nickname}
            width={28}
            height={28}
            className="rounded-full object-cover ring-1 ring-primary/15 group-hover:ring-primary/40 transition-all"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[11px] text-primary font-body font-semibold ring-1 ring-primary/15 group-hover:ring-primary/40 transition-all">
            {session.user.nickname?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
      </button>
    </div>
  );
}

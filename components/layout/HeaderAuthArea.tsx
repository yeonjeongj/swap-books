"use client";

import { useSession, signIn } from "next-auth/react";
import Image from "next/image";
import NotificationBell from "./NotificationBell";

export default function HeaderAuthArea() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div
        className="w-7 h-7 rounded-full animate-pulse"
        style={{ backgroundColor: "#e5e5e5" }}
      />
    );
  }

  if (!session) {
    return (
      <button
        onClick={() => signIn("kakao")}
        className="transition-colors hover:bg-[#f4d23d]"
        style={{
          fontSize: "0.6875rem",
          fontWeight: 700,
          color: "#030505",
          border: "1.5px solid #030505",
          borderRadius: "9999px",
          padding: "5px 14px",
        }}
      >
        로그인
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <NotificationBell />
      <span
        className="hidden sm:block"
        style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#555555" }}
      >
        {session.user.nickname}
      </span>
      <div className="flex-shrink-0">
        {session.user.avatarUrl ? (
          <div
            className="w-7 h-7 rounded-full overflow-hidden"
            style={{ border: "1.5px solid #030505" }}
          >
            <Image
              src={session.user.avatarUrl}
              alt={session.user.nickname ?? ""}
              width={28}
              height={28}
              className="object-cover w-full h-full"
            />
          </div>
        ) : (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: "#a0e4f2",
              border: "1.5px solid #030505",
              fontSize: "0.6875rem",
              fontWeight: 700,
              color: "#030505",
            }}
          >
            {session.user.nickname?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
      </div>
    </div>
  );
}

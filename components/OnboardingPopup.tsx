"use client";

import { useState } from "react";
import Image from "next/image";
import Popup from "@/components/ui/Popup";

type Props = {
  defaultNickname: string;
  defaultAvatarUrl: string;
  onComplete: (nickname: string, avatarUrl: string) => Promise<void>;
  onClose: () => void;
};

export default function OnboardingPopup({
  defaultNickname,
  defaultAvatarUrl,
  onComplete,
  onClose,
}: Props) {
  const [nickname, setNickname] = useState(defaultNickname);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = nickname.trim();
    if (!trimmed) {
      setError("닉네임을 입력해주세요.");
      return;
    }
    setLoading(true);
    await onComplete(trimmed, defaultAvatarUrl);
    setLoading(false);
  }

  return (
    <Popup onClose={onClose}>
      <div className="px-8 py-10">
        <p className="text-[10px] tracking-[0.28em] uppercase text-neutral/40 font-body mb-1">
          Welcome
        </p>
        <h2 className="font-headline text-[1.4rem] text-neutral mb-6">
          프로필을 설정해주세요
        </h2>

        {/* Avatar preview */}
        <div className="flex justify-center mb-7">
          {defaultAvatarUrl ? (
            <Image
              src={defaultAvatarUrl}
              alt="프로필 이미지"
              width={72}
              height={72}
              className="rounded-full object-cover ring-2 ring-neutral/10"
            />
          ) : (
            <div className="w-[72px] h-[72px] rounded-full bg-primary/15 flex items-center justify-center text-2xl text-primary font-headline">
              {nickname?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="nickname"
              className="text-[10px] tracking-[0.2em] uppercase text-neutral/50 font-body"
            >
              닉네임 <span className="text-primary">*</span>
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setError("");
              }}
              maxLength={20}
              placeholder="닉네임을 입력하세요"
              className="bg-white/60 border border-neutral/15 px-4 py-2.5 text-sm font-body text-neutral placeholder:text-neutral/30 focus:outline-none focus:border-neutral/40 transition-colors"
            />
            {error && (
              <p className="text-[11px] text-red-400 font-body">{error}</p>
            )}
          </div>

          <p className="text-[10px] text-neutral/35 font-body">
            프로필 이미지는 카카오 계정 이미지가 사용됩니다.
          </p>

          <button
            type="submit"
            disabled={loading || !nickname.trim()}
            className="mt-2 bg-primary text-secondary text-[10px] tracking-[0.22em] uppercase px-6 py-3 hover:bg-tertiary transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-body"
          >
            {loading ? "저장 중..." : "시작하기"}
          </button>
        </form>
      </div>
    </Popup>
  );
}

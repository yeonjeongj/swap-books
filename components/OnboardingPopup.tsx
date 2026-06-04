"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Popup from "@/components/ui/Popup";

type Props = {
  title: string;
  defaultNickname: string;
  defaultAvatarUrl: string;
  onComplete: (nickname: string, avatarUrl: string) => Promise<void>;
  onClose: () => void;
};

export default function OnboardingPopup({
  title,
  defaultNickname,
  defaultAvatarUrl,
  onComplete,
  onClose,
}: Props) {
  const [nickname, setNickname] = useState(defaultNickname);
  const [avatarUrl, setAvatarUrl] = useState(defaultAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/users/avatar", { method: "POST", body: form });
      if (res.ok) {
        const json = await res.json();
        setAvatarUrl(json.url);
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = nickname.trim();
    if (!trimmed) {
      setError("닉네임을 입력해주세요.");
      return;
    }
    setLoading(true);
    try {
      await onComplete(trimmed, avatarUrl);
    } catch {
      setError("프로필 저장 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Popup onClose={onClose}>
      <div className="px-8 py-10">
        <p className="text-[10px] tracking-[0.28em] uppercase text-neutral/40 font-body mb-1">
          Profile
        </p>
        <h2 className="font-headline text-[1.4rem] text-neutral mb-6">{title}</h2>

        {/* Avatar upload */}
        <div className="flex justify-center mb-7">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative group"
            disabled={uploading}
            aria-label="프로필 이미지 변경"
          >
            {avatarUrl ? (
              <div className="w-[72px] h-[72px] rounded-full overflow-hidden ring-2 ring-neutral/10">
                <Image
                  src={avatarUrl}
                  alt="프로필 이미지"
                  width={72}
                  height={72}
                  className="object-cover w-full h-full"
                />
              </div>
            ) : (
              <div className="w-[72px] h-[72px] rounded-full bg-primary/15 flex items-center justify-center text-2xl text-primary font-headline">
                {nickname?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <span className="text-[9px] text-white font-body tracking-wide">
                {uploading ? "..." : "변경"}
              </span>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
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

          <button
            type="submit"
            disabled={loading || uploading || !nickname.trim()}
            className="mt-2 bg-primary text-secondary text-[10px] tracking-[0.22em] uppercase px-6 py-3 hover:bg-tertiary transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-body"
          >
            {loading ? "저장 중..." : "저장하기"}
          </button>
        </form>
      </div>
    </Popup>
  );
}

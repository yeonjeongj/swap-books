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
      <div className="px-7 py-8">
        <span
          style={{
            display: "inline-block",
            backgroundColor: "#a0e4f2",
            border: "1.5px solid #030505",
            borderRadius: "9999px",
            padding: "3px 12px",
            fontSize: "0.6875rem",
            fontWeight: 700,
            marginBottom: "0.5rem",
          }}
        >
          Profile
        </span>
        <h2
          style={{
            fontFamily: "var(--font-fredoka)",
            fontSize: "1.4rem",
            fontWeight: 700,
            color: "#030505",
            marginBottom: "1.5rem",
          }}
        >
          {title}
        </h2>

        {/* Avatar upload */}
        <div className="flex justify-center mb-6">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative group"
            disabled={uploading}
            aria-label="프로필 이미지 변경"
          >
            {avatarUrl ? (
              <div
                className="w-[72px] h-[72px] rounded-full overflow-hidden"
                style={{ border: "2px solid #030505" }}
              >
                <Image
                  src={avatarUrl}
                  alt="프로필 이미지"
                  width={72}
                  height={72}
                  className="object-cover w-full h-full"
                />
              </div>
            ) : (
              <div
                className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-2xl font-bold"
                style={{ backgroundColor: "#a0e4f2", border: "2px solid #030505", color: "#030505", fontFamily: "var(--font-fredoka)" }}
              >
                {nickname?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <span style={{ fontSize: "0.6875rem", color: "#ffffff" }}>
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
              style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#888888" }}
            >
              닉네임 <span style={{ color: "#030505" }}>*</span>
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
              className="w-full px-4 py-2.5 text-sm outline-none transition-colors focus:border-[#030505]"
              style={{
                border: "1.5px solid #dddddd",
                borderRadius: "8px",
                color: "#030505",
                backgroundColor: "#ffffff",
              }}
            />
            {error && (
              <p style={{ fontSize: "0.6875rem", color: "#ef4444" }}>{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || uploading || !nickname.trim()}
            className="mt-1 transition-colors hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "#f4d23d",
              border: "2px solid #030505",
              borderRadius: "9999px",
              padding: "10px 24px",
              fontWeight: 700,
              fontSize: "0.875rem",
              boxShadow: "0px 1px 4px rgba(3,5,5,0.06)",
              color: "#030505",
            }}
          >
            {loading ? "저장 중..." : "저장하기"}
          </button>
        </form>
      </div>
    </Popup>
  );
}

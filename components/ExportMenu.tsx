"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props =
  | { swapId: string; userBookId?: never }
  | { userBookId: string; swapId?: never };

const NOTION_AUTH_BASE = "https://api.notion.com/v1/oauth/authorize";

export default function ExportMenu({ swapId, userBookId }: Props) {
  const [open, setOpen] = useState(false);
  const [notionLoading, setNotionLoading] = useState(false);
  const [docxLoading, setDocxLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const query = swapId ? `?swapId=${swapId}` : `?userBookId=${userBookId}`;

  // 노션 OAuth 콜백 후 자동 실행
  useEffect(() => {
    const notionReady = searchParams.get("notion_ready");
    const notionError = searchParams.get("notion_error");

    if (notionReady === "1") {
      router.replace(pathname, { scroll: false });
      void handleNotionExport();
    } else if (notionError === "1") {
      router.replace(pathname, { scroll: false });
      setMessage("노션 연동에 실패했습니다. 다시 시도해주세요.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleWordExport() {
    setDocxLoading(true);
    const a = document.createElement("a");
    a.href = `/api/export/docx${query}`;
    a.click();
    setTimeout(() => setDocxLoading(false), 2000);
    setOpen(false);
  }

  async function handleNotionExport() {
    setNotionLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/export/notion${query}`, { method: "POST" });

      if (res.status === 403) {
        const json = await res.json();
        if (json.error === "notion_not_connected") {
          const clientId = process.env.NEXT_PUBLIC_NOTION_CLIENT_ID;
          if (!clientId) {
            setMessage("노션 연동 설정이 완료되지 않았습니다.");
            return;
          }
          const callbackUrl = encodeURIComponent(
            `${window.location.origin}/api/auth/notion/callback`
          );
          const state = encodeURIComponent(pathname);
          window.location.href =
            `${NOTION_AUTH_BASE}?client_id=${clientId}` +
            `&response_type=code&owner=user` +
            `&redirect_uri=${callbackUrl}&state=${state}`;
          return;
        }
      }

      if (!res.ok) {
        setMessage("내보내기에 실패했습니다. 다시 시도해주세요.");
        return;
      }

      const { pageUrl } = await res.json();
      const opened = window.open(pageUrl, "_blank");
      if (!opened) {
        setMessage("팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.");
      } else {
        setMessage("노션 페이지가 생성되었습니다.");
        setOpen(false);
      }
    } finally {
      setNotionLoading(false);
    }
  }

  return (
    <div ref={menuRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => { setMessage(null); setOpen((v) => !v); }}
        style={{
          backgroundColor: "#f5f5f5",
          border: "1.5px solid #030505",
          borderRadius: "9999px",
          padding: "6px 14px",
          fontWeight: 700,
          fontSize: "0.75rem",
          color: "#030505",
          cursor: "pointer",
        }}
      >
        내보내기 ↓
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 6px)",
            backgroundColor: "#ffffff",
            border: "1.5px solid #E0E0E0",
            borderRadius: "12px",
            boxShadow: "0px 4px 16px rgba(3,5,5,0.12)",
            minWidth: "168px",
            zIndex: 50,
            overflow: "hidden",
          }}
        >
          <button
            onClick={handleWordExport}
            disabled={docxLoading}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "10px 14px",
              fontSize: "0.8125rem",
              color: "#030505",
              backgroundColor: "transparent",
              border: "none",
              cursor: docxLoading ? "default" : "pointer",
              opacity: docxLoading ? 0.5 : 1,
            }}
          >
            {docxLoading ? "다운로드 중..." : "워드 (.docx)"}
          </button>
          <div style={{ borderTop: "1px solid #f0f0f0", margin: "0 8px" }} />
          <button
            onClick={handleNotionExport}
            disabled={notionLoading}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "10px 14px",
              fontSize: "0.8125rem",
              color: "#030505",
              backgroundColor: "transparent",
              border: "none",
              cursor: notionLoading ? "default" : "pointer",
              opacity: notionLoading ? 0.5 : 1,
            }}
          >
            {notionLoading ? "연결 중..." : "노션으로 내보내기"}
          </button>
        </div>
      )}

      {message && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 6px)",
            fontSize: "0.75rem",
            color: "#555555",
            backgroundColor: "#ffffff",
            border: "1px solid #e5e5e5",
            borderRadius: "8px",
            padding: "8px 12px",
            whiteSpace: "nowrap",
            zIndex: 50,
            cursor: "pointer",
          }}
          onClick={() => setMessage(null)}
        >
          {message}
        </div>
      )}
    </div>
  );
}

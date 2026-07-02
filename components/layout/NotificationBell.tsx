"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import SwapAcceptPopup, { type IncomingRequest } from "@/components/SwapAcceptPopup";

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

type NicknameUser = { id: string; nickname: string | null; avatar_url: string | null };
type OfferedBook = { id: string; title: string; author: string; cover_image: string | null } | null;

type RejectedNotification = {
  id: string;
  status: string;
  updated_at: string;
  offered_book: OfferedBook;
  receiver: NicknameUser | null;
};

type ActivityNotification = {
  id: string;
  swap_id: string;
  count: number;
  latest_at: string;
  offered_book: OfferedBook;
  partner: NicknameUser | null;
};

type CompletedNotification = {
  id: string;
  swap_id: string;
  updated_at: string;
  offered_book: OfferedBook;
  partner: NicknameUser | null;
};

type TimelineEntry =
  | { kind: "rejected"; at: number; data: RejectedNotification }
  | { kind: "activity"; at: number; data: ActivityNotification }
  | { kind: "completed"; at: number; data: CompletedNotification };

function buildTimeline(
  rejected: RejectedNotification[],
  activity: ActivityNotification[],
  completed: CompletedNotification[]
): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    ...rejected.map((data) => ({ kind: "rejected" as const, at: new Date(data.updated_at).getTime(), data })),
    ...activity.map((data) => ({ kind: "activity" as const, at: new Date(data.latest_at).getTime(), data })),
    ...completed.map((data) => ({ kind: "completed" as const, at: new Date(data.updated_at).getTime(), data })),
  ];
  return entries.sort((a, b) => b.at - a.at);
}

export default function NotificationBell() {
  const { data: session } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [requests, setRequests] = useState<IncomingRequest[]>([]);
  const [rejected, setRejected] = useState<RejectedNotification[]>([]);
  const [activity, setActivity] = useState<ActivityNotification[]>([]);
  const [completed, setCompleted] = useState<CompletedNotification[]>([]);
  const [activeRequest, setActiveRequest] = useState<IncomingRequest | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function fetchRequests() {
    fetch("/api/swaps/incoming")
      .then((r) => r.json())
      .then((data) => {
        setRequests(Array.isArray(data?.incoming) ? data.incoming : []);
        setRejected(Array.isArray(data?.rejected) ? data.rejected : []);
        setActivity(Array.isArray(data?.activity) ? data.activity : []);
        setCompleted(Array.isArray(data?.completed) ? data.completed : []);
      });
  }

  function goToSwap(swapId: string) {
    setOpen(false);
    router.push(`/swap/${swapId}`);
  }

  useEffect(() => {
    if (!session?.user?.id) return;
    fetchRequests();
  }, [session?.user?.id]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!session) return null;

  function handleDone(requestId: string) {
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    setActiveRequest(null);
  }

  const notificationCount = requests.length + rejected.length + activity.length + completed.length;
  const timeline = buildTimeline(rejected, activity, completed);

  return (
    <>
      <div ref={menuRef} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="알림"
          aria-expanded={open}
          className="relative text-primary/60 hover:text-primary p-1 transition-colors"
        >
          <BellIcon />
          {notificationCount > 0 && (
            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full" aria-hidden="true" />
          )}
        </button>

        {open && (
          <div
            className="absolute right-0 top-full mt-2 w-72 shadow-sm z-50"
            style={{ backgroundColor: "#ffffff", border: "1px solid #E0E0E0" }}
          >
            <p className="px-4 py-2.5 text-[10px] tracking-[0.15em] uppercase text-primary/40 font-body border-b border-primary/10">
              알림
            </p>
            {notificationCount === 0 ? (
              <p className="px-4 py-3 text-[11px] text-primary/40 font-body">
                새로운 알림이 없습니다.
              </p>
            ) : (
              <>
                {requests.map((req) => (
                  <button
                    key={req.id}
                    onClick={() => { setOpen(false); setActiveRequest(req); }}
                    className="w-full text-left px-4 py-3 hover:bg-primary/5 transition-colors border-b border-primary/5 last:border-b-0"
                  >
                    <p className="text-[11px] font-body text-primary/80">
                      {req.requester?.nickname ?? "알 수 없음"}님의 교환요청
                    </p>
                    <p className="text-[10px] text-primary/50 font-body mt-0.5 truncate">
                      {req.offered_book?.title ?? "책 정보 없음"}
                    </p>
                  </button>
                ))}
                {timeline.map((entry) => {
                  if (entry.kind === "rejected") {
                    const req = entry.data;
                    return (
                      <div
                        key={`rejected-${req.id}`}
                        className="w-full text-left px-4 py-3 border-b border-primary/5 last:border-b-0"
                      >
                        <p className="text-[11px] font-body text-primary/80">
                          {req.receiver?.nickname ?? "알 수 없음"}님이 요청을 거절했습니다
                        </p>
                        <p className="text-[10px] text-primary/50 font-body mt-0.5 truncate">
                          {req.offered_book?.title ?? "책 정보 없음"}
                        </p>
                      </div>
                    );
                  }
                  if (entry.kind === "activity") {
                    const a = entry.data;
                    return (
                      <button
                        key={`activity-${a.id}`}
                        onClick={() => goToSwap(a.swap_id)}
                        className="w-full text-left px-4 py-3 hover:bg-primary/5 transition-colors border-b border-primary/5 last:border-b-0"
                      >
                        <p className="text-[11px] font-body text-primary/80 truncate">
                          {a.offered_book?.title ?? "책 정보 없음"} — 새로운 활동 {a.count}건이 있어요
                        </p>
                        <p className="text-[10px] text-primary/50 font-body mt-0.5 truncate">
                          {a.partner?.nickname ?? "알 수 없음"}님과 교환 중
                        </p>
                      </button>
                    );
                  }
                  const c = entry.data;
                  return (
                    <button
                      key={`completed-${c.id}`}
                      onClick={() => goToSwap(c.swap_id)}
                      className="w-full text-left px-4 py-3 hover:bg-primary/5 transition-colors border-b border-primary/5 last:border-b-0"
                    >
                      <p className="text-[11px] font-body text-primary/80">
                        {c.partner?.nickname ?? "알 수 없음"}님과의 교환독서가 완료되었어요
                      </p>
                      <p className="text-[10px] text-primary/50 font-body mt-0.5 truncate">
                        {c.offered_book?.title ?? "책 정보 없음"}
                      </p>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>

      {activeRequest && (
        <SwapAcceptPopup
          request={activeRequest}
          onClose={() => setActiveRequest(null)}
          onDone={handleDone}
        />
      )}
    </>
  );
}

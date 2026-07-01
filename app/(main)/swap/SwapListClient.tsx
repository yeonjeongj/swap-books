"use client";

import { useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import SwapAcceptPopup, { type IncomingRequest } from "@/components/SwapAcceptPopup";

export type PublicSwapItem = {
  id: string;
  created_at: string;
  requester_id: string;
  requester_message: string | null;
  offered_book: { id: string; title: string; author: string; cover_image: string | null } | null;
  requester: { id: string; nickname: string | null; avatar_url: string | null } | null;
};

export default function SwapListClient({ requests: initial }: { requests: PublicSwapItem[] }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [requests, setRequests] = useState(initial);
  const [selected, setSelected] = useState<PublicSwapItem | null>(null);

  function handleCardClick(req: PublicSwapItem) {
    if (status !== "authenticated") {
      alert("로그인이 필요한 서비스입니다.");
      return;
    }
    const userId = session?.user?.id;
    if (userId && userId !== req.requester_id) {
      setSelected(req);
    } else {
      router.push(`/swap/${req.id}`);
    }
  }

  function toIncomingRequest(req: PublicSwapItem): IncomingRequest {
    return {
      id: req.id,
      requester_id: req.requester_id,
      status: "pending",
      created_at: req.created_at,
      requester_message: req.requester_message,
      offered_book: req.offered_book,
      requester: req.requester,
    };
  }

  if (requests.length === 0) return null;

  return (
    <>
      <div className="grid sm:grid-cols-2 gap-4">
        {requests.map((req) => (
          <button
            key={req.id}
            onClick={() => handleCardClick(req)}
            className="text-left w-full"
            type="button"
          >
            <div
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #E0E0E0",
                borderRadius: "12px",
                boxShadow: "0px 2px 8px rgba(3,5,5,0.08)",
                padding: "1rem",
                transition: "box-shadow 120ms",
                height: "100%",
              }}
              className="hover:shadow-[0px_4px_12px_rgba(3,5,5,0.12)]"
            >
              <div className="flex gap-3 items-start">
                {req.offered_book?.cover_image ? (
                  <Image
                    src={req.offered_book.cover_image}
                    alt={req.offered_book.title}
                    width={52}
                    height={74}
                    className="object-cover flex-none"
                    style={{ border: "1px solid #E0E0E0", borderRadius: "4px" }}
                  />
                ) : (
                  <div
                    style={{
                      width: 52,
                      height: 74,
                      backgroundColor: "#a0e4f2",
                      border: "1px solid #E0E0E0",
                      borderRadius: "4px",
                      flexShrink: 0,
                    }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      color: "#030505",
                      lineHeight: 1.35,
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {req.offered_book?.title ?? "—"}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "#888888", marginTop: "3px" }}>
                    {req.offered_book?.author}
                  </p>
                  <div className="flex items-center gap-1.5 mt-3">
                    <span
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        backgroundColor: "#f4d23d",
                        border: "1px solid #030505",
                        borderRadius: "9999px",
                        padding: "2px 8px",
                      }}
                    >
                      {req.requester?.nickname ?? "독자"}
                    </span>
                    <span style={{ fontSize: "0.6875rem", color: "#888888" }}>이 교환을 원해요</span>
                  </div>
                  {req.requester_message && (
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: "#555555",
                        marginTop: "8px",
                        lineHeight: 1.5,
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      &ldquo;{req.requester_message}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <SwapAcceptPopup
          request={toIncomingRequest(selected)}
          onClose={() => setSelected(null)}
          onDone={(requestId) => {
            setRequests((prev) => prev.filter((r) => r.id !== requestId));
            setSelected(null);
          }}
          isPublic
        />
      )}
    </>
  );
}

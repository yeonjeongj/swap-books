import Link from "next/link";
import { supabase } from "@/lib/supabase";
import SwapListClient, { type PublicSwapItem } from "./SwapListClient";

export default async function SwapListPage() {
  const { data } = await supabase
    .from("swap_requests")
    .select(
      `id, created_at, requester_id, requester_message,
      offered_book:user_books!offered_book_id(id, title, author, cover_image),
      requester:users!requester_id(id, nickname, avatar_url)`
    )
    .eq("is_public", true)
    .eq("status", "pending")
    .is("receiver_id", null)
    .order("created_at", { ascending: false });

  const requests = (data ?? []) as unknown as PublicSwapItem[];

  return (
    <div className="w-full max-w-3xl mx-auto px-5 py-12">
      <div className="mb-8">
        <span
          style={{
            display: "inline-block",
            backgroundColor: "#a0e4f2",
            border: "1.5px solid #030505",
            borderRadius: "9999px",
            padding: "3px 12px",
            fontSize: "0.75rem",
            fontWeight: 700,
            marginBottom: "0.5rem",
          }}
        >
          스왑 모집 중
        </span>
        <h1
          style={{
            fontFamily: "var(--font-fredoka)",
            fontSize: "clamp(1.75rem, 6vw, 2.5rem)",
            fontWeight: 700,
            color: "#030505",
            lineHeight: 1.1,
          }}
        >
          교환 파트너 찾는 중
        </h1>
        <p style={{ color: "#888888", fontSize: "0.875rem", marginTop: "0.5rem" }}>
          교환을 원하는 독자들의 책 리스트예요
        </p>
      </div>

      {requests.length === 0 ? (
        <div
          style={{
            border: "1px solid #E0E0E0",
            borderRadius: "12px",
            padding: "3rem",
            textAlign: "center",
            backgroundColor: "#f5f5f5",
          }}
        >
          <p style={{ color: "#888888", fontSize: "0.9375rem" }}>
            현재 모집 중인 교환이 없어요
          </p>
          <Link
            href="/"
            style={{
              display: "inline-block",
              marginTop: "1rem",
              backgroundColor: "#f4d23d",
              border: "2px solid #030505",
              borderRadius: "9999px",
              padding: "9px 20px",
              fontWeight: 700,
              fontSize: "0.875rem",
              boxShadow: "0px 1px 4px rgba(3,5,5,0.06)",
              color: "#030505",
              textDecoration: "none",
              fontFamily: "var(--font-fredoka)",
            }}
          >
            홈으로 돌아가기
          </Link>
        </div>
      ) : (
        <SwapListClient requests={requests} />
      )}
    </div>
  );
}

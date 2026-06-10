import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

type PublicSwapRequest = {
  id: string;
  created_at: string;
  requester_message: string | null;
  offered_book: { title: string; author: string; cover_image: string | null } | null;
  requester: { nickname: string | null } | null;
};

export default async function SwapListPage() {
  const { data } = await supabase
    .from("swap_requests")
    .select(
      `id, created_at, requester_message,
      offered_book:user_books!offered_book_id(title, author, cover_image),
      requester:users!requester_id(nickname)`
    )
    .eq("is_public", true)
    .eq("status", "pending")
    .is("receiver_id", null)
    .order("created_at", { ascending: false });

  const requests = (data ?? []) as unknown as PublicSwapRequest[];

  return (
    <div className="max-w-3xl mx-auto px-5 py-12">
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
        <div className="grid sm:grid-cols-2 gap-4">
          {requests.map((req) => (
            <Link key={req.id} href={`/swap/${req.id}`} style={{ textDecoration: "none" }}>
              <div
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #E0E0E0",
                  borderRadius: "12px",
                  boxShadow: "0px 2px 8px rgba(3,5,5,0.08)",
                  padding: "1rem",
                  transition: "transform 120ms, box-shadow 120ms",
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

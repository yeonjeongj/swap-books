import Link from "next/link";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import BookCovers, { type BookSide } from "./BookCovers";

const COVER_COLORS = ["#a0e4f2", "#f7a8c7", "#f4d23d", "#b8e6b0", "#d4b8e0"];

type AcceptedSwap = {
  id: string;
  requester_message: string | null;
  receiver_message: string | null;
  offered_book: { id: string; title: string; author: string; cover_image: string | null } | null;
  wanted_book: { id: string; title: string; author: string; cover_image: string | null } | null;
  requester: { id: string; nickname: string | null } | null;
  receiver: { id: string; nickname: string | null } | null;
};

export default async function CurrentSwap() {
  const session = await auth();
  let swaps: AcceptedSwap[] = [];

  if (session?.user?.id) {
    const { data } = await supabase
      .from("swap_requests")
      .select(
        `id, requester_message, receiver_message,
        offered_book:user_books!offered_book_id(id, title, author, cover_image),
        wanted_book:user_books!wanted_book_id(id, title, author, cover_image),
        requester:users!requester_id(id, nickname),
        receiver:users!receiver_id(id, nickname)`
      )
      .or(`requester_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
      .eq("status", "accepted")
      .order("created_at", { ascending: false });
    swaps = (data ?? []) as unknown as AcceptedSwap[];
  }

  return (
    <div className="max-w-3xl mx-auto px-5 py-12">
      {/* Header */}
      <div className="mb-10">
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
          진행 중인 교환
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
          Current Exchange
        </h1>
        <p style={{ color: "#888888", fontSize: "0.875rem", marginTop: "0.5rem" }}>
          나의 교환독서 현황이에요
        </p>
      </div>

      {/* Swap list */}
      {!session ? (
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
            로그인 후 이용할 수 있습니다
          </p>
        </div>
      ) : swaps.length === 0 ? (
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
            진행 중인 교환독서가 없어요
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
            }}
          >
            홈으로 돌아가기
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {swaps.map((swap, i) => {
            const left: BookSide = {
              title: swap.offered_book?.title ?? "",
              cover_image: swap.offered_book?.cover_image ?? null,
              coverColor: COVER_COLORS[i * 2 % COVER_COLORS.length],
              nickname: swap.requester?.nickname ?? "독자",
              message: swap.requester_message,
            };
            const right: BookSide = {
              title: swap.wanted_book?.title ?? "",
              cover_image: swap.wanted_book?.cover_image ?? null,
              coverColor: COVER_COLORS[(i * 2 + 1) % COVER_COLORS.length],
              nickname: swap.receiver?.nickname ?? "독자",
              message: swap.receiver_message,
            };

            return (
              <div
                key={swap.id}
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #E0E0E0",
                  borderRadius: "12px",
                  boxShadow: "0px 2px 8px rgba(3,5,5,0.08)",
                  padding: "1.25rem",
                }}
              >
                {/* Reader labels */}
                <div className="flex gap-4 mb-3">
                  <div className="flex-1">
                    <span
                      style={{
                        display: "inline-block",
                        backgroundColor: "#f4d23d",
                        border: "1px solid #030505",
                        borderRadius: "9999px",
                        padding: "2px 10px",
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        color: "#030505",
                      }}
                    >
                      {left.nickname}
                    </span>
                  </div>
                  <div className="flex-shrink-0 w-5" />
                  <div className="flex-1">
                    <span
                      style={{
                        display: "inline-block",
                        backgroundColor: "#f4d23d",
                        border: "1px solid #030505",
                        borderRadius: "9999px",
                        padding: "2px 10px",
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        color: "#030505",
                      }}
                    >
                      {right.nickname}
                    </span>
                  </div>
                </div>

                <BookCovers left={left} right={right} />

                {/* Book info */}
                <div className="flex gap-4 mt-4">
                  <div className="flex-1">
                    <p
                      style={{
                        fontFamily: "var(--font-fredoka)",
                        fontSize: "1rem",
                        fontWeight: 700,
                        color: "#030505",
                        lineHeight: 1.3,
                      }}
                    >
                      {left.title}
                    </p>
                    {swap.offered_book?.author && (
                      <p style={{ fontSize: "0.75rem", color: "#888888", marginTop: "2px" }}>
                        {swap.offered_book.author}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 w-5" />
                  <div className="flex-1">
                    <p
                      style={{
                        fontFamily: "var(--font-fredoka)",
                        fontSize: "1rem",
                        fontWeight: 700,
                        color: "#030505",
                        lineHeight: 1.3,
                      }}
                    >
                      {right.title}
                    </p>
                    {swap.wanted_book?.author && (
                      <p style={{ fontSize: "0.75rem", color: "#888888", marginTop: "2px" }}>
                        {swap.wanted_book.author}
                      </p>
                    )}
                  </div>
                </div>

                {/* CTA */}
                <div className="flex justify-center mt-5">
                  <Link
                    href={`/swap/${swap.id}`}
                    style={{
                      display: "inline-block",
                      backgroundColor: "#ffffff",
                      border: "2px solid #030505",
                      borderRadius: "9999px",
                      padding: "8px 24px",
                      fontWeight: 700,
                      fontSize: "0.8125rem",
                      boxShadow: "0px 1px 4px rgba(3,5,5,0.06)",
                      color: "#030505",
                      textDecoration: "none",
                    }}
                    className="transition-colors hover:bg-[#f5f5f5]"
                  >
                    교환독서 상세 보기
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

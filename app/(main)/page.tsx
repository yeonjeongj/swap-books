import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import HeroButtons from "./HeroButtons";
import MainPublicRequestsClient, { type MainPublicRequest } from "./MainPublicRequestsClient";

type RecentBook = {
  id: string;
  title: string;
  author: string;
  cover_image: string | null;
};


type PublicActiveSwap = {
  id: string;
  created_at: string;
  offered_book: { title: string; cover_image: string | null } | null;
  wanted_book: { title: string; cover_image: string | null } | null;
  requester: { nickname: string | null } | null;
  receiver: { nickname: string | null } | null;
};

const STEPS = [
  { num: "01", title: "Register", ko: "내 책을 등록하세요" },
  { num: "02", title: "Request & Swap", ko: "친구에게 교환을 신청해보세요" },
  { num: "03", title: "Read & Share", ko: "함께 천천히 읽어보세요" },
];

export default async function HomePage() {
  const [booksResult, requestsResult, activeSwapsResult] = await Promise.all([
    supabase
      .from("user_books")
      .select("id, title, author, cover_image")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("swap_requests")
      .select(
        `id, created_at, requester_id, requester_message,
        offered_book:user_books!offered_book_id(id, title, author, cover_image),
        requester:users!requester_id(id, nickname, avatar_url)`,
      )
      .eq("is_public", true)
      .eq("status", "pending")
      .is("receiver_id", null)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("swap_requests")
      .select(
        `id, created_at,
        offered_book:user_books!offered_book_id(title, cover_image),
        wanted_book:user_books!wanted_book_id(title, cover_image),
        requester:users!requester_id(nickname),
        receiver:users!receiver_id(nickname)`,
      )
      .eq("is_public", true)
      .eq("status", "accepted")
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  const recentBooks = (booksResult.data ?? []) as RecentBook[];
  const publicRequests = (requestsResult.data ??
    []) as unknown as MainPublicRequest[];
  const activeSwaps = (activeSwapsResult.data ??
    []) as unknown as PublicActiveSwap[];

  return (
    <div className="flex flex-col">
      <HeroCombinedSection />
      <RecentBooksSection books={recentBooks} />
      <PublicRequestsSection requests={publicRequests} />
      <ActiveSwapsSection swaps={activeSwaps} />
    </div>
  );
}

function HeroCombinedSection() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ backgroundColor: "#ffffff" }}
    >
      {/* Floating decorative elements */}
      <span
        aria-hidden="true"
        className="absolute pointer-events-none select-none hidden sm:block"
        style={{
          top: "10%",
          left: "3%",
          fontSize: "2rem",
          color: "#f4d23d",
          animation: "float 3.5s ease-in-out infinite",
        }}
      >
        ✦
      </span>
      <span
        aria-hidden="true"
        className="absolute pointer-events-none select-none hidden sm:block"
        style={{
          bottom: "15%",
          right: "3%",
          fontSize: "1.5rem",
          color: "#f7a8c7",
          animation: "float-reverse 4s ease-in-out infinite 0.6s",
        }}
      >
        ✦
      </span>

      <div
        className="max-w-3xl mx-auto px-5 grid lg:grid-cols-[1fr_280px] gap-10 items-center"
        style={{ paddingTop: "3.5rem", paddingBottom: "3.5rem" }}
      >
        {/* ─── Hero (left) ─── */}
        <div className="flex flex-col items-start">
          <h1
            style={{
              fontFamily: "var(--font-fredoka)",
              fontSize: "clamp(2.5rem, 10vw, 4.25rem)",
              fontWeight: 700,
              color: "#030505",
              lineHeight: 1,
              marginBottom: "0.25rem",
            }}
          >
            Swap Books
          </h1>
          <p
            style={{
              fontFamily: "var(--font-black-han-sans)",
              fontSize: "1.1rem",
              color: "#7dd3f5",
              marginBottom: "1rem",
            }}
          >
            스왑북스
          </p>

          <p
            style={{
              fontSize: "0.9375rem",
              fontWeight: 700,
              color: "#030505",
              marginBottom: "0.375rem",
            }}
          >
            우리만의 교환독서
          </p>
          <p
            style={{
              color: "#555555",
              fontSize: "0.8125rem",
              lineHeight: 1.75,
              marginBottom: "1.75rem",
            }}
          >
            책을 사지 않아도 많은 걸 느끼지 않아도 좋은,
            <br />
            느림보 독서 공유 프로젝트
          </p>

          <HeroButtons />
        </div>

        {/* ─── How it works (right) ─── */}
        <div
          className="hidden lg:flex flex-col gap-3"
          style={{
            backgroundColor: "#f5f5f5",
            border: "1px solid #E0E0E0",
            borderRadius: "12px",
            padding: "1.25rem",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-fredoka)",
              fontSize: "0.9375rem",
              fontWeight: 700,
              color: "#888888",
              marginBottom: "0.25rem",
            }}
          >
            How it works
          </p>
          {STEPS.map((step) => (
            <div key={step.num} className="flex items-start gap-3">
              <span
                style={{
                  fontFamily: "var(--font-fredoka)",
                  fontSize: "1.375rem",
                  fontWeight: 700,
                  color: "#f4d23d",
                  lineHeight: 1,
                  flexShrink: 0,
                  WebkitTextStroke: "1px #030505",
                  marginTop: "1px",
                }}
              >
                {step.num}
              </span>
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-fredoka)",
                    fontSize: "0.9375rem",
                    fontWeight: 700,
                    color: "#030505",
                    lineHeight: 1.2,
                  }}
                >
                  {step.title}
                </p>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "#888888",
                    marginTop: "1px",
                  }}
                >
                  {step.ko}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: steps as horizontal pills */}
      <div
        className="lg:hidden max-w-3xl mx-auto px-5"
        style={{ paddingBottom: "2rem" }}
      >
        <p
          style={{
            fontFamily: "var(--font-fredoka)",
            fontSize: "0.8125rem",
            fontWeight: 700,
            color: "#888888",
            marginBottom: "0.5rem",
          }}
        >
          How it works
        </p>
        <div className="flex gap-2 flex-wrap">
        {STEPS.map((step) => (
          <div
            key={step.num}
            className="flex items-center gap-2"
            style={{
              border: "1.5px solid #030505",
              borderRadius: "9999px",
              padding: "5px 12px 5px 8px",
              backgroundColor: "#f5f5f5",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-fredoka)",
                fontSize: "0.875rem",
                fontWeight: 700,
                color: "#f4d23d",
                WebkitTextStroke: "0.75px #030505",
                lineHeight: 1,
              }}
            >
              {step.num}
            </span>
            <span
              style={{ fontSize: "0.75rem", fontWeight: 600, color: "#030505" }}
            >
              {step.title}
            </span>
          </div>
        ))}
        </div>
      </div>
    </section>
  );
}

function BookCover({
  src,
  title,
  size = "md",
}: {
  src: string | null;
  title: string;
  size?: "sm" | "md";
}) {
  const w = size === "sm" ? 48 : 64;
  const h = size === "sm" ? 68 : 92;

  if (src) {
    return (
      <Image
        src={src}
        alt={title}
        width={w}
        height={h}
        className="object-cover"
        style={{
          width: w,
          height: h,
          border: "1px solid #E0E0E0",
          borderRadius: "4px",
          flexShrink: 0,
        }}
      />
    );
  }
  const hue = (title.charCodeAt(0) * 37) % 360;
  return (
    <div
      style={{
        width: w,
        height: h,
        backgroundColor: `hsl(${hue},40%,72%)`,
        border: "1.5px solid #030505",
        borderRadius: "4px",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          fontSize: "0.625rem",
          color: "#ffffff",
          textAlign: "center",
          padding: "4px",
        }}
      >
        {title.slice(0, 2)}
      </span>
    </div>
  );
}

function SectionHeader({
  badge,
  moreHref,
  moreLabel = "더보기",
}: {
  badge: string;
  title?: string;
  moreHref?: string;
  moreLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <span
        style={{
          display: "inline-block",
          backgroundColor: "#a0e4f2",
          border: "1.5px solid #030505",
          borderRadius: "9999px",
          padding: "4px 14px",
          fontSize: "0.8125rem",
          fontWeight: 700,
        }}
      >
        {badge}
      </span>
      {moreHref && (
        <Link
          href={moreHref}
          style={{
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: "#555555",
            textDecoration: "none",
            border: "1.5px solid #e0e0e0",
            borderRadius: "9999px",
            padding: "5px 14px",
            backgroundColor: "#ffffff",
            flexShrink: 0,
          }}
          className="hover:border-[#030505] transition-colors"
        >
          {moreLabel} →
        </Link>
      )}
    </div>
  );
}

function RecentBooksSection({ books }: { books: RecentBook[] }) {
  return (
    <section style={{ backgroundColor: "#f5f5f5" }}>
      <div
        className="max-w-3xl mx-auto px-5"
        style={{ paddingTop: "3rem", paddingBottom: "3rem" }}
      >
        <SectionHeader badge="New arrivals" title="최근 등록된 책" />

        {books.length === 0 ? (
          <p
            style={{
              color: "#888888",
              fontSize: "0.875rem",
              textAlign: "center",
              padding: "2rem 0",
            }}
          >
            아직 등록된 책이 없어요
          </p>
        ) : (
          /* flex-nowrap + overflow-hidden: shows exactly as many books as fit in one row */
          <div className="flex flex-nowrap gap-3 overflow-hidden">
            {books.map((book) => (
              <div key={book.id} className="flex-none" style={{ width: 80 }}>
                <BookCover
                  src={book.cover_image}
                  title={book.title}
                  size="md"
                />
                <p
                  style={{
                    fontSize: "0.6875rem",
                    color: "#030505",
                    fontWeight: 600,
                    marginTop: "6px",
                    lineHeight: 1.35,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {book.title}
                </p>
                <p
                  style={{
                    fontSize: "0.625rem",
                    color: "#888888",
                    marginTop: "2px",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                  }}
                >
                  {book.author}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function PublicRequestsSection({
  requests,
}: {
  requests: MainPublicRequest[];
}) {
  return (
    <section style={{ backgroundColor: "#ffffff" }}>
      <div
        className="max-w-3xl mx-auto px-5"
        style={{ paddingTop: "3rem", paddingBottom: "3rem" }}
      >
        <SectionHeader
          badge="스왑 모집 중"
          title="교환 파트너 찾는 중"
          moreHref={requests.length > 0 ? "/swap" : undefined}
          moreLabel="전체 보기"
        />

        {requests.length === 0 ? (
          <p
            style={{
              color: "#888888",
              fontSize: "0.875rem",
              textAlign: "center",
              padding: "2rem 0",
            }}
          >
            현재 모집 중인 교환이 없어요
          </p>
        ) : (
          <MainPublicRequestsClient requests={requests} />
        )}
      </div>
    </section>
  );
}

function ActiveSwapsSection({ swaps }: { swaps: PublicActiveSwap[] }) {
  return (
    <section style={{ backgroundColor: "#f5f5f5" }}>
      <div
        className="max-w-3xl mx-auto px-5"
        style={{ paddingTop: "3rem", paddingBottom: "3rem" }}
      >
        <SectionHeader
          badge="진행 중인 스왑"
          title="지금 교환 중인 책들"
          moreHref={swaps.length > 0 ? "/current" : undefined}
          moreLabel="전체 보기"
        />

        {swaps.length === 0 ? (
          <p
            style={{
              color: "#888888",
              fontSize: "0.875rem",
              textAlign: "center",
              padding: "2rem 0",
            }}
          >
            현재 진행 중인 교환이 없어요
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {swaps.map((swap) => (
              <Link
                key={swap.id}
                href={`/swap/${swap.id}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #E0E0E0",
                    borderRadius: "12px",
                    boxShadow: "0px 2px 8px rgba(3,5,5,0.08)",
                    padding: "1rem",
                    transition: "box-shadow 120ms",
                  }}
                  className="hover:shadow-[0px_4px_12px_rgba(3,5,5,0.12)]"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p
                        style={{
                          fontSize: "0.6875rem",
                          color: "#888888",
                          marginBottom: "3px",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {swap.requester?.nickname ?? "독자"}
                      </p>
                      <BookCover
                        src={swap.offered_book?.cover_image ?? null}
                        title={swap.offered_book?.title ?? "?"}
                        size="sm"
                      />
                      <p
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "#030505",
                          marginTop: "5px",
                          lineHeight: 1.35,
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {swap.offered_book?.title ?? "—"}
                      </p>
                    </div>

                    <div
                      style={{
                        flexShrink: 0,
                        fontSize: "1.25rem",
                        color: "#7dd3f5",
                        fontWeight: 700,
                        fontFamily: "var(--font-fredoka)",
                      }}
                    >
                      ⇄
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        style={{
                          fontSize: "0.6875rem",
                          color: "#888888",
                          marginBottom: "3px",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                          textAlign: "right",
                        }}
                      >
                        {swap.receiver?.nickname ?? "독자"}
                      </p>
                      <div className="flex justify-end">
                        <BookCover
                          src={swap.wanted_book?.cover_image ?? null}
                          title={swap.wanted_book?.title ?? "?"}
                          size="sm"
                        />
                      </div>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "#030505",
                          marginTop: "5px",
                          lineHeight: 1.35,
                          textAlign: "right",
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {swap.wanted_book?.title ?? "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

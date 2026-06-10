import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { highResCover } from "@/lib/utils/cover";
import RegisterBookButton from "./RegisterBookButton";
import SwapRequestButton from "./SwapRequestButton";
import ProfileEditButton from "./ProfileEditButton";
import DeleteBookButton from "./DeleteBookButton";
import CalendarClient, { type CalendarEvent } from "./CalendarClient";

type UserBook = {
  id: string;
  isbn: string | null;
  title: string;
  author: string;
  publisher: string | null;
  cover_image: string | null;
  created_at: string;
};

type SwapWithRelations = {
  id: string;
  status: string;
  is_public: boolean;
  created_at: string;
  requester_id: string;
  receiver_id: string | null;
  offered_book: { id: string; title: string; author: string; cover_image: string | null } | null;
  wanted_book: { id: string; title: string; author: string; cover_image: string | null } | null;
  requester: { id: string; nickname: string | null } | null;
  receiver: { id: string; nickname: string | null } | null;
};

function SwapCard({ swap, userId }: { swap: SwapWithRelations; userId: string }) {
  const isRequester = swap.requester_id === userId;
  const partner = isRequester ? swap.receiver : swap.requester;
  const partnerName = partner?.nickname ?? (swap.is_public ? "공개 모집 중" : "알 수 없음");
  const book = swap.offered_book;
  const wantedBook = swap.wanted_book;
  const d = new Date(swap.created_at);
  const dateStr = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  const isClickable = swap.status === "accepted" || swap.status === "completed";

  const cardStyle: React.CSSProperties = {
    backgroundColor: "#ffffff",
    border: "1px solid #E0E0E0",
    borderRadius: "12px",
    cursor: isClickable ? "pointer" : undefined,
  };

  const inner = (
    <div
      className="flex items-center gap-4 px-4 py-3"
      style={cardStyle}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          {book?.cover_image ? (
            <div
              className="relative w-9 h-12 flex-shrink-0 overflow-hidden"
              style={{ borderRadius: "4px", border: "1px solid #E0E0E0" }}
            >
              <Image src={highResCover(book.cover_image)!} alt="" fill className="object-cover object-top" sizes="36px" />
            </div>
          ) : (
            <div
              className="w-9 h-12 flex-shrink-0"
              style={{ backgroundColor: "#a0e4f2", borderRadius: "4px", border: "1px solid #E0E0E0" }}
            />
          )}
          <div className="min-w-0 max-w-[110px]">
            <p className="text-xs leading-snug line-clamp-2" style={{ color: "#030505" }}>{book?.title ?? "—"}</p>
          </div>
        </div>
        {wantedBook && (
          <>
            <span style={{ color: "#aaaaaa", fontSize: "0.75rem" }}>→</span>
            <div className="flex items-center gap-2 min-w-0">
              {wantedBook.cover_image ? (
                <div
                  className="relative w-9 h-12 flex-shrink-0 overflow-hidden"
                  style={{ borderRadius: "4px", border: "1px solid #E0E0E0" }}
                >
                  <Image src={highResCover(wantedBook.cover_image)!} alt="" fill className="object-cover object-top" sizes="36px" />
                </div>
              ) : (
                <div
                  className="w-9 h-12 flex-shrink-0"
                  style={{ backgroundColor: "#f7a8c7", borderRadius: "4px", border: "1px solid #E0E0E0" }}
                />
              )}
              <div className="min-w-0 max-w-[110px]">
                <p className="text-xs leading-snug line-clamp-2" style={{ color: "#030505" }}>{wantedBook.title}</p>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="flex-shrink-0 text-right">
        <span
          style={{
            display: "inline-block",
            backgroundColor: isRequester ? "#f4d23d" : "#f5f5f5",
            border: "1px solid #030505",
            borderRadius: "9999px",
            padding: "1px 8px",
            fontSize: "0.5625rem",
            fontWeight: 700,
            color: "#030505",
          }}
        >
          {isRequester ? "내가 요청" : "받은 요청"}
        </span>
        <p className="text-xs mt-1" style={{ color: "#555555" }}>{partnerName}</p>
        <p style={{ fontSize: "0.5625rem", color: "#aaaaaa", marginTop: "2px" }}>{dateStr}</p>
      </div>
    </div>
  );

  if (isClickable) {
    return (
      <Link href={`/swap/${swap.id}`} style={{ textDecoration: "none", display: "block" }}>
        {inner}
      </Link>
    );
  }
  return inner;
}

function SwapSection({ title, swaps, userId }: { title: string; swaps: SwapWithRelations[]; userId: string }) {
  return (
    <div className="mb-8">
      {title && (
        <p
          style={{
            fontSize: "0.8125rem",
            fontWeight: 700,
            color: "#030505",
            marginBottom: "12px",
          }}
        >
          {title}
        </p>
      )}
      <div className="flex flex-col gap-2">
        {swaps.map((swap) => (
          <SwapCard key={swap.id} swap={swap} userId={userId} />
        ))}
      </div>
    </div>
  );
}

export default async function MyPage() {
  const session = await auth();

  let userBooks: UserBook[] = [];
  let swapCount = 0;
  let mySwaps: SwapWithRelations[] = [];
  let calendarEvents: CalendarEvent[] = [];

  const now = new Date();
  const calYear = now.getFullYear();
  const calMonth = now.getMonth(); // 0-indexed

  if (session?.user?.id) {
    const monthFrom = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(calYear, calMonth + 1, 0).getDate();
    const monthTo = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    const [booksResult, swapsResult, swapsDataResult, eventsResult] = await Promise.all([
      supabase.from("user_books").select("id, isbn, title, author, publisher, cover_image, created_at").eq("user_id", session.user.id).order("created_at", { ascending: false }),
      supabase.from("swap_requests").select("id", { count: "exact", head: true }).or(`requester_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`),
      supabase.from("swap_requests").select(`id, status, is_public, created_at, requester_id, receiver_id, offered_book:user_books!offered_book_id(id, title, author, cover_image), wanted_book:user_books!wanted_book_id(id, title, author, cover_image), requester:users!requester_id(id, nickname), receiver:users!receiver_id(id, nickname)`).or(`requester_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`).in("status", ["pending", "accepted", "completed"]).order("created_at", { ascending: false }),
      supabase.from("calendar_events").select("id, title, date, time").eq("user_id", session.user.id).gte("date", monthFrom).lte("date", monthTo).order("date").order("created_at"),
    ]);
    userBooks = booksResult.data ?? [];
    swapCount = swapsResult.count ?? 0;
    mySwaps = (swapsDataResult.data ?? []) as unknown as SwapWithRelations[];
    calendarEvents = (eventsResult.data ?? []) as CalendarEvent[];
  }

  const displayName = (session?.user as { nickname?: string })?.nickname ?? session?.user?.name ?? "독서가";
  const email = session?.user?.email ?? "";
  const userId = session?.user?.id ?? "";
  const pendingSwaps = mySwaps.filter((s) => s.status === "pending");
  const acceptedSwaps = mySwaps.filter((s) => s.status === "accepted");
  const completedSwaps = mySwaps.filter((s) => s.status === "completed");

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      {/* Profile section */}
      <div
        className="p-6 mb-8"
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #E0E0E0",
          borderRadius: "12px",
          boxShadow: "0px 2px 8px rgba(3,5,5,0.08)",
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          {/* Avatar + name */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: "#a0e4f2",
                border: "2px solid #030505",
                fontFamily: "var(--font-fredoka)",
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "#030505",
              }}
            >
              {displayName[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0">
              <h1
                style={{
                  fontFamily: "var(--font-fredoka)",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "#030505",
                  lineHeight: 1.2,
                }}
              >
                {displayName}
              </h1>
              <p style={{ fontSize: "0.75rem", color: "#888888", marginTop: "2px" }}>{email}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 sm:flex-shrink-0">
            <div
              className="text-center px-4 py-3"
              style={{ backgroundColor: "#f5f5f5", borderRadius: "12px", border: "1px solid #E0E0E0" }}
            >
              <p
                style={{ fontFamily: "var(--font-fredoka)", fontSize: "1.75rem", fontWeight: 700, color: "#030505", lineHeight: 1 }}
              >
                {swapCount}
              </p>
              <p style={{ fontSize: "0.625rem", fontWeight: 700, color: "#888888", marginTop: "4px" }}>교환독서</p>
            </div>
            <div
              className="text-center px-4 py-3"
              style={{ backgroundColor: "#f5f5f5", borderRadius: "12px", border: "1px solid #E0E0E0" }}
            >
              <p
                style={{ fontFamily: "var(--font-fredoka)", fontSize: "1.75rem", fontWeight: 700, color: "#030505", lineHeight: 1 }}
              >
                {userBooks.length}
              </p>
              <p style={{ fontSize: "0.625rem", fontWeight: 700, color: "#888888", marginTop: "4px" }}>등록한 책</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap mt-5 pt-5" style={{ borderTop: "1px solid #e5e5e5" }}>
          <RegisterBookButton />
          <SwapRequestButton userBooks={userBooks} />
          <ProfileEditButton />
        </div>
      </div>

      {/* My books section */}
      {userBooks.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-4">
            <span
              style={{
                display: "inline-block",
                backgroundColor: "#f7a8c7",
                border: "1.5px solid #030505",
                borderRadius: "9999px",
                padding: "3px 12px",
                fontSize: "0.75rem",
                fontWeight: 700,
              }}
            >
              내 책 목록
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-10">
            {userBooks.map((book) => (
              <div
                key={book.id}
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #E0E0E0",
                  borderRadius: "12px",
                  boxShadow: "0px 2px 8px rgba(3,5,5,0.08)",
                  padding: "12px",
                }}
              >
                <div className="flex justify-end mb-2">
                  <DeleteBookButton bookId={book.id} />
                </div>
                {book.cover_image ? (
                  <div
                    className="relative w-full aspect-[3/4] mb-3 overflow-hidden"
                    style={{ borderRadius: "6px", border: "1px solid #E0E0E0" }}
                  >
                    <Image src={highResCover(book.cover_image)!} alt={book.title} fill className="object-cover object-top" quality={90} />
                  </div>
                ) : (
                  <div
                    className="w-full aspect-[3/4] mb-3"
                    style={{ backgroundColor: "#a0e4f2", borderRadius: "6px", border: "1px solid #E0E0E0" }}
                  />
                )}
                <p className="text-sm leading-snug line-clamp-2" style={{ color: "#030505", fontWeight: 600 }}>{book.title}</p>
                <p style={{ fontSize: "0.6875rem", color: "#888888", marginTop: "2px" }}>{book.author}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Active swap lists */}
      {(pendingSwaps.length > 0 || acceptedSwaps.length > 0) && (
        <>
          <div className="flex items-center gap-2 mb-4">
            <span
              style={{
                display: "inline-block",
                backgroundColor: "#a0e4f2",
                border: "1.5px solid #030505",
                borderRadius: "9999px",
                padding: "3px 12px",
                fontSize: "0.75rem",
                fontWeight: 700,
              }}
            >
              교환독서 현황
            </span>
          </div>
          {pendingSwaps.length > 0 && (
            <SwapSection title="진행 중인 요청" swaps={pendingSwaps} userId={userId} />
          )}
          {acceptedSwaps.length > 0 && (
            <SwapSection title="수락된 교환" swaps={acceptedSwaps} userId={userId} />
          )}
          <div className="mb-10" style={{ borderTop: "1px solid #e5e5e5" }} />
        </>
      )}

      {/* Completed swap lists */}
      {completedSwaps.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-4">
            <span
              style={{
                display: "inline-block",
                backgroundColor: "#b8e6b0",
                border: "1.5px solid #030505",
                borderRadius: "9999px",
                padding: "3px 12px",
                fontSize: "0.75rem",
                fontWeight: 700,
              }}
            >
              완료된 교환
            </span>
          </div>
          <SwapSection title="" swaps={completedSwaps} userId={userId} />
          <div className="mb-10" style={{ borderTop: "1px solid #e5e5e5" }} />
        </>
      )}

      {/* Calendar section */}
      <CalendarClient
        initialEvents={calendarEvents}
        initialYear={calYear}
        initialMonth={calMonth}
      />
    </div>
  );
}

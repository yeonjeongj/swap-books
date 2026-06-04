import Image from "next/image";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { highResCover } from "@/lib/utils/cover";
import RegisterBookButton from "./RegisterBookButton";
import SwapRequestButton from "./SwapRequestButton";
import ProfileEditButton from "./ProfileEditButton";
import DeleteBookButton from "./DeleteBookButton";

type CalendarEvent = { id: string; date: string; time: string; title: string };

const EVENTS: CalendarEvent[] = [
  { id: "ev-1", date: "2025-05-02", time: "오전 10:00", title: "서울 북클럽" },
  { id: "ev-2", date: "2025-05-13", time: "오후 2:00", title: "독서모임(강남)" },
];

type CalDay = { day: number; isPrev?: boolean };

const WEEKS: CalDay[][] = [
  [{ day: 27, isPrev: true }, { day: 28, isPrev: true }, { day: 29, isPrev: true }, { day: 30, isPrev: true }, { day: 1 }, { day: 2 }, { day: 3 }],
  [{ day: 4 }, { day: 5 }, { day: 6 }, { day: 7 }, { day: 8 }, { day: 9 }, { day: 10 }],
  [{ day: 11 }, { day: 12 }, { day: 13 }, { day: 14 }, { day: 15 }, { day: 16 }, { day: 17 }],
];

const DAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function getEvent(day: number, isPrev?: boolean): CalendarEvent | undefined {
  if (isPrev) return undefined;
  const key = `2025-05-${String(day).padStart(2, "0")}`;
  return EVENTS.find((e) => e.date === key);
}

function BookSwapIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M4 4h7v16H4zM13 4h7v16h-7z" stroke="#5a633a" strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="11" y1="12" x2="13" y2="12" stroke="#5a633a" strokeWidth="1.5" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

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

const MEMBER_GRADE = {
  label: "Editorial Fellow",
  desc: "당신은 지역 도서관의 큐레이터와 같은 안목을 가지고 계시군요.",
  quote: "책은 단순히 읽는 것이 아니라, 누군가와 그 문장을 나누었을 때 비로소 완성됩니다.",
};

function SwapCard({ swap, userId }: { swap: SwapWithRelations; userId: string }) {
  const isRequester = swap.requester_id === userId;
  const partner = isRequester ? swap.receiver : swap.requester;
  const partnerName = partner?.nickname ?? (swap.is_public ? "공개 모집 중" : "알 수 없음");
  const book = swap.offered_book;
  const wantedBook = swap.wanted_book;
  const d = new Date(swap.created_at);
  const dateStr = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;

  return (
    <div className="border border-neutral/10 bg-white/40 px-4 py-3 flex items-center gap-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          {book?.cover_image ? (
            <div className="relative w-9 h-12 flex-shrink-0 overflow-hidden">
              <Image src={highResCover(book.cover_image)!} alt="" fill className="object-cover object-top" sizes="36px" />
            </div>
          ) : (
            <div className="w-9 h-12 bg-neutral/10 flex-shrink-0" />
          )}
          <div className="min-w-0 max-w-[110px]">
            <p className="text-xs font-body text-neutral leading-snug line-clamp-2">{book?.title ?? "—"}</p>
          </div>
        </div>
        {wantedBook && (
          <>
            <span className="text-neutral/25 text-xs flex-shrink-0">→</span>
            <div className="flex items-center gap-2 min-w-0">
              {wantedBook.cover_image ? (
                <div className="relative w-9 h-12 flex-shrink-0 overflow-hidden">
                  <Image src={highResCover(wantedBook.cover_image)!} alt="" fill className="object-cover object-top" sizes="36px" />
                </div>
              ) : (
                <div className="w-9 h-12 bg-neutral/10 flex-shrink-0" />
              )}
              <div className="min-w-0 max-w-[110px]">
                <p className="text-xs font-body text-neutral leading-snug line-clamp-2">{wantedBook.title}</p>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="flex-shrink-0 text-right">
        <span className={`inline-block text-[9px] tracking-[0.08em] uppercase font-body px-1.5 py-0.5 ${
          isRequester ? "bg-primary/8 text-primary/60" : "bg-neutral/8 text-neutral/50"
        }`}>
          {isRequester ? "내가 요청" : "받은 요청"}
        </span>
        <p className="text-[11px] text-neutral/60 font-body mt-1.5">{partnerName}</p>
        <p className="text-[9px] text-neutral/35 font-body mt-0.5">{dateStr}</p>
      </div>
    </div>
  );
}

function SwapSection({ title, swaps, userId }: { title: string; swaps: SwapWithRelations[]; userId: string }) {
  return (
    <div className="mb-8">
      <p className="text-sm font-body text-neutral mb-3">{title}</p>
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

  if (session?.user?.id) {
    const [booksResult, swapsResult, swapsDataResult] = await Promise.all([
      supabase.from("user_books").select("id, isbn, title, author, publisher, cover_image, created_at").eq("user_id", session.user.id).order("created_at", { ascending: false }),
      supabase.from("swap_requests").select("id", { count: "exact", head: true }).or(`requester_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`),
      supabase.from("swap_requests").select(`id, status, is_public, created_at, requester_id, receiver_id, offered_book:user_books!offered_book_id(id, title, author, cover_image), wanted_book:user_books!wanted_book_id(id, title, author, cover_image), requester:users!requester_id(id, nickname), receiver:users!receiver_id(id, nickname)`).or(`requester_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`).in("status", ["pending", "accepted", "completed"]).order("created_at", { ascending: false }),
    ]);
    userBooks = booksResult.data ?? [];
    swapCount = swapsResult.count ?? 0;
    mySwaps = (swapsDataResult.data ?? []) as unknown as SwapWithRelations[];
  }

  const displayName = (session?.user as { nickname?: string })?.nickname ?? session?.user?.name ?? "독서가";
  const email = session?.user?.email ?? "";
  const userId = session?.user?.id ?? "";
  const pendingSwaps = mySwaps.filter((s) => s.status === "pending");
  const acceptedSwaps = mySwaps.filter((s) => s.status === "accepted");
  const completedSwaps = mySwaps.filter((s) => s.status === "completed");

  return (
    <div className="w-full max-w-4xl mx-auto px-8 py-10">
      {/* Profile section */}
      <div className="grid grid-cols-2 gap-12">
        {/* Left: user info */}
        <div>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-white border border-neutral/10 rounded-sm flex flex-col items-center justify-center gap-1 flex-shrink-0">
              <BookSwapIcon />
              <span className="text-[7px] tracking-[0.2em] text-primary font-body uppercase">BookSwap</span>
            </div>
            <div>
              <h1 className="font-headline text-2xl text-neutral leading-snug">{displayName}</h1>
              <p className="text-neutral/45 text-sm font-body mt-0.5">{email}</p>
            </div>
          </div>
          <div className="flex gap-8 mt-6">
            <div>
              <p className="text-[10px] tracking-[0.15em] uppercase text-neutral/40 font-body">진행한 교환독서</p>
              <p className="font-body text-xl text-neutral mt-1">{swapCount}회</p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.15em] uppercase text-neutral/40 font-body">등록한 책</p>
              <p className="font-body text-xl text-neutral mt-1">{userBooks.length}권</p>
            </div>
          </div>
          <div className="mt-5 flex gap-2 flex-wrap">
            <RegisterBookButton />
            <SwapRequestButton userBooks={userBooks} />
            <ProfileEditButton />
          </div>
        </div>

        {/* Right: membership + quote */}
        <div>
          <div className="border border-neutral/10 bg-white/50 px-5 py-4 rounded-sm">
            <p className="text-[10px] tracking-[0.2em] uppercase text-primary font-body mb-2">회원 등급</p>
            <p className="font-headline italic text-neutral text-lg">{MEMBER_GRADE.label}</p>
            <p className="text-[12px] text-neutral/55 font-body mt-2 leading-relaxed">{MEMBER_GRADE.desc}</p>
          </div>
          <blockquote className="font-headline italic text-neutral/70 text-[0.88rem] leading-relaxed mt-5">
            &ldquo;{MEMBER_GRADE.quote}&rdquo;
          </blockquote>
          <p className="text-[9px] tracking-[0.2em] uppercase text-neutral/35 mt-2 font-body">— Bibliotheca Editor</p>
        </div>
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-neutral/10 my-10" />

      {/* My books section */}
      {userBooks.length > 0 && (
        <>
          <div className="mb-6">
            <p className="text-sm font-body text-neutral">내 책 목록</p>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-10">
            {userBooks.map((book) => (
              <div key={book.id} className="border border-neutral/10 bg-white/40 px-4 pt-3 pb-4">
                <div className="flex justify-end mb-3">
                  <DeleteBookButton bookId={book.id} />
                </div>
                {book.cover_image ? (
                  <div className="relative w-full aspect-[3/4] mb-3 overflow-hidden">
                    <Image src={highResCover(book.cover_image)!} alt={book.title} fill className="object-cover object-top" quality={90} />
                  </div>
                ) : (
                  <div className="w-full aspect-[3/4] bg-neutral/8 mb-3" />
                )}
                <p className="font-body text-sm text-neutral leading-snug line-clamp-2">{book.title}</p>
                <p className="text-[11px] text-neutral/45 font-body mt-1">{book.author}</p>
              </div>
            ))}
          </div>
          <div className="w-full h-px bg-neutral/10 mb-10" />
        </>
      )}

      {/* Swap lists */}
      {(pendingSwaps.length > 0 || acceptedSwaps.length > 0 || completedSwaps.length > 0) && (
        <>
          {pendingSwaps.length > 0 && (
            <SwapSection title="진행 중인 요청" swaps={pendingSwaps} userId={userId} />
          )}
          {acceptedSwaps.length > 0 && (
            <SwapSection title="수락된 교환" swaps={acceptedSwaps} userId={userId} />
          )}
          {completedSwaps.length > 0 && (
            <SwapSection title="완료된 교환" swaps={completedSwaps} userId={userId} />
          )}
          <div className="w-full h-px bg-neutral/10 mb-10" />
        </>
      )}

      {/* Calendar section */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm font-body text-neutral">교환 독서 달력</p>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 border border-neutral/20 px-3 py-1.5 text-[11px] font-body text-neutral/60 hover:border-neutral/40 transition-colors">
              <PlusIcon />
              일정 등록
            </button>
            <button className="flex items-center gap-1.5 border border-neutral/20 px-3 py-1.5 text-[11px] font-body text-neutral/60 hover:border-neutral/40 transition-colors">
              <TrashIcon />
              일정 삭제
            </button>
            <button className="border border-neutral/20 px-2.5 py-1.5 text-neutral/50 hover:border-neutral/40 transition-colors">
              <ChevronDownIcon />
            </button>
          </div>
        </div>

        <div className="border border-neutral/15 bg-white/40">
          <div className="grid grid-cols-7 border-b border-neutral/10">
            {DAY_LABELS.map((label) => (
              <div key={label} className="py-2.5 text-center text-[10px] tracking-[0.18em] text-neutral/40 font-body">
                {label}
              </div>
            ))}
          </div>
          {WEEKS.map((week, wi) => (
            <div key={wi} className={`grid grid-cols-7${wi > 0 ? " border-t border-neutral/10" : ""}`}>
              {week.map(({ day, isPrev }, di) => {
                const event = getEvent(day, isPrev);
                return (
                  <div key={di} className={`min-h-[80px] px-2 py-2${di < 6 ? " border-r border-neutral/10" : ""}`}>
                    <p className={`text-[11px] font-body mb-1.5 ${isPrev ? "text-neutral/25" : "text-neutral/55"}`}>{day}</p>
                    {event && (
                      <div className="bg-primary rounded-sm px-1.5 py-1">
                        <p className="text-[9px] text-secondary font-body leading-tight">{event.time}</p>
                        <p className="text-[9px] text-secondary font-body leading-tight font-medium">{event.title}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

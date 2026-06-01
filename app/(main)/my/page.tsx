import type { CalendarEvent } from "@/types/user";
import RegisterBookButton from "./RegisterBookButton";

const PROFILE = {
  displayName: "지적인 독서가",
  email: "reader@bibliotheca.com",
  swapCount: 12,
  readCount: 24,
  memberGrade: "Editorial Fellow",
  memberGradeDesc:
    "당신은 지역 도서관의 큐레이터와 같은 안목을 가지고 계시군요.",
  quote:
    "책은 단순히 읽는 것이 아니라, 누군가와 그 문장을 나누었을 때 비로소 완성됩니다.",
  quoteAttribution: "Bibliotheca Editor",
};

const EVENTS: CalendarEvent[] = [
  { id: "ev-1", date: "2025-05-02", time: "오전 10:00", title: "서울 북클럽" },
  {
    id: "ev-2",
    date: "2025-05-13",
    time: "오후 2:00",
    title: "독서모임(강남)",
  },
];

type CalDay = { day: number; isPrev?: boolean };

// May 2025: May 1 = Thursday (col index 4)
const WEEKS: CalDay[][] = [
  [
    { day: 27, isPrev: true },
    { day: 28, isPrev: true },
    { day: 29, isPrev: true },
    { day: 30, isPrev: true },
    { day: 1 },
    { day: 2 },
    { day: 3 },
  ],
  [
    { day: 4 },
    { day: 5 },
    { day: 6 },
    { day: 7 },
    { day: 8 },
    { day: 9 },
    { day: 10 },
  ],
  [
    { day: 11 },
    { day: 12 },
    { day: 13 },
    { day: 14 },
    { day: 15 },
    { day: 16 },
    { day: 17 },
  ],
];

const DAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function getEvent(day: number, isPrev?: boolean): CalendarEvent | undefined {
  if (isPrev) return undefined;
  const key = `2025-05-${String(day).padStart(2, "0")}`;
  return EVENTS.find((e) => e.date === key);
}

function BookSwapIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4 4h7v16H4zM13 4h7v16h-7z"
        stroke="#5a633a"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <line
        x1="11"
        y1="12"
        x2="13"
        y2="12"
        stroke="#5a633a"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export default function MyPage() {
  return (
    <div className="w-full max-w-4xl mx-auto px-8 py-10">
      {/* Profile section */}
      <div className="grid grid-cols-2 gap-12">
        {/* Left: user info */}
        <div>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-white border border-neutral/10 rounded-sm flex flex-col items-center justify-center gap-1 flex-shrink-0">
              <BookSwapIcon />
              <span className="text-[7px] tracking-[0.2em] text-primary font-body uppercase">
                BookSwap
              </span>
            </div>
            <div>
              <h1 className="font-headline text-2xl text-neutral leading-snug">
                {PROFILE.displayName}
              </h1>
              <p className="text-neutral/45 text-sm font-body mt-0.5">
                {PROFILE.email}
              </p>
            </div>
          </div>
          <div className="flex gap-8 mt-6">
            <div>
              <p className="text-[10px] tracking-[0.15em] uppercase text-neutral/40 font-body">
                진행한 교환독서
              </p>
              <p className="font-body text-xl text-neutral mt-1">
                {PROFILE.swapCount}회
              </p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.15em] uppercase text-neutral/40 font-body">
                읽은 책
              </p>
              <p className="font-body text-xl text-neutral mt-1">
                {PROFILE.readCount}권
              </p>
            </div>
          </div>
          <div className="mt-5">
            <RegisterBookButton />
          </div>
        </div>

        {/* Right: membership + quote */}
        <div>
          <div className="border border-neutral/10 bg-white/50 px-5 py-4 rounded-sm">
            <p className="text-[10px] tracking-[0.2em] uppercase text-primary font-body mb-2">
              회원 등급
            </p>
            <p className="font-headline italic text-neutral text-lg">
              {PROFILE.memberGrade}
            </p>
            <p className="text-[12px] text-neutral/55 font-body mt-2 leading-relaxed">
              {PROFILE.memberGradeDesc}
            </p>
          </div>
          <blockquote className="font-headline italic text-neutral/70 text-[0.88rem] leading-relaxed mt-5">
            &ldquo;{PROFILE.quote}&rdquo;
          </blockquote>
          <p className="text-[9px] tracking-[0.2em] uppercase text-neutral/35 mt-2 font-body">
            — {PROFILE.quoteAttribution}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-neutral/10 my-10" />

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

        {/* Calendar grid */}
        <div className="border border-neutral/15 bg-white/40">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-neutral/10">
            {DAY_LABELS.map((label) => (
              <div
                key={label}
                className="py-2.5 text-center text-[10px] tracking-[0.18em] text-neutral/40 font-body"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Weeks */}
          {WEEKS.map((week, wi) => (
            <div
              key={wi}
              className={`grid grid-cols-7${wi > 0 ? " border-t border-neutral/10" : ""}`}
            >
              {week.map(({ day, isPrev }, di) => {
                const event = getEvent(day, isPrev);
                return (
                  <div
                    key={di}
                    className={`min-h-[80px] px-2 py-2${di < 6 ? " border-r border-neutral/10" : ""}`}
                  >
                    <p
                      className={`text-[11px] font-body mb-1.5 ${isPrev ? "text-neutral/25" : "text-neutral/55"}`}
                    >
                      {day}
                    </p>
                    {event && (
                      <div className="bg-primary rounded-sm px-1.5 py-1">
                        <p className="text-[9px] text-secondary font-body leading-tight">
                          {event.time}
                        </p>
                        <p className="text-[9px] text-secondary font-body leading-tight font-medium">
                          {event.title}
                        </p>
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

"use client";

import { useState, useCallback, useEffect } from "react";

type BookStatus = "registered" | "noted" | "swapping" | "swapped";
type BookshelfBook = { id: string; title: string; author: string; status: BookStatus };
type MonthlyData = { year: number; month: number; books: BookshelfBook[] };

const STATUS_COLORS: Record<BookStatus, string> = {
  registered: "#f5ecc8",
  noted: "#f4d23d",
  swapping: "#c8e6c0",
  swapped: "#b8e6b0",
};
const STATUS_LABELS: Record<BookStatus, string> = {
  registered: "등록한 책",
  noted: "독서 기록",
  swapping: "스왑 진행 중",
  swapped: "스왑 완료",
};

function BookSpine({
  book,
  bookW = 36,
  bookH = 120,
}: {
  book: BookshelfBook;
  bookW?: number;
  bookH?: number;
}) {
  return (
    <div
      style={{
        width: bookW,
        height: bookH,
        borderRadius: "3px 3px 0 0",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        border: "1px solid rgba(3,5,5,0.15)",
        background: `linear-gradient(to right, rgba(0,0,0,0.06) 0%, ${STATUS_COLORS[book.status]} 15%, ${STATUS_COLORS[book.status]} 85%, rgba(0,0,0,0.06) 100%)`,
      }}
      title={book.title}
    >
      <span
        style={{
          writingMode: "vertical-rl",
          textOrientation: "mixed",
          fontSize: bookW < 20 ? "0.5rem" : "0.5625rem",
          fontWeight: 600,
          color: "rgba(3,5,5,0.65)",
          lineHeight: 1.1,
          padding: "4px 0",
          overflow: "hidden",
          maxHeight: "100%",
          userSelect: "none",
        }}
      >
        {book.title.length > 14 ? book.title.slice(0, 13) + "…" : book.title}
      </span>
    </div>
  );
}

function BookshelfViz({
  books,
  bookW = 36,
  bookH = 120,
  loading = false,
}: {
  books: BookshelfBook[];
  bookW?: number;
  bookH?: number;
  loading?: boolean;
}) {
  const isCompact = bookW < 20;

  return (
    <div style={{ opacity: loading ? 0.45 : 1, transition: "opacity 0.2s" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: isCompact ? "2px" : "4px",
          padding: isCompact ? "8px 8px 0" : "16px 16px 0",
          backgroundColor: "#faf8f4",
          borderRadius: "8px 8px 0 0",
          minHeight: bookH + (isCompact ? 8 : 16),
          border: "1px solid #E0E0E0",
          borderBottom: "none",
        }}
      >
        {books.length === 0 ? (
          <p style={{ fontSize: "0.75rem", color: "#aaaaaa", margin: "auto", paddingBottom: "16px" }}>
            이 달에 등록한 책이 없어요
          </p>
        ) : (
          books.map((book) => (
            <BookSpine key={book.id} book={book} bookW={bookW} bookH={bookH} />
          ))
        )}
      </div>
      {/* Shelf board */}
      <div
        style={{
          height: isCompact ? 6 : 10,
          background: "linear-gradient(to bottom, #a0784a, #7a5c36)",
          border: "1px solid rgba(3,5,5,0.35)",
          borderRadius: "0 0 4px 4px",
          boxShadow: "0 3px 8px rgba(3,5,5,0.18)",
        }}
      />
    </div>
  );
}

// ——— All months popup ———

function AllMonthsPopup({
  joinYear,
  joinMonth,
  onClose,
}: {
  joinYear: number;
  joinMonth: number;
  onClose: () => void;
}) {
  const [months, setMonths] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hideInactive, setHideInactive] = useState(false);

  useEffect(() => {
    fetch("/api/bookshelf?all=true")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (data) setMonths(data.months ?? []); })
      .catch((err) => console.error("Error fetching bookshelf archive:", err))
      .finally(() => setLoading(false));
  }, []);

  const displayed = hideInactive ? months.filter((m) => m.books.length > 0) : months;
  // Show most recent first
  const reversed = [...displayed].reverse();

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 60,
        padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #E0E0E0",
          borderRadius: "16px",
          boxShadow: "0px 8px 32px rgba(3,5,5,0.16)",
          width: "100%",
          maxWidth: "640px",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid #E0E0E0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div>
            <h2 style={{ fontFamily: "var(--font-fredoka)", fontSize: "1.25rem", fontWeight: 700, color: "#030505" }}>
              나의 책장 아카이브
            </h2>
            <p style={{ fontSize: "0.6875rem", color: "#888888", marginTop: "2px" }}>
              {joinYear}.{String(joinMonth).padStart(2, "0")} 부터
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={hideInactive}
                onChange={(e) => setHideInactive(e.target.checked)}
                style={{ cursor: "pointer", accentColor: "#030505" }}
              />
              <span style={{ fontSize: "0.6875rem", color: "#555555", userSelect: "none" }}>
                활동하지 않은 월 숨기기
              </span>
            </label>
            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: "9999px",
                border: "1px solid #E0E0E0",
                backgroundColor: "#f5f5f5",
                fontSize: "1rem",
                color: "#555555",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ overflowY: "auto", padding: "20px 24px", flex: 1 }}>
          {loading ? (
            <p style={{ textAlign: "center", color: "#aaaaaa", fontSize: "0.875rem", padding: "40px 0" }}>
              불러오는 중…
            </p>
          ) : reversed.length === 0 ? (
            <p style={{ textAlign: "center", color: "#aaaaaa", fontSize: "0.875rem", padding: "40px 0" }}>
              표시할 달이 없어요
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {reversed.map((m) => (
                <div key={`${m.year}-${m.month}`}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#030505" }}>
                      {m.year}년 {m.month}월
                    </span>
                    <span style={{ fontSize: "0.6875rem", color: "#888888" }}>
                      {m.books.length}권
                    </span>
                  </div>
                  <BookshelfViz books={m.books} bookW={20} bookH={80} />
                  {m.books.length > 0 && (
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
                      {(["registered", "noted", "swapping", "swapped"] as BookStatus[]).map((s) => {
                        const count = m.books.filter((b) => b.status === s).length;
                        if (count === 0) return null;
                        return (
                          <span
                            key={s}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "0.5625rem",
                              color: "#555555",
                            }}
                          >
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: 1,
                                backgroundColor: STATUS_COLORS[s],
                                border: "1px solid rgba(3,5,5,0.15)",
                                display: "inline-block",
                              }}
                            />
                            {STATUS_LABELS[s]} {count}권
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ——— Canvas download ———

async function downloadBookshelf(
  books: BookshelfBook[],
  year: number,
  month: number
) {
  await document.fonts.ready;

  const W = 1080, H = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background
  ctx.fillStyle = "#faf8f4";
  ctx.fillRect(0, 0, W, H);

  // Outer border
  ctx.strokeStyle = "#030505";
  ctx.lineWidth = 3;
  ctx.strokeRect(36, 36, W - 72, H - 72);

  // Inner accent border
  ctx.strokeStyle = "#E0E0E0";
  ctx.lineWidth = 1;
  ctx.strokeRect(44, 44, W - 88, H - 88);

  // Title
  ctx.font = `bold 76px "Fredoka", "Noto Sans KR", sans-serif`;
  ctx.fillStyle = "#030505";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(`${month}월의 책장`, 80, 160);

  // Year label
  ctx.font = `500 34px "Fredoka", sans-serif`;
  ctx.fillStyle = "#888888";
  ctx.fillText(`${year}`, 80, 208);

  // Bookshelf area
  const shelfY = 640;
  const bookH = 220;
  const numBooks = Math.max(books.length, 1);
  const availW = W - 160;
  const gap = 6;
  const bookW = Math.min(120, Math.floor((availW - gap * (numBooks - 1)) / numBooks));
  const totalW = numBooks * bookW + (numBooks - 1) * gap;
  const startX = Math.floor((W - totalW) / 2);

  // Books
  books.forEach((book, i) => {
    const x = startX + i * (bookW + gap);
    const y = shelfY - bookH;

    const grad = ctx.createLinearGradient(x, 0, x + bookW, 0);
    grad.addColorStop(0, "rgba(0,0,0,0.07)");
    grad.addColorStop(0.12, STATUS_COLORS[book.status]);
    grad.addColorStop(0.88, STATUS_COLORS[book.status]);
    grad.addColorStop(1, "rgba(0,0,0,0.07)");
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, bookW, bookH);

    ctx.strokeStyle = "rgba(3,5,5,0.18)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, bookW, bookH);

    ctx.save();
    ctx.translate(x + bookW / 2, shelfY - 14);
    ctx.rotate(-Math.PI / 2);
    ctx.font = `600 ${Math.max(12, Math.min(16, bookW * 0.26))}px "Noto Sans KR", sans-serif`;
    ctx.fillStyle = "rgba(3,5,5,0.68)";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const label = book.title.length > 10 ? book.title.slice(0, 9) + "…" : book.title;
    ctx.fillText(label, -(bookH - 24), 0);
    ctx.restore();
  });

  // Shelf board
  const shelfGrad = ctx.createLinearGradient(0, shelfY, 0, shelfY + 18);
  shelfGrad.addColorStop(0, "#b8895a");
  shelfGrad.addColorStop(1, "#7a5c36");
  ctx.fillStyle = shelfGrad;
  ctx.fillRect(60, shelfY, W - 120, 18);
  ctx.strokeStyle = "rgba(3,5,5,0.5)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(60, shelfY, W - 120, 18);

  // Shadow below shelf
  ctx.fillStyle = "rgba(3,5,5,0.08)";
  ctx.fillRect(60, shelfY + 18, W - 120, 10);

  // Legend
  const legendY = shelfY + 60;
  const statuses = ["registered", "noted", "swapping", "swapped"] as BookStatus[];
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  statuses.forEach((s, i) => {
    const lx = 80 + i * 240;
    ctx.fillStyle = STATUS_COLORS[s];
    ctx.fillRect(lx, legendY, 24, 24);
    ctx.strokeStyle = "rgba(3,5,5,0.2)";
    ctx.lineWidth = 1;
    ctx.strokeRect(lx, legendY, 24, 24);
    ctx.font = `500 20px "Noto Sans KR", sans-serif`;
    ctx.fillStyle = "#444444";
    ctx.fillText(STATUS_LABELS[s], lx + 32, legendY + 12);
  });

  // Stats
  ctx.font = `700 28px "Noto Sans KR", sans-serif`;
  ctx.fillStyle = "#030505";
  ctx.textAlign = "left";
  ctx.fillText(`총 ${books.length}권`, 80, legendY + 70);

  // Watermark
  ctx.font = `500 22px "Fredoka", sans-serif`;
  ctx.fillStyle = "#cccccc";
  ctx.textAlign = "right";
  ctx.fillText("swap-books.vercel.app", W - 60, H - 60);

  const link = document.createElement("a");
  link.download = `${year}년-${month}월의-책장.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

// ——— Main component ———

export default function MonthlyBookshelfClient({
  initialBooks,
  initialYear,
  initialMonth,
  joinYear,
  joinMonth,
}: {
  initialBooks: BookshelfBook[];
  initialYear: number;
  initialMonth: number;
  joinYear: number;
  joinMonth: number;
}) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [books, setBooks] = useState<BookshelfBook[]>(initialBooks);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showAllMonths, setShowAllMonths] = useState(false);

  const canGoPrev =
    year > joinYear || (year === joinYear && month > joinMonth);
  // Use server-derived initialYear/Month to avoid SSR/client hydration mismatch
  const canGoNext =
    year < initialYear || (year === initialYear && month < initialMonth);

  const navigate = useCallback(
    async (dir: -1 | 1) => {
      let newYear = year;
      let newMonth = month + dir;
      if (newMonth < 1) { newMonth = 12; newYear--; }
      if (newMonth > 12) { newMonth = 1; newYear++; }
      setYear(newYear);
      setMonth(newMonth);
      setLoading(true);
      const res = await fetch(`/api/bookshelf?year=${newYear}&month=${newMonth}`);
      if (res.ok) {
        const data = await res.json();
        setBooks(data.books ?? []);
      }
      setLoading(false);
    },
    [year, month]
  );

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      await downloadBookshelf(books, year, month);
    } finally {
      setDownloading(false);
    }
  }, [books, year, month]);

  return (
    <>
      <div className="mb-10">
        {/* Section header */}
        <div className="flex items-center justify-between mb-4">
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
            월간 책장
          </span>
          <button
            onClick={() => setShowAllMonths(true)}
            style={{
              border: "1.5px solid #030505",
              borderRadius: "9999px",
              padding: "4px 14px",
              fontSize: "0.6875rem",
              fontWeight: 700,
              color: "#030505",
              backgroundColor: "#ffffff",
              boxShadow: "0px 1px 4px rgba(3,5,5,0.06)",
            }}
          >
            전체보기
          </button>
        </div>

        {/* Month navigation + title */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              disabled={!canGoPrev || loading}
              style={{
                border: "1px solid #E0E0E0",
                borderRadius: "9999px",
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#ffffff",
                fontSize: "0.875rem",
                fontWeight: 700,
                opacity: !canGoPrev ? 0.3 : 1,
              }}
            >
              ‹
            </button>
            <span
              style={{
                fontFamily: "var(--font-fredoka)",
                fontSize: "1.125rem",
                fontWeight: 700,
                color: "#030505",
                minWidth: "110px",
                textAlign: "center",
              }}
            >
              {year}년 {month}월
            </span>
            <button
              onClick={() => navigate(1)}
              disabled={!canGoNext || loading}
              style={{
                border: "1px solid #E0E0E0",
                borderRadius: "9999px",
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#ffffff",
                fontSize: "0.875rem",
                fontWeight: 700,
                opacity: !canGoNext ? 0.3 : 1,
              }}
            >
              ›
            </button>
          </div>
          <button
            onClick={handleDownload}
            disabled={downloading || books.length === 0}
            style={{
              border: "1.5px solid #030505",
              borderRadius: "9999px",
              padding: "5px 14px",
              fontSize: "0.6875rem",
              fontWeight: 700,
              color: "#030505",
              backgroundColor: "#f4d23d",
              boxShadow: "0px 1px 4px rgba(3,5,5,0.06)",
              opacity: books.length === 0 ? 0.35 : 1,
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 1v7M3.5 5.5L6 8l2.5-2.5M1.5 10h9" stroke="#030505" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {downloading ? "저장 중…" : "인스타그램 저장"}
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 flex-wrap mb-4">
          {(["registered", "noted", "swapping", "swapped"] as BookStatus[]).map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  backgroundColor: STATUS_COLORS[s],
                  border: "1px solid rgba(3,5,5,0.18)",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: "0.625rem", color: "#555555" }}>{STATUS_LABELS[s]}</span>
            </div>
          ))}
        </div>

        {/* Bookshelf */}
        <BookshelfViz books={books} loading={loading} />

        {/* Book count */}
        <p style={{ fontSize: "0.6875rem", color: "#aaaaaa", marginTop: "8px", textAlign: "right" }}>
          {books.length > 0 ? `${books.length}권의 책` : ""}
        </p>
      </div>

      {showAllMonths && (
        <AllMonthsPopup
          joinYear={joinYear}
          joinMonth={joinMonth}
          onClose={() => setShowAllMonths(false)}
        />
      )}
    </>
  );
}

"use client";

import { useState } from "react";

export type CalendarEvent = { id: string; date: string; time: string | null; title: string };

function formatTime(time: string | null): string {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const period = h < 12 ? "오전" : "오후";
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${period} ${hour}:${String(m).padStart(2, "0")}`;
}

const DAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function buildWeeks(year: number, month: number) {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells: { day: number; isCur: boolean; dateStr: string }[] = [];

  for (let i = firstDow - 1; i >= 0; i--) {
    cells.push({ day: prevMonthDays - i, isCur: false, dateStr: "" });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      day: d,
      isCur: true,
      dateStr: `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    });
  }
  let nextDay = 1;
  const target = Math.ceil(cells.length / 7) * 7;
  while (cells.length < target) {
    cells.push({ day: nextDay++, isCur: false, dateStr: "" });
  }

  const weeks: (typeof cells)[] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

type ModalState =
  | { mode: "add"; date: string }
  | { mode: "edit"; event: CalendarEvent };

export default function CalendarClient({
  initialEvents,
  initialYear,
  initialMonth,
}: {
  initialEvents: CalendarEvent[];
  initialYear: number;
  initialMonth: number;
}) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [titleVal, setTitleVal] = useState("");
  const [timeVal, setTimeVal] = useState("");
  const [saving, setSaving] = useState(false);

  const weeks = buildWeeks(year, month);

  async function navigate(dir: -1 | 1) {
    const newMonth = ((month + dir + 12) % 12) as number;
    const newYear = month === 0 && dir === -1 ? year - 1 : month === 11 && dir === 1 ? year + 1 : year;
    setYear(newYear);
    setMonth(newMonth);
    const res = await fetch(`/api/calendar-events?year=${newYear}&month=${newMonth + 1}`);
    if (res.ok) setEvents(await res.json());
  }

  function openAdd(dateStr: string) {
    setModal({ mode: "add", date: dateStr });
    setTitleVal("");
    setTimeVal("");
  }

  function openEdit(e: CalendarEvent) {
    setModal({ mode: "edit", event: e });
    setTitleVal(e.title);
    // Supabase TIME type returns "HH:MM:SS"; <input type="time"> needs "HH:MM"
    setTimeVal(e.time ? e.time.slice(0, 5) : "");
  }

  function closeModal() {
    setModal(null);
    setTitleVal("");
    setTimeVal("");
  }

  async function handleSave() {
    if (!titleVal.trim() || !modal) return;
    setSaving(true);
    try {
      if (modal.mode === "add") {
        const res = await fetch("/api/calendar-events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: titleVal.trim(), date: modal.date, time: timeVal.trim() || null }),
        });
        if (res.ok) {
          const newEvent: CalendarEvent = await res.json();
          setEvents((prev) => [...prev, newEvent]);
          closeModal();
        }
      } else {
        const res = await fetch(`/api/calendar-events/${modal.event.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: titleVal.trim(), time: timeVal.trim() || null }),
        });
        if (res.ok) {
          const updated: CalendarEvent = await res.json();
          setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
          closeModal();
        }
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (modal?.mode !== "edit") return;
    if (!confirm("일정을 삭제하시겠습니까?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/calendar-events/${modal.event.id}`, { method: "DELETE" });
      if (res.ok) {
        setEvents((prev) => prev.filter((e) => e.id !== modal.event.id));
        closeModal();
      }
    } finally {
      setSaving(false);
    }
  }

  const modalDate = modal?.mode === "add" ? modal.date : modal?.mode === "edit" ? modal.event.date : "";

  return (
    <>
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span
            style={{
              display: "inline-block",
              backgroundColor: "#f4d23d",
              border: "1.5px solid #030505",
              borderRadius: "9999px",
              padding: "3px 12px",
              fontSize: "0.75rem",
              fontWeight: 700,
            }}
          >
            교환 독서 달력
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            style={{
              border: "1px solid #E0E0E0",
              borderRadius: "9999px",
              width: "28px",
              height: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#ffffff",
              fontSize: "0.75rem",
              fontWeight: 700,
            }}
          >
            ‹
          </button>
          <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#030505", minWidth: "120px", textAlign: "center" }}>
            {MONTH_NAMES[month]} {year}
          </span>
          <button
            onClick={() => navigate(1)}
            style={{
              border: "1px solid #E0E0E0",
              borderRadius: "9999px",
              width: "28px",
              height: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#ffffff",
              fontSize: "0.75rem",
              fontWeight: 700,
            }}
          >
            ›
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #E0E0E0",
          borderRadius: "12px",
          boxShadow: "0px 2px 8px rgba(3,5,5,0.08)",
          overflow: "hidden",
        }}
      >
        <div className="grid grid-cols-7" style={{ borderBottom: "1px solid #E0E0E0" }}>
          {DAY_LABELS.map((label) => (
            <div
              key={label}
              className="py-2.5 text-center"
              style={{ fontSize: "0.625rem", fontWeight: 700, color: "#888888" }}
            >
              {label}
            </div>
          ))}
        </div>

        {weeks.map((week, wi) => (
          <div
            key={wi}
            className="grid grid-cols-7"
            style={wi > 0 ? { borderTop: "1px solid #e5e5e5" } : {}}
          >
            {week.map(({ day, isCur, dateStr }, di) => {
              const dayEvents = isCur ? events.filter((e) => e.date === dateStr) : [];
              return (
                <div
                  key={di}
                  className="min-h-[80px] px-2 py-2"
                  style={{
                    borderRight: di < 6 ? "1px solid #e5e5e5" : undefined,
                    cursor: isCur ? "pointer" : undefined,
                  }}
                  onClick={() => isCur && openAdd(dateStr)}
                >
                  <p
                    style={{
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      color: isCur ? "#030505" : "#dddddd",
                      marginBottom: "4px",
                    }}
                  >
                    {day}
                  </p>
                  <div className="flex flex-col gap-1">
                    {dayEvents.map((ev) => (
                      <div
                        key={ev.id}
                        onClick={(e) => { e.stopPropagation(); openEdit(ev); }}
                        style={{
                          backgroundColor: "#a0e4f2",
                          border: "1px solid #E0E0E0",
                          borderRadius: "6px",
                          padding: "3px 6px",
                          cursor: "pointer",
                        }}
                      >
                        {ev.time && (
                          <p style={{ fontSize: "0.5rem", color: "#030505", lineHeight: 1.3 }}>{formatTime(ev.time)}</p>
                        )}
                        <p style={{ fontSize: "0.5625rem", color: "#030505", lineHeight: 1.3, fontWeight: 600 }}>
                          {ev.title}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <p style={{ fontSize: "0.6875rem", color: "#aaaaaa", marginTop: "8px", textAlign: "center" }}>
        날짜를 클릭하면 일정을 추가할 수 있어요
      </p>

      {/* Modal */}
      {modal && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #E0E0E0",
              borderRadius: "12px",
              boxShadow: "0px 2px 8px rgba(3,5,5,0.08)",
              padding: "24px",
              width: "100%",
              maxWidth: "340px",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontWeight: 700, fontSize: "1rem", color: "#030505" }}>
                {modal.mode === "add" ? "일정 추가" : "일정 수정"}
              </h3>
              <span style={{ fontSize: "0.75rem", color: "#888888" }}>{modalDate}</span>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#555555", display: "block", marginBottom: "6px" }}>
                  일정 제목 *
                </label>
                <input
                  value={titleVal}
                  onChange={(e) => setTitleVal(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  placeholder="예: 북클럽 모임"
                  autoFocus
                  style={{
                    width: "100%",
                    border: "1px solid #E0E0E0",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    fontSize: "0.875rem",
                    outline: "none",
                    color: "#030505",
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#555555", display: "block", marginBottom: "6px" }}>
                  시간 (선택)
                </label>
                <input
                  type="time"
                  value={timeVal}
                  onChange={(e) => setTimeVal(e.target.value)}
                  style={{
                    width: "100%",
                    border: "1.5px solid #e5e5e5",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    fontSize: "0.875rem",
                    outline: "none",
                    color: "#030505",
                  }}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              {modal.mode === "edit" && (
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  style={{
                    border: "1.5px solid #030505",
                    borderRadius: "9999px",
                    padding: "8px 14px",
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    color: "#030505",
                    backgroundColor: "#f5f5f5",
                  }}
                >
                  삭제
                </button>
              )}
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={closeModal}
                  style={{
                    border: "1.5px solid #e5e5e5",
                    borderRadius: "9999px",
                    padding: "8px 16px",
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    color: "#888888",
                    backgroundColor: "#ffffff",
                  }}
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !titleVal.trim()}
                  style={{
                    backgroundColor: "#f4d23d",
                    border: "2px solid #030505",
                    borderRadius: "9999px",
                    padding: "8px 18px",
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    color: "#030505",
                    boxShadow: "0px 1px 4px rgba(3,5,5,0.06)",
                    opacity: saving || !titleVal.trim() ? 0.5 : 1,
                  }}
                >
                  {saving ? "저장 중…" : "저장"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

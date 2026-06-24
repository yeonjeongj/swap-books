"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { highResCover } from "@/lib/utils/cover";

type BookData = {
  id: string;
  title: string;
  author: string;
  cover_image: string | null;
};

type NoteComment = {
  id: string;
  author_id: string;
  text: string;
  created_at: string;
  parent_id: string | null;
  author: { nickname: string } | null;
};

type ReadingNote = {
  id: string;
  book_id: string;
  page: number;
  quote: string | null;
  image_url: string | null;
  created_at: string;
  author: { nickname: string } | null;
  reading_note_comments: NoteComment[];
};

type Props = { book: BookData; currentUserId: string };

function getInitials(name: string) {
  return name ? name.charAt(0).toUpperCase() : "?";
}

function getAvatarColor(name: string) {
  const colors = ["#a0e4f2", "#f7a8c7", "#f4d23d", "#b8e6b0"];
  return colors[name.charCodeAt(0) % colors.length];
}

function PencilIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

function BookCover({ coverImage, title }: { coverImage: string | null; title: string }) {
  const src = highResCover(coverImage);
  if (src) {
    return (
      <div
        className="relative w-full aspect-[3/4] overflow-hidden"
        style={{ borderRadius: "8px", border: "1px solid #E0E0E0" }}
      >
        <Image src={src} alt={title} fill className="object-cover object-top" quality={90} />
      </div>
    );
  }
  return (
    <div
      className="w-full aspect-[3/4] flex flex-col items-center justify-center"
      style={{ backgroundColor: "#a0e4f2", borderRadius: "8px", border: "1px solid #E0E0E0" }}
    >
      <span
        style={{
          fontFamily: "var(--font-fredoka)",
          fontSize: "0.625rem",
          fontWeight: 700,
          color: "#030505",
          letterSpacing: "0.1em",
        }}
      >
        Swap Books
      </span>
    </div>
  );
}

function CommentItem({ comment, onDelete }: { comment: NoteComment; onDelete?: () => void }) {
  const name = comment.author?.nickname ?? "독자";
  return (
    <div className="flex items-start gap-2.5">
      <div
        className="w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{
          backgroundColor: getAvatarColor(name),
          border: "1px solid #030505",
          fontSize: "0.5625rem",
          fontWeight: 700,
          color: "#030505",
        }}
      >
        {getInitials(name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#030505" }}>{name}</span>
          <span style={{ fontSize: "0.625rem", color: "#aaaaaa" }} suppressHydrationWarning>
            {new Date(comment.created_at).toLocaleDateString("ko-KR")}
          </span>
          {onDelete && (
            <button
              onClick={onDelete}
              className="ml-auto w-5 h-5 flex items-center justify-center transition-colors hover:text-red-400 flex-shrink-0"
              style={{ color: "#aaaaaa" }}
              aria-label="댓글 삭제"
            >
              <TrashIcon />
            </button>
          )}
        </div>
        <p style={{ fontSize: "0.75rem", color: "#555555", lineHeight: 1.5 }}>{comment.text}</p>
      </div>
    </div>
  );
}

function InlineCommentForm({
  value,
  onChange,
  onSubmit,
  onCancel,
  submitting,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      <textarea
        ref={ref}
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSubmit();
          if (e.key === "Escape") onCancel();
        }}
        placeholder="댓글을 입력하세요"
        className="w-full px-3 py-2 text-xs outline-none transition-colors focus:border-[#030505] bg-white resize-none"
        style={{ border: "1.5px solid #dddddd", borderRadius: "8px", color: "#030505" }}
      />
      <div className="flex gap-1.5 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-xs transition-colors hover:bg-[#f5f5f5]"
          style={{ color: "#888888" }}
        >
          취소
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting || !value.trim()}
          className="px-3 py-1.5 text-xs font-bold transition-colors hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: "#f4d23d",
            border: "1.5px solid #030505",
            borderRadius: "9999px",
            color: "#030505",
          }}
        >
          {submitting ? "..." : "등록"}
        </button>
      </div>
    </div>
  );
}

function NoteCard({
  note,
  currentUserId,
  onRefresh,
}: {
  note: ReadingNote;
  currentUserId: string;
  onRefresh: () => void;
}) {
  const comments = note.reading_note_comments;
  const levelOne = comments.filter((c) => !c.parent_id);
  const levelTwo = comments.filter((c) => c.parent_id);

  const [showForm, setShowForm] = useState(false);
  const [inputText, setInputText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function submitComment() {
    if (!inputText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const parentId = levelOne[0]?.id ?? null;
      const res = await fetch(`/api/reading-notes/${note.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText.trim(), parentId }),
      });
      if (res.ok) {
        setInputText("");
        setShowForm(false);
        onRefresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteComment(commentId: string, hasReplies: boolean) {
    const msg = hasReplies
      ? "이 댓글과 연관 댓글을 모두 삭제하시겠습니까?"
      : "이 댓글을 삭제하시겠습니까?";
    if (!confirm(msg)) return;
    setDeletingId(commentId);
    try {
      const res = await fetch(`/api/reading-notes/${note.id}/comments/${commentId}`, { method: "DELETE" });
      if (res.ok) onRefresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #E0E0E0",
        borderRadius: "12px",
        padding: "1rem",
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <span
          style={{
            fontFamily: "var(--font-fredoka)",
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "#030505",
          }}
        >
          {note.page}p
        </span>
        <div className="flex-1 h-px" style={{ backgroundColor: "#e5e5e5" }} />
        <span style={{ fontSize: "0.625rem", color: "#aaaaaa" }}>{note.author?.nickname ?? "독자"}</span>
      </div>

      {note.quote && (
        <blockquote
          style={{
            fontFamily: "var(--font-fredoka)",
            fontSize: "1rem",
            color: "#030505",
            lineHeight: 1.5,
            marginBottom: "1rem",
          }}
        >
          &ldquo;{note.quote}&rdquo;
        </blockquote>
      )}

      {note.image_url && (
        <div className="mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={note.image_url}
            alt=""
            className="max-h-64 max-w-full object-contain"
            style={{ borderRadius: "8px", border: "1.5px solid #e5e5e5" }}
          />
        </div>
      )}

      <div className="mt-2 space-y-2">
        {levelOne.map((comment) => (
          <div
            key={comment.id}
            className="px-3 py-2.5"
            style={{
              backgroundColor: "#f5f5f5",
              border: "1px solid #e5e5e5",
              borderRadius: "8px",
              transition: "opacity 0.15s",
              opacity: deletingId === comment.id ? 0.4 : 1,
            }}
          >
            <CommentItem
              comment={comment}
              onDelete={
                comment.author_id === currentUserId
                  ? () => handleDeleteComment(comment.id, levelTwo.length > 0)
                  : undefined
              }
            />
          </div>
        ))}

        {levelTwo.length > 0 && (
          <div className="ml-4 pl-3 space-y-2" style={{ borderLeft: "2px solid #e5e5e5" }}>
            {levelTwo.map((comment) => (
              <div key={comment.id} style={{ opacity: deletingId === comment.id ? 0.4 : 1 }}>
                <CommentItem
                  comment={comment}
                  onDelete={
                    comment.author_id === currentUserId
                      ? () => handleDeleteComment(comment.id, false)
                      : undefined
                  }
                />
              </div>
            ))}
          </div>
        )}

        {showForm ? (
          <InlineCommentForm
            value={inputText}
            onChange={setInputText}
            onSubmit={submitComment}
            onCancel={() => { setShowForm(false); setInputText(""); }}
            submitting={submitting}
          />
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 transition-colors"
            style={{ fontSize: "0.625rem", color: "#aaaaaa" }}
          >
            <CommentIcon />
            댓글 달기
          </button>
        )}
      </div>
    </div>
  );
}

function AddNoteForm({ bookId, onAdded }: { bookId: string; onAdded: () => void }) {
  const [page, setPage] = useState("");
  const [quote, setQuote] = useState("");
  const [comment, setComment] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => { if (imagePreview) URL.revokeObjectURL(imagePreview); };
  }, [imagePreview]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  }

  function removeImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const pageNum = parseInt(page, 10);
    if (!page || isNaN(pageNum) || pageNum < 0) {
      setError("유효한 페이지 번호를 입력해주세요.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        const fd = new FormData();
        fd.append("file", imageFile);
        const uploadRes = await fetch("/api/reading-notes/upload", { method: "POST", body: fd });
        if (!uploadRes.ok) {
          setError("이미지 업로드에 실패했습니다.");
          return;
        }
        imageUrl = (await uploadRes.json()).url;
      }

      const res = await fetch("/api/reading-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId,
          page: pageNum,
          quote: quote.trim() || undefined,
          imageUrl,
          comment: comment.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? "등록에 실패했습니다.");
        return;
      }
      setPage("");
      setQuote("");
      setComment("");
      removeImage();
      onAdded();
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = { border: "1px solid #E0E0E0", borderRadius: "8px", color: "#030505" };
  const labelStyle = { fontSize: "0.6875rem", fontWeight: 700 as const, color: "#888888" };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 mb-6"
      style={{
        backgroundColor: "#f5f5f5",
        border: "1px solid #E0E0E0",
        borderRadius: "12px",
        boxShadow: "0px 2px 8px rgba(3,5,5,0.08)",
      }}
    >
      <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#030505", marginBottom: "1rem" }}>독서 노트 등록</p>

      <div className="mb-3">
        <label style={labelStyle} className="block mb-1.5">
          페이지 <span style={{ color: "#ef4444" }}>*</span>
        </label>
        <input
          type="number"
          min="0"
          value={page}
          onChange={(e) => setPage(e.target.value)}
          placeholder="페이지 번호"
          className="w-24 px-3 py-2 text-sm outline-none transition-colors focus:border-[#030505] bg-white"
          style={inputStyle}
        />
      </div>

      <div className="mb-3">
        <label style={labelStyle} className="block mb-1.5">
          구간 문구{" "}
          <span style={{ fontSize: "0.625rem", fontWeight: 400, color: "#aaaaaa" }}>Optional</span>
        </label>
        <textarea
          rows={2}
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          placeholder="마음에 드는 문구를 적어주세요"
          className="w-full px-3 py-2 text-sm outline-none transition-colors focus:border-[#030505] bg-white resize-none"
          style={inputStyle}
        />
      </div>

      <div className="mb-3">
        <label style={labelStyle} className="block mb-1.5">
          이미지 첨부{" "}
          <span style={{ fontSize: "0.625rem", fontWeight: 400, color: "#aaaaaa" }}>Optional</span>
        </label>
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        {imagePreview ? (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview}
              alt=""
              className="max-h-36 max-w-full object-contain"
              style={{ borderRadius: "8px", border: "1px solid #E0E0E0" }}
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full text-white text-xs transition-colors hover:opacity-80"
              style={{ backgroundColor: "#030505" }}
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-[#eeeeee]"
            style={{
              border: "1px solid #E0E0E0",
              borderRadius: "8px",
              backgroundColor: "#ffffff",
              color: "#555555",
            }}
          >
            <ImageIcon />
            이미지 선택
          </button>
        )}
      </div>

      <div className="mb-4">
        <label style={labelStyle} className="block mb-1.5">
          코멘트{" "}
          <span style={{ fontSize: "0.625rem", fontWeight: 400, color: "#aaaaaa" }}>Optional</span>
        </label>
        <textarea
          rows={2}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="이 구간에 대한 생각을 적어주세요"
          className="w-full px-3 py-2 text-sm outline-none transition-colors focus:border-[#030505] bg-white resize-none"
          style={inputStyle}
        />
      </div>

      {error && <p style={{ fontSize: "0.6875rem", color: "#ef4444", marginBottom: "12px" }}>{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="flex items-center gap-2 transition-colors hover:brightness-95 disabled:opacity-50"
        style={{
          backgroundColor: "#f4d23d",
          border: "2px solid #030505",
          borderRadius: "9999px",
          padding: "8px 20px",
          fontWeight: 700,
          fontSize: "0.8125rem",
          boxShadow: "0px 1px 4px rgba(3,5,5,0.06)",
          color: "#030505",
        }}
      >
        <PencilIcon />
        {submitting ? "등록 중..." : "등록하기"}
      </button>
    </form>
  );
}

export default function BookDetail({ book, currentUserId }: Props) {
  const [notes, setNotes] = useState<ReadingNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddNote, setShowAddNote] = useState(false);

  const fetchNotes = useCallback(async () => {
    const res = await fetch(`/api/reading-notes?userBookId=${book.id}`);
    if (res.ok) setNotes(await res.json());
  }, [book.id]);

  useEffect(() => {
    fetchNotes().finally(() => setLoading(false));
  }, [fetchNotes]);

  return (
    <div className="w-full max-w-3xl mx-auto px-5 py-10">
      {/* Book header */}
      <div className="flex items-center gap-5 mb-10">
        <div className="w-20 flex-shrink-0">
          <BookCover coverImage={book.cover_image} title={book.title} />
        </div>
        <div>
          <h1
            style={{
              fontFamily: "var(--font-fredoka)",
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#030505",
              lineHeight: 1.2,
            }}
          >
            {book.title}
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#888888", marginTop: "4px" }}>{book.author}</p>
        </div>
      </div>

      {/* Reading notes */}
      <div>
        <div className="flex items-center justify-between mb-6">
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
            Reading Note
          </span>
          <button
            onClick={() => setShowAddNote((v) => !v)}
            className="flex items-center gap-2 transition-colors hover:brightness-95"
            style={{
              backgroundColor: showAddNote ? "#f5f5f5" : "#f4d23d",
              border: "1.5px solid #030505",
              borderRadius: "9999px",
              padding: "6px 14px",
              fontWeight: 700,
              fontSize: "0.75rem",
              color: "#030505",
            }}
          >
            <PencilIcon />
            {showAddNote ? "취소" : "등록하기"}
          </button>
        </div>

        {showAddNote && (
          <AddNoteForm
            bookId={book.id}
            onAdded={() => { fetchNotes(); setShowAddNote(false); }}
          />
        )}

        {loading ? (
          <p style={{ fontSize: "0.8125rem", color: "#aaaaaa" }}>불러오는 중...</p>
        ) : notes.length === 0 ? (
          <p style={{ fontSize: "0.8125rem", color: "#aaaaaa" }}>아직 등록된 노트가 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} currentUserId={currentUserId} onRefresh={fetchNotes} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

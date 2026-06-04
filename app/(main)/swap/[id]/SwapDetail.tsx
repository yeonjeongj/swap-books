"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { highResCover } from "@/lib/utils/cover";

type BookDetail = {
  id: string;
  title: string;
  author: string;
  cover_image: string | null;
};

type SwapData = {
  id: string;
  status: string;
  offered_book: BookDetail;
  wanted_book: BookDetail | null;
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

type Props = { swapId: string; currentUserId: string | null };

const AVATAR_COLORS = ["#5a633a", "#3e432e", "#7a6a52", "#4a5a3a"];

function getInitials(name: string) {
  return name ? name.charAt(0).toUpperCase() : "?";
}

function getAvatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
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

function BookCover({ coverImage, title, color }: { coverImage: string | null; title: string; color: string }) {
  const src = highResCover(coverImage);
  if (src) {
    return (
      <div className="relative w-full aspect-[3/4] overflow-hidden">
        <Image src={src} alt={title} fill className="object-cover object-top" quality={90} />
      </div>
    );
  }
  return (
    <div className="w-full aspect-[3/4] flex flex-col items-center justify-center gap-3" style={{ backgroundColor: color }}>
      <svg width="68" height="68" viewBox="0 0 68 68" fill="none" aria-hidden="true">
        <path d="M34 10C34 10 16 15 16 34C16 50 34 58 34 58C34 58 52 50 52 34C52 15 34 10 34 10Z" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
        <path d="M19 22L34 12L34 56C34 56 19 48 19 34Z" fill="rgba(255,255,255,0.12)" />
        <path d="M49 22L34 12L34 56C34 56 49 48 49 34Z" fill="rgba(255,255,255,0.08)" />
        <line x1="34" y1="12" x2="34" y2="56" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
      </svg>
      <span className="text-white/40 text-[9px] tracking-[0.35em] uppercase font-body">BookSwap</span>
    </div>
  );
}

function CommentItem({
  comment,
  onDelete,
}: {
  comment: NoteComment;
  onDelete?: () => void;
}) {
  const name = comment.author?.nickname ?? "독자";
  return (
    <div className="flex items-start gap-2.5">
      <div
        className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[9px] text-secondary font-body font-semibold flex-shrink-0 mt-0.5"
        style={{ backgroundColor: getAvatarColor(name) }}
      >
        {getInitials(name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[11px] font-body font-medium text-neutral">{name}</span>
          <span className="text-[10px] text-neutral/35 font-body" suppressHydrationWarning>
            {new Date(comment.created_at).toLocaleDateString("ko-KR")}
          </span>
          {onDelete && (
            <button
              onClick={onDelete}
              className="ml-auto w-5 h-5 flex items-center justify-center text-neutral/25 hover:text-red-400 transition-colors flex-shrink-0"
              aria-label="댓글 삭제"
            >
              <TrashIcon />
            </button>
          )}
        </div>
        <p className="text-[11.5px] text-neutral/65 font-body leading-relaxed">{comment.text}</p>
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
  placeholder = "댓글을 입력하세요",
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
  placeholder?: string;
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
        placeholder={placeholder}
        className="w-full border border-neutral/15 bg-white/60 px-3 py-2 text-xs font-body text-neutral placeholder:text-neutral/30 focus:outline-none focus:border-neutral/40 transition-colors resize-none"
      />
      <div className="flex gap-1.5 justify-end">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-[10px] font-body text-neutral/50 hover:text-neutral/70 transition-colors">
          취소
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting || !value.trim()}
          className="px-3 py-1.5 bg-primary text-secondary text-[10px] tracking-[0.15em] uppercase font-body hover:bg-tertiary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
  currentUserId: string | null;
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
      const res = await fetch(`/api/reading-notes/${note.id}/comments/${commentId}`, {
        method: "DELETE",
      });
      if (res.ok) onRefresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-neutral/50 text-sm font-body tabular-nums">{note.page}p</span>
        <div className="flex-1 h-px bg-neutral/15" />
        <span className="text-[10px] text-neutral/35 font-body">{note.author?.nickname ?? "독자"}</span>
      </div>

      {note.quote && (
        <blockquote className="font-headline italic text-neutral text-[1.05rem] leading-relaxed mb-4">
          &ldquo;{note.quote}&rdquo;
        </blockquote>
      )}

      {note.image_url && (
        <div className="mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={note.image_url}
            alt=""
            className="max-h-64 max-w-full object-contain rounded-sm border border-neutral/10"
          />
        </div>
      )}

      <div className="mt-2 space-y-2">
        {levelOne.map((comment) => (
          <div
            key={comment.id}
            className={`bg-white/60 border border-neutral/8 rounded-sm px-4 py-3 transition-opacity ${deletingId === comment.id ? "opacity-40" : ""}`}
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
          <div className="ml-4 pl-3 border-l border-neutral/10 space-y-3">
            {levelTwo.map((comment) => (
              <div key={comment.id} className={deletingId === comment.id ? "opacity-40" : ""}>
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
            className="flex items-center gap-1.5 text-[10px] text-neutral/40 hover:text-neutral/60 font-body tracking-wide transition-colors"
          >
            <CommentIcon />
            댓글 달기
          </button>
        )}
      </div>
    </div>
  );
}

const COVER_COLORS = ["#3a4430", "#6b7a52", "#4a5a3a", "#7a6a52"];

function AddNoteForm({
  swapId,
  bookId,
  onAdded,
}: {
  swapId: string;
  bookId: string;
  onAdded: () => void;
}) {
  const [page, setPage] = useState("");
  const [quote, setQuote] = useState("");
  const [comment, setComment] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => { if (imagePreview) URL.revokeObjectURL(imagePreview); };
  }, [imagePreview]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        const uploadRes = await fetch("/api/reading-notes/upload", {
          method: "POST",
          body: fd,
        });
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
          swapId,
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

  return (
    <form onSubmit={handleSubmit} className="border border-neutral/15 bg-white/50 p-4 rounded-sm mb-6">
      <p className="text-[10px] tracking-[0.2em] uppercase text-neutral/45 font-body mb-4">독서 노트 등록</p>

      <div className="mb-3">
        <label className="text-[10px] tracking-[0.1em] uppercase text-neutral/40 font-body block mb-1.5">
          페이지 <span className="text-red-400">*</span>
        </label>
        <input
          type="number"
          min="0"
          value={page}
          onChange={(e) => setPage(e.target.value)}
          placeholder="페이지 번호"
          className="w-24 border border-neutral/15 bg-white/60 px-3 py-2 text-sm font-body text-neutral placeholder:text-neutral/30 focus:outline-none focus:border-neutral/40 transition-colors"
        />
      </div>

      <div className="mb-3">
        <label className="text-[10px] tracking-[0.1em] uppercase text-neutral/40 font-body block mb-1.5">
          구간 문구
          <span className="ml-1.5 normal-case tracking-normal text-[9px] text-neutral/30">Optional</span>
        </label>
        <textarea
          rows={2}
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          placeholder="마음에 드는 문구를 적어주세요"
          className="w-full border border-neutral/15 bg-white/60 px-3 py-2 text-sm font-body text-neutral placeholder:text-neutral/30 focus:outline-none focus:border-neutral/40 transition-colors resize-none"
        />
      </div>

      <div className="mb-3">
        <label className="text-[10px] tracking-[0.1em] uppercase text-neutral/40 font-body block mb-1.5">
          이미지 첨부
          <span className="ml-1.5 normal-case tracking-normal text-[9px] text-neutral/30">Optional</span>
        </label>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        {imagePreview ? (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview}
              alt=""
              className="max-h-36 max-w-full object-contain rounded-sm border border-neutral/15"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-neutral/60 text-white text-[10px] rounded-full hover:bg-neutral/80 transition-colors"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 border border-neutral/20 px-3 py-2 text-[11px] font-body text-neutral/55 hover:border-neutral/40 hover:text-neutral/75 transition-colors"
          >
            <ImageIcon />
            이미지 선택
          </button>
        )}
      </div>

      <div className="mb-4">
        <label className="text-[10px] tracking-[0.1em] uppercase text-neutral/40 font-body block mb-1.5">
          코멘트
          <span className="ml-1.5 normal-case tracking-normal text-[9px] text-neutral/30">Optional</span>
        </label>
        <textarea
          rows={2}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="이 구간에 대한 생각을 적어주세요"
          className="w-full border border-neutral/15 bg-white/60 px-3 py-2 text-sm font-body text-neutral placeholder:text-neutral/30 focus:outline-none focus:border-neutral/40 transition-colors resize-none"
        />
      </div>

      {error && <p className="text-[11px] text-red-500 font-body mb-3">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="flex items-center gap-2 bg-primary text-secondary text-[10px] tracking-[0.18em] uppercase px-4 py-2.5 hover:bg-tertiary transition-colors disabled:opacity-50"
      >
        <PencilIcon />
        {submitting ? "등록 중..." : "등록하기"}
      </button>
    </form>
  );
}

export default function SwapDetail({ swapId, currentUserId }: Props) {
  const [swap, setSwap] = useState<SwapData | null>(null);
  const [notes, setNotes] = useState<ReadingNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showAddNote, setShowAddNote] = useState(false);

  const fetchNotes = useCallback(async () => {
    const res = await fetch(`/api/reading-notes?swapId=${swapId}`);
    if (res.ok) setNotes(await res.json());
  }, [swapId]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [swapRes, notesRes] = await Promise.all([
        fetch(`/api/swaps/${swapId}`),
        fetch(`/api/reading-notes?swapId=${swapId}`),
      ]);
      if (!swapRes.ok) {
        setError("교환 정보를 불러올 수 없습니다.");
        setLoading(false);
        return;
      }
      setSwap(await swapRes.json());
      if (notesRes.ok) setNotes(await notesRes.json());
      setLoading(false);
    }
    load();
  }, [swapId]);

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto px-8 py-20 text-center">
        <p className="text-neutral/40 text-sm font-body">불러오는 중...</p>
      </div>
    );
  }

  if (error || !swap) {
    return (
      <div className="w-full max-w-4xl mx-auto px-8 py-20 text-center">
        <p className="text-neutral/40 text-sm font-body">{error ?? "교환을 찾을 수 없습니다."}</p>
      </div>
    );
  }

  const tabs = [swap.offered_book, ...(swap.wanted_book ? [swap.wanted_book] : [])];
  const book = tabs[activeIndex];
  const bookNotes = notes.filter((n) => n.book_id === book.id);
  const coverColor = COVER_COLORS[activeIndex % COVER_COLORS.length];
  const isAccepted = swap.status === "accepted";

  return (
    <div className="w-full">
      <div className="border-b border-neutral/10">
        <div className="max-w-4xl mx-auto px-8 flex">
          {tabs.map((b, i) => (
            <button
              key={b.id}
              onClick={() => { setActiveIndex(i); setShowAddNote(false); }}
              className={`py-4 mr-8 text-[10px] tracking-[0.22em] uppercase transition-colors ${
                activeIndex === i
                  ? "text-neutral border-b-2 border-neutral -mb-px"
                  : "text-neutral/35 hover:text-neutral/55"
              }`}
            >
              {b.title.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-10 grid grid-cols-[5fr_7fr] gap-12">
        <div>
          <BookCover coverImage={book.cover_image} title={book.title} color={coverColor} />
          <h1 className="font-headline text-[1.75rem] text-neutral mt-5 leading-snug">{book.title}</h1>
          <p className="text-neutral/45 text-sm mt-1.5 font-body">{book.author}</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-7">
            <p className="text-[10px] tracking-[0.28em] uppercase text-neutral/45 font-body">Reading Note</p>
            {isAccepted && (
              <button
                onClick={() => setShowAddNote((v) => !v)}
                className="flex items-center gap-2 bg-primary text-secondary text-[10px] tracking-[0.18em] uppercase px-4 py-2.5 hover:bg-tertiary transition-colors"
              >
                <PencilIcon />
                {showAddNote ? "취소" : "등록하기"}
              </button>
            )}
          </div>

          {showAddNote && (
            <AddNoteForm
              swapId={swapId}
              bookId={book.id}
              onAdded={() => { fetchNotes(); setShowAddNote(false); }}
            />
          )}

          {bookNotes.length === 0 ? (
            <p className="text-[12px] text-neutral/35 font-body">아직 등록된 노트가 없습니다.</p>
          ) : (
            <div className="flex flex-col gap-9">
              {bookNotes.map((note) => (
                <NoteCard key={note.id} note={note} currentUserId={currentUserId} onRefresh={fetchNotes} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

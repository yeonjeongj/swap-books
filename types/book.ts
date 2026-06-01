export interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  publishedAt: string;
  coverImage: string;
  description: string;
}

export interface UserBook {
  id: string;
  userId: string;
  bookId: string;
  quote?: string;
  reason?: string;
  isRecommended: boolean;
  createdAt: string;
}

export interface ReadingNoteComment {
  id: string;
  noteId: string;
  authorNickname: string;
  authorAvatarUrl?: string;
  text: string;
  createdAt: string;
}

// API 응답 전용
export interface ReadingNoteCommentWithCount extends ReadingNoteComment {
  replyCount: number;
}

export interface ReadingNote {
  id: string;
  authorId: string;
  authorNickname: string;
  bookId: string;
  swapRequestId: string;
  page: number;
  quote: string;
  featuredComment?: ReadingNoteCommentWithCount;
  createdAt: string;
}

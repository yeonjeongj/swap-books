export interface User {
  id: string;
  email: string;
  nickname: string;
  avatarUrl?: string;
  createdAt: string;
}

// API 응답 전용
export interface UserProfile extends User {
  swapCount: number;
  readCount: number;
}

export interface CalendarEvent {
  id: string;
  date: string; // "YYYY-MM-DD"
  time: string;
  title: string;
}

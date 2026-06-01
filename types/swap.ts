export type SwapStatus = "pending" | "accepted" | "rejected" | "completed" | "expired";

export interface SwapRequest {
  id: string;
  requesterId: string;
  receiverId: string | null;
  offeredBookId: string;
  wantedBookId: string | null;
  isPublic: boolean;
  status: SwapStatus;
  expiresAt?: string;
  createdAt: string;
}

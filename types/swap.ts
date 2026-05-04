export type SwapStatus = 'pending' | 'accepted' | 'rejected' | 'completed';

export interface SwapRequest {
  id: string;
  requesterId: string;
  receiverId: string;
  offeredBookId: string;
  wantedBookId: string;
  status: SwapStatus;
  createdAt: string;
}

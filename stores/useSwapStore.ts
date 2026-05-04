import { create } from 'zustand';

interface Notification {
  id: string;
  message: string;
}

interface SwapStore {
  pendingSwaps: string[];
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  clearNotifications: () => void;
}

export const useSwapStore = create<SwapStore>((set) => ({
  pendingSwaps: [],
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({ notifications: [...state.notifications, notification] })),
  clearNotifications: () => set({ notifications: [] }),
}));

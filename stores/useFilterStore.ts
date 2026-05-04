import { create } from 'zustand';

interface FilterStore {
  query: string;
  genre: string;
  setQuery: (query: string) => void;
  setGenre: (genre: string) => void;
  reset: () => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  query: '',
  genre: '',
  setQuery: (query) => set({ query }),
  setGenre: (genre) => set({ genre }),
  reset: () => set({ query: '', genre: '' }),
}));

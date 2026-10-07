import { create } from 'zustand';

interface ConnectionState {
  isWakingUp: boolean;
  setWakingUp: (value: boolean) => void;
}

export const useConnection = create<ConnectionState>((set) => ({
  isWakingUp: false,
  setWakingUp: (value) => set({ isWakingUp: value }),
}));
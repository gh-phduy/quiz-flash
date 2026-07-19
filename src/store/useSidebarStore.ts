import { create } from 'zustand';

interface SidebarState {
  isExpanded: boolean;
  toggleExpanded: () => void;
  setExpanded: (expanded: boolean) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isExpanded: false,
  toggleExpanded: () => set((state) => ({ isExpanded: !state.isExpanded })),
  setExpanded: (expanded) => set({ isExpanded: expanded }),
}));

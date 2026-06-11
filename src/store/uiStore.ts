import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  rightPanelOpen: boolean;
  rightPanelTab: 'annotations' | 'properties' | 'recognition';
  theme: 'dark' | 'light';
  viewport: {
    startTime: number;
    endTime: number;
    minFreq: number;
    maxFreq: number;
  };
  zoom: {
    time: number;
    freq: number;
  };
  panOffset: {
    time: number;
    freq: number;
  };
  mousePosition: {
    time: number | null;
    freq: number | null;
  };

  setSidebarOpen: (open: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;
  setRightPanelTab: (tab: 'annotations' | 'properties' | 'recognition') => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  setViewport: (viewport: Partial<UIState['viewport']>) => void;
  setZoom: (zoom: Partial<UIState['zoom']>) => void;
  setPanOffset: (offset: Partial<UIState['panOffset']>) => void;
  setMousePosition: (position: Partial<UIState['mousePosition']>) => void;
  resetViewport: (duration: number, maxFreq: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  rightPanelOpen: true,
  rightPanelTab: 'annotations',
  theme: 'dark',
  viewport: {
    startTime: 0,
    endTime: 10,
    minFreq: 0,
    maxFreq: 12000,
  },
  zoom: {
    time: 1,
    freq: 1,
  },
  panOffset: {
    time: 0,
    freq: 0,
  },
  mousePosition: {
    time: null,
    freq: null,
  },

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
  setTheme: (theme) => set({ theme }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

  setViewport: (viewport) =>
    set((state) => ({
      viewport: { ...state.viewport, ...viewport },
    })),

  setZoom: (zoom) =>
    set((state) => ({
      zoom: { ...state.zoom, ...zoom },
    })),

  setPanOffset: (offset) =>
    set((state) => ({
      panOffset: { ...state.panOffset, ...offset },
    })),

  setMousePosition: (position) =>
    set((state) => ({
      mousePosition: { ...state.mousePosition, ...position },
    })),

  resetViewport: (duration, maxFreq) =>
    set({
      viewport: {
        startTime: 0,
        endTime: duration,
        minFreq: 0,
        maxFreq: maxFreq,
      },
      zoom: { time: 1, freq: 1 },
      panOffset: { time: 0, freq: 0 },
    }),
}));

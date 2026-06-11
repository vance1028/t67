import { create } from 'zustand';
import type { AudioRecording, SpectrogramConfig, SpectrogramData } from '../types/audio';
import { loadRecordings, saveRecordings } from '../utils/storage';

interface AudioStore {
  recordings: AudioRecording[];
  currentRecordingId: string | null;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  playbackRate: number;
  spectrogramConfig: SpectrogramConfig;
  spectrogramData: SpectrogramData | null;
  isProcessing: boolean;
  audioContext: AudioContext | null;

  setCurrentRecording: (id: string | null) => void;
  addRecording: (recording: AudioRecording) => void;
  removeRecording: (id: string) => void;
  updateRecording: (id: string, updates: Partial<AudioRecording>) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  setSpectrogramConfig: (config: Partial<SpectrogramConfig>) => void;
  setSpectrogramData: (data: SpectrogramData | null) => void;
  setIsProcessing: (processing: boolean) => void;
  setAudioContext: (ctx: AudioContext | null) => void;
  loadStoredRecordings: () => void;
  getCurrentRecording: () => AudioRecording | undefined;
}

export const useAudioStore = create<AudioStore>((set, get) => ({
  recordings: [],
  currentRecordingId: null,
  isPlaying: false,
  currentTime: 0,
  volume: 1,
  playbackRate: 1,
  spectrogramConfig: {
    fftSize: 2048,
    hopSize: 512,
    windowFunction: 'hann',
    minFreq: 0,
    maxFreq: 12000,
    dynamicRange: 80,
    colorMap: 'magma',
  },
  spectrogramData: null,
  isProcessing: false,
  audioContext: null,

  setCurrentRecording: (id) => set({ currentRecordingId: id, currentTime: 0, isPlaying: false }),

  addRecording: (recording) =>
    set((state) => {
      const newRecordings = [...state.recordings, recording];
      saveRecordings(newRecordings);
      return { recordings: newRecordings };
    }),

  removeRecording: (id) =>
    set((state) => {
      const newRecordings = state.recordings.filter((r) => r.id !== id);
      saveRecordings(newRecordings);
      return {
        recordings: newRecordings,
        currentRecordingId: state.currentRecordingId === id ? null : state.currentRecordingId,
      };
    }),

  updateRecording: (id, updates) =>
    set((state) => {
      const newRecordings = state.recordings.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      );
      saveRecordings(newRecordings);
      return { recordings: newRecordings };
    }),

  setIsPlaying: (playing) => set({ isPlaying: playing }),

  setCurrentTime: (time) => set({ currentTime: time }),

  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),

  setPlaybackRate: (rate) => set({ playbackRate: Math.max(0.5, Math.min(2, rate)) }),

  setSpectrogramConfig: (config) =>
    set((state) => ({
      spectrogramConfig: { ...state.spectrogramConfig, ...config },
    })),

  setSpectrogramData: (data) => set({ spectrogramData: data }),

  setIsProcessing: (processing) => set({ isProcessing: processing }),

  setAudioContext: (ctx) => set({ audioContext: ctx }),

  loadStoredRecordings: () => {
    const stored = loadRecordings();
    set({ recordings: stored as AudioRecording[] });
  },

  getCurrentRecording: () => {
    const { recordings, currentRecordingId } = get();
    return recordings.find((r) => r.id === currentRecordingId);
  },
}));

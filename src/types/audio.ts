export interface AudioRecording {
  id: string;
  name: string;
  duration: number;
  sampleRate: number;
  filePath?: string;
  location?: string;
  recordedAt?: string;
  createdAt: number;
  audioBuffer?: AudioBuffer;
}

export interface AudioState {
  recordings: AudioRecording[];
  currentRecordingId: string | null;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  playbackRate: number;
}

export interface SpectrogramConfig {
  fftSize: number;
  hopSize: number;
  windowFunction: 'hann' | 'hamming' | 'rectangular';
  minFreq: number;
  maxFreq: number;
  dynamicRange: number;
  colorMap: 'viridis' | 'magma' | 'plasma' | 'inferno';
}

export interface SpectrogramData {
  data: Float32Array[];
  times: number[];
  freqs: number[];
  minValue: number;
  maxValue: number;
}

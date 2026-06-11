export class FFT {
  private size: number;
  private cosTable: Float32Array;
  private sinTable: Float32Array;

  constructor(size: number) {
    this.size = size;
    this.cosTable = new Float32Array(size / 2);
    this.sinTable = new Float32Array(size / 2);

    for (let i = 0; i < size / 2; i++) {
      this.cosTable[i] = Math.cos((2 * Math.PI * i) / size);
      this.sinTable[i] = Math.sin((2 * Math.PI * i) / size);
    }
  }

  public forward(real: Float32Array, imag: Float32Array): void {
    const n = this.size;
    let j = 0;
    let n2 = n >> 1;

    for (let i = 1; i < n - 1; i++) {
      let bit = n >> 1;
      while (j >= bit) {
        j -= bit;
        bit >>= 1;
      }
      j += bit;

      if (i < j) {
        const temp = real[i];
        real[i] = real[j];
        real[j] = temp;
        const tempImag = imag[i];
        imag[i] = imag[j];
        imag[j] = tempImag;
      }
    }

    let kMax = 1;
    while (kMax < n) {
      const kStep = kMax << 1;
      for (let k = 0; k < kMax; k++) {
        const wReal = this.cosTable[(n * k) / kStep];
        const wImag = this.sinTable[(n * k) / kStep];
        for (let i = k; i < n; i += kStep) {
          const idx = i + kMax;
          const tempReal = wReal * real[idx] - wImag * imag[idx];
          const tempImag = wImag * real[idx] + wReal * imag[idx];
          real[idx] = real[i] - tempReal;
          imag[idx] = imag[i] - tempImag;
          real[i] += tempReal;
          imag[i] += tempImag;
        }
      }
      kMax = kStep;
    }
  }

  public magnitude(real: Float32Array, imag: Float32Array): Float32Array {
    const n = this.size;
    const mag = new Float32Array(n / 2 + 1);
    for (let i = 0; i <= n / 2; i++) {
      mag[i] = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
    }
    return mag;
  }

  public magnitudeDB(real: Float32Array, imag: Float32Array): Float32Array {
    const mag = this.magnitude(real, imag);
    const db = new Float32Array(mag.length);
    for (let i = 0; i < mag.length; i++) {
      db[i] = 20 * Math.log10(Math.max(mag[i], 1e-10));
    }
    return db;
  }
}

export function createWindow(
  size: number,
  type: 'hann' | 'hamming' | 'rectangular' = 'hann'
): Float32Array {
  const window = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    switch (type) {
      case 'hann':
        window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)));
        break;
      case 'hamming':
        window[i] = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (size - 1));
        break;
      case 'rectangular':
        window[i] = 1;
        break;
    }
  }
  return window;
}

export interface SpectrogramResult {
  data: Float32Array[];
  times: number[];
  freqs: number[];
  minValue: number;
  maxValue: number;
}

export function computeSpectrogram(
  audioBuffer: AudioBuffer,
  fftSize: number = 2048,
  hopSize: number = 512,
  windowType: 'hann' | 'hamming' | 'rectangular' = 'hann',
  minFreq: number = 0,
  maxFreq: number = 12000
): SpectrogramResult {
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const duration = audioBuffer.duration;

  const fft = new FFT(fftSize);
  const window = createWindow(fftSize, windowType);

  const numFrames = Math.floor((channelData.length - fftSize) / hopSize) + 1;
  const nyquist = sampleRate / 2;
  const freqBins = fftSize / 2 + 1;

  const minFreqBin = Math.floor((minFreq / nyquist) * freqBins);
  const maxFreqBin = Math.ceil((maxFreq / nyquist) * freqBins);
  const numFreqBins = maxFreqBin - minFreqBin + 1;

  const data: Float32Array[] = [];
  const times: number[] = [];
  const freqs: number[] = [];

  for (let i = 0; i < numFreqBins; i++) {
    const freq = ((minFreqBin + i) / freqBins) * nyquist;
    freqs.push(freq);
  }

  let minValue = Infinity;
  let maxValue = -Infinity;

  const real = new Float32Array(fftSize);
  const imag = new Float32Array(fftSize);

  for (let frame = 0; frame < numFrames; frame++) {
    const startSample = frame * hopSize;

    for (let i = 0; i < fftSize; i++) {
      const sampleIdx = startSample + i;
      real[i] = sampleIdx < channelData.length ? channelData[sampleIdx] * window[i] : 0;
      imag[i] = 0;
    }

    fft.forward(real, imag);
    const magDB = fft.magnitudeDB(real, imag);

    const frameData = new Float32Array(numFreqBins);
    for (let i = 0; i < numFreqBins; i++) {
      const value = magDB[minFreqBin + i];
      frameData[i] = value;
      if (value < minValue) minValue = value;
      if (value > maxValue) maxValue = value;
    }

    data.push(frameData);
    times.push((startSample + fftSize / 2) / sampleRate);
  }

  return {
    data,
    times,
    freqs,
    minValue,
    maxValue,
  };
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAudioStore } from '../store/audioStore';
import { useUIStore } from '../store/uiStore';
import { computeSpectrogram } from '../utils/fft';
import { getColor, type ColorMapName } from '../utils/colorMap';
import type { SpectrogramConfig } from '../types/audio';

export function useSpectrogram() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);

  const {
    currentRecordingId,
    recordings,
    spectrogramConfig,
    spectrogramData,
    setSpectrogramData,
    setIsProcessing,
  } = useAudioStore();

  const currentRecording = recordings.find((r) => r.id === currentRecordingId);

  const compute = useCallback(
    async (config?: Partial<SpectrogramConfig>) => {
      if (!currentRecording?.audioBuffer) return;

      setIsProcessing(true);
      setIsRendering(true);
      setRenderProgress(0);

      try {
        const fullConfig = { ...spectrogramConfig, ...config };

        await new Promise((resolve) => setTimeout(resolve, 50));

        const result = computeSpectrogram(
          currentRecording.audioBuffer,
          fullConfig.fftSize,
          fullConfig.hopSize,
          fullConfig.windowFunction,
          fullConfig.minFreq,
          fullConfig.maxFreq
        );

        setSpectrogramData(result);
        setRenderProgress(100);
      } catch (error) {
        console.error('Failed to compute spectrogram:', error);
      } finally {
        setIsRendering(false);
        setIsProcessing(false);
      }
    },
    [currentRecording, spectrogramConfig, setSpectrogramData, setIsProcessing]
  );

  const timeToPixel = useCallback(
    (time: number, canvasWidth: number): number => {
      if (!spectrogramData || !currentRecording) return 0;
      const { startTime, endTime } = useUIStore.getState().viewport;
      const viewDuration = endTime - startTime;
      return ((time - startTime) / viewDuration) * canvasWidth;
    },
    [spectrogramData, currentRecording]
  );

  const pixelToTime = useCallback(
    (pixelX: number, canvasWidth: number): number => {
      if (!spectrogramData || !currentRecording) return 0;
      const { startTime, endTime } = useUIStore.getState().viewport;
      const viewDuration = endTime - startTime;
      return startTime + (pixelX / canvasWidth) * viewDuration;
    },
    [spectrogramData, currentRecording]
  );

  const freqToPixel = useCallback(
    (freq: number, canvasHeight: number): number => {
      if (!spectrogramData) return 0;
      const { minFreq, maxFreq } = useUIStore.getState().viewport;
      const viewRange = maxFreq - minFreq;
      return canvasHeight - ((freq - minFreq) / viewRange) * canvasHeight;
    },
    [spectrogramData]
  );

  const pixelToFreq = useCallback(
    (pixelY: number, canvasHeight: number): number => {
      if (!spectrogramData) return 0;
      const { minFreq, maxFreq } = useUIStore.getState().viewport;
      const viewRange = maxFreq - minFreq;
      return maxFreq - (pixelY / canvasHeight) * viewRange;
    },
    [spectrogramData]
  );

  const render = useCallback(
    (canvas: HTMLCanvasElement) => {
      if (!spectrogramData) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { data, freqs, minValue, maxValue } = spectrogramData;
      const { colorMap, dynamicRange } = spectrogramConfig;
      const { startTime, endTime, minFreq, maxFreq } = useUIStore.getState().viewport;

      const width = canvas.width;
      const height = canvas.height;

      const imageData = ctx.createImageData(width, height);
      const pixels = imageData.data;

      const viewStartIdx = Math.floor((startTime / currentRecording!.duration) * data.length);
      const viewEndIdx = Math.ceil((endTime / currentRecording!.duration) * data.length);
      const viewData = data.slice(viewStartIdx, viewEndIdx);

      const freqStartIdx = freqs.findIndex((f) => f >= minFreq);
      const freqEndIdx = freqs.findIndex((f) => f > maxFreq);
      const viewFreqs = freqs.slice(freqStartIdx, freqEndIdx);

      for (let x = 0; x < width; x++) {
        const dataIdx = Math.floor((x / width) * viewData.length);
        const frame = viewData[dataIdx];
        if (!frame) continue;

        for (let y = 0; y < height; y++) {
          const freqIdx = Math.floor(((height - 1 - y) / height) * viewFreqs.length);
          const value = frame[freqStartIdx + freqIdx];

          const rgb = getColor(
            value,
            minValue,
            maxValue,
            colorMap as ColorMapName,
            dynamicRange
          );

          const pixelIdx = (y * width + x) * 4;
          pixels[pixelIdx] = rgb.r;
          pixels[pixelIdx + 1] = rgb.g;
          pixels[pixelIdx + 2] = rgb.b;
          pixels[pixelIdx + 3] = 255;
        }
      }

      ctx.putImageData(imageData, 0, 0);
    },
    [spectrogramData, spectrogramConfig, currentRecording]
  );

  useEffect(() => {
    if (currentRecording?.audioBuffer && !spectrogramData) {
      compute();
    }
  }, [currentRecording, spectrogramData, compute]);

  return {
    canvasRef,
    isRendering,
    renderProgress,
    compute,
    render,
    timeToPixel,
    pixelToTime,
    freqToPixel,
    pixelToFreq,
    spectrogramData,
  };
}

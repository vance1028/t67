import { useRef, useEffect, useCallback, useState } from 'react';
import { useAudioStore } from '../../store/audioStore';
import { useAnnotationStore } from '../../store/annotationStore';
import { useUIStore } from '../../store/uiStore';
import { useSpectrogram } from '../../hooks/useSpectrogram';
import { getColorCSS } from '../../utils/colorMap';
import type { Selection } from '../../types/annotation';

interface SpectrogramCanvasProps {
  width: number;
  height: number;
}

export function SpectrogramCanvas({ width, height }: SpectrogramCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number; time: number; freq: number } | null>(null);

  const {
    currentRecordingId,
    recordings,
    spectrogramData,
    spectrogramConfig,
    currentTime,
    isProcessing,
  } = useAudioStore();

  const {
    annotations,
    selectedAnnotationId,
    currentSelection,
    recognitionCandidates,
    setCurrentSelection,
    setIsDrawingSelection,
    setSelectedAnnotation,
    addAnnotation,
  } = useAnnotationStore();

  const {
    viewport,
    setViewport,
    setZoom,
    setMousePosition,
    mousePosition,
  } = useUIStore();

  const { pixelToTime, pixelToFreq, timeToPixel, freqToPixel, compute, render } = useSpectrogram();

  const currentRecording = recordings.find((r) => r.id === currentRecordingId);
  const recordingAnnotations = annotations.filter((a) => a.recordingId === currentRecordingId);

  useEffect(() => {
    if (!canvasRef.current || !spectrogramData) return;
    render(canvasRef.current);
  }, [spectrogramData, viewport, render]);

  useEffect(() => {
    if (!overlayRef.current || !currentRecording) return;
    renderOverlay(overlayRef.current);
  }, [
    currentRecording,
    recordingAnnotations,
    recognitionCandidates,
    currentSelection,
    selectedAnnotationId,
    currentTime,
    viewport,
    mousePosition,
  ]);

  useEffect(() => {
    if (currentRecording && !spectrogramData && currentRecording.audioBuffer) {
      compute();
    }
  }, [currentRecording, spectrogramData, compute]);

  const renderOverlay = useCallback(
    (canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext('2d');
      if (!ctx || !currentRecording) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      recognitionCandidates.forEach((candidate) => {
        const x = timeToPixel(candidate.startTime, canvas.width);
        const y = freqToPixel(candidate.maxFreq, canvas.height);
        const w = timeToPixel(candidate.endTime, canvas.width) - x;
        const h = freqToPixel(candidate.minFreq, canvas.height) - y;

        ctx.strokeStyle = 'rgba(214, 140, 69, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(x, y, Math.max(1, w), Math.max(1, h));
        ctx.setLineDash([]);

        ctx.fillStyle = 'rgba(214, 140, 69, 0.1)';
        ctx.fillRect(x, y, Math.max(1, w), Math.max(1, h));
      });

      recordingAnnotations.forEach((annotation) => {
        const x = timeToPixel(annotation.startTime, canvas.width);
        const y = freqToPixel(annotation.maxFreq, canvas.height);
        const w = timeToPixel(annotation.endTime, canvas.width) - x;
        const h = freqToPixel(annotation.minFreq, canvas.height) - y;

        const isSelected = annotation.id === selectedAnnotationId;
        const color = annotation.isConfirmed ? '#5da37f' : annotation.isAutoDetected ? '#e69039' : '#8692ab';

        ctx.fillStyle = isSelected ? `${color}33` : `${color}1a`;
        ctx.fillRect(x, y, Math.max(1, w), Math.max(1, h));

        ctx.strokeStyle = isSelected ? color : `${color}99`;
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(x, y, Math.max(1, w), Math.max(1, h));

        if (w > 80 && h > 20) {
          ctx.fillStyle = color;
          ctx.font = '11px Inter, sans-serif';
          ctx.fillText(annotation.species, x + 4, y + 14);
        }
      });

      if (currentSelection) {
        const x = timeToPixel(currentSelection.startTime, canvas.width);
        const y = freqToPixel(currentSelection.maxFreq, canvas.height);
        const w = timeToPixel(currentSelection.endTime, canvas.width) - x;
        const h = freqToPixel(currentSelection.minFreq, canvas.height) - y;

        ctx.strokeStyle = '#D68C45';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.strokeRect(x, y, Math.max(1, w), Math.max(1, h));
        ctx.setLineDash([]);

        ctx.fillStyle = 'rgba(214, 140, 69, 0.15)';
        ctx.fillRect(x, y, Math.max(1, w), Math.max(1, h));
      }

      const playheadX = timeToPixel(currentTime, canvas.width);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, canvas.height);
      ctx.stroke();

      if (mousePosition.time !== null && mousePosition.freq !== null) {
        const crossX = timeToPixel(mousePosition.time, canvas.width);
        const crossY = freqToPixel(mousePosition.freq, canvas.height);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);

        ctx.beginPath();
        ctx.moveTo(crossX, 0);
        ctx.lineTo(crossX, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, crossY);
        ctx.lineTo(canvas.width, crossY);
        ctx.stroke();

        ctx.setLineDash([]);
      }
    },
    [
      currentRecording,
      recordingAnnotations,
      recognitionCandidates,
      currentSelection,
      selectedAnnotationId,
      currentTime,
      timeToPixel,
      freqToPixel,
      mousePosition,
    ]
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!overlayRef.current || !currentRecording) return;

    const rect = overlayRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (e.button === 1 || e.altKey) {
      setIsPanning(true);
      setPanStart({ x, y, time: viewport.startTime, freq: viewport.minFreq });
      return;
    }

    const time = pixelToTime(x, width);
    const freq = pixelToFreq(y, height);

    const clickedAnnotation = recordingAnnotations.find((ann) => {
      const annX = timeToPixel(ann.startTime, width);
      const annW = timeToPixel(ann.endTime, width) - annX;
      const annY = freqToPixel(ann.maxFreq, height);
      const annH = freqToPixel(ann.minFreq, height) - annY;
      return x >= annX && x <= annX + annW && y >= annY && y <= annY + annH;
    });

    if (clickedAnnotation && !e.shiftKey) {
      setSelectedAnnotation(clickedAnnotation.id);
      return;
    }

    setIsDragging(true);
    setDragStart({ x, y });
    setIsDrawingSelection(true);
    setCurrentSelection({
      startTime: time,
      endTime: time,
      minFreq: freq,
      maxFreq: freq,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!overlayRef.current || !currentRecording) return;

    const rect = overlayRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const time = pixelToTime(x, width);
    const freq = pixelToFreq(y, height);
    setMousePosition({ time, freq });

    if (isPanning && panStart) {
      const dx = (x - panStart.x) / width;
      const dy = (y - panStart.y) / height;
      const viewDuration = viewport.endTime - viewport.startTime;
      const viewFreqRange = viewport.maxFreq - viewport.minFreq;

      const newStartTime = Math.max(0, panStart.time - dx * viewDuration);
      const newEndTime = Math.min(currentRecording.duration, newStartTime + viewDuration);
      const newMinFreq = Math.max(0, panStart.freq - dy * viewFreqRange);
      const newMaxFreq = Math.min(spectrogramConfig.maxFreq, newMinFreq + viewFreqRange);

      setViewport({
        startTime: newStartTime,
        endTime: newEndTime,
        minFreq: newMinFreq,
        maxFreq: newMaxFreq,
      });
      return;
    }

    if (isDragging && dragStart) {
      const startTime = Math.min(pixelToTime(dragStart.x, width), time);
      const endTime = Math.max(pixelToTime(dragStart.x, width), time);
      const minFreq = Math.min(pixelToFreq(dragStart.y, height), freq);
      const maxFreq = Math.max(pixelToFreq(dragStart.y, height), freq);

      setCurrentSelection({ startTime, endTime, minFreq, maxFreq });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
    setIsPanning(false);
    setPanStart(null);
    setIsDrawingSelection(false);
  };

  const handleMouseLeave = () => {
    setMousePosition({ time: null, freq: null });
    if (isDragging) {
      setIsDragging(false);
      setDragStart(null);
      setIsDrawingSelection(false);
    }
    setIsPanning(false);
    setPanStart(null);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!currentRecording) return;

    const zoomFactor = e.deltaY > 0 ? 0.8 : 1.25;
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const mouseTime = pixelToTime(x, width);
    const mouseFreq = pixelToFreq(y, height);

    const viewDuration = viewport.endTime - viewport.startTime;
    const viewFreqRange = viewport.maxFreq - viewport.minFreq;

    const newDuration = viewDuration / zoomFactor;
    const newFreqRange = viewFreqRange / zoomFactor;

    const timeRatio = (mouseTime - viewport.startTime) / viewDuration;
    const freqRatio = (mouseFreq - viewport.minFreq) / viewFreqRange;

    let newStartTime = mouseTime - newDuration * timeRatio;
    let newEndTime = newStartTime + newDuration;
    let newMinFreq = mouseFreq - newFreqRange * freqRatio;
    let newMaxFreq = newMinFreq + newFreqRange;

    if (newStartTime < 0) {
      newStartTime = 0;
      newEndTime = Math.min(newDuration, currentRecording.duration);
    }
    if (newEndTime > currentRecording.duration) {
      newEndTime = currentRecording.duration;
      newStartTime = Math.max(0, newEndTime - newDuration);
    }
    if (newMinFreq < 0) {
      newMinFreq = 0;
      newMaxFreq = Math.min(newFreqRange, spectrogramConfig.maxFreq);
    }
    if (newMaxFreq > spectrogramConfig.maxFreq) {
      newMaxFreq = spectrogramConfig.maxFreq;
      newMinFreq = Math.max(0, newMaxFreq - newFreqRange);
    }

    setViewport({
      startTime: newStartTime,
      endTime: newEndTime,
      minFreq: newMinFreq,
      maxFreq: newMaxFreq,
    });

    setZoom({
      time: currentRecording.duration / (newEndTime - newStartTime),
      freq: spectrogramConfig.maxFreq / (newMaxFreq - newMinFreq),
    });
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!currentRecording) return;
    useUIStore.getState().resetViewport(currentRecording.duration, spectrogramConfig.maxFreq);
  };

  if (!currentRecording) {
    return (
      <div className="flex items-center justify-center h-full bg-dark-800 rounded-lg">
        <div className="text-center">
          <div className="text-6xl mb-4">🎵</div>
          <p className="text-dark-400 text-lg">点击上方"加载录音"按钮开始</p>
          <p className="text-dark-500 text-sm mt-2">支持 WAV、MP3、OGG 等常见音频格式</p>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="flex items-center justify-center h-full bg-dark-800 rounded-lg">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-forest-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-dark-300">正在计算声谱图...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-dark-900 rounded-lg overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute inset-0"
      />

      <canvas
        ref={overlayRef}
        width={width}
        height={height}
        className="absolute inset-0 cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
      />

      <div className="absolute top-2 left-2 text-xs text-dark-400 bg-dark-900/80 px-2 py-1 rounded">
        {viewport.minFreq.toFixed(0)} - {viewport.maxFreq.toFixed(0)} Hz
      </div>

      <div className="absolute top-2 right-2 text-xs text-dark-400 bg-dark-900/80 px-2 py-1 rounded">
        {viewport.startTime.toFixed(1)} - {viewport.endTime.toFixed(1)} s
      </div>

      {mousePosition.time !== null && mousePosition.freq !== null && (
        <div className="absolute bottom-2 left-2 text-xs text-dark-300 bg-dark-900/80 px-2 py-1 rounded">
          {mousePosition.time.toFixed(2)}s | {mousePosition.freq.toFixed(0)}Hz
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAudioStore } from '../store/audioStore';

export function useAudioContext() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    currentRecordingId,
    recordings,
    isPlaying,
    currentTime,
    volume,
    playbackRate,
    setIsPlaying,
    setCurrentTime,
    setAudioContext,
  } = useAudioStore();

  const currentRecording = recordings.find((r) => r.id === currentRecordingId);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
      setAudioContext(audioContextRef.current);
      setIsInitialized(true);
    }
    return audioContextRef.current;
  }, [setAudioContext]);

  const play = useCallback(() => {
    if (!currentRecording?.audioBuffer || !audioContextRef.current) {
      initAudioContext();
      if (!currentRecording?.audioBuffer) return;
    }

    const ctx = audioContextRef.current;
    if (!ctx || !currentRecording.audioBuffer || !gainNodeRef.current) return;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
    }

    const source = ctx.createBufferSource();
    source.buffer = currentRecording.audioBuffer;
    source.playbackRate.value = playbackRate;
    source.connect(gainNodeRef.current);

    gainNodeRef.current.gain.value = volume;

    const startOffset = Math.min(currentTime, currentRecording.audioBuffer.duration);
    source.start(0, startOffset);

    source.onended = () => {
      if (sourceNodeRef.current === source) {
        setIsPlaying(false);
        setCurrentTime(0);
      }
    };

    sourceNodeRef.current = source;
    setIsPlaying(true);

    const startTime = ctx.currentTime;
    const updateTime = () => {
      if (sourceNodeRef.current === source && isPlaying) {
        const elapsed = ctx.currentTime - startTime;
        const newTime = Math.min(startOffset + elapsed, currentRecording!.audioBuffer!.duration);
        setCurrentTime(newTime);
        requestAnimationFrame(updateTime);
      }
    };
    requestAnimationFrame(updateTime);
  }, [
    currentRecording,
    currentTime,
    volume,
    playbackRate,
    isPlaying,
    initAudioContext,
    setIsPlaying,
    setCurrentTime,
  ]);

  const pause = useCallback(() => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  }, [setIsPlaying]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const seek = useCallback(
    (time: number) => {
      if (!currentRecording?.audioBuffer) return;
      const clampedTime = Math.max(0, Math.min(time, currentRecording.audioBuffer.duration));
      setCurrentTime(clampedTime);
      if (isPlaying) {
        pause();
        setTimeout(() => play(), 10);
      }
    },
    [currentRecording, isPlaying, pause, play, setCurrentTime]
  );

  const stop = useCallback(() => {
    pause();
    setCurrentTime(0);
  }, [pause, setCurrentTime]);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (sourceNodeRef.current && isPlaying) {
      sourceNodeRef.current.playbackRate.value = playbackRate;
    }
  }, [playbackRate, isPlaying]);

  useEffect(() => {
    return () => {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    isInitialized,
    initAudioContext,
    play,
    pause,
    togglePlay,
    seek,
    stop,
    audioContext: audioContextRef.current,
  };
}

import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useAudioStore } from '../../store/audioStore';
import { useUIStore } from '../../store/uiStore';
import { useAudioContext } from '../../hooks/useAudioContext';
import type { ColorMapName } from '../../utils/colorMap';

export function SpectrogramControls() {
  const {
    currentRecordingId,
    recordings,
    isPlaying,
    currentTime,
    volume,
    playbackRate,
    spectrogramConfig,
    setVolume,
    setPlaybackRate,
    setSpectrogramConfig,
  } = useAudioStore();

  const { viewport, zoom, setZoom, resetViewport } = useUIStore();
  const { togglePlay, seek, stop, initAudioContext } = useAudioContext();

  const currentRecording = recordings.find((r) => r.id === currentRecordingId);

  const handlePlayPause = () => {
    initAudioContext();
    togglePlay();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    seek(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  const handleZoomIn = () => {
    if (!currentRecording) return;
    const newZoom = Math.min(zoom.time * 1.5, 20);
    applyTimeZoom(newZoom);
  };

  const handleZoomOut = () => {
    if (!currentRecording) return;
    const newZoom = Math.max(zoom.time / 1.5, 1);
    applyTimeZoom(newZoom);
  };

  const applyTimeZoom = (newZoom: number) => {
    if (!currentRecording) return;
    const newDuration = currentRecording.duration / newZoom;
    const centerTime = (viewport.startTime + viewport.endTime) / 2;
    let newStartTime = centerTime - newDuration / 2;
    let newEndTime = newStartTime + newDuration;

    if (newStartTime < 0) {
      newStartTime = 0;
      newEndTime = newDuration;
    }
    if (newEndTime > currentRecording.duration) {
      newEndTime = currentRecording.duration;
      newStartTime = newEndTime - newDuration;
    }

    useUIStore.getState().setViewport({
      startTime: newStartTime,
      endTime: newEndTime,
    });
    setZoom({ time: newZoom });
  };

  const handleResetView = () => {
    if (currentRecording) {
      resetViewport(currentRecording.duration, spectrogramConfig.maxFreq);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const colorMaps: { value: ColorMapName; label: string }[] = [
    { value: 'magma', label: 'Magma' },
    { value: 'viridis', label: 'Viridis' },
    { value: 'plasma', label: 'Plasma' },
    { value: 'inferno', label: 'Inferno' },
  ];

  if (!currentRecording) {
    return null;
  }

  return (
    <div className="bg-dark-800 border-t border-dark-700 p-4 space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={stop}
            className="p-2 rounded-lg text-dark-300 hover:bg-dark-700 hover:text-white transition-all"
            title="停止"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            onClick={handlePlayPause}
            className="p-3 bg-forest-600 hover:bg-forest-500 text-white rounded-full transition-all hover:scale-105 active:scale-95"
            title={isPlaying ? '暂停' : '播放'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          <button
            onClick={() => seek(currentRecording.duration)}
            className="p-2 rounded-lg text-dark-300 hover:bg-dark-700 hover:text-white transition-all"
            title="跳到末尾"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex items-center gap-3">
          <span className="text-xs text-dark-400 w-20 text-right">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min="0"
            max={currentRecording.duration}
            step="0.01"
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-forest-500"
          />
          <span className="text-xs text-dark-400 w-20">
            {formatTime(currentRecording.duration)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setVolume(volume === 0 ? 1 : 0)}
            className="p-2 rounded-lg text-dark-300 hover:bg-dark-700 hover:text-white transition-all"
          >
            {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-20 h-1.5 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-forest-500"
          />
        </div>

        <div className="flex items-center gap-1 px-3 py-1 bg-dark-700 rounded-lg">
          <span className="text-xs text-dark-400 mr-2">速度</span>
          {[0.5, 1, 1.5, 2].map((rate) => (
            <button
              key={rate}
              onClick={() => setPlaybackRate(rate)}
              className={`px-2 py-1 text-xs rounded transition-all ${
                playbackRate === rate
                  ? 'bg-forest-600 text-white'
                  : 'text-dark-300 hover:text-white'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-lg text-dark-300 hover:bg-dark-700 hover:text-white transition-all"
            title="缩小"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-dark-400 w-16 text-center">
            {zoom.time.toFixed(1)}x
          </span>
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-lg text-dark-300 hover:bg-dark-700 hover:text-white transition-all"
            title="放大"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            className="p-2 rounded-lg text-dark-300 hover:bg-dark-700 hover:text-white transition-all ml-2"
            title="重置视图"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="h-6 w-px bg-dark-700" />

        <div className="flex items-center gap-2">
          <span className="text-xs text-dark-400">配色</span>
          <select
            value={spectrogramConfig.colorMap}
            onChange={(e) => setSpectrogramConfig({ colorMap: e.target.value as ColorMapName })}
            className="bg-dark-700 text-dark-200 text-xs rounded px-2 py-1 border-none focus:ring-1 focus:ring-forest-500"
          >
            {colorMaps.map((cm) => (
              <option key={cm.value} value={cm.value}>
                {cm.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-dark-400">动态范围</span>
          <input
            type="range"
            min="40"
            max="120"
            step="5"
            value={spectrogramConfig.dynamicRange}
            onChange={(e) => setSpectrogramConfig({ dynamicRange: parseInt(e.target.value) })}
            className="w-24 h-1.5 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-forest-500"
          />
          <span className="text-xs text-dark-400 w-10">
            {spectrogramConfig.dynamicRange}dB
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-dark-400">FFT</span>
          <select
            value={spectrogramConfig.fftSize}
            onChange={(e) => setSpectrogramConfig({ fftSize: parseInt(e.target.value) })}
            className="bg-dark-700 text-dark-200 text-xs rounded px-2 py-1 border-none focus:ring-1 focus:ring-forest-500"
          >
            {[512, 1024, 2048, 4096, 8192].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-dark-400">窗函数</span>
          <select
            value={spectrogramConfig.windowFunction}
            onChange={(e) =>
              setSpectrogramConfig({
                windowFunction: e.target.value as 'hann' | 'hamming' | 'rectangular',
              })
            }
            className="bg-dark-700 text-dark-200 text-xs rounded px-2 py-1 border-none focus:ring-1 focus:ring-forest-500"
          >
            <option value="hann">Hann</option>
            <option value="hamming">Hamming</option>
            <option value="rectangular">Rectangular</option>
          </select>
        </div>
      </div>
    </div>
  );
}

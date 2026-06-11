import { useState, useEffect, useRef, useMemo } from 'react';
import { useAudioStore } from '../store/audioStore';
import { useAnnotationStore } from '../store/annotationStore';
import { useUIStore } from '../store/uiStore';
import { SpectrogramCanvas } from '../components/spectrogram/SpectrogramCanvas';
import { SpectrogramControls } from '../components/spectrogram/SpectrogramControls';
import { AnnotationList } from '../components/annotation/AnnotationList';
import { AnnotationPanel } from '../components/annotation/AnnotationPanel';
import { AutoRecognition } from '../components/annotation/AutoRecognition';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import type { AudioRecording } from '../types/audio';

const generateId = () => `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export default function Workbench() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 400 });

  const currentRecordingId = useAudioStore((s) => s.currentRecordingId);
  const recordings = useAudioStore((s) => s.recordings);
  const addRecording = useAudioStore((s) => s.addRecording);
  const setCurrentRecording = useAudioStore((s) => s.setCurrentRecording);
  const setSpectrogramData = useAudioStore((s) => s.setSpectrogramData);
  const audioContext = useAudioStore((s) => s.audioContext);

  const rightPanelOpen = useUIStore((s) => s.rightPanelOpen);
  const rightPanelTab = useUIStore((s) => s.rightPanelTab);
  const setRightPanelTab = useUIStore((s) => s.setRightPanelTab);

  const currentRecording = recordings.find((r) => r.id === currentRecordingId);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({
          width: Math.floor(rect.width),
          height: Math.floor(rect.height - 150),
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!audioContext) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const recording: AudioRecording = {
        id: generateId(),
        name: file.name,
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        filePath: file.name,
        recordedAt: new Date().toISOString(),
        createdAt: Date.now(),
        audioBuffer,
      };

      addRecording(recording);
      setCurrentRecording(recording.id);
      setSpectrogramData(null);

      useUIStore.getState().resetViewport(audioBuffer.duration, 12000);
    } catch (error) {
      console.error('Failed to load audio file:', error);
      alert('音频文件加载失败，请检查文件格式');
    }
  };

  const tabs = [
    { key: 'annotations', label: '标注列表' },
    { key: 'properties', label: '标注属性' },
    { key: 'recognition', label: '自动识别' },
  ] as const;

  const renderRightPanelContent = () => {
    switch (rightPanelTab) {
      case 'annotations':
        return <AnnotationList />;
      case 'properties':
        return <AnnotationPanel />;
      case 'recognition':
        return <AutoRecognition />;
      default:
        return <AnnotationList />;
    }
  };

  return (
    <div className="h-screen flex bg-dark-900 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onFileUpload={handleFileUpload} />

        <div className="flex-1 flex overflow-hidden">
          <div
            ref={containerRef}
            className="flex-1 flex flex-col min-w-0 p-4"
          >
            <div className="flex-1 min-h-0 mb-4">
              <SpectrogramCanvas
                width={canvasSize.width}
                height={canvasSize.height}
              />
            </div>
            <SpectrogramControls />
          </div>

          <div
            className={`flex flex-col bg-dark-850 border-l border-dark-700 transition-all duration-300 ${
              rightPanelOpen ? 'w-80' : 'w-0 overflow-hidden'
            }`}
          >
            <div className="flex border-b border-dark-700">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setRightPanelTab(tab.key)}
                  className={`flex-1 py-3 text-xs font-medium transition-all ${
                    rightPanelTab === tab.key
                      ? 'text-forest-400 border-b-2 border-forest-500 bg-dark-800/50'
                      : 'text-dark-400 hover:text-white hover:bg-dark-800/30'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-hidden">{renderRightPanelContent()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Menu, PanelLeft, PanelRight, Upload, Moon, Sun } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useAudioStore } from '../../store/audioStore';
import { useAudioContext } from '../../hooks/useAudioContext';

interface HeaderProps {
  onFileUpload: (file: File) => void;
}

export function Header({ onFileUpload }: HeaderProps) {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const rightPanelOpen = useUIStore((s) => s.rightPanelOpen);
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const setRightPanelOpen = useUIStore((s) => s.setRightPanelOpen);

  const recordings = useAudioStore((s) => s.recordings);
  const currentRecordingId = useAudioStore((s) => s.currentRecordingId);
  const currentRecording = recordings.find((r) => r.id === currentRecordingId);
  const { initAudioContext } = useAudioContext();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      initAudioContext();
      onFileUpload(file);
    }
  };

  return (
    <header className="h-14 bg-dark-900/95 backdrop-blur border-b border-dark-700 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg text-dark-300 hover:bg-dark-800 hover:text-white transition-all"
          title="切换侧边栏"
        >
          <PanelLeft className={`w-5 h-5 transition-transform ${sidebarOpen ? '' : 'rotate-180'}`} />
        </button>

        <div className="h-6 w-px bg-dark-700 mx-2" />

        {currentRecording && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-dark-300 truncate max-w-[200px]">
              {currentRecording.name}
            </span>
            <span className="text-xs text-dark-500">
              {formatDuration(currentRecording.duration)}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 px-4 py-2 bg-forest-600 hover:bg-forest-500 text-white rounded-lg cursor-pointer transition-all hover:scale-105 active:scale-95">
          <Upload className="w-4 h-4" />
          <span className="text-sm font-medium">加载录音</span>
          <input
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>

        <div className="h-6 w-px bg-dark-700 mx-2" />

        <button
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          className="p-2 rounded-lg text-dark-300 hover:bg-dark-800 hover:text-white transition-all"
          title="切换右侧面板"
        >
          <PanelRight className={`w-5 h-5 transition-transform ${rightPanelOpen ? '' : 'rotate-180'}`} />
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-dark-300 hover:bg-dark-800 hover:text-white transition-all"
          title="切换主题"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

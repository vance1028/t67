import { useState } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { useAudioStore } from '../store/audioStore';
import { useAnnotationStore } from '../store/annotationStore';
import { exportAnnotations, downloadFile, importFromJSON, getStorageSize } from '../utils/storage';
import {
  Music,
  Trash2,
  Download,
  Upload,
  Calendar,
  MapPin,
  Clock,
  FileJson,
  Database,
  AlertTriangle,
} from 'lucide-react';
import type { Annotation, AudioRecording } from '../types/index';

export default function DataManagement() {
  const { recordings, removeRecording, updateRecording } = useAudioStore();
  const { annotations, deleteAnnotation } = useAnnotationStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ location: '', recordedAt: '' });
  const [importError, setImportError] = useState('');

  const storageSize = getStorageSize();
  const storageSizeMB = (storageSize / 1024 / 1024).toFixed(2);

  const handleExportAnnotations = (format: 'json' | 'csv') => {
    const content = exportAnnotations(annotations, format);
    const filename = `birdscope-annotations-${new Date().toISOString().split('T')[0]}.${format}`;
    const mimeType = format === 'json' ? 'application/json' : 'text/csv';
    downloadFile(content, filename, mimeType);
  };

  const handleExportRecordings = () => {
    const data = recordings.map(({ audioBuffer, ...rest }) => rest);
    const content = JSON.stringify(data, null, 2);
    const filename = `birdscope-recordings-${new Date().toISOString().split('T')[0]}.json`;
    downloadFile(content, filename, 'application/json');
  };

  const handleImportAnnotations = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = importFromJSON<Annotation[]>(event.target?.result as string);
        if (!data || !Array.isArray(data)) {
          throw new Error('无效的标注数据格式');
        }

        const { addAnnotation } = useAnnotationStore.getState();
        data.forEach((ann) => {
          if (ann.species && ann.recordingId) {
            addAnnotation({
              recordingId: ann.recordingId,
              startTime: ann.startTime,
              endTime: ann.endTime,
              minFreq: ann.minFreq,
              maxFreq: ann.maxFreq,
              species: ann.species,
              callType: ann.callType,
              confidence: ann.confidence || 0.8,
              notes: ann.notes,
              isAutoDetected: ann.isAutoDetected || false,
              isConfirmed: ann.isConfirmed || true,
            });
          }
        });

        setImportError('');
        alert(`成功导入 ${data.length} 条标注`);
      } catch (error) {
        setImportError('导入失败：文件格式错误');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDeleteRecording = (id: string) => {
    if (!confirm('确定要删除这个录音吗？相关标注也会被删除。')) return;

    const annotationsToDelete = annotations.filter((a) => a.recordingId === id);
    annotationsToDelete.forEach((a) => deleteAnnotation(a.id));
    removeRecording(id);
  };

  const handleStartEdit = (recording: AudioRecording) => {
    setEditingId(recording.id);
    setEditForm({
      location: recording.location || '',
      recordedAt: recording.recordedAt?.split('T')[0] || '',
    });
  };

  const handleSaveEdit = (id: string) => {
    updateRecording(id, {
      location: editForm.location || undefined,
      recordedAt: editForm.recordedAt ? `${editForm.recordedAt}T00:00:00` : undefined,
    });
    setEditingId(null);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (isoString?: string): string => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString('zh-CN');
  };

  return (
    <div className="h-screen flex bg-dark-900 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-14 bg-dark-900/95 backdrop-blur border-b border-dark-700 flex items-center justify-between px-6">
          <div>
            <h1 className="text-lg font-display font-semibold text-white">数据管理</h1>
            <p className="text-xs text-dark-400">录音文件与标注数据管理</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-dark-400">
            <Database className="w-4 h-4" />
            <span>本地存储: {storageSizeMB} MB</span>
          </div>
        </header>

        <div className="flex-1 p-6 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-dark-800/50 rounded-xl p-5 border border-dark-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">导出标注</h3>
                <FileJson className="w-5 h-5 text-forest-400" />
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => handleExportAnnotations('json')}
                  disabled={annotations.length === 0}
                  className="w-full px-4 py-2 bg-forest-600 hover:bg-forest-500 disabled:bg-dark-700 disabled:text-dark-500 text-white rounded-lg transition-all text-sm flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> 导出 JSON
                </button>
                <button
                  onClick={() => handleExportAnnotations('csv')}
                  disabled={annotations.length === 0}
                  className="w-full px-4 py-2 bg-dark-700 hover:bg-dark-600 disabled:text-dark-500 text-dark-200 rounded-lg transition-all text-sm flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> 导出 CSV
                </button>
              </div>
            </div>

            <div className="bg-dark-800/50 rounded-xl p-5 border border-dark-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">导入标注</h3>
                <Upload className="w-5 h-5 text-accent-400" />
              </div>
              <div className="space-y-2">
                <label className="w-full px-4 py-2 bg-accent-600 hover:bg-accent-500 text-white rounded-lg transition-all text-sm flex items-center justify-center gap-2 cursor-pointer">
                  <Upload className="w-4 h-4" /> 导入 JSON
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportAnnotations}
                  />
                </label>
                {importError && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {importError}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-dark-800/50 rounded-xl p-5 border border-dark-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">导出录音元数据</h3>
                <Music className="w-5 h-5 text-forest-400" />
              </div>
              <button
                onClick={handleExportRecordings}
                disabled={recordings.length === 0}
                className="w-full px-4 py-2 bg-dark-700 hover:bg-dark-600 disabled:text-dark-500 text-dark-200 rounded-lg transition-all text-sm flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> 导出录音列表
              </button>
            </div>
          </div>

          <div className="bg-dark-800/50 rounded-xl border border-dark-700 overflow-hidden">
            <div className="p-6 border-b border-dark-700">
              <h3 className="text-sm font-semibold text-white">录音文件列表</h3>
              <p className="text-xs text-dark-500 mt-1">
                共 {recordings.length} 个录音文件，{annotations.length} 条标注
              </p>
            </div>

            {recordings.length === 0 ? (
              <div className="text-center py-16 text-dark-500">
                <Music className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-sm">暂无录音文件</p>
                <p className="text-xs mt-1">请在标注工作台加载录音文件</p>
              </div>
            ) : (
              <div className="divide-y divide-dark-700">
                {recordings.map((recording) => {
                  const recordingAnnotations = annotations.filter(
                    (a) => a.recordingId === recording.id
                  );
                  const isEditing = editingId === recording.id;

                  return (
                    <div
                      key={recording.id}
                      className="p-4 hover:bg-dark-800/30 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-forest-500/10 rounded-lg">
                              <Music className="w-5 h-5 text-forest-400" />
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-white">
                                {recording.name}
                              </h4>
                              <div className="flex items-center gap-4 mt-1 text-xs text-dark-400">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDuration(recording.duration)}
                                </span>
                                <span>
                                  {recording.sampleRate} Hz
                                </span>
                                <span className="text-forest-400">
                                  {recordingAnnotations.length} 条标注
                                </span>
                              </div>
                            </div>
                          </div>

                          {isEditing ? (
                            <div className="flex items-center gap-4 mt-3 ml-11">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3 h-3 text-dark-500" />
                                <input
                                  type="text"
                                  placeholder="记录地点"
                                  value={editForm.location}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, location: e.target.value })
                                  }
                                  className="bg-dark-700 text-dark-200 text-xs rounded px-2 py-1 border-none focus:ring-1 focus:ring-forest-500 w-32"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3 h-3 text-dark-500" />
                                <input
                                  type="date"
                                  value={editForm.recordedAt}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, recordedAt: e.target.value })
                                  }
                                  className="bg-dark-700 text-dark-200 text-xs rounded px-2 py-1 border-none focus:ring-1 focus:ring-forest-500"
                                />
                              </div>
                              <button
                                onClick={() => handleSaveEdit(recording.id)}
                                className="px-3 py-1 bg-forest-600 hover:bg-forest-500 text-white text-xs rounded transition-colors"
                              >
                                保存
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-3 py-1 bg-dark-700 hover:bg-dark-600 text-dark-200 text-xs rounded transition-colors"
                              >
                                取消
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-4 ml-11 text-xs text-dark-400">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {recording.location || '未设置地点'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(recording.recordedAt)}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {!isEditing && (
                            <button
                              onClick={() => handleStartEdit(recording)}
                              className="p-2 hover:bg-dark-700 rounded-lg text-dark-400 hover:text-white transition-colors"
                              title="编辑元数据"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteRecording(recording.id)}
                            className="p-2 hover:bg-red-900/30 rounded-lg text-dark-400 hover:text-red-400 transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

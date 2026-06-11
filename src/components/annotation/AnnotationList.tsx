import { useAnnotationStore } from '../../store/annotationStore';
import { useAudioStore } from '../../store/audioStore';
import { useUIStore } from '../../store/uiStore';
import { CALL_TYPE_LABELS, type Annotation } from '../../types/annotation';
import { Bird, Music, AlertCircle, Heart, HelpCircle, Trash2, Check, Edit3 } from 'lucide-react';

const callTypeIcons: Record<string, typeof Bird> = {
  song: Music,
  call: Bird,
  alarm: AlertCircle,
  courtship: Heart,
  unknown: HelpCircle,
};

export function AnnotationList() {
  const {
    annotations,
    selectedAnnotationId,
    setSelectedAnnotation,
    deleteAnnotation,
    confirmAnnotation,
    setEditingAnnotation,
    setCurrentSelection,
  } = useAnnotationStore();
  const { currentRecordingId, recordings } = useAudioStore();
  const { setRightPanelTab } = useUIStore();

  const recordingAnnotations = annotations.filter((a) => a.recordingId === currentRecordingId);

  const handleAnnotationClick = (annotation: Annotation) => {
    setSelectedAnnotation(annotation.id);
    setCurrentSelection({
      startTime: annotation.startTime,
      endTime: annotation.endTime,
      minFreq: annotation.minFreq,
      maxFreq: annotation.maxFreq,
    });
    setRightPanelTab('properties');
  };

  const handleEdit = (e: React.MouseEvent, annotation: Annotation) => {
    e.stopPropagation();
    setEditingAnnotation(annotation);
    setCurrentSelection({
      startTime: annotation.startTime,
      endTime: annotation.endTime,
      minFreq: annotation.minFreq,
      maxFreq: annotation.maxFreq,
    });
    setRightPanelTab('properties');
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这个标注吗？')) {
      deleteAnnotation(id);
    }
  };

  const handleConfirm = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    confirmAnnotation(id);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRecordingName = (id: string): string => {
    return recordings.find((r) => r.id === id)?.name || '未知录音';
  };

  const groupedAnnotations = currentRecordingId
    ? { [getRecordingName(currentRecordingId)]: recordingAnnotations }
    : recordings.reduce((acc, r) => {
        const anns = annotations.filter((a) => a.recordingId === r.id);
        if (anns.length > 0) {
          acc[r.name] = anns;
        }
        return acc;
      }, {} as Record<string, Annotation[]>);

  if (Object.keys(groupedAnnotations).length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-dark-700">
          <h3 className="text-sm font-semibold text-white">标注列表</h3>
          <p className="text-xs text-dark-500 mt-1">
            共 {annotations.length} 个标注
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center text-dark-500">
          <div className="text-center">
            <Bird className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">暂无标注</p>
            <p className="text-xs mt-1">在声谱图上框选区域创建标注</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-dark-700">
        <h3 className="text-sm font-semibold text-white">标注列表</h3>
        <p className="text-xs text-dark-500 mt-1">
          共 {annotations.length} 个标注 · {recordingAnnotations.length} 个当前录音
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {Object.entries(groupedAnnotations).map(([recordingName, anns]) => (
          <div key={recordingName}>
            <div className="px-4 py-2 bg-dark-800/50 sticky top-0">
              <p className="text-xs text-dark-400 font-medium truncate">
                {recordingName}
                <span className="text-dark-600 ml-2">({anns.length})</span>
              </p>
            </div>
            <div className="divide-y divide-dark-800">
              {anns.map((annotation) => {
                const Icon = callTypeIcons[annotation.callType] || HelpCircle;
                const isSelected = annotation.id === selectedAnnotationId;

                return (
                  <div
                    key={annotation.id}
                    onClick={() => handleAnnotationClick(annotation)}
                    className={`p-3 cursor-pointer transition-all group ${
                      isSelected
                        ? 'bg-forest-700/20 border-l-2 border-forest-500'
                        : 'hover:bg-dark-800/50 border-l-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-1.5 rounded-lg ${
                          annotation.isConfirmed
                            ? 'bg-forest-500/20 text-forest-400'
                            : annotation.isAutoDetected
                            ? 'bg-accent-500/20 text-accent-400'
                            : 'bg-dark-700 text-dark-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-white truncate">
                            {annotation.species}
                          </h4>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!annotation.isConfirmed && (
                              <button
                                onClick={(e) => handleConfirm(e, annotation.id)}
                                className="p-1 hover:bg-forest-600/30 rounded text-forest-400"
                                title="确认"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={(e) => handleEdit(e, annotation)}
                              className="p-1 hover:bg-dark-600 rounded text-dark-300"
                              title="编辑"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDelete(e, annotation.id)}
                              className="p-1 hover:bg-red-900/30 rounded text-red-400"
                              title="删除"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-xs text-dark-400">
                          <span>{CALL_TYPE_LABELS[annotation.callType]}</span>
                          <span>·</span>
                          <span>
                            {formatTime(annotation.startTime)} - {formatTime(annotation.endTime)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                annotation.confidence > 0.8
                                  ? 'bg-forest-500'
                                  : annotation.confidence > 0.5
                                  ? 'bg-accent-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${annotation.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-dark-500">
                            {(annotation.confidence * 100).toFixed(0)}%
                          </span>
                        </div>

                        {annotation.notes && (
                          <p className="text-xs text-dark-500 mt-1.5 line-clamp-1">
                            {annotation.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { X, Check, Edit3, Trash2, Clock, Activity } from 'lucide-react';
import { useAnnotationStore } from '../../store/annotationStore';
import { useAudioStore } from '../../store/audioStore';
import { useUIStore } from '../../store/uiStore';
import { CALL_TYPE_LABELS, COMMON_SPECIES, type CallType } from '../../types/annotation';

export function AnnotationPanel() {
  const {
    currentSelection,
    editingAnnotation,
    selectedAnnotationId,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    confirmAnnotation,
    setEditingAnnotation,
    setCurrentSelection,
    setSelectedAnnotation,
  } = useAnnotationStore();

  const { currentRecordingId } = useAudioStore();
  const { setRightPanelTab } = useUIStore();

  const [formData, setFormData] = useState({
    species: '',
    callType: 'unknown' as CallType,
    confidence: 0.8,
    notes: '',
  });

  const activeAnnotation = editingAnnotation || (selectedAnnotationId
    ? useAnnotationStore.getState().annotations.find((a) => a.id === selectedAnnotationId)
    : null);

  const displaySelection = currentSelection || activeAnnotation;

  const handleSave = () => {
    if (!displaySelection || !currentRecordingId) return;

    if (editingAnnotation) {
      updateAnnotation(editingAnnotation.id, {
        ...formData,
        startTime: displaySelection.startTime,
        endTime: displaySelection.endTime,
        minFreq: displaySelection.minFreq,
        maxFreq: displaySelection.maxFreq,
      });
    } else {
      addAnnotation({
        recordingId: currentRecordingId,
        startTime: displaySelection.startTime,
        endTime: displaySelection.endTime,
        minFreq: displaySelection.minFreq,
        maxFreq: displaySelection.maxFreq,
        species: formData.species,
        callType: formData.callType,
        confidence: formData.confidence,
        notes: formData.notes,
        isAutoDetected: false,
        isConfirmed: true,
      });
    }

    setFormData({
      species: '',
      callType: 'unknown',
      confidence: 0.8,
      notes: '',
    });
    setCurrentSelection(null);
    setEditingAnnotation(null);
    setRightPanelTab('annotations');
  };

  const handleCancel = () => {
    setCurrentSelection(null);
    setEditingAnnotation(null);
    setSelectedAnnotation(null);
    setFormData({
      species: '',
      callType: 'unknown',
      confidence: 0.8,
      notes: '',
    });
  };

  const handleEdit = () => {
    if (activeAnnotation) {
      setEditingAnnotation(activeAnnotation);
      setFormData({
        species: activeAnnotation.species,
        callType: activeAnnotation.callType,
        confidence: activeAnnotation.confidence,
        notes: activeAnnotation.notes || '',
      });
      setCurrentSelection({
        startTime: activeAnnotation.startTime,
        endTime: activeAnnotation.endTime,
        minFreq: activeAnnotation.minFreq,
        maxFreq: activeAnnotation.maxFreq,
      });
    }
  };

  const handleDelete = () => {
    if (activeAnnotation && confirm('确定要删除这个标注吗？')) {
      deleteAnnotation(activeAnnotation.id);
    }
  };

  const handleConfirm = () => {
    if (activeAnnotation) {
      confirmAnnotation(activeAnnotation.id);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const formatFreq = (freq: number): string => {
    if (freq >= 1000) {
      return `${(freq / 1000).toFixed(1)} kHz`;
    }
    return `${freq.toFixed(0)} Hz`;
  };

  if (!displaySelection) {
    return (
      <div className="h-full flex items-center justify-center text-dark-500">
        <div className="text-center">
          <Edit3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">在声谱图上框选区域</p>
          <p className="text-xs mt-1">或点击已有标注进行编辑</p>
        </div>
      </div>
    );
  }

  const isNew = !activeAnnotation || currentSelection !== null;

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-dark-700">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          {isNew ? '新建标注' : '标注详情'}
          {editingAnnotation && (
            <span className="text-xs bg-accent-500/20 text-accent-400 px-2 py-0.5 rounded">
              编辑中
            </span>
          )}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="bg-dark-800/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-dark-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> 时间范围
            </span>
            <span className="text-dark-200 font-mono">
              {formatTime(displaySelection.startTime)} - {formatTime(displaySelection.endTime)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-dark-400 flex items-center gap-1">
              <Activity className="w-3 h-3" /> 频率范围
            </span>
            <span className="text-dark-200 font-mono">
              {formatFreq(displaySelection.minFreq)} - {formatFreq(displaySelection.maxFreq)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-dark-400">持续时间</span>
            <span className="text-dark-200 font-mono">
              {(displaySelection.endTime - displaySelection.startTime).toFixed(2)} s
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-dark-400">带宽</span>
            <span className="text-dark-200 font-mono">
              {formatFreq(displaySelection.maxFreq - displaySelection.minFreq)}
            </span>
          </div>
        </div>

        {activeAnnotation && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-dark-400">来源</span>
              <span
                className={`px-2 py-0.5 rounded ${
                  activeAnnotation.isAutoDetected
                    ? 'bg-accent-500/20 text-accent-400'
                    : 'bg-forest-500/20 text-forest-400'
                }`}
              >
                {activeAnnotation.isAutoDetected ? '自动识别' : '人工标注'}
              </span>
              {activeAnnotation.isConfirmed && (
                <span className="px-2 py-0.5 rounded bg-forest-500/20 text-forest-400">
                  已确认
                </span>
              )}
            </div>
            <div className="text-xs text-dark-500">
              创建于 {new Date(activeAnnotation.createdAt).toLocaleString('zh-CN')}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-dark-400 mb-1.5">物种名称 *</label>
            <div className="relative">
              <input
                type="text"
                value={formData.species}
                onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                placeholder="输入或选择物种"
                className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-forest-500 transition-colors"
                list="species-list"
              />
              <datalist id="species-list">
                {COMMON_SPECIES.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block text-xs text-dark-400 mb-1.5">鸣声类型</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(CALL_TYPE_LABELS) as CallType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setFormData({ ...formData, callType: type })}
                  className={`px-2 py-1.5 text-xs rounded-lg transition-all ${
                    formData.callType === type
                      ? 'bg-forest-600 text-white'
                      : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                  }`}
                >
                  {CALL_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-dark-400 mb-1.5">
              置信度: {(formData.confidence * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={formData.confidence}
              onChange={(e) => setFormData({ ...formData, confidence: parseFloat(e.target.value) })}
              className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-forest-500"
            />
          </div>

          <div>
            <label className="block text-xs text-dark-400 mb-1.5">备注</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="添加备注信息..."
              rows={3}
              className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-forest-500 transition-colors resize-none"
            />
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-dark-700 space-y-2">
        {isNew || editingAnnotation ? (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-lg transition-all text-sm flex items-center justify-center gap-1"
            >
              <X className="w-4 h-4" /> 取消
            </button>
            <button
              onClick={handleSave}
              disabled={!formData.species.trim()}
              className="flex-1 px-4 py-2 bg-forest-600 hover:bg-forest-500 disabled:bg-dark-700 disabled:text-dark-500 text-white rounded-lg transition-all text-sm flex items-center justify-center gap-1"
            >
              <Check className="w-4 h-4" /> 保存
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              className="px-3 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg transition-all"
              title="删除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            {!activeAnnotation?.isConfirmed && (
              <button
                onClick={handleConfirm}
                className="px-3 py-2 bg-forest-600/30 hover:bg-forest-600/50 text-forest-400 rounded-lg transition-all"
                title="确认"
              >
                <Check className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleEdit}
              className="flex-1 px-4 py-2 bg-forest-600 hover:bg-forest-500 text-white rounded-lg transition-all text-sm flex items-center justify-center gap-1"
            >
              <Edit3 className="w-4 h-4" /> 编辑
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

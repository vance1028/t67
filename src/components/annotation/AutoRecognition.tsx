import { Sparkles, Check, X, Clock, Activity, Loader2 } from 'lucide-react';
import { useAnnotationStore } from '../../store/annotationStore';
import { useAudioStore } from '../../store/audioStore';
import { CALL_TYPE_LABELS, type RecognitionCandidate } from '../../types/annotation';

export function AutoRecognition() {
  const {
    recognitionCandidates,
    isRecognizing,
    runRecognition,
    acceptCandidate,
    rejectCandidate,
    clearCandidates,
  } = useAnnotationStore();

  const { currentRecordingId, recordings } = useAudioStore();

  const currentRecording = recordings.find((r) => r.id === currentRecordingId);

  const handleRunRecognition = async () => {
    if (!currentRecording?.audioBuffer) return;
    await runRecognition(currentRecording.audioBuffer);
  };

  const handleAcceptAll = () => {
    if (!currentRecordingId) return;
    recognitionCandidates.forEach((candidate) => {
      acceptCandidate(candidate, currentRecordingId);
    });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFreq = (freq: number): string => {
    if (freq >= 1000) {
      return `${(freq / 1000).toFixed(1)} kHz`;
    }
    return `${freq.toFixed(0)} Hz`;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-dark-700">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent-500" />
          自动识别
        </h3>
        <p className="text-xs text-dark-500 mt-1">
          使用 AI 模型自动检测鸟类鸣声
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!currentRecording ? (
          <div className="text-center py-8 text-dark-500">
            <p className="text-sm">请先加载录音文件</p>
          </div>
        ) : !currentRecording.audioBuffer ? (
          <div className="text-center py-8 text-dark-500">
            <p className="text-sm">音频正在解码中...</p>
          </div>
        ) : (
          <button
            onClick={handleRunRecognition}
            disabled={isRecognizing}
            className="w-full py-3 bg-accent-600 hover:bg-accent-500 disabled:bg-dark-700 disabled:text-dark-500 text-white rounded-lg transition-all flex items-center justify-center gap-2 font-medium"
          >
            {isRecognizing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                正在分析音频...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                开始自动识别
              </>
            )}
          </button>
        )}

        {recognitionCandidates.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs text-dark-400">
                找到 {recognitionCandidates.length} 个候选
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleAcceptAll}
                  className="px-3 py-1 bg-forest-600/30 hover:bg-forest-600/50 text-forest-400 text-xs rounded-lg transition-all flex items-center gap-1"
                >
                  <Check className="w-3 h-3" /> 全部接受
                </button>
                <button
                  onClick={clearCandidates}
                  className="px-3 py-1 bg-dark-700 hover:bg-dark-600 text-dark-300 text-xs rounded-lg transition-all flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> 清除
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {recognitionCandidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  onAccept={() => {
                    if (currentRecordingId) {
                      acceptCandidate(candidate, currentRecordingId);
                    }
                  }}
                  onReject={() => rejectCandidate(candidate.id)}
                  formatTime={formatTime}
                  formatFreq={formatFreq}
                />
              ))}
            </div>
          </>
        )}

        {!isRecognizing && recognitionCandidates.length === 0 && currentRecording && (
          <div className="text-center py-8 text-dark-500">
            <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">点击按钮开始自动识别</p>
            <p className="text-xs mt-1">系统将自动检测鸣声并给出候选标注</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface CandidateCardProps {
  candidate: RecognitionCandidate;
  onAccept: () => void;
  onReject: () => void;
  formatTime: (s: number) => string;
  formatFreq: (f: number) => string;
}

function CandidateCard({ candidate, onAccept, onReject, formatTime, formatFreq }: CandidateCardProps) {
  return (
    <div className="bg-dark-800/50 rounded-lg p-3 border border-accent-500/20 hover:border-accent-500/40 transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-white">{candidate.species}</h4>
          <p className="text-xs text-dark-400 mt-0.5">
            {CALL_TYPE_LABELS[candidate.callType as keyof typeof CALL_TYPE_LABELS]}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onReject}
            className="p-1.5 hover:bg-red-900/30 rounded text-red-400 transition-colors"
            title="拒绝"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={onAccept}
            className="p-1.5 hover:bg-forest-600/30 rounded text-forest-400 transition-colors"
            title="接受"
          >
            <Check className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-2 space-y-1">
        <div className="flex items-center gap-2 text-xs text-dark-400">
          <Clock className="w-3 h-3" />
          <span>
            {formatTime(candidate.startTime)} - {formatTime(candidate.endTime)}
          </span>
          <span className="text-dark-600">|</span>
          <Activity className="w-3 h-3" />
          <span>
            {formatFreq(candidate.minFreq)} - {formatFreq(candidate.maxFreq)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-dark-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                candidate.confidence > 0.8
                  ? 'bg-forest-500'
                  : candidate.confidence > 0.5
                  ? 'bg-accent-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${candidate.confidence * 100}%` }}
            />
          </div>
          <span className="text-xs text-dark-500">
            {(candidate.confidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}

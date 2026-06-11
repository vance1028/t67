export type CallType = 'song' | 'call' | 'alarm' | 'courtship' | 'unknown';

export interface Annotation {
  id: string;
  recordingId: string;
  startTime: number;
  endTime: number;
  minFreq: number;
  maxFreq: number;
  species: string;
  callType: CallType;
  confidence: number;
  notes?: string;
  isAutoDetected: boolean;
  isConfirmed: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface RecognitionCandidate {
  id: string;
  startTime: number;
  endTime: number;
  minFreq: number;
  maxFreq: number;
  species: string;
  callType: CallType;
  confidence: number;
}

export interface Selection {
  startTime: number;
  endTime: number;
  minFreq: number;
  maxFreq: number;
}

export interface PixelSelection {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AnnotationState {
  annotations: Annotation[];
  selectedAnnotationId: string | null;
  isDrawingSelection: boolean;
  currentSelection: Selection | null;
  recognitionCandidates: RecognitionCandidate[];
  isRecognizing: boolean;
}

export const CALL_TYPE_LABELS: Record<CallType, string> = {
  song: '鸣唱',
  call: '鸣叫',
  alarm: '警戒',
  courtship: '求偶',
  unknown: '未知',
};

export const COMMON_SPECIES = [
  '画眉',
  '喜鹊',
  '麻雀',
  '杜鹃',
  '夜莺',
  '黄鹂',
  '啄木鸟',
  '猫头鹰',
  '燕子',
  '白头鹎',
  '红嘴蓝鹊',
  '大山雀',
];

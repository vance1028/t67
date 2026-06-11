import { create } from 'zustand';
import type { Annotation, Selection, RecognitionCandidate, CallType } from '../types/annotation';
import { loadAnnotations, saveAnnotations } from '../utils/storage';
import { recognitionService } from '../services/recognition';

interface AnnotationStore {
  annotations: Annotation[];
  selectedAnnotationId: string | null;
  isDrawingSelection: boolean;
  currentSelection: Selection | null;
  recognitionCandidates: RecognitionCandidate[];
  isRecognizing: boolean;
  editingAnnotation: Annotation | null;

  addAnnotation: (annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;
  confirmAnnotation: (id: string) => void;
  setSelectedAnnotation: (id: string | null) => void;
  setIsDrawingSelection: (drawing: boolean) => void;
  setCurrentSelection: (selection: Selection | null) => void;
  setEditingAnnotation: (annotation: Annotation | null) => void;
  runRecognition: (audioBuffer: AudioBuffer) => Promise<void>;
  acceptCandidate: (candidate: RecognitionCandidate, recordingId: string) => void;
  rejectCandidate: (candidateId: string) => void;
  clearCandidates: () => void;
  loadStoredAnnotations: () => void;
  getAnnotationsForRecording: (recordingId: string) => Annotation[];
}

function generateId(): string {
  return `ann-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const useAnnotationStore = create<AnnotationStore>((set, get) => ({
  annotations: [],
  selectedAnnotationId: null,
  isDrawingSelection: false,
  currentSelection: null,
  recognitionCandidates: [],
  isRecognizing: false,
  editingAnnotation: null,

  addAnnotation: (annotation) =>
    set((state) => {
      const newAnnotation: Annotation = {
        ...annotation,
        id: generateId(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const newAnnotations = [...state.annotations, newAnnotation];
      saveAnnotations(newAnnotations);
      return {
        annotations: newAnnotations,
        selectedAnnotationId: newAnnotation.id,
        currentSelection: null,
        editingAnnotation: newAnnotation,
      };
    }),

  updateAnnotation: (id, updates) =>
    set((state) => {
      const newAnnotations = state.annotations.map((a) =>
        a.id === id ? { ...a, ...updates, updatedAt: Date.now() } : a
      );
      saveAnnotations(newAnnotations);
      return { annotations: newAnnotations };
    }),

  deleteAnnotation: (id) =>
    set((state) => {
      const newAnnotations = state.annotations.filter((a) => a.id !== id);
      saveAnnotations(newAnnotations);
      return {
        annotations: newAnnotations,
        selectedAnnotationId: state.selectedAnnotationId === id ? null : state.selectedAnnotationId,
        editingAnnotation: state.editingAnnotation?.id === id ? null : state.editingAnnotation,
      };
    }),

  confirmAnnotation: (id) =>
    set((state) => {
      const newAnnotations = state.annotations.map((a) =>
        a.id === id ? { ...a, isConfirmed: true, updatedAt: Date.now() } : a
      );
      saveAnnotations(newAnnotations);
      return { annotations: newAnnotations };
    }),

  setSelectedAnnotation: (id) => set({ selectedAnnotationId: id }),

  setIsDrawingSelection: (drawing) => set({ isDrawingSelection: drawing }),

  setCurrentSelection: (selection) => set({ currentSelection: selection }),

  setEditingAnnotation: (annotation) => set({ editingAnnotation: annotation }),

  runRecognition: async (audioBuffer) => {
    set({ isRecognizing: true, recognitionCandidates: [] });
    try {
      const candidates = await recognitionService.analyze(audioBuffer);
      set({ recognitionCandidates: candidates, isRecognizing: false });
    } catch (error) {
      console.error('Recognition failed:', error);
      set({ isRecognizing: false });
    }
  },

  acceptCandidate: (candidate, recordingId) => {
    const { addAnnotation, rejectCandidate } = get();
    addAnnotation({
      recordingId,
      startTime: candidate.startTime,
      endTime: candidate.endTime,
      minFreq: candidate.minFreq,
      maxFreq: candidate.maxFreq,
      species: candidate.species,
      callType: candidate.callType as CallType,
      confidence: candidate.confidence,
      isAutoDetected: true,
      isConfirmed: false,
    });
    rejectCandidate(candidate.id);
  },

  rejectCandidate: (candidateId) =>
    set((state) => ({
      recognitionCandidates: state.recognitionCandidates.filter((c) => c.id !== candidateId),
    })),

  clearCandidates: () => set({ recognitionCandidates: [] }),

  loadStoredAnnotations: () => {
    const stored = loadAnnotations();
    set({ annotations: stored });
  },

  getAnnotationsForRecording: (recordingId) => {
    return get().annotations.filter((a) => a.recordingId === recordingId);
  },
}));

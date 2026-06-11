import type { AudioRecording, Annotation } from '../types';

const STORAGE_KEYS = {
  RECORDINGS: 'birdscope_recordings',
  ANNOTATIONS: 'birdscope_annotations',
  SETTINGS: 'birdscope_settings',
};

export function saveToStorage<T>(key: string, data: T): void {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const serialized = localStorage.getItem(key);
    if (serialized === null) {
      return defaultValue;
    }
    return JSON.parse(serialized) as T;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return defaultValue;
  }
}

export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
}

export function saveRecordings(recordings: AudioRecording[]): void {
  const recordingsToSave = recordings.map(({ audioBuffer, ...rest }) => rest);
  saveToStorage(STORAGE_KEYS.RECORDINGS, recordingsToSave);
}

export function loadRecordings(): Omit<AudioRecording, 'audioBuffer'>[] {
  return loadFromStorage<Omit<AudioRecording, 'audioBuffer'>[]>(STORAGE_KEYS.RECORDINGS, []);
}

export function saveAnnotations(annotations: Annotation[]): void {
  saveToStorage(STORAGE_KEYS.ANNOTATIONS, annotations);
}

export function loadAnnotations(): Annotation[] {
  return loadFromStorage<Annotation[]>(STORAGE_KEYS.ANNOTATIONS, []);
}

export function exportAnnotations(annotations: Annotation[], format: 'json' | 'csv' = 'json'): string {
  if (format === 'json') {
    return JSON.stringify(annotations, null, 2);
  } else {
    const headers = [
      'id',
      'recordingId',
      'startTime',
      'endTime',
      'minFreq',
      'maxFreq',
      'species',
      'callType',
      'confidence',
      'notes',
      'isAutoDetected',
      'isConfirmed',
      'createdAt',
      'updatedAt',
    ];
    const rows = annotations.map((ann) =>
      headers.map((h) => {
        const value = ann[h as keyof Annotation];
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return String(value ?? '');
      }).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }
}

export function downloadFile(content: string, filename: string, mimeType: string = 'application/json'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function importFromJSON<T>(jsonString: string): T | null {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return null;
  }
}

export function getStorageSize(): number {
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length * 2;
    }
  }
  return total;
}

export function clearAllData(): void {
  removeFromStorage(STORAGE_KEYS.RECORDINGS);
  removeFromStorage(STORAGE_KEYS.ANNOTATIONS);
  removeFromStorage(STORAGE_KEYS.SETTINGS);
}

import type { Annotation, AudioRecording } from '../types';
import type {
  MigrationDataPoint,
  DailyRhythmDataPoint,
  SpeciesRichnessDataPoint,
  AnalysisFilter,
  SpeciesStats,
} from '../types/analysis';

export function filterAnnotations(
  annotations: Annotation[],
  recordings: AudioRecording[],
  filter: AnalysisFilter
): Annotation[] {
  return annotations.filter((ann) => {
    if (filter.species.length > 0 && !filter.species.includes(ann.species)) {
      return false;
    }

    const recording = recordings.find((r) => r.id === ann.recordingId);
    if (!recording) return false;

    if (recording.recordedAt) {
      const date = recording.recordedAt.split('T')[0];
      if (filter.startDate && date < filter.startDate) return false;
      if (filter.endDate && date > filter.endDate) return false;
    }

    if (filter.locations.length > 0 && recording.location) {
      if (!filter.locations.includes(recording.location)) return false;
    }

    return true;
  });
}

export function computeMigrationData(
  annotations: Annotation[],
  recordings: AudioRecording[],
  targetSpecies: string
): MigrationDataPoint[] {
  const dateCounts: Record<string, number> = {};

  annotations
    .filter((ann) => ann.species === targetSpecies)
    .forEach((ann) => {
      const recording = recordings.find((r) => r.id === ann.recordingId);
      if (recording?.recordedAt) {
        const date = recording.recordedAt.split('T')[0];
        dateCounts[date] = (dateCounts[date] || 0) + 1;
      }
    });

  return Object.entries(dateCounts)
    .map(([date, count]) => ({
      date,
      species: targetSpecies,
      count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function computeDailyRhythm(
  annotations: Annotation[],
  recordings: AudioRecording[],
  targetSpecies?: string
): DailyRhythmDataPoint[] {
  const hourCounts: Record<number, Record<string, number>> = {};

  for (let h = 0; h < 24; h++) {
    hourCounts[h] = {};
  }

  annotations
    .filter((ann) => !targetSpecies || ann.species === targetSpecies)
    .forEach((ann) => {
      const recording = recordings.find((r) => r.id === ann.recordingId);
      if (recording?.recordedAt) {
        const hour = new Date(recording.recordedAt).getHours();
        const species = ann.species;
        hourCounts[hour][species] = (hourCounts[hour][species] || 0) + 1;
      }
    });

  const result: DailyRhythmDataPoint[] = [];
  for (let h = 0; h < 24; h++) {
    Object.entries(hourCounts[h]).forEach(([species, count]) => {
      result.push({
        hour: h,
        species,
        count,
      });
    });
  }

  return result;
}

export function computeSpeciesRichness(
  annotations: Annotation[],
  recordings: AudioRecording[]
): SpeciesRichnessDataPoint[] {
  const monthData: Record<number, { species: Set<string>; annotations: number }> = {};

  for (let m = 1; m <= 12; m++) {
    monthData[m] = { species: new Set(), annotations: 0 };
  }

  annotations.forEach((ann) => {
    const recording = recordings.find((r) => r.id === ann.recordingId);
    if (recording?.recordedAt) {
      const month = new Date(recording.recordedAt).getMonth() + 1;
      monthData[month].species.add(ann.species);
      monthData[month].annotations++;
    }
  });

  return Object.entries(monthData)
    .map(([month, data]) => ({
      month: parseInt(month),
      speciesCount: data.species.size,
      totalAnnotations: data.annotations,
    }))
    .sort((a, b) => a.month - b.month);
}

export function computeSpeciesStats(
  annotations: Annotation[],
  recordings: AudioRecording[]
): SpeciesStats[] {
  const speciesMap: Record<string, SpeciesStats> = {};

  annotations.forEach((ann) => {
    if (!speciesMap[ann.species]) {
      speciesMap[ann.species] = {
        name: ann.species,
        totalAnnotations: 0,
        uniqueLocations: 0,
        callTypeDistribution: {},
      };
    }

    const stats = speciesMap[ann.species];
    stats.totalAnnotations++;
    stats.callTypeDistribution[ann.callType] = (stats.callTypeDistribution[ann.callType] || 0) + 1;

    const recording = recordings.find((r) => r.id === ann.recordingId);
    if (recording?.recordedAt) {
      const dateStr = recording.recordedAt.split('T')[0];
      if (!stats.firstSeen || dateStr < stats.firstSeen) {
        stats.firstSeen = dateStr;
      }
      if (!stats.lastSeen || dateStr > stats.lastSeen) {
        stats.lastSeen = dateStr;
      }
    }
  });

  const speciesLocations: Record<string, Set<string>> = {};
  annotations.forEach((ann) => {
    const recording = recordings.find((r) => r.id === ann.recordingId);
    if (recording?.location) {
      if (!speciesLocations[ann.species]) {
        speciesLocations[ann.species] = new Set();
      }
      speciesLocations[ann.species].add(recording.location);
    }
  });

  Object.entries(speciesLocations).forEach(([species, locations]) => {
    if (speciesMap[species]) {
      speciesMap[species].uniqueLocations = locations.size;
    }
  });

  return Object.values(speciesMap).sort((a, b) => b.totalAnnotations - a.totalAnnotations);
}

export function getUniqueSpecies(annotations: Annotation[]): string[] {
  return Array.from(new Set(annotations.map((a) => a.species))).sort();
}

export function getUniqueLocations(recordings: AudioRecording[]): string[] {
  return Array.from(new Set(recordings.map((r) => r.location).filter(Boolean) as string[])).sort();
}

export function getDateRange(recordings: AudioRecording[]): { start: string | null; end: string | null } {
  const dates = recordings
    .map((r) => r.recordedAt?.split('T')[0])
    .filter(Boolean) as string[];

  if (dates.length === 0) {
    return { start: null, end: null };
  }

  return {
    start: dates.reduce((a, b) => (a < b ? a : b)),
    end: dates.reduce((a, b) => (a > b ? a : b)),
  };
}

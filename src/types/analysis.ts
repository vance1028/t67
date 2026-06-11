export interface MigrationDataPoint {
  date: string;
  species: string;
  count: number;
}

export interface DailyRhythmDataPoint {
  hour: number;
  species: string;
  count: number;
}

export interface SpeciesRichnessDataPoint {
  month: number;
  speciesCount: number;
  totalAnnotations: number;
}

export interface AnalysisFilter {
  species: string[];
  startDate?: string;
  endDate?: string;
  locations: string[];
}

export interface SpeciesStats {
  name: string;
  totalAnnotations: number;
  firstSeen?: string;
  lastSeen?: string;
  uniqueLocations: number;
  callTypeDistribution: Record<string, number>;
}

export interface TimeRange {
  start: string;
  end: string;
}

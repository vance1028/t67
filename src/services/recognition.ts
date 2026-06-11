import type { RecognitionCandidate, CallType } from '../types/annotation';

export interface RecognitionService {
  analyze(audioBuffer: AudioBuffer): Promise<RecognitionCandidate[]>;
}

export class MockRecognitionService implements RecognitionService {
  private species = [
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
  ];

  private callTypes: CallType[] = ['song', 'call', 'alarm', 'courtship', 'unknown'];

  async analyze(audioBuffer: AudioBuffer): Promise<RecognitionCandidate[]> {
    await this.delay(1500 + Math.random() * 1000);

    const duration = audioBuffer.duration;
    const sampleRate = audioBuffer.sampleRate;
    const channelData = audioBuffer.getChannelData(0);

    const candidates = this.detectBirdSounds(channelData, sampleRate, duration);

    return candidates.map((segment, index) => ({
      id: `mock-${Date.now()}-${index}`,
      startTime: segment.startTime,
      endTime: segment.endTime,
      minFreq: segment.minFreq,
      maxFreq: segment.maxFreq,
      species: this.species[Math.floor(Math.random() * this.species.length)],
      callType: this.callTypes[Math.floor(Math.random() * this.callTypes.length)],
      confidence: 0.6 + Math.random() * 0.35,
    }));
  }

  private detectBirdSounds(
    channelData: Float32Array,
    sampleRate: number,
    duration: number
  ): Array<{
    startTime: number;
    endTime: number;
    minFreq: number;
    maxFreq: number;
  }> {
    const segments: Array<{
      startTime: number;
      endTime: number;
      minFreq: number;
      maxFreq: number;
    }> = [];

    const frameSize = 2048;
    const hopSize = 512;
    const numFrames = Math.floor((channelData.length - frameSize) / hopSize);

    const energyThreshold = this.calculateEnergyThreshold(channelData, frameSize, hopSize);

    let inSegment = false;
    let segmentStart = 0;

    for (let i = 0; i < numFrames; i++) {
      const startSample = i * hopSize;
      let energy = 0;

      for (let j = 0; j < frameSize && startSample + j < channelData.length; j++) {
        energy += Math.abs(channelData[startSample + j]);
      }
      energy /= frameSize;

      const time = startSample / sampleRate;

      if (energy > energyThreshold && !inSegment) {
        inSegment = true;
        segmentStart = time;
      } else if (energy < energyThreshold * 0.5 && inSegment) {
        inSegment = false;
        const segmentDuration = time - segmentStart;

        if (segmentDuration > 0.2 && segmentDuration < 5) {
          segments.push({
            startTime: segmentStart,
            endTime: time,
            minFreq: 1000 + Math.random() * 2000,
            maxFreq: 4000 + Math.random() * 4000,
          });
        }
      }
    }

    if (segments.length === 0) {
      const count = Math.floor(Math.random() * 6) + 3;
      for (let i = 0; i < count; i++) {
        const startTime = Math.random() * (duration - 2);
        segments.push({
          startTime,
          endTime: Math.min(duration, startTime + 0.5 + Math.random() * 2),
          minFreq: 1000 + Math.random() * 2000,
          maxFreq: 4000 + Math.random() * 4000,
        });
      }
    }

    return segments.slice(0, 15);
  }

  private calculateEnergyThreshold(
    channelData: Float32Array,
    frameSize: number,
    hopSize: number
  ): number {
    const numFrames = Math.floor((channelData.length - frameSize) / hopSize);
    const energies: number[] = [];

    for (let i = 0; i < numFrames; i++) {
      const startSample = i * hopSize;
      let energy = 0;

      for (let j = 0; j < frameSize && startSample + j < channelData.length; j++) {
        energy += Math.abs(channelData[startSample + j]);
      }
      energies.push(energy / frameSize);
    }

    energies.sort((a, b) => a - b);
    const median = energies[Math.floor(energies.length * 0.5)];
    const percentile90 = energies[Math.floor(energies.length * 0.9)];

    return median + (percentile90 - median) * 0.3;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export class APIRecognitionService implements RecognitionService {
  async analyze(audioBuffer: AudioBuffer): Promise<RecognitionCandidate[]> {
    throw new Error('API Recognition Service not implemented. Use MockRecognitionService for now.');
  }
}

export const recognitionService: RecognitionService = new MockRecognitionService();

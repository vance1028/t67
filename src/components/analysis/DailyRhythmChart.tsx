import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useAudioStore } from '../../store/audioStore';
import { useAnnotationStore } from '../../store/annotationStore';
import { computeDailyRhythm, getUniqueSpecies } from '../../utils/analysis';
import type { EChartsOption } from 'echarts';

interface DailyRhythmChartProps {
  targetSpecies?: string;
}

export function DailyRhythmChart({ targetSpecies }: DailyRhythmChartProps) {
  const { recordings } = useAudioStore();
  const { annotations } = useAnnotationStore();

  const speciesList = useMemo(() => getUniqueSpecies(annotations), [annotations]);

  const chartData = useMemo(() => {
    return computeDailyRhythm(annotations, recordings, targetSpecies);
  }, [annotations, recordings, targetSpecies]);

  const option: EChartsOption = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

    let seriesData: number[] = new Array(24).fill(0);

    if (targetSpecies) {
      chartData.forEach((d) => {
        if (d.species === targetSpecies) {
          seriesData[d.hour] = d.count;
        }
      });
    } else {
      const hourTotals = new Array(24).fill(0);
      chartData.forEach((d) => {
        hourTotals[d.hour] += d.count;
      });
      seriesData = hourTotals;
    }

    const colors = targetSpecies
      ? ['#5da37f', '#3d8661']
      : ['#D68C45', '#c47231'];

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: '#373f50',
        textStyle: { color: '#e2e8f0' },
        axisPointer: {
          type: 'shadow',
          shadowStyle: { color: 'rgba(93, 163, 127, 0.1)' },
        },
        formatter: (params: any) => {
          const data = params[0];
          return `<div style="padding: 8px;">
            <div style="font-weight: 600; margin-bottom: 4px;">${data.name}</div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="display: inline-block; width: 10px; height: 10px; background: ${colors[0]}; border-radius: 2px;"></span>
              <span>鸣叫次数: <strong>${data.value}</strong></span>
            </div>
          </div>`;
        },
      },
      grid: {
        left: '10%',
        right: '5%',
        top: '15%',
        bottom: '15%',
      },
      xAxis: {
        type: 'category',
        data: hours,
        axisLine: { lineStyle: { color: '#373f50' } },
        axisLabel: {
          color: '#8692ab',
          fontSize: 10,
          interval: 2,
        },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        name: '鸣叫次数',
        nameTextStyle: { color: '#8692ab', fontSize: 11 },
        axisLine: { show: false },
        axisLabel: { color: '#8692ab', fontSize: 10 },
        splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
      },
      series: [
        {
          name: '鸣叫次数',
          type: 'bar',
          data: seriesData,
          barWidth: '60%',
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: colors[0] },
                { offset: 1, color: colors[1] },
              ],
            },
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
    };
  }, [chartData, targetSpecies]);

  if (annotations.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-dark-500">
        <p className="text-sm">暂无标注数据</p>
      </div>
    );
  }

  return (
    <ReactECharts
      option={option}
      style={{ height: '100%', width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
}

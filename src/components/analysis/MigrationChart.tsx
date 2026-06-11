import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useAudioStore } from '../../store/audioStore';
import { useAnnotationStore } from '../../store/annotationStore';
import { computeMigrationData } from '../../utils/analysis';
import type { EChartsOption } from 'echarts';

interface MigrationChartProps {
  targetSpecies: string;
}

export function MigrationChart({ targetSpecies }: MigrationChartProps) {
  const { recordings } = useAudioStore();
  const { annotations } = useAnnotationStore();

  const chartData = useMemo(() => {
    if (!targetSpecies) return [];
    return computeMigrationData(annotations, recordings, targetSpecies);
  }, [annotations, recordings, targetSpecies]);

  const option: EChartsOption = useMemo(() => {
    const dates = chartData.map((d) => d.date);
    const counts = chartData.map((d) => d.count);

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: '#373f50',
        textStyle: { color: '#e2e8f0' },
        formatter: (params: any) => {
          const data = params[0];
          return `<div style="padding: 8px;">
            <div style="font-weight: 600; margin-bottom: 4px;">${data.name}</div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="display: inline-block; width: 10px; height: 10px; background: #5da37f; border-radius: 50%;"></span>
              <span>出现次数: <strong>${data.value}</strong></span>
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
        data: dates,
        axisLine: { lineStyle: { color: '#373f50' } },
        axisLabel: {
          color: '#8692ab',
          rotate: 45,
          fontSize: 10,
        },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        name: '出现频次',
        nameTextStyle: { color: '#8692ab', fontSize: 11 },
        axisLine: { show: false },
        axisLabel: { color: '#8692ab', fontSize: 10 },
        splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
      },
      series: [
        {
          name: '出现次数',
          type: 'line',
          data: counts,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            color: '#5da37f',
            width: 3,
          },
          itemStyle: {
            color: '#5da37f',
            borderColor: '#fff',
            borderWidth: 2,
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(93, 163, 127, 0.4)' },
                { offset: 1, color: 'rgba(93, 163, 127, 0.05)' },
              ],
            },
          },
        },
      ],
    };
  }, [chartData]);

  if (!targetSpecies) {
    return (
      <div className="h-full flex items-center justify-center text-dark-500">
        <p className="text-sm">请选择一个物种</p>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-dark-500">
        <div className="text-center">
          <p className="text-sm">暂无{targetSpecies}的监测数据</p>
          <p className="text-xs mt-1">请先在标注工作台添加相关标注</p>
        </div>
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

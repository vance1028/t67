import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useAudioStore } from '../../store/audioStore';
import { useAnnotationStore } from '../../store/annotationStore';
import { computeSpeciesRichness } from '../../utils/analysis';
import type { EChartsOption } from 'echarts';

const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

export function SpeciesRichnessChart() {
  const { recordings } = useAudioStore();
  const { annotations } = useAnnotationStore();

  const chartData = useMemo(() => {
    return computeSpeciesRichness(annotations, recordings);
  }, [annotations, recordings]);

  const option: EChartsOption = useMemo(() => {
    const months = MONTH_NAMES;
    const speciesCounts = chartData.map((d) => d.speciesCount);
    const totalAnnotations = chartData.map((d) => d.totalAnnotations);

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: '#373f50',
        textStyle: { color: '#e2e8f0' },
        axisPointer: {
          type: 'cross',
          crossStyle: { color: '#8692ab' },
        },
        formatter: (params: any) => {
          const speciesData = params.find((p: any) => p.seriesName === '物种数');
          const annoData = params.find((p: any) => p.seriesName === '标注总数');
          return `<div style="padding: 8px;">
            <div style="font-weight: 600; margin-bottom: 8px;">${speciesData.name}</div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span style="display: inline-block; width: 10px; height: 10px; background: #5da37f; border-radius: 50%;"></span>
              <span>物种数: <strong>${speciesData.value}</strong></span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="display: inline-block; width: 10px; height: 10px; background: #D68C45; border-radius: 50%;"></span>
              <span>标注总数: <strong>${annoData.value}</strong></span>
            </div>
          </div>`;
        },
      },
      legend: {
        data: ['物种数', '标注总数'],
        top: 10,
        right: 20,
        textStyle: { color: '#8692ab', fontSize: 11 },
        itemWidth: 12,
        itemHeight: 8,
      },
      grid: {
        left: '10%',
        right: '5%',
        top: '18%',
        bottom: '15%',
      },
      xAxis: {
        type: 'category',
        data: months,
        axisLine: { lineStyle: { color: '#373f50' } },
        axisLabel: {
          color: '#8692ab',
          fontSize: 10,
        },
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: 'value',
          name: '物种数',
          nameTextStyle: { color: '#8692ab', fontSize: 11 },
          axisLine: { show: false },
          axisLabel: { color: '#8692ab', fontSize: 10 },
          splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
        },
        {
          type: 'value',
          name: '标注总数',
          nameTextStyle: { color: '#8692ab', fontSize: 11 },
          axisLine: { show: false },
          axisLabel: { color: '#8692ab', fontSize: 10 },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: '物种数',
          type: 'line',
          data: speciesCounts,
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
        {
          name: '标注总数',
          type: 'bar',
          yAxisIndex: 1,
          data: totalAnnotations,
          barWidth: '40%',
          itemStyle: {
            color: 'rgba(214, 140, 69, 0.6)',
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
    };
  }, [chartData]);

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

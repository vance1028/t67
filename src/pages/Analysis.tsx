import { useState, useMemo } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { MigrationChart } from '../components/analysis/MigrationChart';
import { DailyRhythmChart } from '../components/analysis/DailyRhythmChart';
import { SpeciesRichnessChart } from '../components/analysis/SpeciesRichnessChart';
import { useAudioStore } from '../store/audioStore';
import { useAnnotationStore } from '../store/annotationStore';
import { getUniqueSpecies, computeSpeciesStats } from '../utils/analysis';
import { Bird, MapPin, Calendar, BarChart3, TrendingUp, Clock, Activity } from 'lucide-react';

export default function Analysis() {
  const { recordings } = useAudioStore();
  const { annotations } = useAnnotationStore();

  const [selectedSpecies, setSelectedSpecies] = useState('');

  const speciesList = useMemo(() => getUniqueSpecies(annotations), [annotations]);
  const speciesStats = useMemo(
    () => computeSpeciesStats(annotations, recordings),
    [annotations, recordings]
  );

  const totalAnnotations = annotations.length;
  const totalSpecies = speciesList.length;
  const totalRecordings = recordings.length;
  const confirmedAnnotations = annotations.filter((a) => a.isConfirmed).length;

  return (
    <div className="h-screen flex bg-dark-900 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-14 bg-dark-900/95 backdrop-blur border-b border-dark-700 flex items-center justify-between px-6">
          <div>
            <h1 className="text-lg font-display font-semibold text-white">物候分析</h1>
            <p className="text-xs text-dark-400">鸟类迁徙节律与活动模式分析</p>
          </div>
        </header>

        <div className="flex-1 p-6 space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <StatCard
              icon={<Bird className="w-5 h-5" />}
              label="物种数"
              value={totalSpecies.toString()}
              color="forest"
            />
            <StatCard
              icon={<BarChart3 className="w-5 h-5" />}
              label="标注总数"
              value={totalAnnotations.toString()}
              color="accent"
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="已确认"
              value={confirmedAnnotations.toString()}
              color="forest"
            />
            <StatCard
              icon={<MapPin className="w-5 h-5" />}
              label="录音数"
              value={totalRecordings.toString()}
              color="accent"
            />
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              <div className="bg-dark-800/50 rounded-xl p-6 border border-dark-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-forest-400" />
                      迁徙物候曲线
                    </h3>
                    <p className="text-xs text-dark-500 mt-1">物种全年出现频次变化</p>
                  </div>
                  <select
                    value={selectedSpecies}
                    onChange={(e) => setSelectedSpecies(e.target.value)}
                    className="bg-dark-700 text-dark-200 text-sm rounded-lg px-3 py-1.5 border-none focus:ring-1 focus:ring-forest-500"
                  >
                    <option value="">选择物种...</option>
                    {speciesList.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="h-64">
                  <MigrationChart targetSpecies={selectedSpecies} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-dark-800/50 rounded-xl p-6 border border-dark-700">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-accent-500" />
                    日节律分析
                  </h3>
                  <p className="text-xs text-dark-500 mb-4">24小时鸣声分布</p>
                  <div className="h-56">
                    <DailyRhythmChart targetSpecies={selectedSpecies || undefined} />
                  </div>
                </div>

                <div className="bg-dark-800/50 rounded-xl p-6 border border-dark-700">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                    <Activity className="w-4 h-4 text-forest-400" />
                    物种丰富度
                  </h3>
                  <p className="text-xs text-dark-500 mb-4">各季节物种数量变化</p>
                  <div className="h-56">
                    <SpeciesRichnessChart />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-dark-800/50 rounded-xl p-6 border border-dark-700">
                <h3 className="text-sm font-semibold text-white mb-4">物种统计</h3>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {speciesStats.length === 0 ? (
                    <div className="text-center py-8 text-dark-500">
                      <Bird className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">暂无统计数据</p>
                    </div>
                  ) : (
                    speciesStats.map((stat, index) => (
                      <div
                        key={stat.name}
                        className="p-3 bg-dark-900/50 rounded-lg border border-dark-700/50 hover:border-forest-600/30 transition-colors cursor-pointer"
                        onClick={() => setSelectedSpecies(stat.name)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 flex items-center justify-center bg-forest-600/30 text-forest-400 text-xs font-bold rounded">
                              {index + 1}
                            </span>
                            <span className="text-sm font-medium text-white">{stat.name}</span>
                          </div>
                          <span className="text-xs text-dark-400">
                            {stat.totalAnnotations} 次
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-dark-400">
                          <div>
                            <span className="text-dark-500">首次出现:</span>{' '}
                            {stat.firstSeen || '-'}
                          </div>
                          <div>
                            <span className="text-dark-500">最近出现:</span>{' '}
                            {stat.lastSeen || '-'}
                          </div>
                          <div>
                            <span className="text-dark-500">记录地点:</span>{' '}
                            {stat.uniqueLocations} 处
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-dark-700/50">
                          <div className="flex gap-1 flex-wrap">
                            {Object.entries(stat.callTypeDistribution).map(([type, count]) => (
                              <span
                                key={type}
                                className="px-1.5 py-0.5 bg-dark-700/50 text-dark-300 text-[10px] rounded"
                              >
                                {type === 'song'
                                  ? '鸣唱'
                                  : type === 'call'
                                  ? '鸣叫'
                                  : type === 'alarm'
                                  ? '警戒'
                                  : type === 'courtship'
                                  ? '求偶'
                                  : '未知'}
                                : {count}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'forest' | 'accent';
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    forest: 'bg-forest-500/10 text-forest-400 border-forest-500/20',
    accent: 'bg-accent-500/10 text-accent-400 border-accent-500/20',
  };

  return (
    <div className={`bg-dark-800/50 rounded-xl p-5 border border-dark-700 transition-all hover:border-${color}-500/30`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-dark-400 mb-1">{label}</p>
          <p className="text-3xl font-display font-bold text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

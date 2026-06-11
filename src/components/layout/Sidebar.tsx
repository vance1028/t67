import { Waves, BarChart3, Database, Settings } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useAppContext } from '../../App';

export function Sidebar() {
  const { sidebarOpen } = useUIStore();
  const { currentPage, navigateTo } = useAppContext();

  const navItems = [
    { key: 'workbench' as const, hash: '#workbench', icon: Waves, label: '标注工作台' },
    { key: 'analysis' as const, hash: '#analysis', icon: BarChart3, label: '物候分析' },
    { key: 'data' as const, hash: '#data', icon: Database, label: '数据管理' },
  ];

  const handleNavClick = (page: 'workbench' | 'analysis' | 'data') => {
    navigateTo(page);
  };

  return (
    <aside
      className={`h-full bg-dark-900 border-r border-dark-700 transition-all duration-300 flex-shrink-0 ${
        sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
      }`}
    >
      <div className="flex flex-col h-full w-64">
        <div className="p-6 border-b border-dark-700">
          <h1 className="text-2xl font-display font-bold text-forest-400 tracking-wide">
            BirdScope
          </h1>
          <p className="text-xs text-dark-400 mt-1">鸟类声纹分析工作台</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = currentPage === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleNavClick(item.key)}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-forest-700/30 text-forest-400 border border-forest-600/30'
                    : 'text-dark-300 hover:bg-dark-800 hover:text-white'
                }`}
              >
                <item.icon
                  className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-accent-500' : ''
                  }`}
                />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-dark-700">
          <button className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-dark-300 hover:bg-dark-800 hover:text-white transition-all">
            <Settings className="w-5 h-5" />
            <span className="font-medium">设置</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

import React from 'react';
import { 
  Home, 
  Image as ImageIcon, 
  BarChart2, 
  BookOpen,
  Layers,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  brandName: string;
  onOpenExport: () => void;
  onOpenPresentation: () => void;
  onOpenPaperModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  brandName,
  onOpenExport,
  onOpenPresentation,
  onOpenPaperModal
}) => {
  const navItems = [
    {
      id: 'analyze',
      label: 'Analyze',
      icon: Home,
    },
    {
      id: 'temporal',
      label: 'Gallery',
      icon: ImageIcon,
    },
    {
      id: 'benchmarks',
      label: 'Results',
      icon: BarChart2,
    },
    {
      id: 'papers',
      label: 'Learn More',
      icon: BookOpen,
    }
  ];

  return (
    <aside className="w-56 bg-[#152238] border-r border-slate-800/80 flex flex-col justify-between p-4 min-h-[calc(100vh-65px)] select-none">
      {/* Top Navigation Menu */}
      <div className="space-y-2 pt-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || (item.id === 'analyze' && activeTab === 'analyze');

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                isActive
                  ? 'bg-[#7dd3fc] text-[#0f172a] shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-[#0f172a]' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom Footer Tag */}
      <div className="pt-4 border-t border-slate-800/60 pb-2">
        <div className="flex items-center gap-2.5 text-xs text-slate-400">
          <div className="text-cyan-400 font-extrabold text-sm font-mono flex items-center">
            <span>/</span>
            <span>\</span>
          </div>
          <div className="leading-tight">
            <span className="font-semibold text-slate-300 block">Safer Roads</span>
            <span className="text-[11px] text-slate-500">Brighter Tomorrows</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

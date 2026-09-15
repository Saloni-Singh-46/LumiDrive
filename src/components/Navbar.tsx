import React from 'react';
import { 
  Sun, 
  Moon, 
  ArrowRight,
  Sparkles,
  BookOpen,
  Tv,
  FileText
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  brandName: 'LumiDrive' | 'RoadSight';
  setBrandName: (brand: 'LumiDrive' | 'RoadSight') => void;
  onOpenPresentation: () => void;
  onOpenPaperModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  theme,
  toggleTheme,
  brandName,
  setBrandName,
  onOpenPresentation,
  onOpenPaperModal
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#0d1527] border-b border-slate-800/80 px-4 lg:px-8 py-3.5 flex items-center justify-between transition-all select-none">
      {/* Brand Logo & Subtitle */}
      <div className="flex items-center gap-4">
        <div 
          onClick={() => setActiveTab('analyze')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          {/* Stylized Road Icon (/\) */}
          <div className="flex items-center text-cyan-400 font-extrabold text-2xl tracking-tighter">
            <span className="text-cyan-400 font-mono">/</span>
            <span className="text-cyan-400 font-mono">\</span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-cyan-300 transition-colors">
              {brandName}
            </span>
            <div className="h-4 w-px bg-slate-700 hidden sm:block" />
            <span className="text-xs text-slate-400 font-normal hidden md:inline">
              {brandName === 'LumiDrive'
                ? 'Multi-Task Road Perception for Real-World Conditions'
                : 'Multi-Task Road Perception under Changing Weather'}
            </span>
          </div>
        </div>
      </div>

      {/* Center Navigation Links (Home / Analyze, About, Research, Team) */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('analyze')}
          className={`relative py-1 transition-colors ${
            activeTab === 'analyze'
              ? 'text-cyan-400 font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-cyan-400'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          {brandName === 'LumiDrive' ? 'Home' : 'Analyze'}
        </button>

        <button
          onClick={() => setActiveTab('architecture')}
          className={`relative py-1 transition-colors ${
            activeTab === 'architecture'
              ? 'text-cyan-400 font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-cyan-400'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          {brandName === 'LumiDrive' ? 'About' : 'How it works'}
        </button>

        <button
          onClick={() => setActiveTab('papers')}
          className={`relative py-1 transition-colors ${
            activeTab === 'papers'
              ? 'text-cyan-400 font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-cyan-400'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          Research
        </button>

        <button
          onClick={() => setActiveTab('benchmarks')}
          className={`relative py-1 transition-colors ${
            activeTab === 'benchmarks'
              ? 'text-cyan-400 font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-cyan-400'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          {brandName === 'LumiDrive' ? 'Team' : 'Results'}
        </button>
      </nav>

      {/* Right Controls: Brand Switcher, IEEE Paper, Presentation, Theme */}
      <div className="flex items-center gap-3">
        {/* Brand View Toggle Pill */}
        <button
          onClick={() => setBrandName(brandName === 'LumiDrive' ? 'RoadSight' : 'LumiDrive')}
          className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold transition-all flex items-center gap-1.5"
          title="Switch between LumiDrive (Mockup 1) and RoadSight (Mockup 2) views"
        >
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>Switch to {brandName === 'LumiDrive' ? 'RoadSight' : 'LumiDrive'}</span>
        </button>

        {/* IEEE Paper Button */}
        <button
          onClick={onOpenPaperModal}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
          <span>Paper</span>
        </button>

        {/* Try Now / Slide Deck Button */}
        <button
          onClick={onOpenPresentation}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-bold shadow-md shadow-cyan-900/40 transition-all hover:scale-105"
        >
          <span>{brandName === 'LumiDrive' ? 'Try Now' : 'Presentation'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
          title="Toggle Light / Dark mode"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-cyan-400" />}
        </button>
      </div>
    </header>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Layers, 
  Activity, 
  ShieldCheck, 
  Sparkles, 
  AlertTriangle,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { ScenarioPreset } from '../engine/presetsData';
import { CVAnalysisResult } from '../engine/cvEngine';

interface TemporalSequenceViewerProps {
  scenario: ScenarioPreset;
  customAnalysis?: CVAnalysisResult | null;
}

export const TemporalSequenceViewer: React.FC<TemporalSequenceViewerProps> = ({ scenario, customAnalysis }) => {
  const [activeFrameIndex, setActiveFrameIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [modelMode, setModelMode] = useState<'proposed' | 'baseline'>('proposed');

  const frames = customAnalysis
    ? scenario.temporalFrames.map((frame, index) => ({
        ...frame,
        description: index === 0
          ? 'Uploaded scene baseline captured for temporal comparison.'
          : index === 1
            ? `${customAnalysis.weather} detected; frame confidence tracked through the transition.`
            : index === 2
              ? 'Temporal memory preserves the uploaded lane corridor during visibility change.'
              : 'Uploaded scene stabilized with cross-task consistency checks.',
        stability: Math.max(0.5, Math.min(0.99, customAnalysis.temporalStability - (index === 1 ? 0.06 : index === 2 ? 0.02 : 0)))
      }))
    : scenario.temporalFrames;
  const currentFrame = frames[activeFrameIndex] || frames[0];

  // Auto playback loop
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setActiveFrameIndex((prev) => (prev + 1) % frames.length);
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isPlaying, frames.length]);

  return (
    <div className="space-y-6">
      {/* Title & Explanatory Banner */}
      <div className="glass-panel p-6 border border-white/10 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" /> Spatiotemporal Sequence Analyzer
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            ConvGRU Video Memory & Temporal Consistency
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Examine how short-term ConvGRU spatial memory ($T=3..5$ frames) prevents frame-to-frame lane flicker and bridges momentary occlusions during adverse weather transitions.
          </p>
          {customAnalysis && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Showing latest uploaded scene
            </div>
          )}
        </div>

        {/* Playback Controls & Model Switcher */}
        <div className="flex items-center gap-2.5">
          <div className="flex rounded-xl bg-slate-900 border border-white/10 p-1">
            <button
              onClick={() => setModelMode('proposed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                modelMode === 'proposed'
                  ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ConvGRU (Ours)
            </button>
            <button
              onClick={() => setModelMode('baseline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                modelMode === 'baseline'
                  ? 'bg-slate-700 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Single-Frame
            </button>
          </div>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 transition-all"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? 'Pause' : 'Play Sequence'}</span>
          </button>
        </div>
      </div>

      {/* Main Multi-Frame Strip (Image 2 bottom right) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {frames.map((f, idx) => {
          const isSelected = activeFrameIndex === idx;
          const stability = modelMode === 'proposed' ? f.stability : Math.max(0.45, f.stability - (f.occlusionLevel / 100) * 0.4);

          return (
            <div
              key={f.frameId}
              onClick={() => {
                setActiveFrameIndex(idx);
                setIsPlaying(false);
              }}
              className={`p-4 rounded-2xl glass-card cursor-pointer border transition-all ${
                isSelected
                  ? 'border-cyan-400 bg-cyan-950/40 shadow-xl shadow-cyan-500/20 scale-102'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              {/* Thumbnail Header */}
              <div className="flex justify-between items-center text-xs font-bold mb-2">
                <span className={isSelected ? 'text-cyan-300' : 'text-slate-300'}>
                  Frame 0{idx + 1}
                </span>
                <span className="font-mono text-[11px] text-slate-400">{f.timestamp}</span>
              </div>

              {/* Simulated Frame Canvas / Graphic */}
              <div className="relative w-full aspect-video rounded-xl bg-slate-900 overflow-hidden border border-white/10 mb-3 flex items-center justify-center">
                {/* Visual perspective lines */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-950" />
                
                {/* Lane lines on thumbnail */}
                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
                  {/* Left lane */}
                  <path 
                    d="M 25 100 L 48 50" 
                    stroke={
                      modelMode === 'baseline' && f.occlusionLevel > 35 
                        ? 'rgba(239, 68, 68, 0.4)' 
                        : '#06b6d4'
                    }
                    strokeWidth={modelMode === 'baseline' && f.occlusionLevel > 35 ? '1' : '3'}
                    strokeDasharray={modelMode === 'baseline' && f.occlusionLevel > 35 ? '2,2' : undefined}
                  />
                  {/* Right lane */}
                  <path 
                    d="M 75 100 L 52 50" 
                    stroke="#06b6d4" 
                    strokeWidth="3"
                  />
                  {/* Drivable polygon */}
                  <polygon 
                    points="25,100 48,50 52,50 75,100"
                    fill="#10b981"
                    fillOpacity={modelMode === 'baseline' && f.occlusionLevel > 35 ? 0.15 : 0.4}
                  />
                </svg>

                {/* Occlusion / Rain splash overlay */}
                {f.occlusionLevel > 20 && (
                  <div 
                    className="absolute inset-0 bg-cyan-400/10 backdrop-blur-[1px] flex items-center justify-center"
                    style={{ opacity: f.occlusionLevel / 100 }}
                  >
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900/80 text-amber-300">
                      Occlusion: {f.occlusionLevel}%
                    </span>
                  </div>
                )}
              </div>

              {/* Description & Stability Metric */}
              <p className="text-[11px] text-slate-300 mb-2 h-8 overflow-hidden line-clamp-2">
                {f.description}
              </p>

              <div className="flex justify-between items-center text-xs pt-2 border-t border-white/5">
                <span className="text-slate-400">Stability:</span>
                <span className={`font-mono font-bold ${stability > 0.85 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {stability.toFixed(2)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deep-Dive Active Frame Analysis & Memory State Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Frame Detailed View */}
        <div className="lg:col-span-7 glass-card p-6 border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                Step-by-Step Frame Inspection
              </span>
              <h3 className="text-base font-extrabold text-white">
                Frame {currentFrame.frameId} ({currentFrame.timestamp})
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full bg-slate-800 text-xs font-mono text-slate-300 border border-white/10">
              Occlusion: {currentFrame.occlusionLevel}%
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {currentFrame.description}
          </p>

          {/* Comparative Baseline vs ConvGRU Diagnostic */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">Single-Frame Output</div>
              <div className="text-xs font-bold text-rose-400">
                {currentFrame.occlusionLevel > 35 ? '⚠️ Lane Fragmented / Lost' : '✅ Lane Detected'}
              </div>
              <p className="text-[10px] text-slate-400">
                Single-frame detector fails to extrapolate without historical feature cues.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/40 space-y-1">
              <div className="text-[10px] uppercase font-bold text-cyan-300">ConvGRU Memory Output (Ours)</div>
              <div className="text-xs font-bold text-emerald-400">
                🛡️ Continuous Stable Corridor
              </div>
              <p className="text-[10px] text-slate-300">
                Spatial hidden state bridges gap while confidence decays smoothly.
              </p>
            </div>
          </div>
        </div>

        {/* ConvGRU Memory Gate Diagnostics */}
        <div className="lg:col-span-5 glass-card p-6 border border-white/10 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider border-b border-white/10 pb-3">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>ConvGRU Hidden State Metrics</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Update Gate Activation ($z_t$)</span>
                <span className="font-mono text-cyan-400">0.78</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full w-[78%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Reset Gate Activation ($r_t$)</span>
                <span className="font-mono text-purple-400">0.22</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full w-[22%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Temporal Stability Score ($S_t$)</span>
                <span className="font-mono text-emerald-400">{scenario.temporalStability}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-[89%]" />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-white/5 text-[11px] text-slate-300 leading-relaxed">
              <strong className="text-cyan-300">Operational Rule:</strong> The network preserves memory across short perturbations (1-3 frames), but executes calibrated confidence decay if evidence vanishes indefinitely.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

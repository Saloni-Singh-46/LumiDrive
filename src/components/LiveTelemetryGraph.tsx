import React from 'react';
import { Activity, Gauge, TrendingUp, AlertTriangle } from 'lucide-react';

export interface TelemetryDataPoint {
  time: string;
  laneOffsetCm: number;
  curvatureRadiusM: number;
  steeringAngleDeg: number;
  consistencyScore: number;
  fps: number;
}

interface LiveTelemetryGraphProps {
  history: TelemetryDataPoint[];
  currentOffset: number;
  currentCurvature: number;
  currentSteering: number;
  currentScore: number;
}

export const LiveTelemetryGraph: React.FC<LiveTelemetryGraphProps> = ({
  history,
  currentOffset,
  currentCurvature,
  currentSteering,
  currentScore
}) => {
  const maxHistory = 20;
  const recentHistory = history.slice(-maxHistory);

  // Calculate percentage positions for SVG graphs
  // Offset ranges from -30cm to +30cm
  const getOffsetSvgPoints = () => {
    if (recentHistory.length < 2) return '';
    const width = 100;
    const height = 50;
    return recentHistory.map((pt, idx) => {
      const x = (idx / (recentHistory.length - 1)) * width;
      // map -30..+30 to height..0
      const clampedOffset = Math.max(-30, Math.min(30, pt.laneOffsetCm));
      const y = height / 2 - (clampedOffset / 30) * (height / 2 - 4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  };

  // Consistency score ranges from 0.5 to 1.0
  const getConsistencySvgPoints = () => {
    if (recentHistory.length < 2) return '';
    const width = 100;
    const height = 50;
    return recentHistory.map((pt, idx) => {
      const x = (idx / (recentHistory.length - 1)) * width;
      // map 0.5..1.0 to height..0
      const clamped = Math.max(0.5, Math.min(1.0, pt.consistencyScore));
      const y = height - ((clamped - 0.5) / 0.5) * (height - 8) - 4;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  };

  const isSafeDeparture = Math.abs(currentOffset) <= 15;

  return (
    <div className="glass-panel p-5 border border-white/10 rounded-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
          <h3 className="text-sm font-bold text-white tracking-wide">
            Real-Time ADAS Dynamic Telemetry
          </h3>
        </div>
        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
          Live 20-Step Buffer
        </span>
      </div>

      {/* Grid of Key Instantaneous Gauges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Lane Offset Gauge */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
          <div className="text-[10px] text-slate-400 font-medium flex items-center justify-between">
            <span>Center Offset</span>
            {isSafeDeparture ? (
              <span className="text-emerald-400 font-bold">SAFE</span>
            ) : (
              <span className="text-amber-400 font-bold flex items-center gap-0.5">
                <AlertTriangle className="w-2.5 h-2.5" /> DEPART
              </span>
            )}
          </div>
          <div className="text-lg font-mono font-bold text-white flex items-baseline gap-1">
            <span>{currentOffset > 0 ? `+${currentOffset.toFixed(1)}` : currentOffset.toFixed(1)}</span>
            <span className="text-[10px] font-normal text-slate-400">cm</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full relative overflow-hidden">
            {/* Center line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/40" />
            {/* Indicator */}
            <div 
              className={`absolute top-0 bottom-0 rounded-full transition-all duration-200 ${
                isSafeDeparture ? 'bg-cyan-400' : 'bg-amber-400'
              }`}
              style={{
                left: `${Math.max(5, Math.min(95, 50 + (currentOffset / 30) * 50))}%`,
                width: '6px',
                transform: 'translateX(-50%)'
              }}
            />
          </div>
        </div>

        {/* Steering Angle */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
          <div className="text-[10px] text-slate-400 font-medium flex items-center justify-between">
            <span>Steering Angle</span>
            <Gauge className="w-3 h-3 text-cyan-400" />
          </div>
          <div className="text-lg font-mono font-bold text-white flex items-baseline gap-1">
            <span>{currentSteering > 0 ? `+${currentSteering.toFixed(1)}` : currentSteering.toFixed(1)}</span>
            <span className="text-[10px] font-normal text-slate-400">deg (θ)</span>
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            {currentSteering === 0 ? 'Centered' : currentSteering > 0 ? 'Right trim' : 'Left trim'}
          </div>
        </div>

        {/* Curvature Radius */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
          <div className="text-[10px] text-slate-400 font-medium flex items-center justify-between">
            <span>Road Curvature</span>
            <TrendingUp className="w-3 h-3 text-indigo-400" />
          </div>
          <div className="text-lg font-mono font-bold text-white flex items-baseline gap-1">
            <span>{Math.round(currentCurvature)}</span>
            <span className="text-[10px] font-normal text-slate-400">m radius</span>
          </div>
          <div className="text-[10px] text-indigo-300 truncate">
            {currentCurvature > 2000 ? 'Tangent Straight' : currentCurvature > 1000 ? 'Gentle Curve' : 'Tight Arc'}
          </div>
        </div>

        {/* Cross-Task Consistency */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
          <div className="text-[10px] text-slate-400 font-medium flex items-center justify-between">
            <span>CTC Consistency</span>
            <span className="text-emerald-400 font-bold font-mono">{(currentScore * 100).toFixed(0)}%</span>
          </div>
          <div className="text-lg font-mono font-bold text-emerald-400 flex items-baseline gap-1">
            <span>{(currentScore * 100).toFixed(1)}</span>
            <span className="text-[10px] font-normal text-slate-400">/ 100</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(10, currentScore * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Dual Mini Graphs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        {/* Graph 1: Lateral Offset Waveform */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Lateral Offset History (cm)
            </span>
            <span className="text-[10px] font-mono text-slate-500">±30cm bounds</span>
          </div>
          
          <div className="h-16 w-full relative">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 50" preserveAspectRatio="none">
              {/* Center baseline */}
              <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(255,255,255,0.15)" strokeDasharray="2,2" strokeWidth="0.8" />
              {/* Safe bounds corridor */}
              <rect x="0" y="12.5" width="100" height="25" fill="rgba(6,182,212,0.05)" />
              {/* Offset trace line */}
              {recentHistory.length >= 2 && (
                <polyline
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={getOffsetSvgPoints()}
                />
              )}
            </svg>
          </div>
        </div>

        {/* Graph 2: Spatiotemporal Consistency Index */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Cross-Task Stability Index
            </span>
            <span className="text-[10px] font-mono text-slate-500">ConvGRU + CTC</span>
          </div>

          <div className="h-16 w-full relative">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 50" preserveAspectRatio="none">
              {/* Threshold line */}
              <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(16,185,129,0.2)" strokeDasharray="2,2" strokeWidth="0.8" />
              {/* Consistency trace line */}
              {recentHistory.length >= 2 && (
                <polyline
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={getConsistencySvgPoints()}
                />
              )}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { 
  Eye, 
  Layers, 
  Car, 
  Navigation, 
  Flame, 
  Sliders, 
  Check, 
  RotateCcw,
  Sparkles
} from 'lucide-react';

export interface LayerVisibilityState {
  showLanes: boolean;
  showDrivable: boolean;
  showVehicles: boolean;
  showCenterline: boolean;
  showHeatmap: boolean;
  drivableOpacity: number; // 0 to 100
  confidenceThreshold: number; // 50 to 95
  modelMode: 'proposed' | 'baseline';
}

interface LayerControlsProps {
  layers: LayerVisibilityState;
  setLayers: React.Dispatch<React.SetStateAction<LayerVisibilityState>>;
  onReset: () => void;
}

export const LayerControls: React.FC<LayerControlsProps> = ({
  layers,
  setLayers,
  onReset
}) => {
  const toggleLayer = (key: keyof LayerVisibilityState) => {
    setLayers(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="glass-card p-4 space-y-4 border border-white/10">
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Multi-Task Perception Layers</span>
        </div>
        <button
          onClick={onReset}
          className="text-[11px] flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
          title="Reset layer visibility defaults"
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      {/* Model Selection Switcher (Baseline vs Proposed) */}
      <div className="bg-slate-900/90 p-2 rounded-xl border border-white/10">
        <div className="text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
          Inference Architecture
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => setLayers(prev => ({ ...prev, modelMode: 'proposed' }))}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              layers.modelMode === 'proposed'
                ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white bg-slate-800/40'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Proposed (Ours)</span>
          </button>
          <button
            onClick={() => setLayers(prev => ({ ...prev, modelMode: 'baseline' }))}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              layers.modelMode === 'baseline'
                ? 'bg-slate-700 text-white shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-800/40'
            }`}
          >
            <span>Single-Frame Base</span>
          </button>
        </div>
      </div>

      {/* Task Layer Toggles */}
      <div className="space-y-2">
        {/* Lane Boundaries Toggle */}
        <button
          onClick={() => toggleLayer('showLanes')}
          className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all ${
            layers.showLanes
              ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300'
              : 'bg-slate-900/40 border-white/5 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <div className={`w-3 h-3 rounded-full ${layers.showLanes ? 'bg-cyan-400 shadow-sm shadow-cyan-400' : 'bg-slate-600'}`} />
            <span>Lane Boundaries (Cyan Polylines)</span>
          </div>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800">
            {layers.showLanes ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* Drivable Area Toggle */}
        <button
          onClick={() => toggleLayer('showDrivable')}
          className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all ${
            layers.showDrivable
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
              : 'bg-slate-900/40 border-white/5 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <div className={`w-3 h-3 rounded-full ${layers.showDrivable ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-slate-600'}`} />
            <span>Drivable Area (Emerald Polygon)</span>
          </div>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800">
            {layers.showDrivable ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* Vehicle 2D Object Detection Toggle */}
        <button
          onClick={() => toggleLayer('showVehicles')}
          className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all ${
            layers.showVehicles
              ? 'bg-purple-950/40 border-purple-500/50 text-purple-300'
              : 'bg-slate-900/40 border-white/5 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <Car className={`w-3.5 h-3.5 ${layers.showVehicles ? 'text-purple-400' : 'text-slate-600'}`} />
            <span>Vehicle Bounding Boxes (2D Bounding)</span>
          </div>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800">
            {layers.showVehicles ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* Road Centerline & Curvature */}
        <button
          onClick={() => toggleLayer('showCenterline')}
          className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all ${
            layers.showCenterline
              ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
              : 'bg-slate-900/40 border-white/5 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <Navigation className={`w-3.5 h-3.5 ${layers.showCenterline ? 'text-amber-400' : 'text-slate-600'}`} />
            <span>Centerline & Curvature Spline</span>
          </div>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800">
            {layers.showCenterline ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* Uncertainty Heatmap */}
        <button
          onClick={() => toggleLayer('showHeatmap')}
          className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all ${
            layers.showHeatmap
              ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
              : 'bg-slate-900/40 border-white/5 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <Flame className={`w-3.5 h-3.5 ${layers.showHeatmap ? 'text-rose-400' : 'text-slate-600'}`} />
            <span>Uncertainty Heatmap Overlay</span>
          </div>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800">
            {layers.showHeatmap ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>

      {/* Opacity & Confidence Controls */}
      <div className="pt-2 border-t border-white/10 space-y-3">
        <div>
          <div className="flex justify-between text-xs text-slate-300 mb-1">
            <span>Drivable Mask Opacity</span>
            <span className="font-mono text-cyan-400">{layers.drivableOpacity}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={layers.drivableOpacity}
            onChange={(e) => setLayers(prev => ({ ...prev, drivableOpacity: Number(e.target.value) }))}
            className="w-full"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs text-slate-300 mb-1">
            <span>Confidence Threshold</span>
            <span className="font-mono text-cyan-400">{layers.confidenceThreshold}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="95"
            value={layers.confidenceThreshold}
            onChange={(e) => setLayers(prev => ({ ...prev, confidenceThreshold: Number(e.target.value) }))}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

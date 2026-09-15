import React from 'react';
import { 
  BarChart2, 
  MapPin, 
  Gauge, 
  Compass, 
  ShieldCheck, 
  AlertTriangle, 
  Download, 
  FileJson, 
  FileSpreadsheet,
  Activity,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { ScenarioPreset } from '../engine/presetsData';
import { CVAnalysisResult } from '../engine/cvEngine';

interface TelemetryPanelProps {
  scenario: ScenarioPreset;
  customAnalysis: CVAnalysisResult | null;
  onExportJson: () => void;
  onExportCsv: () => void;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({
  scenario,
  customAnalysis,
  onExportJson,
  onExportCsv
}) => {
  // Use custom analysis if available, otherwise use preset ground truth
  const lanes = customAnalysis ? customAnalysis.lanes : scenario.lanes;
  const drivableIoU = customAnalysis ? customAnalysis.drivableIoU : scenario.drivableIoU;
  const drivableCoverage = customAnalysis ? customAnalysis.drivableCoverage : scenario.drivableCoverage;
  const weather = customAnalysis ? customAnalysis.weather : scenario.weather;
  const weatherConfidence = customAnalysis ? customAnalysis.weatherConfidence : scenario.weatherConfidence;
  const telemetry = customAnalysis ? customAnalysis.telemetry : scenario.telemetry;
  const visibility = customAnalysis ? customAnalysis.visibility : scenario.visibility;
  const roadType = customAnalysis ? customAnalysis.roadType : scenario.roadType;
  const timeOfDay = customAnalysis ? customAnalysis.timeOfDay : scenario.timeOfDay;

  const reliabilityColor = 
    telemetry.reliabilityState === 'Reliable' ? 'text-emerald-400 bg-emerald-950/70 border-emerald-500/50' :
    telemetry.reliabilityState === 'Caution' ? 'text-amber-400 bg-amber-950/70 border-amber-500/50' :
    'text-rose-400 bg-rose-950/70 border-rose-500/50';

  return (
    <div className="space-y-4">
      {/* 1. Detection Summary Card (Image 1 top right) */}
      <div className="glass-card p-4 space-y-3 border border-white/10">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
            <BarChart2 className="w-4 h-4 text-cyan-400" />
            <span>Detection Summary</span>
          </div>
          <span className="text-[11px] font-mono text-cyan-400 font-semibold">
            {telemetry.fps} FPS
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center p-2 rounded-lg bg-slate-900/60 border border-white/5">
            <span className="text-slate-400">Lanes Detected</span>
            <span className="font-bold text-white font-mono">{lanes.length}</span>
          </div>

          <div className="flex justify-between items-center p-2 rounded-lg bg-slate-900/60 border border-white/5">
            <span className="text-slate-400">Drivable Area (IoU)</span>
            <span className="font-bold text-emerald-400 font-mono">
              {drivableIoU.toFixed(2)} ({drivableCoverage}% Area)
            </span>
          </div>

          <div className="flex justify-between items-center p-2 rounded-lg bg-slate-900/60 border border-white/5">
            <span className="text-slate-400">Weather Condition</span>
            <span className="font-bold text-cyan-300 font-mono text-right truncate max-w-[150px]">
              {weather}
            </span>
          </div>

          <div className="flex justify-between items-center p-2 rounded-lg bg-slate-900/60 border border-white/5">
            <span className="text-slate-400">Model Confidence</span>
            <span className="font-bold text-purple-400 font-mono">
              {(telemetry.reliabilityScore * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* 2. Scene Information Card (Image 1 bottom right) */}
      <div className="glass-card p-4 space-y-3 border border-white/10">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <span>Scene Information</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-lg bg-slate-900/60 border border-white/5">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Road Type</div>
            <div className="font-bold text-white truncate">{roadType}</div>
          </div>

          <div className="p-2 rounded-lg bg-slate-900/60 border border-white/5">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Time of Day</div>
            <div className="font-bold text-white truncate">{timeOfDay}</div>
          </div>

          <div className="p-2 rounded-lg bg-slate-900/60 border border-white/5">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Visibility Level</div>
            <div className={`font-bold ${visibility === 'Low' ? 'text-amber-400' : 'text-emerald-400'}`}>
              {visibility}
            </div>
          </div>

          <div className="p-2 rounded-lg bg-slate-900/60 border border-white/5">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Latency</div>
            <div className="font-bold text-cyan-400 font-mono">
              {telemetry.processingLatencyMs.toFixed(1)} ms
            </div>
          </div>
        </div>
      </div>

      {/* 3. Autonomous Driving Control Telemetry (Section 9 AV Output Contract) */}
      <div className="glass-card p-4 space-y-3 border border-white/10">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
            <Gauge className="w-4 h-4 text-cyan-400" />
            <span>AV Path & Steering Telemetry</span>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${reliabilityColor}`}>
            {telemetry.reliabilityState}
          </span>
        </div>

        {/* Lateral Offset Gauge */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-slate-300">
            <span>Lateral Lane Offset</span>
            <span className="font-mono font-bold text-cyan-400">
              {telemetry.laneCenterOffsetCm > 0 ? `+${telemetry.laneCenterOffsetCm}` : telemetry.laneCenterOffsetCm} cm
            </span>
          </div>
          {/* Visual Horizontal Center Gauge */}
          <div className="relative w-full h-3 rounded-full bg-slate-900 border border-white/10 overflow-hidden">
            {/* Center mark */}
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-500 z-10" />
            {/* Offset pointer */}
            <div 
              className="absolute top-0 bottom-0 w-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400 transition-all duration-300"
              style={{
                left: `calc(50% + ${(telemetry.laneCenterOffsetCm / 40) * 45}% - 5px)`
              }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 font-mono">
            <span>-40cm (Left)</span>
            <span>Center (0cm)</span>
            <span>+40cm (Right)</span>
          </div>
        </div>

        {/* Curvature & Steering Recommendation */}
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Curvature Radius:</span>
            <span className="font-mono font-bold text-white">
              {telemetry.curvatureDirection} (R={telemetry.curvatureRadiusM}m)
            </span>
          </div>
          <div className="text-[11px] text-emerald-300 font-medium bg-emerald-950/40 p-2 rounded-lg border border-emerald-800/40">
            👉 {telemetry.steeringRecommendation}
          </div>
        </div>

        {/* Export Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={onExportJson}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-white/10 transition-colors"
          >
            <FileJson className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={onExportCsv}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-white/10 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};

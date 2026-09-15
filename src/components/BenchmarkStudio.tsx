import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Cpu, 
  Database, 
  Download, 
  CheckCircle2, 
  Sparkles,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { 
  BENCHMARK_MODELS, 
  ABLATION_STUDY_DATA, 
  DATASET_BENCHMARKS, 
  HARDWARE_LATENCY_DATA 
} from '../engine/benchmarkData';
import { CVAnalysisResult } from '../engine/cvEngine';

interface BenchmarkStudioProps {
  customAnalysis?: CVAnalysisResult | null;
}

export const BenchmarkStudio: React.FC<BenchmarkStudioProps> = ({ customAnalysis }) => {
  const [selectedDatasetTab, setSelectedDatasetTab] = useState<number>(0);
  const [sortField, setSortField] = useState<string>('f1Overall');

  const handleExportCsv = () => {
    const headers = 'Model,Category,F1_Overall,Drivable_IoU,Rain_F1,Fog_F1,Night_F1,Stability,FPS_4090\n';
    const rows = BENCHMARK_MODELS.map(m => 
      `"${m.name}","${m.category}",${m.f1Overall},${m.iouDrivable},${m.f1Rain},${m.f1Fog},${m.f1Night},${m.temporalStability},${m.fpsRtx4090}`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'lumidrive_research_benchmarks.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 border border-white/10 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" /> Quantitative Evaluation
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            Empirical Benchmarks & Ablation Studies
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Controlled experiments comparing reproduced single-frame baselines against our proposed spatiotemporal cross-task framework across CULane, VIL-100, BDD100K, and IDD-AW.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 transition-all flex-shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Export Benchmark CSV</span>
        </button>
      </div>

      {customAnalysis && (
        <div className="glass-card border border-cyan-400/40 bg-cyan-950/10 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" /> Latest Uploaded Scene
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Results below are refreshed from the image or video frame analyzed in the Analyze workspace.
              </p>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-mono font-bold text-emerald-400">
              {customAnalysis.telemetry.reliabilityState}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-slate-900/70 p-3 border border-white/5">
              <span className="block text-[10px] uppercase text-slate-400">Drivable IoU</span>
              <strong className="font-mono text-lg text-cyan-300">{customAnalysis.drivableIoU.toFixed(2)}</strong>
            </div>
            <div className="rounded-xl bg-slate-900/70 p-3 border border-white/5">
              <span className="block text-[10px] uppercase text-slate-400">Lane F1 proxy</span>
              <strong className="font-mono text-lg text-emerald-300">{Math.round(customAnalysis.lanes.reduce((sum, lane) => sum + lane.confidence, 0) / Math.max(customAnalysis.lanes.length, 1) * 100)}%</strong>
            </div>
            <div className="rounded-xl bg-slate-900/70 p-3 border border-white/5">
              <span className="block text-[10px] uppercase text-slate-400">Stability</span>
              <strong className="font-mono text-lg text-amber-300">{customAnalysis.temporalStability.toFixed(2)}</strong>
            </div>
            <div className="rounded-xl bg-slate-900/70 p-3 border border-white/5">
              <span className="block text-[10px] uppercase text-slate-400">Inference FPS</span>
              <strong className="font-mono text-lg text-blue-300">{customAnalysis.telemetry.fps.toFixed(1)}</strong>
            </div>
          </div>
        </div>
      )}

      {/* 1. Step-by-Step Ablation Study Table (Report Section 10) */}
      <div className="glass-card p-6 border border-white/10 space-y-4">
        <div className="flex justify-between items-center border-b border-white/10 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
              Component-Wise Ablation Study (CULane & VIL-100)
            </h3>
            <p className="text-xs text-slate-400">
              Measuring the precise contribution of each added architectural module.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
            Cumulative Gain: +12.2% F1
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono text-[10px] border-b border-white/10">
              <tr>
                <th className="p-3">Ablation Step</th>
                <th className="p-3">Integrated Modules</th>
                <th className="p-3 text-right">Lane F1 (%)</th>
                <th className="p-3 text-right">Drivable IoU (%)</th>
                <th className="p-3 text-right">Stability ($S_t$)</th>
                <th className="p-3 text-right">Calibration Error (ECE)</th>
                <th className="p-3 text-right">Latency (ms)</th>
                <th className="p-3 text-right">Delta F1</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {ABLATION_STUDY_DATA.map((row, idx) => {
                const isFinal = idx === ABLATION_STUDY_DATA.length - 1;
                return (
                  <tr 
                    key={row.step}
                    className={`transition-colors ${
                      isFinal ? 'bg-cyan-950/30 text-cyan-300 font-bold' : 'hover:bg-slate-800/40 text-slate-300'
                    }`}
                  >
                    <td className="p-3 font-mono text-white">{row.step}</td>
                    <td className="p-3">{row.modules}</td>
                    <td className="p-3 text-right font-mono text-white font-bold">{row.f1Score}%</td>
                    <td className="p-3 text-right font-mono text-emerald-400">{row.drivableIoU}%</td>
                    <td className="p-3 text-right font-mono text-cyan-400">{row.stabilityScore}</td>
                    <td className="p-3 text-right font-mono text-purple-400">{row.eceError}</td>
                    <td className="p-3 text-right font-mono">{row.latencyMs} ms</td>
                    <td className="p-3 text-right font-mono text-emerald-400 font-bold">{row.deltaF1}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Comprehensive Model Comparison Matrix */}
      <div className="glass-card p-6 border border-white/10 space-y-4">
        <div className="flex justify-between items-center border-b border-white/10 pb-3">
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
            Adverse Condition Performance Matrix
          </h3>
          <span className="text-xs text-slate-400">Evaluated on 640x360 Monocular Video</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono text-[10px] border-b border-white/10">
              <tr>
                <th className="p-3">Model Architecture</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-right">Overall F1</th>
                <th className="p-3 text-right">Rain F1</th>
                <th className="p-3 text-right">Fog F1</th>
                <th className="p-3 text-right">Night F1</th>
                <th className="p-3 text-right">Occlusion F1</th>
                <th className="p-3 text-right">Transition F1</th>
                <th className="p-3 text-right">Flicker (%)</th>
                <th className="p-3 text-right">RTX 4090 FPS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {BENCHMARK_MODELS.map((m) => {
                const isOurs = m.category === 'Proposed (Ours)';
                return (
                  <tr 
                    key={m.name}
                    className={`transition-colors ${
                      isOurs ? 'bg-gradient-to-r from-cyan-950/40 via-cyan-900/20 to-transparent text-cyan-200 font-bold' : 'hover:bg-slate-800/40 text-slate-300'
                    }`}
                  >
                    <td className="p-3 text-white flex items-center gap-1.5">
                      {isOurs && <Sparkles className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />}
                      <span>{m.name}</span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                        isOurs ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {m.category}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-white font-bold">{m.f1Overall}%</td>
                    <td className="p-3 text-right font-mono text-blue-400">{m.f1Rain}%</td>
                    <td className="p-3 text-right font-mono text-slate-300">{m.f1Fog}%</td>
                    <td className="p-3 text-right font-mono text-amber-400">{m.f1Night}%</td>
                    <td className="p-3 text-right font-mono text-purple-400">{m.f1Occlusion}%</td>
                    <td className="p-3 text-right font-mono text-emerald-400">{m.f1Transition}%</td>
                    <td className="p-3 text-right font-mono text-rose-400">{m.flickerRate}%</td>
                    <td className="p-3 text-right font-mono text-cyan-400 font-bold">{m.fpsRtx4090}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Dataset-Specific Breakdown & Hardware Profiling */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Dataset Breakdown Tabs */}
        <div className="lg:col-span-7 glass-card p-6 border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
              Dataset Sub-Category Gains
            </h3>
            <div className="flex gap-1">
              {DATASET_BENCHMARKS.map((db, idx) => (
                <button
                  key={db.dataset}
                  onClick={() => setSelectedDatasetTab(idx)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedDatasetTab === idx
                      ? 'bg-cyan-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-white bg-slate-800/60'
                  }`}
                >
                  {db.dataset.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs text-slate-300">
              <span className="font-bold">{DATASET_BENCHMARKS[selectedDatasetTab].dataset}</span>
              <span className="text-emerald-400 font-mono font-bold">
                Overall Gain: {DATASET_BENCHMARKS[selectedDatasetTab].gain}
              </span>
            </div>

            <div className="space-y-2">
              {DATASET_BENCHMARKS[selectedDatasetTab].subsets.map((sub) => (
                <div key={sub.name} className="p-3 rounded-xl bg-slate-900/80 border border-white/5 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-white font-medium">{sub.name}</span>
                    <span className="text-emerald-400 font-mono font-bold">
                      {sub.ours}% <span className="text-slate-400 text-[10px]">({sub.gain})</span>
                    </span>
                  </div>
                  {/* Progress Comparison Bar */}
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
                    <div 
                      className="absolute top-0 bottom-0 left-0 bg-slate-600 rounded-full"
                      style={{ width: `${sub.baseline}%` }}
                      title={`Baseline: ${sub.baseline}%`}
                    />
                    <div 
                      className="absolute top-0 bottom-0 left-0 bg-cyan-500 rounded-full opacity-80"
                      style={{ width: `${sub.ours}%` }}
                      title={`Proposed: ${sub.ours}%`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hardware Latency & Embedded Deployment Profiling */}
        <div className="lg:col-span-5 glass-card p-6 border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Real-Time Hardware Profiling</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {HARDWARE_LATENCY_DATA.map((hw) => (
              <div key={hw.device} className="p-3 rounded-xl bg-slate-900/80 border border-white/5 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="font-bold text-white">{hw.device}</span>
                  <span className="font-mono font-bold text-cyan-400">{hw.fps} FPS</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>Latency: {hw.latencyMs} ms</span>
                  <span>VRAM: {hw.memoryMb} MB</span>
                  <span className={hw.realTime === true ? 'text-emerald-400' : 'text-amber-400'}>
                    {hw.realTime === true ? '✅ Real-Time' : hw.realTime === 'Near RT' ? '⚡ Near RT' : '⚠️ Offline'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

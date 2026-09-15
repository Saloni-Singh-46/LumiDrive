import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  FileJson, 
  FileSpreadsheet, 
  Printer, 
  ShieldCheck,
  Code
} from 'lucide-react';
import { ScenarioPreset } from '../engine/presetsData';
import { CVAnalysisResult } from '../engine/cvEngine';

interface ExportTelemetryModalProps {
  onClose: () => void;
  scenario: ScenarioPreset;
  customAnalysis: CVAnalysisResult | null;
  brandName: string;
}

export const ExportTelemetryModal: React.FC<ExportTelemetryModalProps> = ({
  onClose,
  scenario,
  customAnalysis,
  brandName
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'json' | 'csv' | 'report'>('json');

  const lanes = customAnalysis ? customAnalysis.lanes : scenario.lanes;
  const drivablePolygon = customAnalysis ? customAnalysis.drivablePolygon : scenario.drivablePolygon;
  const drivableIoU = customAnalysis ? customAnalysis.drivableIoU : scenario.drivableIoU;
  const telemetry = customAnalysis ? customAnalysis.telemetry : scenario.telemetry;
  const weather = customAnalysis ? customAnalysis.weather : scenario.weather;

  // JSON output following Section 9 AV Contract
  const telemetryJson = {
    system: `${brandName} Multi-Task Road Perception Engine v2.4`,
    timestamp: new Date().toISOString(),
    scene_metadata: {
      scenario_name: scenario.name,
      weather_classification: weather,
      road_type: scenario.roadType,
      visibility_level: scenario.visibility,
      time_of_day: scenario.timeOfDay
    },
    perception_outputs: {
      lanes_detected_count: lanes.length,
      lane_boundaries: lanes.map(l => ({
        id: l.id,
        type: l.type,
        confidence: l.confidence,
        points: l.points
      })),
      drivable_area_segmentation: {
        iou_score: drivableIoU,
        coverage_percentage: scenario.drivableCoverage,
        polygon_vertices: drivablePolygon
      },
      vehicles_detected: (customAnalysis ? customAnalysis.vehicles : scenario.vehicles).map(v => ({
        id: v.id,
        class: v.label,
        confidence: v.confidence,
        bounding_box_pct: v.box
      }))
    },
    control_telemetry: {
      lane_center_offset_cm: telemetry.laneCenterOffsetCm,
      curvature_radius_meters: telemetry.curvatureRadiusM,
      curvature_direction: telemetry.curvatureDirection,
      steering_recommendation: telemetry.steeringRecommendation,
      reliability_score: telemetry.reliabilityScore,
      reliability_status: telemetry.reliabilityState,
      inference_latency_ms: telemetry.processingLatencyMs,
      fps: telemetry.fps
    }
  };

  const jsonString = JSON.stringify(telemetryJson, null, 2);

  const csvString = `Timestamp,Scenario,Weather,Lanes_Count,Drivable_IoU,Offset_Cm,Curvature_M,Curvature_Dir,Reliability_Score,Status,Latency_Ms,FPS\n` +
    `"${telemetryJson.timestamp}","${scenario.name}","${weather}",${lanes.length},${drivableIoU},${telemetry.laneCenterOffsetCm},${telemetry.curvatureRadiusM},"${telemetry.curvatureDirection}",${telemetry.reliabilityScore},"${telemetry.reliabilityState}",${telemetry.processingLatencyMs},${telemetry.fps}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeTab === 'json' ? jsonString : csvString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const isJson = activeTab === 'json';
    const content = isJson ? jsonString : csvString;
    const filename = isJson ? 'lumidrive_telemetry.json' : 'lumidrive_telemetry.csv';
    const type = isJson ? 'application/json' : 'text/csv';

    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-3xl glass-panel border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <FileJson className="w-5 h-5 text-cyan-400" />
            <h3 className="font-extrabold text-base text-white">
              Export Telemetry & Research Logs
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center justify-between pt-3 pb-2">
          <div className="flex gap-1.5 bg-slate-900 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveTab('json')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'json' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              JSON Telemetry
            </button>
            <button
              onClick={() => setActiveTab('csv')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'csv' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              CSV Record
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'report' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Conference Summary
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold border border-white/10 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            {activeTab !== 'report' ? (
              <button
                onClick={handleDownload}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white font-bold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            ) : (
              <button
                onClick={handlePrint}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white font-bold transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / PDF</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 overflow-y-auto mt-2">
          {activeTab === 'json' && (
            <pre className="p-4 rounded-xl bg-slate-950 border border-white/5 text-xs font-mono text-cyan-300 leading-relaxed overflow-x-auto">
              <code>{jsonString}</code>
            </pre>
          )}

          {activeTab === 'csv' && (
            <pre className="p-4 rounded-xl bg-slate-950 border border-white/5 text-xs font-mono text-emerald-300 leading-relaxed overflow-x-auto">
              <code>{csvString}</code>
            </pre>
          )}

          {activeTab === 'report' && (
            <div className="p-6 rounded-xl bg-white text-slate-900 space-y-4 print-only font-sans">
              <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-end">
                <div>
                  <h2 className="text-xl font-black">{brandName} Autonomous Road Perception Report</h2>
                  <p className="text-xs text-slate-600">CVPR / IEEE IV 2026 Research Conference Demo</p>
                </div>
                <div className="text-right text-xs text-slate-600 font-mono">
                  {new Date().toLocaleDateString()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-100 rounded-lg space-y-1">
                  <span className="font-bold text-slate-700 uppercase">Scenario</span>
                  <div className="font-semibold text-slate-900">{scenario.name}</div>
                  <div className="text-slate-600">{weather}</div>
                </div>
                <div className="p-3 bg-slate-100 rounded-lg space-y-1">
                  <span className="font-bold text-slate-700 uppercase">Perception Performance</span>
                  <div className="font-semibold text-slate-900">
                    Lanes: {lanes.length} | Drivable IoU: {drivableIoU}
                  </div>
                  <div className="text-slate-600">
                    Latency: {telemetry.processingLatencyMs}ms ({telemetry.fps} FPS)
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-xs">
                <span className="font-bold text-slate-700 uppercase">AV Path Telemetry</span>
                <p>Lateral Offset: {telemetry.laneCenterOffsetCm} cm</p>
                <p>Curvature: {telemetry.curvatureDirection} (R={telemetry.curvatureRadiusM}m)</p>
                <p>Control Status: {telemetry.reliabilityState} (Score: {telemetry.reliabilityScore})</p>
              </div>

              <p className="text-[10px] text-slate-500 italic pt-2">
                * Research prototype disclaimer: Evaluated on benchmark videos. Safety validation required before physical vehicle actuation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

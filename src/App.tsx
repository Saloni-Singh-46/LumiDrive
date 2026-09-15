import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { HeroSection } from './components/HeroSection';
import { MultiTaskViewer } from './components/MultiTaskViewer';
import { TemporalSequenceViewer } from './components/TemporalSequenceViewer';
import { ArchitectureExplorer } from './components/ArchitectureExplorer';
import { ResearchPapersHub } from './components/ResearchPapersHub';
import { BenchmarkStudio } from './components/BenchmarkStudio';
import { ConferencePresentation } from './components/ConferencePresentation';
import { ExportTelemetryModal } from './components/ExportTelemetryModal';
import { PaperViewerModal } from './components/PaperViewerModal';
import { PRESET_SCENARIOS, ScenarioPreset } from './engine/presetsData';
import { CVAnalysisResult } from './engine/cvEngine';
import { LayerVisibilityState } from './components/LayerControls';
import './styles/index.css';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('analyze');
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [brandName, setBrandName] = useState<'LumiDrive' | 'RoadSight'>('LumiDrive');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('heavy-rain');
  const [customAnalysis, setCustomAnalysis] = useState<CVAnalysisResult | null>(null);

  // Layer Visibility State
  const [layers, setLayers] = useState<LayerVisibilityState>({
    showLanes: true,
    showDrivable: true,
    showVehicles: true,
    showCenterline: true,
    showHeatmap: false,
    drivableOpacity: 70,
    confidenceThreshold: 75,
    modelMode: 'proposed'
  });

  // Modals
  const [showPresentation, setShowPresentation] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showPaperModal, setShowPaperModal] = useState<boolean>(false);

  // Active scenario preset
  const selectedScenario: ScenarioPreset = 
    PRESET_SCENARIOS.find(p => p.id === selectedPresetId) || PRESET_SCENARIOS[0];

  // Theme attribute update
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const isLumiDrive = brandName === 'LumiDrive';

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        toggleTheme={toggleTheme}
        brandName={brandName}
        setBrandName={setBrandName}
        onOpenPresentation={() => setShowPresentation(true)}
        onOpenPaperModal={() => setShowPaperModal(true)}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex max-w-[1720px] w-full mx-auto">
        {/* Left Vertical Sidebar (Shown in LumiDrive mode like Mockup 1) */}
        {isLumiDrive && (
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            brandName={brandName}
            onOpenExport={() => setShowExportModal(true)}
            onOpenPresentation={() => setShowPresentation(true)}
            onOpenPaperModal={() => setShowPaperModal(true)}
          />
        )}

        {/* Main Content Workspace */}
        <main className={`flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto ${isLumiDrive ? 'max-w-[1460px]' : 'max-w-[1520px] mx-auto'}`}>
          {/* View 1: Main Analyze Lab (Mockup 1 & Mockup 2) */}
          {activeTab === 'analyze' && (
            <div className="space-y-6 animate-fade-in">
              {/* Hero Banner with Mountain / Rainy Road graphic */}
              <HeroSection
                selectedPreset={selectedScenario}
                onSelectPreset={(id) => {
                  setSelectedPresetId(id);
                  setCustomAnalysis(null);
                }}
                presets={PRESET_SCENARIOS}
                brandName={brandName}
              />

              {/* Main Perception Section (3-column in LumiDrive / 2-column in RoadSight) */}
              <MultiTaskViewer
                scenario={selectedScenario}
                layers={layers}
                customAnalysis={customAnalysis}
                setCustomAnalysis={setCustomAnalysis}
                brandName={brandName}
              />
            </div>
          )}

          {/* View 2: Gallery & Spatiotemporal Sequence Analyzer */}
          {activeTab === 'temporal' && (
            <div className="animate-fade-in">
              <TemporalSequenceViewer scenario={selectedScenario} customAnalysis={customAnalysis} />
            </div>
          )}

          {/* View 3: Architecture & Mathematical Formulation */}
          {activeTab === 'architecture' && (
            <div className="animate-fade-in">
              <ArchitectureExplorer />
            </div>
          )}

          {/* View 4: Academic Literature Matrix & Research Papers Hub */}
          {activeTab === 'papers' && (
            <div className="animate-fade-in">
              <ResearchPapersHub />
            </div>
          )}

          {/* View 5: Empirical Benchmarks & Ablation Studio */}
          {activeTab === 'benchmarks' && (
            <div className="animate-fade-in">
              <BenchmarkStudio customAnalysis={customAnalysis} />
            </div>
          )}
        </main>
      </div>

      {/* Footer matching Mockups */}
      <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-6 lg:px-10 py-4 text-xs text-[var(--text-secondary)] flex flex-col sm:flex-row items-center justify-between gap-3">
        {isLumiDrive ? (
          <>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-sm">LumiDrive</span>
              <span>© 2026 University Research Project | Multi-Task Road Perception</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <button onClick={() => setShowPaperModal(true)} className="hover:text-cyan-400">Paper</button>
              <span>|</span>
              <a href="#contact" onClick={(e) => { e.preventDefault(); setShowPaperModal(true); }} className="hover:text-cyan-400">Contact</a>
              <span>|</span>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-cyan-400">GitHub</a>
              <span>|</span>
              <button onClick={() => setShowPresentation(true)} className="hover:text-cyan-400">Privacy</button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-sm">RoadSight</span>
              <span className="text-slate-500">|</span>
              <span>Research prototype • Computer Vision • Road Perception</span>
            </div>
            <div className="text-slate-400">
              Built for a safer and more reliable tomorrow.
            </div>
          </>
        )}
      </footer>

      {/* Fullscreen Conference Presentation Modal */}
      {showPresentation && (
        <ConferencePresentation
          onClose={() => setShowPresentation(false)}
          brandName={brandName}
        />
      )}

      {/* IEEE Paper Manuscript Modal */}
      {showPaperModal && (
        <PaperViewerModal
          onClose={() => setShowPaperModal(false)}
          brandName={brandName}
        />
      )}

      {/* Export Telemetry & Logs Modal */}
      {showExportModal && (
        <ExportTelemetryModal
          onClose={() => setShowExportModal(false)}
          scenario={selectedScenario}
          customAnalysis={customAnalysis}
          brandName={brandName}
        />
      )}
    </div>
  );
};

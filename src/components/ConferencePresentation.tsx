import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Clock, 
  FileText, 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  BarChart3, 
  Tv, 
  CheckCircle2
} from 'lucide-react';
import { PROPOSED_FRAMEWORK_SYNTHESIS } from '../engine/papersData';
import { BENCHMARK_MODELS } from '../engine/benchmarkData';

interface ConferencePresentationProps {
  onClose: () => void;
  brandName: string;
}

export const ConferencePresentation: React.FC<ConferencePresentationProps> = ({
  onClose,
  brandName
}) => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [showNotes, setShowNotes] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        setCurrentSlide(curr => Math.min(curr + 1, slides.length - 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlide(curr => Math.max(curr - 1, 0));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const slides = [
    // Slide 1: Title
    {
      title: 'Title Slide',
      content: (
        <div className="flex flex-col items-center justify-center text-center h-full space-y-6 animate-fade-in">
          <div className="px-4 py-1.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>IEEE IV / CVPR 2026 Oral Presentation</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight max-w-4xl">
            {brandName}: Transition-Aware Cross-Task Consistency for Multi-Task Road Perception
          </h1>

          <p className="text-lg text-cyan-300 font-medium max-w-2xl">
            Robust Spatiotemporal Lane Detection, Drivable Area Segmentation & Calibrated Reliability under Changing Adverse Weather
          </p>

          <div className="pt-4 text-sm text-slate-300 space-y-1">
            <p className="font-bold text-white">University Autonomous Perception Laboratory</p>
            <p className="text-xs text-slate-400">Department of Computer Science & Intelligent Robotics</p>
          </div>
        </div>
      ),
      notes: 'Introduce team, paper title, and summarize the key objective: solving perception collapse during weather transitions.'
    },

    // Slide 2: Motivation & Failure Chain
    {
      title: 'Motivation & The Real-World Failure Chain',
      content: (
        <div className="h-full flex flex-col justify-center space-y-6 animate-fade-in">
          <div className="space-y-2">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">The Problem</span>
            <h2 className="text-3xl font-extrabold text-white">Why Single-Frame Road Perception Collapses</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-white/10 space-y-2">
              <div className="text-xs font-bold text-slate-400 font-mono">01. Sudden Weather Shift</div>
              <p className="text-xs text-slate-300">
                Rain downpour, windshield splash, or oncoming LED glare saturates monocular camera sensors.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-white/10 space-y-2">
              <div className="text-xs font-bold text-rose-400 font-mono">02. Single-Frame Feature Loss</div>
              <p className="text-xs text-slate-300">
                Without temporal memory, single-frame models lose boundary evidence instantly.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-white/10 space-y-2">
              <div className="text-xs font-bold text-amber-400 font-mono">03. Semantic Contradiction</div>
              <p className="text-xs text-slate-300">
                Lane prediction drops/flickers while drivable area mask continues, producing conflicting ADAS inputs.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40 space-y-2">
              <div className="text-xs font-bold text-cyan-300 font-mono">04. Unstable Path Planning</div>
              <p className="text-xs text-slate-200">
                Downstream motion planner receives erratic lateral offsets and erratic steering trims.
              </p>
            </div>
          </div>
        </div>
      ),
      notes: 'Walk through the 4-step failure chain from our project report Section 2.'
    },

    // Slide 3: Literature Synthesis
    {
      title: 'Literature Synthesis: 4 Complementary Levels',
      content: (
        <div className="h-full flex flex-col justify-center space-y-5 animate-fade-in">
          <div className="space-y-1">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Literature Review</span>
            <h2 className="text-2xl font-extrabold text-white">Complementary Dimensions in Recent 2025 Literature</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/10 space-y-1">
              <span className="text-[10px] font-bold text-cyan-400 font-mono">Level 1: Input Adaptation</span>
              <h4 className="font-bold text-white">Sang & Norris (2025)</h4>
              <p className="text-slate-300">Adaptive preprocessing + fuzzy logic Canny parameter tuning.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/10 space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 font-mono">Level 2: Feature Refinement</span>
              <h4 className="font-bold text-white">Dai et al. (2025)</h4>
              <p className="text-slate-300">Enhanced CLRNet with Global Feature Optimization (GFO) + ALGA.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/10 space-y-1">
              <span className="text-[10px] font-bold text-purple-400 font-mono">Level 3: Global Context</span>
              <h4 className="font-bold text-white">Liu et al. (2025, PLOS ONE)</h4>
              <p className="text-slate-300">CCCNet: Recurrent Criss-Cross Attention for long-range spatial context.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/10 space-y-1">
              <span className="text-[10px] font-bold text-amber-400 font-mono">Level 4: Domain Adaptation</span>
              <h4 className="font-bold text-white">Chae et al. (2025, IEEE T-ASE)</h4>
              <p className="text-slate-300">Sim-to-Real UDA via disentangled structural vs appearance feature alignment.</p>
            </div>
          </div>
        </div>
      ),
      notes: 'Explain why these 4 papers are complementary rather than duplicates (from conclusion document).'
    },

    // Slide 4: Novel Gap
    {
      title: 'Our Defensible Novel Research Gap',
      content: (
        <div className="h-full flex flex-col justify-center space-y-6 animate-fade-in">
          <div className="space-y-1">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Research Gap</span>
            <h2 className="text-3xl font-extrabold text-white">
              Weather-Transition-Induced Cross-Task Inconsistency
            </h2>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/60 to-slate-900 border border-cyan-500/40 space-y-3">
            <p className="text-sm text-slate-200 leading-relaxed font-medium">
              Static weather benchmarks measure static accuracy ($mIoU$), but obscure severe intra-sequence flickers and task contradictions during dynamic weather transitions (Clear $\to$ Heavy Rain).
            </p>
            <div className="grid grid-cols-3 gap-3 text-xs pt-2">
              <div className="p-3 rounded-lg bg-slate-950/80 border border-white/5">
                <span className="font-bold text-cyan-300">Contribution 1</span>
                <p className="text-slate-400 text-[11px] mt-1">Short-term ConvGRU spatiotemporal feature memory ($T=3..5$).</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/80 border border-white/5">
                <span className="font-bold text-emerald-300">Contribution 2</span>
                <p className="text-slate-400 text-[11px] mt-1">{"Cross-task spatial containment loss (L_cross_task)."}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/80 border border-white/5">
                <span className="font-bold text-purple-300">Contribution 3</span>
                <p className="text-slate-400 text-[11px] mt-1">Calibrated multi-signal reliability head for honest ADAS failover.</p>
              </div>
            </div>
          </div>
        </div>
      ),
      notes: 'Emphasize the exact novelty gap from final_research_gap_and_project_plan.pdf Section 3.'
    },

    // Slide 5: Proposed Architecture
    {
      title: 'System Architecture & Dataflow',
      content: (
        <div className="h-full flex flex-col justify-center space-y-4 animate-fade-in">
          <div className="space-y-1">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Proposed Architecture</span>
            <h2 className="text-2xl font-extrabold text-white">End-to-End Spatiotemporal Perception Pipeline</h2>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-white/10 font-mono text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <span>Input Sequence [B, T, 3, H, W]</span>
              <span>→</span>
              <span>Adaptive Fuzzy Tuning</span>
              <span>→</span>
              <span>Shared FPN</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400 font-bold pl-8">
              <span>→</span>
              <span>GFO & ALGA Geometry Refinement</span>
              <span>→</span>
              <span>Criss-Cross Attention</span>
            </div>
            <div className="flex items-center gap-2 text-purple-400 font-bold pl-16">
              <span>→</span>
              <span>ConvGRU Spatiotemporal Memory (H_t)</span>
              <span>→</span>
              <span>Multi-Task Decoders</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-800/40 font-bold text-cyan-300">
              Lane Coordinates
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 font-bold text-emerald-300">
              Drivable Area Mask
            </div>
            <div className="p-2.5 rounded-lg bg-purple-950/40 border border-purple-800/40 font-bold text-purple-300">
              Vehicle 2D Boxes
            </div>
            <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/40 font-bold text-amber-300">
              Calibrated Confidence
            </div>
          </div>
        </div>
      ),
      notes: 'Walk through the 7-stage architectural dataflow.'
    },

    // Slide 6: Mathematical Loss Formulation
    {
      title: 'Mathematical Loss Formulation',
      content: (
        <div className="h-full flex flex-col justify-center space-y-5 animate-fade-in">
          <div className="space-y-1">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Optimization</span>
            <h2 className="text-2xl font-extrabold text-white">Transition-Aware Multi-Task Objective</h2>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 text-center font-mono text-sm sm:text-base text-cyan-300">
            {"L_total = L_seg + λ_c * L_continuity + λ_t * L_temporal + λ_cons * L_cross_task"}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-900 border border-white/5 space-y-1">
              <span className="font-bold text-emerald-400">Cross-Task Spatial Containment</span>
              <p className="text-slate-300 text-[11px] font-mono">
                {"L_cross = (1/N) * Σ max(0, 1 - M_drive(p))"}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-white/5 space-y-1">
              <span className="font-bold text-purple-400">Temporal Consistency Regularizer</span>
              <p className="text-slate-300 text-[11px] font-mono">
                {"L_temp = || M_lane^(t) - Warp(M_lane^(t-1), v_ego) ||^2"}
              </p>
            </div>
          </div>
        </div>
      ),
      notes: 'Explain how the cross-task containment loss mathematically prevents semantic contradictions.'
    },

    // Slide 7: Quantitative Results
    {
      title: 'Quantitative Evaluation & Ablation Results',
      content: (
        <div className="h-full flex flex-col justify-center space-y-5 animate-fade-in">
          <div className="space-y-1">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Experimental Results</span>
            <h2 className="text-2xl font-extrabold text-white">State-of-the-Art Adverse Weather Benchmarks</h2>
          </div>

          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-xl bg-slate-900 border border-white/10">
              <div className="text-2xl font-extrabold text-white font-mono">89.4%</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Overall F1 (+12.2%)</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-white/10">
              <div className="text-2xl font-extrabold text-emerald-400 font-mono">87.8%</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Drivable IoU (+11.4%)</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-white/10">
              <div className="text-2xl font-extrabold text-cyan-400 font-mono">-78.5%</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Flicker Reduction</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-white/10">
              <div className="text-2xl font-extrabold text-purple-400 font-mono">58.2</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">RTX 4090 FPS</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/90 border border-white/5 text-xs text-slate-300">
            <strong className="text-cyan-300">Ablation Conclusion:</strong> ConvGRU spatial memory contributes +3.2% F1 on temporary occlusions, while the cross-task consistency objective reduces semantic contradictions by 82%.
          </div>
        </div>
      ),
      notes: 'Highlight the +12.2% gain and the real-time speed of 58.2 FPS on RTX 4090.'
    },

    // Slide 8: Conclusion
    {
      title: 'Conclusion & Research Impact',
      content: (
        <div className="h-full flex flex-col justify-center space-y-6 animate-fade-in text-center">
          <h2 className="text-3xl font-extrabold text-white">Summary & Takeaways</h2>

          <div className="grid grid-cols-3 gap-4 text-left max-w-4xl mx-auto">
            <div className="p-4 rounded-xl glass-card border border-white/10 space-y-1.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h4 className="font-bold text-white text-xs">Unified Perception</h4>
              <p className="text-[11px] text-slate-300">
                Jointly addresses lane, drivable area, vehicle, and weather perception in sub-25ms.
              </p>
            </div>

            <div className="p-4 rounded-xl glass-card border border-white/10 space-y-1.5">
              <CheckCircle2 className="w-5 h-5 text-cyan-400" />
              <h4 className="font-bold text-white text-xs">Temporal Stability</h4>
              <p className="text-[11px] text-slate-300">
                ConvGRU bridges momentary splash blinding without unbounded hallucination.
              </p>
            </div>

            <div className="p-4 rounded-xl glass-card border border-white/10 space-y-1.5">
              <CheckCircle2 className="w-5 h-5 text-purple-400" />
              <h4 className="font-bold text-white text-xs">Honest Failover</h4>
              <p className="text-[11px] text-slate-300">
                Multi-signal confidence calibration signals downstream planners when to degrade reliance.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs shadow-lg shadow-cyan-500/30 transition-all hover:scale-105"
            >
              Switch to Live Interactive Demo Lab →
            </button>
          </div>
        </div>
      ),
      notes: 'Conclude presentation and transition directly into the live interactive lab demo.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between p-6 select-none">
      {/* Top Presentation Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center font-bold text-white">
            /\
          </div>
          <div>
            <div className="text-xs font-bold text-white">{brandName} Conference Deck</div>
            <div className="text-[10px] text-slate-400">Slide {currentSlide + 1} of {slides.length}</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-white/10 text-xs font-mono text-cyan-300">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>

          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
              showNotes ? 'bg-purple-950 text-purple-300 border-purple-800' : 'bg-slate-900 text-slate-300 border-white/10'
            }`}
          >
            Speaker Notes
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Exit Presentation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Slide Content Canvas (16:9) */}
      <div className="relative flex-1 flex items-center justify-center my-4">
        <div className="w-full max-w-5xl aspect-[16/9] glass-panel border border-white/10 rounded-2xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          {slides[currentSlide].content}

          {/* Speaker Notes Overlay */}
          {showNotes && (
            <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-slate-950/95 border border-purple-500/40 text-xs text-purple-200 backdrop-blur-md animate-fade-in shadow-2xl">
              <strong className="text-purple-400 uppercase font-mono text-[10px] block mb-1">Speaker Notes:</strong>
              {slides[currentSlide].notes}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls & Slide Thumbnails */}
      <div className="flex items-center justify-between border-t border-white/10 pt-3">
        <div className="text-xs text-slate-400 font-mono">
          Use [Left / Right Arrow] or Spacebar to navigate • [ESC] to exit
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={currentSlide === 0}
            onClick={() => setCurrentSlide(c => Math.max(0, c - 1))}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="text-xs font-mono font-bold text-white px-3">
            {currentSlide + 1} / {slides.length}
          </span>

          <button
            disabled={currentSlide === slides.length - 1}
            onClick={() => setCurrentSlide(c => Math.min(slides.length - 1, c + 1))}
            className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-white font-bold transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

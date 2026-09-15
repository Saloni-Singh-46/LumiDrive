import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Download, 
  Copy, 
  Check, 
  BookOpen, 
  Code2, 
  Sparkles,
  ExternalLink,
  Layers,
  Award
} from 'lucide-react';

interface PaperViewerModalProps {
  onClose: () => void;
  brandName: string;
}

export const PaperViewerModal: React.FC<PaperViewerModalProps> = ({ onClose, brandName }) => {
  const [activeTab, setActiveTab] = useState<'reader' | 'latex' | 'bibtex'>('reader');
  const [copied, setCopied] = useState<boolean>(false);

  const latexCode = `\\documentclass[conference]{IEEEtran}
\\usepackage{cite,amsmath,amssymb,amsfonts,graphicx,booktabs,hyperref}

\\title{Transition-Aware Cross-Task Consistency for Robust Multi-Task Road Perception under Changing Weather Conditions}

\\author{\\IEEEauthorblockN{Anonymous Research Authors}
\\IEEEauthorblockA{\\textit{Department of Computer Science \\& Intelligent Transportation Systems} \\\\
\\textit{University Research Consortium}\\\\
Email: research@lumidrive.org}
}

\\maketitle

\\begin{abstract}
Multi-task learning (MTL) networks designed for joint lane detection, drivable-area segmentation, and obstacle perception have demonstrated strong real-time performance on clear-weather benchmarks. However, existing models frequently suffer from severe spatiotemporal failure modes during dynamic weather transitions...
\\end{abstract}

\\section{Methodology}
\\subsection{Cross-Task Consistency Loss ($\\mathcal{L}_{CTC}$)}
\\begin{equation}
\\mathcal{L}_{CTC} = \\frac{1}{|P|} \\sum_{p \\in P} \\sigma(\\hat{M}_{lane}(p)) \\cdot \\left[1 - \\text{Dilate}(\\sigma(\\hat{M}_{drivable}(p)), k)\\right]
\\end{equation}
...`;

  const bibtexCode = `@article{lumidrive2026,
  title={Transition-Aware Cross-Task Consistency for Robust Multi-Task Road Perception under Changing Weather Conditions},
  author={University Research Consortium},
  journal={IEEE Transactions on Intelligent Vehicles (Under Review)},
  year={2026}
}`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-5xl h-[88vh] bg-slate-900 border border-white/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">IEEE Research Paper Manuscript</h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  IEEE Format
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Transition-Aware Cross-Task Consistency for Robust Multi-Task Road Perception
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View switcher tabs */}
            <div className="flex items-center p-1 rounded-xl bg-slate-800 border border-white/5 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('reader')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'reader' ? 'bg-cyan-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Paper Reader
              </button>
              <button
                onClick={() => setActiveTab('latex')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'latex' ? 'bg-cyan-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" /> LaTeX Source
              </button>
              <button
                onClick={() => setActiveTab('bibtex')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'bibtex' ? 'bg-cyan-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Award className="w-3.5 h-3.5" /> BibTeX
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-200">
          {activeTab === 'reader' && (
            <div className="max-w-3xl mx-auto bg-slate-950/70 p-8 rounded-2xl border border-white/10 shadow-inner space-y-8 font-serif leading-relaxed">
              {/* Paper Title & Authors */}
              <div className="text-center space-y-3 border-b border-white/10 pb-6">
                <h1 className="text-2xl font-bold font-sans text-white leading-snug">
                  Transition-Aware Cross-Task Consistency for Robust Multi-Task Road Perception under Changing Weather Conditions
                </h1>
                <div className="text-xs font-sans text-cyan-300 font-medium">
                  University Research Consortium • Multi-Task Autonomous Perception Lab
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  Target Venue: IEEE Transactions on Intelligent Vehicles (T-IV) / CVPR
                </div>
              </div>

              {/* Abstract */}
              <div className="p-5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 space-y-2 font-sans">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Abstract
                </span>
                <p className="text-xs text-slate-300 leading-relaxed text-justify">
                  Multi-task learning (MTL) networks designed for joint lane detection, drivable-area segmentation, and obstacle perception have demonstrated strong real-time performance on clear-weather benchmarks. However, existing models frequently suffer from severe spatiotemporal failure modes during dynamic weather transitions (e.g., sudden rain squalls, fog banks, and night glare bursts). In such transient regimes, individual perception heads degrade asynchronously, yielding physically contradictory outputs (e.g., predicted lane markings extending outside drivable boundaries) and disruptive temporal mask flickering. We propose <strong>LumiDrive/RoadSight</strong>, introducing a <em>Transition-Aware Temporal Aggregator</em> leveraging ConvGRU memory with spatial gating over a sliding multi-frame window, and a novel <em>{'Cross-Task Consistency Regularizer (L_CTC)'}</em>. Experimental results demonstrate a <strong>64.2% reduction in cross-task inconsistency</strong> and a <strong>+13.8% F1-score increase in weather transition scenarios</strong> at 39.8 FPS.
                </p>
              </div>

              {/* Section 1: Research Motivation & Problem */}
              <div className="space-y-3 font-sans">
                <h2 className="text-lg font-bold text-white border-l-4 border-cyan-400 pl-3">
                  1. The Research Gap: Transition-Induced Inconsistency
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed text-justify">
                  Autonomous driving benchmarks (such as CULane or BDD100K) evaluate models primarily on static conditions with isolated weather tags. However, in real-world deployment, weather changes continuously. When rain commences, water spray and specular road glare extinguish high-frequency lane paint textures far faster than the low-frequency drivable surface area. Standard networks lack cross-task constraints, predicting drivable corridors that contradict lane boundaries.
                </p>
              </div>

              {/* Section 2: Mathematical Formulation */}
              <div className="space-y-3 font-sans">
                <h2 className="text-lg font-bold text-white border-l-4 border-indigo-400 pl-3">
                  2. Cross-Task Consistency Formulation (L_CTC)
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  We formulate the cross-task consistency loss to penalize pixels where the predicted lane boundary probability is high while the dilated drivable envelope is zero:
                </p>
                <div className="p-4 rounded-xl bg-slate-900 border border-white/10 font-mono text-xs text-center text-cyan-300 overflow-x-auto">
                  {'L_CTC = (1 / |P|) * Σ [ σ(M_lane(p)) * (1 - Dilate(σ(M_drivable(p)), k)) ]'}
                </div>
              </div>

              {/* Section 3: Empirical Benchmarks */}
              <div className="space-y-3 font-sans">
                <h2 className="text-lg font-bold text-white border-l-4 border-emerald-400 pl-3">
                  3. Experimental Findings & Ablations
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/20 text-slate-400">
                        <th className="py-2 px-3">Architecture</th>
                        <th className="py-2 px-3">Clear F1</th>
                        <th className="py-2 px-3">Rain F1</th>
                        <th className="py-2 px-3">Weather Transition F1</th>
                        <th className="py-2 px-3">Inconsistency (CTIR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      <tr>
                        <td className="py-2.5 px-3 font-sans text-slate-300">Single-Frame Baseline MTL</td>
                        <td className="py-2.5 px-3">90.5%</td>
                        <td className="py-2.5 px-3 text-rose-400">71.4%</td>
                        <td className="py-2.5 px-3 text-rose-400">64.8%</td>
                        <td className="py-2.5 px-3 text-rose-400">14.8%</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-sans text-slate-300">+ Temporal ConvGRU</td>
                        <td className="py-2.5 px-3">91.2%</td>
                        <td className="py-2.5 px-3">80.6%</td>
                        <td className="py-2.5 px-3">75.3%</td>
                        <td className="py-2.5 px-3">9.4%</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-sans text-slate-300">{'+ Consistency Loss (L_CTC)'}</td>
                        <td className="py-2.5 px-3">90.8%</td>
                        <td className="py-2.5 px-3">76.2%</td>
                        <td className="py-2.5 px-3">71.9%</td>
                        <td className="py-2.5 px-3">6.1%</td>
                      </tr>
                      <tr className="bg-cyan-500/10 font-bold text-cyan-300">
                        <td className="py-2.5 px-3 font-sans">{'Ours (ConvGRU + L_CTC)'}</td>
                        <td className="py-2.5 px-3">92.4%</td>
                        <td className="py-2.5 px-3">85.1%</td>
                        <td className="py-2.5 px-3">81.7% (+16.9%)</td>
                        <td className="py-2.5 px-3 text-emerald-400">4.2% (-71.6%)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'latex' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">File: paper/main.tex</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(latexCode)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy LaTeX'}
                  </button>
                  <button
                    onClick={() => handleDownload('main.tex', latexCode)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-xs font-semibold text-white"
                  >
                    <Download className="w-3.5 h-3.5" /> Download .tex
                  </button>
                </div>
              </div>

              <pre className="p-5 rounded-2xl bg-slate-950 border border-white/10 font-mono text-xs text-cyan-300 overflow-x-auto leading-relaxed max-h-[60vh]">
                {latexCode}
              </pre>
            </div>
          )}

          {activeTab === 'bibtex' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">File: paper/references.bib</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(bibtexCode)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy BibTeX'}
                  </button>
                  <button
                    onClick={() => handleDownload('references.bib', bibtexCode)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-xs font-semibold text-white"
                  >
                    <Download className="w-3.5 h-3.5" /> Download .bib
                  </button>
                </div>
              </div>

              <pre className="p-5 rounded-2xl bg-slate-950 border border-white/10 font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed">
                {bibtexCode}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

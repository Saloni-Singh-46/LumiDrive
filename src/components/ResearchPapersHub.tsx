import React, { useState } from 'react';
import { 
  FileText, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles,
  ShieldCheck,
  Search,
  Filter
} from 'lucide-react';
import { RESEARCH_PAPERS, PROPOSED_FRAMEWORK_SYNTHESIS } from '../engine/papersData';

export const ResearchPapersHub: React.FC = () => {
  const [selectedPaperId, setSelectedPaperId] = useState<string>(RESEARCH_PAPERS[0].id);
  const [copiedBibtex, setCopiedBibtex] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const activePaper = RESEARCH_PAPERS.find(p => p.id === selectedPaperId) || RESEARCH_PAPERS[0];

  const filteredPapers = RESEARCH_PAPERS.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.authors.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.noveltyScore.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const bibtexString = `@article{${activePaper.id.replace(/-/g, '_')},
  title = {${activePaper.title}},
  author = {${activePaper.authors}},
  journal = {${activePaper.venue}},
  year = {${activePaper.year}},
  doi = {${activePaper.doi || '10.xxxx/xxxx'}}
}`;

  const handleCopyBibtex = () => {
    navigator.clipboard.writeText(bibtexString);
    setCopiedBibtex(true);
    setTimeout(() => setCopiedBibtex(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 border border-white/10 rounded-2xl">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
          <BookOpen className="w-4 h-4" /> Academic Literature Matrix
        </div>
        <h2 className="text-2xl font-extrabold text-white">
          Foundation Papers & Novel Research Gap Analysis
        </h2>
        <p className="text-xs text-slate-300 mt-1 max-w-3xl">
          Comprehensive synthesis of four landmark 2025 research papers, identifying why combining adaptive input tuning, geometry-guided FPN, global attention, and temporal cross-task consistency produces state-of-the-art adverse weather perception.
        </p>
      </div>

      {/* Literature Matrix Table Overview */}
      <div className="glass-card p-6 border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
            Comparative Literature Matrix
          </h3>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search papers, techniques..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-full sm:w-64"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {filteredPapers.map((paper, idx) => {
            const isSelected = selectedPaperId === paper.id;
            return (
              <div
                key={paper.id}
                onClick={() => setSelectedPaperId(paper.id)}
                className={`p-4 rounded-xl glass-card cursor-pointer border transition-all ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-950/40 shadow-xl shadow-cyan-500/20 scale-102'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex justify-between items-center text-[10px] font-mono text-cyan-400 font-bold mb-1">
                  <span>Paper 0{idx + 1} ({paper.year})</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {paper.noveltyScore}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-white mb-2 line-clamp-2">
                  {paper.shortTitle}
                </h4>

                <p className="text-[11px] text-slate-400 font-medium mb-3">
                  {paper.authors} • <span className="italic">{paper.venue}</span>
                </p>

                <p className="text-[11px] text-slate-300 line-clamp-3 bg-slate-900/60 p-2 rounded-lg border border-white/5">
                  {paper.mainContribution}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Active Paper Deep Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Full Analysis */}
        <div className="lg:col-span-8 glass-card p-6 border border-white/10 space-y-5">
          <div className="space-y-2 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                {activePaper.noveltyScore}
              </span>
              <span className="text-xs text-slate-400">{activePaper.venue} ({activePaper.year})</span>
            </div>
            <h3 className="text-lg font-extrabold text-white">
              {activePaper.title}
            </h3>
            <p className="text-xs text-cyan-400 font-semibold">
              By {activePaper.authors}
            </p>
          </div>

          {/* Core Problem & Contribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 space-y-1.5">
              <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                Target Problem
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {activePaper.coreProblem}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-800/40 space-y-1.5">
              <div className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
                Main Research Contribution
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {activePaper.mainContribution}
              </p>
            </div>
          </div>

          {/* Key Techniques & System Integration */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wide">
              Key Algorithmic Techniques:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activePaper.keyTechniques.map((tech, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-slate-900/60 border border-white/5 text-xs text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                  <span>{tech}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Integration in LumiDrive / RoadSight */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 to-slate-900/80 border border-cyan-800/40 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Integration into Our Proposed Framework</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              {activePaper.integrationInOurSystem}
            </p>
          </div>
        </div>

        {/* Right Column: Strengths, Limitations & BibTeX Citation */}
        <div className="lg:col-span-4 space-y-4">
          {/* Strengths Card */}
          <div className="glass-card p-4 border border-white/10 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" /> Strengths
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {activePaper.strengths.map((s, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Limitations Card */}
          <div className="glass-card p-4 border border-white/10 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <AlertCircle className="w-4 h-4" /> Limitations / Remaining Gap
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {activePaper.limitations.map((lim, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">!</span>
                  <span>{lim}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* BibTeX Citation Box */}
          <div className="glass-card p-4 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wide">
                BibTeX Citation
              </span>
              <button
                onClick={handleCopyBibtex}
                className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono transition-colors"
              >
                {copiedBibtex ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedBibtex ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-2.5 rounded-lg bg-slate-950 border border-white/5 text-[10px] font-mono text-slate-400 overflow-x-auto">
              <code>{bibtexString}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* Synthesis of Proposed Research Direction */}
      <div className="p-6 rounded-2xl glass-card border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-cyan-950/20 to-slate-900 space-y-4">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" /> Proposed Conference Research Paper
        </div>
        <h3 className="text-xl font-extrabold text-white">
          {PROPOSED_FRAMEWORK_SYNTHESIS.title}
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          {PROPOSED_FRAMEWORK_SYNTHESIS.abstract}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {PROPOSED_FRAMEWORK_SYNTHESIS.researchGapsAddressed.map((item, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-white/5 space-y-1">
              <div className="text-[11px] font-bold text-cyan-300">
                Gap {idx + 1}: {item.gap}
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                {item.solution}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

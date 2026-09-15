import React from 'react';
import { 
  CloudRain, 
  CloudFog, 
  SunMedium, 
  Snowflake, 
  ShieldCheck, 
  Car,
  TrendingUp,
  Cloud
} from 'lucide-react';
import { ScenarioPreset } from '../engine/presetsData';

interface HeroSectionProps {
  selectedPreset: ScenarioPreset;
  onSelectPreset: (presetId: string) => void;
  presets: ScenarioPreset[];
  brandName?: 'LumiDrive' | 'RoadSight';
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  selectedPreset,
  onSelectPreset,
  presets,
  brandName = 'LumiDrive'
}) => {
  const isLumiDrive = brandName === 'LumiDrive';

  const weatherChips = [
    { id: 'heavy-rain', label: 'Rain', icon: CloudRain },
    { id: 'dense-fog', label: 'Fog', icon: CloudFog },
    { id: 'night-glare', label: 'Low Light', icon: SunMedium },
    { id: 'snow-slush', label: 'Snow', icon: Snowflake },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#1e293b]/70 border border-slate-700/60 shadow-xl mb-6">
      {/* Background Graphic Simulation for Mountain / Rainy Highway */}
      <div 
        className="absolute inset-y-0 right-0 w-full lg:w-1/2 bg-cover bg-center opacity-40 lg:opacity-60 pointer-events-none mix-blend-luminosity"
        style={{
          backgroundImage: isLumiDrive
            ? "radial-gradient(ellipse at 80% 40%, rgba(14, 165, 233, 0.25), transparent 70%), linear-gradient(90deg, #1e293b 0%, rgba(30, 41, 59, 0.4) 40%, transparent 100%), repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 2px, transparent 2px, transparent 10px)"
            : "radial-gradient(ellipse at 80% 40%, rgba(6, 182, 212, 0.3), transparent 70%), linear-gradient(90deg, #1e293b 0%, rgba(30, 41, 59, 0.4) 40%, transparent 100%)"
        }}
      />

      {/* SVG Canvas for Photorealistic Mountain Horizon & Highway Road Curves on the Right */}
      <div className="absolute inset-y-0 right-0 w-full lg:w-7/12 pointer-events-none overflow-hidden opacity-85">
        <svg viewBox="0 0 700 350" preserveAspectRatio="none" className="w-full h-full">
          {/* Distant Mountain Silhouettes */}
          <path d="M 0,220 Q 150,120 300,180 T 600,100 L 700,160 L 700,350 L 0,350 Z" fill="rgba(15, 23, 42, 0.6)" />
          <path d="M 120,240 Q 280,150 450,210 T 700,170 L 700,350 L 120,350 Z" fill="rgba(30, 41, 59, 0.7)" />

          {/* Highway Asphalt Corridor curving into the mountains */}
          <polygon points="320,185 380,185 680,350 180,350" fill="rgba(30, 41, 59, 0.9)" />
          
          {/* Lane markings */}
          <line x1="350" y1="185" x2="430" y2="350" stroke="rgba(255,255,255,0.6)" strokeWidth="3" strokeDasharray="12,12" />
          <line x1="320" y1="185" x2="180" y2="350" stroke="rgba(255,255,255,0.8)" strokeWidth="4" />
          <line x1="380" y1="185" x2="680" y2="350" stroke="rgba(255,255,255,0.8)" strokeWidth="4" />
          
          {/* Highway Guardrail */}
          <path d="M 320,185 L 180,350" stroke="#64748b" strokeWidth="6" opacity="0.5" />
          <path d="M 380,185 L 680,350" stroke="#64748b" strokeWidth="6" opacity="0.5" />

          {/* Distant driving car headlights */}
          <circle cx="345" cy="195" r="3" fill="#fef08a" filter="drop-shadow(0 0 4px #facc15)" />
          <circle cx="355" cy="195" r="3" fill="#fef08a" filter="drop-shadow(0 0 4px #facc15)" />
          
          {/* Rain / Atmospheric Fog overlay */}
          <rect x="0" y="0" width="700" height="350" fill="url(#fogGradient)" opacity="0.4" />
          <defs>
            <linearGradient id="fogGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.4" />
              <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.8" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 p-6 sm:p-8 lg:p-10 max-w-2xl space-y-4">
        {isLumiDrive ? (
          /* LUMIDRIVE HERO (Mockup 1) */
          <>
            <div className="text-xs font-extrabold uppercase tracking-widest text-cyan-400">
              AI FOR SAFER ROADS
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
              Clearer Insights <br />
              <span className="text-white">in Tougher Conditions</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal pt-1">
              Upload a road image and let our model detect lane boundaries, drivable area and weather conditions — built for real-world scenarios.
            </p>

            {/* Weather Selector Chips */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              {weatherChips.map((chip) => {
                const Icon = chip.icon;
                const isSelected = selectedPreset.id === chip.id;
                return (
                  <button
                    key={chip.id}
                    onClick={() => onSelectPreset(chip.id)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-cyan-500 text-white border-cyan-400 shadow-md shadow-cyan-500/30'
                        : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border-slate-700/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{chip.label}</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          /* ROADSIGHT HERO (Mockup 2) */
          <>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
              See the road, even when <br />
              <span className="text-white">conditions change.</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal pt-1">
              RoadSight is a research prototype for robust multi-task road perception, focusing on lane detection and drivable-area understanding under changing weather conditions such as rain, fog, low light and more.
            </p>

            {/* 3 Value Pillars */}
            <div className="flex flex-wrap items-center gap-4 pt-3 text-xs font-semibold text-slate-200">
              <div className="flex items-center gap-2 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-700">
                <Car className="w-4 h-4 text-cyan-400" />
                <span>Safer perception</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-700">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>More robust AI</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-700">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>Towards real-world driving</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right Side Caption / Weather Badge */}
      <div className="absolute bottom-4 right-6 z-10 hidden sm:block text-right">
        {isLumiDrive ? (
          <div className="text-xs italic text-slate-300 font-serif drop-shadow-md">
            &ldquo;Robust perception for every journey.&rdquo;
          </div>
        ) : (
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-700 text-xs font-bold text-white">
              <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
              <span>Rain / Low visibility</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Real-world driving scenario
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

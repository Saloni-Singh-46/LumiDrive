import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Upload, 
  Sparkles, 
  RotateCcw, 
  Play, 
  Pause, 
  SkipBack,
  SkipForward,
  Video as VideoIcon, 
  Camera, 
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Info,
  Layers,
  MapPin,
  BarChart2,
  CloudRain
} from 'lucide-react';
import { ScenarioPreset } from '../engine/presetsData';
import { LayerVisibilityState } from './LayerControls';
import { analyzeRoadImage, renderSyntheticRoadScene, CVAnalysisResult } from '../engine/cvEngine';
import { LiveTelemetryGraph, TelemetryDataPoint } from './LiveTelemetryGraph';

interface MultiTaskViewerProps {
  scenario: ScenarioPreset;
  layers: LayerVisibilityState;
  customAnalysis: CVAnalysisResult | null;
  setCustomAnalysis: (res: CVAnalysisResult | null) => void;
  brandName?: 'LumiDrive' | 'RoadSight';
}

export const MultiTaskViewer: React.FC<MultiTaskViewerProps> = ({
  scenario,
  layers,
  customAnalysis,
  setCustomAnalysis,
  brandName = 'LumiDrive'
}) => {
  const isLumiDrive = brandName === 'LumiDrive';

  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0 to 100
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [userUploadedImage, setUserUploadedImage] = useState<string | null>(null);
  const [userUploadedVideo, setUserUploadedVideo] = useState<string | null>(null);
  const [isWebcamActive, setIsWebcamActive] = useState<boolean>(false);
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(false);
  const [videoProgress, setVideoProgress] = useState<number>(0);
  const [isProcessingUpload, setIsProcessingUpload] = useState<boolean>(false);

  // Live rolling telemetry history buffer
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryDataPoint[]>([
    {
      time: '00:01',
      laneOffsetCm: scenario.telemetry.laneCenterOffsetCm,
      curvatureRadiusM: scenario.telemetry.curvatureRadiusM,
      steeringAngleDeg: scenario.telemetry.laneCenterOffsetCm * 0.08,
      consistencyScore: scenario.temporalStability,
      fps: scenario.telemetry.fps
    }
  ]);

  const containerRef = useRef<HTMLDivElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const processingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastVideoAnalysisRef = useRef<number>(0);

  // Active perception data (custom upload analysis if present, else preset scenario)
  const lanes = customAnalysis ? customAnalysis.lanes : scenario.lanes;
  const drivablePolygon = customAnalysis ? customAnalysis.drivablePolygon : scenario.drivablePolygon;
  const vehicles = customAnalysis ? customAnalysis.vehicles : scenario.vehicles;
  const drivableIoU = customAnalysis ? customAnalysis.drivableIoU : scenario.drivableIoU;
  const drivableCoverage = customAnalysis ? customAnalysis.drivableCoverage : scenario.drivableCoverage;
  const drivableConfidence = customAnalysis ? customAnalysis.drivableConfidence : scenario.drivableConfidence;
  const weatherLabel = customAnalysis ? customAnalysis.weather : scenario.weather;
  const overallConfidence = customAnalysis ? customAnalysis.weatherConfidence : scenario.weatherConfidence;
  const currentOffset = customAnalysis ? customAnalysis.telemetry.laneCenterOffsetCm : scenario.telemetry.laneCenterOffsetCm;
  const currentCurvature = customAnalysis ? customAnalysis.telemetry.curvatureRadiusM : scenario.telemetry.curvatureRadiusM;
  const currentSteering = currentOffset * 0.08;
  const currentScore = customAnalysis ? customAnalysis.temporalStability : scenario.temporalStability;

  // Render original synthetic canvas when scenario changes
  useEffect(() => {
    if (!userUploadedImage && !userUploadedVideo && !isWebcamActive && originalCanvasRef.current) {
      renderSyntheticRoadScene(originalCanvasRef.current, scenario);
    }
  }, [scenario, userUploadedImage, userUploadedVideo, isWebcamActive]);

  useEffect(() => () => {
    if (userUploadedVideo) URL.revokeObjectURL(userUploadedVideo);
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }
  }, [userUploadedVideo]);

  // Update telemetry history when active scenario or custom analysis changes
  useEffect(() => {
    setTelemetryHistory(prev => {
      const newPoint: TelemetryDataPoint = {
        time: new Date().toLocaleTimeString().slice(-5),
        laneOffsetCm: currentOffset,
        curvatureRadiusM: currentCurvature,
        steeringAngleDeg: currentSteering,
        consistencyScore: currentScore,
        fps: customAnalysis ? customAnalysis.telemetry.fps : scenario.telemetry.fps
      };
      const updated = [...prev, newPoint];
      return updated.slice(-25);
    });
  }, [scenario, customAnalysis, currentOffset, currentCurvature, currentSteering, currentScore]);

  // Handle Dragging Slider
  const handleMouseDown = () => setIsDragging(true);
  const handleTouchStart = () => setIsDragging(true);

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  }, [isDragging]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) handleMove(e.touches[0].clientX);
    };
    const onMouseUp = () => setIsDragging(false);
    const onTouchEnd = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, handleMove]);

  // Handle User Image Upload
  const handleImageUpload = (file: File) => {
    if (!file) return;
    stopVideoOrWebcam();
    setIsProcessingUpload(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const imgUrl = e.target?.result as string;
      setUserUploadedImage(imgUrl);

      const img = new Image();
      img.onload = async () => {
        try {
          const analysis = await analyzeRoadImage(img);
          setCustomAnalysis(analysis);
        } catch (err) {
          console.error('CV analysis error:', err);
        } finally {
          setIsProcessingUpload(false);
        }
      };
      img.src = imgUrl;
    };
    reader.readAsDataURL(file);
  };

  // Handle Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleVideoUpload = (file: File) => {
    if (!file) return;
    stopVideoOrWebcam();
    setUserUploadedImage(null);
    const videoUrl = URL.createObjectURL(file);
    setUserUploadedVideo(videoUrl);
    setIsPlayingVideo(true);
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      await videoRef.current.play();
      setUserUploadedImage(null);
      setUserUploadedVideo(null);
      setIsWebcamActive(true);
      setIsPlayingVideo(true);
    } catch (error) {
      console.error('Unable to access webcam:', error);
      setIsWebcamActive(false);
    }
  };

  const analyzeVideoFrame = async () => {
    const video = videoRef.current;
    if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

    if (!processingCanvasRef.current) {
      processingCanvasRef.current = document.createElement('canvas');
    }

    const canvas = processingCanvasRef.current;
    canvas.width = 640;
    canvas.height = 360;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frame = new Image();
    frame.onload = async () => {
      try {
        const analysis = await analyzeRoadImage(frame);
        setCustomAnalysis(analysis);
      } catch (error) {
        console.error('Video frame analysis error:', error);
      }
    };
    frame.src = canvas.toDataURL('image/jpeg', 0.72);
  };

  useEffect(() => {
    if ((!userUploadedVideo && !isWebcamActive) || !isPlayingVideo) return;

    const processFrame = (timestamp: number) => {
      if (timestamp - lastVideoAnalysisRef.current > 260) {
        lastVideoAnalysisRef.current = timestamp;
        void analyzeVideoFrame();
      }
      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    animationFrameRef.current = requestAnimationFrame(processFrame);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [userUploadedVideo, isWebcamActive, isPlayingVideo]);

  const toggleVideoPlayback = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      void videoRef.current.play();
      setIsPlayingVideo(true);
    } else {
      videoRef.current.pause();
      setIsPlayingVideo(false);
    }
  };

  const stepVideo = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + seconds));
  };

  const stopVideoOrWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (userUploadedVideo) URL.revokeObjectURL(userUploadedVideo);
    setIsWebcamActive(false);
    setIsPlayingVideo(false);
    setUserUploadedVideo(null);
  };

  const handleClearAllUploads = () => {
    stopVideoOrWebcam();
    setUserUploadedImage(null);
    setCustomAnalysis(null);
  };

  // Generate SVG Polygon Points string
  const drivableSvgPoints = drivablePolygon
    .map(pt => `${pt[0]},${pt[1]}`)
    .join(' ');

  return (
    <div className="space-y-6">
      <div className="glass-panel flex flex-wrap items-center gap-3 p-3.5">
        <div className="flex items-center gap-2 mr-auto">
          <VideoIcon className="w-4 h-4 text-cyan-400" />
          <div>
            <p className="text-xs font-bold text-white">Live perception source</p>
            <p className="text-[10px] text-slate-400">Upload a clip or connect a camera for temporal inference</p>
          </div>
        </div>
        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4, video/webm, video/quicktime"
          className="hidden"
          onChange={(event) => event.target.files?.[0] && handleVideoUpload(event.target.files[0])}
        />
        <button
          type="button"
          onClick={() => videoInputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-cyan-400 hover:text-white"
        >
          <Upload className="w-3.5 h-3.5 text-cyan-400" /> Video file
        </button>
        <button
          type="button"
          onClick={isWebcamActive ? stopVideoOrWebcam : () => void startWebcam()}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${isWebcamActive ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' : 'bg-cyan-500 text-slate-950 hover:bg-cyan-300'}`}
        >
          <Camera className="w-3.5 h-3.5" /> {isWebcamActive ? 'Stop camera' : 'Use webcam'}
        </button>
        {(userUploadedVideo || isWebcamActive) && (
          <div className="flex items-center gap-1 border-l border-slate-700 pl-3">
            <button type="button" onClick={() => stepVideo(-0.5)} className="rounded-md p-2 text-slate-300 hover:bg-slate-800 hover:text-white" title="Step back 0.5 seconds">
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={toggleVideoPlayback} className="rounded-md bg-slate-800 p-2 text-cyan-300 hover:bg-slate-700" title={isPlayingVideo ? 'Pause video' : 'Play video'}>
              {isPlayingVideo ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button type="button" onClick={() => stepVideo(0.5)} className="rounded-md p-2 text-slate-300 hover:bg-slate-800 hover:text-white" title="Step forward 0.5 seconds">
              <SkipForward className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={stopVideoOrWebcam} className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-white" title="Clear media source">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <video
        ref={videoRef}
        src={userUploadedVideo || undefined}
        muted
        playsInline
        loop
        onPlay={() => setIsPlayingVideo(true)}
        onPause={() => setIsPlayingVideo(false)}
        onEnded={() => setIsPlayingVideo(false)}
        className={(userUploadedVideo || isWebcamActive) ? 'absolute -z-10 h-px w-px opacity-0' : 'hidden'}
      />
      {/* ========================================================================= */}
      {/* LUMIDRIVE 3-COLUMN LAYOUT (MOCKUP 1)                                      */}
      {/* ========================================================================= */}
      {isLumiDrive ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Column 1: Upload a Road Image (Dashed Box) */}
          <div className="xl:col-span-3 flex flex-col justify-between p-6 rounded-2xl bg-[#1e293b]/70 border-2 border-dashed border-slate-600/80 hover:border-cyan-400/80 transition-all min-h-[360px] text-center">
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex flex-col items-center justify-center cursor-pointer space-y-4 py-6"
            >
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/png, image/jpeg, image/webp" 
                className="hidden" 
                onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])}
              />

              {/* Cloud Upload Icon */}
              <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                <Upload className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <h3 className="font-extrabold text-base text-white">Upload a Road Image</h3>
                <p className="text-xs text-slate-400">
                  Drag and drop an image here <br /> or <span className="text-cyan-400 underline font-semibold">click to browse</span>
                </p>
              </div>

              {/* Sample Action Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearAllUploads();
                }}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 border border-slate-700 transition-colors"
              >
                Reset to Presets
              </button>
            </div>

            {/* Supported Formats Pill */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-3 border-t border-slate-800">
              <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Supports: JPG, PNG, JPEG (Max 10 MB)</span>
            </div>
          </div>

          {/* Column 2: Main Split-Screen Comparison Viewport */}
          <div className="xl:col-span-6 flex flex-col space-y-3">
            <div 
              ref={containerRef}
              className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-slate-950 border border-slate-700/80 shadow-2xl select-none"
              style={{ touchAction: 'none' }}
            >
              {/* 1. Base Layer: Original Image (Full) */}
              <div className="absolute inset-0 w-full h-full">
                {userUploadedImage ? (
                  <img 
                    src={userUploadedImage} 
                    alt="Original road upload" 
                    className="w-full h-full object-cover"
                  />
                ) : userUploadedVideo || isWebcamActive ? (
                  <video
                    src={userUploadedVideo || undefined}
                    ref={videoRef}
                    muted
                    autoPlay
                    playsInline
                    loop
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <canvas 
                    ref={originalCanvasRef} 
                    width={640} 
                    height={400} 
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Header Tab: Original Image */}
                <div className="absolute top-3 left-3 z-20 px-3 py-1 rounded-md bg-slate-900/90 text-slate-200 text-xs font-bold border border-slate-700 shadow-md">
                  Original Image
                </div>

                {/* Left Side Vehicle Bounding Box (e.g. car 0.89) */}
                <div 
                  className="absolute z-20 border border-cyan-400 rounded shadow-sm"
                  style={{ left: '44%', top: '56%', width: '13%', height: '15%', backgroundColor: 'rgba(6, 182, 212, 0.1)' }}
                >
                  <div className="absolute -top-4 left-0 px-1 rounded bg-slate-900/90 text-cyan-300 text-[9px] font-mono font-bold whitespace-nowrap">
                    car 0.89
                  </div>
                </div>
              </div>

              {/* 2. Top Clipped Layer: Perception Result (Right of Split) */}
              <div 
                className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
                style={{
                  clipPath: `polygon(${sliderPos}% 0%, 100% 0%, 100% 100%, ${sliderPos}% 100%)`
                }}
              >
                {/* Underlying Image Copy */}
                {userUploadedImage ? (
                  <img 
                    src={userUploadedImage} 
                    alt="Perception result road" 
                    className="w-full h-full object-cover"
                  />
                ) : userUploadedVideo || isWebcamActive ? (
                  <video
                    src={userUploadedVideo || undefined}
                    muted
                    autoPlay
                    playsInline
                    loop
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <canvas 
                    width={640} 
                    height={400} 
                    ref={(c) => {
                      if (c && !userUploadedImage) renderSyntheticRoadScene(c, scenario);
                    }}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Multi-Task SVG Perception Overlay */}
                <svg 
                  viewBox="0 0 100 100" 
                  preserveAspectRatio="none"
                  className="absolute inset-0 w-full h-full z-10 pointer-events-none"
                >
                  {/* Drivable Area Green Polygon */}
                  {layers.showDrivable && (
                    <polygon 
                      points={drivableSvgPoints}
                      fill="#22c55e"
                      fillOpacity={0.45}
                      stroke="#22c55e"
                      strokeWidth="0.8"
                    />
                  )}

                  {/* Lane Boundaries Cyan Lines */}
                  {layers.showLanes && lanes.map(lane => {
                    const pathString = lane.points.reduce((acc, pt, idx) => {
                      return idx === 0 ? `M ${pt[0]} ${pt[1]}` : `${acc} L ${pt[0]} ${pt[1]}`;
                    }, '');

                    return (
                      <g key={lane.id}>
                        <path 
                          d={pathString} 
                          fill="none" 
                          stroke="#38bdf8" 
                          strokeWidth="1.6" 
                          strokeDasharray={lane.dashed ? '3,2' : undefined}
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Right Side Vehicle Bounding Boxes (car 0.92, car 0.87) */}
                {layers.showVehicles && vehicles.map(v => (
                  <div 
                    key={v.id}
                    className="absolute z-20 border border-purple-400 rounded shadow-sm"
                    style={{
                      left: `${v.box[0]}%`,
                      top: `${v.box[1]}%`,
                      width: `${v.box[2] - v.box[0]}%`,
                      height: `${v.box[3] - v.box[1]}%`,
                      backgroundColor: 'rgba(168, 85, 247, 0.15)'
                    }}
                  >
                    <div className="absolute -top-4 left-0 px-1 rounded bg-purple-950/90 text-purple-200 text-[9px] font-mono font-bold whitespace-nowrap">
                      {v.label} {v.confidence.toFixed(2)}
                    </div>
                  </div>
                ))}

                {/* Header Tab: Perception Result (Cyan) */}
                <div className="absolute top-3 right-3 z-20 px-3 py-1 rounded-md bg-[#06b6d4] text-white text-xs font-bold shadow-md">
                  Perception Result
                </div>

                {/* Bottom Legend */}
                <div className="absolute bottom-3 right-3 z-20 flex items-center gap-3 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700 text-[11px] font-semibold text-slate-200">
                  <div className="flex items-center gap-1.5 text-cyan-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    <span>Lane boundary</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Drivable area</span>
                  </div>
                </div>
              </div>

              {/* 3. Draggable Split Slider Handle (< >) */}
              <div 
                className="slider-handle-line"
                style={{ left: `${sliderPos}%` }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
              >
                <div className="slider-handle-button">
                  <span className="text-xs font-bold font-mono tracking-tighter">&lt;&gt;</span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Detection Summary & Scene Information Cards */}
          <div className="xl:col-span-3 space-y-4">
            {/* Card 1: Detection Summary */}
            <div className="p-5 rounded-2xl bg-[#1e293b]/70 border border-slate-700/80 shadow-md space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-slate-700/60 pb-2.5">
                <BarChart2 className="w-4 h-4 text-cyan-400" />
                <span>Detection Summary</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Lanes Detected</span>
                  <span className="font-bold px-2 py-0.5 rounded-full bg-[#a7f3d0] text-slate-900">
                    {lanes.length}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Drivable Area (IoU)</span>
                  <span className="font-bold text-white font-mono">{drivableIoU.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Weather Condition</span>
                  <span className="font-bold text-slate-200">{weatherLabel}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Confidence</span>
                  <span className="font-bold text-white font-mono">{overallConfidence.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Scene Information */}
            <div className="p-5 rounded-2xl bg-[#1e293b]/70 border border-slate-700/80 shadow-md space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-slate-700/60 pb-2.5">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span>Scene Information</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Road Type</span>
                  <span className="font-semibold text-white">{scenario.roadType.split(' ')[0] || 'Urban'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Time of Day</span>
                  <span className="font-semibold text-white">{scenario.timeOfDay.split(' ')[0] || 'Evening'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Visibility</span>
                  <span className="font-semibold text-white">{scenario.visibility}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Scene</span>
                  <span className="font-semibold text-white">Highway</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* ROADSIGHT 2-COLUMN LAYOUT (MOCKUP 2)                                      */
        /* ========================================================================= */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left Column: Analyze Road Scene */}
          <div className="xl:col-span-4 p-5 rounded-2xl bg-[#1e293b]/70 border border-slate-700/80 shadow-md space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Analyze road scene</span>
            </div>
            <p className="text-xs text-slate-400">
              Upload an image to run multi-task perception analysis.
            </p>

            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-600 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-cyan-400 transition-colors space-y-3"
            >
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/png, image/jpeg, image/webp" 
                className="hidden" 
                onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])}
              />
              <ImageIcon className="w-8 h-8 text-slate-400" />
              <div className="text-xs">
                <span className="font-bold text-white block">Drop a road image here</span>
                <span className="text-slate-400">or <span className="text-cyan-400 underline font-semibold">browse from your device</span></span>
              </div>
            </div>

            <div className="flex items-center justify-center text-xs text-slate-500 gap-2">
              <div className="h-px bg-slate-700 flex-1" />
              <span>or</span>
              <div className="h-px bg-slate-700 flex-1" />
            </div>

            <button
              onClick={handleClearAllUploads}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
            >
              <ImageIcon className="w-4 h-4 text-cyan-400" />
              <span>Try sample image</span>
            </button>

            <div className="text-[11px] text-slate-400 text-center pt-1">
              Supported formats: JPG, PNG, JPEG (Max 10 MB)
            </div>
          </div>

          {/* Right Column: Analysis Complete Banner + Dual View + Perception Outputs + Temporal Strip */}
          <div className="xl:col-span-8 space-y-4">
            {/* Top Analysis Complete Banner */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="font-bold text-white block">Analysis complete</span>
                  <span className="text-slate-400">The image has been successfully analyzed by RoadSight.</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 font-mono">
                <Clock className="w-3.5 h-3.5" />
                <span>Processing time: 1.8 s</span>
              </div>
            </div>

            {/* Split Viewport */}
            <div 
              ref={containerRef}
              className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-slate-950 border border-slate-700 shadow-xl select-none"
              style={{ touchAction: 'none' }}
            >
              <div className="absolute inset-0 w-full h-full">
                {userUploadedImage ? (
                  <img src={userUploadedImage} alt="Original road" className="w-full h-full object-cover" />
                ) : userUploadedVideo || isWebcamActive ? (
                  <video ref={videoRef} src={userUploadedVideo || undefined} muted autoPlay playsInline loop className="w-full h-full object-cover" />
                ) : (
                  <canvas ref={originalCanvasRef} width={640} height={360} className="w-full h-full object-cover" />
                )}
                <div className="absolute top-3 left-3 z-20 px-3 py-1 rounded bg-slate-900/90 text-slate-200 text-xs font-bold border border-slate-700">
                  Original image
                </div>
              </div>

              <div 
                className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
                style={{ clipPath: `polygon(${sliderPos}% 0%, 100% 0%, 100% 100%, ${sliderPos}% 100%)` }}
              >
                {userUploadedImage ? (
                  <img src={userUploadedImage} alt="Perception" className="w-full h-full object-cover" />
                ) : userUploadedVideo || isWebcamActive ? (
                  <video src={userUploadedVideo || undefined} muted autoPlay playsInline loop className="w-full h-full object-cover" />
                ) : (
                  <canvas width={640} height={360} ref={(c) => { if (c && !userUploadedImage) renderSyntheticRoadScene(c, scenario); }} className="w-full h-full object-cover" />
                )}

                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full z-10 pointer-events-none">
                  {layers.showDrivable && (
                    <polygon points={drivableSvgPoints} fill="#22c55e" fillOpacity={0.45} stroke="#22c55e" strokeWidth="0.8" />
                  )}
                  {layers.showLanes && lanes.map(lane => {
                    const pathString = lane.points.reduce((acc, pt, idx) => idx === 0 ? `M ${pt[0]} ${pt[1]}` : `${acc} L ${pt[0]} ${pt[1]}`, '');
                    return <path key={lane.id} d={pathString} fill="none" stroke="#38bdf8" strokeWidth="1.6" />;
                  })}
                </svg>

                <div className="absolute top-3 right-3 z-20 px-3 py-1 rounded bg-cyan-700 text-white text-xs font-bold">
                  Perception result
                </div>

                <div className="absolute bottom-3 right-3 z-20 flex items-center gap-3 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700 text-[11px] font-semibold text-slate-200">
                  <div className="flex items-center gap-1 text-cyan-400"><span className="w-2 h-2 rounded-full bg-cyan-400" /> Lane boundaries</div>
                  <div className="flex items-center gap-1 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Drivable area</div>
                </div>
              </div>

              <div className="slider-handle-line" style={{ left: `${sliderPos}%` }} onMouseDown={handleMouseDown} onTouchStart={handleTouchStart}>
                <div className="slider-handle-button">
                  <span className="text-xs font-bold font-mono tracking-tighter">&lt;&gt;</span>
                </div>
              </div>
            </div>

            {/* Perception Outputs Row (3 Cards) */}
            <div className="space-y-2 pt-1">
              <div className="text-xs font-bold text-white uppercase tracking-wider">Perception outputs</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. Lane Detection */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <span className="text-cyan-400 font-mono">/\</span>
                    <span>Lane detection</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Detected lanes</span>
                      <span className="text-base font-bold text-white font-mono">{lanes.length}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Confidence</span>
                      <span className="text-base font-bold text-cyan-400 font-mono">92%</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-cyan-400 h-full w-[92%]" />
                  </div>
                </div>

                {/* 2. Drivable Area */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <span className="text-emerald-400 font-mono">[!]</span>
                    <span>Drivable area</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Coverage (image area)</span>
                      <span className="text-base font-bold text-white font-mono">{drivableCoverage}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Confidence</span>
                      <span className="text-base font-bold text-emerald-400 font-mono">{Math.round(drivableConfidence * 100)}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full w-[89%]" />
                  </div>
                </div>

                {/* 3. Weather Condition */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <CloudRain className="w-4 h-4 text-cyan-400" />
                    <span>Weather condition</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Predicted condition</span>
                      <span className="text-xs font-bold text-white truncate block">{weatherLabel.split('/')[0]}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Confidence</span>
                      <span className="text-base font-bold text-cyan-400 font-mono">87%</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-cyan-400 h-full w-[87%]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Temporal Consistency Strip */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <span>Temporal consistency (experimental)</span>
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Stability score:</span>
                  <span className="font-bold text-emerald-400 font-mono">0.82</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {['Frame 01', 'Frame 02', 'Frame 03'].map((frameName, fIdx) => (
                  <div key={fIdx} className="space-y-1.5 text-center">
                    <div className="aspect-[16/9] rounded-lg bg-slate-950 border border-slate-800 overflow-hidden relative">
                      <canvas 
                        width={160} 
                        height={90} 
                        ref={(c) => { if (c) renderSyntheticRoadScene(c, scenario); }} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">{frameName}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BOTTOM 3 FEATURE CARDS ("What we analyze")                                */}
      {/* ========================================================================= */}
      <div className="space-y-2 pt-2">
        {!isLumiDrive && (
          <div className="text-sm font-bold text-white">
            What we analyze
            <span className="text-xs text-slate-400 font-normal block">
              RoadSight focuses on key perception tasks for safer and more robust autonomous driving research.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Lane Detection / Lane Structure */}
          <div className="p-5 rounded-2xl bg-[#1e293b]/70 border border-slate-700/80 shadow-md space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono font-bold text-lg">
                /\
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">
                  {isLumiDrive ? 'Lane Detection' : 'Lane structure'}
                </h4>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Detect lane boundaries under challenging weather and lighting conditions.
            </p>
          </div>

          {/* Card 2: Drivable Area Estimation / Drivable Region */}
          <div className="p-5 rounded-2xl bg-[#1e293b]/70 border border-slate-700/80 shadow-md space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-lg">
                [!]
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">
                  {isLumiDrive ? 'Drivable Area Estimation' : 'Drivable region'}
                </h4>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Segment the drivable region using scene context and lane structure.
            </p>
          </div>

          {/* Card 3: Weather Robustness */}
          <div className="p-5 rounded-2xl bg-[#1e293b]/70 border border-slate-700/80 shadow-md space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 text-lg">
                <CloudRain className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Weather Robustness</h4>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Analyze performance across rain, fog, snow, and low-light environments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

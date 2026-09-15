export interface VehicleBox {
  id: string;
  label: string;
  confidence: number;
  box: [number, number, number, number]; // [x1, y1, x2, y2] percentages 0-100
  color?: string;
}

export interface LaneBoundary {
  id: string;
  type: 'left' | 'right' | 'center' | 'adjacent_left' | 'adjacent_right';
  points: [number, number][]; // percentages 0-100 [x, y]
  polynomial?: [number, number, number]; // ax^2 + bx + c
  confidence: number;
  dashed?: boolean;
}

export interface ScenarioPreset {
  id: string;
  name: string;
  tag: string;
  weather: string;
  weatherConfidence: number;
  timeOfDay: string;
  roadType: string;
  visibility: 'Low' | 'Moderate' | 'Good';
  description: string;
  challenge: string;
  imageUrl: string; // procedural generator or asset URL
  lanes: LaneBoundary[];
  drivablePolygon: [number, number][]; // percentages 0-100
  drivableIoU: number;
  drivableCoverage: number; // percentage
  drivableConfidence: number;
  vehicles: VehicleBox[];
  temporalStability: number;
  temporalFrames: {
    frameId: number;
    timestamp: string;
    description: string;
    stability: number;
    occlusionLevel: number;
    thumbnailUrl?: string;
  }[];
  telemetry: {
    laneCenterOffsetCm: number; // e.g. -12cm (left), +8cm (right)
    curvatureRadiusM: number; // in meters
    curvatureDirection: 'Straight' | 'Left Curve' | 'Right Curve';
    steeringRecommendation: string;
    reliabilityScore: number;
    reliabilityState: 'Reliable' | 'Caution' | 'Unreliable';
    processingLatencyMs: number;
    fps: number;
  };
}

export const PRESET_SCENARIOS: ScenarioPreset[] = [
  {
    id: 'heavy-rain',
    name: 'Heavy Monsoon Rain & Wet Glare',
    tag: 'Rain / Low Visibility',
    weather: 'Rain / Low Visibility',
    weatherConfidence: 0.89,
    timeOfDay: 'Evening (18:45)',
    roadType: 'Urban Expressway',
    visibility: 'Low',
    description: 'Severe rain with intense water reflection, road puddle distortions, and low light.',
    challenge: 'Water specular reflections create false-positive edges while heavy spray degrades marking contrast.',
    imageUrl: 'rain_scene',
    lanes: [
      {
        id: 'lane-l1',
        type: 'left',
        points: [[22, 98], [28, 80], [36, 65], [44, 55], [49, 48]],
        confidence: 0.94,
        dashed: false
      },
      {
        id: 'lane-r1',
        type: 'right',
        points: [[78, 98], [72, 80], [64, 65], [56, 55], [51, 48]],
        confidence: 0.91,
        dashed: true
      },
      {
        id: 'lane-r2',
        type: 'adjacent_right',
        points: [[98, 98], [92, 80], [82, 65], [70, 55], [58, 48]],
        confidence: 0.86,
        dashed: false
      }
    ],
    drivablePolygon: [
      [22, 98], [28, 80], [36, 65], [44, 55], [49, 48],
      [51, 48], [56, 55], [64, 65], [72, 80], [78, 98]
    ],
    drivableIoU: 0.86,
    drivableCoverage: 78,
    drivableConfidence: 0.89,
    vehicles: [
      { id: 'v1', label: 'car', confidence: 0.92, box: [42, 49, 57, 68], color: '#a855f7' },
      { id: 'v2', label: 'car', confidence: 0.87, box: [68, 52, 79, 65], color: '#a855f7' },
      { id: 'v3', label: 'suv', confidence: 0.84, box: [26, 54, 38, 66], color: '#38bdf8' }
    ],
    temporalStability: 0.88,
    temporalFrames: [
      { frameId: 101, timestamp: '00:03.36', description: 'Clear approach before rain squall', stability: 0.94, occlusionLevel: 5 },
      { frameId: 102, timestamp: '00:03.40', description: 'Heavy water splash across windshield', stability: 0.82, occlusionLevel: 45 },
      { frameId: 103, timestamp: '00:03.44', description: 'ConvGRU spatial memory bridges lost left lane', stability: 0.88, occlusionLevel: 25 },
      { frameId: 104, timestamp: '00:03.48', description: 'Lane recovered with stabilized corridor', stability: 0.91, occlusionLevel: 10 }
    ],
    telemetry: {
      laneCenterOffsetCm: -6.4,
      curvatureRadiusM: 1450,
      curvatureDirection: 'Straight',
      steeringRecommendation: 'Maintain center; slight right trim (+0.4°)',
      reliabilityScore: 0.87,
      reliabilityState: 'Reliable',
      processingLatencyMs: 24.2,
      fps: 41.3
    }
  },
  {
    id: 'dense-fog',
    name: 'Dense Mountain Fog & Low Contrast',
    tag: 'Dense Fog',
    weather: 'Dense Fog & Low Contrast',
    weatherConfidence: 0.93,
    timeOfDay: 'Early Morning (06:15)',
    roadType: 'Mountain Highway',
    visibility: 'Low',
    description: 'Thick fog attenuating high spatial frequencies with visibility under 35 meters.',
    challenge: 'Vanishing point disappears into white scattering; distant road cues completely obscured.',
    imageUrl: 'fog_scene',
    lanes: [
      {
        id: 'lane-l1',
        type: 'left',
        points: [[18, 98], [25, 82], [35, 68], [43, 58], [48, 52]],
        confidence: 0.88,
        dashed: false
      },
      {
        id: 'lane-r1',
        type: 'right',
        points: [[82, 98], [74, 82], [65, 68], [57, 58], [52, 52]],
        confidence: 0.85,
        dashed: true
      }
    ],
    drivablePolygon: [
      [18, 98], [25, 82], [35, 68], [43, 58], [48, 52],
      [52, 52], [57, 58], [65, 68], [74, 82], [82, 98]
    ],
    drivableIoU: 0.82,
    drivableCoverage: 71,
    drivableConfidence: 0.86,
    vehicles: [
      { id: 'v1', label: 'truck', confidence: 0.86, box: [45, 48, 55, 62], color: '#f59e0b' }
    ],
    temporalStability: 0.84,
    temporalFrames: [
      { frameId: 201, timestamp: '00:08.10', description: 'Moderate fog entry', stability: 0.89, occlusionLevel: 20 },
      { frameId: 202, timestamp: '00:08.14', description: 'Dense fog bank reduces contrast by 60%', stability: 0.79, occlusionLevel: 65 },
      { frameId: 203, timestamp: '00:08.18', description: 'Criss-cross attention captures long-range context', stability: 0.84, occlusionLevel: 40 },
      { frameId: 204, timestamp: '00:08.22', description: 'Drivable corridor preserved through memory', stability: 0.86, occlusionLevel: 25 }
    ],
    telemetry: {
      laneCenterOffsetCm: +11.2,
      curvatureRadiusM: 820,
      curvatureDirection: 'Left Curve',
      steeringRecommendation: 'Gentle steer left (-1.2°); Reduce speed advisory',
      reliabilityScore: 0.82,
      reliabilityState: 'Caution',
      processingLatencyMs: 26.5,
      fps: 37.7
    }
  },
  {
    id: 'night-glare',
    name: 'Night Oncoming Headlight Glare',
    tag: 'Night / Glare',
    weather: 'Night / High Dynamic Range Glare',
    weatherConfidence: 0.95,
    timeOfDay: 'Night (22:30)',
    roadType: 'Suburban Arterial',
    visibility: 'Low',
    description: 'High contrast dynamic range with direct blinding oncoming LED headlights and deep shadow zones.',
    challenge: 'Extreme pixel blooming saturates camera sensors; single-frame detectors drop left lane.',
    imageUrl: 'night_scene',
    lanes: [
      {
        id: 'lane-l1',
        type: 'left',
        points: [[20, 98], [27, 80], [37, 65], [45, 55], [49, 50]],
        confidence: 0.90,
        dashed: false
      },
      {
        id: 'lane-r1',
        type: 'right',
        points: [[80, 98], [73, 80], [63, 65], [55, 55], [51, 50]],
        confidence: 0.93,
        dashed: true
      }
    ],
    drivablePolygon: [
      [20, 98], [27, 80], [37, 65], [45, 55], [49, 50],
      [51, 50], [55, 55], [63, 65], [73, 80], [80, 98]
    ],
    drivableIoU: 0.85,
    drivableCoverage: 75,
    drivableConfidence: 0.88,
    vehicles: [
      { id: 'v1', label: 'oncoming car', confidence: 0.94, box: [38, 46, 48, 58], color: '#f43f5e' },
      { id: 'v2', label: 'car', confidence: 0.89, box: [59, 49, 71, 64], color: '#a855f7' }
    ],
    temporalStability: 0.87,
    temporalFrames: [
      { frameId: 301, timestamp: '00:14.02', description: 'Oncoming beam begins blooming', stability: 0.91, occlusionLevel: 15 },
      { frameId: 302, timestamp: '00:14.06', description: 'Peak glare flash saturates left lane zone', stability: 0.77, occlusionLevel: 70 },
      { frameId: 303, timestamp: '00:14.10', description: 'Adaptive preprocessing normalizes histogram', stability: 0.85, occlusionLevel: 30 },
      { frameId: 304, timestamp: '00:14.14', description: 'Target lane geometry locked and verified', stability: 0.89, occlusionLevel: 10 }
    ],
    telemetry: {
      laneCenterOffsetCm: +2.1,
      curvatureRadiusM: 2100,
      curvatureDirection: 'Straight',
      steeringRecommendation: 'Centered; High beam glare filter active',
      reliabilityScore: 0.88,
      reliabilityState: 'Reliable',
      processingLatencyMs: 23.8,
      fps: 42.0
    }
  },
  {
    id: 'faded-markings',
    name: 'Faded Markings & Unstructured Road',
    tag: 'Faded Markings / IDD',
    weather: 'Overcast / Faded Markings',
    weatherConfidence: 0.88,
    timeOfDay: 'Afternoon (15:20)',
    roadType: 'Unstructured Semi-Urban',
    visibility: 'Moderate',
    description: 'Worn-out paint with asphalt patches, discontinuous lane markers, and roadside dust.',
    challenge: 'Markings are worn below 20% contrast; drivable area and lane boundaries must cross-guide each other.',
    imageUrl: 'faded_scene',
    lanes: [
      {
        id: 'lane-l1',
        type: 'left',
        points: [[15, 98], [24, 82], [34, 68], [42, 58], [48, 52]],
        confidence: 0.83,
        dashed: true
      },
      {
        id: 'lane-r1',
        type: 'right',
        points: [[85, 98], [76, 82], [66, 68], [58, 58], [52, 52]],
        confidence: 0.81,
        dashed: false
      }
    ],
    drivablePolygon: [
      [15, 98], [24, 82], [34, 68], [42, 58], [48, 52],
      [52, 52], [58, 58], [66, 68], [76, 82], [85, 98]
    ],
    drivableIoU: 0.88,
    drivableCoverage: 82,
    drivableConfidence: 0.91,
    vehicles: [
      { id: 'v1', label: 'auto-rickshaw', confidence: 0.91, box: [60, 52, 73, 72], color: '#f59e0b' },
      { id: 'v2', label: 'motorcycle', confidence: 0.87, box: [28, 55, 36, 70], color: '#38bdf8' }
    ],
    temporalStability: 0.85,
    temporalFrames: [
      { frameId: 401, timestamp: '00:21.40', description: 'Patchy asphalt with partial center stripe', stability: 0.87, occlusionLevel: 10 },
      { frameId: 402, timestamp: '00:21.44', description: 'Stripes vanish across pothole patch', stability: 0.76, occlusionLevel: 55 },
      { frameId: 403, timestamp: '00:21.48', description: 'Drivable mask guides virtual boundary reconstruction', stability: 0.84, occlusionLevel: 25 },
      { frameId: 404, timestamp: '00:21.52', description: 'Continuous corridor verified by consistency loss', stability: 0.88, occlusionLevel: 15 }
    ],
    telemetry: {
      laneCenterOffsetCm: -8.8,
      curvatureRadiusM: 950,
      curvatureDirection: 'Right Curve',
      steeringRecommendation: 'Right curve trim (+0.9°); Watch edge margin',
      reliabilityScore: 0.83,
      reliabilityState: 'Caution',
      processingLatencyMs: 25.1,
      fps: 39.8
    }
  },
  {
    id: 'weather-transition',
    name: 'Dynamic Weather Transition (Clear → Storm)',
    tag: 'Weather Transition',
    weather: 'Transition: Clear → Sudden Rain',
    weatherConfidence: 0.91,
    timeOfDay: 'Dusk (19:10)',
    roadType: 'Interstate Highway',
    visibility: 'Low',
    description: 'Sudden onset of convective storm with rapid atmospheric light drop and asphalt darkening.',
    challenge: 'Transition-induced cross-task inconsistency: single-frame lane detection drops while drivable mask lags.',
    imageUrl: 'transition_scene',
    lanes: [
      {
        id: 'lane-l1',
        type: 'left',
        points: [[24, 98], [30, 80], [38, 65], [45, 55], [49, 48]],
        confidence: 0.92,
        dashed: false
      },
      {
        id: 'lane-r1',
        type: 'right',
        points: [[76, 98], [70, 80], [62, 65], [55, 55], [51, 48]],
        confidence: 0.90,
        dashed: true
      }
    ],
    drivablePolygon: [
      [24, 98], [30, 80], [38, 65], [45, 55], [49, 48],
      [51, 48], [55, 55], [62, 65], [70, 80], [76, 98]
    ],
    drivableIoU: 0.87,
    drivableCoverage: 76,
    drivableConfidence: 0.89,
    vehicles: [
      { id: 'v1', label: 'car', confidence: 0.95, box: [48, 50, 60, 67], color: '#a855f7' },
      { id: 'v2', label: 'truck', confidence: 0.88, box: [18, 48, 32, 65], color: '#f59e0b' }
    ],
    temporalStability: 0.89,
    temporalFrames: [
      { frameId: 501, timestamp: '00:30.00', description: 'Phase 1: Dry asphalt, overcast sky', stability: 0.96, occlusionLevel: 0 },
      { frameId: 502, timestamp: '00:30.05', description: 'Phase 2: First raindrops hit; surface darkens', stability: 0.88, occlusionLevel: 20 },
      { frameId: 503, timestamp: '00:30.10', description: 'Phase 3: Heavy splash transition with reflection', stability: 0.85, occlusionLevel: 45 },
      { frameId: 504, timestamp: '00:30.15', description: 'Phase 4: Transition-aware loss maintains cross-task alignment', stability: 0.91, occlusionLevel: 15 }
    ],
    telemetry: {
      laneCenterOffsetCm: +1.5,
      curvatureRadiusM: 3200,
      curvatureDirection: 'Straight',
      steeringRecommendation: 'On center trajectory; Rain mode engaged',
      reliabilityScore: 0.90,
      reliabilityState: 'Reliable',
      processingLatencyMs: 24.8,
      fps: 40.3
    }
  },
  {
    id: 'snow-slush',
    name: 'Snow, Ice & Slush Obscuration',
    tag: 'Snow / Winter',
    weather: 'Snow / Partial Ice Slush',
    weatherConfidence: 0.92,
    timeOfDay: 'Day (11:00)',
    roadType: 'Sub-Zero Expressway',
    visibility: 'Moderate',
    description: 'White road surface where snowdrifts cover lane markers and wheel ruts simulate lane paths.',
    challenge: 'False visual tracks caused by tire tracks in snow; model must discern true geometric road corridor.',
    imageUrl: 'snow_scene',
    lanes: [
      {
        id: 'lane-l1',
        type: 'left',
        points: [[26, 98], [32, 80], [39, 65], [46, 55], [49, 48]],
        confidence: 0.87,
        dashed: false
      },
      {
        id: 'lane-r1',
        type: 'right',
        points: [[74, 98], [68, 80], [61, 65], [54, 55], [51, 48]],
        confidence: 0.86,
        dashed: false
      }
    ],
    drivablePolygon: [
      [26, 98], [32, 80], [39, 65], [46, 55], [49, 48],
      [51, 48], [54, 55], [61, 65], [68, 80], [74, 98]
    ],
    drivableIoU: 0.83,
    drivableCoverage: 74,
    drivableConfidence: 0.87,
    vehicles: [
      { id: 'v1', label: 'suv', confidence: 0.90, box: [52, 51, 63, 68], color: '#38bdf8' }
    ],
    temporalStability: 0.86,
    temporalFrames: [
      { frameId: 601, timestamp: '00:36.12', description: 'Visible cleared path', stability: 0.90, occlusionLevel: 10 },
      { frameId: 602, timestamp: '00:36.16', description: 'Fresh snow accumulation covers right marking', stability: 0.78, occlusionLevel: 60 },
      { frameId: 603, timestamp: '00:36.20', description: 'Geometric curvature propagation locks right edge', stability: 0.85, occlusionLevel: 30 },
      { frameId: 604, timestamp: '00:36.24', description: 'Stabilized winter lane corridor', stability: 0.88, occlusionLevel: 15 }
    ],
    telemetry: {
      laneCenterOffsetCm: -3.2,
      curvatureRadiusM: 1800,
      curvatureDirection: 'Straight',
      steeringRecommendation: 'Maintain steady course; Traction advisory',
      reliabilityScore: 0.86,
      reliabilityState: 'Reliable',
      processingLatencyMs: 25.4,
      fps: 39.4
    }
  }
];

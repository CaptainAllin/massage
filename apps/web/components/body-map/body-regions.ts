// Body region definitions with SVG path coordinates
// Coordinates are relative to a 400x800 viewBox (width x height)

export interface BodyRegion {
  id: string;
  name: string;
  path: string; // SVG path data
  synonyms: string[]; // Alternative names for search
}

// Front view regions
export const frontViewRegions: BodyRegion[] = [
  {
    id: 'head-front',
    name: 'Head (Front)',
    path: 'M 180 40 Q 160 30, 160 60 Q 160 80, 180 90 Q 200 90, 220 80 Q 220 60, 220 40 Q 220 30, 200 30 Q 180 30, 180 40 Z',
    synonyms: ['face', 'forehead', 'head'],
  },
  {
    id: 'neck-front',
    name: 'Neck (Front)',
    path: 'M 180 90 L 170 120 L 210 120 L 200 90 Z',
    synonyms: ['throat', 'cervical'],
  },
  {
    id: 'chest',
    name: 'Chest',
    path: 'M 140 120 Q 130 140, 140 180 L 160 200 L 220 200 L 240 180 Q 250 140, 240 120 L 200 110 L 180 110 Z',
    synonyms: ['pectorals', 'pecs', 'breast'],
  },
  {
    id: 'left-shoulder-front',
    name: 'Left Shoulder',
    path: 'M 100 110 Q 90 120, 100 140 L 140 120 L 130 100 Z',
    synonyms: ['deltoid', 'shoulder'],
  },
  {
    id: 'right-shoulder-front',
    name: 'Right Shoulder',
    path: 'M 280 110 Q 290 120, 280 140 L 240 120 L 250 100 Z',
    synonyms: ['deltoid', 'shoulder'],
  },
  {
    id: 'abdomen-upper',
    name: 'Upper Abdomen',
    path: 'M 160 200 L 140 240 L 240 240 L 220 200 Z',
    synonyms: ['stomach', 'upper abs', 'solar plexus'],
  },
  {
    id: 'abdomen-lower',
    name: 'Lower Abdomen',
    path: 'M 140 240 L 130 290 L 250 290 L 240 240 Z',
    synonyms: ['lower abs', 'belly'],
  },
  {
    id: 'left-arm-upper-front',
    name: 'Left Upper Arm',
    path: 'M 100 140 L 80 220 L 110 230 L 130 150 Z',
    synonyms: ['bicep', 'upper arm'],
  },
  {
    id: 'right-arm-upper-front',
    name: 'Right Upper Arm',
    path: 'M 280 140 L 300 220 L 270 230 L 250 150 Z',
    synonyms: ['bicep', 'upper arm'],
  },
  {
    id: 'left-forearm-front',
    name: 'Left Forearm',
    path: 'M 80 220 L 60 320 L 90 330 L 110 230 Z',
    synonyms: ['forearm'],
  },
  {
    id: 'right-forearm-front',
    name: 'Right Forearm',
    path: 'M 300 220 L 320 320 L 290 330 L 270 230 Z',
    synonyms: ['forearm'],
  },
  {
    id: 'left-hand',
    name: 'Left Hand',
    path: 'M 60 320 Q 50 340, 60 360 L 90 360 Q 100 340, 90 330 Z',
    synonyms: ['hand', 'palm'],
  },
  {
    id: 'right-hand',
    name: 'Right Hand',
    path: 'M 320 320 Q 330 340, 320 360 L 290 360 Q 280 340, 290 330 Z',
    synonyms: ['hand', 'palm'],
  },
  {
    id: 'left-hip',
    name: 'Left Hip',
    path: 'M 130 290 L 120 340 L 160 350 L 165 300 Z',
    synonyms: ['hip', 'pelvis'],
  },
  {
    id: 'right-hip',
    name: 'Right Hip',
    path: 'M 250 290 L 260 340 L 220 350 L 215 300 Z',
    synonyms: ['hip', 'pelvis'],
  },
  {
    id: 'left-thigh-front',
    name: 'Left Thigh (Front)',
    path: 'M 120 340 L 100 480 L 140 490 L 160 350 Z',
    synonyms: ['quadriceps', 'quads', 'thigh'],
  },
  {
    id: 'right-thigh-front',
    name: 'Right Thigh (Front)',
    path: 'M 260 340 L 280 480 L 240 490 L 220 350 Z',
    synonyms: ['quadriceps', 'quads', 'thigh'],
  },
  {
    id: 'left-knee-front',
    name: 'Left Knee',
    path: 'M 100 480 L 95 520 L 145 530 L 140 490 Z',
    synonyms: ['knee', 'patella'],
  },
  {
    id: 'right-knee-front',
    name: 'Right Knee',
    path: 'M 280 480 L 285 520 L 235 530 L 240 490 Z',
    synonyms: ['knee', 'patella'],
  },
  {
    id: 'left-shin',
    name: 'Left Shin',
    path: 'M 95 520 L 85 660 L 125 670 L 145 530 Z',
    synonyms: ['shin', 'lower leg'],
  },
  {
    id: 'right-shin',
    name: 'Right Shin',
    path: 'M 285 520 L 295 660 L 255 670 L 235 530 Z',
    synonyms: ['shin', 'lower leg'],
  },
  {
    id: 'left-foot',
    name: 'Left Foot',
    path: 'M 85 660 Q 70 680, 80 700 L 125 700 Q 135 680, 125 670 Z',
    synonyms: ['foot'],
  },
  {
    id: 'right-foot',
    name: 'Right Foot',
    path: 'M 295 660 Q 310 680, 300 700 L 255 700 Q 245 680, 255 670 Z',
    synonyms: ['foot'],
  },
];

// Back view regions
export const backViewRegions: BodyRegion[] = [
  {
    id: 'head-back',
    name: 'Head (Back)',
    path: 'M 180 40 Q 160 30, 160 60 Q 160 80, 180 90 Q 200 90, 220 80 Q 220 60, 220 40 Q 220 30, 200 30 Q 180 30, 180 40 Z',
    synonyms: ['occiput', 'head', 'skull'],
  },
  {
    id: 'neck-back',
    name: 'Neck (Back)',
    path: 'M 180 90 L 170 120 L 210 120 L 200 90 Z',
    synonyms: ['cervical', 'c-spine'],
  },
  {
    id: 'upper-back',
    name: 'Upper Back',
    path: 'M 140 120 Q 130 160, 160 200 L 220 200 Q 250 160, 240 120 Z',
    synonyms: ['thoracic', 't-spine', 'upper traps', 'trapezius'],
  },
  {
    id: 'left-shoulder-back',
    name: 'Left Shoulder (Back)',
    path: 'M 100 110 Q 90 140, 110 160 L 140 120 Z',
    synonyms: ['deltoid', 'shoulder blade', 'scapula'],
  },
  {
    id: 'right-shoulder-back',
    name: 'Right Shoulder (Back)',
    path: 'M 280 110 Q 290 140, 270 160 L 240 120 Z',
    synonyms: ['deltoid', 'shoulder blade', 'scapula'],
  },
  {
    id: 'mid-back',
    name: 'Mid Back',
    path: 'M 160 200 L 150 260 L 230 260 L 220 200 Z',
    synonyms: ['thoracic', 'mid traps', 'rhomboids'],
  },
  {
    id: 'lower-back',
    name: 'Lower Back',
    path: 'M 150 260 L 140 310 L 240 310 L 230 260 Z',
    synonyms: ['lumbar', 'low back', 'l-spine'],
  },
  {
    id: 'left-arm-upper-back',
    name: 'Left Upper Arm (Back)',
    path: 'M 110 160 L 90 240 L 120 250 L 130 170 Z',
    synonyms: ['tricep', 'upper arm'],
  },
  {
    id: 'right-arm-upper-back',
    name: 'Right Upper Arm (Back)',
    path: 'M 270 160 L 290 240 L 260 250 L 250 170 Z',
    synonyms: ['tricep', 'upper arm'],
  },
  {
    id: 'left-forearm-back',
    name: 'Left Forearm (Back)',
    path: 'M 90 240 L 70 340 L 100 350 L 120 250 Z',
    synonyms: ['forearm'],
  },
  {
    id: 'right-forearm-back',
    name: 'Right Forearm (Back)',
    path: 'M 290 240 L 310 340 L 280 350 L 260 250 Z',
    synonyms: ['forearm'],
  },
  {
    id: 'sacrum',
    name: 'Sacrum',
    path: 'M 165 310 L 160 350 L 220 350 L 215 310 Z',
    synonyms: ['sacral', 'tailbone', 'coccyx'],
  },
  {
    id: 'left-glute',
    name: 'Left Glute',
    path: 'M 140 310 L 120 380 L 170 390 L 165 320 Z',
    synonyms: ['glute', 'buttock', 'gluteus'],
  },
  {
    id: 'right-glute',
    name: 'Right Glute',
    path: 'M 240 310 L 260 380 L 210 390 L 215 320 Z',
    synonyms: ['glute', 'buttock', 'gluteus'],
  },
  {
    id: 'left-hamstring',
    name: 'Left Hamstring',
    path: 'M 120 380 L 105 500 L 145 510 L 170 390 Z',
    synonyms: ['hamstring', 'thigh back'],
  },
  {
    id: 'right-hamstring',
    name: 'Right Hamstring',
    path: 'M 260 380 L 275 500 L 235 510 L 210 390 Z',
    synonyms: ['hamstring', 'thigh back'],
  },
  {
    id: 'left-calf',
    name: 'Left Calf',
    path: 'M 105 500 L 95 640 L 135 650 L 145 510 Z',
    synonyms: ['calf', 'gastrocnemius'],
  },
  {
    id: 'right-calf',
    name: 'Right Calf',
    path: 'M 275 500 L 285 640 L 245 650 L 235 510 Z',
    synonyms: ['calf', 'gastrocnemius'],
  },
];

// Search index for quick lookups
export const bodyRegionIndex = [...frontViewRegions, ...backViewRegions].reduce((acc, region) => {
  // Index by ID
  acc[region.id] = region;

  // Index by name (lowercase)
  acc[region.name.toLowerCase()] = region;

  // Index by synonyms (lowercase)
  region.synonyms.forEach(synonym => {
    acc[synonym.toLowerCase()] = region;
  });

  return acc;
}, {} as Record<string, BodyRegion>);

// Search function
export function searchBodyRegions(query: string): BodyRegion[] {
  const lowerQuery = query.toLowerCase();
  const results = new Set<BodyRegion>();

  [...frontViewRegions, ...backViewRegions].forEach(region => {
    if (
      region.name.toLowerCase().includes(lowerQuery) ||
      region.synonyms.some(s => s.toLowerCase().includes(lowerQuery))
    ) {
      results.add(region);
    }
  });

  return Array.from(results);
}

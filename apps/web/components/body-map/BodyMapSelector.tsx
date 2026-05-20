'use client';

import React, { useState } from 'react';
import { frontViewRegions, backViewRegions, BodyRegion } from './body-regions';
import { Tag } from '@massage/ui';

export interface BodyMapSelection {
  regionId: string;
  regionName: string;
  painLevel: number;
}

export interface BodyMapSelectorProps {
  view: 'front' | 'back';
  selectedRegions: BodyMapSelection[];
  onChange: (selections: BodyMapSelection[]) => void;
  readOnly?: boolean;
  showPainLevel?: boolean;
  className?: string;
}

export const BodyMapSelector: React.FC<BodyMapSelectorProps> = ({
  view,
  selectedRegions,
  onChange,
  readOnly = false,
  showPainLevel = true,
  className = '',
}) => {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [selectedForPainLevel, setSelectedForPainLevel] = useState<string | null>(null);

  const regions = view === 'front' ? frontViewRegions : backViewRegions;

  const isSelected = (regionId: string) => {
    return selectedRegions.some((s) => s.regionId === regionId);
  };

  const getSelection = (regionId: string) => {
    return selectedRegions.find((s) => s.regionId === regionId);
  };

  const handleRegionClick = (region: BodyRegion) => {
    if (readOnly) return;

    const existingIndex = selectedRegions.findIndex((s) => s.regionId === region.id);

    if (existingIndex >= 0) {
      // Remove selection
      const newSelections = [...selectedRegions];
      newSelections.splice(existingIndex, 1);
      onChange(newSelections);
      setSelectedForPainLevel(null);
    } else {
      // Add selection
      if (showPainLevel) {
        setSelectedForPainLevel(region.id);
      } else {
        onChange([
          ...selectedRegions,
          {
            regionId: region.id,
            regionName: region.name,
            painLevel: 0,
          },
        ]);
      }
    }
  };

  const handlePainLevelSet = (regionId: string, painLevel: number) => {
    const region = regions.find((r) => r.id === regionId);
    if (!region) return;

    onChange([
      ...selectedRegions,
      {
        regionId: region.id,
        regionName: region.name,
        painLevel,
      },
    ]);
    setSelectedForPainLevel(null);
  };

  const removeSelection = (regionId: string) => {
    if (readOnly) return;
    onChange(selectedRegions.filter((s) => s.regionId !== regionId));
  };

  const getRegionColor = (regionId: string) => {
    const selection = getSelection(regionId);
    if (!selection) return 'transparent';

    if (!showPainLevel) return '#A8C3A0'; // Primary green

    // Color gradient from green (0) to red (10)
    const painLevel = selection.painLevel;
    if (painLevel === 0) return '#A8C3A0'; // Green
    if (painLevel <= 3) return '#FFD93D'; // Yellow
    if (painLevel <= 6) return '#FF9F40'; // Orange
    return '#FF6B6B'; // Red
  };

  return (
    <div className={className}>
      {/* SVG Body Map */}
      <svg
        viewBox="0 0 400 800"
        className="w-full max-w-md mx-auto"
        style={{ maxHeight: '600px' }}
      >
        {/* Background */}
        <rect width="400" height="800" fill="#F9FAFB" />

        {/* Body outline (simplified figure) */}
        <path
          d="M 190 30 Q 160 30, 160 60 Q 160 100, 170 120 L 140 120 Q 100 120, 100 160 L 80 220 L 60 320 L 60 360 L 90 360 L 110 230 L 130 150 L 130 290 L 120 340 L 100 480 L 95 520 L 85 660 L 80 700 L 125 700 L 125 670 L 145 530 L 160 350 L 165 300 L 165 350 L 160 400 L 140 490 L 140 530 L 145 650 L 125 670 L 125 700 L 165 700 L 180 650 L 185 550 L 190 400 L 190 30"
          fill="none"
          stroke="#D1D5DB"
          strokeWidth="2"
          opacity="0.3"
        />

        {/* Render all regions */}
        {regions.map((region) => {
          const selected = isSelected(region.id);
          const hovered = hoveredRegion === region.id;

          return (
            <g key={region.id}>
              <path
                d={region.path}
                fill={getRegionColor(region.id)}
                stroke={selected ? '#059669' : '#D1D5DB'}
                strokeWidth={selected ? 3 : 1}
                opacity={selected ? 0.8 : hovered ? 0.5 : 0.2}
                style={{
                  cursor: readOnly ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => handleRegionClick(region)}
                onMouseEnter={() => !readOnly && setHoveredRegion(region.id)}
                onMouseLeave={() => setHoveredRegion(null)}
              />
              {/* Show region name on hover */}
              {hovered && !readOnly && (
                <text
                  x="200"
                  y="760"
                  textAnchor="middle"
                  fill="#374151"
                  fontSize="14"
                  fontWeight="600"
                >
                  {region.name}
                </text>
              )}
            </g>
          );
        })}

        {/* View label */}
        <text x="200" y="780" textAnchor="middle" fill="#6B7280" fontSize="12">
          {view === 'front' ? 'Front View' : 'Back View'}
        </text>
      </svg>

      {/* Pain Level Selector Modal */}
      {selectedForPainLevel && showPainLevel && (
        <div className="mt-4 p-4 bg-white border-2 border-primary rounded-xl">
          <h4 className="text-sm font-semibold mb-2">
            Pain Level for {regions.find((r) => r.id === selectedForPainLevel)?.name}
          </h4>
          <div className="flex gap-2 flex-wrap">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
              <button
                key={level}
                onClick={() => handlePainLevelSet(selectedForPainLevel, level)}
                className="w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-primary font-semibold transition-colors"
                style={{
                  backgroundColor:
                    level === 0
                      ? '#A8C3A0'
                      : level <= 3
                      ? '#FFD93D'
                      : level <= 6
                      ? '#FF9F40'
                      : '#FF6B6B',
                  color: level <= 3 ? '#000' : '#fff',
                }}
              >
                {level}
              </button>
            ))}
          </div>
          <button
            onClick={() => setSelectedForPainLevel(null)}
            className="mt-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Selected Regions Display */}
      {selectedRegions.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold mb-2">Selected Regions:</h4>
          <div className="flex flex-wrap gap-2">
            {selectedRegions.map((selection) => (
              <Tag
                key={selection.regionId}
                variant="primary"
                onRemove={!readOnly ? () => removeSelection(selection.regionId) : undefined}
              >
                {selection.regionName}
                {showPainLevel && ` (Pain: ${selection.painLevel}/10)`}
              </Tag>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

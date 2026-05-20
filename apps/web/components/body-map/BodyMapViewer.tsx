'use client';

import React from 'react';
import { BodyMapSelector, BodyMapSelection } from './BodyMapSelector';

export interface BodyMapViewerProps {
  view: 'front' | 'back';
  selections: BodyMapSelection[];
  showPainLevel?: boolean;
  className?: string;
}

export const BodyMapViewer: React.FC<BodyMapViewerProps> = ({
  view,
  selections,
  showPainLevel = true,
  className = '',
}) => {
  return (
    <BodyMapSelector
      view={view}
      selectedRegions={selections}
      onChange={() => {}} // No-op for read-only
      readOnly={true}
      showPainLevel={showPainLevel}
      className={className}
    />
  );
};

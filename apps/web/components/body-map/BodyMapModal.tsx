'use client';

import React, { useState } from 'react';
import { Modal, Tabs, Tab, Button, Textarea } from '@massage/ui';
import { BodyMapSelector, BodyMapSelection } from './BodyMapSelector';
import { AnatomySearch } from './AnatomySearch';
import { BodyRegion } from './body-regions';

export interface BodyMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    view: 'front' | 'back';
    selections: BodyMapSelection[];
    notes: string;
  }) => void;
  initialView?: 'front' | 'back';
  initialSelections?: BodyMapSelection[];
  initialNotes?: string;
  title?: string;
}

export const BodyMapModal: React.FC<BodyMapModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialView = 'front',
  initialSelections = [],
  initialNotes = '',
  title = 'Body Map',
}) => {
  const [view, setView] = useState<'front' | 'back'>(initialView);
  const [selections, setSelections] = useState<BodyMapSelection[]>(initialSelections);
  const [notes, setNotes] = useState(initialNotes);

  const handleSave = () => {
    onSave({ view, selections, notes });
    onClose();
  };

  const handleCancel = () => {
    // Reset to initial values
    setView(initialView);
    setSelections(initialSelections);
    setNotes(initialNotes);
    onClose();
  };

  const handleRegionSelectFromSearch = (region: BodyRegion) => {
    // Check if region already selected
    const exists = selections.some((s) => s.regionId === region.id);
    if (exists) return;

    // Add region with default pain level 5
    setSelections([
      ...selections,
      {
        regionId: region.id,
        regionName: region.name,
        painLevel: 5,
      },
    ]);

    // Switch to the correct view if needed
    if (region.id.includes('front') && view !== 'front') {
      setView('front');
    } else if (region.id.includes('back') && view !== 'back') {
      setView('back');
    }
  };

  const tabs: Tab[] = [
    { id: 'front', label: 'Front View' },
    { id: 'back', label: 'Back View' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title={title} size="xl">
      <div className="space-y-6">
        {/* Anatomy Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quick Search
          </label>
          <AnatomySearch
            onRegionSelect={handleRegionSelectFromSearch}
            placeholder="Search body parts (e.g., 'shoulder', 'low back', 'quad')"
          />
        </div>

        {/* View Tabs */}
        <Tabs
          tabs={tabs}
          activeTab={view}
          onChange={(tabId) => setView(tabId as 'front' | 'back')}
        />

        {/* Body Map Selector */}
        <BodyMapSelector
          view={view}
          selectedRegions={selections}
          onChange={setSelections}
          showPainLevel={true}
        />

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes about areas of concern, specific pain descriptions, etc."
            rows={4}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Body Map
          </Button>
        </div>
      </div>
    </Modal>
  );
};

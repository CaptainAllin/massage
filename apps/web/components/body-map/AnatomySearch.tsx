'use client';

import React, { useState, useEffect } from 'react';
import { SearchInput } from '@massage/ui';
import { searchBodyRegions, BodyRegion } from './body-regions';

export interface AnatomySearchProps {
  onRegionSelect: (region: BodyRegion) => void;
  placeholder?: string;
  className?: string;
}

export const AnatomySearch: React.FC<AnatomySearchProps> = ({
  onRegionSelect,
  placeholder = 'Search body parts (e.g., "shoulder", "low back")',
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BodyRegion[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (query.length >= 2) {
      const searchResults = searchBodyRegions(query);
      setResults(searchResults);
      setIsOpen(searchResults.length > 0);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [query]);

  const handleSelect = (region: BodyRegion) => {
    onRegionSelect(region);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <SearchInput
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onClear={handleClear}
        placeholder={placeholder}
      />

      {/* Search Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
          {results.map((region) => (
            <button
              key={region.id}
              onClick={() => handleSelect(region)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-gray-900">{region.name}</div>
              {region.synonyms.length > 0 && (
                <div className="text-sm text-gray-500 mt-1">
                  Also known as: {region.synonyms.join(', ')}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* No Results Message */}
      {query.length >= 2 && results.length === 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg p-4 text-center text-gray-500">
          No body regions found for "{query}"
        </div>
      )}
    </div>
  );
};

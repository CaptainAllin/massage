'use client';

import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input, Button, Card, CardContent, CardHeader, CardTitle } from '@massage/ui';
import { VoiceNoteList } from './VoiceNoteList';
import { useVoiceNoteSearch } from './hooks/useVoiceNotes';

interface VoiceNoteSearchProps {
  businessId: string;
  clientId?: string;
  therapistId?: string;
}

export const VoiceNoteSearch: React.FC<VoiceNoteSearchProps> = ({
  businessId,
  clientId,
  therapistId,
}) => {
  const [query, setQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, isError, error } = useVoiceNoteSearch({
    query: searchQuery,
    businessId,
    clientId,
    therapistId,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 3) {
      setSearchQuery(query.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
    setSearchQuery('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Search Voice Notes
        </CardTitle>
        <p className="text-sm text-gray-600">Search through transcriptions to find specific notes</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search transcriptions... (min. 3 characters)"
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Button type="submit" disabled={query.trim().length < 3 || isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
          {searchQuery && (
            <Button type="button" variant="outline" onClick={handleClear}>
              Clear
            </Button>
          )}
        </form>

        {searchQuery && (
          <div className="space-y-3">
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            )}

            {isError && (
              <div className="text-center py-8">
                <p className="text-red-600">
                  {error instanceof Error ? error.message : 'Search failed'}
                </p>
              </div>
            )}

            {data && !isLoading && (
              <>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Found {data.meta?.total || 0} result(s) for &quot;{searchQuery}&quot;</span>
                </div>

                {data.data && data.data.length > 0 ? (
                  <VoiceNoteList voiceNotes={data.data} showActions={true} />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No results found for &quot;{searchQuery}&quot;</p>
                    <p className="text-sm text-gray-400 mt-2">Try different keywords or check spelling</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {!searchQuery && (
          <div className="text-center py-8 text-gray-500">
            <Search className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>Enter a search term to find voice notes</p>
            <p className="text-sm text-gray-400 mt-1">Search through all transcribed voice notes</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

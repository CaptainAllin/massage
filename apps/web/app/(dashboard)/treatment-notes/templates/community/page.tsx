'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Card, CardContent } from '@massage/ui';
import { ArrowLeft, Search, Download, Users, Globe } from 'lucide-react';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useCommunityTemplates, useImportCommunityTemplate } from '@/lib/hooks/use-note-templates';
import { CommunityTemplate } from '@massage/types';

const CATEGORIES = ['Massage', 'Chiro', 'Physio', 'General'];

const CATEGORY_COLORS: Record<string, string> = {
  Massage: 'bg-purple-100 text-purple-700',
  Chiro: 'bg-blue-100 text-blue-700',
  Physio: 'bg-green-100 text-green-700',
  General: 'bg-gray-100 text-gray-700',
};

function CommunityTemplateCard({
  template,
  onImport,
  isImporting,
}: {
  template: CommunityTemplate;
  onImport: () => void;
  isImporting: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-medium text-gray-900 text-sm">{template.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[template.category] ?? 'bg-gray-100 text-gray-600'}`}>
                {template.category}
              </span>
            </div>
            {template.description && (
              <p className="text-xs text-gray-500 mb-2 line-clamp-2">{template.description}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <span>{Array.isArray(template.fields) ? template.fields.length : 0} fields</span>
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {template.usageCount} {template.usageCount === 1 ? 'import' : 'imports'}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onImport}
            isLoading={isImporting}
            className="shrink-0"
          >
            <Download className="h-4 w-4 mr-1" />
            Import
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CommunityLibraryPage() {
  const businessId = useBusinessId();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());

  const { data, isLoading } = useCommunityTemplates({
    category: categoryFilter === 'all' ? undefined : categoryFilter,
    search: debouncedSearch || undefined,
  });

  const importTemplate = useImportCommunityTemplate(businessId);

  const templates = data?.templates ?? [];
  const total = data?.total ?? 0;

  const handleSearchChange = (value: string) => {
    setSearch(value);
    clearTimeout((handleSearchChange as any)._t);
    (handleSearchChange as any)._t = setTimeout(() => setDebouncedSearch(value), 300);
  };

  const handleImport = async (template: CommunityTemplate) => {
    setImportingId(template.id);
    try {
      await importTemplate.mutateAsync(template.id);
      setImportedIds((prev) => new Set([...prev, template.id]));
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/treatment-notes/templates">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#5D4AA8' }}>Treatment Notes</p>
            <h1 className="text-2xl font-semibold font-display flex items-center gap-2" style={{ color: '#1E1830' }}>
              <Globe className="h-6 w-6" style={{ color: '#5D4AA8' }} />
              Community Library
            </h1>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        Browse templates shared by the community. Import any template to customise it for your practice.
      </p>

      {/* Search + Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-9 pr-3 h-9 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              categoryFilter === 'all' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                categoryFilter === cat
                  ? CATEGORY_COLORS[cat]
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <Globe className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {debouncedSearch || categoryFilter !== 'all'
                ? 'No templates match your search.'
                : 'No community templates yet. Be the first to share one!'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-xs text-gray-400">{total} template{total !== 1 ? 's' : ''} available</p>
          <div className="space-y-2">
            {templates.map((template) => (
              <div key={template.id} className="relative">
                {importedIds.has(template.id) && (
                  <div className="absolute inset-0 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center z-10">
                    <span className="text-sm font-medium text-green-700 flex items-center gap-1.5">
                      <Download className="h-4 w-4" />
                      Added to My Templates
                    </span>
                  </div>
                )}
                <CommunityTemplateCard
                  template={template}
                  onImport={() => handleImport(template)}
                  isImporting={importingId === template.id}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

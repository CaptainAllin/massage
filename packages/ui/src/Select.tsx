'use client';

import * as React from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import { cn } from './utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  name?: string;
  id?: string;
}

const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ options, value = '', onChange, placeholder, error, disabled, className }, ref) => {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const containerRef = React.useRef<HTMLDivElement>(null);
    const searchRef = React.useRef<HTMLInputElement>(null);

    const selected = options.find((o) => o.value === value);

    const filtered = React.useMemo(() =>
      search.trim()
        ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
        : options,
      [options, search]
    );

    React.useEffect(() => {
      const handleOutsideClick = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false);
          setSearch('');
        }
      };
      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    const handleOpen = () => {
      if (disabled) return;
      setOpen(true);
      setTimeout(() => searchRef.current?.focus(), 0);
    };

    const handleSelect = (optionValue: string) => {
      onChange?.({ target: { value: optionValue } } as React.ChangeEvent<HTMLSelectElement>);
      setOpen(false);
      setSearch('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setSearch('');
      }
    };

    return (
      <div ref={(node) => {
        (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }} className={cn('relative w-full', className)} onKeyDown={handleKeyDown}>
        <button
          type="button"
          onClick={handleOpen}
          disabled={disabled}
          className={cn(
            'flex h-11 w-full items-center justify-between rounded-xl border border-[#E5DEEC] bg-white px-4 py-2 text-base text-left',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5D4AA8] focus-visible:border-[#5D4AA8]',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus-visible:ring-red-500'
          )}
        >
          <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
            {selected ? selected.label : (placeholder ?? 'Select an option')}
          </span>
          <ChevronDown
            size={16}
            className={cn('shrink-0 text-gray-400 transition-transform duration-150', open && 'rotate-180')}
          />
        </button>

        {open && (
          <div className="absolute z-50 w-full mt-1 rounded-xl border border-[#E5DEEC] bg-white shadow-lg">
            <div className="p-2 border-b border-[#E5DEEC]">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="w-full rounded-lg border border-[#E5DEEC] pl-7 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4AA8] focus:border-[#5D4AA8]"
                />
              </div>
            </div>

            <div className="max-h-52 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <div className="px-4 py-2 text-sm text-gray-400">No results</div>
              ) : (
                filtered.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      'flex w-full items-center gap-2 px-4 py-2 text-sm text-left hover:bg-[#EFE9F2] disabled:opacity-50 disabled:cursor-not-allowed',
                      option.value === value && 'bg-[#EFE9F2] font-medium text-[#5D4AA8]'
                    )}
                  >
                    {option.value === value
                      ? <Check size={13} className="shrink-0 text-[#5D4AA8]" />
                      : <span className="w-[13px] shrink-0" />
                    }
                    {option.label}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };

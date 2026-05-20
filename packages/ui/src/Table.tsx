import * as React from 'react';
import { cn } from './utils';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

export interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  onSort?: (key: string) => void;
  sortKey?: string;
  sortOrder?: 'asc' | 'desc';
  onRowClick?: (item: T) => void;
  className?: string;
  emptyMessage?: string;
}

function Table<T extends Record<string, any>>({
  data,
  columns,
  onSort,
  sortKey,
  sortOrder,
  onRowClick,
  className,
  emptyMessage = 'No data available',
}: TableProps<T>) {
  const handleSort = (key: string, sortable?: boolean) => {
    if (sortable && onSort) {
      onSort(key);
    }
  };

  return (
    <div className={cn('w-full overflow-x-auto rounded-xl border border-gray-200', className)}>
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'px-6 py-4 text-left text-sm font-semibold text-gray-900',
                  column.sortable && 'cursor-pointer select-none hover:bg-gray-100'
                )}
                onClick={() => handleSort(column.key, column.sortable)}
              >
                <div className="flex items-center gap-2">
                  {column.header}
                  {column.sortable && (
                    <div className="flex flex-col">
                      <svg
                        className={cn(
                          'w-3 h-3',
                          sortKey === column.key && sortOrder === 'asc'
                            ? 'text-primary'
                            : 'text-gray-400'
                        )}
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M7 14l5-5 5 5H7z" />
                      </svg>
                      <svg
                        className={cn(
                          'w-3 h-3 -mt-1',
                          sortKey === column.key && sortOrder === 'desc'
                            ? 'text-primary'
                            : 'text-gray-400'
                        )}
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M7 10l5 5 5-5H7z" />
                      </svg>
                    </div>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-12 text-center text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr
                key={index}
                className={cn(
                  'hover:bg-gray-50 transition-colors',
                  onRowClick && 'cursor-pointer'
                )}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 text-sm text-gray-900">
                    {column.render ? column.render(item) : item[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

Table.displayName = 'Table';

export { Table };

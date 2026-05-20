import * as React from 'react';
import { cn } from './utils';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  showFirstLast?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
  showFirstLast = true,
}) => {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav className={cn('flex items-center justify-center gap-1', className)}>
      {/* First page */}
      {showFirstLast && (
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={cn(
            'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            currentPage === 1
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-100'
          )}
          aria-label="First page"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </button>
      )}

      {/* Previous page */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(
          'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          currentPage === 1
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-700 hover:bg-gray-100'
        )}
        aria-label="Previous page"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Page numbers */}
      {pageNumbers.map((page, index) => {
        if (page === '...') {
          return (
            <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-400">
              ...
            </span>
          );
        }

        const pageNum = page as number;
        const isActive = pageNum === currentPage;

        return (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              isActive
                ? 'bg-primary text-white'
                : 'text-gray-700 hover:bg-gray-100'
            )}
            aria-label={`Page ${pageNum}`}
            aria-current={isActive ? 'page' : undefined}
          >
            {pageNum}
          </button>
        );
      })}

      {/* Next page */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn(
          'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          currentPage === totalPages
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-700 hover:bg-gray-100'
        )}
        aria-label="Next page"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Last page */}
      {showFirstLast && (
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={cn(
            'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            currentPage === totalPages
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-100'
          )}
          aria-label="Last page"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 5l7 7-7 7M5 5l7 7-7 7"
            />
          </svg>
        </button>
      )}
    </nav>
  );
};

Pagination.displayName = 'Pagination';

export { Pagination };

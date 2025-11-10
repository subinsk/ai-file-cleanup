'use client';

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { cn } from '../lib/utils';

export interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight?: number;
  height?: number;
  className?: string;
  overscanCount?: number;
}

/**
 * Virtualized list component for rendering large datasets efficiently
 * Uses windowing technique to only render visible items
 */
export function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight = 100,
  height = 600,
  className,
  overscanCount = 5,
}: VirtualizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;

      const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscanCount);
      const visibleCount = Math.ceil(containerHeight / itemHeight);
      const end = Math.min(items.length, start + visibleCount + overscanCount * 2);

      setVisibleRange({ start, end });
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial calculation

    return () => container.removeEventListener('scroll', handleScroll);
  }, [items.length, itemHeight, height, overscanCount]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end);
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  if (items.length === 0) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <p className="text-muted-foreground">No items to display</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto', className)}
      style={{ height, position: 'relative' }}
      role="list"
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => {
            const actualIndex = visibleRange.start + index;
            return (
              <div key={actualIndex} style={{ height: itemHeight }}>
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export interface PaginatedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemsPerPage?: number;
  className?: string;
  showPagination?: boolean;
}

/**
 * Paginated list component for large datasets
 */
export function PaginatedList<T>({
  items,
  renderItem,
  itemsPerPage = 20,
  className,
  showPagination = true,
}: PaginatedListProps<T>) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const totalPages = Math.ceil(items.length / itemsPerPage);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, itemsPerPage]);

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(totalPages, page)));
  };

  if (items.length === 0) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <p className="text-muted-foreground">No items to display</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-2">
        {paginatedItems.map((item, index) => {
          const actualIndex = (currentPage - 1) * itemsPerPage + index;
          return <div key={actualIndex}>{renderItem(item, actualIndex)}</div>;
        })}
      </div>

      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, items.length)} of {items.length} items
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent"
              aria-label="Previous page"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={cn(
                      'px-3 py-1 text-sm border rounded-md',
                      currentPage === pageNum
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent'
                    )}
                    aria-label={`Go to page ${pageNum}`}
                    aria-current={currentPage === pageNum ? 'page' : undefined}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent"
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

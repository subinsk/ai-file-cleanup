/**
 * Virtualized List Component
 * Efficiently renders large lists by only rendering visible items
 * Uses React's windowing technique for optimal performance
 */

import * as React from 'react';
import { cn } from '../lib/utils';

export interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number; // Number of items to render outside visible area
}

/**
 * VirtualizedList component
 * Renders large lists efficiently with virtual scrolling
 * 
 * @example
 * ```tsx
 * <VirtualizedList
 *   items={files}
 *   itemHeight={80}
 *   containerHeight={600}
 *   renderItem={(file) => <FileCard file={file} />}
 * />
 * ```
 */
export function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className,
  overscan = 5,
}: VirtualizedListProps<T>) {
  const [scrollOffset, setScrollOffset] = React.useState(0);
  const scrollElementRef = React.useRef<HTMLDivElement>(null);

  // Calculate visible range
  const visibleStartIndex = Math.max(0, Math.floor(scrollOffset / itemHeight) - overscan);
  const visibleEndIndex = Math.min(
    items.length,
    Math.ceil((scrollOffset + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(visibleStartIndex, visibleEndIndex);
  const offsetY = visibleStartIndex * itemHeight;
  const totalHeight = items.length * itemHeight;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollOffset(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={scrollElementRef}
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      {/* Virtual spacer - takes up space for items outside visible range */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Container for visible items */}
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div
              key={visibleStartIndex + index}
              style={{ height: itemHeight }}
              className="flex-shrink-0"
            >
              {renderItem(item, visibleStartIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Pagination component for non-virtualized lists
 * Use when you need traditional pagination (e.g., API responses)
 */
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
  className,
}: PaginationProps) {
  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1;
    if (i < 3) return i + 1;
    if (i >= 4) return totalPages - (6 - i);
    return '...';
  }).filter((v, i, arr) => i === 0 || i === arr.length - 1 || v !== arr[i - 1]);

  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1 || isLoading}
        className="px-3 py-1 rounded border disabled:opacity-50"
      >
        Previous
      </button>

      {pages.map((page, i) =>
        page === '...' ? (
          <span key={i} className="px-2">
            …
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            disabled={isLoading}
            className={cn(
              'px-3 py-1 rounded border',
              currentPage === page && 'bg-primary text-primary-foreground'
            )}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages || isLoading}
        className="px-3 py-1 rounded border disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}

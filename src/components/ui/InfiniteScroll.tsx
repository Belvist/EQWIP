'use client'

import React, { useEffect, useRef, useCallback } from 'react'

interface InfiniteScrollProps {
  children: React.ReactNode
  hasMore: boolean
  loadMore: () => void
  threshold?: number
  loader?: React.ReactNode
  endMessage?: React.ReactNode
  className?: string
}

// Оптимизированный компонент бесконечной прокрутки
export const InfiniteScroll = ({
  children,
  hasMore,
  loadMore,
  threshold = 100,
  loader = <div className="flex justify-center p-4">Загрузка...</div>,
  endMessage = <div className="flex justify-center p-4 text-gray-500">Больше нет данных</div>,
  className = ""
}: InfiniteScrollProps) => {
  const observer = useRef<IntersectionObserver | null>(null)
  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (observer.current) observer.current.disconnect()
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore()
      }
    }, {
      rootMargin: `${threshold}px`
    })
    
    if (node) observer.current.observe(node)
  }, [hasMore, loadMore, threshold])

  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect()
      }
    }
  }, [])

  return (
    <div className={className}>
      {children}
      {hasMore && <div ref={lastElementRef}>{loader}</div>}
      {!hasMore && endMessage}
    </div>
  )
}

// Хук для бесконечной прокрутки
export const useInfiniteScroll = (
  callback: () => void,
  options: {
    threshold?: number
    hasMore?: boolean
  } = {}
) => {
  const { threshold = 100, hasMore = true } = options
  const observer = useRef<IntersectionObserver | null>(null)

  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (observer.current) observer.current.disconnect()
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        callback()
      }
    }, {
      rootMargin: `${threshold}px`
    })
    
    if (node) observer.current.observe(node)
  }, [callback, hasMore, threshold])

  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect()
      }
    }
  }, [])

  return lastElementRef
}

// Хук для виртуализации списка
export const useVirtualList = <T,>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) => {
  const [scrollTop, setScrollTop] = React.useState(0)

  const visibleRange = React.useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    )
    return { startIndex, endIndex }
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length])

  const totalHeight = items.length * itemHeight
  const offsetY = visibleRange.startIndex * itemHeight
  const visibleItems = items.slice(visibleRange.startIndex, visibleRange.endIndex + 1)

  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    itemHeight
  }
}

// Компонент виртуализированного списка
interface VirtualListProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  overscan?: number
  className?: string
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = ""
}: VirtualListProps<T>) {
  const {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll
  } = useVirtualList(items, itemHeight, containerHeight, overscan)

  return (
    <div
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: offsetY,
            width: '100%'
          }}
        >
          {visibleItems.map((item, index) => (
            <div key={index} style={{ height: itemHeight }}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
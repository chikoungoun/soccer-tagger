import React from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface PullToRefreshIndicatorProps {
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
  threshold: number;
}

const PullToRefreshIndicator: React.FC<PullToRefreshIndicatorProps> = ({
  isPulling,
  isRefreshing,
  pullDistance,
  threshold,
}) => {
  const progress = Math.min(pullDistance / threshold, 1);
  const shouldShow = pullDistance > 10;

  if (!shouldShow && !isRefreshing) return null;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50 flex items-center justify-center transition-all duration-300 md:hidden",
        "bg-gradient-to-b from-soccer-green/90 to-soccer-green/70 backdrop-blur-sm",
        shouldShow || isRefreshing ? "opacity-100" : "opacity-0"
      )}
      style={{
        height: Math.max(pullDistance * 0.8, isRefreshing ? 60 : 0),
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      <div className="flex flex-col items-center space-y-2 text-white">
        <div className="relative">
          <ArrowPathIcon
            className={cn(
              "h-6 w-6 transition-transform duration-300",
              isRefreshing ? "animate-spin" : "",
              isPulling ? "scale-110" : "scale-100"
            )}
          />
          {!isRefreshing && (
            <div
              className="absolute inset-0 border-2 border-white/30 rounded-full"
              style={{
                clipPath: `inset(${100 - (progress * 100)}% 0 0 0)`,
                borderColor: progress >= 1 ? '#fff' : 'rgba(255,255,255,0.3)',
              }}
            />
          )}
        </div>
        <span className="text-sm font-medium">
          {isRefreshing
            ? 'Refreshing...'
            : isPulling
            ? 'Release to refresh'
            : 'Pull to refresh'
          }
        </span>
      </div>
    </div>
  );
};

export default PullToRefreshIndicator;
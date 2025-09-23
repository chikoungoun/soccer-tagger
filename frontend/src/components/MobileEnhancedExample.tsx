import React, { useRef } from 'react';
import { PlusIcon, UserIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FloatingActionButton from './FloatingActionButton';
import { DashboardSkeleton, MobileLoadingSkeleton } from './SkeletonLoaders';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { useSwipeGestures } from '../hooks/useSwipeGestures';
import PullToRefreshIndicator from './PullToRefresh';

const MobileEnhancedExample: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // Pull to refresh functionality
  const { isPulling, pullDistance, isRefreshing, pullToRefreshProps } = usePullToRefresh({
    onRefresh: async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      setIsLoading(false);
    },
    threshold: 80,
  });

  // Swipe gestures
  useSwipeGestures(containerRef, {
    onSwipeLeft: () => console.log('Swiped left - could navigate to next page'),
    onSwipeRight: () => console.log('Swiped right - could go back'),
    onSwipeUp: () => console.log('Swiped up - could scroll to top'),
    onSwipeDown: () => console.log('Swiped down - could show more options'),
  });

  // Floating action button actions
  const fabActions = [
    {
      icon: PlusIcon,
      label: 'Add New',
      onClick: () => console.log('Add new item'),
    },
    {
      icon: UserIcon,
      label: 'Quick Profile',
      onClick: () => console.log('Open profile'),
    },
    {
      icon: CalendarDaysIcon,
      label: 'Schedule',
      onClick: () => console.log('Open schedule'),
    },
  ];

  if (isLoading) {
    return (
      <div className="md:hidden">
        <MobileLoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Pull to refresh indicator */}
      <PullToRefreshIndicator
        isPulling={isPulling}
        isRefreshing={isRefreshing}
        pullDistance={pullDistance}
        threshold={80}
      />

      {/* Main content with pull-to-refresh */}
      <div
        ref={containerRef}
        className="space-y-6 p-4"
        {...pullToRefreshProps}
      >
        <Card>
          <CardHeader>
            <CardTitle>Mobile-Enhanced Features Demo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Mobile-Optimized Email Input</label>
              <Input
                type="email"
                placeholder="Enter your email"
                mobileOptimized
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number</label>
              <Input
                type="tel"
                placeholder="Phone number"
                mobileOptimized
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <Input
                type="search"
                placeholder="Search..."
                mobileOptimized
              />
            </div>

            <div className="flex space-x-3">
              <Button size="mobile" className="flex-1">
                Mobile-Optimized Button
              </Button>
              <Button size="mobile" variant="outline" className="flex-1">
                Secondary Action
              </Button>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <p><strong>Try these mobile features:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Pull down to refresh</li>
                <li>Swipe left/right for navigation</li>
                <li>Tap the floating action button</li>
                <li>Notice the enhanced touch targets</li>
                <li>Test the mobile-optimized keyboards</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Additional cards to demonstrate scrolling */}
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-soccer-green rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">{i + 1}</span>
                </div>
                <div>
                  <h3 className="font-medium">Sample Card {i + 1}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    This demonstrates mobile-friendly card layouts
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton actions={fabActions} />
    </div>
  );
};

export default MobileEnhancedExample;
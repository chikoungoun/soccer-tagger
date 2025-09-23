import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FloatingAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  show?: boolean;
}

interface FloatingActionButtonProps {
  actions: FloatingAction[];
  className?: string;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ actions, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Filter actions based on show condition
  const visibleActions = actions.filter(action => action.show !== false);

  if (visibleActions.length === 0) {
    return null;
  }

  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <div className={cn("fixed bottom-20 right-4 z-40 md:hidden", className)}>
      {/* Action buttons */}
      {isOpen && (
        <div className="mb-4 space-y-3">
          {visibleActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <div
                key={index}
                className="flex items-center justify-end space-x-3 animate-in slide-in-from-bottom-2 duration-200"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="bg-black/80 text-white px-3 py-1 rounded-lg text-sm font-medium shadow-lg backdrop-blur-sm">
                  {action.label}
                </div>
                <Button
                  size="icon"
                  onClick={() => {
                    action.onClick();
                    setIsOpen(false);
                  }}
                  className="h-12 w-12 rounded-full shadow-lg bg-white text-soccer-green hover:bg-gray-50 border-2 border-soccer-green"
                >
                  <Icon className="h-5 w-5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Main FAB */}
      <Button
        size="icon"
        onClick={toggleOpen}
        className={cn(
          "h-14 w-14 rounded-full shadow-2xl transition-all duration-300 border-0",
          isOpen
            ? "bg-red-500 hover:bg-red-600 rotate-45"
            : "bg-soccer-green hover:bg-soccer-dark"
        )}
      >
        {isOpen ? (
          <XMarkIcon className="h-6 w-6 text-white" />
        ) : (
          <PlusIcon className="h-6 w-6 text-white" />
        )}
      </Button>
    </div>
  );
};

export default FloatingActionButton;
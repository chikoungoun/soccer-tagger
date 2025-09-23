import React from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '@/components/ui/button';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="w-9 h-9 p-0 bg-white hover:bg-gray-100 dark:bg-white dark:hover:bg-gray-100 transition-colors rounded-md shadow-sm"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <MoonIcon className="h-4 w-4 text-gray-600" />
      ) : (
        <SunIcon className="h-4 w-4 text-yellow-500" />
      )}
    </Button>
  );
};

export default ThemeToggle;
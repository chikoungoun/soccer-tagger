import React from 'react';
import { Button } from '@/components/ui/button';

// Simple test component to verify Shadcn/ui Button works
const ShadcnTest: React.FC = () => {
  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Shadcn/ui Button Test</h3>
      <div className="flex space-x-4">
        <Button variant="default">Default Button</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Delete</Button>
      </div>
      <div className="flex space-x-4">
        <Button size="sm">Small</Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
      </div>
    </div>
  );
};

export default ShadcnTest;
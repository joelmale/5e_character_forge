import React from 'react';
import { Layout, Layers, Smartphone } from 'lucide-react';
import { useLayout } from '../../context';
import type { LayoutMode } from './AbilityScores';

export const LayoutSelector: React.FC = () => {
  const { layoutMode, setLayoutMode } = useLayout();

  const layouts: { value: LayoutMode; label: string; icon: React.ReactNode }[] = [
    { value: 'modern-stacked', label: 'Modern', icon: <Layers className="w-4 h-4" /> },
    { value: 'classic-dnd', label: 'Classic D&D', icon: <Layout className="w-4 h-4" /> },
    { value: 'mobile', label: 'Mobile', icon: <Smartphone className="w-4 h-4" /> },
  ];

  return (
    <div className="hidden lg:flex items-center gap-2">
      <span className="text-xs text-gray-400">Layout:</span>
      <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
        {layouts.map((l) => (
          <button
            key={l.value}
            onClick={() => setLayoutMode(l.value)}
            className={`
              flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-all
              ${
                layoutMode === l.value
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }
            `}
            title={`Switch to ${l.label} layout`}
          >
            {l.icon}
            <span>{l.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

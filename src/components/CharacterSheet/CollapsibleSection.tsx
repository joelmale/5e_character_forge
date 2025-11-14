import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  isCollapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
  badge?: string | number;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon: Icon,
  isCollapsed,
  onToggle,
  children,
  className = '',
  badge
}) => {
  return (
    <div className={`rounded-xl shadow-lg border-l-4 ${className}`}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-800/50 transition-colors group"
        aria-expanded={!isCollapsed}
        aria-controls={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-5 h-5 text-current" />}
          <h3 className="text-lg font-bold">{title}</h3>
          {badge && (
            <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-xs font-medium">
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-300 transition-colors" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-gray-300 transition-colors" />
          )}
        </div>
      </button>

      {/* Content */}
      <div
        id={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isCollapsed ? 'max-h-0 opacity-0' : 'max-h-screen opacity-100'
        }`}
      >
        <div className="px-6 pb-4">
          {children}
        </div>
      </div>
    </div>
  );
};
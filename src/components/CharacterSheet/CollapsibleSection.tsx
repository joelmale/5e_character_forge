import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

// Add wiggle animation CSS
const wiggleKeyframes = `
  @keyframes wiggle {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-0.5deg); }
    75% { transform: rotate(0.5deg); }
  }
`;

// Inject keyframes into document head if not already present
if (typeof document !== 'undefined' && !document.getElementById('wiggle-keyframes')) {
  const style = document.createElement('style');
  style.id = 'wiggle-keyframes';
  style.textContent = wiggleKeyframes;
  document.head.appendChild(style);
}

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  isCollapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
  badge?: string | number;
  isAdjustMode?: boolean;
  panelId?: string;
  onDragStart?: (panelId: string) => void;
  onDragEnd?: () => void;
  onDrop?: (targetPanelId: string) => void;
  isDragged?: boolean;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon: Icon,
  isCollapsed,
  onToggle,
  children,
  className = '',
  badge,
  isAdjustMode = false,
  panelId,
  onDragStart,
  onDragEnd,
  onDrop,
  isDragged = false
}) => {
  const [showInitialWiggle, setShowInitialWiggle] = useState(false);

  // Handle initial wiggle for 0.5 seconds after entering adjust mode
  useEffect(() => {
    if (isAdjustMode && isCollapsed) {
      setShowInitialWiggle(true);
      const timer = setTimeout(() => {
        setShowInitialWiggle(false);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setShowInitialWiggle(false);
    }
  }, [isAdjustMode, isCollapsed]);

  const shouldWiggle = isAdjustMode && isCollapsed && showInitialWiggle;
  const handleDragStart = (e: React.DragEvent) => {
    if (panelId && onDragStart) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', panelId);
      onDragStart(panelId);
    }
  };

  const handleDragEnd = () => {
    if (onDragEnd) {
      onDragEnd();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    console.log('handleDrop fired on panel:', panelId);
    if (panelId && onDrop) {
      const draggedPanelId = e.dataTransfer.getData('text/plain');
      console.log('Dragged panel:', draggedPanelId, 'Target panel:', panelId);
      if (draggedPanelId !== panelId) {
        console.log('Calling onDrop with target:', panelId);
        onDrop(panelId);
      } else {
        console.log('Same panel, not dropping');
      }
    } else {
      console.log('Missing panelId or onDrop handler');
    }
  };

  return (
    <div
      className={`rounded-xl shadow-lg border-l-4 ${className} ${
        isAdjustMode && isCollapsed ? 'cursor-grab active:cursor-grabbing' : ''
      } ${isDragged ? 'opacity-50' : ''}`}
      style={shouldWiggle ? {
        animation: 'wiggle 0.33s ease-in-out infinite'
      } : undefined}
      onDragOver={isAdjustMode ? handleDragOver : undefined}
      onDrop={isAdjustMode ? handleDrop : undefined}
    >
      {/* Header */}
      <button
        onClick={isAdjustMode && isCollapsed ? undefined : onToggle}
        draggable={isAdjustMode && isCollapsed}
        onDragStart={isAdjustMode && isCollapsed ? handleDragStart : undefined}
        onDragEnd={isAdjustMode && isCollapsed ? handleDragEnd : undefined}
        className={`w-full px-6 py-4 text-left flex items-center justify-between transition-colors group ${
          isAdjustMode && isCollapsed
            ? 'hover:bg-gray-700/70 cursor-grab active:cursor-grabbing'
            : 'hover:bg-gray-800/50'
        }`}
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
            <ChevronRight className="w-6 h-6 text-white group-hover:text-yellow-300 transition-colors" />
          ) : (
            <ChevronDown className="w-6 h-6 text-white group-hover:text-yellow-300 transition-colors" />
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
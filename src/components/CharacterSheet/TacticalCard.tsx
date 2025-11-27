import React from 'react';

interface TacticalAction {
  id: string;
  name: string;
  type: 'weapon-attack' | 'spell-attack' | 'unarmed-attack' | 'special-attack' | 'defensive' | 'movement' | 'support' | 'stealth' | 'healing' | 'action-surge' | 'reaction-setup';
  description: string;
  actionCost: 'Action' | 'Bonus Action' | 'Free' | 'Reaction';
  hasButton: boolean;
  buttonText?: string;
  category: 'offense' | 'defense' | 'mobility' | 'burst';
  isLimited?: boolean;
  usesRemaining?: number;
  maxUses?: number;
  specialUI?: 'bubble-display';
}

interface TacticalCardProps {
  action: TacticalAction;
  onAction?: (actionId: string) => void;
  theme?: 'standard' | 'accent';
  layoutMode?: 'paper-sheet' | 'classic-dnd' | 'modern';
}

export const TacticalCard: React.FC<TacticalCardProps> = ({ action, onAction, theme = 'standard', layoutMode }) => {
  const isAccent = theme === 'accent' || action.isLimited;
  const isPaperSheet = layoutMode === 'paper-sheet';

  // Card background colors
  const standardBgClass = isPaperSheet
    ? 'bg-[#fcf6e3] hover:bg-[#ebe1c8] border-[#1e140a]/20'
    : 'bg-theme-tertiary hover:bg-theme-quaternary border-theme-primary/20';

  const accentBgClass = isPaperSheet
    ? 'bg-[#8b4513] hover:bg-[#a0522d] border-[#1e140a] text-[#fcf6e3]'
    : 'bg-orange-700 hover:bg-orange-600 border-orange-500 text-white';

  // Text colors
  const textPrimaryClass = isPaperSheet ? 'text-[#1e140a]' : 'text-theme-primary';
  const textMutedClass = isPaperSheet ? 'text-[#3d2817]' : 'text-theme-muted';

  // Button colors
  const buttonClass = isPaperSheet
    ? 'bg-[#8b4513] hover:bg-[#a0522d] text-[#fcf6e3]'
    : 'bg-theme-primary hover:bg-theme-primary/80 text-theme-secondary';

  // Action badge colors
  const getActionBadgeClass = (cost: string) => {
    if (isPaperSheet) {
      const paperBadges: Record<string, string> = {
        'Action': 'bg-red-900/80 text-[#fcf6e3] border border-red-800',
        'Bonus Action': 'bg-blue-900/80 text-[#fcf6e3] border border-blue-800',
        'Free': 'bg-green-900/80 text-[#fcf6e3] border border-green-800',
        'Reaction': 'bg-gray-700/80 text-[#fcf6e3] border border-gray-600',
      };
      return paperBadges[cost] || paperBadges['Action'];
    }

    const darkBadges: Record<string, string> = {
      'Action': 'bg-red-500 text-white',
      'Bonus Action': 'bg-blue-500 text-white',
      'Free': 'bg-green-500 text-white',
      'Reaction': 'bg-gray-500 text-white',
    };
    return darkBadges[cost] || darkBadges['Action'];
  };

  // Bubble colors
  const activeBubbleClass = isPaperSheet
    ? 'bg-[#8b4513] border-[#1e140a]'
    : 'bg-accent-red-light border-red-400';

  const inactiveBubbleClass = isPaperSheet
    ? 'bg-[#d4c4a8] border-[#8b7355]'
    : 'bg-gray-600 border-gray-500';

  const cardClasses = isAccent ? accentBgClass : standardBgClass;
  const cardTextClass = isAccent && !isPaperSheet ? 'text-white' : textPrimaryClass;

  return (
    <div className={`rounded-lg border-2 p-3 transition-all duration-200 ${cardClasses}`}>
      {/* Header Row */}
      <div className="flex items-center justify-between mb-2">
        <h4 className={`font-semibold text-sm ${cardTextClass}`}>{action.name}</h4>
        <span className={`text-xs px-2 py-0.5 rounded-full ${getActionBadgeClass(action.actionCost)}`}>
          {action.actionCost}
        </span>
      </div>

      {/* Body Row */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`text-xs opacity-80 leading-tight ${cardTextClass}`}>{action.description}</p>
          {action.isLimited && (
            <p className={`text-xs opacity-60 mt-1 ${cardTextClass}`}>
              {action.usesRemaining}/{action.maxUses} uses
            </p>
          )}
        </div>

        {action.hasButton && (
          <button
            onClick={() => onAction?.(action.id)}
            className={`ml-3 px-3 py-1 rounded text-xs font-medium transition-colors ${buttonClass}`}
          >
            {action.buttonText}
          </button>
        )}
      </div>

      {/* Special UI for Action Surge */}
      {action.specialUI === 'bubble-display' && action.isLimited && action.maxUses && (
        <div className="mt-2 flex gap-1 justify-center">
          {Array.from({ length: action.maxUses }, (_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full border ${
                i < (action.usesRemaining || 0)
                  ? activeBubbleClass
                  : inactiveBubbleClass
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
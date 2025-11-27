import React from 'react';
import { TacticalCard } from './TacticalCard';

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

interface TacticalSectionProps {
  icon: string;
  title: string;
  theme: 'red' | 'blue' | 'green' | 'orange' | 'purple';
  actions: TacticalAction[];
  onAction?: (actionId: string) => void;
  layoutMode?: 'paper-sheet' | 'classic-dnd' | 'modern';
}

export const TacticalSection: React.FC<TacticalSectionProps> = ({
  icon, title, theme, actions, onAction, layoutMode
}) => {
  if (actions.length === 0) return null;

  const isPaperSheet = layoutMode === 'paper-sheet';

  // Get theme classes based on layout mode
  const getThemeClasses = (themeColor: 'red' | 'blue' | 'green' | 'orange' | 'purple') => {
    if (isPaperSheet) {
      const paperThemes = {
        red: 'border-l-4 border-red-900/60 bg-[#f5ebd2]',
        blue: 'border-l-4 border-blue-900/60 bg-[#f5ebd2]',
        green: 'border-l-4 border-green-900/60 bg-[#f5ebd2]',
        orange: 'border-l-4 border-orange-900/60 bg-[#f5ebd2]',
        purple: 'border-l-4 border-purple-900/60 bg-[#f5ebd2]',
      };
      return paperThemes[themeColor];
    }

    const darkThemes = {
      red: 'border-l-4 border-red-500 bg-theme-tertiary/30',
      blue: 'border-l-4 border-blue-500 bg-theme-tertiary/30',
      green: 'border-l-4 border-green-500 bg-theme-tertiary/30',
      orange: 'border-l-4 border-orange-500 bg-theme-tertiary/30',
      purple: 'border-l-4 border-purple-500 bg-theme-tertiary/30',
    };
    return darkThemes[themeColor];
  };

  const headerTextClass = isPaperSheet ? 'text-[#1e140a]' : 'text-theme-primary';

  return (
    <section className={`pl-4 ${getThemeClasses(theme)}`}>
      <h3 className={`text-lg font-bold mb-3 flex items-center gap-2 ${headerTextClass}`}>
        <span className="text-xl">{icon}</span>
        {title}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {actions.map(action => (
          <TacticalCard
            key={action.id}
            action={action}
            onAction={onAction}
            theme={action.isLimited ? 'accent' : 'standard'}
            layoutMode={layoutMode}
          />
        ))}
      </div>
    </section>
  );
};
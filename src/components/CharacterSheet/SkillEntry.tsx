import React, { useState } from 'react';
import { Dice6 } from 'lucide-react';
import { SkillName } from '../../types/dnd';
import { createSkillRoll, createAdvantageRoll, createDisadvantageRoll } from '../../services/diceService';
import { formatModifier } from '../../utils/formatters';
import type { LayoutMode } from './AbilityScores';

interface SkillEntryProps {
  name: SkillName;
  skill: { value: number; proficient: boolean };
  setRollResult: (result: {
    text: string;
    value: number | null;
    details?: Array<{ value: number; kept: boolean; critical?: 'success' | 'failure' }>
  }) => void;
  onDiceRoll: (roll: any) => void;
  layoutMode?: LayoutMode;
}

type RollType = 'normal' | 'advantage' | 'disadvantage';

export const SkillEntry: React.FC<SkillEntryProps> = ({
  name,
  skill,
  setRollResult,
  onDiceRoll,
  layoutMode = 'modern',
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [rollType, setRollType] = useState<RollType>('normal');
  const skillLabel = name.replace(/([A-Z])/g, ' $1').trim();

  const handleRoll = (type: RollType = rollType) => {
    let roll;
    switch (type) {
      case 'advantage':
        roll = createAdvantageRoll(skillLabel, skill.value);
        break;
      case 'disadvantage':
        roll = createDisadvantageRoll(skillLabel, skill.value);
        break;
      default:
        roll = createSkillRoll(skillLabel, skill.value);
    }

    // Create detailed results for display
    const details = roll.pools && roll.pools.length > 0
      ? roll.pools[0].results.map((value, _idx) => ({
          value,
          kept: roll.diceResults.includes(value),
          critical: roll.diceResults.length === 1 && roll.diceResults[0] === value ? roll.critical : undefined
        }))
      : roll.diceResults.map((value, _idx) => ({
          value,
          kept: true,
          critical: roll.diceResults.length === 1 ? roll.critical : undefined
        }));

    setRollResult({
      text: `${roll.label}: ${roll.notation}`,
      value: roll.total,
      details
    });
    onDiceRoll(roll);
    setShowMenu(false);
  };

  const getRollIcon = () => {
    switch (rollType) {
      case 'advantage': return 'A';
      case 'disadvantage': return 'D';
      default: return null;
    }
  };

  // Classic layout: Compact, traditional D&D skill checklist
  if (layoutMode === 'classic') {
    return (
      <div className="relative">
        <button
          onClick={() => handleRoll()}
          onContextMenu={(e) => {
            e.preventDefault();
            setShowMenu(!showMenu);
          }}
          className="flex items-center justify-between px-2 py-1 hover:bg-gray-700 rounded transition-colors cursor-pointer w-full group"
          title={`Roll ${skillLabel} check (${rollType}) - Right-click for options`}
        >
          <div className="flex items-center gap-1.5">
            {/* Proficiency bubble */}
            <div className={`w-3 h-3 rounded-full border ${skill.proficient ? 'bg-yellow-500 border-yellow-500' : 'border-gray-500'}`} />
            {/* Roll indicator */}
            {getRollIcon() && (
              <span className="text-xs font-bold text-green-400">{getRollIcon()}</span>
            )}
            <span className="text-xs font-medium text-gray-300 group-hover:text-white">{skillLabel}</span>
          </div>
          <span className="font-mono text-sm font-bold text-yellow-300">{formatModifier(skill.value)}</span>
        </button>

        {showMenu && (
          <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 min-w-32">
            <button
              onClick={() => {
                setRollType('normal');
                handleRoll('normal');
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-700 first:rounded-t-lg"
            >
              Normal
            </button>
            <button
              onClick={() => {
                setRollType('advantage');
                handleRoll('advantage');
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-700 text-green-400"
            >
              Advantage
            </button>
            <button
              onClick={() => {
                setRollType('disadvantage');
                handleRoll('disadvantage');
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-700 text-red-400 last:rounded-b-lg"
            >
              Disadvantage
            </button>
          </div>
        )}

        {/* Click outside to close menu */}
        {showMenu && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
        )}
      </div>
    );
  }

  // Modern layout: Original design
  return (
    <div className="relative">
      <button
        onClick={() => handleRoll()}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowMenu(!showMenu);
        }}
        className="flex items-center justify-between p-2 bg-gray-700/50 hover:bg-red-700/70 rounded transition-colors cursor-pointer w-full"
        title={`Roll ${skillLabel} check (${rollType}) - Right-click for options`}
      >
        <div className="flex items-center gap-2">
          <Dice6 className="w-4 h-4 text-red-500" />
          {getRollIcon() && (
            <span className="text-xs font-bold text-green-400">{getRollIcon()}</span>
          )}
          <span className="font-mono text-lg w-8 text-yellow-400">{formatModifier(skill.value)}</span>
          <span className="text-sm font-semibold text-white truncate">{skillLabel}</span>
        </div>
        {skill.proficient && (
          <span className="text-xs bg-yellow-600 text-white px-1.5 py-0.5 rounded">Prof</span>
        )}
      </button>

      {showMenu && (
        <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 min-w-32">
          <button
            onClick={() => {
              setRollType('normal');
              handleRoll('normal');
            }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-700 first:rounded-t-lg"
          >
            Normal
          </button>
          <button
            onClick={() => {
              setRollType('advantage');
              handleRoll('advantage');
            }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-700 text-green-400"
          >
            Advantage
          </button>
          <button
            onClick={() => {
              setRollType('disadvantage');
              handleRoll('disadvantage');
            }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-700 text-red-400 last:rounded-b-lg"
          >
            Disadvantage
          </button>
        </div>
      )}

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};
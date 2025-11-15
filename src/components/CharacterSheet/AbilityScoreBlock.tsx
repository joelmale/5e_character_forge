import React, { useState } from 'react';
import { Dice6 } from 'lucide-react';
import { AbilityName } from '../../types/dnd';
import { createAbilityRoll, createAdvantageRoll, createDisadvantageRoll } from '../../services/diceService';
import { formatModifier } from '../../utils/formatters';
import type { LayoutMode } from './AbilityScores';

interface AbilityScoreBlockProps {
  name: AbilityName;
  ability: { score: number; modifier: number };
  setRollResult: (result: {
    text: string;
    value: number | null;
    details?: Array<{ value: number; kept: boolean; critical?: 'success' | 'failure' }>
  }) => void;
  onDiceRoll: (roll: any) => void;
  layoutMode?: LayoutMode;
}

type RollType = 'normal' | 'advantage' | 'disadvantage';

export const AbilityScoreBlock: React.FC<AbilityScoreBlockProps> = ({
  name,
  ability,
  setRollResult,
  onDiceRoll,
  layoutMode = 'modern',
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [rollType, setRollType] = useState<RollType>('normal');

  const handleRoll = (type: RollType = rollType) => {
    let roll;
    switch (type) {
      case 'advantage':
        roll = createAdvantageRoll(`${name} Check`, ability.modifier);
        break;
      case 'disadvantage':
        roll = createDisadvantageRoll(`${name} Check`, ability.modifier);
        break;
      default:
        roll = createAbilityRoll(name, ability.score);
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

  // Classic layout: Large circular design
  if (layoutMode === 'classic') {
    return (
      <div className="relative">
          <button
            onClick={() => handleRoll()}
            onContextMenu={(e) => {
              e.preventDefault();
              setShowMenu(!showMenu);
            }}
            className="flex flex-col items-center w-full group"
            title={`Roll ${name} check (${rollType}) - Right-click for options`}
          >
            <span className="text-xs font-bold text-gray-400 uppercase mb-1 font-eb-garamond">{name}</span>
          <div className="relative w-16 h-16">
            {/* Outer circle */}
            <div className="absolute inset-0 rounded-full border-4 border-gray-600 bg-gray-800 group-hover:border-red-500 group-hover:bg-red-900/30 transition-all" />
            {/* Score */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{ability.score}</span>
            </div>
            {/* Roll indicator */}
            {getRollIcon() && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-gray-900">{getRollIcon()}</span>
              </div>
            )}
          </div>
          {/* Modifier below */}
          <div className="mt-1 px-3 py-1 bg-gray-700 rounded text-sm font-bold text-yellow-300">
            {formatModifier(ability.modifier)}
          </div>
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

  // Modern layout: Compact rectangular design
  return (
    <div className="relative">
      <button
        onClick={() => handleRoll()}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowMenu(!showMenu);
        }}
        className="flex flex-col items-center p-2 bg-gray-700 hover:bg-red-700/70 rounded-lg transition-colors cursor-pointer relative"
        title={`Roll ${name} check (${rollType}) - Right-click for options`}
      >
        <div className="flex items-center gap-1 mb-1">
          <Dice6 className="w-4 h-4 text-red-500" />
          {getRollIcon() && (
            <span className="text-xs font-bold text-green-400">{getRollIcon()}</span>
          )}
        </div>
        <span className="text-xs font-semibold text-gray-400">{name}</span>
        <div className="text-xl font-extrabold text-yellow-300">{ability.score}</div>
        <div className="text-xl font-extrabold text-yellow-300">{formatModifier(ability.modifier)}</div>
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
import React, { useState } from 'react';
import { Shield, Zap, Dice6, BookOpen, UserIcon, Footprints } from 'lucide-react';
import { Character } from '../../types/dnd';
import { createInitiativeRoll, createAdvantageRoll, createDisadvantageRoll } from '../../services/diceService';
import { formatModifier } from '../../utils/formatters';

interface CharacterStatsProps {
  character: Character;
  setRollResult: (result: {
    text: string;
    value: number | null;
    details?: Array<{ value: number; kept: boolean; critical?: 'success' | 'failure' }>
  }) => void;
  onDiceRoll: (roll: any) => void;
}

type RollType = 'normal' | 'advantage' | 'disadvantage';

export const CharacterStats: React.FC<CharacterStatsProps> = ({
  character,
  setRollResult,
  onDiceRoll,
}) => {
  const [initiativeRollType, setInitiativeRollType] = useState<RollType>('normal');
  const passivePerception = (character.skills.Perception.value + 10);

  const handleInitiativeRoll = (type: RollType = initiativeRollType) => {
    let roll;
    switch (type) {
      case 'advantage':
        roll = createAdvantageRoll('Initiative', character.initiative);
        break;
      case 'disadvantage':
        roll = createDisadvantageRoll('Initiative', character.initiative);
        break;
      default:
        roll = createInitiativeRoll(character.initiative);
    }

    // Create detailed results for display
    const details = roll.pools && roll.pools.length > 0
      ? roll.pools[0].results.map((value, idx) => ({
          value,
          kept: roll.diceResults.includes(value),
          critical: roll.diceResults.length === 1 && roll.diceResults[0] === value ? roll.critical : undefined
        }))
      : roll.diceResults.map((value, idx) => ({
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
  };

  // Calculate speed (most characters have 30 ft unless modified)
  const getSpeed = () => {
    // TODO: This should be calculated based on race/class features
    // For now, return default speed
    return 30;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 bg-gray-800/70 p-4 rounded-xl shadow-lg border border-red-900">
      <div className="col-span-1 flex flex-col items-center"><Shield className="w-6 h-6 text-red-500 mb-1" /><span className="text-sm font-semibold text-gray-400">AC</span><div className="text-4xl font-extrabold text-white">{character.armorClass}</div></div>
      <div className="col-span-1 flex flex-col items-center"><Zap className="w-6 h-6 text-red-500 mb-1" /><span className="text-sm font-semibold text-gray-400">HP</span><div className="text-2xl font-extrabold text-green-400">{character.hitPoints}<span className="text-gray-400 text-lg">/{character.maxHitPoints}</span></div></div>
      <div className="col-span-1 relative">
        <button
          onClick={() => handleInitiativeRoll()}
          onContextMenu={(e) => {
            e.preventDefault();
            // Cycle through roll types
            setInitiativeRollType(prev => prev === 'normal' ? 'advantage' : prev === 'advantage' ? 'disadvantage' : 'normal');
          }}
          className="flex flex-col items-center bg-gray-700/50 p-2 rounded-lg hover:bg-red-700/70 transition-colors cursor-pointer w-full"
          title={`Roll Initiative (${initiativeRollType}) - Right-click to cycle`}
        >
          <div className="flex items-center gap-1 mb-1">
            <Dice6 className="w-5 h-5 text-red-500" />
            {initiativeRollType !== 'normal' && (
              <span className="text-xs font-bold text-green-400">
                {initiativeRollType === 'advantage' ? 'A' : 'D'}
              </span>
            )}
          </div>
          <span className="text-sm font-semibold text-gray-400">Init</span>
          <div className="text-2xl font-extrabold text-yellow-300">{formatModifier(character.initiative)}</div>
        </button>
      </div>
      <div className="col-span-1 flex flex-col items-center"><Footprints className="w-6 h-6 text-red-500 mb-1" /><span className="text-sm font-semibold text-gray-400">Speed</span><div className="text-2xl font-extrabold text-blue-400">{getSpeed()} ft</div></div>
      <div className="col-span-1 flex flex-col items-center"><BookOpen className="w-6 h-6 text-red-500 mb-1" /><span className="text-sm font-semibold text-gray-400">Prof</span><div className="text-2xl font-extrabold text-yellow-300">+{character.proficiencyBonus}</div></div>
      <div className="col-span-1 flex flex-col items-center"><UserIcon className="w-6 h-6 text-red-500 mb-1" /><span className="text-sm font-semibold text-gray-400">Pass Perc</span><div className="text-2xl font-extrabold text-white">{passivePerception}</div></div>
    </div>
  );
};
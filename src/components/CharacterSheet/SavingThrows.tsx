import React, { useState } from 'react';
import { Dice6, ChevronDown } from 'lucide-react';
import { Character } from '../../types/dnd';
import { createComplexRoll, createAdvantageRoll, createDisadvantageRoll } from '../../services/diceService';
import { getModifier } from '../../services/dataService';

interface SavingThrowsProps {
  character: Character;
  setRollResult: (result: {
    text: string;
    value: number | null;
    details?: Array<{ value: number; kept: boolean; critical?: 'success' | 'failure' }>
  }) => void;
  onDiceRoll: (roll: any) => void;
}

type RollType = 'normal' | 'advantage' | 'disadvantage';

export const SavingThrows: React.FC<SavingThrowsProps> = ({
  character,
  setRollResult,
  onDiceRoll,
}) => {
  const [rollType, setRollType] = useState<RollType>('normal');

  const getSavingThrowModifier = (ability: keyof Character['abilities']) => {
    const baseMod = getModifier(character.abilities[ability].score);
    // Check if this ability has proficiency in saving throws
    // This would need to be implemented based on class/race features
    // For now, return base modifier
    return baseMod;
  };

  const handleSavingThrow = (abilityName: string, modifier: number, type: RollType = rollType) => {
    let roll;
    switch (type) {
      case 'advantage':
        roll = createAdvantageRoll(`${abilityName} Saving Throw`, modifier);
        break;
      case 'disadvantage':
        roll = createDisadvantageRoll(`${abilityName} Saving Throw`, modifier);
        break;
      default:
        roll = createComplexRoll(`${abilityName} Saving Throw`, `1d20+${modifier}`);
    }

    setRollResult({
      text: `${roll.label}: ${roll.notation}`,
      value: roll.total,
      details: roll.pools?.[0]?.results.map((value, idx) => ({
        value,
        kept: roll.diceResults.includes(value),
        critical: roll.diceResults.length === 1 && roll.diceResults[0] === value ? roll.critical : undefined
      }))
    });
    onDiceRoll(roll);
  };

  const savingThrows = [
    { name: 'STR', ability: 'STR' as const },
    { name: 'DEX', ability: 'DEX' as const },
    { name: 'CON', ability: 'CON' as const },
    { name: 'INT', ability: 'INT' as const },
    { name: 'WIS', ability: 'WIS' as const },
    { name: 'CHA', ability: 'CHA' as const },
  ];

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg border-l-4 border-orange-500">
      <div className="px-6 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-orange-400">Saving Throws</h3>
          <div className="flex items-center gap-2">
            <select
              value={rollType}
              onChange={(e) => setRollType(e.target.value as RollType)}
              className="text-xs bg-gray-700 text-gray-300 rounded px-2 py-1 border border-gray-600"
            >
              <option value="normal">Normal</option>
              <option value="advantage">Advantage</option>
              <option value="disadvantage">Disadvantage</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {savingThrows.map(({ name, ability }) => {
            const modifier = getSavingThrowModifier(ability);
            const hasProficiency = false; // TODO: Implement proficiency checking

            return (
              <button
                key={ability}
                onClick={() => handleSavingThrow(name, modifier)}
                className="flex items-center justify-between p-3 bg-gray-700/50 hover:bg-orange-700/70 rounded-lg transition-colors cursor-pointer"
                title={`Roll ${name} Saving Throw (${rollType})`}
              >
                <div className="flex items-center gap-2">
                  <Dice6 className="w-4 h-4 text-orange-500" />
                  <span className="font-semibold text-white">{name}</span>
                  {hasProficiency && <span className="text-xs bg-orange-600 text-white px-1.5 py-0.5 rounded">●</span>}
                </div>
                <span className={`font-mono text-lg ${modifier >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {modifier >= 0 ? '+' : ''}{modifier}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
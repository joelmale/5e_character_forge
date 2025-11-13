import React from 'react';
import { Dice6 } from 'lucide-react';
import { AbilityName } from '../../types/dnd';
import { createAbilityRoll } from '../../services/diceService';
import { formatModifier } from '../../utils/formatters';

interface AbilityScoreBlockProps {
  name: AbilityName;
  ability: { score: number; modifier: number };
  setRollResult: (result: { text: string; value: number | null }) => void;
  onDiceRoll: (roll: any) => void;
}

export const AbilityScoreBlock: React.FC<AbilityScoreBlockProps> = ({
  name,
  ability,
  setRollResult,
  onDiceRoll,
}) => {
  const handleRoll = () => {
    const roll = createAbilityRoll(name, ability.score);
    setRollResult({ text: `${roll.label}: ${roll.notation}`, value: roll.total });
    onDiceRoll(roll);
  };

  return (
    <button
      onClick={handleRoll}
      className="flex flex-col items-center p-2 bg-gray-700 hover:bg-red-700/70 rounded-lg transition-colors cursor-pointer"
      title={`Roll ${name} check`}
    >
      <Dice6 className="w-4 h-4 text-red-500 mb-1" />
      <span className="text-xs font-semibold text-gray-400">{name}</span>
      <div className="text-xl font-extrabold text-yellow-300">{ability.score}</div>
      <div className="text-xl font-extrabold text-yellow-300">{formatModifier(ability.modifier)}</div>
    </button>
  );
};
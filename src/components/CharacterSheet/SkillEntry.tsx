import React from 'react';
import { Dice6 } from 'lucide-react';
import { SkillName } from '../../types/dnd';
import { createSkillRoll } from '../../services/diceService';
import { formatModifier } from '../../utils/formatters';

interface SkillEntryProps {
  name: SkillName;
  skill: { value: number; proficient: boolean };
  setRollResult: (result: { text: string; value: number | null }) => void;
  onDiceRoll: (roll: any) => void;
}

export const SkillEntry: React.FC<SkillEntryProps> = ({
  name,
  skill,
  setRollResult,
  onDiceRoll,
}) => {
  const skillLabel = name.replace(/([A-Z])/g, ' $1').trim();

  const handleRoll = () => {
    const roll = createSkillRoll(skillLabel, skill.value);
    setRollResult({ text: `${roll.label}: ${roll.notation}`, value: roll.total });
    onDiceRoll(roll);
  };

  return (
    <button
      onClick={handleRoll}
      className="flex items-center justify-between p-2 bg-gray-700/50 hover:bg-red-700/70 rounded transition-colors cursor-pointer"
      title={`Roll ${skillLabel} check`}
    >
      <div className="flex items-center gap-2">
        <Dice6 className="w-4 h-4 text-red-500" />
        <span className="font-mono text-lg w-8 text-yellow-400">{formatModifier(skill.value)}</span>
        <span className="text-sm font-semibold text-white truncate">{skillLabel}</span>
      </div>
      {skill.proficient && (
        <span className="text-xs bg-yellow-600 text-white px-1.5 py-0.5 rounded">Prof</span>
      )}
    </button>
  );
};
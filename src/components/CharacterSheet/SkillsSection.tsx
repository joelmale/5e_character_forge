import React from 'react';
import { Character, SkillName } from '../../types/dnd';
import { SkillEntry } from './index';
import type { LayoutMode } from './AbilityScores';

interface SkillsSectionProps {
  character: Character;
  setRollResult: (result: { text: string; value: number | null }) => void;
  onDiceRoll: (roll: any) => void;
  layoutMode?: LayoutMode;
}

export const SkillsSection: React.FC<SkillsSectionProps> = ({
  character,
  setRollResult,
  onDiceRoll,
  layoutMode = 'modern',
}) => {
  const skills = Object.entries(character.skills) as [SkillName, any][];

  // Classic layout: Single column, compact
  if (layoutMode === 'classic') {
    return (
      <div className="space-y-1">
        {skills.sort((a, b) => a[0].localeCompare(b[0])).map(([name, skill]) => (
          <SkillEntry
            key={name}
            name={name}
            skill={skill}
            setRollResult={setRollResult}
            onDiceRoll={onDiceRoll}
            layoutMode="classic"
          />
        ))}
      </div>
    );
  }

  // Modern layout: 2 columns
  return (
    <div className="col-span-1 md:col-span-2 space-y-4">
      <h2 className="text-xl font-bold text-red-500 border-b border-red-800 pb-1">Skills</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 bg-gray-800/70 p-3 rounded-xl border border-red-900 max-h-[450px] overflow-y-auto">
        {skills.sort((a, b) => a[0].localeCompare(b[0])).map(([name, skill]) => (
          <SkillEntry
            key={name}
            name={name}
            skill={skill}
            setRollResult={setRollResult}
            onDiceRoll={onDiceRoll}
          />
        ))}
      </div>
    </div>
  );
};
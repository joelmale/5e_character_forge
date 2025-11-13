import React from 'react';
import { Zap } from 'lucide-react';
import { Character, AbilityName } from '../../types/dnd';
import { AbilityScoreBlock } from './index';

interface AbilityScoresProps {
  character: Character;
  setRollResult: (result: { text: string; value: number | null }) => void;
  onDiceRoll: (roll: any) => void;
  onToggleInspiration: (characterId: string) => void;
}

export const AbilityScores: React.FC<AbilityScoresProps> = ({
  character,
  setRollResult,
  onDiceRoll,
  onToggleInspiration,
}) => {
  const abilities = Object.entries(character.abilities) as [AbilityName, any][];

  return (
    <div className="col-span-1 space-y-4">
      <h2 className="text-xl font-bold text-red-500 border-b border-red-800 pb-1">Ability Scores</h2>
      <div className="grid grid-cols-3 gap-2">
        {abilities.map(([name, ability]) => (
          <AbilityScoreBlock
            key={name}
            name={name}
            ability={ability}
            setRollResult={setRollResult}
            onDiceRoll={onDiceRoll}
          />
        ))}
      </div>
      <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border-l-4 border-yellow-500">
        <span className="text-lg font-bold">Inspiration</span>
        <button
          onClick={() => onToggleInspiration(character.id)}
          className={`w-8 h-8 rounded-full transition-all cursor-pointer ${character.inspiration ? 'bg-yellow-500' : 'bg-gray-600 hover:bg-gray-500'}`}
          title={character.inspiration ? 'Remove Inspiration' : 'Grant Inspiration'}
        >
          {character.inspiration && <Zap className="w-5 h-5 mx-auto text-gray-900" />}
        </button>
      </div>
    </div>
  );
};
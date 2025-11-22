import React from 'react';
import { Heart, Plus, Minus } from 'lucide-react';
import { Character } from '../../types/dnd';

interface DeathSavesProps {
  character: Character;
  onUpdateCharacter: (character: Character) => void;
}

export const DeathSaves: React.FC<DeathSavesProps> = ({
  character,
  onUpdateCharacter,
}) => {
  const updateDeathSaves = (field: 'successes' | 'failures', delta: number) => {
    const current = character.deathSaves || { successes: 0, failures: 0 };
    const newValue = Math.max(0, Math.min(3, current[field] + delta));

    onUpdateCharacter({
      ...character,
      deathSaves: {
        ...current,
        [field]: newValue
      }
    });
  };

  const resetDeathSaves = () => {
    onUpdateCharacter({
      ...character,
      deathSaves: { successes: 0, failures: 0 }
    });
  };

  const deathSaves = character.deathSaves || { successes: 0, failures: 0 };

  return (
    <div className="bg-theme-tertiary/50 border border-theme-primary rounded p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-theme-muted uppercase tracking-wider flex items-center gap-1">
          <Heart className="w-3 h-3" />
          Death Saves
        </h3>
        <button
          onClick={resetDeathSaves}
          className="text-xs text-theme-disabled hover:text-theme-tertiary"
          title="Reset death saves"
        >
          Reset
        </button>
      </div>
      <div className="space-y-1.5">
        {/* Successes */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-accent-green-light">Successes</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateDeathSaves('successes', -1)}
              className="w-5 h-5 flex items-center justify-center bg-theme-tertiary hover:bg-theme-quaternary rounded"
              disabled={deathSaves.successes === 0}
            >
              <Minus className="w-3 h-3" />
            </button>
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full border-2 ${i < deathSaves.successes ? 'bg-accent-green border-green-500' : 'border-theme-primary'}`}
                />
              ))}
            </div>
            <button
              onClick={() => updateDeathSaves('successes', 1)}
              className="w-5 h-5 flex items-center justify-center bg-theme-tertiary hover:bg-theme-quaternary rounded"
              disabled={deathSaves.successes === 3}
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
        {/* Failures */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-accent-red-light">Failures</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateDeathSaves('failures', -1)}
              className="w-5 h-5 flex items-center justify-center bg-theme-tertiary hover:bg-theme-quaternary rounded"
              disabled={deathSaves.failures === 0}
            >
              <Minus className="w-3 h-3" />
            </button>
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full border-2 ${i < deathSaves.failures ? 'bg-accent-red-light border-red-500' : 'border-theme-primary'}`}
                />
              ))}
            </div>
            <button
              onClick={() => updateDeathSaves('failures', 1)}
              className="w-5 h-5 flex items-center justify-center bg-theme-tertiary hover:bg-theme-quaternary rounded"
              disabled={deathSaves.failures === 3}
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

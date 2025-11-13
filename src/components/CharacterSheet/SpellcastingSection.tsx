import React from 'react';
import { Character } from '../../types/dnd';

interface SpellcastingSectionProps {
  character: Character;
  onUpdateCharacter: (character: Character) => void;
  onSpellPreparation: () => void;
}

export const SpellcastingSection: React.FC<SpellcastingSectionProps> = ({
  character,
  onUpdateCharacter: _onUpdateCharacter,
  onSpellPreparation,
}) => {
  if (!character.spellcasting) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-purple-500 border-b border-purple-800 pb-1">Spellcasting</h2>
        <div className="p-4 bg-gray-800 rounded-xl shadow-lg border-l-4 border-gray-600 text-center">
          <p className="text-gray-400 text-sm">No spellcasting abilities available for this character.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-purple-500 border-b border-purple-800 pb-1">Spellcasting</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Spellcasting Stats */}
        <div className="p-4 bg-gray-800 rounded-xl shadow-lg border-l-4 border-purple-500">
          <h3 className="text-lg font-bold text-purple-400 mb-3">Spell Stats</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Spellcasting Ability:</span>
              <span className="font-bold text-white">{character.spellcasting.ability}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Spell Save DC:</span>
              <span className="font-bold text-yellow-300">{character.spellcasting.spellSaveDC}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Spell Attack:</span>
              <span className="font-bold text-yellow-300">+{character.spellcasting.spellAttackBonus}</span>
            </div>
          </div>
        </div>

        {/* Spell Slots - Simplified */}
        <div className="p-4 bg-gray-800 rounded-xl shadow-lg border-l-4 border-blue-500">
          <h3 className="text-lg font-bold text-blue-400 mb-3">Spell Slots</h3>
          <div className="space-y-2 text-sm">
            {character.spellcasting.spellSlots.map((maxSlots, index) => {
              if (maxSlots === 0) return null;
              const spellLevel = index + 1;
              const usedSlots = character.spellcasting?.usedSpellSlots?.[index] || 0;
              const availableSlots = maxSlots - usedSlots;

              return (
                <div key={spellLevel} className="flex justify-between items-center">
                  <span className="text-gray-400">Level {spellLevel}:</span>
                  <span className="font-bold text-white">{availableSlots}/{maxSlots}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cantrips & Spells - Simplified */}
        <div className="p-4 bg-gray-800 rounded-xl shadow-lg border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-green-400">
              {character.spellcasting.spellcastingType === 'wizard' ? 'Spellcasting' :
               character.spellcasting.spellcastingType === 'prepared' ? 'Prepared Spells' :
               'Known Spells'}
            </h3>
            {character.spellcasting.spellcastingType === 'prepared' && (
              <button
                onClick={onSpellPreparation}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-500 rounded text-sm transition-colors flex items-center gap-1"
                title="Prepare spells for the day"
              >
                Prepare
              </button>
            )}
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <div className="font-semibold text-gray-300 mb-1">Cantrips ({character.spellcasting.cantripsKnown.length})</div>
              <ul className="list-disc list-inside space-y-0.5 text-xs text-gray-400">
                {character.spellcasting.cantripsKnown.map((spellSlug) => (
                  <li key={spellSlug}>{spellSlug}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
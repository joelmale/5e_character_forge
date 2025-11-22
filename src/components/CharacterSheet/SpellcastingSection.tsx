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
        <div className="p-4 bg-theme-secondary rounded-xl shadow-lg border-l-4 border-theme-primary text-center">
          <p className="text-theme-muted text-sm">No spellcasting abilities available for this character.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-purple-500 border-b border-purple-800 pb-1">Spellcasting</h2>
      {/* Top Row: Spell Stats and Prepared Spells side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Spellcasting Stats */}
        <div className="p-4 bg-theme-secondary rounded-xl shadow-lg border-l-4 border-accent-purple">
          <h3 className="text-lg font-bold text-accent-purple-light mb-3">Spell Stats</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-theme-muted">Spellcasting Ability:</span>
              <span className="font-bold text-white">{character.spellcasting.ability}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-theme-muted">Spell Save DC:</span>
              <span className="font-bold text-accent-yellow-light">{character.spellcasting.spellSaveDC}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-theme-muted">Spell Attack:</span>
              <span className="font-bold text-accent-yellow-light">+{character.spellcasting.spellAttackBonus}</span>
            </div>
          </div>
        </div>

        {/* Cantrips & Spells - Simplified */}
        <div className="p-4 bg-theme-secondary rounded-xl shadow-lg border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-accent-green-light">
              {character.spellcasting.spellcastingType === 'wizard' ? 'Spellcasting' :
               character.spellcasting.spellcastingType === 'prepared' ? 'Prepared Spells' :
               'Known Spells'}
            </h3>
            {character.spellcasting.spellcastingType === 'prepared' && (
              <button
                onClick={onSpellPreparation}
                className="px-3 py-1 bg-accent-purple hover:bg-accent-purple-light rounded text-sm transition-colors flex items-center gap-1"
                title="Prepare spells for the day"
              >
                Prepare
              </button>
            )}
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <div className="font-semibold text-theme-tertiary mb-1">Cantrips ({character.spellcasting.cantripsKnown.length})</div>
              <div className="flex flex-wrap gap-2">
                {character.spellcasting.cantripsKnown.map((spellSlug) => (
                  <span key={spellSlug} className="px-2 py-1 bg-purple-700 text-white text-xs rounded">
                    {spellSlug}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Spell Slots - Full Width */}
      <div className="p-4 bg-theme-secondary rounded-xl shadow-lg border-l-4 border-blue-500">
        <h3 className="text-lg font-bold text-accent-blue-light mb-3">Spell Slots</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {character.spellcasting.spellSlots.map((maxSlots, index) => {
            if (maxSlots === 0) return null;
            const spellLevel = index + 1;
            const usedSlots = character.spellcasting?.usedSpellSlots?.[index] || 0;
            const availableSlots = maxSlots - usedSlots;

            return (
              <div key={spellLevel} className="flex flex-col items-center space-y-2 p-2 bg-theme-tertiary/50 rounded-lg">
                <div className="flex items-center justify-between w-full">
                  <span className="text-theme-muted text-xs">Level {spellLevel}</span>
                  <span className="font-bold text-white text-xs">{availableSlots}/{maxSlots}</span>
                </div>
                <div className="flex items-center gap-1 justify-center flex-wrap">
                  {Array.from({ length: maxSlots }, (_, slotIndex) => (
                    <button
                      key={slotIndex}
                      onClick={() => {
                        const newUsedSlots = slotIndex < usedSlots ? slotIndex : slotIndex + 1;
                        const updatedCharacter = {
                          ...character,
                          spellcasting: {
                            ...character.spellcasting!,
                            usedSpellSlots: {
                              ...character.spellcasting!.usedSpellSlots,
                              [index]: Math.min(newUsedSlots, maxSlots)
                            }
                          }
                        };
                        _onUpdateCharacter(updatedCharacter);
                      }}
                      className={`w-4 h-4 rounded-full border-2 transition-colors ${
                        slotIndex < usedSlots
                          ? 'bg-accent-red-light border-red-400 cursor-pointer hover:bg-red-400'
                          : 'bg-blue-400 border-blue-300 cursor-pointer hover:bg-blue-300'
                      }`}
                      title={`${slotIndex < usedSlots ? 'Used' : 'Available'} slot - Click to toggle`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
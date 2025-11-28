import React, { useState } from 'react';
import { Character } from '../../types/dnd';
import { SPELL_DATABASE, AppSpell } from '../../services/dataService';
import { SpellDetailModal } from '../SpellDetailModal';

// Helper function to get max prepared spells for a character
const getMaxPreparedSpells = (character: Character): number => {
  if (!character.spellcasting || character.spellcasting.spellcastingType !== 'prepared') {
    return 0;
  }

  const abilityMod = character.abilities[character.spellcasting.ability].modifier;
  return character.level + abilityMod;
};

// Helper function to get spells available for a given slot level (including upcasting)
const getSpellsAvailableForSlotLevel = (character: Character, slotLevel: number) => {
  const spellcasting = character.spellcasting;
  if (!spellcasting) return [];

  let spellList: string[] = [];

  if (spellcasting.spellcastingType === 'prepared' && spellcasting.preparedSpells) {
    spellList = spellcasting.preparedSpells;
  } else if (spellcasting.spellcastingType === 'known' && spellcasting.spellsKnown) {
    spellList = spellcasting.spellsKnown;
  } else if (spellcasting.spellcastingType === 'wizard' && spellcasting.preparedSpells) {
    spellList = spellcasting.preparedSpells;
  }

  return spellList
    .map(slug => SPELL_DATABASE.find(s => s.slug === slug))
    .filter(spell => spell && spell.level <= slotLevel)
    .sort((a, b) => (a?.level || 0) - (b?.level || 0));
};

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
  const [selectedSpell, setSelectedSpell] = useState<AppSpell | null>(null);

  const handleSpellClick = (spellSlug: string) => {
    const spell = SPELL_DATABASE.find(s => s.slug === spellSlug);
    if (spell) {
      setSelectedSpell(spell);
    }
  };

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
              <span className="font-bold text-theme-primary">{character.spellcasting.ability}</span>
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
                {character.spellcasting.cantripsKnown.map((spellSlug) => {
                  const spell = SPELL_DATABASE.find(s => s.slug === spellSlug);
                  return (
                    <button
                      key={spellSlug}
                      onClick={() => handleSpellClick(spellSlug)}
                      className="px-2 py-1 bg-purple-700 hover:bg-purple-600 text-theme-primary text-xs rounded cursor-pointer transition-colors"
                      title="Click for spell details"
                    >
                      {spell?.name || spellSlug}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feat-Granted Spells - Condensed */}
      {character.spellcasting.featGrantedSpells && character.spellcasting.featGrantedSpells.length > 0 && (
        <div className="p-4 bg-theme-secondary rounded-xl shadow-lg border-l-4 border-accent-red">
          <h3 className="text-lg font-bold text-accent-red-light mb-3">Feat Spells</h3>
          <div className="flex flex-wrap gap-2">
            {character.spellcasting.featGrantedSpells.map((featSpell, index) => {
              const spell = SPELL_DATABASE.find(s => s.slug === featSpell.spellSlug);
              return (
                <button
                  key={`${featSpell.featSlug}-${index}`}
                  onClick={() => handleSpellClick(featSpell.spellSlug)}
                  className="px-2 py-1 bg-accent-red hover:bg-accent-red-dark text-theme-primary text-xs rounded cursor-pointer transition-colors"
                  title={`${spell?.name || featSpell.spellSlug} (${featSpell.spellcastingAbility}, ${featSpell.rechargeType === 'at-will' ? 'at will' : `${featSpell.usesPerDay}/long rest`})`}
                >
                  {spell?.name || featSpell.spellSlug}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Middle Row: Known Spells or Daily Prepared Spells - Full Width */}
      {(() => {
        const spellcasting = character.spellcasting;
        if (!spellcasting) return null;

        if (spellcasting.spellcastingType === 'known' && spellcasting.spellsKnown) {
          return (
            <div className="p-4 bg-theme-secondary rounded-xl shadow-lg border-l-4 border-accent-blue">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-accent-blue-light">Known Spells</h3>
                <span className="text-sm text-theme-muted">
                  ({spellcasting.spellsKnown.length})
                </span>
              </div>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => {
                  const spellsAtLevel = spellcasting.spellsKnown!
                    .map(slug => SPELL_DATABASE.find(s => s.slug === slug))
                    .filter(spell => spell && spell.level === level);

                  if (spellsAtLevel.length === 0) return null;

                  return (
                    <div key={level} className="flex items-start gap-3">
                      <span className="text-xs text-theme-muted font-mono w-12">Lvl {level}</span>
                  <div className="flex flex-wrap gap-2 flex-1">
                    {spellsAtLevel.map(spell => (
                      <button
                        key={spell!.slug}
                        onClick={() => handleSpellClick(spell!.slug)}
                        className="px-2 py-1 bg-blue-700 hover:bg-blue-600 text-theme-primary text-xs rounded flex items-center gap-1 cursor-pointer transition-colors"
                        title="Click for spell details"
                      >
                        {spell!.name}
                        {spell!.ritual && <span className="text-yellow-400">(R)</span>}
                      </button>
                    ))}
                  </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        } else if ((spellcasting.spellcastingType === 'prepared' && spellcasting.preparedSpells) ||
                   (spellcasting.spellcastingType === 'wizard' && spellcasting.preparedSpells)) {
          return (
            <div className="p-4 bg-theme-secondary rounded-xl shadow-lg border-l-4 border-accent-blue">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-accent-blue-light">Daily Prepared Spells</h3>
                <span className="text-sm text-theme-muted">
                  ({spellcasting.preparedSpells?.length || 0} / {getMaxPreparedSpells(character)})
                </span>
              </div>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => {
                  const spellsAtLevel = spellcasting.preparedSpells!
                    .map(slug => SPELL_DATABASE.find(s => s.slug === slug))
                    .filter(spell => spell && spell.level === level);

                  if (spellsAtLevel.length === 0) return null;

                  return (
                    <div key={level} className="flex items-start gap-3">
                      <span className="text-xs text-theme-muted font-mono w-12">Lvl {level}</span>
                  <div className="flex flex-wrap gap-2 flex-1">
                    {spellsAtLevel.map(spell => (
                      <button
                        key={spell!.slug}
                        onClick={() => handleSpellClick(spell!.slug)}
                        className="px-2 py-1 bg-blue-700 hover:bg-blue-600 text-theme-primary text-xs rounded flex items-center gap-1 cursor-pointer transition-colors"
                        title="Click for spell details"
                      >
                        {spell!.name}
                        {spell!.ritual && <span className="text-yellow-400">(R)</span>}
                      </button>
                    ))}
                  </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        return null;
      })()}



      {/* Bottom Row: Spell Slots - Full Width */}
      <div className="p-4 bg-theme-secondary rounded-xl shadow-lg border-l-4 border-blue-500">
        <h3 className="text-lg font-bold text-accent-blue-light mb-3">Spell Slots</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {character.spellcasting.spellSlots.slice(1).map((maxSlots, index) => {
            if (maxSlots === 0) return null;
            const spellLevel = index + 1;
            const usedSlots = character.spellcasting?.usedSpellSlots?.[index + 1] || 0;
            const availableSlots = maxSlots - usedSlots;

            const availableSpells = getSpellsAvailableForSlotLevel(character, spellLevel);

            return (
              <div key={spellLevel} className="flex flex-col items-center space-y-2 p-2 bg-theme-tertiary/50 rounded-lg">
                <div className="flex items-center justify-between w-full">
                  <span className="text-theme-muted text-xs">Level {spellLevel}</span>
                  <span className="font-bold text-theme-primary text-xs">{availableSlots}/{maxSlots}</span>
                </div>

                {/* Show available prepared spells for this slot level */}
                {availableSpells.length > 0 && (
                  <div className="text-xs text-center text-theme-muted max-w-full">
                    {availableSpells.slice(0, 3).map(spell => spell!.name).join(', ')}
                    {availableSpells.length > 3 && (
                      <span className="text-accent-blue-light">
                        {' '} +{availableSpells.length - 3} more
                      </span>
                    )}
                  </div>
                )}

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
                                [index + 1]: Math.min(newUsedSlots, maxSlots)
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

      {/* Spell Detail Modal */}
      <SpellDetailModal
        spell={selectedSpell}
        isOpen={selectedSpell !== null}
        onClose={() => setSelectedSpell(null)}
      />
    </div>
  );
};
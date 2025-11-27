/**
 * Level-Up Wizard - Spells Step
 *
 * Learn new spells for spellcasters
 */

import React, { useState } from 'react';
import { Character, LevelUpChoices } from '../../../types/dnd';
import { LevelUpData } from '../../../data/classProgression';
import { loadSpells } from '../../../services/dataService';

interface StepSpellsProps {
  character: Character;
  levelUpData: LevelUpData;
  choices: LevelUpChoices;
  updateChoices: (choices: Partial<LevelUpChoices>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const StepSpells: React.FC<StepSpellsProps> = ({
  character,
  levelUpData,
  choices,
  updateChoices,
  onNext,
  onPrev
}) => {
  const [selectedSpells, setSelectedSpells] = useState<string[]>([]);

  // Load spells for this class
  const allSpells = loadSpells();
  const classSpells = allSpells.filter(spell => {
    const classList = Array.isArray(spell.class) ? spell.class : [spell.class];
    return classList.some(c => c.toLowerCase() === character.class.toLowerCase());
  });

  // Determine how many spells can be learned
  const spellsToLearn = levelUpData.newCantripsKnown ? 1 : (levelUpData.newSpellsKnown || 0);

  // Filter out already known spells
  const availableSpells = classSpells.filter(spell => {
    if (!character.spellcasting) return false;

    const alreadyKnown =
      character.spellcasting.cantripsKnown?.includes(spell.slug) ||
      character.spellcasting.spellsKnown?.includes(spell.slug) ||
      character.spellcasting.spellbook?.includes(spell.slug);

    return !alreadyKnown;
  });

  // Separate cantrips and leveled spells
  const availableCantrips = availableSpells.filter(s => s.level === 0);
  const availableLeveledSpells = availableSpells.filter(s => s.level > 0);

  const handleToggleSpell = (spellSlug: string) => {
    if (selectedSpells.includes(spellSlug)) {
      setSelectedSpells(selectedSpells.filter(s => s !== spellSlug));
    } else if (selectedSpells.length < spellsToLearn) {
      setSelectedSpells([...selectedSpells, spellSlug]);
    }
  };

  const handleNext = () => {
    updateChoices({ spellsLearned: selectedSpells });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-accent-gold mb-2">
          Learn New Spells
        </h3>
        <p className="text-theme-text-secondary">
          Select {spellsToLearn} new {levelUpData.newCantripsKnown ? 'cantrip(s)' : 'spell(s)'} to learn.
        </p>
      </div>

      <div className="bg-theme-primary rounded-lg p-4">
        <p className="text-theme-text">
          Selected: <span className="text-accent-gold font-bold">{selectedSpells.length}</span> / {spellsToLearn}
        </p>
      </div>

      <div className="max-h-96 overflow-y-auto space-y-2">
        {levelUpData.newCantripsKnown && availableCantrips.length > 0 && (
          <>
            <h4 className="font-semibold text-accent-gold sticky top-0 bg-theme-secondary py-2">Cantrips</h4>
            {availableCantrips.map((spell) => (
              <button
                key={spell.slug}
                onClick={() => handleToggleSpell(spell.slug)}
                disabled={!selectedSpells.includes(spell.slug) && selectedSpells.length >= spellsToLearn}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedSpells.includes(spell.slug)
                    ? 'border-accent-gold bg-accent-gold bg-opacity-10'
                    : 'border-theme-border bg-theme-primary hover:border-accent-gold hover:border-opacity-50 disabled:opacity-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-theme-text">{spell.name}</h4>
                    <p className="text-xs text-theme-text-secondary mt-1">
                      {spell.school} • {spell.casting_time}
                    </p>
                  </div>
                  <div className={`flex-shrink-0 ml-4 w-5 h-5 rounded border flex items-center justify-center ${
                    selectedSpells.includes(spell.slug) ? 'border-accent-gold bg-accent-gold' : 'border-theme-border'
                  }`}>
                    {selectedSpells.includes(spell.slug) && (
                      <svg className="w-3 h-3 text-theme-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </>
        )}

        {!levelUpData.newCantripsKnown && availableLeveledSpells.length > 0 && (
          <>
            <h4 className="font-semibold text-accent-gold sticky top-0 bg-theme-secondary py-2">Leveled Spells</h4>
            {availableLeveledSpells.map((spell) => (
              <button
                key={spell.slug}
                onClick={() => handleToggleSpell(spell.slug)}
                disabled={!selectedSpells.includes(spell.slug) && selectedSpells.length >= spellsToLearn}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedSpells.includes(spell.slug)
                    ? 'border-accent-gold bg-accent-gold bg-opacity-10'
                    : 'border-theme-border bg-theme-primary hover:border-accent-gold hover:border-opacity-50 disabled:opacity-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-theme-text">{spell.name}</h4>
                    <p className="text-xs text-theme-text-secondary mt-1">
                      Level {spell.level} • {spell.school} • {spell.casting_time}
                    </p>
                  </div>
                  <div className={`flex-shrink-0 ml-4 w-5 h-5 rounded border flex items-center justify-center ${
                    selectedSpells.includes(spell.slug) ? 'border-accent-gold bg-accent-gold' : 'border-theme-border'
                  }`}>
                    {selectedSpells.includes(spell.slug) && (
                      <svg className="w-3 h-3 text-theme-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onPrev}
          className="px-6 py-3 bg-theme-primary text-theme-text font-semibold rounded-lg hover:bg-opacity-80 transition-colors border border-theme-border"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={selectedSpells.length !== spellsToLearn}
          className="px-6 py-3 bg-accent-gold text-theme-primary font-semibold rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

/**
 * Level-Up Wizard - Spells Step
 *
 * Learn new spells for spellcasters
 */

import React, { useState } from 'react';
import { Character, LevelUpChoices } from '../../../types/dnd';
import { LevelUpData } from '../../../data/classProgression';
import { loadSpells } from '../../../services/dataService';
import { SPELL_SLOTS_BY_CLASS } from '../../../data/spellSlots';

interface StepSpellsProps {
  character: Character;
  levelUpData: LevelUpData;
  choices: LevelUpChoices;
  updateChoices: (choices: Partial<LevelUpChoices>) => void;
  onNext: () => void;
  onPrev: () => void;
  spellChoiceIndex?: number;
}

export const StepSpells: React.FC<StepSpellsProps> = ({
  character,
  levelUpData,
  choices: _choices,
  updateChoices,
  onNext,
  onPrev,
  spellChoiceIndex = 0
}) => {
  const [selectedSpells, setSelectedSpells] = useState<string[]>([]);

  // Load spells for this class
  const allSpells = loadSpells();
  const classSlug = character.class.toLowerCase();
  const classSpells = allSpells.filter(spell => {
    if (!spell.classes) return false;
    const classList = Array.isArray(spell.classes) ? spell.classes : [spell.classes];
    return classList.some(c => c && typeof c === 'string' && c.toLowerCase() === classSlug);
  });

  // Get the specific spell choice for this step
  const spellChoices = levelUpData.choices.filter(c => c.type === 'spells');
  const currentSpellChoice = spellChoices[spellChoiceIndex];

  if (!currentSpellChoice) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-accent-gold mb-2">
            No Spell Choice Available
          </h3>
          <p className="text-[#992600]">
            There are no spell choices available for this level.
          </p>
        </div>
        <div className="flex justify-end pt-4">
          <button
            onClick={onNext}
            className="px-6 py-3 bg-accent-gold text-theme-primary font-semibold rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // Determine how many spells can be learned and what type
  const spellsToLearn = currentSpellChoice.count || 1;
  const isCantripChoice = currentSpellChoice.description.toLowerCase().includes('cantrip');

  // Determine the highest spell level the character can cast at the new level
  const spellSlotsAtNewLevel =
    SPELL_SLOTS_BY_CLASS[classSlug]?.[levelUpData.toLevel] ||
    character.spellcasting?.spellSlots ||
    [];
  const derivedMaxSpellLevel = spellSlotsAtNewLevel.reduce((max, slots, levelIndex) => {
    if (levelIndex === 0) return max; // Index 0 is cantrips
    return slots > 0 ? levelIndex : max;
  }, 0);
  const maxSpellLevel = derivedMaxSpellLevel || Math.max(1, Math.ceil(levelUpData.toLevel / 2));

  // Filter spells based on choice type and exclude already known
  const availableSpells = classSpells.filter(spell => {
    if (!character.spellcasting) return false;

    // Filter by spell level based on choice type
    if (isCantripChoice && spell.level !== 0) return false;
    if (!isCantripChoice) {
      if (spell.level === 0) return false;
      if (maxSpellLevel > 0 && spell.level > maxSpellLevel) return false;
    }

    const alreadyKnown =
      character.spellcasting.cantripsKnown?.includes(spell.slug) ||
      character.spellcasting.spellsKnown?.includes(spell.slug) ||
      character.spellcasting.spellbook?.includes(spell.slug);

    return !alreadyKnown;
  });

  // All available spells are now filtered by choice type

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
          {currentSpellChoice.description}
        </h3>
        <p className="text-[#992600]">
          Select {spellsToLearn} {isCantripChoice ? 'cantrip(s)' : 'spell(s)'} to learn.
        </p>
      </div>

      <div className="bg-theme-primary rounded-lg p-4">
        <p className="text-theme-text">
          Selected: <span className="text-accent-gold font-bold">{selectedSpells.length}</span> / {spellsToLearn}
        </p>
      </div>

      <div className="max-h-96 overflow-y-auto space-y-2">
        {availableSpells.map((spell: any) => (
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
                <p className="text-xs text-[#992600] mt-1">
                  {spell.level === 0 ? `${spell.school} • ${spell.castingTime}` : `Level ${spell.level} • ${spell.school} • ${spell.castingTime}`}
                </p>
              </div>
              <div className={`flex-shrink-0 ml-4 w-5 h-5 rounded border flex items-center justify-center ${
                selectedSpells.includes(spell.slug) ? 'border-accent-gold bg-accent-gold' : 'border-theme-border'
              }`}>
                {selectedSpells.includes(spell.slug) && (
                  <svg className="w-3 h-3 text-theme-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
          </button>
        ))}
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

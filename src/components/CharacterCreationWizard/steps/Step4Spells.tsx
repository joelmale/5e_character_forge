import React, { useRef, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Check, Shuffle } from 'lucide-react';
import { StepProps } from '../types/wizard.types';
import { loadClasses, getCantripsByClass, getLeveledSpellsByClass } from '../../../services/dataService';
import {
  getSpellcastingType,
  cleanupInvalidSpellSelections
} from '../../../utils/spellUtils';

const RandomizeButton: React.FC<{ onClick: () => void; title?: string; className?: string }> = ({
  onClick,
  title = "Randomize this section",
  className = ""
}) => {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 bg-accent-purple hover:bg-accent-purple-light rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-2 ${className}`}
      title={title}
    >
      <Shuffle className="w-4 h-4" />
      Randomize
    </button>
  );
};

export const Step4Spells: React.FC<StepProps> = ({ data, updateData, nextStep, prevStep, getNextStepLabel }) => {
  const allClasses = loadClasses();
  const selectedClass = allClasses.find(c => c.slug === data.classSlug);
  const hasProcessedAutoAdvance = useRef(false);

  // Auto-advance and validation effects (must be called before any conditional returns)
  useEffect(() => {
    if (!hasProcessedAutoAdvance.current && (!selectedClass || !selectedClass.spellcasting ||
        (selectedClass.spellcasting.cantripsKnown === 0 && selectedClass.spellcasting.spellsKnownOrPrepared === 0))) {
      hasProcessedAutoAdvance.current = true;
      nextStep();
    }
  }, [selectedClass, nextStep]);

  // Clear invalid spell selections if they exceed current limits
  useEffect(() => {
    if (selectedClass?.spellcasting) {
      const cleanedSelection = cleanupInvalidSpellSelections(
        data.spellSelection,
        data.classSlug,
        data.level,
        data.abilities
      );

      // Check if anything changed
      const hasChanges = JSON.stringify(cleanedSelection) !== JSON.stringify(data.spellSelection);

      if (hasChanges) {
        updateData({ spellSelection: cleanedSelection });
      }
    }
  }, [selectedClass, data.spellSelection, data.abilities, data.classSlug, data.level, updateData]);

  // If not a spellcaster or has no spells available, skip this step
  if (!selectedClass || !selectedClass.spellcasting ||
      (selectedClass.spellcasting.cantripsKnown === 0 && selectedClass.spellcasting.spellsKnownOrPrepared === 0)) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return <div className='text-center text-theme-muted'>This class doesn't have spells available at level {data.level}. Advancing...</div>;
  }

  const spellcasting = selectedClass.spellcasting!;
  const spellcastingType = getSpellcastingType(selectedClass.slug);
  const availableCantrips = getCantripsByClass(data.classSlug);
  const availableSpells = getLeveledSpellsByClass(data.classSlug, 1);

  const handleCantripToggle = (spellSlug: string) => {
    const current = data.spellSelection.selectedCantrips;
    const isSelected = current.includes(spellSlug);

    if (isSelected) {
      // Deselect
      updateData({
        spellSelection: {
          ...data.spellSelection,
          selectedCantrips: current.filter(s => s !== spellSlug),
        },
      });
    } else if (current.length < spellcasting.cantripsKnown) {
      // Select (if under limit)
      updateData({
        spellSelection: {
          ...data.spellSelection,
          selectedCantrips: [...current, spellSlug],
        },
      });
    }
  };

  const handleSpellToggle = (spellSlug: string, field: keyof typeof data.spellSelection) => {
    const current = (data.spellSelection[field] as string[]) || [];
    const isSelected = current.includes(spellSlug);

    if (isSelected) {
      // Deselect
      updateData({
        spellSelection: {
          ...data.spellSelection,
          [field]: current.filter(s => s !== spellSlug),
        },
      });
    } else if (current.length < spellcasting.spellsKnownOrPrepared) {
      // Select (if under limit)
      updateData({
        spellSelection: {
          ...data.spellSelection,
          [field]: [...current, spellSlug],
        },
      });
    }
  };

  const cantripsComplete = data.spellSelection.selectedCantrips.length === spellcasting.cantripsKnown;

  let spellsComplete = false;
  if (spellcastingType === 'known') {
    spellsComplete = (data.spellSelection.knownSpells?.length || 0) === spellcasting.spellsKnownOrPrepared;
  } else if (spellcastingType === 'prepared') {
    spellsComplete = (data.spellSelection.preparedSpells?.length || 0) === spellcasting.spellsKnownOrPrepared;
  } else if (spellcastingType === 'wizard') {
    const spellbookComplete = (data.spellSelection.spellbook?.length || 0) === 6;
    const dailyComplete = (data.spellSelection.dailyPrepared?.length || 0) === Math.max(1, Math.floor((data.abilities.INT - 10) / 2) + 1);
    spellsComplete = spellbookComplete && dailyComplete;
  }

  const allSelectionsComplete = cantripsComplete && spellsComplete;

  // Spell mode description
  const modeDescription = spellcastingType === 'wizard'
    ? 'Choose spells for your spellbook. You can prepare a subset of these each day.'
    : spellcastingType === 'prepared'
    ? 'Choose spells to prepare. You can change your prepared spells after a long rest.'
    : 'Choose spells your character knows. These are permanent until you level up.';

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-start'>
        <div>
          <h3 className='text-xl font-bold text-red-300'>Select Your Spells</h3>
          <p className='text-sm text-theme-muted mt-1'>
            {selectedClass.name} - {modeDescription}
          </p>
          <p className='text-xs text-purple-300 mt-1'>
            Spellcasting Ability: <span className='font-bold'>{spellcasting.ability}</span>
          </p>
        </div>
        <RandomizeButton
          onClick={() => {
            // Randomize spell selection - would need implementation

          }}
          title="Randomize spell selection"
        />
      </div>

      {/* Cantrips Section */}
      <div className="bg-theme-tertiary/50 border border-theme-primary rounded-lg p-4 space-y-3">
        <h4 className="text-lg font-bold text-accent-yellow-light">
          Cantrips ({data.spellSelection.selectedCantrips.length} / {spellcasting.cantripsKnown} selected)
        </h4>
        <p className="text-xs text-theme-muted">
          Cantrips are 0-level spells that can be cast at will, without expending spell slots.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {availableCantrips.map((spell) => {
            const isSelected = data.spellSelection.selectedCantrips.includes(spell.slug);
            const canSelect = data.spellSelection.selectedCantrips.length < spellcasting.cantripsKnown;

            return (
              <button
                key={spell.slug}
                onClick={() => handleCantripToggle(spell.slug)}
                disabled={!isSelected && !canSelect}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  isSelected
                    ? 'bg-blue-900 border-blue-500'
                    : canSelect
                    ? 'bg-theme-tertiary border-theme-primary hover:border-blue-400'
                    : 'bg-theme-secondary border-theme-secondary opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-white">{spell.name}</div>
                    <div className="text-xs text-purple-300">{spell.school}</div>
                  </div>
                  {isSelected && <Check className="w-5 h-5 text-accent-green-light" />}
                </div>
                <div className="text-xs text-theme-muted mt-2 line-clamp-2">
                  {spell.description}
                </div>
                <div className="text-xs text-theme-disabled mt-1">
                  {spell.castingTime} • {spell.range}
                  {spell.concentration && ' • Concentration'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Spell Selection Sections - Varies by spellcasting type */}
      {spellcastingType === 'wizard' && (
        <>
          {/* Wizard Spellbook Section */}
          <div className="bg-theme-tertiary/50 border border-theme-primary rounded-lg p-4 space-y-3">
            <h4 className="text-lg font-bold text-accent-yellow-light">
              Spellbook ({data.spellSelection.spellbook?.length || 0} / 6 selected)
            </h4>
            <p className="text-xs text-theme-muted">
              Choose 6 1st-level spells for your permanent spellbook. You can prepare a subset of these each day.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableSpells.map((spell) => {
                const isSelected = data.spellSelection.spellbook?.includes(spell.slug) || false;
                const canSelect = (data.spellSelection.spellbook?.length || 0) < 6;

                return (
                  <button
                    key={spell.slug}
                    onClick={() => handleSpellToggle(spell.slug, 'spellbook')}
                    disabled={!isSelected && !canSelect}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      isSelected
                        ? 'bg-blue-900 border-blue-500'
                        : canSelect
                        ? 'bg-theme-tertiary border-theme-primary hover:border-blue-400'
                        : 'bg-theme-secondary border-theme-secondary opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-white">{spell.name}</div>
                        <div className="text-xs text-purple-300">{spell.school}</div>
                      </div>
                      {isSelected && <Check className="w-5 h-5 text-accent-green-light" />}
                    </div>
                    <div className="text-xs text-theme-muted mt-2 line-clamp-2">
                      {spell.description}
                    </div>
                    <div className="text-xs text-theme-disabled mt-1">
                      {spell.castingTime} • {spell.range}
                      {spell.concentration && ' • Concentration'}
                      {spell.ritual && ' • Ritual'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Wizard Daily Preparation Section */}
          <div className="bg-theme-tertiary/50 border border-theme-primary rounded-lg p-4 space-y-3">
            <h4 className="text-lg font-bold text-accent-yellow-light">
              Daily Preparation ({data.spellSelection.dailyPrepared?.length || 0} / {Math.max(1, Math.floor((data.abilities.INT - 10) / 2) + 1)} selected)
            </h4>
            <p className="text-xs text-theme-muted">
              Choose spells to prepare for today from your spellbook. You can change this after a long rest.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(data.spellSelection.spellbook || []).map((spellSlug) => {
                const spell = availableSpells.find(s => s.slug === spellSlug);
                if (!spell) return null;

                const isSelected = data.spellSelection.dailyPrepared?.includes(spell.slug) || false;
                const maxPrepared = Math.max(1, Math.floor((data.abilities.INT - 10) / 2) + 1);
                const canSelect = (data.spellSelection.dailyPrepared?.length || 0) < maxPrepared;

                return (
                  <button
                    key={spell.slug}
                    onClick={() => handleSpellToggle(spell.slug, 'dailyPrepared')}
                    disabled={!isSelected && !canSelect}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      isSelected
                        ? 'bg-green-900 border-green-500'
                        : canSelect
                        ? 'bg-theme-tertiary border-theme-primary hover:border-green-400'
                        : 'bg-theme-secondary border-theme-secondary opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-white">{spell.name}</div>
                        <div className="text-xs text-purple-300">{spell.school}</div>
                      </div>
                      {isSelected && <Check className="w-5 h-5 text-accent-green-light" />}
                    </div>
                    <div className="text-xs text-theme-muted mt-2 line-clamp-2">
                      {spell.description}
                    </div>
                    <div className="text-xs text-theme-disabled mt-1">
                      {spell.castingTime} • {spell.range}
                      {spell.concentration && ' • Concentration'}
                      {spell.ritual && ' • Ritual'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {spellcastingType === 'known' && (
        <div className="bg-theme-tertiary/50 border border-theme-primary rounded-lg p-4 space-y-3">
          <h4 className="text-lg font-bold text-accent-yellow-light">
            Spells Known ({data.spellSelection.knownSpells?.length || 0} / {spellcasting.spellsKnownOrPrepared} selected)
          </h4>
          <p className="text-xs text-theme-muted">
            These are the spells your character knows permanently. You can change them when you level up.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableSpells.map((spell) => {
              const isSelected = data.spellSelection.knownSpells?.includes(spell.slug) || false;
              const canSelect = (data.spellSelection.knownSpells?.length || 0) < spellcasting.spellsKnownOrPrepared;

              return (
                <button
                  key={spell.slug}
                  onClick={() => handleSpellToggle(spell.slug, 'knownSpells')}
                  disabled={!isSelected && !canSelect}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    isSelected
                      ? 'bg-blue-900 border-blue-500'
                      : canSelect
                      ? 'bg-theme-tertiary border-theme-primary hover:border-blue-400'
                      : 'bg-theme-secondary border-theme-secondary opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-white">{spell.name}</div>
                      <div className="text-xs text-purple-300">{spell.school}</div>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-accent-green-light" />}
                  </div>
                  <div className="text-xs text-theme-muted mt-2 line-clamp-2">
                    {spell.description}
                  </div>
                  <div className="text-xs text-theme-disabled mt-1">
                    {spell.castingTime} • {spell.range}
                    {spell.concentration && ' • Concentration'}
                    {spell.ritual && ' • Ritual'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {spellcastingType === 'prepared' && (
        <div className="bg-theme-tertiary/50 border border-theme-primary rounded-lg p-4 space-y-3">
          <h4 className="text-lg font-bold text-accent-yellow-light">
            Prepared Spells ({data.spellSelection.preparedSpells?.length || 0} / {spellcasting.spellsKnownOrPrepared} selected)
          </h4>
          <p className="text-xs text-theme-muted">
            Choose spells to prepare. You can change your prepared spells after a long rest.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableSpells.map((spell) => {
              const isSelected = data.spellSelection.preparedSpells?.includes(spell.slug) || false;
              const canSelect = (data.spellSelection.preparedSpells?.length || 0) < spellcasting.spellsKnownOrPrepared;

              return (
                <button
                  key={spell.slug}
                  onClick={() => handleSpellToggle(spell.slug, 'preparedSpells')}
                  disabled={!isSelected && !canSelect}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    isSelected
                      ? 'bg-blue-900 border-blue-500'
                      : canSelect
                      ? 'bg-theme-tertiary border-theme-primary hover:border-blue-400'
                      : 'bg-theme-secondary border-theme-secondary opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-white">{spell.name}</div>
                      <div className="text-xs text-purple-300">{spell.school}</div>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-accent-green-light" />}
                  </div>
                  <div className="text-xs text-theme-muted mt-2 line-clamp-2">
                    {spell.description}
                  </div>
                  <div className="text-xs text-theme-disabled mt-1">
                    {spell.castingTime} • {spell.range}
                    {spell.concentration && ' • Concentration'}
                    {spell.ritual && ' • Ritual'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className='flex justify-between'>
        <button onClick={prevStep} className='px-4 py-2 bg-theme-quaternary text-white rounded-lg hover:bg-theme-hover flex items-center gap-2'>
          <ArrowLeft className='w-4 h-4' />
          Back
        </button>
        <button
          onClick={nextStep}
          disabled={!allSelectionsComplete}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            allSelectionsComplete
              ? 'bg-accent-red-dark text-white hover:bg-accent-red'
              : 'bg-theme-tertiary text-theme-disabled cursor-not-allowed'
          }`}
        >
          Next: {getNextStepLabel?.() || 'Continue'}
          <ArrowRight className='w-4 h-4' />
        </button>
      </div>
    </div>
  );
};
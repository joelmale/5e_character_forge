import React, { useRef, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Check, Shuffle } from 'lucide-react';
import { StepProps } from '../types/wizard.types';
import { loadClasses, getCantripsByClass, getLeveledSpellsByClass, AppSpell } from '../../../services/dataService';
import {
  getSpellcastingType,
  cleanupInvalidSpellSelections,
  getAvailableSpellLevels,
  getMaxPreparedSpells
} from '../../../utils/spellUtils';
import cantripsData from '../../../data/cantrips.json';

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
     
    return <div className='text-center text-theme-muted'>This class doesn't have spells available at level {data.level}. Advancing...</div>;
  }

  const spellcasting = selectedClass.spellcasting!;
  const spellcastingType = getSpellcastingType(selectedClass.slug);
  const availableCantrips = getCantripsByClass(data.classSlug);

  // Get all available spell levels based on character level
  const availableSpellLevels = getAvailableSpellLevels(data.classSlug, data.level);

  // Get all spells from available levels
  const availableSpells: AppSpell[] = availableSpellLevels.flatMap(level =>
    getLeveledSpellsByClass(data.classSlug, level)
  );

  // Calculate level-aware cantrip and spell counts
  let cantripsKnownAtLevel = (cantripsData as Record<string, Record<string, number>>)[data.classSlug]?.[data.level] || spellcasting.cantripsKnown;

  // 2024 Cleric Thaumaturge gets +1 cantrip
  if (data.classSlug === 'cleric' && data.edition === '2024' && data.divineOrder === 'thaumaturge') {
    cantripsKnownAtLevel += 1;
  }

  // 2024 Druid Magician gets +1 cantrip
  if (data.classSlug === 'druid' && data.edition === '2024' && data.primalOrder === 'magician') {
    cantripsKnownAtLevel += 1;
  }

  // For prepared casters (Cleric, Druid, Paladin), calculate max prepared spells
  const maxPreparedSpellsAtLevel = spellcastingType === 'prepared'
    ? getMaxPreparedSpells(data.abilities, spellcasting.ability, data.level)
    : spellcasting.spellsKnownOrPrepared;

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
    } else if (current.length < cantripsKnownAtLevel) {
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

    // Determine max count based on field and spell type
    const maxCount = (field === 'preparedSpells' || field === 'knownSpells') ? maxPreparedSpellsAtLevel : spellcasting.spellsKnownOrPrepared;

    if (isSelected) {
      // Deselect
      updateData({
        spellSelection: {
          ...data.spellSelection,
          [field]: current.filter(s => s !== spellSlug),
        },
      });
    } else if (current.length < maxCount) {
      // Select (if under limit)
      updateData({
        spellSelection: {
          ...data.spellSelection,
          [field]: [...current, spellSlug],
        },
      });
    }
  };

  const cantripsComplete = data.spellSelection.selectedCantrips.length === cantripsKnownAtLevel;

  let spellsComplete = false;
  if (spellcastingType === 'known') {
    spellsComplete = (data.spellSelection.knownSpells?.length || 0) === maxPreparedSpellsAtLevel;
  } else if (spellcastingType === 'prepared') {
    spellsComplete = (data.spellSelection.preparedSpells?.length || 0) === maxPreparedSpellsAtLevel;
  } else if (spellcastingType === 'wizard') {
    const spellbookComplete = (data.spellSelection.spellbook?.length || 0) === 6;
    const dailyPreparedMax = getMaxPreparedSpells(data.abilities, 'INT', data.level);
    const dailyComplete = (data.spellSelection.dailyPrepared?.length || 0) === dailyPreparedMax;
    spellsComplete = spellbookComplete && dailyComplete;
  }

  const allSelectionsComplete = cantripsComplete && spellsComplete;

  // Debug logging for spell selection validation
  console.log('🧙 [Step4Spells] Validation Check:', {
    class: data.classSlug,
    level: data.level,
    spellcastingType,
    cantrips: {
      selected: data.spellSelection.selectedCantrips.length,
      required: cantripsKnownAtLevel,
      complete: cantripsComplete
    },
    spells: {
      type: spellcastingType,
      ...(spellcastingType === 'wizard' && {
        spellbook: {
          selected: data.spellSelection.spellbook?.length || 0,
          required: 6,
          complete: (data.spellSelection.spellbook?.length || 0) === 6
        },
        dailyPrepared: {
          selected: data.spellSelection.dailyPrepared?.length || 0,
          required: getMaxPreparedSpells(data.abilities, 'INT', data.level),
          complete: spellsComplete && cantripsComplete
        }
      }),
      ...(spellcastingType === 'known' && {
        knownSpells: {
          selected: data.spellSelection.knownSpells?.length || 0,
          required: maxPreparedSpellsAtLevel,
          complete: spellsComplete
        }
      }),
      ...(spellcastingType === 'prepared' && {
        preparedSpells: {
          selected: data.spellSelection.preparedSpells?.length || 0,
          required: maxPreparedSpellsAtLevel,
          complete: spellsComplete
        }
      })
    },
    allSelectionsComplete
  });

  // Generate validation feedback messages
  const getValidationMessages = (): string[] => {
    const messages: string[] = [];

    // Check cantrips
    if (!cantripsComplete) {
      const remaining = cantripsKnownAtLevel - data.spellSelection.selectedCantrips.length;
      messages.push(`Pick ${remaining} more cantrip${remaining !== 1 ? 's' : ''}`);
    }

    // Check spells based on type
    if (spellcastingType === 'known') {
      if (!spellsComplete) {
        const current = data.spellSelection.knownSpells?.length || 0;
        const remaining = maxPreparedSpellsAtLevel - current;
        messages.push(`Select ${remaining} more known spell${remaining !== 1 ? 's' : ''}`);
      }
    } else if (spellcastingType === 'prepared') {
      if (!spellsComplete) {
        const current = data.spellSelection.preparedSpells?.length || 0;
        const remaining = maxPreparedSpellsAtLevel - current;
        messages.push(`Select ${remaining} more prepared spell${remaining !== 1 ? 's' : ''}`);
      }
    } else if (spellcastingType === 'wizard') {
      const spellbookCurrent = data.spellSelection.spellbook?.length || 0;
      const spellbookRequired = 6;
      if (spellbookCurrent < spellbookRequired) {
        const remaining = spellbookRequired - spellbookCurrent;
        messages.push(`Add ${remaining} more spell${remaining !== 1 ? 's' : ''} to spellbook`);
      }

      const dailyPreparedMax = getMaxPreparedSpells(data.abilities, 'INT', data.level);
      const dailyPreparedCurrent = data.spellSelection.dailyPrepared?.length || 0;
      if (dailyPreparedCurrent < dailyPreparedMax) {
        const remaining = dailyPreparedMax - dailyPreparedCurrent;
        messages.push(`Prepare ${remaining} more daily spell${remaining !== 1 ? 's' : ''}`);
      }
    }

    return messages;
  };

  const validationMessages = getValidationMessages();

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
          Cantrips ({data.spellSelection.selectedCantrips.length} / {cantripsKnownAtLevel} selected)
        </h4>
        <p className="text-xs text-theme-muted">
          Cantrips are 0-level spells that can be cast at will, without expending spell slots.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {availableCantrips.map((spell) => {
            const isSelected = data.spellSelection.selectedCantrips.includes(spell.slug);
            const canSelect = data.spellSelection.selectedCantrips.length < cantripsKnownAtLevel;

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
              Daily Preparation ({data.spellSelection.dailyPrepared?.length || 0} / {getMaxPreparedSpells(data.abilities, 'INT', data.level)} selected)
            </h4>
            <p className="text-xs text-theme-muted">
              Choose spells to prepare for today from your spellbook. You can change this after a long rest.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(data.spellSelection.spellbook || []).map((spellSlug) => {
                const spell = availableSpells.find(s => s.slug === spellSlug);
                if (!spell) return null;

                const isSelected = data.spellSelection.dailyPrepared?.includes(spell.slug) || false;
                const maxPrepared = getMaxPreparedSpells(data.abilities, 'INT', data.level);
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
            Spells Known ({data.spellSelection.knownSpells?.length || 0} / {maxPreparedSpellsAtLevel} selected)
          </h4>
          <p className="text-xs text-theme-muted">
            These are the spells your character knows permanently. You can change them when you level up.
          </p>

          {/* Group spells by level */}
          {availableSpellLevels.map(spellLevel => {
            const spellsOfLevel = availableSpells.filter(s => s.level === spellLevel);
            if (spellsOfLevel.length === 0) return null;

            return (
              <div key={spellLevel} className="space-y-2">
                <h5 className="text-sm font-semibold text-accent-blue-light">
                  Level {spellLevel} Spells
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {spellsOfLevel.map((spell) => {
                    const isSelected = data.spellSelection.knownSpells?.includes(spell.slug) || false;
                    const canSelect = (data.spellSelection.knownSpells?.length || 0) < maxPreparedSpellsAtLevel;

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
            );
          })}
        </div>
      )}

      {spellcastingType === 'prepared' && (
        <div className="bg-theme-tertiary/50 border border-theme-primary rounded-lg p-4 space-y-3">
          <h4 className="text-lg font-bold text-accent-yellow-light">
            Prepared Spells ({data.spellSelection.preparedSpells?.length || 0} / {maxPreparedSpellsAtLevel} selected)
          </h4>
          <p className="text-xs text-theme-muted">
            Choose spells to prepare. You can change your prepared spells after a long rest.
          </p>

          {/* Group spells by level */}
          {availableSpellLevels.map(spellLevel => {
            const spellsOfLevel = availableSpells.filter(s => s.level === spellLevel);
            if (spellsOfLevel.length === 0) return null;

            return (
              <div key={spellLevel} className="space-y-2">
                <h5 className="text-sm font-semibold text-accent-blue-light">
                  Level {spellLevel} Spells
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {spellsOfLevel.map((spell) => {
                    const isSelected = data.spellSelection.preparedSpells?.includes(spell.slug) || false;
                    const canSelect = (data.spellSelection.preparedSpells?.length || 0) < maxPreparedSpellsAtLevel;

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
            );
          })}
        </div>
      )}

      {/* Navigation */}
      <div className='space-y-2'>
        <div className='flex justify-between'>
          <button
            onClick={() => {
              console.log('🔙 [Step4Spells] Back button clicked from step 8');
              prevStep();
            }}
            className='px-4 py-2 bg-theme-quaternary text-white rounded-lg hover:bg-theme-hover flex items-center gap-2'
          >
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

        {/* Validation Feedback */}
        {!allSelectionsComplete && validationMessages.length > 0 && (
          <div className='flex justify-end'>
            <div className='text-sm text-orange-400 space-y-1'>
              {validationMessages.map((message, index) => (
                <div key={index}>• {message}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
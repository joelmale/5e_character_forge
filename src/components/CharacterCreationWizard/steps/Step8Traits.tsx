import React, { useEffect } from 'react';
import { ArrowLeft, Check, Shuffle } from 'lucide-react';
import { StepProps } from '../types/wizard.types';
import { CharacterCreationData } from '../../../types/dnd';
import { loadClasses, getModifier } from '../../../services/dataService';
import { rollDice } from '../../../services/diceService';
import { randomizePersonality, getBackgroundDefaults, validateTraits } from '../../../utils/traitUtils';

const RandomizeButton: React.FC<{ onClick: () => void; title?: string; className?: string }> = ({
  onClick,
  title = "Randomize this section",
  className = ""
}) => {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 bg-accent-purple hover:bg-accent-purple-light rounded-lg text-theme-primary text-sm font-medium transition-colors flex items-center gap-2 ${className}`}
      title={title}
    >
      <Shuffle className="w-4 h-4" />
      Randomize
    </button>
  );
};

export const Step8Traits: React.FC<StepProps & { onSubmit: (data: CharacterCreationData) => void }> = ({
  data,
  updateData,
  prevStep,
  onSubmit
}) => {
  // Set default personality traits for Outlander background
  useEffect(() => {
    const defaults = getBackgroundDefaults(data.background);
    if (defaults.personality && !data.personality) {
      updateData({ personality: defaults.personality });
    }
    if (defaults.ideals && !data.ideals) {
      updateData({ ideals: defaults.ideals });
    }
    if (defaults.bonds && !data.bonds) {
      updateData({ bonds: defaults.bonds });
    }
    if (defaults.flaws && !data.flaws) {
      updateData({ flaws: defaults.flaws });
    }
  }, [data.background, data.personality, data.ideals, data.bonds, data.flaws, updateData]);

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h3 className='text-xl font-bold text-red-300'>Final Details & Personality</h3>
        <RandomizeButton
          onClick={() => {
            const personality = randomizePersonality();
            updateData(personality);
          }}
          title="Randomize personality traits"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-theme-tertiary mb-2">
          Personality Traits
        </label>
        <textarea
          placeholder="Describe your character's personality traits and quirks..."
          value={data.personality || ''}
          onChange={(e) => updateData({ personality: e.target.value })}
          className="w-full h-20 p-3 bg-theme-tertiary text-theme-primary rounded-lg focus:ring-red-500 focus:border-red-500 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-theme-tertiary mb-2">
          Ideals
        </label>
        <textarea
          placeholder="What principles and beliefs guide your character?"
          value={data.ideals || ''}
          onChange={(e) => updateData({ ideals: e.target.value })}
          className="w-full h-16 p-3 bg-theme-tertiary text-theme-primary rounded-lg focus:ring-red-500 focus:border-red-500 resize-none"
        />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label className="block text-sm font-medium text-theme-tertiary mb-2">
            Bonds
          </label>
          <textarea
            placeholder="Who or what is your character connected to?"
            value={data.bonds || ''}
            onChange={(e) => updateData({ bonds: e.target.value })}
            className="w-full h-16 p-3 bg-theme-tertiary text-theme-primary rounded-lg focus:ring-red-500 focus:border-red-500 resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-theme-tertiary mb-2">
            Flaws
          </label>
          <textarea
            placeholder="What weaknesses does your character have?"
            value={data.flaws || ''}
            onChange={(e) => updateData({ flaws: e.target.value })}
            className="w-full h-16 p-3 bg-theme-tertiary text-theme-primary rounded-lg focus:ring-red-500 focus:border-red-500 resize-none"
          />
        </div>
      </div>

      {/* Hit Points Calculation Method */}
      {(() => {
        const allClasses = loadClasses();
        const selectedClass = allClasses.find(c => c.slug === data.classSlug);
        if (!selectedClass) return null;

        const conModifier = getModifier(data.abilities.CON);

        return (
          <div className="bg-theme-tertiary/50 border border-theme-primary rounded-lg p-4 space-y-3">
            <h4 className="text-lg font-bold text-accent-yellow-light">Starting Hit Points</h4>
            <p className="text-xs text-theme-muted">
              Choose how to determine your starting HP (at 1st level, most players take maximum).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => updateData({ hpCalculationMethod: 'max', rolledHP: undefined })}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  data.hpCalculationMethod === 'max'
                    ? 'bg-accent-blue-darker border-blue-500'
                    : 'bg-theme-tertiary border-theme-primary hover:bg-theme-quaternary'
                }`}
              >
                <div className="font-semibold text-theme-primary">Take Maximum (Recommended)</div>
                <div className="text-sm text-theme-tertiary mt-1">
                  {selectedClass.hit_die} + {conModifier} = {selectedClass.hit_die + conModifier} HP
                </div>
                <div className="text-xs text-theme-muted mt-1">Standard for 1st level characters</div>
              </button>

              <button
                onClick={() => {
                  // Roll the hit die
                  const rolled = rollDice(1, selectedClass.hit_die)[0];
                  updateData({ hpCalculationMethod: 'rolled', rolledHP: rolled });
                }}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  data.hpCalculationMethod === 'rolled'
                    ? 'bg-accent-blue-darker border-blue-500'
                    : 'bg-theme-tertiary border-theme-primary hover:bg-theme-quaternary'
                }`}
              >
                <div className="font-semibold text-theme-primary">Roll Hit Die</div>
                <div className="text-sm text-theme-tertiary mt-1">
                  {data.hpCalculationMethod === 'rolled' && data.rolledHP ? (
                    <>
                      Rolled: {data.rolledHP} + {conModifier} = {data.rolledHP + conModifier} HP
                    </>
                  ) : (
                    <>
                      1d{selectedClass.hit_die} + {conModifier}
                    </>
                  )}
                </div>
                <div className="text-xs text-theme-muted mt-1">
                  {data.hpCalculationMethod === 'rolled' ? 'Click to re-roll' : 'Click to roll'}
                </div>
              </button>
            </div>

            <div className="text-xs text-theme-disabled mt-2">
              Final HP: <span className="text-theme-primary font-bold">
                {data.hpCalculationMethod === 'max'
                  ? selectedClass.hit_die + conModifier
                  : data.rolledHP ? data.rolledHP + conModifier : 0
                } HP
              </span>
            </div>
          </div>
        );
      })()}

      <div className='flex justify-between'>
        <button onClick={prevStep} className="px-4 py-2 bg-theme-quaternary hover:bg-theme-hover rounded-lg text-theme-primary flex items-center">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </button>
        <button
          onClick={() => onSubmit(data)}
          disabled={!validateTraits(data)}
          className={`px-4 py-2 rounded-lg text-theme-primary flex items-center font-bold ${
            validateTraits(data)
              ? 'bg-accent-green hover:bg-accent-green'
              : 'bg-theme-hover cursor-not-allowed'
          }`}
        >
          Create Character <Check className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
};
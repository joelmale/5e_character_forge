/**
 * Level-Up Wizard Modal
 *
 * Guided multi-step wizard for leveling up a character.
 * Walks the player through all choices required for their new level:
 * - HP increase (roll or take average)
 * - ASI or Feat selection
 * - Subclass selection (if applicable)
 * - Spell selection (for spellcasters)
 * - Fighting style (if applicable)
 * - Feature summary
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Character } from '../../types/dnd';
import { LevelUpData } from '../../data/classProgression';
import { calculateLevelUpData, getLevelUpSteps, applyLevelUp } from '../../utils/levelUpUtils';

// Step components (to be implemented)
import { StepOverview } from './steps/StepOverview';
import { StepHP } from './steps/StepHP';
import { StepASIFeat } from './steps/StepASIFeat';
import { StepSubclass } from './steps/StepSubclass';
import { StepSpells } from './steps/StepSpells';
import { StepFightingStyle } from './steps/StepFightingStyle';
import { StepFeatures } from './steps/StepFeatures';
import { StepConfirm } from './steps/StepConfirm';

interface LevelUpWizardProps {
  isOpen: boolean;
  character: Character;
  onClose: () => void;
  onComplete: (updatedCharacter: Character) => void;
}

interface LevelUpChoices {
  hpRolled?: number;
  hpGained: number;
  asiChoices?: Array<{ ability: string; increase: number }>;
  featChosen?: string;
  subclassChosen?: string;
  spellsLearned?: string[];
  fightingStyleChosen?: string;
}

export const LevelUpWizard: React.FC<LevelUpWizardProps> = ({
  isOpen,
  character,
  onClose,
  onComplete
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [levelUpData, setLevelUpData] = useState<LevelUpData | null>(null);
  const [steps, setSteps] = useState<string[]>([]);
  const [choices, setChoices] = useState<LevelUpChoices>({
    hpGained: 0
  });

  // Calculate level-up data when wizard opens
  useEffect(() => {
    if (isOpen) {
      const data = calculateLevelUpData(character);
      if (data) {
        setLevelUpData(data);
        const wizardSteps = getLevelUpSteps(data);
        setSteps(wizardSteps);
        setCurrentStepIndex(0);
        setChoices({ hpGained: data.averageHpGain });
      }
    }
  }, [isOpen, character]);

  if (!isOpen || !levelUpData) return null;

  const currentStep = steps[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleComplete = () => {
    const updatedCharacter = applyLevelUp(character, levelUpData, choices);
    onComplete(updatedCharacter);
    onClose();
  };

  const updateChoices = (newChoices: Partial<LevelUpChoices>) => {
    setChoices({ ...choices, ...newChoices });
  };

  const renderStep = () => {
    const stepProps = {
      character,
      levelUpData,
      choices,
      updateChoices,
      onNext: handleNext,
      onPrev: handlePrev
    };

    switch (currentStep) {
      case 'overview':
        return <StepOverview {...stepProps} />;
      case 'hp':
        return <StepHP {...stepProps} />;
      case 'asi-feat':
        return <StepASIFeat {...stepProps} />;
      case 'subclass':
        return <StepSubclass {...stepProps} />;
      case 'spells':
        return <StepSpells {...stepProps} />;
      case 'fighting-style':
        return <StepFightingStyle {...stepProps} />;
      case 'features':
        return <StepFeatures {...stepProps} />;
      case 'confirm':
        return <StepConfirm {...stepProps} onComplete={handleComplete} />;
      default:
        return <div>Unknown step</div>;
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <div
        className="relative z-10 bg-theme-secondary bg-opacity-100 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.9)] w-full max-w-3xl transition-all transform duration-300 scale-100 my-8 flex flex-col max-h-[calc(100vh-4rem)] pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 p-6 md:p-8 pb-4 border-b border-theme-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-accent-gold">Level Up!</h2>
              <p className="text-theme-text-secondary mt-1">
                {character.name} - Level {levelUpData.fromLevel} → {levelUpData.toLevel}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-theme-text-secondary hover:text-theme-text transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-theme-text-secondary mb-2">
              <span>Step {currentStepIndex + 1} of {steps.length}</span>
              <span className="capitalize">{currentStep.replace('-', ' ')}</span>
            </div>
            <div className="w-full bg-theme-primary rounded-full h-2">
              <div
                className="bg-accent-gold rounded-full h-2 transition-all duration-300"
                style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {renderStep()}
        </div>
      </div>
    </div>,
    document.body
  );
};

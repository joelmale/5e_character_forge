import { useCallback } from 'react';
import { CharacterCreationData } from '../../../types/dnd';
import { STEP_TITLES } from '../constants/wizard.constants';
import { hasSpellcastingAtLevel } from '../../../utils/spellUtils';
import { calculateFeatAvailability } from '../../../utils/featUtils';

export const useWizardNavigation = (
  currentStep: number,
  setCurrentStep: (step: number) => void,
  creationData: CharacterCreationData
) => {
  const nextStep = useCallback(() => {
    let nextStepIndex = currentStep + 1;

    // Skip conditional steps based on character data
    while (nextStepIndex < STEP_TITLES.length) {
      if (shouldShowStep(nextStepIndex, creationData)) {
        break;
      }
      nextStepIndex++;
    }

    setCurrentStep(Math.min(nextStepIndex, STEP_TITLES.length - 1));
  }, [currentStep, setCurrentStep, creationData]);

  const prevStep = useCallback(() => {
    let prevStepIndex = currentStep - 1;

    // Skip conditional steps going backwards
    while (prevStepIndex >= 0) {
      if (shouldShowStep(prevStepIndex, creationData)) {
        break;
      }
      prevStepIndex--;
    }

    setCurrentStep(Math.max(prevStepIndex, 0));
  }, [currentStep, setCurrentStep, creationData]);

  const skipToStep = useCallback((step: number) => {
    // Find the next valid step from the target step
    let targetStep = step;
    while (targetStep < STEP_TITLES.length && !shouldShowStep(targetStep, creationData)) {
      targetStep++;
    }

    setCurrentStep(Math.min(Math.max(targetStep, 0), STEP_TITLES.length - 1));
  }, [setCurrentStep, creationData]);

  const getNextStepLabel = useCallback(() => {
    let nextStepIndex = currentStep + 1;

    // Find the next visible step
    while (nextStepIndex < STEP_TITLES.length) {
      if (shouldShowStep(nextStepIndex, creationData)) {
        let label = STEP_TITLES[nextStepIndex].split(':')[0].trim(); // Get the main title

        // Make labels level-aware
        if (nextStepIndex === 3) { // Class & Subclass step
          if (creationData.level >= 3) {
            label = 'Choose Class & Subclass';
          } else {
            label = 'Choose Class';
          }
        }

        return label;
      }
      nextStepIndex++;
    }

    return 'Complete';
  }, [currentStep, creationData]);

  return { nextStep, prevStep, skipToStep, getNextStepLabel };
};

// Helper function to determine if a step should be shown
const shouldShowStep = (stepIndex: number, data: CharacterCreationData): boolean => {
  switch (stepIndex) {
    case 0: // Character Level - always show
    case 1: // Character Details - always show
    case 2: // Choose Race - always show
    case 3: // Choose Class & Subclass - always show (but subclass UI is conditional)
      return true;

    case 4: // Determine Abilities - always show
      return true;

    case 5: // High-Level Setup - only for level 2+ characters
      return data.level >= 2;

    case 6: // Ability Score Improvements - only for level 4+ characters
      return data.level >= 4;

    case 7: // Choose Fighting Style - only for Fighter/Paladin/Ranger at level 2+
      return ['fighter', 'paladin', 'ranger'].includes(data.classSlug) && data.level >= 2;

    case 8: // Select Spells - only for spellcasters at appropriate level
      return hasSpellcastingAtLevel(data.classSlug, data.level);

    case 9: // Choose Feats - only when character qualifies (level 4+)
      return calculateFeatAvailability(data.level) > 0;

    case 10: // Select Languages - always show
      return true;

    case 11: // Select Equipment - always show
      return true;

    case 12: // Customize Equipment - always show (can be skipped)
      return true;

    case 13: // Finalize Background - always show
      return true;

    default:
      return true;
  }
};
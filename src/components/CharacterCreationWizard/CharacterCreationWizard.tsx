import React from 'react';
import { WizardProps } from './types/wizard.types';
import { useWizardState, useWizardNavigation } from './hooks';
import { WizardHeader, WizardProgressBar, WizardStepContainer } from './components';
import {
  Step0Level,
  Step1Details,
  Step2Race,
  Step3Class,
  Step3point5FightingStyle,
  Step4Spells,
  Step4Abilities,
  Step5point5Feats,
  Step6Equipment,
  Step7EquipmentBrowser,
  Step8Traits,
  Step9Languages
} from './steps';

export const CharacterCreationWizard: React.FC<WizardProps> = ({
  isOpen,
  onClose,
  onCharacterCreated
}) => {
  const {
    currentStep,
    setCurrentStep,
    creationData,
    updateData,
    error,
    setError
  } = useWizardState();

  const { nextStep, prevStep, skipToStep, getNextStepLabel } = useWizardNavigation(currentStep, setCurrentStep, creationData);

  if (!isOpen) return null;

  const handleSubmit = async (data: typeof creationData) => {
    try {
      // Clear any previous errors
      setError(null);

      // Import required functions
      const { calculateCharacterStats } = await import('../../utils/characterCreationUtils');
      const { addCharacter } = await import('../../services/dbService');
      const { generateUUID } = await import('../../services/diceService');

      // Convert creation data to full character object
      const character = calculateCharacterStats(data);

      // Add unique ID
      const characterWithId = {
        ...character,
        id: generateUUID()
      };

      // Save to database
      await addCharacter(characterWithId);

      // Notify parent component to refresh character list
      onCharacterCreated();

      // Close wizard
      onClose();
    } catch (error) {
      console.error('Error creating character:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred while creating the character.');
    }
  };

  const renderStep = () => {
    const commonProps = { data: creationData, updateData, nextStep, prevStep, stepIndex: currentStep, getNextStepLabel };

    switch (currentStep) {
      case 0: return <Step0Level {...commonProps} />;
      case 1: return <Step1Details {...commonProps} />;
      case 2: return <Step2Race {...commonProps} />;
      case 3: return <Step3Class {...commonProps} />;
      case 4: return <Step3point5FightingStyle {...commonProps} />;
      case 5: return <Step4Spells {...commonProps} />;
      case 6: return <Step4Abilities {...commonProps} />;
      case 7: return <Step5point5Feats {...commonProps} />;
      case 8: return <Step9Languages {...commonProps} />;
      case 9: return <Step6Equipment {...commonProps} skipToStep={skipToStep} />;
      case 10: return <Step7EquipmentBrowser {...commonProps} skipToStep={skipToStep} />;
      case 11: return <Step8Traits {...commonProps} onSubmit={() => handleSubmit(creationData)} />;
      default: return <div>Unknown step</div>;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl transition-all transform duration-300 scale-100 my-8 flex flex-col max-h-[calc(100vh-4rem)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header */}
        <div className="flex-shrink-0 p-6 md:p-8 pb-4">
          <WizardHeader currentStep={currentStep} onClose={onClose} />
          <WizardProgressBar currentStep={currentStep} />
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex-shrink-0 mx-6 md:mx-8 mb-4">
            <div className="bg-red-900 border border-red-700 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-200">
                    Character Creation Error
                  </h3>
                  <div className="mt-2 text-sm text-red-300">
                    <p>{error}</p>
                  </div>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={() => setError(null)}
                    className="inline-flex rounded-md bg-red-900 p-1.5 text-red-400 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Content */}
        <WizardStepContainer>
          {/* Wizard Content */}
          {renderStep()}
        </WizardStepContainer>
      </div>
    </div>
  );
};
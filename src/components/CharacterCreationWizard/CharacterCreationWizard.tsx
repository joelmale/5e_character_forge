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
    updateData
  } = useWizardState();

  const { nextStep, prevStep, skipToStep, getNextStepLabel } = useWizardNavigation(currentStep, setCurrentStep, creationData);

  if (!isOpen) return null;

  const handleSubmit = async (data: typeof creationData) => {
    try {
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
      // TODO: Add error handling UI
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

        {/* Scrollable Content */}
        <WizardStepContainer>
          {/* Wizard Content */}
          {renderStep()}
        </WizardStepContainer>
      </div>
    </div>
  );
};
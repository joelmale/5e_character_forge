import { useState, useCallback } from 'react';
import { CharacterCreationData } from '../../../types/dnd';
import { initialCreationData } from '../constants/wizard.constants';

export const useWizardState = () => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [creationData, setCreationData] = useState<CharacterCreationData>(initialCreationData);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const updateData = useCallback((updates: Partial<CharacterCreationData>) => {
    setCreationData(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    currentStep,
    setCurrentStep,
    creationData,
    updateData,
    isLoading,
    setIsLoading,
    error,
    setError
  };
};
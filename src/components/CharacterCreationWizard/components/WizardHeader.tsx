import React from 'react';
import { Dice6 } from 'lucide-react';
import { STEP_TITLES } from '../constants/wizard.constants';

interface WizardHeaderProps {
  currentStep: number;
  onClose: () => void;
}

export const WizardHeader: React.FC<WizardHeaderProps> = ({ currentStep, onClose }) => {
  return (
    <div className="flex justify-between items-center border-b border-accent-red-dark pb-3">
      <h2 className="text-2xl font-bold text-red-500 flex items-center">
        <Dice6 className="w-6 h-6 mr-2" /> {STEP_TITLES[currentStep]}
      </h2>
      <button onClick={onClose} className="text-theme-muted hover:text-white text-xl font-bold">&times;</button>
    </div>
  );
};
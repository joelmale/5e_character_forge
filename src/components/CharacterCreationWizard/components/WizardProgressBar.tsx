import React from 'react';
import { STEP_TITLES } from '../constants/wizard.constants';

interface WizardProgressBarProps {
  currentStep: number;
}

export const WizardProgressBar: React.FC<WizardProgressBarProps> = ({ currentStep }) => {
  return (
    <div className='mt-4'>
      <div className='h-2 bg-gray-700 rounded-full overflow-hidden'>
        <div
          className='h-full bg-red-600 transition-all duration-500'
          style={{ width: `${((currentStep + 1) / STEP_TITLES.length) * 100}%` }}
        />
      </div>
      <p className='text-center text-sm text-gray-400 mt-2'>Step {currentStep + 1} of {STEP_TITLES.length}</p>
    </div>
  );
};
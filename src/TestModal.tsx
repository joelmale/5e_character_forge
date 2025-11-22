import React, { useState } from 'react';
import RacialTraitModal from './components/RacialTraitModal';

const TestModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [trait] = useState('Darkvision');
  const [race] = useState('Elf');

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Racial Trait Modal Test</h1>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-accent-blue text-white rounded hover:bg-accent-blue-light"
      >
        Open Modal
      </button>

      <RacialTraitModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        traitName={trait}
        raceName={race}
      />
    </div>
  );
};

export default TestModal;
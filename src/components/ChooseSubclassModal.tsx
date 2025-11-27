import React from 'react';
import { AppSubclass } from '../services/dataService';

interface ChooseSubclassModalProps {
  isOpen: boolean;
  onClose: () => void;
  subclasses: AppSubclass[];
  onSelect: (subclass: AppSubclass) => void;
  characterClass: string;
}

const ChooseSubclassModal: React.FC<ChooseSubclassModalProps> = ({
  isOpen,
  onClose,
  subclasses,
  onSelect,
  characterClass,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-md flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Choose a {characterClass} Subclass</h2>
        <div className="grid grid-cols-1 gap-4">
          {subclasses.map(subclass => (
            <div key={subclass.slug} className="border p-4 rounded-lg hover:bg-gray-100 cursor-pointer" onClick={() => onSelect(subclass)}>
              <h3 className="text-lg font-semibold">{subclass.name}</h3>
               <p className="text-sm text-gray-600">{subclass.desc ? subclass.desc.join(' ') : 'No description available'}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChooseSubclassModal;

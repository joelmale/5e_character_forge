import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
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
  const [expandedSubclass, setExpandedSubclass] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-md flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Choose a {characterClass} Subclass</h2>
        <div className="grid grid-cols-1 gap-4">
          {subclasses.map(subclass => (
            <div key={subclass.slug} className="border border-gray-300 rounded-lg overflow-hidden">
              {/* Header - Clickable */}
              <div
                className="p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                onClick={() => setExpandedSubclass(
                  expandedSubclass === subclass.slug ? null : subclass.slug
                )}
              >
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{subclass.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {subclass.desc && subclass.desc.length > 0 ? subclass.desc[0] : 'Click to see details'}
                  </p>
                </div>
                <div className="ml-4">
                  {expandedSubclass === subclass.slug ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedSubclass === subclass.slug && (
                <div className="px-4 pb-4 border-t border-gray-200 bg-gray-50">
                  <div className="pt-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Features & Benefits:</h4>
                    <div className="space-y-3 text-sm text-gray-700">
                      {subclass.desc && subclass.desc.length > 1 ? (
                        subclass.desc.slice(1).map((desc, index) => (
                          <p key={index} className="leading-relaxed">{desc}</p>
                        ))
                      ) : (
                        <p className="text-gray-500 italic">Detailed feature information not available.</p>
                      )}
                    </div>

                    {/* Select Button */}
                    <div className="mt-4 pt-4 border-t border-gray-300">
                      <button
                        onClick={() => onSelect(subclass)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        Choose {subclass.name}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChooseSubclassModal;

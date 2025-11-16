import React from 'react';
import { ArrowLeft, ArrowRight, Shuffle, ChevronDown } from 'lucide-react';
import { StepProps } from '../types/wizard.types';
import { EquipmentPackage } from '../../../types/dnd';
import { loadClasses, BACKGROUNDS, EQUIPMENT_PACKAGES } from '../../../services/dataService';
import { validateEquipmentChoices } from '../../../utils/equipmentSelectionUtils';

interface EquipmentPackDisplayProps {
  pack: EquipmentPackage;
  isSelected?: boolean;
  onClick?: () => void;
  showRecommendation?: boolean;
  characterClass?: string;
}

const EquipmentPackDisplay: React.FC<EquipmentPackDisplayProps> = ({
  pack,
  isSelected = false,
  onClick,
  showRecommendation = false,
  characterClass
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const isRecommended = characterClass && pack.recommendedFor?.includes(characterClass);

  return (
    <div className={`border-2 rounded-lg transition-all ${
      isSelected
        ? 'bg-blue-800 border-blue-500'
        : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
    }`}>
      <button
        onClick={onClick}
        className="w-full p-3 text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-white font-medium">{pack.name}</span>
            {pack.startingGold && pack.startingGold > 0 && (
              <span className="text-yellow-400 text-sm">({pack.startingGold} gp)</span>
            )}
            {showRecommendation && isRecommended && (
              <span className="px-2 py-1 text-xs bg-green-700 text-green-200 rounded">
                Recommended
              </span>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-1 hover:bg-gray-600 rounded"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 border-t border-gray-600 mt-2 pt-2">
          <div className="text-xs text-gray-400 mb-2">Contents:</div>
          <ul className="text-sm space-y-1">
            {pack.items.map((item, idx) => (
              <li key={idx} className="flex items-center justify-between">
                <span className="text-gray-300">
                  • {item.name}
                  {item.quantity > 1 && <span className="text-gray-400 ml-1">x{item.quantity}</span>}
                </span>
                {item.equipped && (
                  <span className="text-xs text-green-400">(equipped)</span>
                )}
              </li>
            ))}
          </ul>
          {pack.description && (
            <p className="text-xs text-gray-500 mt-2 italic">{pack.description}</p>
          )}
        </div>
      )}
    </div>
  );
};

const RandomizeButton: React.FC<{ onClick: () => void; title?: string; className?: string }> = ({
  onClick,
  title = "Randomize this section",
  className = ""
}) => {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-2 ${className}`}
      title={title}
    >
      <Shuffle className="w-4 h-4" />
      Randomize
    </button>
  );
};

export const Step6Equipment: React.FC<StepProps & { skipToStep?: (step: number) => void }> = ({
  data,
  updateData,
  nextStep,
  prevStep,
  skipToStep,
  getNextStepLabel
}) => {
  const allClasses = loadClasses();
  const selectedClass = allClasses.find(c => c.slug === data.classSlug);

  if (!selectedClass) {
    return <div>Loading...</div>;
  }

  // Initialize equipment choices if not already set
  const equipmentChoices = data.equipmentChoices || [];
  if (equipmentChoices.length === 0 && Array.isArray(selectedClass.equipment_choices) && selectedClass.equipment_choices.length > 0) {
    updateData({ equipmentChoices: selectedClass.equipment_choices });
  }

  const handleEquipmentChoice = (choiceId: string, optionIndex: number) => {
    const currentChoices = data.equipmentChoices || [];
    const updatedChoices = currentChoices.map(choice =>
      choice.choiceId === choiceId ? { ...choice, selected: optionIndex } : choice
    );
    updateData({ equipmentChoices: updatedChoices });
  };

  const allChoicesMade = validateEquipmentChoices(data.equipmentChoices || []);

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-start'>
        <div className='flex-1'>
          <h3 className='text-xl font-bold text-red-300'>Select Starting Equipment</h3>
          <p className="text-sm text-gray-400 mt-1">
            Choose your starting equipment based on your class. Your background will also grant additional items.
          </p>
        </div>
        <RandomizeButton
          onClick={() => {
            // Randomize equipment choices - this would need implementation

          }}
          title="Randomize equipment choices"
        />
      </div>

      {/* Equipment Choices */}
      {(data.equipmentChoices || []).map((choice, idx) => (
        <div key={choice.choiceId} className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 space-y-3">
          <h4 className="font-semibold text-yellow-300">
            {idx + 1}. {choice.description}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {choice.options.map((option, optionIdx) => {
              // Check if this option contains an equipment pack
              const packOption = option.find(item =>
                EQUIPMENT_PACKAGES.some(pack => pack.name === item.name)
              );
              const pack = packOption ? EQUIPMENT_PACKAGES.find(p => p.name === packOption.name) : null;

              if (pack) {
                // Display as expandable pack
                return (
                  <EquipmentPackDisplay
                    key={optionIdx}
                    pack={pack}
                    isSelected={choice.selected === optionIdx}
                    onClick={() => handleEquipmentChoice(choice.choiceId, optionIdx)}
                    showRecommendation={true}
                    characterClass={data.classSlug}
                  />
                );
              } else {
                // Display as regular equipment option
                return (
                  <button
                    key={optionIdx}
                    onClick={() => handleEquipmentChoice(choice.choiceId, optionIdx)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      choice.selected === optionIdx
                        ? 'bg-blue-800 border-blue-500'
                        : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                    }`}
                  >
                    <div className="space-y-1">
                      {option.map((item, itemIdx) => (
                        <div key={itemIdx} className="text-sm">
                          <span className="text-white font-medium">{item.name}</span>
                          {item.quantity > 1 && (
                            <span className="text-gray-400 ml-1">x{item.quantity}</span>
                          )}
                          {item.weight && item.weight > 0 && (
                            <span className="text-gray-500 text-xs ml-2">({item.weight} lb)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </button>
                );
              }
            })}
          </div>
        </div>
      ))}

      {/* Background Equipment Info */}
      {(() => {
        const backgroundData = BACKGROUNDS.find(bg => bg.name === data.background);
        if (backgroundData?.equipment) {
          return (
            <div className="p-3 bg-green-900/20 border border-green-700 rounded-lg">
              <div className="text-xs font-semibold text-green-400 mb-2">
                Background Equipment (Auto-granted from {data.background}):
              </div>
              <div className="space-y-1">
                {Array.isArray(backgroundData.equipment)
                  ? backgroundData.equipment.map((item, index) => (
                    <div key={index} className="text-sm text-gray-300">• {item}</div>
                  ))
                  : <p className="text-sm text-gray-300">{backgroundData.equipment}</p>
                }
              </div>
            </div>
          );
        }
        return null;
      })()}

      {!allChoicesMade && (
        <div className="text-xs text-yellow-400">
          ⚠️ Please make all equipment choices before continuing
        </div>
      )}

      <div className='flex justify-between items-center gap-3'>
        <button onClick={prevStep} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white flex items-center">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </button>
        <button
          onClick={nextStep}
          disabled={!allChoicesMade}
          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg text-white flex items-center disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {getNextStepLabel?.() || 'Continue'} <ArrowRight className="w-4 h-4 ml-2" />
        </button>
        <button
          onClick={() => {
            // Skip custom equipment step, go directly to traits (step 11)
            if (allChoicesMade && skipToStep) {
              skipToStep(11); // Skip to Traits/Final details step
            }
          }}
          disabled={!allChoicesMade}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white flex items-center disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          Skip to Traits <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
};
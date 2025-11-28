import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Shuffle } from 'lucide-react';
import { StepProps } from '../types/wizard.types';
import { FEAT_DATABASE, randomizeFeats } from '../../../services/dataService';
import {
  calculateFeatAvailability,
  filterAvailableFeats,
  featProvidesAbilityIncrease,
  getFeatSourceInfo,
  canSelectMoreFeats,
  checkFeatPrerequisites
} from '../../../utils/featUtils';
import { FeatChoiceModal } from '../components';

const RandomizeButton: React.FC<{ onClick: () => void; title?: string; className?: string }> = ({
  onClick,
  title = "Randomize this section",
  className = ""
}) => {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 bg-accent-purple hover:bg-accent-purple-light rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-2 ${className}`}
      title={title}
    >
      <Shuffle className="w-4 h-4" />
      Randomize
    </button>
  );
};

export const Step5point5Feats: React.FC<StepProps> = ({ data, updateData, nextStep, prevStep, getNextStepLabel }) => {
  const [showFeatDetails, setShowFeatDetails] = useState<string | null>(null);
  const [featChoiceModal, setFeatChoiceModal] = useState<{ isOpen: boolean; feat: any }>({ isOpen: false, feat: null });

  // Calculate how many feats the character can take
  const maxFeats = calculateFeatAvailability(data.level);
  const selectedFeats = data.selectedFeats || [];

  // Get all feats and their eligibility status
  const allFeats = FEAT_DATABASE.map(feat => ({
    feat,
    isAvailable: checkFeatPrerequisites(feat, data),
    requirements: feat.prerequisite ? getPrerequisiteDescription(feat.prerequisite) : null
  }));

  const featRequiresChoices = (featSlug: string): boolean => {
    return ['elemental-adept', 'metamagic-adept', 'lightly-armored', 'moderately-armored'].includes(featSlug);
  };

  const getPrerequisiteDescription = (prerequisite: string): string => {
    // Convert technical prerequisite text to user-friendly descriptions
    const lower = prerequisite.toLowerCase();

    // Ability scores
    if (lower.includes('strength')) return prerequisite.replace(' or higher', '+');
    if (lower.includes('dexterity')) return prerequisite.replace(' or higher', '+');
    if (lower.includes('constitution')) return prerequisite.replace(' or higher', '+');
    if (lower.includes('intelligence')) return prerequisite.replace(' or higher', '+');
    if (lower.includes('wisdom')) return prerequisite.replace(' or higher', '+');
    if (lower.includes('charisma')) return prerequisite.replace(' or higher', '+');

    // Races
    if (lower.includes('halfling')) return 'Halfling';
    if (lower.includes('dragonborn')) return 'Dragonborn';
    if (lower.includes('dwarf')) return 'Dwarf';
    if (lower.includes('elf')) return 'Elf';
    if (lower.includes('tiefling')) return 'Tiefling';
    if (lower.includes('gnome')) return 'Gnome';
    if (lower.includes('half-elf')) return 'Half-Elf';
    if (lower.includes('half-orc')) return 'Half-Orc';
    if (lower.includes('human')) return 'Human';

    // Spellcasting
    if (lower.includes('spellcasting') || lower.includes('ability to cast')) return 'Spellcasting class';

    // Proficiencies
    if (lower.includes('proficiency with light armor')) return 'Light armor proficiency';
    if (lower.includes('proficiency with medium armor')) return 'Medium armor proficiency';
    if (lower.includes('proficiency with heavy armor')) return 'Heavy armor proficiency';
    if (lower.includes('proficiency with a martial weapon')) return 'Martial weapon proficiency';

    return prerequisite; // Fallback to original text
  };

  const handleFeatToggle = (featSlug: string) => {
    const isSelected = selectedFeats.includes(featSlug);

    if (isSelected) {
      // Deselect
      updateData({
        selectedFeats: selectedFeats.filter(s => s !== featSlug)
      });
    } else if (canSelectMoreFeats(selectedFeats, data.level)) {
      // Check if feat requires additional choices
      if (featRequiresChoices(featSlug)) {
        // For feats that require choices, we need to get the feat data
        const featData = allFeats.find(f => f.feat.slug === featSlug);
        if (featData && featData.feat) {
          setFeatChoiceModal({ isOpen: true, feat: featData.feat });
        } else {
          // Fallback: select directly if feat not found
          updateData({
            selectedFeats: [...selectedFeats, featSlug]
          });
        }
      } else {
        // Select directly
        updateData({
          selectedFeats: [...selectedFeats, featSlug]
        });
      }
    }
  };

  const handleFeatChoiceConfirm = (choices: Record<string, any>) => {
    if (!featChoiceModal.feat) return;

    // Store the choices in the character data
    const featChoices = data.featChoices || {};
    featChoices[featChoiceModal.feat.slug] = choices;

    updateData({
      selectedFeats: [...selectedFeats, featChoiceModal.feat.slug],
      featChoices
    });
  };

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-start'>
        <div className='flex-1'>
          <h3 className='text-xl font-bold text-red-300'>Choose Feats (Optional)</h3>
          <p className='text-sm text-theme-muted mt-2'>
            Feats represent special talents or areas of expertise. At certain levels, you can choose to take a feat instead of an Ability Score Improvement.
          </p>
          <div className="mt-2 p-3 bg-blue-900/30 border border-accent-blue-dark rounded-lg">
            <div className="text-sm text-blue-300">
              <strong>Level {data.level}:</strong> You can select up to {maxFeats} feat{maxFeats !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="text-xs text-theme-muted mt-1">
            ℹ️ Feats are optional. You can also choose Ability Score Improvements at these levels.
          </div>
        </div>
        <RandomizeButton
          onClick={() => {
            const feats = randomizeFeats();
            updateData({ selectedFeats: feats });
          }}
          title="Randomize feat selection"
        />
      </div>

      {selectedFeats.length > 0 && (
        <div className="bg-accent-green-darker/20 border border-accent-green-dark rounded-lg p-3">
          <div className="text-sm font-semibold text-accent-green-light mb-2">
            Selected Feats ({selectedFeats.length} / {maxFeats}):
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedFeats.map(slug => {
              const feat = FEAT_DATABASE.find(f => f.slug === slug);
              return (
                <span key={slug} className="px-2 py-1 bg-accent-green-dark text-white text-xs rounded">
                  {feat?.name}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {maxFeats > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-2">
          {allFeats.map(({ feat, isAvailable, requirements }) => {
            const isSelected = selectedFeats.includes(feat.slug);
            const canSelect = canSelectMoreFeats(selectedFeats, data.level) && isAvailable;

            return (
              <div key={feat.slug} className="relative">
                <button
                  onClick={() => handleFeatToggle(feat.slug)}
                  disabled={(!canSelect && !isSelected) || !isAvailable}
                  className={`w-full p-3 rounded-lg text-left border-2 transition-all ${
                    isSelected
                      ? 'bg-green-800 border-green-500 shadow-md'
                      : isAvailable && canSelect
                      ? 'bg-theme-tertiary border-theme-primary hover:bg-theme-quaternary'
                      : isAvailable
                      ? 'bg-theme-secondary border-theme-secondary text-theme-disabled cursor-not-allowed'
                      : 'bg-gray-800 border-gray-600 text-gray-500 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <p className={`text-sm font-bold ${isAvailable ? 'text-accent-yellow-light' : 'text-gray-400'}`}>
                      {feat.name}
                    </p>
                    {featProvidesAbilityIncrease(feat) && (
                      <span className="text-xs bg-accent-blue text-white px-1 py-0.5 rounded ml-2">
                        +ASI
                      </span>
                    )}
                  </div>
                  <p className={`text-xs mt-1 ${isAvailable ? 'text-theme-disabled' : 'text-gray-500'}`}>
                    {getFeatSourceInfo(feat)}
                  </p>
                  {requirements && !isAvailable && (
                    <p className="text-xs text-red-400 mt-1">
                      Requires: {requirements}
                    </p>
                  )}
                  {feat.prerequisite && isAvailable && (
                    <p className="text-xs text-accent-yellow-light mt-1">
                      Requires: {feat.prerequisite}
                    </p>
                  )}
                  <p className={`text-xs mt-2 line-clamp-2 ${isAvailable ? 'text-theme-muted' : 'text-gray-500'}`}>
                    {feat.description}
                  </p>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFeatDetails(showFeatDetails === feat.slug ? null : feat.slug);
                  }}
                  className="absolute top-2 right-2 text-xs text-accent-blue-light hover:text-blue-300"
                  title="View details"
                >
                  {showFeatDetails === feat.slug ? '✕' : 'ℹ️'}
                </button>
                {showFeatDetails === feat.slug && (
                  <div className="absolute z-10 mt-2 p-3 bg-theme-primary border border-theme-primary rounded-lg shadow-xl w-80 left-0">
                    <h5 className="font-bold text-accent-yellow-light text-sm mb-2">{feat.name}</h5>
                    <p className="text-xs text-theme-tertiary mb-2">{feat.description}</p>
                    <div className="text-xs text-theme-muted">
                      <strong className="text-theme-tertiary">Benefits:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        {feat.benefits.map((benefit, idx) => (
                          <li key={idx}>{benefit}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {maxFeats === 0 && (
        <div className="text-center text-theme-muted py-8">
          <p>Feats become available starting at level 4.</p>
          <p className="text-sm mt-2">Your character is currently level {data.level}.</p>
        </div>
      )}

      <div className='flex justify-between'>
        <button onClick={prevStep} className="px-4 py-2 bg-theme-quaternary hover:bg-theme-hover rounded-lg text-white flex items-center">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </button>
        <button
          onClick={nextStep}
          className="px-4 py-2 bg-accent-red hover:bg-accent-red-light rounded-lg text-white flex items-center"
        >
          Next: {getNextStepLabel?.() || 'Continue'} <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>

      <FeatChoiceModal
        isOpen={featChoiceModal.isOpen}
        onClose={() => setFeatChoiceModal({ isOpen: false, feat: null })}
        feat={featChoiceModal.feat}
        onConfirm={handleFeatChoiceConfirm}
      />
    </div>
  );
};
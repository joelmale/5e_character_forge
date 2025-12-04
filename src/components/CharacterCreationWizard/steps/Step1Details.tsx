import React, { useState } from 'react';
import { XCircle, ArrowLeft, Shuffle } from 'lucide-react';
import { StepProps } from '../types/wizard.types';
import { ALIGNMENTS_DATA, BACKGROUNDS, ALIGNMENTS, randomizeIdentity, randomizeSpecies, randomizeClassAndSkills, randomizeFightingStyle, randomizeSpells, randomizeAbilities, randomizeFeats, randomizeLanguages, randomizePersonality, randomizeStartingEquipment, randomizeBackgroundAbilityChoices } from '../../../services/dataService';
import { generateName } from '../../../utils/nameGenerator';

import { BackgroundASIWidget, SmartNavigationButton } from '../components';
import { useStepValidation } from '../hooks';
import { useToast } from '../../../hooks';
import Toast from '../../Toast';

interface RandomizeButtonProps {
  onClick: () => void;
  title: string;
}

interface RandomizeAllButtonProps {
  onClick: () => void;
  className?: string;
}

const RandomizeButton: React.FC<RandomizeButtonProps> = ({ onClick, title }) => (
  <button
    onClick={onClick}
    title={title}
    className="p-2 bg-accent-yellow-dark hover:bg-accent-yellow rounded-lg text-white transition-colors"
  >
    <Shuffle className="w-4 h-4" />
  </button>
);

const RandomizeAllButton: React.FC<RandomizeAllButtonProps> = ({
  onClick,
  className = ""
}) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg text-white font-bold transition-all flex items-center gap-2 shadow-lg ${className}`}
      title="Randomize the entire character"
    >
      <Shuffle className="w-5 h-5" />
      Randomize Everything
    </button>
  );
};



export const Step1Details: React.FC<StepProps> = ({ data, updateData, nextStep, prevStep, getNextStepLabel }) => {
  const [showAlignmentInfo, setShowAlignmentInfo] = useState(true);
  const [showBackgroundInfo, setShowBackgroundInfo] = useState(true);
  const [showDetailedDescription, setShowDetailedDescription] = useState(false);
  const { toasts, showSuccess, removeToast } = useToast();

  const selectedAlignmentData = ALIGNMENTS_DATA.find(a => a.name === data.alignment);
  const selectedBackground = BACKGROUNDS.find(bg => bg.slug === data.background);
  const backgroundDescription = selectedBackground
    ? selectedBackground.details
      || selectedBackground.detailedDescription
      || selectedBackground.description
      || ''
    : '';
  const isLongDescription = backgroundDescription.length > 220;

  // Validation hook
  const { canProceed, missingItems, nextAction } = useStepValidation(1, data);



  return (
    <div className='space-y-4'>
      <div className='flex justify-between items-center'>
        <h3 className='text-xl font-bold text-red-300'>Basic Identity</h3>
        <div className='flex gap-2'>
          <RandomizeButton
            onClick={() => {
              const { alignment, background } = randomizeIdentity();
              updateData({ alignment, background });
            }}
            title="Randomize alignment and background"
          />
            <RandomizeAllButton
              onClick={() => {
                // Randomize the entire character (preserve the selected level)
                const level = data.level;
                const species = randomizeSpecies();
                const identity = randomizeIdentity(species);
                const backgroundSlug = identity.backgroundSlug || identity.background;
                const classAndSkills = randomizeClassAndSkills();
                const fightingStyle = randomizeFightingStyle(classAndSkills.classSlug);
                const spells = randomizeSpells(classAndSkills.classSlug, level);
                const abilities = randomizeAbilities();
                const feats = randomizeFeats();
                const backgroundASI = randomizeBackgroundAbilityChoices(backgroundSlug, data.edition);
                const equipment = randomizeStartingEquipment(classAndSkills.classSlug, backgroundSlug, data.edition);
                const languages = randomizeLanguages(species, backgroundSlug, data.edition, abilities.abilities);
                const personality = randomizePersonality();
                const generatedName = generateName({
                  race: species,
                  classSlug: classAndSkills.classSlug
                }).name;

                updateData({
                  alignment: identity.alignment,
                  background: backgroundSlug,
                  name: generatedName,
                  speciesSlug: species,
                  ...classAndSkills,
                  selectedFightingStyle: fightingStyle,
                  spellSelection: spells,
                  ...abilities,
                  backgroundAbilityChoices: backgroundASI,
                  selectedFeats: feats,
                  equipmentChoices: equipment.equipmentChoices,
                  equipmentChoice: equipment.equipmentChoice,
                  equipmentGold: equipment.equipmentGold,
                  startingInventory: equipment.startingInventory,
                  knownLanguages: languages,
                  ...personality
                });
                showSuccess('Character fully randomized (background ASI, gear, languages, spells, and stats).');
              }}
            />
        </div>
      </div>
      

      <div>
        <label className="block text-sm font-medium text-theme-tertiary mb-2">Alignment</label>
        <select
          value={data.alignment}
          onChange={(e) => updateData({ alignment: e.target.value })}
          className="w-full p-3 bg-theme-tertiary text-white rounded-lg focus:ring-red-500 focus:border-red-500"
        >
          <option value="">Select Alignment</option>
          {ALIGNMENTS.map(alignment => (
            <option key={alignment} value={alignment}>{alignment}</option>
          ))}
        </select>
      </div>

      {selectedAlignmentData && showAlignmentInfo && (
        <div className="bg-theme-tertiary/50 border border-theme-primary rounded-lg p-4 space-y-3 relative">
          <button
            onClick={() => setShowAlignmentInfo(false)}
            className="absolute top-2 right-2 text-theme-muted hover:text-white transition-colors"
            title="Close"
          >
            <XCircle className="w-5 h-5" />
          </button>

          <h4 className="text-lg font-bold text-accent-yellow-light">{selectedAlignmentData.name}</h4>
          <p className="text-sm text-theme-tertiary mb-3">{selectedAlignmentData.long_desc || selectedAlignmentData.short_desc}</p>

          {selectedAlignmentData.examples && selectedAlignmentData.examples.length > 0 && (
            <div className="mb-3">
              <h5 className="text-sm font-semibold text-yellow-200 mb-2">Examples:</h5>
              <ul className="text-xs text-theme-tertiary space-y-1">
                {selectedAlignmentData.examples.map((example, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-accent-yellow-light mr-2">•</span>
                    <span>{example}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-xs text-theme-muted border-t border-theme-primary pt-2">
            <span className="font-semibold">Category:</span> {selectedAlignmentData.category}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-theme-tertiary mb-2">Background</label>
        <select
          value={data.background}
          onChange={(e) => updateData({ background: e.target.value })}
          className="w-full p-3 bg-theme-tertiary text-white rounded-lg focus:ring-red-500 focus:border-red-500"
        >
          <option value="">Select Background</option>
           {BACKGROUNDS.filter(bg => bg.edition === data.edition).map(bg => (
            <option key={bg.slug} value={bg.slug}>{bg.name}</option>
          ))}
        </select>
      </div>

      {/* 2024 Background Ability Score Selection */}
      {data.edition === '2024' && selectedBackground?.abilityScores && (
        <BackgroundASIWidget
          availableOptions={selectedBackground.abilityScores.from as import('../../../types/dnd').AbilityName[]}
          data={data}
          updateData={updateData}
        />
      )}
      {selectedBackground && showBackgroundInfo && (
        <div className="bg-theme-tertiary/50 border border-theme-primary rounded-lg p-4 space-y-4 relative max-h-[70vh] overflow-y-auto">
          <button
            onClick={() => setShowBackgroundInfo(false)}
            className="absolute top-2 right-2 text-theme-muted hover:text-white transition-colors"
            title="Close"
          >
            <XCircle className="w-5 h-5" />
          </button>

          <div>
            <h4 className="text-lg font-bold text-accent-yellow-light">{selectedBackground.name}</h4>
            <div className="text-sm text-theme-tertiary mt-2">
              <p className={isLongDescription && !showDetailedDescription ? 'line-clamp-2' : ''}>
                {backgroundDescription}
              </p>
              {isLongDescription && (
                <button
                  onClick={() => setShowDetailedDescription(!showDetailedDescription)}
                  className="text-accent-blue-light hover:text-blue-300 text-xs mt-1 underline"
                >
                  {showDetailedDescription ? 'Show Less' : 'Read More'}
                </button>
              )}
            </div>
          </div>

          {/* 2024 Origin Feat */}
          {selectedBackground.edition === '2024' && selectedBackground.originFeat && (
            <div className="border-t border-theme-primary pt-3">
               <div className="flex items-center gap-2 mb-2">
                 <h5 className="text-sm font-semibold text-yellow-200">Origin Feat: {selectedBackground.originFeat}</h5>
               </div>
              <p className="text-xs text-theme-tertiary">
                This feat is granted at 1st level by your background.
              </p>
            </div>
          )}

          {/* Skill Proficiencies */}
          <div className="border-t border-theme-primary pt-3">
            <h5 className="text-sm font-semibold text-yellow-200 mb-2">Skill Proficiencies</h5>
            <div className="flex flex-wrap gap-2">
               {selectedBackground.skill_proficiencies.map(skill => (
                 <span key={skill} className="px-2 py-1 bg-blue-700 text-white text-xs rounded">
                   {skill}
                 </span>
               ))}
            </div>
          </div>

          {/* Tool Proficiencies */}
          {selectedBackground.tool_proficiencies && selectedBackground.tool_proficiencies.length > 0 && (
            <div className="border-t border-theme-primary pt-3">
              <h5 className="text-sm font-semibold text-yellow-200 mb-2">Tool Proficiencies</h5>
              <div className="flex flex-wrap gap-2">
                {selectedBackground.tool_proficiencies.map((tool: string) => (
                  <span key={tool} className="px-2 py-1 bg-purple-700 text-white text-xs rounded">
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {selectedBackground.languages && selectedBackground.languages.length > 0 && (
            <div className="border-t border-theme-primary pt-3">
              <h5 className="text-sm font-semibold text-yellow-200 mb-2">Languages</h5>
              <div className="flex flex-wrap gap-2">
                {selectedBackground.languages.map(language => (
                  <span key={language} className="px-2 py-1 bg-accent-green-dark text-white text-xs rounded">
                    {language}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Equipment */}
          {/* Equipment Options */}
          {selectedBackground.equipmentOptions && selectedBackground.equipmentOptions.length > 0 && (
            <div className="border-t border-theme-primary pt-3 space-y-3">
              <h5 className="text-sm font-semibold text-yellow-200">Starting Equipment</h5>
              <div className="text-xs text-theme-tertiary space-y-2">
                {selectedBackground.equipmentOptions.map((opt) => (
                  <div key={opt.label} className="bg-theme-quaternary/40 border border-theme-primary rounded p-2">
                    <div className="text-theme-tertiary font-semibold mb-1">Option {opt.label}</div>
                    {opt.items && (
                      <ul className="space-y-1">
                        {opt.items.map((item: string) => (
                          <li key={item} className="flex items-start">
                            <span className="text-accent-yellow-light mr-2">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {typeof opt.gold === 'number' && (
                      <div className="text-accent-yellow-light">Gold: {opt.gold} gp</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className='flex justify-between'>
        <button
          onClick={prevStep}
          className="px-4 py-2 bg-theme-quaternary hover:bg-theme-hover rounded-lg text-white flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Level
        </button>

        <SmartNavigationButton
          canProceed={canProceed}
          missingItems={missingItems}
          nextAction={nextAction}
          onClick={nextStep}
          variant="next"
        >
          Next: {getNextStepLabel?.() || 'Continue'}
        </SmartNavigationButton>
      </div>

      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}

    </div>
  );
};

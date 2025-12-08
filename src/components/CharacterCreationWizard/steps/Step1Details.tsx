import React, { useState } from 'react';
import { XCircle, ArrowLeft, Shuffle } from 'lucide-react';
import { StepProps } from '../types/wizard.types';
import { ALIGNMENTS_DATA, BACKGROUNDS, ALIGNMENTS, randomizeIdentity, randomizeSpecies, randomizeClassAndSkills, randomizeFightingStyle, randomizeSpells, randomizeAbilities, randomizeFeats, randomizeLanguages, randomizePersonality, randomizeStartingEquipment, randomizeBackgroundAbilityChoices } from '../../../services/dataService';
import { generateName } from '../../../utils/nameGenerator';
import skillsData from '../../../data/skills.json';

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



interface ProficiencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  ability?: string;
}

const ProficiencyModal: React.FC<ProficiencyModalProps> = ({ isOpen, onClose, title, description, ability }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-theme-tertiary border border-theme-primary rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-accent-yellow-light">{title}</h3>
          <button
            onClick={onClose}
            className="text-theme-muted hover:text-white transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        {ability && (
          <p className="text-sm text-theme-tertiary mb-2">
            <span className="font-semibold">Ability:</span> {ability}
          </p>
        )}
        <p className="text-sm text-theme-tertiary">{description}</p>
      </div>
    </div>
  );
};

export const Step1Details: React.FC<StepProps> = ({ data, updateData, nextStep, prevStep, getNextStepLabel }) => {
  const [showAlignmentInfo, setShowAlignmentInfo] = useState(true);
  const [showBackgroundInfo, setShowBackgroundInfo] = useState(true);
  const [showDetailedDescription, setShowDetailedDescription] = useState(false);
  const [proficiencyModal, setProficiencyModal] = useState<{ isOpen: boolean; title: string; description: string; ability?: string }>({
    isOpen: false,
    title: '',
    description: '',
    ability: undefined
  });
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

  const getSkillDescription = (skillName: string) => {
    const skill = skillsData.find(s => s.name === skillName);
    return skill ? { description: skill.description, ability: skill.ability } : { description: 'No description available.', ability: undefined };
  };

  const getToolDescription = (toolName: string) => {
    // Simple descriptions for common tools
    const toolDescriptions: Record<string, string> = {
      "Thieves' tools": "This set of tools includes a small file, a set of lock picks, a small mirror mounted on a metal handle, a set of narrow-bladed scissors, and a pair of pliers. Proficiency with these tools lets you add your proficiency bonus to any ability check you make to disarm traps or open locks.",
      "Artisan's tools": "These special tools include the items needed to pursue a craft or trade. Proficiency with a set of artisan's tools lets you add your proficiency bonus to any ability check you make using the tools in your craft.",
      "Navigator's tools": "This set of instruments is used for navigation at sea. Proficiency with navigator's tools lets you chart a ship's course and follow navigation charts.",
      "Disguise kit": "This pouch of cosmetics, hair dye, and small props lets you create disguises that change your physical appearance.",
      "Forgery kit": "This small box contains a variety of papers and parchments, pens and inks, seals and sealing wax, gold and silver leaf, and other supplies necessary to create convincing forgeries of physical documents.",
      "Herbalism kit": "This kit contains a variety of instruments such as clippers, mortar and pestle, and pouches and vials used by herbalists to create remedies and potions.",
      "Poisoner's kit": "A poisoner's kit includes the vials, chemicals, and other equipment necessary for the creation of poisons.",
      "Alchemist's supplies": "These special tools include alchemical equipment for creating alchemical items.",
      "Brewer's supplies": "These tools include a large pot, strainer, and several barrels for brewing ale and other beverages.",
      "Calligrapher's supplies": "These tools include special inks, quills, and parchment for creating beautiful handwriting.",
      "Carpenter's tools": "These tools include a saw, hammer, nails, and other basic woodworking equipment.",
      "Cartographer's supplies": "These tools include a quill, ink, parchment, a pair of compasses, a ruler, and a surveying chain.",
      "Cobbler's tools": "These tools include a hammer, awl, knife, and other leatherworking implements.",
      "Cook's utensils": "These tools include a knife, pot, pan, and other cooking implements.",
      "Glassblower's tools": "These tools include a blowpipe, small marver, blocks, and tweezers for shaping molten glass.",
      "Jeweler's tools": "These tools include small pliers, cutters, files, and magnifying lenses for working with precious metals and gems.",
      "Leatherworker's tools": "These tools include a knife, needles, thread, and other leatherworking implements.",
      "Mason's tools": "These tools include a chisel, hammer, and other stoneworking implements.",
      "Painter's supplies": "These tools include brushes, pigments, canvas, and other painting implements.",
      "Potter's tools": "These tools include a potter's wheel, clay, and other pottery-making implements.",
      "Smith's tools": "These tools include a hammer, tongs, bellows, and other metalworking implements.",
      "Tinker's tools": "These tools include wire, solder, small tools, and other tinkering implements.",
      "Weaver's tools": "These tools include a loom, shuttles, and other weaving implements.",
      "Woodcarver's tools": "These tools include a knife, chisels, and other woodcarving implements.",
      "Gaming set": "This set of dice, cards, or other gaming pieces is used for games of chance.",
      "Musical instrument": "This instrument produces music when played. Proficiency with a musical instrument lets you add your proficiency bonus to any ability check you make to play music with the instrument."
    };

    return toolDescriptions[toolName] || 'This tool proficiency allows you to use specialized equipment for specific tasks.';
  };

  const openProficiencyModal = (name: string, type: 'skill' | 'tool') => {
    if (type === 'skill') {
      const { description, ability } = getSkillDescription(name);
      setProficiencyModal({ isOpen: true, title: name, description, ability });
    } else {
      const description = getToolDescription(name);
      setProficiencyModal({ isOpen: true, title: name, description });
    }
  };



  return (
    <div className='space-y-4'>
      <div className='flex justify-between items-center'>
        <h3 className='text-xl font-bold text-red-300'>Basic Identity</h3>
        <div className='flex gap-2'>
          <RandomizeButton
            onClick={() => {
              const identity = randomizeIdentity();
              const backgroundSlug = identity.backgroundSlug || identity.background;
              const backgroundASI = randomizeBackgroundAbilityChoices(backgroundSlug, data.edition);
              updateData({ alignment: identity.alignment, background: backgroundSlug, backgroundAbilityChoices: backgroundASI });
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
                 <button
                   key={skill}
                   onClick={() => openProficiencyModal(skill, 'skill')}
                   className="px-2 py-1 bg-blue-700 hover:bg-blue-600 text-white text-xs rounded cursor-pointer transition-colors"
                   title={`Click to see ${skill} description`}
                 >
                   {skill}
                 </button>
               ))}
             </div>
          </div>

          {/* Tool Proficiencies */}
          {selectedBackground.tool_proficiencies && selectedBackground.tool_proficiencies.length > 0 && (
            <div className="border-t border-theme-primary pt-3">
              <h5 className="text-sm font-semibold text-yellow-200 mb-2">Tool Proficiencies</h5>
              <div className="flex flex-wrap gap-2">
                {selectedBackground.tool_proficiencies.map((tool: string) => (
                  <button
                    key={tool}
                    onClick={() => openProficiencyModal(tool, 'tool')}
                    className="px-2 py-1 bg-purple-700 hover:bg-purple-600 text-white text-xs rounded cursor-pointer transition-colors"
                    title={`Click to see ${tool} description`}
                  >
                    {tool}
                  </button>
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

      <ProficiencyModal
        isOpen={proficiencyModal.isOpen}
        onClose={() => setProficiencyModal({ ...proficiencyModal, isOpen: false })}
        title={proficiencyModal.title}
        description={proficiencyModal.description}
        ability={proficiencyModal.ability}
      />

    </div>
  );
};

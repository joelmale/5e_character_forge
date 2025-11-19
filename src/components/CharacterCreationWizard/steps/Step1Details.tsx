import React, { useState } from 'react';
import { XCircle, Shuffle } from 'lucide-react';
import { StepProps } from '../types/wizard.types';
import { ALIGNMENTS_DATA, BACKGROUNDS, ALIGNMENTS, randomizeIdentity, randomizeRace, randomizeClassAndSkills, randomizeFightingStyle, randomizeSpells, randomizeAbilities, randomizeFeats, randomizeEquipmentChoices, randomizeAdditionalEquipment, randomizeLanguages, randomizePersonality } from '../../../services/dataService';

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
    className="p-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg text-white transition-colors"
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

export const Step1Details: React.FC<StepProps> = ({ data, updateData, nextStep, getNextStepLabel }) => {
  const [showAlignmentInfo, setShowAlignmentInfo] = useState(true);
  const [showBackgroundInfo, setShowBackgroundInfo] = useState(true);

  const selectedAlignmentData = ALIGNMENTS_DATA.find(a => a.name === data.alignment);
  const selectedBackground = BACKGROUNDS.find(bg => bg.name === data.background);

  return (
    <div className='space-y-4'>
      <div className='flex justify-between items-center'>
        <h3 className='text-xl font-bold text-red-300'>Basic Identity</h3>
        <div className='flex gap-2'>
          <RandomizeButton
            onClick={() => {
              const identity = randomizeIdentity();
              updateData(identity);
            }}
            title="Randomize name, alignment, and background"
          />
            <RandomizeAllButton
              onClick={() => {
                // Randomize the entire character (preserve the selected level)
                const level = data.level;
                const identity = randomizeIdentity();
                const race = randomizeRace();
                const classAndSkills = randomizeClassAndSkills();
                const fightingStyle = randomizeFightingStyle(classAndSkills.classSlug);
                const spells = randomizeSpells(classAndSkills.classSlug, level);
                const abilities = randomizeAbilities();
                const feats = randomizeFeats();
                const equipmentChoices = randomizeEquipmentChoices(classAndSkills.classSlug);
                const additionalEquipment = randomizeAdditionalEquipment();
                const languages = randomizeLanguages(race, identity.background);
                const personality = randomizePersonality();

                updateData({
                  ...identity,
                  raceSlug: race,
                  ...classAndSkills,
                  selectedFightingStyle: fightingStyle,
                  spellSelection: spells,
                  ...abilities,
                  selectedFeats: feats,
                  equipmentChoices,
                  startingInventory: additionalEquipment,
                  knownLanguages: languages,
                  ...personality
                });
              }}
          />
        </div>
      </div>

      <input
        type="text"
        placeholder="Character Name (e.g., Elara Windwalker)"
        value={data.name}
        onChange={(e) => updateData({ name: e.target.value })}
        className="w-full p-3 bg-gray-700 text-white rounded-lg focus:ring-red-500 focus:border-red-500"
      />

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Alignment</label>
        <select
          value={data.alignment}
          onChange={(e) => updateData({ alignment: e.target.value })}
          className="w-full p-3 bg-gray-700 text-white rounded-lg focus:ring-red-500 focus:border-red-500"
        >
          <option value="">Select Alignment</option>
          {ALIGNMENTS.map(alignment => (
            <option key={alignment} value={alignment}>{alignment}</option>
          ))}
        </select>
      </div>

      {selectedAlignmentData && showAlignmentInfo && (
        <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 space-y-3 relative">
          <button
            onClick={() => setShowAlignmentInfo(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
            title="Close"
          >
            <XCircle className="w-5 h-5" />
          </button>

          <h4 className="text-lg font-bold text-yellow-300">{selectedAlignmentData.name}</h4>
          <p className="text-sm text-gray-300 mb-3">{selectedAlignmentData.long_desc || selectedAlignmentData.short_desc}</p>

          {selectedAlignmentData.examples && selectedAlignmentData.examples.length > 0 && (
            <div className="mb-3">
              <h5 className="text-sm font-semibold text-yellow-200 mb-2">Examples:</h5>
              <ul className="text-xs text-gray-300 space-y-1">
                {selectedAlignmentData.examples.map((example, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-yellow-400 mr-2">•</span>
                    <span>{example}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-xs text-gray-400 border-t border-gray-600 pt-2">
            <span className="font-semibold">Category:</span> {selectedAlignmentData.category}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Background</label>
        <select
          value={data.background}
          onChange={(e) => updateData({ background: e.target.value })}
          className="w-full p-3 bg-gray-700 text-white rounded-lg focus:ring-red-500 focus:border-red-500"
        >
          <option value="">Select Background</option>
          {BACKGROUNDS.map(bg => (
            <option key={bg.name} value={bg.name}>{bg.name}</option>
          ))}
        </select>
      </div>

      {selectedBackground && showBackgroundInfo && (
        <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 space-y-4 relative max-h-[70vh] overflow-y-auto">
          <button
            onClick={() => setShowBackgroundInfo(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
            title="Close"
          >
            <XCircle className="w-5 h-5" />
          </button>

          <div>
            <h4 className="text-lg font-bold text-yellow-300">{selectedBackground.name}</h4>
            <p className="text-sm text-gray-300 mt-2">{selectedBackground.description}</p>
          </div>

          {/* Feature */}
          <div className="border-t border-gray-600 pt-3">
            <h5 className="text-sm font-semibold text-yellow-200 mb-2">Background Feature: {selectedBackground.feature}</h5>
            <p className="text-xs text-gray-300">{selectedBackground.feature_description}</p>
          </div>

          {/* Skill Proficiencies */}
          <div className="border-t border-gray-600 pt-3">
            <h5 className="text-sm font-semibold text-yellow-200 mb-2">Skill Proficiencies</h5>
            <div className="flex flex-wrap gap-2">
              {selectedBackground.skill_proficiencies.map(skill => (
                <span key={skill} className="px-2 py-1 bg-blue-700 text-white text-xs rounded">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Languages */}
          {selectedBackground.languages && selectedBackground.languages.length > 0 && (
            <div className="border-t border-gray-600 pt-3">
              <h5 className="text-sm font-semibold text-yellow-200 mb-2">Languages</h5>
              <div className="flex flex-wrap gap-2">
                {selectedBackground.languages.map(language => (
                  <span key={language} className="px-2 py-1 bg-green-700 text-white text-xs rounded">
                    {language}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Equipment */}
          <div className="border-t border-gray-600 pt-3">
            <h5 className="text-sm font-semibold text-yellow-200 mb-2">Starting Equipment</h5>
            <ul className="text-xs text-gray-300 space-y-1">
              {selectedBackground.equipment.map(item => (
                <li key={item} className="flex items-start">
                  <span className="text-yellow-400 mr-2">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <button
        onClick={nextStep}
        disabled={!data.name || !data.alignment || !data.background}
        className="w-full py-3 bg-red-600 hover:bg-red-500 rounded-xl text-white font-bold transition-colors disabled:bg-gray-600"
      >
        Next: {getNextStepLabel?.() || 'Continue'}
      </button>
    </div>
  );
};
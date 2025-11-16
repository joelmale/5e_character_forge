import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, ChevronUp, ChevronDown, Shuffle } from 'lucide-react';
import { StepProps } from '../types/wizard.types';
import { BACKGROUNDS, randomizeLanguages } from '../../../services/dataService';
import {
  getMaxLanguages,
  parseBackgroundLanguageChoices,
  getRacialLanguages,
  getClassLanguages
} from '../../../utils/languageUtils';
import { getLanguagesByCategory } from '../../../data/languages';

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

export const Step9Languages: React.FC<StepProps> = ({ data, updateData, nextStep, prevStep, getNextStepLabel }) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Standard']));
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(data.knownLanguages || []);

  // Sync local state with parent data
  useEffect(() => {
    setSelectedLanguages(data.knownLanguages || []);
  }, [data.knownLanguages]);

  // Calculate auto-included languages
  const autoLanguages = new Set<string>();
  autoLanguages.add('Common'); // Always included

  // Add racial languages
  getRacialLanguages(data.raceSlug).forEach((lang: string) => autoLanguages.add(lang));

  // Add class languages
  getClassLanguages(data.classSlug).forEach((lang: string) => autoLanguages.add(lang));

  // Get background language choices
  const background = BACKGROUNDS.find(bg => bg.name === data.background);
  const backgroundChoices = background ? parseBackgroundLanguageChoices(background.languages || []) : { direct: [], choices: 0 };

  // Add direct background languages
  backgroundChoices.direct.forEach((lang: string) => autoLanguages.add(lang));

  // Calculate remaining language slots
  const intelligenceScore = data.abilities.INT;
  const maxLanguages = getMaxLanguages(intelligenceScore);
  const totalAvailableSlots = maxLanguages + backgroundChoices.choices;
  const remainingSlots = Math.max(0, totalAvailableSlots - selectedLanguages.length);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  const handleLanguageToggle = (languageName: string) => {
    setSelectedLanguages(prev => {
      const newSelected = prev.includes(languageName)
        ? prev.filter(lang => lang !== languageName)
        : [...prev, languageName];

      // Update the data
      updateData({ knownLanguages: newSelected });
      return newSelected;
    });
  };

  // Validation for required background language selections
  const hasRequiredBackgroundSelections = selectedLanguages.length >= backgroundChoices.choices;

  const languageCategories = [
    { name: 'Standard' as const, icon: '🏛️', description: 'Common languages of major civilizations' },
    { name: 'Exotic' as const, icon: '✨', description: 'Rare and mystical languages' },
    { name: 'Secret' as const, icon: '🔒', description: 'Hidden languages of specific groups' },
    { name: 'Dialect' as const, icon: '💬', description: 'Specialized dialects and elemental tongues' }
  ];

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h3 className='text-xl font-bold text-red-300'>Select Languages</h3>
        <RandomizeButton
          onClick={() => {
            const languages = randomizeLanguages(data.raceSlug, data.background);
            updateData({ knownLanguages: languages });
            setSelectedLanguages(languages);
          }}
          title="Randomize language selection"
        />
      </div>

      {/* Language Limits Info */}
      <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
        <h4 className="text-lg font-bold text-yellow-300 mb-2">Language Proficiency</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-300">Intelligence Score:</span>
            <span className="text-white font-bold ml-2">{intelligenceScore}</span>
          </div>
          <div>
            <span className="text-gray-300">Maximum Languages:</span>
            <span className="text-white font-bold ml-2">{maxLanguages}</span>
          </div>
          <div>
            <span className="text-gray-300">Languages Known:</span>
            <span className="text-white font-bold ml-2">{autoLanguages.size + selectedLanguages.length}</span>
          </div>
          <div>
            <span className="text-gray-300">Remaining Slots:</span>
            <span className={`font-bold ml-2 ${remainingSlots > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {remainingSlots}
            </span>
          </div>
        </div>
      </div>

      {/* Auto-Included Languages */}
      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
        <h4 className="text-lg font-bold text-blue-300 mb-3">Auto-Included Languages</h4>
        <p className="text-sm text-gray-400 mb-3">
          These languages are automatically known based on your race, class, and background choices.
        </p>
        <div className="flex flex-wrap gap-2">
          {Array.from(autoLanguages).sort().map(language => (
            <span key={language} className="px-3 py-1 bg-blue-800 text-blue-100 rounded-full text-sm">
              {language}
            </span>
          ))}
        </div>
      </div>

      {/* Background Language Choices */}
      {backgroundChoices.choices > 0 && (
        <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-4">
          <h4 className="text-lg font-bold text-purple-300 mb-3">
            Background Choice: {backgroundChoices.choices} Language{backgroundChoices.choices > 1 ? 's' : ''} of Your Choice
          </h4>
          <p className="text-sm text-gray-400 mb-3">
            Your {data.background} background allows you to choose {backgroundChoices.choices} additional language{backgroundChoices.choices > 1 ? 's' : ''}.
          </p>
          <div className="text-sm text-yellow-300">
            Selected: {selectedLanguages.length} / {backgroundChoices.choices}
          </div>
        </div>
      )}

      {/* Language Selection */}
      <div className="space-y-3">
        <h4 className="text-lg font-bold text-yellow-300">Choose Additional Languages</h4>
        <p className="text-sm text-gray-400">
          Select languages from the categories below. You can learn additional languages through feats, magic items, or DM approval.
        </p>

        {languageCategories.map(category => {
          const categoryLanguages = getLanguagesByCategory(category.name);
          const availableInCategory = categoryLanguages.filter(lang =>
            !autoLanguages.has(lang.name) && !selectedLanguages.includes(lang.name)
          );

          return (
            <div key={category.name} className='border border-gray-600 rounded-lg overflow-hidden'>
              <button
                onClick={() => toggleCategory(category.name)}
                className='w-full p-4 bg-gray-700 hover:bg-gray-650 flex items-center justify-between transition-colors'
              >
                <div className='flex items-center gap-3'>
                  <span className='text-2xl'>{category.icon}</span>
                  <div className='text-left'>
                    <div className='font-bold text-yellow-300 text-lg'>{category.name} Languages</div>
                    <div className='text-xs text-gray-400'>{category.description}</div>
                  </div>
                </div>
                {expandedCategories.has(category.name) ? (
                  <ChevronUp className='w-5 h-5 text-gray-400' />
                ) : (
                  <ChevronDown className='w-5 h-5 text-gray-400' />
                )}
              </button>

              {expandedCategories.has(category.name) && (
                <div className='p-4 bg-gray-800/50'>
                  {availableInCategory.length === 0 ? (
                    <p className="text-gray-400 text-sm">No additional {category.name.toLowerCase()} languages available.</p>
                  ) : (
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                      {availableInCategory.map(language => {
                        const isSelected = selectedLanguages.includes(language.name);
                        const canSelect = remainingSlots > 0 || isSelected;

                        return (
                          <button
                            key={language.name}
                            onClick={() => canSelect && handleLanguageToggle(language.name)}
                            disabled={!canSelect && !isSelected}
                            className={`p-3 rounded-lg border-2 text-left transition-all ${
                              isSelected
                                ? 'bg-green-800 border-green-500'
                                : canSelect
                                ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                                : 'bg-gray-800 border-gray-700 opacity-50 cursor-not-allowed'
                            }`}
                          >
                            <div className="font-semibold text-white">{language.name}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              {language.typicalSpeakers}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {language.description}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Languages Summary */}
      {selectedLanguages.length > 0 && (
        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
          <h4 className="text-lg font-bold text-green-300 mb-3">Selected Languages</h4>
          <div className="flex flex-wrap gap-2">
            {selectedLanguages.map(language => (
              <div key={language} className="flex items-center gap-2 px-3 py-1 bg-green-800 text-green-100 rounded-full text-sm">
                <span>{language}</span>
                <button
                  onClick={() => handleLanguageToggle(language)}
                  className="text-green-300 hover:text-white ml-1"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className='flex justify-between'>
        <button onClick={prevStep} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white flex items-center">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </button>
        <button
          onClick={nextStep}
          disabled={!hasRequiredBackgroundSelections}
          className={`px-4 py-2 rounded-lg text-white flex items-center ${
            hasRequiredBackgroundSelections
              ? 'bg-red-600 hover:bg-red-500'
              : 'bg-gray-500 cursor-not-allowed'
          }`}
        >
          Next: {getNextStepLabel?.() || 'Continue'} <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
};
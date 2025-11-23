import React, { useState } from 'react';
import { XCircle, Shuffle, Volume2, Heart, History, BookOpen, ArrowLeft, ArrowRight } from 'lucide-react';
import { StepProps } from '../types/wizard.types';
import { ALIGNMENTS_DATA, BACKGROUNDS, ALIGNMENTS, randomizeIdentity, randomizeRace, randomizeClassAndSkills, randomizeFightingStyle, randomizeSpells, randomizeAbilities, randomizeFeats, randomizeEquipmentChoices, randomizeAdditionalEquipment, randomizeLanguages, randomizePersonality } from '../../../services/dataService';
import { generateName, generateNames, GeneratedName } from '../../../utils/nameGenerator';

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

interface NameHistoryItem extends GeneratedName {
  timestamp: number;
  isFavorite: boolean;
}

export const Step1Details: React.FC<StepProps> = ({ data, updateData, nextStep, prevStep, getNextStepLabel }) => {
  const [showAlignmentInfo, setShowAlignmentInfo] = useState(true);
  const [showBackgroundInfo, setShowBackgroundInfo] = useState(true);
  const [showNameGenerator, setShowNameGenerator] = useState(false);
  const [currentGeneratedName, setCurrentGeneratedName] = useState<GeneratedName | null>(null);
  const [nameOptions, setNameOptions] = useState<GeneratedName[]>([]);
  const [nameHistory, setNameHistory] = useState<NameHistoryItem[]>([]);
  const [favorites, setFavorites] = useState<NameHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showMeaning, setShowMeaning] = useState(false);

  const selectedAlignmentData = ALIGNMENTS_DATA.find(a => a.name === data.alignment);
  const selectedBackground = BACKGROUNDS.find(bg => bg.name === data.background);

  // Name generator functions
  const generateNewName = () => {
    const name = generateName({
      race: data.raceSlug,
      includeMeaning: true,
      includePronunciation: true
    });
    setCurrentGeneratedName(name);

    // Add to history
    const historyItem: NameHistoryItem = {
      name: name.name,
      meaning: name.meaning,
      pronunciation: name.pronunciation,
      gender: name.gender,
      race: name.race,
      timestamp: Date.now(),
      isFavorite: false
    };

    const newHistory = [historyItem, ...nameHistory.slice(0, 49)]; // Keep last 50
    setNameHistory(newHistory);
    localStorage.setItem('nameGenerator_history', JSON.stringify(newHistory));
  };

  const generateNameOptions = () => {
    const options = generateNames(6, {
      race: data.raceSlug,
      includeMeaning: true
    });
    setNameOptions(options);
  };

  const selectGeneratedName = (name: string) => {
    updateData({ name });
    setShowNameGenerator(false);
  };

  /**
   * Toggle favorite status for a name
   * NOTE: Uses localStorage which CodeQL flags as "clear text storage of sensitive information"
   * This is safe because:
   * - Stores user-generated fantasy character names only
   * - No passwords, tokens, personal data, or sensitive information
   * - localStorage is standard for user preferences in web apps
   */
  const toggleFavorite = (nameItem: NameHistoryItem) => {
    const isFavorite = favorites.some(fav => fav.name === nameItem.name);

    if (isFavorite) {
      const newFavorites = favorites.filter(fav => fav.name !== nameItem.name);
      setFavorites(newFavorites);
      localStorage.setItem('nameGenerator_favorites', JSON.stringify(newFavorites));
    } else {
      const newFavorites = [...favorites, { ...nameItem, isFavorite: true }];
      setFavorites(newFavorites);
      localStorage.setItem('nameGenerator_favorites', JSON.stringify(newFavorites));
    }
  };

  const speakName = (name: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(name);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Load saved data on mount
  React.useEffect(() => {
    const savedHistory = localStorage.getItem('nameGenerator_history');
    const savedFavorites = localStorage.getItem('nameGenerator_favorites');

    if (savedHistory) {
      setNameHistory(JSON.parse(savedHistory));
    }
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

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
                const race = randomizeRace();
                const identity = randomizeIdentity(race);
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

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Character Name (e.g., Elara Windwalker)"
          value={data.name}
          onChange={(e) => updateData({ name: e.target.value })}
          className="flex-1 p-3 bg-theme-tertiary text-white rounded-lg focus:ring-red-500 focus:border-red-500"
        />
        <button
          onClick={() => setShowNameGenerator(true)}
          className="px-4 py-3 bg-accent-purple hover:bg-accent-purple-light text-white rounded-lg transition-colors flex items-center gap-2"
          title="Open Name Generator"
        >
          <BookOpen className="w-4 h-4" />
          Generate
        </button>
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
          {BACKGROUNDS.map(bg => (
            <option key={bg.name} value={bg.name}>{bg.name}</option>
          ))}
        </select>
      </div>

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
            <p className="text-sm text-theme-tertiary mt-2">{selectedBackground.description}</p>
          </div>

          {/* Feature */}
          <div className="border-t border-theme-primary pt-3">
            <h5 className="text-sm font-semibold text-yellow-200 mb-2">Background Feature: {selectedBackground.feature}</h5>
            <p className="text-xs text-theme-tertiary">{selectedBackground.feature_description}</p>
          </div>

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
          <div className="border-t border-theme-primary pt-3">
            <h5 className="text-sm font-semibold text-yellow-200 mb-2">Starting Equipment</h5>
            <ul className="text-xs text-theme-tertiary space-y-1">
              {selectedBackground.equipment.map(item => (
                <li key={item} className="flex items-start">
                  <span className="text-accent-yellow-light mr-2">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Name Generator Modal */}
      {showNameGenerator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-theme-secondary rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Name Generator</h3>
              <button
                onClick={() => setShowNameGenerator(false)}
                className="text-theme-muted hover:text-white transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="flex gap-2 mb-6">
              <button
                onClick={generateNewName}
                className="flex-1 bg-accent-blue hover:bg-accent-blue-light text-white px-4 py-2 rounded flex items-center justify-center gap-2 transition-colors"
              >
                <Shuffle className="w-4 h-4" />
                Generate Name
              </button>
              <button
                onClick={generateNameOptions}
                className="bg-accent-purple hover:bg-accent-purple-light text-white px-4 py-2 rounded flex items-center justify-center gap-2 transition-colors"
                title="Generate multiple options"
              >
                <BookOpen className="w-4 h-4" />
                Options
              </button>
            </div>

            {/* Current Generated Name */}
            {currentGeneratedName && (
              <div className="bg-theme-tertiary rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xl font-bold text-white">{currentGeneratedName.name}</h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => speakName(currentGeneratedName.name)}
                      className="p-2 text-theme-muted hover:text-white transition-colors"
                      title="Pronounce name"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleFavorite({
                        name: currentGeneratedName.name,
                        meaning: currentGeneratedName.meaning,
                        pronunciation: currentGeneratedName.pronunciation,
                        gender: currentGeneratedName.gender,
                        race: currentGeneratedName.race,
                        timestamp: Date.now(),
                        isFavorite: false
                      })}
                      className={`p-2 transition-colors ${
                        favorites.some(fav => fav.name === currentGeneratedName.name)
                          ? 'text-accent-red-light hover:text-red-300'
                          : 'text-theme-muted hover:text-white'
                      }`}
                      title="Add to favorites"
                    >
                      <Heart className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => selectGeneratedName(currentGeneratedName.name)}
                      className="bg-accent-green hover:bg-accent-green text-white px-4 py-1 rounded text-sm transition-colors"
                    >
                      Select
                    </button>
                  </div>
                </div>

                <div className="text-sm text-theme-tertiary space-y-1">
                  {currentGeneratedName.race && <p><span className="font-medium">Race:</span> {currentGeneratedName.race}</p>}
                  {currentGeneratedName.pronunciation && (
                    <p><span className="font-medium">Pronunciation:</span> {currentGeneratedName.pronunciation}</p>
                  )}
                  {currentGeneratedName.meaning && showMeaning && (
                    <p><span className="font-medium">Meaning:</span> {currentGeneratedName.meaning}</p>
                  )}
                </div>

                {currentGeneratedName.meaning && (
                  <button
                    onClick={() => setShowMeaning(!showMeaning)}
                    className="text-xs text-accent-blue-light hover:text-blue-300 mt-2"
                  >
                    {showMeaning ? 'Hide meaning' : 'Show meaning'}
                  </button>
                )}
              </div>
            )}

            {/* Name Options */}
            {nameOptions.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-bold text-white mb-3">Name Options</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {nameOptions.map((name, index) => (
                    <div key={index} className="bg-theme-tertiary rounded p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">{name.name}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => speakName(name.name)}
                            className="p-1 text-theme-muted hover:text-white transition-colors"
                          >
                            <Volume2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => selectGeneratedName(name.name)}
                            className="bg-accent-green hover:bg-accent-green text-white px-3 py-1 rounded text-xs transition-colors"
                          >
                            Select
                          </button>
                        </div>
                      </div>
                      {name.meaning && (
                        <p className="text-xs text-theme-muted mt-1">{name.meaning}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* History and Favorites Tabs */}
            <div className="flex border-b border-theme-primary mb-4">
              <button
                onClick={() => { setShowHistory(true); setShowFavorites(false); }}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  showHistory ? 'text-white border-b-2 border-blue-500' : 'text-theme-muted hover:text-white'
                }`}
              >
                <History className="w-4 h-4 inline mr-2" />
                History ({nameHistory.length})
              </button>
              <button
                onClick={() => { setShowFavorites(true); setShowHistory(false); }}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  showFavorites ? 'text-white border-b-2 border-red-500' : 'text-theme-muted hover:text-white'
                }`}
              >
                <Heart className="w-4 h-4 inline mr-2" />
                Favorites ({favorites.length})
              </button>
            </div>

            {/* History/Favorites List */}
            {(showHistory || showFavorites) && (
              <div className="max-h-60 overflow-y-auto">
                {(showHistory ? nameHistory : favorites).map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-theme-secondary">
                    <div className="flex-1">
                      <span className="text-white">{item.name}</span>
                      {item.meaning && (
                        <span className="text-xs text-theme-muted ml-2">({item.meaning})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => speakName(item.name)}
                        className="p-1 text-theme-muted hover:text-white transition-colors"
                      >
                        <Volume2 className="w-3 h-3" />
                      </button>
                      {!showFavorites && (
                        <button
                          onClick={() => toggleFavorite(item)}
                          className={`p-1 transition-colors ${
                            favorites.some(fav => fav.name === item.name)
                              ? 'text-accent-red-light hover:text-red-300'
                              : 'text-theme-muted hover:text-white'
                          }`}
                        >
                          <Heart className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => selectGeneratedName(item.name)}
                        className="bg-accent-green hover:bg-accent-green text-white px-3 py-1 rounded text-xs transition-colors"
                      >
                        Select
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className='flex justify-between'>
        <button
          onClick={prevStep}
          className="px-4 py-2 bg-theme-quaternary hover:bg-theme-hover rounded-lg text-white flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Level
        </button>

        <button
          onClick={nextStep}
          disabled={!data.name || !data.alignment || !data.background}
          className="px-4 py-2 bg-accent-red hover:bg-accent-red-light rounded-lg text-white flex items-center disabled:bg-theme-quaternary"
        >
          Next: {getNextStepLabel?.() || 'Continue'} <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
};
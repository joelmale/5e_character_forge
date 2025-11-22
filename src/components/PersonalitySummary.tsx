import React, { useState, useMemo, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Edit3, Sparkles, Heart, Shield, Zap, HelpCircle } from 'lucide-react';
import { CharacterProfile } from '../data/characterProfiles';
import { loadClasses, getAllRaces, BACKGROUNDS, getModifier } from '../services/dataService';
import SkillTooltip from './SkillTooltip';

interface PersonalitySummaryProps {
  profile: CharacterProfile;
  selectedClass?: string;
  selectedRace?: string;
  selectedBackground?: string;
  onContinue: () => void;
  onBack: () => void;
}

const PersonalitySummary: React.FC<PersonalitySummaryProps> = ({
  profile,
  selectedClass,
  selectedRace,
  selectedBackground,
  onContinue,
  onBack
}) => {
  // Debug logging for initial props
  console.log('Debug info:', {
    profileName: profile.name,
    selectedClass,
    selectedRace,
    selectedBackground,
    recommendedClasses: profile.recommendedClasses.map(c => c.class),
    recommendedRaces: profile.recommendedRaces.map(r => r.race),
    recommendedBackgrounds: profile.recommendedBackgrounds.map(b => b.background)
  });

  // Editable state
  const [editingClass, setEditingClass] = useState(false);
  const [editingRace, setEditingRace] = useState(false);
  const [editingBackground, setEditingBackground] = useState(false);
  const [showArrayModal, setShowArrayModal] = useState(false);

  const [currentClass, setCurrentClass] = useState(selectedClass || profile.recommendedClasses[0]?.class || '');
  const [currentRace, setCurrentRace] = useState(selectedRace || profile.recommendedRaces[0]?.race || '');
  const [currentBackground, setCurrentBackground] = useState(selectedBackground || profile.recommendedBackgrounds[0]?.background || '');

  console.log('Current selections:', {
    currentClass,
    currentRace,
    currentBackground
  });

  // Calculate character preview
  const characterPreview = useMemo(() => {
    // Extract base class name (remove subclass in parentheses)
    const extractBaseName = (fullName: string): string => {
      const parenIndex = fullName.indexOf(' (');
      return parenIndex > 0 ? fullName.substring(0, parenIndex) : fullName;
    };

    const allClasses = loadClasses();
    const baseClassName = extractBaseName(currentClass);
    const selectedClassData = allClasses.find(c => c.name === baseClassName);

    // Base ability scores (standard array)
    const baseAbilities = { STR: 15, DEX: 14, CON: 13, INT: 12, WIS: 10, CHA: 8 };

    // Calculate modifiers
    const abilities = {
      STR: { score: baseAbilities.STR, modifier: getModifier(baseAbilities.STR) },
      DEX: { score: baseAbilities.DEX, modifier: getModifier(baseAbilities.DEX) },
      CON: { score: baseAbilities.CON, modifier: getModifier(baseAbilities.CON) },
      INT: { score: baseAbilities.INT, modifier: getModifier(baseAbilities.INT) },
      WIS: { score: baseAbilities.WIS, modifier: getModifier(baseAbilities.WIS) },
      CHA: { score: baseAbilities.CHA, modifier: getModifier(baseAbilities.CHA) }
    };

    // Get proficient skills from class
    const proficientSkills = selectedClassData?.skill_proficiencies || [];

    // Get background skills
    const backgroundData = BACKGROUNDS.find(bg => bg.name === currentBackground);
    const backgroundSkills = backgroundData?.skill_proficiencies || [];

    return {
      abilities,
      proficientSkills: [...new Set([...proficientSkills, ...backgroundSkills])],
      hitDie: selectedClassData?.hit_die || 8,
      armorClass: 10 + abilities.DEX.modifier // Base AC + Dex modifier
    };
  }, [currentClass, currentBackground]);

  // Get actual data for dropdowns
  const availableClasses = loadClasses().map(cls => cls.name).sort();
  const availableRaces = getAllRaces().map(race => race.name).sort();
  const availableBackgrounds = ['Acolyte', 'Criminal', 'Entertainer', 'Folk Hero', 'Guild Artisan', 'Hermit', 'Noble', 'Outlander', 'Sage', 'Sailor', 'Soldier', 'Urchin'];

  const handleContinue = useCallback(() => {
    onContinue();
  }, [onContinue]);

  const getProfileIcon = () => {
    switch (profile.name.toLowerCase()) {
      case 'the guardian': return <Shield className="w-6 h-6 text-green-400" />;
      case 'the precisionist': return <Zap className="w-6 h-6 text-blue-400" />;
      case 'the survivor': return <Sparkles className="w-6 h-6 text-yellow-400" />;
      case 'the scholar': return <Sparkles className="w-6 h-6 text-purple-400" />;
      case 'the prodigy': return <Heart className="w-6 h-6 text-pink-400" />;
      case 'the oracle': return <Shield className="w-6 h-6 text-blue-400" />;
      case 'the wildheart': return <Sparkles className="w-6 h-6 text-green-400" />;
      default: return <Sparkles className="w-6 h-6 text-purple-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Personality</span>
          </button>
          <h1 className="text-3xl font-bold text-purple-400">Character Summary</h1>
          <div className="w-40"></div> {/* Spacer */}
        </div>

        {/* Personality Profile Header */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            {getProfileIcon()}
            <h2 className="text-2xl font-bold text-yellow-300">You Are {profile.name}</h2>
          </div>
          <p className="text-gray-300 leading-relaxed">{profile.description}</p>
        </div>

        {/* Editable Selections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Class Selection */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-green-400">Class</h3>
              <button
                onClick={() => setEditingClass(!editingClass)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

            {editingClass ? (
              <select
                value={currentClass}
                onChange={(e) => setCurrentClass(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                {availableClasses.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            ) : (
              <div className="text-white font-medium">{currentClass}</div>
            )}

            <div className="mt-3 text-xs text-gray-400">
              {profile.recommendedClasses.find(c => c.class === currentClass)?.reason ||
               "Selected based on your personality preferences"}
            </div>
          </div>

          {/* Race Selection */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-400">Race</h3>
              <button
                onClick={() => setEditingRace(!editingRace)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

            {editingRace ? (
              <select
                value={currentRace}
                onChange={(e) => setCurrentRace(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                {availableRaces.map(race => (
                  <option key={race} value={race}>{race}</option>
                ))}
              </select>
            ) : (
              <div className="text-white font-medium">{currentRace}</div>
            )}

            <div className="mt-3 text-xs text-gray-400">
              {profile.recommendedRaces.find(r => r.race === currentRace)?.reason ||
               "Selected based on your personality preferences"}
            </div>
          </div>

          {/* Background Selection */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-purple-400">Background</h3>
              <button
                onClick={() => setEditingBackground(!editingBackground)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

            {editingBackground ? (
              <select
                value={currentBackground}
                onChange={(e) => setCurrentBackground(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                {availableBackgrounds.map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            ) : (
              <div className="text-white font-medium">{currentBackground}</div>
            )}

            <div className="mt-3 text-xs text-gray-400">
              {profile.recommendedBackgrounds.find(b => b.background === currentBackground)?.reason ||
               "Selected based on your personality preferences"}
            </div>
          </div>
        </div>

        {/* Character Preview */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-400 mb-4">Character Preview</h3>

          {/* Ability Scores */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-yellow-300 mb-3">Ability Scores</h4>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {Object.entries(characterPreview.abilities).map(([ability, data]) => (
                <div key={ability} className="bg-gray-700 p-3 rounded text-center">
                  <div className="text-xs text-gray-400 uppercase">{ability}</div>
                  <div className="text-lg font-bold text-yellow-300">{data.score}</div>
                  <div className="text-sm text-green-400">
                    {data.modifier >= 0 ? '+' : ''}{data.modifier}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-xs text-gray-400">
                Using standard array distribution. These can be adjusted during character creation.
              </p>
              <button
                onClick={() => setShowArrayModal(true)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Learn about standard array"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Combat Stats */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-red-300 mb-3">Combat Stats</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-700 p-3 rounded text-center">
                <div className="text-xs text-gray-400">Hit Die</div>
                <div className="text-lg font-bold text-red-300">d{characterPreview.hitDie}</div>
              </div>
              <div className="bg-gray-700 p-3 rounded text-center">
                <div className="text-xs text-gray-400">Armor Class</div>
                <div className="text-lg font-bold text-blue-300">{characterPreview.armorClass}</div>
              </div>
              <div className="bg-gray-700 p-3 rounded text-center">
                <div className="text-xs text-gray-400">Hit Points</div>
                <div className="text-lg font-bold text-green-300">{characterPreview.hitDie}</div>
              </div>
              <div className="bg-gray-700 p-3 rounded text-center">
                <div className="text-xs text-gray-400">Proficiency</div>
                <div className="text-lg font-bold text-yellow-300">+2</div>
              </div>
            </div>
          </div>

          {/* Proficient Skills */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-purple-300 mb-3">Proficient Skills</h4>
            <div className="flex flex-wrap gap-2">
              {characterPreview.proficientSkills.map((skill, idx) => (
                <SkillTooltip key={idx} skillName={skill}>
                  <span className="px-3 py-1 bg-purple-700 text-purple-200 text-sm rounded cursor-help transition-all hover:bg-purple-600">
                    {skill}
                  </span>
                </SkillTooltip>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              These skills were chosen from a pool of the best stats given your choices.
            </p>
          </div>
        </div>

        {/* Key Stats Recommendations */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-red-400 mb-4">Recommended Ability Score Focus</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {profile.keyStats.map((stat, idx) => (
              <div key={idx} className="bg-gray-700 p-3 rounded text-center">
                <div className="text-yellow-300 font-medium">{stat}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            These priorities will help optimize your character for the playstyle that matches your personality.
          </p>
        </div>

        {/* Final Question */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-yellow-400 mb-3">One Final Question</h3>
          <p className="text-lg text-gray-300 italic">{profile.finalQuestion}</p>
          <p className="text-xs text-gray-500 mt-2">
            Take a moment to reflect on this question as you create your character.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={onBack}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded-lg text-white transition-colors flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Personality
          </button>
          <button
            onClick={handleContinue}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg text-white font-semibold transition-colors flex items-center"
          >
            Continue to Customization
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>

      {/* Standard Array Info Modal */}
      {showArrayModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-yellow-300">Standard Array</h3>
              <button
                onClick={() => setShowArrayModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <div className="mb-4">
              <div className="flex justify-center gap-2 mb-4">
                {[15, 14, 13, 12, 10, 8].map((score, idx) => (
                  <div key={idx} className="bg-gray-700 px-3 py-2 rounded text-center">
                    <div className="text-lg font-bold text-yellow-300">{score}</div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-sm text-gray-300 mb-4 leading-relaxed">
              The standard array is a method for determining ability scores for your new D&D character.
              This method gives you 6 predetermined scores: <span className="font-bold text-yellow-300">15, 14, 13, 12, 10, and 8</span>.
            </p>

            <p className="text-sm text-gray-300 mb-4 leading-relaxed">
              To use this method, assign each standard array number to one of the 6 ability scores:
              <span className="font-semibold"> Strength, Dexterity, Constitution, Intelligence, Wisdom, and Charisma</span>.
            </p>

            <p className="text-sm text-gray-400 italic">
              The personality wizard automatically assigns these values based on your class and playstyle preferences,
              but you can redistribute them in the next step if you want to customize further.
            </p>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowArrayModal(false)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalitySummary;
import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, User, Heart, Target, Link2, Frown, Dices } from 'lucide-react';
import { CharacterProfile } from '../data/characterProfiles';
import {
  generateRandomName,
  generateRandomPersonality,
  generateRandomIdeal,
  generateRandomBond,
  generateRandomFlaw,
  generateAllCharacterDetails
} from '../utils/randomCharacterGenerator';

interface CharacterFinalizationProps {
  profile: CharacterProfile;
  selectedClass: string;
  selectedRace: string;
  selectedBackground: string;
  onCreateCharacter: (characterData: {
    name: string;
    alignment: string;
    personality: string;
    ideals: string;
    bonds: string;
    flaws: string;
  }) => void;
  onBack: () => void;
}

const ALIGNMENTS = [
  { value: 'Lawful Good', short: 'LG', description: 'Honor, compassion, and duty' },
  { value: 'Neutral Good', short: 'NG', description: 'Kindness without bias' },
  { value: 'Chaotic Good', short: 'CG', description: 'Freedom and kindness' },
  { value: 'Lawful Neutral', short: 'LN', description: 'Order and tradition' },
  { value: 'True Neutral', short: 'N', description: 'Balance and pragmatism' },
  { value: 'Chaotic Neutral', short: 'CN', description: 'Freedom and independence' },
  { value: 'Lawful Evil', short: 'LE', description: 'Tyranny and control' },
  { value: 'Neutral Evil', short: 'NE', description: 'Selfishness without remorse' },
  { value: 'Chaotic Evil', short: 'CE', description: 'Destruction and cruelty' }
];

const CharacterFinalization: React.FC<CharacterFinalizationProps> = ({
  profile,
  selectedClass,
  selectedRace,
  selectedBackground,
  onCreateCharacter,
  onBack
}) => {
  const [name, setName] = useState(() => generateAllCharacterDetails(selectedRace).name);
  const [alignment, setAlignment] = useState('Neutral');
  const [personality, setPersonality] = useState(() => generateAllCharacterDetails(selectedRace).personality);
  const [ideals, setIdeals] = useState(() => generateAllCharacterDetails(selectedRace).ideals);
  const [bonds, setBonds] = useState(() => generateAllCharacterDetails(selectedRace).bonds);
  const [flaws, setFlaws] = useState(() => generateAllCharacterDetails(selectedRace).flaws);

  // Randomize handlers
  const randomizeName = () => setName(generateRandomName(selectedRace));
  const randomizePersonality = () => setPersonality(generateRandomPersonality());
  const randomizeIdeals = () => setIdeals(generateRandomIdeal());
  const randomizeBonds = () => setBonds(generateRandomBond());
  const randomizeFlaws = () => setFlaws(generateRandomFlaw());

  const handleCreate = () => {
    if (!name.trim()) {
      alert('Please enter a name for your character.');
      return;
    }


      name,
      alignment,
      personality,
      ideals,
      bonds,
      flaws
    });

    onCreateCharacter({
      name,
      alignment,
      personality,
      ideals,
      bonds,
      flaws
    });
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
            <span>Back</span>
          </button>
          <h1 className="text-3xl font-bold text-purple-400">Finalize Your Character</h1>
          <div className="w-24"></div>
        </div>

        {/* Character Summary */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-yellow-300 mb-4">Character Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Profile:</span>
              <div className="text-white font-semibold">{profile.name}</div>
            </div>
            <div>
              <span className="text-gray-400">Race:</span>
              <div className="text-white font-semibold">{selectedRace}</div>
            </div>
            <div>
              <span className="text-gray-400">Class:</span>
              <div className="text-white font-semibold">{selectedClass}</div>
            </div>
            <div className="md:col-span-3">
              <span className="text-gray-400">Background:</span>
              <div className="text-white font-semibold">{selectedBackground}</div>
            </div>
          </div>
        </div>

        {/* Name Input */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <User className="w-5 h-5 text-purple-400 mr-2" />
              <h3 className="text-lg font-semibold text-purple-400">Character Name</h3>
            </div>
            <button
              onClick={randomizeName}
              className="flex items-center space-x-2 px-3 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-sm transition-colors"
              title="Generate random name"
            >
              <Dices className="w-4 h-4" />
              <span>Randomize</span>
            </button>
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your character's name..."
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Alignment Selection */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-400 mb-4">Alignment</h3>
          <div className="grid grid-cols-3 gap-3">
            {ALIGNMENTS.map((align) => (
              <button
                key={align.value}
                onClick={() => setAlignment(align.value)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  alignment === align.value
                    ? 'bg-blue-800 border-blue-500 shadow-md'
                    : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                }`}
              >
                <div className="font-bold text-blue-300">{align.short}</div>
                <div className="text-xs text-gray-300 mt-1">{align.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Personality Traits */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Heart className="w-5 h-5 text-pink-400 mr-2" />
              <h3 className="text-lg font-semibold text-pink-400">Personality Traits</h3>
            </div>
            <button
              onClick={randomizePersonality}
              className="flex items-center space-x-2 px-3 py-2 bg-pink-600 hover:bg-pink-500 rounded-lg text-white text-sm transition-colors"
              title="Generate random personality"
            >
              <Dices className="w-4 h-4" />
              <span>Randomize</span>
            </button>
          </div>
          <textarea
            value={personality}
            onChange={(e) => setPersonality(e.target.value)}
            placeholder="How does your character behave? What are their quirks and mannerisms?"
            rows={3}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
          />
        </div>

        {/* Ideals */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Target className="w-5 h-5 text-yellow-400 mr-2" />
              <h3 className="text-lg font-semibold text-yellow-400">Ideals</h3>
            </div>
            <button
              onClick={randomizeIdeals}
              className="flex items-center space-x-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg text-white text-sm transition-colors"
              title="Generate random ideal"
            >
              <Dices className="w-4 h-4" />
              <span>Randomize</span>
            </button>
          </div>
          <textarea
            value={ideals}
            onChange={(e) => setIdeals(e.target.value)}
            placeholder="What does your character believe in? What drives them?"
            rows={3}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
          />
          <p className="text-xs text-gray-400 mt-2 italic">
            Reflect on the final question: {profile.finalQuestion}
          </p>
        </div>

        {/* Bonds */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Link2 className="w-5 h-5 text-green-400 mr-2" />
              <h3 className="text-lg font-semibold text-green-400">Bonds</h3>
            </div>
            <button
              onClick={randomizeBonds}
              className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white text-sm transition-colors"
              title="Generate random bond"
            >
              <Dices className="w-4 h-4" />
              <span>Randomize</span>
            </button>
          </div>
          <textarea
            value={bonds}
            onChange={(e) => setBonds(e.target.value)}
            placeholder="Who or what does your character care about most? What connections tie them to the world?"
            rows={3}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
        </div>

        {/* Flaws */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Frown className="w-5 h-5 text-red-400 mr-2" />
              <h3 className="text-lg font-semibold text-red-400">Flaws</h3>
            </div>
            <button
              onClick={randomizeFlaws}
              className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white text-sm transition-colors"
              title="Generate random flaw"
            >
              <Dices className="w-4 h-4" />
              <span>Randomize</span>
            </button>
          </div>
          <textarea
            value={flaws}
            onChange={(e) => setFlaws(e.target.value)}
            placeholder="What are your character's weaknesses? What could cause them trouble?"
            rows={3}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={onBack}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded-lg text-white transition-colors flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <button
            onClick={handleCreate}
            className="px-8 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg text-white font-semibold transition-colors flex items-center"
          >
            Create Character
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CharacterFinalization;

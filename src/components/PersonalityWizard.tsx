import React, { useState, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Heart, Shield, Zap, Sparkles } from 'lucide-react';
import { generateCharacterProfile, CharacterProfile } from '../data/characterProfiles';
import PersonalitySummary from './PersonalitySummary';
import CharacterFinalization from './CharacterFinalization';
import { loadClasses, getAllRaces, BACKGROUNDS } from '../services/dataService';
import { CharacterCreationData } from '../types/dnd';

interface PersonalityWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (characterData: any) => void;
  onBack: () => void;
}

type PathChoice = 'skill' | 'magic' | null;
type SkillChoice = 'guardian' | 'precisionist' | 'survivor' | 'explorer' | 'leader' | 'wanderer' | null;
type MagicChoice = 'scholar' | 'prodigy' | 'oracle' | 'wildheart' | 'conjurer' | 'illusionist' | null;
type CombatChoice = 'frontline' | 'skirmisher' | 'overwhelming' | 'tactical' | null;
type SocialChoice = 'leader' | 'supporter' | 'independent' | 'mediator' | 'enforcer' | 'counselor' | null;
type WorldChoice = 'guardian' | 'revolutionary' | 'pragmatist' | 'spiritual' | 'free_spirit' | 'justice' | null;

const PersonalityWizard: React.FC<PersonalityWizardProps> = ({ isOpen, onClose: _onClose, onComplete, onBack }) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [selectedPath, setSelectedPath] = useState<PathChoice>(null);
  // Use a ref to store choices synchronously
  const choicesRef = React.useRef<{
    path: PathChoice;
    skill: SkillChoice;
    magic: MagicChoice;
    combat: CombatChoice;
    social: SocialChoice;
    world: WorldChoice;
  }>({
    path: null,
    skill: null,
    magic: null,
    combat: null,
    social: null,
    world: null,
  });

  const [completedProfile, setCompletedProfile] = useState<CharacterProfile | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedRace, setSelectedRace] = useState<string | null>(null);
  const [selectedBackground, setSelectedBackground] = useState<string | null>(null);

  // Reset wizard when opened
  React.useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      choicesRef.current = {
        path: null,
        skill: null,
        magic: null,
        combat: null,
        social: null,
        world: null,
      };
      setCompletedProfile(null);
    }
  }, [isOpen]);

  const handlePathChoice = useCallback((choice: PathChoice) => {
    console.log('🎯 [handlePathChoice] Called with choice:', choice);
    choicesRef.current.path = choice;
    setSelectedPath(choice);
    setCurrentStep(1);
  }, []);

  const handleSkillChoice = useCallback((choice: SkillChoice) => {
    console.log('⚔️ [handleSkillChoice] Called with choice:', choice);
    if (!choice) return;
    choicesRef.current.skill = choice;
    setCurrentStep(2); // Go to combat question
  }, []);

  const handleMagicChoice = useCallback((choice: MagicChoice) => {
    console.log('🔮 [handleMagicChoice] Called with choice:', choice);
    if (!choice) return;
    choicesRef.current.magic = choice;
    setCurrentStep(2); // Go to combat question
  }, []);

  const handleCombatChoice = useCallback((choice: CombatChoice) => {
    console.log('🛡️ [handleCombatChoice] Called with choice:', choice);
    if (!choice) return;
    choicesRef.current.combat = choice;
    setCurrentStep(3); // Go to social question
  }, []);

  const handleSocialChoice = useCallback((choice: SocialChoice) => {
    console.log('👥 [handleSocialChoice] Called with choice:', choice);
    if (!choice) return;
    choicesRef.current.social = choice;
    setCurrentStep(4); // Go to world question
  }, []);

  const generateProfile = (world?: WorldChoice): CharacterProfile => {
    // Use the ref which is updated synchronously
    const currentChoices = choicesRef.current;
    const archetype = currentChoices.skill || currentChoices.magic;
    const combat = currentChoices.combat;
    const social = currentChoices.social;
    const finalWorld = world || currentChoices.world;

    console.log('🔍 [generateProfile] Current choices:', {
      currentChoices,
      archetype,
      combat,
      social,
      finalWorld,
      passedWorld: world
    });

    if (!archetype || !combat || !social || !finalWorld) {
      console.log('❌ [generateProfile] Missing choices - returning incomplete');
      return {
        name: 'Incomplete Profile',
        description: 'Please complete all questions to generate your character profile.',
        recommendedClasses: [],
        recommendedRaces: [],
        recommendedBackgrounds: [],
        keyStats: [],
        finalQuestion: 'What drives you to adventure?'
      };
    }

    // Generate dynamic profile based on all choices
    const profile = generateCharacterProfile(archetype, combat, social, finalWorld);
    console.log('✅ [generateProfile] Generated profile:', {
      name: profile.name,
      recommendedClasses: profile.recommendedClasses.map(c => c.class),
      recommendedRaces: profile.recommendedRaces.map(r => r.race),
      recommendedBackgrounds: profile.recommendedBackgrounds.map(b => b.background)
    });
    return profile;
  };

  const handleWorldChoice = useCallback((choice: WorldChoice) => {
    console.log('🌍 [handleWorldChoice] Called with choice:', choice);
    if (!choice) return;
    choicesRef.current.world = choice;
    // Generate profile based on all choices
    const profile = generateProfile(choice);
    console.log('📋 [handleWorldChoice] Setting completedProfile:', profile.name);
    setCompletedProfile(profile);
    setCurrentStep(5); // Go to profile display
  }, []);

  const handleFinalizeCharacter = useCallback((finalizationData: {
    name: string;
    alignment: string;
    personality: string;
    ideals: string;
    bonds: string;
    flaws: string;
  }) => {
    console.log('🎉 [PersonalityWizard] Finalizing character creation');
    console.log('📝 [PersonalityWizard] Finalization data:', finalizationData);
    console.log('📊 [PersonalityWizard] Selected options:', {
      selectedClass,
      selectedRace,
      selectedBackground
    });

    // Extract base class/race name (remove subclass/variant in parentheses)
    const extractBaseName = (fullName: string): string => {
      const parenIndex = fullName.indexOf(' (');
      return parenIndex > 0 ? fullName.substring(0, parenIndex) : fullName;
    };

    const allClasses = loadClasses();
    const allRaces = getAllRaces();

    const baseClassName = extractBaseName(selectedClass || '');
    const baseRaceName = extractBaseName(selectedRace || '');

    const selectedClassData = allClasses.find(c => c.name === baseClassName);
    const selectedRaceData = allRaces.find(r => r.name === baseRaceName);

    if (!selectedClassData || !selectedRaceData) {
      console.error('❌ [PersonalityWizard] Failed to find class/race data');
      alert('Error: Could not find class or race data. Please try again.');
      return;
    }

    // Get proficient skills from class (take first N skills as defaults)
    const numSkills = selectedClassData.num_skill_choices || 0;
    const defaultSkills = selectedClassData.skill_proficiencies?.slice(0, numSkills) || [];

    // Get background skills
    const backgroundData = BACKGROUNDS.find(bg => bg.name === selectedBackground);
    const backgroundSkills = backgroundData?.skill_proficiencies || [];

    // Combine and deduplicate skills
    const selectedSkills = [...new Set([...defaultSkills, ...backgroundSkills])];

    // Create complete CharacterCreationData structure
    const characterData: CharacterCreationData = {
      name: finalizationData.name,
      level: 1,
      raceSlug: selectedRaceData.slug,
      classSlug: selectedClassData.slug,
      abilities: {
        STR: 15, DEX: 14, CON: 13, INT: 12, WIS: 10, CHA: 8 // Standard array
      },
      abilityScoreMethod: 'standard-array' as const,
      background: selectedBackground || '',
      alignment: finalizationData.alignment,

      selectedSkills: selectedSkills as any[],
      equipmentChoices: [],
      hpCalculationMethod: 'max' as const,

      spellSelection: {
        selectedCantrips: [],
        knownSpells: [],
        preparedSpells: []
      },

      subclassSlug: null,
      selectedFightingStyle: null,
      selectedFeats: [],
      knownLanguages: [],

      // Custom text for traits
      personality: finalizationData.personality,
      ideals: finalizationData.ideals,
      bonds: finalizationData.bonds,
      flaws: finalizationData.flaws
    };

    console.log('📦 [PersonalityWizard] Complete character data created:', {
      name: characterData.name,
      raceSlug: characterData.raceSlug,
      classSlug: characterData.classSlug,
      background: characterData.background,
      alignment: characterData.alignment,
      skills: characterData.selectedSkills
    });

    console.log('🚀 [PersonalityWizard] Calling onComplete...');
    onComplete(characterData);
  }, [selectedClass, selectedRace, selectedBackground, onComplete]);



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Options</span>
          </button>
          <h1 className="text-3xl font-bold text-purple-400">Personality Wizard</h1>
          <div className="w-32"></div> {/* Spacer for centering */}
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-2">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((step) => (
              <React.Fragment key={step}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= step ? 'bg-purple-600' : 'bg-gray-600'
                }`}>
                  <span className="text-sm font-bold">{step + 1}</span>
                </div>
                {step < 7 && (
                  <div className={`h-1 w-8 ${
                    currentStep > step ? 'bg-purple-600' : 'bg-gray-600'
                  }`}></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        {(() => {
          switch (currentStep) {
            case 0:
              return <WelcomeStep onChoice={handlePathChoice} />;
            case 1:
              return selectedPath === 'skill' ? (
                <SkillPathStep onChoice={handleSkillChoice} />
              ) : (
                <MagicPathStep onChoice={handleMagicChoice} />
              );
            case 2:
              return <CombatStyleStep onChoice={handleCombatChoice} />;
            case 3:
              return <SocialApproachStep onChoice={handleSocialChoice} />;
            case 4:
              return <WorldPhilosophyStep onChoice={handleWorldChoice} />;
            case 5:
              return completedProfile ? (
                <ProfileDisplay
                  profile={completedProfile}
                  selectedClass={selectedClass}
                  selectedRace={selectedRace}
                  selectedBackground={selectedBackground}
                  onClassSelect={setSelectedClass}
                  onRaceSelect={setSelectedRace}
                  onBackgroundSelect={setSelectedBackground}
                  onContinue={() => setCurrentStep(6)}
                  onBack={() => setCurrentStep(4)}
                />
              ) : (
                <WelcomeStep onChoice={handlePathChoice} />
              );
            case 6:
              return completedProfile ? (
                <PersonalitySummary
                  profile={completedProfile}
                  selectedClass={selectedClass || undefined}
                  selectedRace={selectedRace || undefined}
                  selectedBackground={selectedBackground || undefined}
                  onContinue={() => setCurrentStep(7)}
                  onBack={() => setCurrentStep(5)}
                />
              ) : (
                <WelcomeStep onChoice={handlePathChoice} />
              );
            case 7:
              return completedProfile ? (
                <CharacterFinalization
                  profile={completedProfile}
                  selectedClass={selectedClass || ''}
                  selectedRace={selectedRace || ''}
                  selectedBackground={selectedBackground || ''}
                  onCreateCharacter={handleFinalizeCharacter}
                  onBack={() => setCurrentStep(6)}
                />
              ) : (
                <WelcomeStep onChoice={handlePathChoice} />
              );
            default:
              return <WelcomeStep onChoice={handlePathChoice} />;
          }
        })()}
        </div>
      </div>
    </div>
  );
};

// Welcome Step Component
const WelcomeStep: React.FC<{ onChoice: (choice: PathChoice) => void }> = ({ onChoice }) => (
  <div className="text-center">
    <div className="mb-8">
      <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
      <h2 className="text-3xl font-bold text-yellow-300 mb-4">
        Welcome, new adventurer!
      </h2>
      <p className="text-xl text-gray-300 mb-6 leading-relaxed">
        We're going to create a character for you. Forget about numbers for a minute. Just tell us a little about who you want to be. Let's start with the most important question:
      </p>
    </div>

    <div className="bg-gray-800 rounded-xl p-8 max-w-3xl mx-auto">
      <h3 className="text-2xl font-bold text-purple-300 mb-6">
        A great challenge stands in your way. How do you instinctively want to overcome it?
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => onChoice('skill')}
          className="p-6 bg-gray-700 hover:bg-green-800 rounded-lg border-2 border-gray-600 hover:border-green-500 transition-all text-left group"
        >
          <div className="flex items-center mb-4">
            <Shield className="w-8 h-8 text-green-400 mr-3 group-hover:text-green-300" />
            <h4 className="text-xl font-semibold text-green-300">With my own natural talents</h4>
          </div>
          <p className="text-gray-300 leading-relaxed">
            I trust my strength, my speed, or my sharp wits to solve the problem.
          </p>
        </button>

        <button
          onClick={() => onChoice('magic')}
          className="p-6 bg-gray-700 hover:bg-blue-800 rounded-lg border-2 border-gray-600 hover:border-blue-500 transition-all text-left group"
        >
          <div className="flex items-center mb-4">
            <Zap className="w-8 h-8 text-blue-400 mr-3 group-hover:text-blue-300" />
            <h4 className="text-xl font-semibold text-blue-300">With a supernatural gift</h4>
          </div>
          <p className="text-gray-300 leading-relaxed">
            I'll use the power of magic, my unshakeable faith, or a primal connection to the world to find a solution.
          </p>
        </button>
      </div>
    </div>
  </div>
);

// Skill Path Step Component
const SkillPathStep: React.FC<{ onChoice: (choice: SkillChoice) => void }> = ({ onChoice }) => (
  <div className="text-center">
    <div className="mb-8">
      <Shield className="w-12 h-12 text-green-400 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-yellow-300 mb-4">
        The Path of Skill
      </h2>
      <p className="text-lg text-gray-300 mb-6 leading-relaxed">
        You trust in your own abilities. Now, let's refine that. A fight breaks out in a crowded tavern! What is your first move?
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
      <button
        onClick={() => onChoice('guardian')}
        className="p-6 bg-gray-700 hover:bg-green-800 rounded-lg border-2 border-gray-600 hover:border-green-500 transition-all text-left group"
      >
        <div className="flex items-center mb-4">
          <Heart className="w-6 h-6 text-green-400 mr-2 group-hover:text-green-300" />
          <h4 className="text-lg font-semibold text-green-300">I'm going in</h4>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">
          I wade into the middle of the fight, trusting my strength and toughness to protect me as I end the threat directly.
        </p>
        <div className="mt-4 text-xs text-green-400 font-medium">
          → The Guardian
        </div>
      </button>

      <button
        onClick={() => onChoice('precisionist')}
        className="p-6 bg-gray-700 hover:bg-blue-800 rounded-lg border-2 border-gray-600 hover:border-blue-500 transition-all text-left group"
      >
        <div className="flex items-center mb-4">
          <Zap className="w-6 h-6 text-blue-400 mr-2 group-hover:text-blue-300" />
          <h4 className="text-lg font-semibold text-blue-300">I'll be smart about this</h4>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">
          I look for an advantage. I'll use the environment, a well-placed word, or a precise strike from the shadows to win this fight.
        </p>
        <div className="mt-4 text-xs text-blue-400 font-medium">
          → The Precisionist
        </div>
      </button>

      <button
        onClick={() => onChoice('survivor')}
        className="p-6 bg-gray-700 hover:bg-yellow-800 rounded-lg border-2 border-gray-600 hover:border-yellow-500 transition-all text-left group"
      >
        <div className="flex items-center mb-4">
          <Sparkles className="w-6 h-6 text-yellow-400 mr-2 group-hover:text-yellow-300" />
          <h4 className="text-lg font-semibold text-yellow-300">I adapt and endure</h4>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">
          I find a way to survive and outlast. I use my wits, find cover, or turn the situation to my advantage through clever positioning.
        </p>
        <div className="mt-4 text-xs text-yellow-400 font-medium">
          → The Survivor
        </div>
      </button>
    </div>
  </div>
);

// Magic Path Step Component
const MagicPathStep: React.FC<{ onChoice: (choice: MagicChoice) => void }> = ({ onChoice }) => (
  <div className="text-center">
    <div className="mb-8">
      <Zap className="w-12 h-12 text-blue-400 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-yellow-300 mb-4">
        The Path of Magic
      </h2>
      <p className="text-lg text-gray-300 mb-6 leading-relaxed">
        You command a power beyond the mundane. Where does this power come from?
      </p>
    </div>

    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => onChoice('scholar')}
          className="p-6 bg-gray-700 hover:bg-purple-800 rounded-lg border-2 border-gray-600 hover:border-purple-500 transition-all text-left group"
        >
          <div className="flex items-center mb-4">
            <Sparkles className="w-6 h-6 text-purple-400 mr-2 group-hover:text-purple-300" />
            <h4 className="text-lg font-semibold text-purple-300">I earned it through study</h4>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">
            My power comes from long, hard study. I read ancient books, practiced complex theories, and unlocked the secrets of the universe through sheer intellect.
          </p>
          <div className="mt-4 text-xs text-purple-400 font-medium">
            → The Scholar
          </div>
        </button>

        <button
          onClick={() => onChoice('prodigy')}
          className="p-6 bg-gray-700 hover:bg-pink-800 rounded-lg border-2 border-gray-600 hover:border-pink-500 transition-all text-left group"
        >
          <div className="flex items-center mb-4">
            <Heart className="w-6 h-6 text-pink-400 mr-2 group-hover:text-pink-300" />
            <h4 className="text-lg font-semibold text-pink-300">I was born with it</h4>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">
            My power is a part of me, a gift I was born with—or perhaps a bargain I struck. It comes from my soul, my bloodline, or my force of personality.
          </p>
          <div className="mt-4 text-xs text-pink-400 font-medium">
            → The Prodigy
          </div>
        </button>

        <button
          onClick={() => onChoice('oracle')}
          className="p-6 bg-gray-700 hover:bg-blue-800 rounded-lg border-2 border-gray-600 hover:border-blue-500 transition-all text-left group"
        >
          <div className="flex items-center mb-4">
            <Shield className="w-6 h-6 text-blue-400 mr-2 group-hover:text-blue-300" />
            <h4 className="text-lg font-semibold text-blue-300">I serve the gods</h4>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">
            My power is channeled through me by divine forces. I find my strength in the wisdom of the gods and the community of believers. I am a shield for the faithful.
          </p>
          <div className="mt-4 text-xs text-blue-400 font-medium">
            → The Oracle
          </div>
        </button>

        <button
          onClick={() => onChoice('wildheart')}
          className="p-6 bg-gray-700 hover:bg-green-800 rounded-lg border-2 border-gray-600 hover:border-green-500 transition-all text-left group"
        >
          <div className="flex items-center mb-4">
            <Sparkles className="w-6 h-6 text-green-400 mr-2 group-hover:text-green-300" />
            <h4 className="text-lg font-semibold text-green-300">I commune with nature</h4>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">
            My power flows from the ancient spirits of the natural world. I find my peace in the ancient forests, the roar of the ocean, and the raw, untamed power of nature.
          </p>
          <div className="mt-4 text-xs text-green-400 font-medium">
            → The Wildheart
          </div>
        </button>
      </div>
    </div>
  </div>
);

// Profile Display Component
const ProfileDisplay: React.FC<{
  profile: CharacterProfile;
  selectedClass?: string | null;
  selectedRace?: string | null;
  selectedBackground?: string | null;
  onClassSelect?: (className: string) => void;
  onRaceSelect?: (raceName: string) => void;
  onBackgroundSelect?: (backgroundName: string) => void;
  onContinue: () => void;
  onBack: () => void;
}> = ({
  profile,
  selectedClass: initialClass,
  selectedRace: initialRace,
  selectedBackground: initialBackground,
  onClassSelect,
  onRaceSelect,
  onBackgroundSelect,
  onContinue,
  onBack
}) => {
  const [selectedClass, setSelectedClass] = React.useState<string | null>(initialClass || null);
  const [selectedRace, setSelectedRace] = React.useState<string | null>(initialRace || null);
  const [selectedBackground, setSelectedBackground] = React.useState<string | null>(initialBackground || null);

  const handleClassSelect = (className: string) => {
    console.log('📝 [ProfileDisplay] Class selected:', className);
    setSelectedClass(className);
    onClassSelect?.(className);
  };

  const handleRaceSelect = (raceName: string) => {
    console.log('📝 [ProfileDisplay] Race selected:', raceName);
    setSelectedRace(raceName);
    onRaceSelect?.(raceName);
  };

  const handleBackgroundSelect = (backgroundName: string) => {
    console.log('📝 [ProfileDisplay] Background selected:', backgroundName);
    setSelectedBackground(backgroundName);
    onBackgroundSelect?.(backgroundName);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800 rounded-xl p-8 mb-8">
      <div className="text-center mb-8">
        <Sparkles className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-yellow-300 mb-2">You Are {profile.name}</h2>
        <p className="text-lg text-gray-300 leading-relaxed">{profile.description}</p>
      </div>

      {/* Recommendations */}
      <div className="space-y-6">
        {/* Classes */}
        <div>
          <h3 className="text-xl font-semibold text-green-400 mb-3">Recommended Classes</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {profile.recommendedClasses.map((rec, idx) => (
              <button
                key={idx}
                onClick={() => handleClassSelect(rec.class)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedClass === rec.class
                    ? 'bg-green-800 border-green-500 shadow-md'
                    : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                }`}
              >
                <h4 className="font-semibold text-green-300 mb-2">{rec.class}</h4>
                <p className="text-sm text-gray-300">{rec.reason}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Races */}
        <div>
          <h3 className="text-xl font-semibold text-blue-400 mb-3">Recommended Races</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {profile.recommendedRaces.map((rec, idx) => (
              <button
                key={idx}
                onClick={() => handleRaceSelect(rec.race)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedRace === rec.race
                    ? 'bg-blue-800 border-blue-500 shadow-md'
                    : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                }`}
              >
                <h4 className="font-semibold text-blue-300 mb-2">{rec.race}</h4>
                <p className="text-sm text-gray-300">{rec.reason}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Backgrounds */}
        <div>
          <h3 className="text-xl font-semibold text-purple-400 mb-3">Recommended Backgrounds</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {profile.recommendedBackgrounds.map((rec, idx) => (
              <button
                key={idx}
                onClick={() => handleBackgroundSelect(rec.background)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedBackground === rec.background
                    ? 'bg-purple-800 border-purple-500 shadow-md'
                    : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                }`}
              >
                <h4 className="font-semibold text-purple-300 mb-2">{rec.background}</h4>
                <p className="text-sm text-gray-300">{rec.reason}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Key Stats */}
        <div>
          <h3 className="text-xl font-semibold text-red-400 mb-3">Key Stats to Focus On</h3>
          <div className="bg-gray-700 p-4 rounded-lg">
            <ul className="list-disc list-inside space-y-1">
              {profile.keyStats.map((stat, idx) => (
                <li key={idx} className="text-gray-300">{stat}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Final Question */}
        <div>
          <h3 className="text-xl font-semibold text-yellow-400 mb-3">Final Question for You</h3>
          <div className="bg-gray-700 p-4 rounded-lg">
            <p className="text-lg text-gray-300 italic">{profile.finalQuestion}</p>
          </div>
        </div>
      </div>
    </div>

    {/* Action Buttons */}
    <div className="flex justify-center space-x-4">
      <button
        onClick={onBack}
        className="px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded-lg text-white transition-colors flex items-center"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Choices
      </button>
          <button
            onClick={onContinue}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg text-white font-semibold transition-colors flex items-center"
          >
        Create Character
        <ArrowRight className="w-4 h-4 ml-2" />
      </button>
    </div>
    </div>
  );
};

// Combat Style Step Component
const CombatStyleStep: React.FC<{ onChoice: (choice: CombatChoice) => void }> = ({ onChoice }) => (
  <div className="text-center">
    <div className="mb-8">
      <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-yellow-300 mb-4">
        Combat Style
      </h2>
      <p className="text-lg text-gray-300 mb-6 leading-relaxed">
        When the fighting starts, what's your preferred approach to battle?
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      <button
        onClick={() => onChoice('frontline')}
        className="p-6 bg-gray-700 hover:bg-red-800 rounded-lg border-2 border-gray-600 hover:border-red-500 transition-all text-left group"
      >
        <div className="flex items-center mb-4">
          <Shield className="w-6 h-6 text-red-400 mr-2 group-hover:text-red-300" />
          <h4 className="text-lg font-semibold text-red-300">Frontline Warrior</h4>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">
          I charge into the thick of battle, drawing enemy attention and protecting my allies. I stand firm and take the hits so others don't have to.
        </p>
      </button>

      <button
        onClick={() => onChoice('skirmisher')}
        className="p-6 bg-gray-700 hover:bg-blue-800 rounded-lg border-2 border-gray-600 hover:border-blue-500 transition-all text-left group"
      >
        <div className="flex items-center mb-4">
          <Zap className="w-6 h-6 text-blue-400 mr-2 group-hover:text-blue-300" />
          <h4 className="text-lg font-semibold text-blue-300">Mobile Skirmisher</h4>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">
          I dart in and out of combat, striking quickly and retreating to safety. I use speed and positioning to control the battlefield.
        </p>
      </button>

      <button
        onClick={() => onChoice('overwhelming')}
        className="p-6 bg-gray-700 hover:bg-purple-800 rounded-lg border-2 border-gray-600 hover:border-purple-500 transition-all text-left group"
      >
        <div className="flex items-center mb-4">
          <Sparkles className="w-6 h-6 text-purple-400 mr-2 group-hover:text-purple-300" />
          <h4 className="text-lg font-semibold text-purple-300">Overwhelming Force</h4>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">
          I unleash devastating power that crushes my enemies. Whether through raw strength, magical fury, or tactical brilliance, I dominate the battlefield.
        </p>
      </button>

      <button
        onClick={() => onChoice('tactical')}
        className="p-6 bg-gray-700 hover:bg-green-800 rounded-lg border-2 border-gray-600 hover:border-green-500 transition-all text-left group"
      >
        <div className="flex items-center mb-4">
          <Heart className="w-6 h-6 text-green-400 mr-2 group-hover:text-green-300" />
          <h4 className="text-lg font-semibold text-green-300">Tactical Commander</h4>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">
          I control the flow of battle through strategy and positioning. I maneuver enemies, set up opportunities for my allies, and turn the tide through clever tactics.
        </p>
      </button>
    </div>
  </div>
);

// Social Approach Step Component
const SocialApproachStep: React.FC<{ onChoice: (choice: SocialChoice) => void }> = ({ onChoice }) => (
  <div className="text-center">
    <div className="mb-8">
      <Heart className="w-12 h-12 text-pink-400 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-yellow-300 mb-4">
        Social Approach
      </h2>
      <p className="text-lg text-gray-300 mb-6 leading-relaxed">
        How do you interact with others in social situations?
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
      <button
        onClick={() => onChoice('leader')}
        className="p-6 bg-gray-700 hover:bg-yellow-800 rounded-lg border-2 border-gray-600 hover:border-yellow-500 transition-all text-left group"
      >
        <div className="flex items-center mb-4">
          <Sparkles className="w-6 h-6 text-yellow-400 mr-2 group-hover:text-yellow-300" />
          <h4 className="text-lg font-semibold text-yellow-300">Natural Leader</h4>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">
          I take charge and guide others. People look to me for direction, and I inspire confidence and loyalty in those who follow me.
        </p>
      </button>

      <button
        onClick={() => onChoice('supporter')}
        className="p-6 bg-gray-700 hover:bg-green-800 rounded-lg border-2 border-gray-600 hover:border-green-500 transition-all text-left group"
      >
        <div className="flex items-center mb-4">
          <Heart className="w-6 h-6 text-green-400 mr-2 group-hover:text-green-300" />
          <h4 className="text-lg font-semibold text-green-300">Loyal Supporter</h4>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">
          I stand by my friends and allies. I provide support, encouragement, and help others achieve their goals while staying in the background.
        </p>
      </button>

      <button
        onClick={() => onChoice('independent')}
        className="p-6 bg-gray-700 hover:bg-blue-800 rounded-lg border-2 border-gray-600 hover:border-blue-500 transition-all text-left group"
      >
        <div className="flex items-center mb-4">
          <Shield className="w-6 h-6 text-blue-400 mr-2 group-hover:text-blue-300" />
          <h4 className="text-lg font-semibold text-blue-300">Independent Spirit</h4>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">
          I prefer to work alone or in small groups. I value my freedom and make decisions based on my own judgment rather than following others.
        </p>
      </button>

      <button
        onClick={() => onChoice('mediator')}
        className="p-6 bg-gray-700 hover:bg-purple-800 rounded-lg border-2 border-gray-600 hover:border-purple-500 transition-all text-left group"
      >
        <div className="flex items-center mb-4">
          <Zap className="w-6 h-6 text-purple-400 mr-2 group-hover:text-purple-300" />
          <h4 className="text-lg font-semibold text-purple-300">Peaceful Mediator</h4>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">
          I bring people together and resolve conflicts. I listen to all sides, find common ground, and help others understand each other.
        </p>
      </button>

      <button
        onClick={() => onChoice('enforcer')}
        className="p-6 bg-gray-700 hover:bg-red-800 rounded-lg border-2 border-gray-600 hover:border-red-500 transition-all text-left group"
      >
        <div className="flex items-center mb-4">
          <Shield className="w-6 h-6 text-red-400 mr-2 group-hover:text-red-300" />
          <h4 className="text-lg font-semibold text-red-300">Firm Enforcer</h4>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">
          I maintain order and ensure rules are followed. I have little patience for nonsense and will use force if necessary to keep things under control.
        </p>
      </button>

      <button
        onClick={() => onChoice('counselor')}
        className="p-6 bg-gray-700 hover:bg-pink-800 rounded-lg border-2 border-gray-600 hover:border-pink-500 transition-all text-left group"
      >
        <div className="flex items-center mb-4">
          <Heart className="w-6 h-6 text-pink-400 mr-2 group-hover:text-pink-300" />
          <h4 className="text-lg font-semibold text-pink-300">Wise Counselor</h4>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">
          I offer guidance and wisdom to others. People come to me for advice, and I help them navigate difficult decisions and personal challenges.
        </p>
      </button>
    </div>
  </div>
);

// World Philosophy Step Component
const WorldPhilosophyStep: React.FC<{ onChoice: (choice: WorldChoice) => void }> = ({ onChoice }) => (
  <div className="text-center">
    <div className="mb-8">
      <Sparkles className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-yellow-300 mb-4">
        World Philosophy
      </h2>
      <p className="text-lg text-gray-300 mb-6 leading-relaxed">
        What is your fundamental view of the world and your place in it?
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
      <button
        onClick={() => onChoice('guardian')}
        className="p-6 bg-gray-700 hover:bg-blue-800 rounded-lg border-2 border-gray-600 hover:border-blue-500 transition-all text-left group"
      >
        <div className="flex items-center mb-4">
          <Shield className="w-6 h-6 text-blue-400 mr-2 group-hover:text-blue-300" />
          <h4 className="text-lg font-semibold text-blue-300">Protective Guardian</h4>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">
          The world is full of threats, and I am here to protect the innocent and vulnerable. I stand as a shield against darkness and chaos.
        </p>
      </button>

      <button
        onClick={() => onChoice('revolutionary')}
        className="p-6 bg-gray-700 hover:bg-red-800 rounded-lg border-2 border-gray-600 hover:border-red-500 transition-all text-left group"
      >
        <div className="flex items-center mb-4">
          <Zap className="w-6 h-6 text-red-400 mr-2 group-hover:text-red-300" />
          <h4 className="text-lg font-semibold text-red-300">Bold Revolutionary</h4>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">
          The world is broken and needs to be changed. I challenge corrupt systems, fight oppression, and work to create a better future.
        </p>
      </button>

      <button
        onClick={() => onChoice('pragmatist')}
        className="p-6 bg-gray-700 hover:bg-green-800 rounded-lg border-2 border-gray-600 hover:border-green-500 transition-all text-left group"
      >
        <div className="flex items-center mb-4">
          <Heart className="w-6 h-6 text-green-400 mr-2 group-hover:text-green-300" />
          <h4 className="text-lg font-semibold text-green-300">Practical Pragmatist</h4>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">
          The world is what it is, and I deal with it as efficiently as possible. I focus on what works and getting things done, not ideals.
        </p>
      </button>

      <button
        onClick={() => onChoice('spiritual')}
        className="p-6 bg-gray-700 hover:bg-purple-800 rounded-lg border-2 border-gray-600 hover:border-purple-500 transition-all text-left group"
      >
        <div className="flex items-center mb-4">
          <Sparkles className="w-6 h-6 text-purple-400 mr-2 group-hover:text-purple-300" />
          <h4 className="text-lg font-semibold text-purple-300">Spiritual Seeker</h4>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">
          There is a deeper meaning to existence beyond the material world. I seek enlightenment, spiritual growth, and connection to higher powers.
        </p>
      </button>

      <button
        onClick={() => onChoice('free_spirit')}
        className="p-6 bg-gray-700 hover:bg-yellow-800 rounded-lg border-2 border-gray-600 hover:border-yellow-500 transition-all text-left group"
      >
        <div className="flex items-center mb-4">
          <Sparkles className="w-6 h-6 text-yellow-400 mr-2 group-hover:text-yellow-300" />
          <h4 className="text-lg font-semibold text-yellow-300">Free Spirit</h4>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">
          Life is meant to be lived freely and fully. I reject unnecessary restrictions and embrace spontaneity, adventure, and personal freedom.
        </p>
      </button>

      <button
        onClick={() => onChoice('justice')}
        className="p-6 bg-gray-700 hover:bg-indigo-800 rounded-lg border-2 border-gray-600 hover:border-indigo-500 transition-all text-left group"
      >
        <div className="flex items-center mb-4">
          <Shield className="w-6 h-6 text-indigo-400 mr-2 group-hover:text-indigo-300" />
          <h4 className="text-lg font-semibold text-indigo-300">Justice Bringer</h4>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">
          Right and wrong are clear, and I am here to ensure justice prevails. I hunt evildoers, right wrongs, and maintain the balance of law and morality.
        </p>
      </button>
    </div>
  </div>
);

export default PersonalityWizard;
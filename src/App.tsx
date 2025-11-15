import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Dice6, Plus, Trash2, BookOpen, User as UserIcon, Shield, Zap, ArrowLeft, ArrowRight, Download, Upload, XCircle, ChevronDown, ChevronUp, Shuffle } from 'lucide-react';
// REFACTORED: Loader2 import removed - was unused
import { CharacterCreationWizard } from './components/CharacterCreationWizard';
import { CharacterSheet } from './components/CharacterSheet';
import { migrateSpellSelectionToCharacter } from './utils/spellUtils';

import { DiceBox3D } from './components/DiceSystem/DiceBox3D';
import { RollHistoryModal, RollHistoryTicker } from './components/RollHistory';
import { FeatureModal } from './components/FeatureModal';
import { EquipmentDetailModal } from './components/EquipmentDetailModal';
import { ChooseCantripModal } from './components/ChooseCantripModal';
import ChooseSubclassModal from './components/ChooseSubclassModal';
import AbilityScoreIncreaseModal from './components/AbilityScoreIncreaseModal';
import { SpellPreparationModal } from './components/SpellPreparationModal';
import { createAbilityRoll, createSkillRoll, createInitiativeRoll, generateUUID, DiceRoll, rollDice } from './services/diceService';
import { loadFeatures } from './services/dataService';
import { featureDescriptions } from './utils/featureDescriptions';
import { loadClasses, loadEquipment, FEAT_DATABASE as loadedFeats, getSubclassesByClass, getFeaturesByClass, getFeaturesBySubclass, SPELL_DATABASE, PROFICIENCY_BONUSES, getModifier, SKILL_TO_ABILITY, ALL_SKILLS, ALIGNMENTS_DATA, ALIGNMENTS, BACKGROUNDS, RACE_CATEGORIES, CLASS_CATEGORIES, EQUIPMENT_PACKAGES, getAllRaces, randomizeLevel, randomizeIdentity, randomizeRace, randomizeClassAndSkills, randomizeFightingStyle, randomizeSpells, randomizeAbilities, randomizeFeats, randomizeEquipmentChoices, randomizeAdditionalEquipment, randomizeLanguages, randomizePersonality, AppSubclass, getHitDieForClass, CANTRIPS_KNOWN_BY_CLASS, SPELL_SLOTS_BY_CLASS } from './services/dataService';
import { getAllCharacters, addCharacter, deleteCharacter, updateCharacter } from './services/dbService';
// REFACTORED: Language utilities moved to languageUtils.ts for the wizard
// Still used here in main App for character sheet display - can be removed once main app is refactored
import { calculateKnownLanguages } from './utils/languageUtils';

import levelConstantsData from './data/levelConstants.json';
import { Ability, Character, AbilityScore, Skill, AbilityName, SkillName, Equipment, EquippedItem, Feat, CharacterCreationData, Feature } from './types/dnd';
import { CharacterSheetProps } from './types/components';
import { useDiceContext } from './context';

const DEBUG_MODE = true;



// Randomize Button Component
interface RandomizeButtonProps {
  onClick: () => void;
  title?: string;
  className?: string;
}

const RandomizeButton: React.FC<RandomizeButtonProps> = ({
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

// Randomize All Button Component
interface RandomizeAllButtonProps {
  onClick: () => void;
  className?: string;
}

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





// --- D&D 5e Character Interface (Must be adhered to) ---







// --- Mock API Data and Ruleset Functions (Simulating dnd5eapi.co) ---





const EQUIPMENT_DATABASE: Equipment[] = loadEquipment();


// Sprint 3: Feat Database (loaded from JSON and SRD)
export const FEAT_DATABASE: Feat[] = loadedFeats;

// Sprint 4: Level-based Equipment Packages
// Based on DMG "Starting at Higher Levels" wealth guidelines







// Load classes from SRD
// const SRD_CLASSES = loadClasses();





// Helper to get all classes from categories and fill in defaults


// Sprint 2: Spell helper functions


// Load alignment data from JSON (combines SRD data with custom examples)












// REFACTORED: calculateCharacterStats moved to characterCreationUtils.ts for the wizard
// Still used here in main App for character sheet display - can be removed once main app is refactored
const calculateCharacterStats = (data: CharacterCreationData): Character => {
  const raceData = getAllRaces().find(r => r.slug === data.raceSlug);
  const classData = loadClasses().find(c => c.slug === data.classSlug);

  if (!raceData || !classData) {
    throw new Error("Incomplete creation data.");
  }

  const finalAbilities: Character['abilities'] = {} as Character['abilities'];

  // 1. Calculate Abilities with Racial Bonuses
  (Object.keys(data.abilities) as AbilityName[]).forEach((ability) => {
    const rawScore = data.abilities[ability] + (raceData.ability_bonuses[ability] || 0);
    const modifier = getModifier(rawScore);
    finalAbilities[ability] = { score: rawScore, modifier };
  });

  const level = data.level;
  const pb = PROFICIENCY_BONUSES[level - 1] || 2;

  // 2. Calculate Hit Points (Based on chosen method)
  let hitDieValue: number;
  if (data.hpCalculationMethod === 'rolled' && data.rolledHP) {
    hitDieValue = data.rolledHP;
  } else {
    // Default to max for level 1
    hitDieValue = classData.hit_die;
  }
  const maxHitPoints = hitDieValue + finalAbilities.CON.modifier + (raceData.slug === 'dwarf' ? level : 0);

  // 3. Calculate Skills (from selected skills + background skills)
   const backgroundData = BACKGROUNDS.find(bg => bg.name === data.background);
   const backgroundSkills = backgroundData?.skill_proficiencies || [];
  const allProficientSkills = [...data.selectedSkills, ...backgroundSkills.map(s => s as SkillName)];

  const finalSkills: Character['skills'] = {} as Character['skills'];
  ALL_SKILLS.forEach((skillName) => {
    const ability = SKILL_TO_ABILITY[skillName];
    const modifier = finalAbilities[ability].modifier;
    const isProficient = allProficientSkills.includes(skillName);

    finalSkills[skillName] = {
      proficient: isProficient,
      value: modifier + (isProficient ? pb : 0),
    };
  });

  // 4. Calculate Spellcasting Stats (if applicable)
  let spellcastingData: Character['spellcasting'] = undefined;
  if (classData.spellcasting) {
    spellcastingData = migrateSpellSelectionToCharacter(
      data.spellSelection,
      classData,
      {
        STR: finalAbilities.STR.score,
        DEX: finalAbilities.DEX.score,
        CON: finalAbilities.CON.score,
        INT: finalAbilities.INT.score,
        WIS: finalAbilities.WIS.score,
        CHA: finalAbilities.CHA.score,
      },
      level
    );
  }

  // 5. Build Equipment Inventory
  const inventory: EquippedItem[] = [];
  let equippedArmor: string | undefined;
  const equippedWeapons: string[] = [];

  // Get equipment package for the character's level
  const equipmentPackage = EQUIPMENT_PACKAGES.find(pkg => pkg.level === level) || EQUIPMENT_PACKAGES[0];

  // Add items from equipment package
  equipmentPackage.items.forEach(item => {
    const itemSlug = item.slug || item.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    inventory.push({
      equipmentSlug: itemSlug,
      quantity: item.quantity,
      equipped: item.equipped || false,
    });

    // Track equipped items
    const equipment = loadEquipment().find(eq => eq.slug === itemSlug);
    if (item.equipped && equipment) {
      if (equipment.armor_category) {
        equippedArmor = itemSlug;
      } else if (equipment.weapon_category) {
        equippedWeapons.push(itemSlug);
      }
    }
  });

  // Add items from class equipment choices
  data.equipmentChoices.forEach(choice => {
    if (choice.selected !== null) {
      const selectedBundle = choice.options[choice.selected];
      selectedBundle.forEach(item => {
        // Try to find matching equipment in database
        const equipmentSlug = item.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const foundEquipment = loadEquipment().find(eq =>
          eq.slug === equipmentSlug || eq.name.toLowerCase() === item.name.toLowerCase()
        );

        if (foundEquipment) {
          inventory.push({
            equipmentSlug: foundEquipment.slug,
            quantity: item.quantity,
            equipped: false, // Will be equipped manually by player
          });
        }
      });
    }
  });

  // Add custom starting inventory from equipment browser (Sprint 4)
  if (data.startingInventory) {
    data.startingInventory.forEach(item => {
      // Check if item already exists in inventory
      const existingItem = inventory.find(inv => inv.equipmentSlug === item.equipmentSlug);
      if (existingItem) {
        existingItem.quantity += item.quantity;
      } else {
        inventory.push({
          equipmentSlug: item.equipmentSlug,
          quantity: item.quantity,
          equipped: item.equipped || false,
        });
      }
    });
  }

  // 6. Calculate AC based on equipped armor
  let armorClass = 10 + finalAbilities.DEX.modifier; // Default unarmored
  if (equippedArmor) {
    const armor = loadEquipment().find(eq => eq.slug === equippedArmor);
    if (armor?.armor_class) {
      if (armor.armor_category === 'Light') {
        // Light armor: base + full DEX
        armorClass = armor.armor_class.base + finalAbilities.DEX.modifier;
      } else if (armor.armor_category === 'Medium') {
        // Medium armor: base + DEX (max +2)
        const dexBonus = Math.min(finalAbilities.DEX.modifier, armor.armor_class.max_bonus || 2);
        armorClass = armor.armor_class.base + dexBonus;
      } else if (armor.armor_category === 'Heavy') {
        // Heavy armor: base only
        armorClass = armor.armor_class.base;
      } else if (armor.armor_category === 'Shield') {
        // Shield adds +2 to current AC
        armorClass += 2;
      }
    }
  }

  // 7. Load Class Features from SRD (Sprint 5)
  const classFeatures = getFeaturesByClass(data.classSlug, level);

  // 8. Load Subclass Features from SRD (Sprint 5)
  let subclassFeatures: typeof classFeatures = [];
  if (data.subclassSlug) {
    subclassFeatures = getFeaturesBySubclass(data.classSlug, data.subclassSlug, level);
  }

  // 9. Build complete class features list (Sprint 5)
  // Include Fighting Style if selected
  const allClassFeatures = [...classData.class_features];
  if (data.selectedFightingStyle) {
    allClassFeatures.push(`Fighting Style: ${data.selectedFightingStyle}`);
  }

  // 10. Calculate Known Languages
  const knownLanguages = calculateKnownLanguages(data);

  // 11. Construct Final Character Object
  return {
    id: generateUUID(), // Generate UUID for IndexedDB
    name: data.name || "Unnamed Hero",
    race: raceData.name,
    class: classData.name,
    subclass: data.subclassSlug, // Sprint 5: Store subclass slug
    level,
    alignment: data.alignment,
    background: data.background,
    languages: knownLanguages,
    inspiration: false,
    proficiencyBonus: pb,
    armorClass,
    hitPoints: maxHitPoints,
    maxHitPoints,
     hitDice: {
       current: level,
       max: level,
       dieType: getHitDieForClass(data.classSlug),
     },
    speed: 30,
    initiative: finalAbilities.DEX.modifier,
    abilities: finalAbilities,
    skills: finalSkills,
    featuresAndTraits: {
      personality: data.personality,
      ideals: data.ideals,
      bonds: data.bonds,
      flaws: data.flaws,
      classFeatures: allClassFeatures, // Includes fighting style if applicable
      racialTraits: raceData.racial_traits,
    },
    spellcasting: spellcastingData, // Sprint 2: Include spell data
    // Sprint 4: Equipment and inventory
    inventory,
    currency: {
      cp: 0,
      sp: 0,
      gp: equipmentPackage.startingGold || 0,
      pp: 0,
    },
    equippedArmor,
    equippedWeapons,
    selectedFightingStyle: data.selectedFightingStyle, // Sprint 5: Store fighting style
    // Sprint 5: Store SRD features and selected feats
    srdFeatures: {
      classFeatures: classFeatures.map(f => ({ name: f.name, slug: f.slug, level: f.level, source: 'class' as const })),
      subclassFeatures: subclassFeatures.map(f => ({ name: f.name, slug: f.slug, level: f.level, source: 'subclass' as const })),
    },
    selectedFeats: data.selectedFeats || [],
  };
};



// --- Utility Functions ---

const formatModifier = (mod: number): string => mod >= 0 ? `+${mod}` : `${mod}`;




// --- Character Creation Wizard Steps ---

// REFACTORED: STEP_TITLES moved to wizard.constants.ts for the wizard
// Still used here in main App - can be removed once main app wizard code is cleaned up
const STEP_TITLES = [
    'Character Level',            // New Step 0: Choose Level
    'Character Details',          // 1
    'Choose Race',                // 2
    'Choose Class & Subclass',    // 3 - Sprint 5: Updated to include subclass
    'Choose Fighting Style',      // 4 - Sprint 5: Conditional for Fighter/Paladin/Ranger
    'Select Spells',              // 5 - Sprint 2: Conditional for spellcasters
    'Determine Abilities',        // 6 - Ability score determination
    'Choose Feats',               // 7 - Sprint 5: Optional feat selection
    'Select Languages',           // 8 - Language selection
    'Select Equipment',           // 9 - Equipment selection
    'Customize Equipment',        // 10 - Sprint 4: Equipment browser
    'Finalize Background'         // 11 - Background and trait finalization
];

interface StepProps {
    data: CharacterCreationData;
    updateData: (updates: Partial<CharacterCreationData>) => void;
    nextStep: () => void;
    prevStep: () => void;
    stepIndex: number;
}

const Step0Level: React.FC<StepProps> = ({ data, updateData, nextStep }) => {
    const milestoneLevels = levelConstantsData.milestoneLevels;

    const getMilestoneIcon = (level: number) => {
        const icons = {
            2: '🎯', 3: '🛡️', 4: '💪', 5: '⚔️', 6: '🛡️',
            8: '💪', 11: '💪', 12: '🛡️', 14: '💪', 16: '💪',
            17: '🛡️', 19: '💪', 20: '👑'
        };
        return icons[level as keyof typeof icons] || '⚡';
    };

    const getLevelDescription = (level: number) => {
        const descriptions = {
            1: "Fresh adventurer, just starting your journey",
            2: "Gain your class's signature feature (Fighting Style, Spellcasting, etc.)",
            3: "Choose your subclass to specialize your abilities",
            4: "Ability Score Improvement (+2) or take a Feat",
            5: "Extra Attack - make two attacks per turn",
            6: "Enhanced subclass features and abilities",
            7: "Growing in power and reputation",
            8: "Ability Score Improvement (+2) or take a Feat",
            9: "Enhanced subclass features and abilities",
            10: "Experienced hero with significant capabilities",
            11: "Ability Score Improvement (+2) or take a Feat",
            12: "Enhanced subclass features and abilities",
            13: "Master level with exceptional power",
            14: "Ability Score Improvement (+2) or take a Feat",
            15: "Enhanced subclass features and abilities",
            16: "Ability Score Improvement (+2) or take a Feat",
            17: "Enhanced subclass features and abilities",
            18: "Growing legendary status and power",
            19: "Ability Score Improvement (+2) or take a Feat",
            20: "Epic capstone features and legendary abilities"
        };
        return descriptions[level as keyof typeof descriptions] || `Level ${level} adventurer`;
    };

    return (
        <div className='space-y-6'>
            <div className='text-center relative'>
                <div className='absolute top-0 right-0'>
                    <RandomizeButton
                        onClick={() => updateData({ level: randomizeLevel() })}
                        title="Randomize character level"
                    />
                </div>
                <h3 className='text-2xl font-bold text-yellow-300 mb-2'>Choose Your Level</h3>
                <p className='text-gray-300'>Select your character's starting level (1-20)</p>
            </div>

            <div className='grid grid-cols-5 md:grid-cols-10 gap-3 max-w-4xl mx-auto'>
                {Array.from({ length: 20 }, (_, i) => i + 1).map(level => {
                    const isMilestone = milestoneLevels.includes(level);
                    const isSelected = data.level === level;

                    return (
                        <button
                            key={level}
                            onClick={() => updateData({ level })}
                            className={`relative p-3 rounded-lg border-2 transition-all duration-200 ${
                                isSelected
                                    ? 'bg-red-600 border-red-400 shadow-lg shadow-red-500/25'
                                    : isMilestone
                                        ? 'bg-yellow-600/20 border-yellow-500 hover:bg-yellow-600/30'
                                        : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                            }`}
                        >
                            <div className={`text-center ${isSelected ? 'text-white' : isMilestone ? 'text-yellow-300' : 'text-gray-300'}`}>
                                <div className='font-bold text-lg'>{level}</div>
                                {isMilestone && (
                                    <div className='text-xs mt-1 opacity-75'>{getMilestoneIcon(level)}</div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {data.level && (
                <div className='bg-gray-700/50 border border-gray-600 rounded-lg p-4 max-w-2xl mx-auto'>
                    <div className='text-center'>
                        <h4 className='text-lg font-bold text-yellow-300 mb-2'>Level {data.level}</h4>
                        <p className='text-gray-300'>{getLevelDescription(data.level)}</p>
                        {milestoneLevels.includes(data.level) && (
                            <div className='mt-3 p-2 bg-yellow-600/20 border border-yellow-500 rounded'>
                                <p className='text-yellow-300 text-sm font-semibold'>🎯 Milestone Level</p>
                                <p className='text-yellow-200 text-xs mt-1'>
                                    {data.level === 2 && "Gain your class's signature feature (Fighting Style, Spellcasting, etc.)"}
                                    {data.level === 3 && "Choose your subclass to specialize your abilities"}
                                    {data.level === 4 && "Ability Score Improvement (+2) or take a Feat"}
                                    {data.level === 5 && "Extra Attack - make two attacks per turn"}
                                    {data.level === 6 && "Enhanced subclass features and abilities"}
                                    {data.level === 8 && "Ability Score Improvement (+2) or take a Feat"}
                                    {data.level === 11 && "Ability Score Improvement (+2) or take a Feat"}
                                    {data.level === 12 && "Enhanced subclass features and abilities"}
                                    {data.level === 14 && "Ability Score Improvement (+2) or take a Feat"}
                                    {data.level === 16 && "Ability Score Improvement (+2) or take a Feat"}
                                    {data.level === 17 && "Enhanced subclass features and abilities"}
                                    {data.level === 19 && "Ability Score Improvement (+2) or take a Feat"}
                                    {data.level === 20 && "Epic capstone features and legendary abilities"}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className='flex justify-end'>
                <button
                    onClick={nextStep}
                    disabled={!data.level}
                    className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg text-white flex items-center disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                    Next: Basic Identity <ArrowRight className="w-5 h-5 ml-2" />
                </button>
            </div>
        </div>
    );
};

const Step1Details: React.FC<StepProps> = ({ data, updateData, nextStep }) => {
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
                            // Randomize the entire character
                            const level = randomizeLevel();
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
                                level,
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
                Next: Choose Race
            </button>
        </div>
    );
};

const Step2Race: React.FC<StepProps> = ({ data, updateData, nextStep, prevStep }) => {
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Core Races']));
    const [showRaceInfo, setShowRaceInfo] = useState(true);

    const selectedRace = getAllRaces().find(r => r.slug === data.raceSlug);

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

    return (
        <div className='space-y-6'>
            <div className='flex justify-between items-center'>
                <h3 className='text-xl font-bold text-red-300'>Select Race (Racial Bonuses will be applied automatically)</h3>
                <RandomizeButton
                    onClick={() => updateData({ raceSlug: randomizeRace() })}
                    title="Randomize race selection"
                />
            </div>

            {/* Race Categories */}
            <div className='space-y-3'>
                {RACE_CATEGORIES.map(category => (
                    <div key={category.name} className='border border-gray-600 rounded-lg overflow-hidden'>
                        {/* Category Header */}
                        <button
                            onClick={() => toggleCategory(category.name)}
                            className='w-full p-4 bg-gray-700 hover:bg-gray-650 flex items-center justify-between transition-colors'
                        >
                            <div className='flex items-center gap-3'>
                                <span className='text-2xl'>{category.icon}</span>
                                <div className='text-left'>
                                    <div className='font-bold text-yellow-300 text-lg'>{category.name}</div>
                                    <div className='text-xs text-gray-400'>{category.description}</div>
                                </div>
                            </div>
                            {expandedCategories.has(category.name) ? (
                                <ChevronUp className='w-5 h-5 text-gray-400' />
                            ) : (
                                <ChevronDown className='w-5 h-5 text-gray-400' />
                            )}
                        </button>

                        {/* Category Races */}
                        {expandedCategories.has(category.name) && (
                            <div className='p-4 bg-gray-800/50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
                                {category.races.map(race => (
                                    <button
                                        key={race.slug}
                                        onClick={() => updateData({ raceSlug: race.slug })}
                                        className={`p-3 rounded-lg text-left border-2 transition-all ${
                                            data.raceSlug === race.slug
                                                ? 'bg-red-800 border-red-500 shadow-md'
                                                : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                                        }`}
                                    >
                                        <p className='text-sm font-bold text-yellow-300'>{race.name}</p>
                                        <p className='text-xs text-gray-500 mt-1'>{race.source}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Selected Race Details */}
            {selectedRace && showRaceInfo && (
                <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 space-y-3 relative">
                    <button
                        onClick={() => setShowRaceInfo(false)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
                        title="Close"
                    >
                        <XCircle className="w-5 h-5" />
                    </button>

                    <div className="flex items-start justify-between pr-8">
                        <div>
                            <h4 className="text-lg font-bold text-yellow-300">{selectedRace.name}</h4>
                            <p className="text-xs text-gray-500">{selectedRace.source}</p>
                        </div>
                    </div>

                    <p className="text-sm text-gray-300">{selectedRace.description}</p>

                    <div className="space-y-2 text-sm">
                        <div>
                            <span className="font-semibold text-red-400">Ability Bonuses: </span>
                            <span className="text-gray-300">
                                {Object.entries(selectedRace.ability_bonuses)
                                    .map(([ability, bonus]) => `${ability} +${bonus}`)
                                    .join(', ')}
                            </span>
                        </div>

                        <div>
                            <span className="font-semibold text-red-400">Racial Traits: </span>
                            <ul className="list-disc list-inside text-gray-300 ml-4">
                                {selectedRace.racial_traits.map((trait, idx) => (
                                    <li key={idx} className="text-xs">{trait}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="pt-2 border-t border-gray-600">
                            <div className="font-semibold text-yellow-400 mb-1">Typical Roles:</div>
                            <p className="text-xs text-gray-400">{selectedRace.typicalRoles.join(', ')}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className='flex justify-between'>
                <button onClick={prevStep} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white flex items-center">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </button>
                <button
                    onClick={nextStep}
                    disabled={!data.raceSlug}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white flex items-center disabled:bg-gray-600"
                >
                    Next: Choose Class <ArrowRight className="w-4 h-4 ml-2" />
                </button>
            </div>
        </div>
    );
};

const Step3Class: React.FC<StepProps> = ({ data, updateData, nextStep, prevStep }) => {
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Core Classes']));
    const [showClassInfo, setShowClassInfo] = useState(true);

    const allClasses = loadClasses();
    const selectedClass = allClasses.find(c => c.slug === data.classSlug);

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

    return (
        <div className='space-y-6'>
            <div className='flex justify-between items-center'>
                <h3 className='text-xl font-bold text-red-300'>Select Class (Hit Die and Starting Proficiencies)</h3>
                <RandomizeButton
                    onClick={() => {
                        const classAndSkills = randomizeClassAndSkills();
                        updateData({
                            classSlug: classAndSkills.classSlug,
                            selectedSkills: classAndSkills.selectedSkills,
                            subclassSlug: classAndSkills.subclassSlug
                        });
                    }}
                    title="Randomize class, skills, and subclass"
                />
            </div>

            {/* Class Categories */}
            <div className='space-y-3'>
                {CLASS_CATEGORIES.map(category => (
                    <div key={category.name} className='border border-gray-600 rounded-lg overflow-hidden'>
                        {/* Category Header */}
                        <button
                            onClick={() => toggleCategory(category.name)}
                            className='w-full p-4 bg-gray-700 hover:bg-gray-650 flex items-center justify-between transition-colors'
                        >
                            <div className='flex items-center gap-3'>
                                <span className='text-2xl'>{category.icon}</span>
                                <div className='text-left'>
                                    <div className='font-bold text-yellow-300 text-lg'>{category.name}</div>
                                    <div className='text-xs text-gray-400'>{category.description}</div>
                                </div>
                            </div>
                            {expandedCategories.has(category.name) ? (
                                <ChevronUp className='w-5 h-5 text-gray-400' />
                            ) : (
                                <ChevronDown className='w-5 h-5 text-gray-400' />
                            )}
                        </button>

                        {/* Category Classes */}
                        {expandedCategories.has(category.name) && (
                            <div className='p-4 bg-gray-800/50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
                                {category.classes.map(_class => (
                                    <button
                                        key={_class.slug}
                                        onClick={() => updateData({ classSlug: _class.slug })}
                                        className={`p-3 rounded-lg text-left border-2 transition-all ${
                                            data.classSlug === _class.slug
                                                ? 'bg-red-800 border-red-500 shadow-md'
                                                : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                                        }`}
                                    >
                                        <p className='text-sm font-bold text-yellow-300'>{_class.name}</p>
                                        <p className='text-xs text-gray-500 mt-1'>Hit Die: d{_class.hit_die}</p>
                                        <p className='text-xs text-gray-500'>{_class.primary_stat}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Selected Class Details */}
            {selectedClass && showClassInfo && (
                <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 space-y-3 relative">
                    <button
                        onClick={() => setShowClassInfo(false)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
                        title="Close"
                    >
                        <XCircle className="w-5 h-5" />
                    </button>

                    <div className="flex items-start justify-between pr-8">
                        <div>
                            <h4 className="text-lg font-bold text-yellow-300">{selectedClass.name}</h4>
                            <p className="text-xs text-gray-500">{selectedClass.source}</p>
                        </div>
                    </div>

                    <p className="text-sm text-gray-300">{selectedClass.description}</p>

                    <div className="space-y-2 text-sm">
                        <div>
                            <span className="font-semibold text-red-400">Hit Die: </span>
                            <span className="text-gray-300">d{selectedClass.hit_die}</span>
                        </div>

                        <div>
                            <span className="font-semibold text-red-400">Primary Ability: </span>
                            <span className="text-gray-300">{selectedClass.primary_stat}</span>
                        </div>

                        <div>
                            <span className="font-semibold text-red-400">Saving Throws: </span>
                            <span className="text-gray-300">{selectedClass.save_throws.join(', ')}</span>
                        </div>

                        <div>
                            <span className="font-semibold text-red-400">Key Features: </span>
                            <ul className="list-disc list-inside text-gray-300 ml-4">
                                {selectedClass.class_features.slice(0, 4).map((feature, idx) => (
                                    <li key={idx} className="text-xs">{feature}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="pt-2 border-t border-gray-600">
                            <div className="font-semibold text-yellow-400 mb-1">Key Role:</div>
                            <p className="text-xs text-gray-400">{selectedClass.keyRole}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Skill Selection */}
            {selectedClass && (
                <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 space-y-3">
                    <h4 className="text-lg font-bold text-yellow-300">
                        Choose Skills ({data.selectedSkills.length} / {(selectedClass.num_skill_choices || 0)} selected)
                    </h4>
                    <p className="text-xs text-gray-400">
                        Select {(selectedClass.num_skill_choices || 0)} skill{(selectedClass.num_skill_choices || 0) !== 1 ? 's' : ''} from your class options.
                        Skills from your background are automatically granted.
                    </p>

                     {/* Background Skills (Auto-granted) */}
                     {(() => {
                         const backgroundData = BACKGROUNDS.find(bg => bg.name === data.background);
                         const backgroundSkills = backgroundData?.skill_proficiencies || [];

                         if (backgroundSkills.length > 0) {
                            return (
                                <div className="p-3 bg-green-900/20 border border-green-700 rounded-lg">
                                    <div className="text-xs font-semibold text-green-400 mb-2">
                                        Background Skills (Auto-granted from {data.background}):
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {backgroundSkills.map(skill => (
                                            <span key={skill} className="px-2 py-1 bg-green-700 text-white text-xs rounded">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })()}

                    {/* Class Skill Selection */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {selectedClass.skill_proficiencies.map(skill => {
                            const backgroundData = BACKGROUNDS.find(bg => bg.name === data.background);
                            const backgroundSkills = backgroundData?.skill_proficiencies || [];
                            const isBackgroundSkill = backgroundSkills.includes(skill);
                            const isSelected = data.selectedSkills.includes(skill as SkillName);
                            const canSelect = data.selectedSkills.length < (selectedClass.num_skill_choices || 0);

                            return (
                                <button
                                    key={skill}
                                    onClick={() => {
                                        if (isBackgroundSkill) return; // Can't select background skills

                                        if (isSelected) {
                                            // Deselect
                                            updateData({
                                                selectedSkills: data.selectedSkills.filter(s => s !== skill)
                                            });
                                        } else if (canSelect) {
                                            // Select
                                            updateData({
                                                selectedSkills: [...data.selectedSkills, skill as SkillName]
                                            });
                                        }
                                    }}
                                    disabled={isBackgroundSkill}
                                    className={`p-2 rounded-lg text-sm border-2 transition-all ${
                                        isBackgroundSkill
                                            ? 'bg-green-900/20 border-green-700 text-green-400 cursor-not-allowed opacity-60'
                                            : isSelected
                                            ? 'bg-blue-800 border-blue-500 text-white'
                                            : canSelect
                                            ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-300'
                                            : 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                                    }`}
                                    title={isBackgroundSkill ? 'Already granted by background' : ''}
                                >
                                    {skill}
                                    {isBackgroundSkill && <span className="ml-1 text-xs">(BG)</span>}
                                </button>
                            );
                        })}
                    </div>

                    {data.selectedSkills.length < (selectedClass.num_skill_choices || 0) && (
                        <div className="text-xs text-yellow-400 mt-2">
                            ⚠️ Please select {((selectedClass.num_skill_choices || 0) - data.selectedSkills.length)} more skill{((selectedClass.num_skill_choices || 0) - data.selectedSkills.length) !== 1 ? 's' : ''}
                        </div>
                    )}
                </div>
            )}

            {/* Subclass Selection */}
            {selectedClass && (() => {
                const availableSubclasses = getSubclassesByClass(data.classSlug);

                if (availableSubclasses.length === 0) return null;

                return (
                    <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 space-y-3">
                        <div>
                            <h4 className="text-lg font-bold text-yellow-300">Choose Subclass</h4>
                            <p className="text-xs text-gray-400 mt-1">
                                Select your {selectedClass.name} subclass specialization
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {availableSubclasses.map(subclass => (
                                <button
                                    key={subclass.slug}
                                    onClick={() => updateData({ subclassSlug: subclass.slug })}
                                    className={`p-3 rounded-lg text-left border-2 transition-all ${
                                        data.subclassSlug === subclass.slug
                                            ? 'bg-purple-800 border-purple-500 shadow-md'
                                            : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                                    }`}
                                >
                                    <p className="text-sm font-bold text-yellow-300">{subclass.name}</p>
                                    <p className="text-xs text-gray-400 mt-1">{subclass.subclassFlavor}</p>
                                    {subclass.desc && subclass.desc.length > 0 && (
                                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                                            {subclass.desc[0]}
                                        </p>
                                    )}
                                </button>
                            ))}
                        </div>

                        {!data.subclassSlug && (
                            <div className="text-xs text-yellow-400 mt-2">
                                ⚠️ Please select a subclass
                            </div>
                        )}
                    </div>
                );
            })()}

            <div className='flex justify-between'>
                <button onClick={prevStep} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white flex items-center">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </button>
                <button
                    onClick={nextStep}
                    disabled={
                        !data.classSlug ||
                        !selectedClass ||
                        data.selectedSkills.length < (selectedClass.num_skill_choices || 0) ||
                        (getSubclassesByClass(data.classSlug).length > 0 && !data.subclassSlug)
                    }
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white flex items-center disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    Next: Abilities <ArrowRight className="w-4 h-4 ml-2" />
                </button>
            </div>
        </div>
    );
};

// Sprint 5: Fighting Style Selection Step (for Fighter, Paladin, Ranger)
const Step3point5FightingStyle: React.FC<StepProps> = ({ data, updateData, nextStep, prevStep }) => {
    const allClasses = loadClasses();
    const selectedClass = allClasses.find(c => c.slug === data.classSlug);
    const hasProcessedAutoAdvance = React.useRef(false);

    // Define fighting styles available in SRD
    const FIGHTING_STYLES = [
        {
            name: 'Archery',
            description: 'You gain a +2 bonus to attack rolls you make with ranged weapons.',
            recommendedFor: ['ranger']
        },
        {
            name: 'Defense',
            description: 'While you are wearing armor, you gain a +1 bonus to AC.',
            recommendedFor: ['paladin']
        },
        {
            name: 'Dueling',
            description: 'When you are wielding a melee weapon in one hand and no other weapons, you gain a +2 bonus to damage rolls with that weapon.',
            recommendedFor: ['fighter']
        },
        {
            name: 'Great Weapon Fighting',
            description: 'When you roll a 1 or 2 on a damage die for an attack you make with a melee weapon that you are wielding with two hands, you can reroll the die and must use the new roll. The weapon must have the two-handed or versatile property.',
            recommendedFor: ['fighter']
        },
        {
            name: 'Protection',
            description: 'When a creature you can see attacks a target other than you that is within 5 feet of you, you can use your reaction to impose disadvantage on the attack roll. You must be wielding a shield.',
            recommendedFor: ['paladin']
        },
        {
            name: 'Two-Weapon Fighting',
            description: 'When you engage in two-weapon fighting, you can add your ability modifier to the damage of the second attack.',
            recommendedFor: ['ranger']
        }
    ];

    // Check if this class gets a fighting style
    const hasFightingStyle = selectedClass && ['fighter', 'paladin', 'ranger'].includes(selectedClass.slug);

    // Get recommended style for this class
    const recommendedStyle = selectedClass ? FIGHTING_STYLES.find(style =>
        style.recommendedFor.includes(selectedClass.slug)
    ) : undefined;

    // Set default if not already selected
    React.useEffect(() => {
        if (!data.selectedFightingStyle && recommendedStyle) {
            updateData({ selectedFightingStyle: recommendedStyle.name });
        }

    }, [recommendedStyle, data.selectedFightingStyle, updateData]);

    // Auto-skip if class doesn't get fighting style (only on first mount)
    React.useEffect(() => {
        if (!hasProcessedAutoAdvance.current && !hasFightingStyle) {
            hasProcessedAutoAdvance.current = true;
            nextStep();
        }
    }, [hasFightingStyle, nextStep]);

    if (!hasFightingStyle) {
        return <div className='text-center text-gray-400'>This class doesn't have Fighting Styles. Advancing...</div>;
    }

    return (
        <div className='space-y-6'>
            <div className='flex justify-between items-start'>
                <div>
                    <h3 className='text-xl font-bold text-red-300'>Choose Fighting Style</h3>
                    <p className='text-sm text-gray-400 mt-2'>
                        As a {selectedClass.name}, you learn a particular style of fighting. Select one Fighting Style option.
                    </p>
                </div>
                <RandomizeButton
                    onClick={() => {
                        const fightingStyle = randomizeFightingStyle(data.classSlug);
                        updateData({ selectedFightingStyle: fightingStyle });
                    }}
                    title="Randomize fighting style"
                />
            </div>

            {recommendedStyle && (
                <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3">
                    <div className="text-sm text-blue-300">
                        💡 <strong>Recommended for {selectedClass.name}:</strong> {recommendedStyle.name}
                        <br />
                        <span className="text-xs text-gray-400">
                            (This is a smart default, but you can choose any style below)
                        </span>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {FIGHTING_STYLES.map(style => {
                    const isSelected = data.selectedFightingStyle === style.name;
                    const isRecommended = style.recommendedFor.includes(selectedClass.slug);

                    return (
                        <button
                            key={style.name}
                            onClick={() => updateData({ selectedFightingStyle: style.name })}
                            className={`p-4 rounded-lg text-left border-2 transition-all ${
                                isSelected
                                    ? 'bg-orange-800 border-orange-500 shadow-md'
                                    : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <p className="text-base font-bold text-yellow-300">{style.name}</p>
                                {isRecommended && (
                                    <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded ml-2">
                                        Recommended
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-300 mt-2">{style.description}</p>
                        </button>
                    );
                })}
            </div>

            <div className='flex justify-between'>
                <button onClick={prevStep} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white flex items-center">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </button>
                <button
                    onClick={nextStep}
                    disabled={!data.selectedFightingStyle}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white flex items-center disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    Next: {selectedClass.spellcasting ? 'Spells' : 'Abilities'} <ArrowRight className="w-4 h-4 ml-2" />
                </button>
            </div>
        </div>
    );
};

const Step4Abilities: React.FC<StepProps> = ({ data, updateData, nextStep, prevStep }) => {
    const allRaces = getAllRaces();
    const raceData = allRaces.find(r => r.slug === data.raceSlug);
    const abilityNames = Object.keys(data.abilities) as AbilityName[];

    // Method-specific data
    const standardArrayScores = useMemo(() => [15, 14, 13, 12, 10, 8], []);
    const [pointBuyPoints, setPointBuyPoints] = useState(27);
    const [rolledSets, setRolledSets] = useState<number[][]>([]);

    // Check if abilities are complete
    const isComplete = Object.values(data.abilities).every(score => score > 0);

    // Handle method change
    const handleMethodChange = (method: CharacterCreationData['abilityScoreMethod']) => {
        const resetAbilities = method === 'point-buy'
            ? { STR: 8, DEX: 8, CON: 8, INT: 8, WIS: 8, CHA: 8 }
            : { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 };

        updateData({
            abilityScoreMethod: method,
            abilities: resetAbilities
        });
        setRolledSets([]);
        setPointBuyPoints(27);
    };

    // Standard Array: assign scores from predefined array
    const availableScores = standardArrayScores.filter(s => !Object.values(data.abilities).includes(s));

    const handleAssignScore = (ability: AbilityName, score: number) => {
        const currentScore = data.abilities[ability];

        if (currentScore === 0 && availableScores.includes(score)) {
            updateData({ abilities: { ...data.abilities, [ability]: score } });
            return;
        }

        const abilityToSwap = (Object.keys(data.abilities) as AbilityName[]).find(a => data.abilities[a] === score);

        if (abilityToSwap) {
            updateData({
                abilities: {
                    ...data.abilities,
                    [ability]: score,
                    [abilityToSwap]: currentScore
                }
            });
        }
    };

    // Dice rolling methods
    const rollAbilityScores = (method: 'standard-roll' | 'classic-roll' | '5d6-drop-2') => {
        const sets: number[][] = [];

        for (let i = 0; i < 6; i++) {
            let rolls: number[];

            if (method === 'standard-roll') {
                // 4d6, drop lowest
                rolls = rollDice(4, 6).sort((a, b) => b - a).slice(0, 3);
            } else if (method === 'classic-roll') {
                // 3d6 straight
                rolls = rollDice(3, 6);
            } else {
                // 5d6, drop two lowest
                rolls = rollDice(5, 6).sort((a, b) => b - a).slice(0, 3);
            }

            sets.push(rolls);
        }

        setRolledSets(sets);

        // Auto-assign in order for classic roll
        if (method === 'classic-roll') {
            const scores = sets.map(s => s.reduce((a, b) => a + b, 0));
            updateData({
                abilities: {
                    STR: scores[0],
                    DEX: scores[1],
                    CON: scores[2],
                    INT: scores[3],
                    WIS: scores[4],
                    CHA: scores[5]
                }
            });
        }
    };

    // Assign rolled score
    const handleAssignRolledScore = (ability: AbilityName, setIndex: number) => {
        const score = rolledSets[setIndex].reduce((a, b) => a + b, 0);
        const currentScore = data.abilities[ability];

        // Find if this score is already assigned
        const assignedIndex = abilityNames.findIndex(a => {
            const abilityScore = data.abilities[a];
            return rolledSets.findIndex(set => set.reduce((sum, n) => sum + n, 0) === abilityScore) === setIndex;
        });

        if (assignedIndex !== -1) {
            // Swap
            const otherAbility = abilityNames[assignedIndex];
            updateData({
                abilities: {
                    ...data.abilities,
                    [ability]: score,
                    [otherAbility]: currentScore
                }
            });
        } else {
            updateData({ abilities: { ...data.abilities, [ability]: score } });
        }
    };

    // Point Buy
    const pointBuyCosts: Record<number, number> = {
        8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9
    };

    const handlePointBuyChange = (ability: AbilityName, newScore: number) => {
        const oldScore = data.abilities[ability];
        const oldCost = pointBuyCosts[oldScore] || 0;
        const newCost = pointBuyCosts[newScore];
        const pointDiff = newCost - oldCost;

        if (pointBuyPoints - pointDiff >= 0) {
            updateData({ abilities: { ...data.abilities, [ability]: newScore } });
            setPointBuyPoints(pointBuyPoints - pointDiff);
        }
    };

    // Custom input
    const handleCustomInput = (ability: AbilityName, value: string) => {
        const score = parseInt(value) || 0;
        if (score >= 0 && score <= 20) {
            updateData({ abilities: { ...data.abilities, [ability]: score } });
        }
    };

    // Method titles
    const methodTitles: Record<CharacterCreationData['abilityScoreMethod'], string> = {
        'standard-array': 'Standard Array',
        'standard-roll': '4d6, Drop Lowest',
        'classic-roll': '3d6 in Order',
        '5d6-drop-2': '5d6, Drop Two Lowest',
        'point-buy': 'Point Buy (27 Points)',
        'custom': 'Custom Entry'
    };

    return (
        <div className='space-y-6'>
            {/* Method Selection Dropdown */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Ability Score Method</label>
                <select
                    value={data.abilityScoreMethod}
                    onChange={(e) => handleMethodChange(e.target.value as CharacterCreationData['abilityScoreMethod'])}
                    className="w-full p-3 bg-gray-700 text-white rounded-lg font-semibold text-lg"
                >
                    {Object.entries(methodTitles).map(([key, title]) => (
                        <option key={key} value={key}>{title}</option>
                    ))}
                </select>
            </div>

            <div className='flex justify-between items-center'>
                <h3 className='text-xl font-bold text-red-300'>
                    Determine Ability Scores ({methodTitles[data.abilityScoreMethod]})
                </h3>
                <RandomizeButton
                    onClick={() => {
                        const abilities = randomizeAbilities();
                        updateData(abilities);
                    }}
                    title="Randomize ability scores and method"
                />
            </div>

            {/* Standard Array UI */}
            {data.abilityScoreMethod === 'standard-array' && (
                <>
                    <div className='flex flex-wrap gap-2 mb-4 p-3 bg-gray-700 rounded-lg'>
                        <span className='text-sm font-semibold text-gray-400 mr-2'>Scores to Assign:</span>
                        {standardArrayScores.map(s => (
                            <span key={s} className={`px-3 py-1 text-lg font-bold rounded-full ${availableScores.includes(s) ? 'bg-yellow-500 text-gray-900' : 'bg-gray-600 text-gray-400'}`}>
                                {s}
                            </span>
                        ))}
                    </div>

                    <div className='grid grid-cols-2 gap-4'>
                        {abilityNames.map(ability => {
                            const baseScore = data.abilities[ability];
                            const racialBonus = raceData?.ability_bonuses[ability] || 0;
                            const finalScore = baseScore + racialBonus;
                            const modifier = getModifier(finalScore);

                            return (
                                <div key={ability} className='p-3 bg-gray-800 rounded-lg border-l-4 border-red-500'>
                                    <p className='text-lg font-bold text-red-400 mb-1'>{ability}</p>
                                    <div className='flex items-center justify-between'>
                                        <select
                                            value={baseScore}
                                            onChange={(e) => handleAssignScore(ability, parseInt(e.target.value))}
                                            className="p-2 bg-gray-700 rounded-lg text-white font-mono"
                                        >
                                            <option value={0}>Select...</option>
                                            {standardArrayScores.map(s => (
                                                <option
                                                    key={s}
                                                    value={s}
                                                    disabled={baseScore !== s && !availableScores.includes(s)}
                                                >
                                                    {s}
                                                </option>
                                            ))}
                                        </select>

                                        <span className='text-xl text-yellow-300 font-bold'>
                                            {baseScore > 0 && `${finalScore} (${formatModifier(modifier)})`}
                                        </span>
                                    </div>
                                    {racialBonus > 0 && baseScore > 0 && <p className='text-xs text-green-400 mt-1'>+ {racialBonus} (Racial)</p>}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Dice Rolling UIs */}
            {(data.abilityScoreMethod === 'standard-roll' || data.abilityScoreMethod === 'classic-roll' || data.abilityScoreMethod === '5d6-drop-2') && (
                <>
                    <button
                        onClick={() => rollAbilityScores(data.abilityScoreMethod as 'standard-roll' | 'classic-roll' | '5d6-drop-2')}
                        className="w-full p-3 bg-purple-600 hover:bg-purple-500 rounded-lg text-white font-bold flex items-center justify-center gap-2"
                    >
                        <Dice6 className="w-5 h-5" />
                        {rolledSets.length === 0 ? 'Roll Ability Scores' : 'Re-roll All Scores'}
                    </button>

                    {rolledSets.length > 0 && (
                        <>
                            {data.abilityScoreMethod !== 'classic-roll' && (
                                <div className='p-3 bg-gray-700 rounded-lg'>
                                    <span className='text-sm font-semibold text-gray-400'>Rolled Sets (assign to abilities):</span>
                                    <div className='flex flex-wrap gap-2 mt-2'>
                                        {rolledSets.map((set, idx) => {
                                            const total = set.reduce((a, b) => a + b, 0);
                                            const isAssigned = Object.values(data.abilities).includes(total);
                                            return (
                                                <div key={idx} className={`px-3 py-2 rounded-lg ${isAssigned ? 'bg-gray-600' : 'bg-yellow-500 text-gray-900'}`}>
                                                    <div className='text-xs font-mono'>[{set.join(', ')}]</div>
                                                    <div className='text-lg font-bold text-center'>{total}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className='grid grid-cols-2 gap-4'>
                                {abilityNames.map((ability, idx) => {
                                    const baseScore = data.abilities[ability];
                                    const racialBonus = raceData?.ability_bonuses[ability] || 0;
                                    const finalScore = baseScore + racialBonus;
                                    const modifier = getModifier(finalScore);

                                    return (
                                        <div key={ability} className='p-3 bg-gray-800 rounded-lg border-l-4 border-red-500'>
                                            <p className='text-lg font-bold text-red-400 mb-1'>{ability}</p>
                                            <div className='flex items-center justify-between'>
                                                {data.abilityScoreMethod === 'classic-roll' ? (
                                                    <div className='text-sm font-mono text-gray-400'>
                                                        [{rolledSets[idx]?.join(', ')}]
                                                    </div>
                                                ) : (
                                                    <select
                                                        value={baseScore}
                                                        onChange={(e) => handleAssignRolledScore(ability, parseInt(e.target.value))}
                                                        className="p-2 bg-gray-700 rounded-lg text-white font-mono"
                                                    >
                                                        <option value={0}>Select...</option>
                                                        {rolledSets.map((set, setIdx) => {
                                                            const total = set.reduce((a, b) => a + b, 0);
                                                            return (
                                                                <option key={setIdx} value={setIdx}>
                                                                    {total} [{set.join(', ')}]
                                                                </option>
                                                            );
                                                        })}
                                                    </select>
                                                )}

                                                <span className='text-xl text-yellow-300 font-bold'>
                                                    {baseScore > 0 && `${finalScore} (${formatModifier(modifier)})`}
                                                </span>
                                            </div>
                                            {racialBonus > 0 && baseScore > 0 && <p className='text-xs text-green-400 mt-1'>+ {racialBonus} (Racial)</p>}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </>
            )}

            {/* Point Buy UI */}
            {data.abilityScoreMethod === 'point-buy' && (
                <>
                    <div className='p-4 bg-purple-900/30 border border-purple-500 rounded-lg'>
                        <div className='flex justify-between items-center'>
                            <span className='text-sm font-semibold text-gray-300'>Points Remaining:</span>
                            <span className='text-3xl font-bold text-yellow-300'>{pointBuyPoints}</span>
                        </div>
                        <p className='text-xs text-gray-400 mt-2'>Scores range from 8-15. Higher scores cost more points.</p>
                    </div>

                    <div className='grid grid-cols-2 gap-4'>
                        {abilityNames.map(ability => {
                            const baseScore = data.abilities[ability] || 8;
                            const racialBonus = raceData?.ability_bonuses[ability] || 0;
                            const finalScore = baseScore + racialBonus;
                            const modifier = getModifier(finalScore);

                            return (
                                <div key={ability} className='p-3 bg-gray-800 rounded-lg border-l-4 border-red-500'>
                                    <p className='text-lg font-bold text-red-400 mb-1'>{ability}</p>
                                    <div className='flex items-center justify-between'>
                                        <select
                                            value={baseScore}
                                            onChange={(e) => handlePointBuyChange(ability, parseInt(e.target.value))}
                                            className="p-2 bg-gray-700 rounded-lg text-white font-mono"
                                        >
                                            {Object.keys(pointBuyCosts).map(score => {
                                                const s = parseInt(score);
                                                const cost = pointBuyCosts[s];
                                                const currentCost = pointBuyCosts[baseScore] || 0;
                                                const wouldExceed = (cost - currentCost) > pointBuyPoints;

                                                return (
                                                    <option key={s} value={s} disabled={wouldExceed && baseScore !== s}>
                                                        {s} ({cost} pts)
                                                    </option>
                                                );
                                            })}
                                        </select>

                                        <span className='text-xl text-yellow-300 font-bold'>
                                            {finalScore} ({formatModifier(modifier)})
                                        </span>
                                    </div>
                                    {racialBonus > 0 && <p className='text-xs text-green-400 mt-1'>+ {racialBonus} (Racial)</p>}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Custom Entry UI */}
            {data.abilityScoreMethod === 'custom' && (
                <>
                    <div className='p-3 bg-yellow-900/30 border border-yellow-500 rounded-lg'>
                        <p className='text-sm text-yellow-200'>
                            <span className='font-bold'>DM Override:</span> Enter custom ability scores (1-20). Consult with your DM.
                        </p>
                    </div>

                    <div className='grid grid-cols-2 gap-4'>
                        {abilityNames.map(ability => {
                            const baseScore = data.abilities[ability];
                            const racialBonus = raceData?.ability_bonuses[ability] || 0;
                            const finalScore = baseScore + racialBonus;
                            const modifier = getModifier(finalScore);

                            return (
                                <div key={ability} className='p-3 bg-gray-800 rounded-lg border-l-4 border-red-500'>
                                    <p className='text-lg font-bold text-red-400 mb-1'>{ability}</p>
                                    <div className='flex items-center justify-between'>
                                        <input
                                            type="number"
                                            min="1"
                                            max="20"
                                            value={baseScore || ''}
                                            onChange={(e) => handleCustomInput(ability, e.target.value)}
                                            className="p-2 bg-gray-700 rounded-lg text-white font-mono w-20"
                                            placeholder="0"
                                        />

                                        <span className='text-xl text-yellow-300 font-bold'>
                                            {baseScore > 0 && `${finalScore} (${formatModifier(modifier)})`}
                                        </span>
                                    </div>
                                    {racialBonus > 0 && baseScore > 0 && <p className='text-xs text-green-400 mt-1'>+ {racialBonus} (Racial)</p>}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            <div className='flex justify-between'>
                <button onClick={prevStep} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white flex items-center">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </button>
                <button
                    onClick={nextStep}
                    disabled={!isComplete}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white flex items-center disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    Next: Feats <ArrowRight className="w-4 h-4 ml-2" />
                </button>
            </div>
        </div>
    );
};











interface EquipmentBrowserProps {
    data: CharacterCreationData;
    updateData: (updates: Partial<CharacterCreationData>) => void;
    prevStep: () => void;
    skipToStep?: (step: number) => void;
}



// --- Main Wizard Component (Now in separate module) ---


/** Main Application Component */
const App: React.FC = () => {
  // Use DiceContext for dice rolling functionality
  const { rollHistory, latestRoll, rollDice, clearHistory } = useDiceContext();

  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<Set<string>>(new Set());
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [rollResult, setRollResult] = useState<{
    text: string;
    value: number | null;
    details?: Array<{ value: number; kept: boolean; critical?: 'success' | 'failure' }>
  }>({ text: 'Ready to Roll!', value: null });
  const [featureModal, setFeatureModal] = useState<{name: string, description: string, source?: string} | null>(null);
  const [equipmentModal, setEquipmentModal] = useState<Equipment | null>(null);
  const [cantripModalState, setCantripModalState] = useState<{isOpen: boolean, characterId: string | null, characterClass: string | null}>({ isOpen: false, characterId: null, characterClass: null });
  const [subclassModalState, setSubclassModalState] = useState<{isOpen: boolean, characterId: string | null, characterClass: string | null}>({ isOpen: false, characterId: null, characterClass: null });
  const [asiModalState, setAsiModalState] = useState<{isOpen: boolean, characterId: string | null}>({ isOpen: false, characterId: null });

  const selectedCharacter = useMemo(() => {
    return characters.find(c => c.id === selectedCharacterId);
  }, [characters, selectedCharacterId]);

  // Handle feature click
  const handleFeatureClick = useCallback((feature: string | Feature) => {
    const featureName = typeof feature === 'string' ? feature : feature.name;

    // Try to find the feature in SRD data first
    const allFeatures = loadFeatures();
    const srdFeature = allFeatures.find(f => f.name === featureName);

    if (srdFeature && srdFeature.desc && srdFeature.desc.length > 0) {
      setFeatureModal({
        name: featureName,
        description: srdFeature.desc.join('\n\n'),
        source: 'SRD'
      });
    } else {
      // Fallback to manual descriptions
      const featureDesc = featureDescriptions[featureName];
      if (featureDesc) {
        setFeatureModal({ name: featureName, ...featureDesc });
      } else {
        setFeatureModal({ name: featureName, description: 'No description available for this feature.' });
      }
    }
  }, []);

  // Handle dice roll - use DiceContext's rollDice function
  const handleDiceRoll = useCallback((roll: DiceRoll) => {
    rollDice(roll);
  }, [rollDice]);

  // Load characters from IndexedDB
  const loadCharacters = useCallback(async () => {
    try {
      const chars = await getAllCharacters();
      setCharacters(chars);
    } catch (e) {
      console.error("Error loading characters:", e);
    }
  }, []);

  useEffect(() => {
    loadCharacters();
  }, [loadCharacters]);

  // Toggle character selection for export
  const toggleCharacterSelection = useCallback((id: string) => {
    setSelectedCharacterIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // CRUD Operations
  const handleDeleteCharacter = useCallback(async (id: string) => {
    const character = characters.find(c => c.id === id);
    const characterName = character?.name || 'this character';

    if (!window.confirm(`Are you sure you want to delete ${characterName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteCharacter(id);
      setSelectedCharacterId(null);
      setRollResult({ text: 'Character deleted successfully.', value: null });
      await loadCharacters();
    } catch (e) {
      console.error("Error deleting character:", e);
      setRollResult({ text: 'Error deleting character.', value: null });
    }
  }, [characters, loadCharacters]);

  // Export selected characters (or all if none selected) as JSON
  const handleExportData = useCallback(() => {
    const charactersToExport = selectedCharacterIds.size > 0
      ? characters.filter(c => selectedCharacterIds.has(c.id))
      : characters;

    const dataStr = JSON.stringify(charactersToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `5e_characters_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    const exportCount = charactersToExport.length;
    const message = selectedCharacterIds.size > 0
      ? `${exportCount} selected character${exportCount !== 1 ? 's' : ''} exported successfully!`
      : `All ${exportCount} character${exportCount !== 1 ? 's' : ''} exported successfully!`;
    setRollResult({ text: message, value: null });
  }, [characters, selectedCharacterIds]);

  // Import characters from JSON
  const handleImportData = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string) as Character[];

        // Validate imported data
        if (!Array.isArray(importedData)) {
          throw new Error('Invalid data format');
        }

        // Add each character
        for (const char of importedData) {
          // Generate new ID to avoid conflicts
          const newChar = { ...char, id: generateUUID() };
          await addCharacter(newChar);
        }

        await loadCharacters();
        setRollResult({ text: `Imported ${importedData.length} character(s)!`, value: null });
      } catch (error) {
        console.error('Error importing data:', error);
        setRollResult({ text: 'Error importing data. Check file format.', value: null });
      }
    };
    reader.readAsText(file);
  }, [loadCharacters]);

  const handleToggleInspiration = useCallback(async (characterId: string) => {
    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    const updatedCharacter = { ...character, inspiration: !character.inspiration };

    try {
      await updateCharacter(updatedCharacter);
      // Optimistically update the state
      setCharacters(prev => prev.map(c => c.id === characterId ? updatedCharacter : c));
    } catch (e) {
      console.error("Error updating inspiration:", e);
      // Optionally revert state if DB update fails
    }
  }, [characters]);

  const handleLongRest = useCallback(async (characterId: string) => {
    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    // Long rest: restore HP to max, restore all spell slots, restore all hit dice
    const updatedCharacter = { ...character };
    updatedCharacter.hitPoints = character.maxHitPoints;
    updatedCharacter.hitDice = {
      ...updatedCharacter.hitDice,
      current: updatedCharacter.hitDice.max,
    };

    // Restore spell slots
    if (updatedCharacter.spellcasting) {
      updatedCharacter.spellcasting = {
        ...updatedCharacter.spellcasting,
        usedSpellSlots: Array(10).fill(0) // Reset all used spell slots to 0
      };
    }

    try {
      await updateCharacter(updatedCharacter);
      setCharacters(prev => prev.map(c => c.id === characterId ? updatedCharacter : c));
      console.log('Long rest completed! HP and spell slots restored.');
    } catch (e) {
      console.error("Error taking long rest:", e);
    }
  }, [characters]);

  const handleShortRest = useCallback(async (characterId: string) => {
    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    if (character.hitDice.current <= 0) {
      setRollResult({ text: "No hit dice remaining!", value: null });
      return;
    }

    const diceToSpendStr = prompt(`How many hit dice to spend? (Available: ${character.hitDice.current}/${character.hitDice.max})`);
    if (!diceToSpendStr) return;

    const diceToSpend = parseInt(diceToSpendStr, 10);
    if (isNaN(diceToSpend) || diceToSpend <= 0 || diceToSpend > character.hitDice.current) {
      setRollResult({ text: "Invalid number of hit dice.", value: null });
      return;
    }

    const allClasses = loadClasses();
    const classData = allClasses.find(c => c.name === character.class);
    if (!classData) return;

    const hitDie = classData.hit_die;
    const conModifier = character.abilities.CON.modifier;
    let hpRecovered = 0;
    for (let i = 0; i < diceToSpend; i++) {
      hpRecovered += Math.max(1, Math.floor(Math.random() * hitDie) + 1 + conModifier);
    }

    const newHP = Math.min(character.maxHitPoints, character.hitPoints + hpRecovered);
    const updatedCharacter = {
      ...character,
      hitPoints: newHP,
      hitDice: {
        ...character.hitDice,
        current: character.hitDice.current - diceToSpend,
      },
    };

    try {
      await updateCharacter(updatedCharacter);
      setCharacters(prev => prev.map(c => c.id === characterId ? updatedCharacter : c));
      setRollResult({ text: `Recovered ${hpRecovered} HP.`, value: newHP });
      console.log(`Short rest: Spent ${diceToSpend}d${hitDie}. Recovered ${hpRecovered} HP.`);
    } catch (e) {
      console.error("Error taking short rest:", e);
    }
  }, [characters]);

  const handleLevelUp = useCallback(async (characterId: string) => {
    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    if (character.level >= 20) {
      setRollResult({ text: `${character.name} is already at max level!`, value: null });
      return;
    }

    const newLevel = character.level + 1;
    const newProficiencyBonus = PROFICIENCY_BONUSES[newLevel - 1] || character.proficiencyBonus;

    const allClasses = loadClasses();
    const classData = allClasses.find(c => c.name === character.class);
    if (!classData) {
      console.error(`Could not find class data for ${character.class}`);
      return;
    }

    const hitDie = getHitDieForClass(classData.slug);
    const conModifier = character.abilities.CON.modifier;
    const hpIncrease = Math.max(1, Math.floor(hitDie / 2) + 1 + conModifier);

    const updatedCharacter = {
      ...character,
      level: newLevel,
      proficiencyBonus: newProficiencyBonus,
      maxHitPoints: character.maxHitPoints + hpIncrease,
      hitPoints: character.maxHitPoints + hpIncrease, // Also heal to full on level up
      hitDice: {
        ...character.hitDice,
        max: newLevel, // Update max hit dice to new level
        current: character.hitDice.current, // Keep current hit dice as-is
        dieType: hitDie, // Update die type to match class hit die
      },
    };

    if (updatedCharacter.spellcasting) {
      const classSpellSlots = SPELL_SLOTS_BY_CLASS[classData.slug]?.[newLevel];
      if (classSpellSlots) {
        updatedCharacter.spellcasting = {
          ...updatedCharacter.spellcasting,
          spellSlots: classSpellSlots,
        };
      }
    }

    const asiLevels = levelConstantsData.asiLevels;
    if (asiLevels.includes(newLevel)) {
      setAsiModalState({ isOpen: true, characterId: characterId });
    }

    if (classData.slug === 'wizard' && newLevel === 2) {
      setSubclassModalState({ isOpen: true, characterId: characterId, characterClass: classData.slug });
    }

    if (updatedCharacter.spellcasting) {
      const cantripsKnownAtNewLevel = CANTRIPS_KNOWN_BY_CLASS[classData.slug]?.[newLevel];
      if (cantripsKnownAtNewLevel && cantripsKnownAtNewLevel > updatedCharacter.spellcasting.cantripsKnown.length) {
        // Open modal to choose cantrip instead of adding a placeholder
        setCantripModalState({
          isOpen: true,
          characterId: characterId,
          characterClass: classData.slug,
        });
      }
    }

    try {
      await updateCharacter(updatedCharacter);
      setCharacters(prev => prev.map(c => c.id === characterId ? updatedCharacter : c));
      setRollResult({ text: `${character.name} is now level ${newLevel}!`, value: null });
      console.log(`${character.name} leveled up to ${newLevel}. HP increased by ${hpIncrease}. PB is now ${newProficiencyBonus}.`);
    } catch (e) {
      console.error("Error leveling up character:", e);
    }
  }, [characters]);

  const handleLevelDown = useCallback(async (characterId: string) => {
    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    if (character.level <= 1) {
      setRollResult({ text: `${character.name} is already at level 1.`, value: null });
      return;
    }

    const newLevel = character.level - 1;
    const newProficiencyBonus = PROFICIENCY_BONUSES[newLevel - 1] || character.proficiencyBonus;

    const allClasses = loadClasses();
    const classData = allClasses.find(c => c.name === character.class);
    if (!classData) {
      console.error(`Could not find class data for ${character.class}`);
      return;
    }

    const hitDie = classData.hit_die;
    const conModifier = character.abilities.CON.modifier;
    const hpReduction = Math.max(1, Math.floor(hitDie / 2) + 1 + conModifier);

    const updatedCharacter = {
      ...character,
      level: newLevel,
      proficiencyBonus: newProficiencyBonus,
      maxHitPoints: Math.max(1, character.maxHitPoints - hpReduction),
      hitPoints: Math.max(1, character.maxHitPoints - hpReduction),
    };

    if (updatedCharacter.spellcasting) {
      const classSpellSlots = SPELL_SLOTS_BY_CLASS[classData.slug]?.[newLevel];
      if (classSpellSlots) {
        updatedCharacter.spellcasting = {
          ...updatedCharacter.spellcasting,
          spellSlots: classSpellSlots,
        };
      }

      const cantripChoiceAtLevel = updatedCharacter.spellcasting.cantripChoicesByLevel?.[character.level];
      if (cantripChoiceAtLevel) {
        updatedCharacter.spellcasting = {
          ...updatedCharacter.spellcasting,
          cantripsKnown: updatedCharacter.spellcasting.cantripsKnown.filter(c => c !== cantripChoiceAtLevel),
        };
        delete updatedCharacter.spellcasting.cantripChoicesByLevel?.[character.level];
      }
    }

    try {
      await updateCharacter(updatedCharacter);
      setCharacters(prev => prev.map(c => c.id === characterId ? updatedCharacter : c));
      setRollResult({ text: `${character.name} is now level ${newLevel}.`, value: null });
      console.log(`${character.name} leveled down to ${newLevel}.`);
    } catch (e) {
      console.error("Error leveling down character:", e);
    }
  }, [characters]);

  const handleUpdateCharacter = useCallback(async (updatedCharacter: Character) => {
    try {
      await updateCharacter(updatedCharacter);
      setCharacters(prev => prev.map(c => c.id === updatedCharacter.id ? updatedCharacter : c));
    } catch (e) {
      console.error("Error updating character:", e);
    }
  }, []);

  // Equipment management handlers
  const recalculateAC = useCallback((character: Character): number => {
    let armorClass = 10 + character.abilities.DEX.modifier; // Default unarmored

    if (character.equippedArmor) {
      const armor = EQUIPMENT_DATABASE.find(eq => eq.slug === character.equippedArmor);
      if (armor?.armor_class) {
        if (armor.armor_category === 'Light') {
          armorClass = armor.armor_class.base + character.abilities.DEX.modifier;
        } else if (armor.armor_category === 'Medium') {
          const dexBonus = Math.min(character.abilities.DEX.modifier, armor.armor_class.max_bonus || 2);
          armorClass = armor.armor_class.base + dexBonus;
        } else if (armor.armor_category === 'Heavy') {
          armorClass = armor.armor_class.base;
        }
      }
    }

    // Add shield bonus if equipped
    if (character.equippedWeapons?.some(slug => {
      const item = EQUIPMENT_DATABASE.find(eq => eq.slug === slug);
      return item?.armor_category === 'Shield';
    })) {
      armorClass += 2;
    }

    return armorClass;
  }, []);

  const handleEquipArmor = useCallback(async (characterId: string, armorSlug: string) => {
    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    const armor = EQUIPMENT_DATABASE.find(eq => eq.slug === armorSlug);
    if (!armor?.armor_category) return;

    // Update character with new equipped armor
    const updatedCharacter = {
      ...character,
      equippedArmor: armorSlug,
      inventory: character.inventory?.map(item =>
        item.equipmentSlug === armorSlug
          ? { ...item, equipped: true }
          : { ...item, equipped: item.equipped && EQUIPMENT_DATABASE.find(eq => eq.slug === item.equipmentSlug)?.armor_category !== armor.armor_category ? item.equipped : false }
      ),
    };

    // Recalculate AC
    updatedCharacter.armorClass = recalculateAC(updatedCharacter);

    try {
      await updateCharacter(updatedCharacter);
      setCharacters(prev => prev.map(c => c.id === characterId ? updatedCharacter : c));
      console.log(`Equipped ${armor.name}. New AC: ${updatedCharacter.armorClass}`);
    } catch (e) {
      console.error("Error equipping armor:", e);
    }
  }, [characters, recalculateAC]);

  const handleEquipWeapon = useCallback(async (characterId: string, weaponSlug: string) => {
    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    const weapon = EQUIPMENT_DATABASE.find(eq => eq.slug === weaponSlug);
    if (!weapon?.weapon_category) return;

    // Add weapon to equipped weapons (max 2)
    const equippedWeapons = character.equippedWeapons || [];
    if (!equippedWeapons.includes(weaponSlug)) {
      const updatedWeapons = [...equippedWeapons, weaponSlug].slice(0, 2); // Max 2 weapons

      const updatedCharacter = {
        ...character,
        equippedWeapons: updatedWeapons,
        inventory: character.inventory?.map(item =>
          item.equipmentSlug === weaponSlug ? { ...item, equipped: true } : item
        ),
      };

      try {
        await updateCharacter(updatedCharacter);
        setCharacters(prev => prev.map(c => c.id === characterId ? updatedCharacter : c));
        console.log(`Equipped ${weapon.name}`);
      } catch (e) {
        console.error("Error equipping weapon:", e);
      }
    }
  }, [characters]);

  const handleUnequipItem = useCallback(async (characterId: string, itemSlug: string) => {
    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    const updatedCharacter = { ...character };

    // Check if it's armor
    if (character.equippedArmor === itemSlug) {
      updatedCharacter.equippedArmor = undefined;
      updatedCharacter.armorClass = recalculateAC(updatedCharacter);
    }

    // Check if it's a weapon
    if (character.equippedWeapons?.includes(itemSlug)) {
      updatedCharacter.equippedWeapons = character.equippedWeapons.filter(slug => slug !== itemSlug);
    }

    // Update inventory
    updatedCharacter.inventory = character.inventory?.map(item =>
      item.equipmentSlug === itemSlug ? { ...item, equipped: false } : item
    );

    try {
      await updateCharacter(updatedCharacter);
      setCharacters(prev => prev.map(c => c.id === characterId ? updatedCharacter : c));
      console.log(`Unequipped item`);
    } catch (e) {
      console.error("Error unequipping item:", e);
    }
  }, [characters, recalculateAC]);

  const handleAddItem = useCallback(async (characterId: string, equipmentSlug: string, quantity: number = 1) => {
    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    const equipment = EQUIPMENT_DATABASE.find(eq => eq.slug === equipmentSlug);
    if (!equipment) return;

    // Check if item already in inventory
    const existingItem = character.inventory?.find(item => item.equipmentSlug === equipmentSlug);

    let updatedInventory: EquippedItem[];
    if (existingItem) {
      // Increase quantity
      updatedInventory = character.inventory!.map(item =>
        item.equipmentSlug === equipmentSlug ? { ...item, quantity: item.quantity + quantity } : item
      );
    } else {
      // Add new item
      updatedInventory = [...(character.inventory || []), { equipmentSlug, quantity, equipped: false }];
    }

    const updatedCharacter = { ...character, inventory: updatedInventory };

    try {
      await updateCharacter(updatedCharacter);
      setCharacters(prev => prev.map(c => c.id === characterId ? updatedCharacter : c));
      console.log(`Added ${quantity}x ${equipment.name} to inventory`);
    } catch (e) {
      console.error("Error adding item:", e);
    }
  }, [characters]);

  const handleRemoveItem = useCallback(async (characterId: string, equipmentSlug: string, quantity: number = 1) => {
    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    const existingItem = character.inventory?.find(item => item.equipmentSlug === equipmentSlug);
    if (!existingItem) return;

    let updatedInventory: EquippedItem[];
    if (existingItem.quantity <= quantity) {
      // Remove item entirely
      updatedInventory = character.inventory!.filter(item => item.equipmentSlug !== equipmentSlug);

      // Unequip if equipped
      if (character.equippedArmor === equipmentSlug) {
        character.equippedArmor = undefined;
      }
      if (character.equippedWeapons?.includes(equipmentSlug)) {
        character.equippedWeapons = character.equippedWeapons.filter(slug => slug !== equipmentSlug);
      }
    } else {
      // Decrease quantity
      updatedInventory = character.inventory!.map(item =>
        item.equipmentSlug === equipmentSlug ? { ...item, quantity: item.quantity - quantity } : item
      );
    }

    const updatedCharacter = { ...character, inventory: updatedInventory };
    updatedCharacter.armorClass = recalculateAC(updatedCharacter);

    try {
      await updateCharacter(updatedCharacter);
      setCharacters(prev => prev.map(c => c.id === characterId ? updatedCharacter : c));
      console.log(`Removed ${quantity}x item from inventory`);
    } catch (e) {
      console.error("Error removing item:", e);
    }
  }, [characters, recalculateAC]);

  const handleCantripSelected = useCallback(async (cantripSlug: string) => {
    const { characterId } = cantripModalState;
    if (!characterId) return;

    const character = characters.find(c => c.id === characterId);
    if (!character || !character.spellcasting) return;

    const updatedCharacter = {
      ...character,
      spellcasting: {
        ...character.spellcasting,
        cantripsKnown: [...character.spellcasting.cantripsKnown, cantripSlug],
        cantripChoicesByLevel: {
          ...character.spellcasting.cantripChoicesByLevel,
          [character.level]: cantripSlug,
        },
      },
    };

    try {
      await updateCharacter(updatedCharacter);
      setCharacters(prev => prev.map(c => c.id === characterId ? updatedCharacter : c));
      setCantripModalState({ isOpen: false, characterId: null, characterClass: null });
    } catch (e) {
      console.error("Error selecting cantrip:", e);
    }
  }, [characters, cantripModalState]);

  const handleSubclassSelected = useCallback(async (subclass: AppSubclass) => {
    const { characterId } = subclassModalState;
    if (!characterId) return;

    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    const updatedCharacter = {
      ...character,
      subclass: subclass.slug,
    };

    try {
      await updateCharacter(updatedCharacter);
      setCharacters(prev => prev.map(c => c.id === characterId ? updatedCharacter : c));
      setSubclassModalState({ isOpen: false, characterId: null, characterClass: null });
    } catch (e) {
      console.error("Error selecting subclass:", e);
    }
  }, [characters, subclassModalState]);

  const handleAsiApply = useCallback(async (increases: Partial<Record<Ability, number>>) => {
    const { characterId } = asiModalState;
    if (!characterId) return;

    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    const updatedAbilities = { ...character.abilities };
    for (const key in increases) {
      const ability = key as Ability;
      const increase = increases[ability] || 0;
      updatedAbilities[ability].score += increase;
      updatedAbilities[ability].modifier = getModifier(updatedAbilities[ability].score);
    }

    const updatedCharacter = {
      ...character,
      abilities: updatedAbilities,
    };

    try {
      await updateCharacter(updatedCharacter);
      setCharacters(prev => prev.map(c => c.id === characterId ? updatedCharacter : c));
      setAsiModalState({ isOpen: false, characterId: null });
    } catch (e) {
      console.error("Error applying ASI:", e);
    }
  }, [characters, asiModalState]);

  if (selectedCharacter) {
    return (
      <>
        <CharacterSheet
          character={selectedCharacter}
          onClose={() => setSelectedCharacterId(null)}
          onDelete={handleDeleteCharacter}
          setRollResult={setRollResult}
          onDiceRoll={handleDiceRoll}
          onToggleInspiration={handleToggleInspiration}
          onFeatureClick={handleFeatureClick}
          onLongRest={handleLongRest}
          onShortRest={handleShortRest}
          onLevelUp={handleLevelUp}
          onLevelDown={handleLevelDown}
          onUpdateCharacter={handleUpdateCharacter}
          onEquipArmor={handleEquipArmor}
          onEquipWeapon={handleEquipWeapon}
          onUnequipItem={handleUnequipItem}
          onAddItem={handleAddItem}
          onRemoveItem={handleRemoveItem}
          setEquipmentModal={setEquipmentModal}
        />
        <DiceBox3D latestRoll={latestRoll} />
        <RollHistoryTicker rolls={rollHistory} />
        <RollHistoryModal rolls={rollHistory} onClear={clearHistory} />
        <FeatureModal feature={featureModal} onClose={() => setFeatureModal(null)} />
        <EquipmentDetailModal equipment={equipmentModal} onClose={() => setEquipmentModal(null)} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header and Controls */}
        <header className="flex flex-col md:flex-row justify-between items-center border-b border-red-700 pb-4 mb-8">
          <h1 className="text-4xl font-extrabold text-red-500 mb-4 md:mb-0">
            The Character Forge
          </h1>
          <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:space-x-3 w-full md:w-auto">
             <button
              onClick={() => setIsWizardOpen(true)}
              className="w-full md:w-auto px-6 py-3 bg-red-600 hover:bg-red-500 rounded-xl text-white font-bold shadow-red-800/50 shadow-lg transition-all flex items-center justify-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Character Wizard
            </button>
            <button
              onClick={handleExportData}
              disabled={characters.length === 0}
              className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-bold shadow-blue-800/50 shadow-lg transition-all flex items-center justify-center disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5 mr-2" />
              Export Data
            </button>
            <label className="w-full md:w-auto px-6 py-3 bg-green-600 hover:bg-green-500 rounded-xl text-white font-bold shadow-green-800/50 shadow-lg transition-all flex items-center justify-center cursor-pointer">
              <Upload className="w-5 h-5 mr-2" />
              Import Data
              <input
                type="file"
                accept="application/json"
                onChange={handleImportData}
                className="hidden"
              />
            </label>
          </div>
        </header>

        {/* Enhanced Dice Roll Display */}
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-xl transition-all duration-300 z-40 max-w-xs
          ${rollResult.value !== null ? 'bg-green-800/90 border border-green-500' : 'bg-gray-800/90 border border-gray-600'}`}
        >
          <div className="text-sm font-semibold text-gray-300">{rollResult.text}</div>
          {rollResult.value !== null && (
            <div className="text-4xl font-extrabold text-yellow-300 mt-1">
              {rollResult.value}
            </div>
          )}
          {rollResult.details && (
            <div className="mt-2 text-xs text-gray-400">
              {rollResult.details.map((detail, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <span className={detail.kept ? 'text-yellow-300 font-semibold' : 'text-gray-500'}>
                    {detail.value}
                  </span>
                  {detail.critical && (
                    <span className="text-red-400 font-bold">
                      {detail.critical === 'success' ? '!' : '💀'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Character List */}
        <section>
          <h2 className="text-2xl font-bold text-gray-200 mb-4">Your Heroes ({characters.length})</h2>

          {characters.length === 0 ? (
            <div className="text-center p-12 bg-gray-800 rounded-xl border-2 border-dashed border-gray-700">
              <Shield className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <p className="text-xl font-semibold text-gray-400">Ready your destiny!</p>
              <p className="text-gray-500">Use the "New Character Wizard" button to start forging your hero.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {characters.map((char) => (
                <div key={char.id} className="bg-gray-800 rounded-xl shadow-xl hover:shadow-red-700/30 transition-shadow duration-300 overflow-hidden">
                  <div className="p-5">
                    {/* Checkbox for selection */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-grow">
                        <h3 className="text-2xl font-bold text-red-400 truncate">{char.name}</h3>
                        <p className="text-sm text-gray-400 mb-3">{char.race} | {char.class} (Level {char.level})</p>
                      </div>
                      <label className="flex items-center cursor-pointer ml-2" title="Select for export">
                        <input
                          type="checkbox"
                          checked={selectedCharacterIds.has(char.id)}
                          onChange={() => toggleCharacterSelection(char.id)}
                          className="w-5 h-5 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500 focus:ring-2 cursor-pointer"
                        />
                      </label>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-medium bg-gray-700/50 p-3 rounded-lg">
                       <div>AC: <span className="text-yellow-300 block text-lg font-bold">{char.armorClass}</span></div>
                       <div>HP: <span className="text-green-400 block text-lg font-bold">{char.hitPoints}</span></div>
                       <div>Prof: <span className="text-yellow-300 block text-lg font-bold">{formatModifier(char.proficiencyBonus)}</span></div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between items-center mt-4 space-x-3">
                      <button
                        onClick={() => setSelectedCharacterId(char.id)}
                        className="flex-grow py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white font-semibold transition-colors flex items-center justify-center text-sm"
                      >
                        <BookOpen className="w-4 h-4 mr-2" /> View Sheet
                      </button>
                      <button
                        onClick={() => handleDeleteCharacter(char.id)}
                        className="p-2 bg-gray-600 hover:bg-red-700 rounded-lg transition-colors"
                        title="Delete Character"
                      >
                        <Trash2 className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Character Creation Wizard */}
        <CharacterCreationWizard
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          onCharacterCreated={loadCharacters}
          setRollResult={setRollResult}
        />

        {cantripModalState.isOpen && (() => {
          const character = characters.find(c => c.id === cantripModalState.characterId);
          if (!character || !character.spellcasting) return null;
          return (
            <ChooseCantripModal
              isOpen={cantripModalState.isOpen}
              onClose={() => setCantripModalState({ isOpen: false, characterId: null, characterClass: null })}
              characterClass={cantripModalState.characterClass!}
              knownCantrips={character.spellcasting.cantripsKnown}
              onCantripSelected={handleCantripSelected}
            />
          );
        })()}

        {subclassModalState.isOpen && (() => {
          const character = characters.find(c => c.id === subclassModalState.characterId);
          if (!character) return null;
          const subclasses = getSubclassesByClass(subclassModalState.characterClass!);
          return (
            <ChooseSubclassModal
              isOpen={subclassModalState.isOpen}
              onClose={() => setSubclassModalState({ isOpen: false, characterId: null, characterClass: null })}
              subclasses={subclasses}
              onSelect={handleSubclassSelected}
              characterClass={character.class}
            />
          );
        })()}

        {asiModalState.isOpen && (() => {
          const character = characters.find(c => c.id === asiModalState.characterId);
          if (!character) return null;
          return (
            <AbilityScoreIncreaseModal
              isOpen={asiModalState.isOpen}
              onClose={() => setAsiModalState({ isOpen: false, characterId: null })}
              onApply={handleAsiApply}
            />
          );
        })()}
      </div>
    </div>
  );
};

export default App;

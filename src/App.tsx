import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Dice6, Plus, Trash2, Loader2, BookOpen, User as UserIcon, Shield, Zap, ArrowLeft, ArrowRight, Check, Download, Upload, XCircle, ChevronDown, ChevronUp, Shuffle } from 'lucide-react';
import { getSpellcastingType, migrateSpellSelectionToCharacter } from './utils/spellUtils';
import { SpellSelectionData } from './types/dnd';
import { DiceBox3D } from './components/DiceBox3D';
import { RollHistoryModal, RollHistoryTicker } from './components/RollHistory';
import { FeatureModal } from './components/FeatureModal';
import { EquipmentDetailModal } from './components/EquipmentDetailModal';
import { ChooseCantripModal } from './components/ChooseCantripModal';
import ChooseSubclassModal from './components/ChooseSubclassModal';
import AbilityScoreIncreaseModal from './components/AbilityScoreIncreaseModal';
import { SpellPreparationModal } from './components/SpellPreparationModal';
import { createAbilityRoll, createSkillRoll, createInitiativeRoll, getRollHistory, addRollToHistory, clearRollHistory, rollDice, generateUUID, DiceRoll } from './services/diceService';
import { diceSounds } from './utils/diceSounds';
import { featureDescriptions } from './utils/featureDescriptions';
import { loadClasses, loadEquipment, FEAT_DATABASE as loadedFeats, getSubclassesByClass, getFeaturesByClass, getFeaturesBySubclass, SPELL_DATABASE, getCantripsByClass, getLeveledSpellsByClass, AppSpell, PROFICIENCY_BONUSES, getModifier, SKILL_TO_ABILITY, ALL_SKILLS, ALIGNMENTS_DATA, ALIGNMENTS, BACKGROUNDS, RACE_CATEGORIES, CLASS_CATEGORIES, EQUIPMENT_PACKAGES, getAllRaces, randomizeLevel, randomizeIdentity, randomizeRace, randomizeClassAndSkills, randomizeFightingStyle, randomizeSpells, randomizeAbilities, randomizeFeats, randomizeEquipmentChoices, randomizeAdditionalEquipment, randomizeLanguages, randomizePersonality } from './services/dataService';
import { calculateKnownLanguages, getMaxLanguages, parseBackgroundLanguageChoices, getRacialLanguages, getClassLanguages } from './utils/languageUtils';
import { getLanguagesByCategory } from './data/languages';
import { SPELL_SLOTS_BY_CLASS } from './data/spellSlots';
import { CANTRIPS_KNOWN_BY_CLASS } from './data/cantrips';
// import alignmentsData from './data/alignments.json';
import { Ability, Character, AbilityScore, Skill, AbilityName, SkillName, Equipment, EquippedItem, Feat, CharacterCreationData, EquipmentPackage, Feature } from './types/dnd';
import { AppSubclass } from './services/dataService';

// Missing type definitions
type DiceRollType = DiceRoll;

interface CharacterSheetProps {
  character: Character;
  onClose: () => void;
  onDelete: (id: string) => void;
  setRollResult: (result: { text: string; value: number | null }) => void;
  onDiceRoll: (roll: DiceRollType) => void;
  onToggleInspiration: (characterId: string) => void;
  onFeatureClick: (feature: string | Feature) => void;
  onLongRest: (characterId: string) => void;
  onShortRest: (characterId: string) => void;
  onLevelUp: (characterId: string) => void;
  onLevelDown: (characterId: string) => void;
  onUpdateCharacter: (character: Character) => void;
  onEquipArmor: (characterId: string, armorSlug: string) => void;
  onEquipWeapon: (characterId: string, weaponSlug: string) => void;
  onUnequipItem: (characterId: string, itemSlug: string) => void;
  onAddItem: (characterId: string, equipmentSlug: string, quantity?: number) => void;
  onRemoveItem: (characterId: string, equipmentSlug: string, quantity?: number) => void;
  setEquipmentModal: (item: Equipment | null) => void;
}

interface WizardProps {
  isOpen: boolean;
  onClose: () => void;
  onCharacterCreated: () => void;
  setRollResult: (result: { text: string; value: number | null }) => void;
}

const DEBUG_MODE = true;

// Equipment Pack Display Component
interface EquipmentPackDisplayProps {
  pack: EquipmentPackage;
  isSelected?: boolean;
  onClick?: () => void;
  showRecommendation?: boolean;
  characterClass?: string;
}

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

const EquipmentPackDisplay: React.FC<EquipmentPackDisplayProps> = ({
  pack,
  isSelected = false,
  onClick,
  showRecommendation = false,
  characterClass
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const isRecommended = characterClass && pack.recommendedFor?.includes(characterClass);

  return (
    <div className={`border-2 rounded-lg transition-all ${
      isSelected
        ? 'bg-blue-800 border-blue-500'
        : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
    }`}>
      <button
        onClick={onClick}
        className="w-full p-3 text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-white font-medium">{pack.name}</span>
            {pack.startingGold && pack.startingGold > 0 && (
              <span className="text-yellow-400 text-sm">({pack.startingGold} gp)</span>
            )}
            {showRecommendation && isRecommended && (
              <span className="px-2 py-1 text-xs bg-green-700 text-green-200 rounded">
                Recommended
              </span>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-1 hover:bg-gray-600 rounded"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 border-t border-gray-600 mt-2 pt-2">
          <div className="text-xs text-gray-400 mb-2">Contents:</div>
          <ul className="text-sm space-y-1">
            {pack.items.map((item, idx) => (
              <li key={idx} className="flex items-center justify-between">
                <span className="text-gray-300">
                  • {item.name}
                  {item.quantity > 1 && <span className="text-gray-400 ml-1">x{item.quantity}</span>}
                </span>
                {item.equipped && (
                  <span className="text-xs text-green-400">(equipped)</span>
                )}
              </li>
            ))}
          </ul>
           {pack.description && (
             <p className="text-xs text-gray-500 mt-2 italic">{pack.description}</p>
           )}
         </div>
       )}
     </div>
    );
  };

// --- IndexedDB Configuration ---
const DB_NAME = '5e_character_forge';
const DB_VERSION = 1;
const STORE_NAME = 'characters';

// --- IndexedDB Helper Functions ---
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: false });
        objectStore.createIndex('name', 'name', { unique: false });
        objectStore.createIndex('class', 'class', { unique: false });
        objectStore.createIndex('level', 'level', { unique: false });
      }
    };
  });
};

const getAllCharacters = async (): Promise<Character[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

const addCharacter = async (character: Character): Promise<string> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.add(character);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(character.id);
  });
};

const deleteCharacter = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

const updateCharacter = async (character: Character): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.put(character);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

// --- D&D 5e Character Interface (Must be adhered to) ---





// Initial state for the creation process
const initialCreationData: CharacterCreationData = {
  name: '',
  level: 1,
  raceSlug: '',
  classSlug: '',
  abilities: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
  abilityScoreMethod: 'standard-array',
  background: 'Outlander',
  alignment: 'Neutral Good',
  selectedSkills: [],
  equipmentChoices: [],
  hpCalculationMethod: 'max',
  spellSelection: {
    selectedCantrips: [],
    selectedSpells: [],
  },
  startingInventory: [],
  subclassSlug: undefined,
  selectedFightingStyle: undefined,
  selectedFeats: [],
  knownLanguages: [],
  personality: "I'm quiet until I have something important to say.",
  ideals: "Honesty. The truth must be preserved.",
  bonds: "I owe my life to the individual who saved me.",
  flaws: "I trust no one and question everything.",
};

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


// --- Sub-Components (CharacterSheet) ---

const AbilityScoreBlock: React.FC<{ name: AbilityName; ability: AbilityScore; setRollResult: CharacterSheetProps['setRollResult']; onDiceRoll: (roll: DiceRollType) => void }> = ({ name, ability, setRollResult, onDiceRoll }) => {
  const handleClick = () => {
    const roll = createAbilityRoll(name, ability.score);
    setRollResult({ text: `${roll.label}: ${roll.notation}`, value: roll.total });
    onDiceRoll(roll);
  };

  return (
    <button
      onClick={handleClick}
      className="flex flex-col items-center justify-center p-1 bg-gray-700/50 rounded-lg shadow-inner hover:bg-red-700/70 transition-colors cursor-pointer w-full"
    >
      <div className="text-xs font-bold text-red-400">{name}</div>
      <div className="text-lg font-extrabold text-white bg-gray-900 rounded-full w-10 h-10 flex items-center justify-center border-2 border-red-500 my-1">{ability.score}</div>
      <div className="text-xl font-extrabold text-yellow-300">{formatModifier(ability.modifier)}</div>
    </button>
  );
};

const SkillEntry: React.FC<{ name: SkillName; skill: Skill; setRollResult: CharacterSheetProps['setRollResult']; onDiceRoll: (roll: DiceRollType) => void }> = ({ name, skill, setRollResult, onDiceRoll }) => {
  const skillLabel = name.replace(/([A-Z])/g, ' $1').trim();

  const handleClick = () => {
    const roll = createSkillRoll(skillLabel, skill.value);
    setRollResult({ text: `${roll.label}: ${roll.notation}`, value: roll.total });
    onDiceRoll(roll);
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center space-x-2 p-1.5 hover:bg-gray-800/50 rounded-lg transition-colors w-full text-left"
    >
      <input type="checkbox" checked={skill.proficient} readOnly className="form-checkbox text-red-600 rounded-sm bg-gray-700/50 border-gray-600 w-4 h-4 cursor-pointer" />
      <span className="font-mono text-lg w-8 text-yellow-400">{formatModifier(skill.value)}</span>
      <span className="text-sm font-semibold text-white truncate">{skillLabel}</span>
    </button>
  );
};

const CharacterSheet: React.FC<CharacterSheetProps> = ({
  character, onClose, onDelete, setRollResult, onDiceRoll, onToggleInspiration, onFeatureClick,
  onLongRest, onShortRest, onLevelUp, onLevelDown, onUpdateCharacter, onEquipArmor, onEquipWeapon, onUnequipItem,
  onAddItem, onRemoveItem, setEquipmentModal
}) => {
  const [showSpellPreparationModal, setShowSpellPreparationModal] = useState(false);

  const abilities = Object.entries(character.abilities) as [AbilityName, AbilityScore][];
  const skills = Object.entries(character.skills) as [SkillName, Skill][];
  const passivePerception = (character.skills.Perception.value + 10);

  // Handle initiative roll
  const handleInitiativeRoll = () => {
    const roll = createInitiativeRoll(character.initiative);
    setRollResult({ text: `${roll.label}: ${roll.notation}`, value: roll.total });
    onDiceRoll(roll);
  };

  // Handle spell preparation
  const handleSpellPreparationSave = (preparedSpells: string[]) => {
    onUpdateCharacter({
      ...character,
      spellcasting: {
        ...character.spellcasting!,
        preparedSpells
      }
    });
  };

  return (
    <div className="p-4 md:p-8 bg-gray-900 text-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header and Controls */}
        <div className="flex justify-between items-center border-b border-red-700 pb-3">
          <h1 className="text-3xl font-serif font-bold text-red-500 truncate">{character.name}</h1>
          <div className="flex space-x-3">
            <button
              onClick={() => onShortRest(character.id)}
              className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors font-medium"
              title="Take a Short Rest (recover HP with hit dice)"
            >
              Short Rest
            </button>
            <button
              onClick={() => onLongRest(character.id)}
              className="px-3 py-2 text-sm bg-green-600 hover:bg-green-500 rounded-lg transition-colors font-medium"
              title="Take a Long Rest (recover all HP and spell slots)"
            >
              Long Rest
            </button>
            <button
              onClick={() => onLevelUp(character.id)}
              className="px-3 py-2 text-sm bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors font-medium"
              title="Level up your character"
            >
              Level Up
            </button>
            {DEBUG_MODE && (
              <button
                onClick={() => onLevelDown && onLevelDown(character.id)}
                className="px-3 py-2 text-sm bg-orange-600 hover:bg-orange-500 rounded-lg transition-colors font-medium"
                title="Level down your character (debug)"
              >
                Level Down
              </button>
            )}
            <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors font-medium">Back to List</button>
            <button onClick={() => onDelete(character.id)} className="p-2 bg-red-800 hover:bg-red-700 rounded-lg transition-colors" title="Delete Character"><Trash2 className="w-5 h-5 text-white" /></button>
          </div>
        </div>

        {/* Core Info Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center text-xs font-semibold">
          <div className="p-2 bg-gray-800 rounded-lg">Race: <span className="text-yellow-400 block text-sm">{character.race}</span></div>
          <div className="p-2 bg-gray-800 rounded-lg">Class: <span className="text-yellow-400 block text-sm">{character.class}</span></div>
          <div className="p-2 bg-gray-800 rounded-lg">Level: <span className="text-yellow-400 block text-sm">{character.level}</span></div>
          <div className="p-2 bg-gray-800 rounded-lg col-span-2 md:col-span-1">Alignment: <span className="text-yellow-400 block text-sm">{character.alignment}</span></div>
          <div className="p-2 bg-gray-800 rounded-lg col-span-2 md:col-span-1">Background: <span className="text-yellow-400 block text-sm">{character.background}</span></div>
        </div>

        {/* Main Stat Block */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 bg-gray-800/70 p-4 rounded-xl shadow-lg border border-red-900">
          <div className="col-span-1 flex flex-col items-center"><Shield className="w-6 h-6 text-red-500 mb-1" /><span className="text-sm font-semibold text-gray-400">AC</span><div className="text-4xl font-extrabold text-white">{character.armorClass}</div></div>
          <div className="col-span-2 flex flex-col items-center"><Zap className="w-6 h-6 text-red-500 mb-1" /><span className="text-sm font-semibold text-gray-400">HP (Max)</span><div className="text-4xl font-extrabold text-green-400">{character.hitPoints} <span className="text-gray-400">/</span> {character.maxHitPoints}</div></div>
          <button onClick={handleInitiativeRoll} className="col-span-1 flex flex-col items-center bg-gray-700/50 p-2 rounded-lg hover:bg-red-700/70 transition-colors cursor-pointer" title="Roll Initiative"><Dice6 className="w-6 h-6 text-red-500 mb-1" /><span className="text-sm font-semibold text-gray-400">Initiative</span><div className="text-4xl font-extrabold text-yellow-300">{formatModifier(character.initiative)}</div></button>
          <div className="col-span-1 flex flex-col items-center"><BookOpen className="w-6 h-6 text-red-500 mb-1" /><span className="text-sm font-semibold text-gray-400">Prof.</span><div className="text-4xl font-extrabold text-yellow-300">{formatModifier(character.proficiencyBonus)}</div></div>
          <div className="col-span-1 flex flex-col items-center"><UserIcon className="w-6 h-6 text-red-500 mb-1" /><span className="text-sm font-semibold text-gray-400">Pass Perc</span><div className="text-4xl font-extrabold text-white">{passivePerception}</div></div>
        </div>

        {/* Abilities and Skills Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1 space-y-4">
            <h2 className="text-xl font-bold text-red-500 border-b border-red-800 pb-1">Ability Scores</h2>
            <div className="grid grid-cols-3 gap-2">
              {abilities.map(([name, ability]) => (<AbilityScoreBlock key={name} name={name} ability={ability} setRollResult={setRollResult} onDiceRoll={onDiceRoll} />))}
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border-l-4 border-yellow-500">
                <span className="text-lg font-bold">Inspiration</span>
                <button
                  onClick={() => onToggleInspiration(character.id)}
                  className={`w-8 h-8 rounded-full transition-all cursor-pointer ${character.inspiration ? 'bg-yellow-500' : 'bg-gray-600 hover:bg-gray-500'}`}
                  title={character.inspiration ? 'Remove Inspiration' : 'Grant Inspiration'}
                >
                    {character.inspiration && <Zap className="w-5 h-5 mx-auto text-gray-900" />}
                </button>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-red-500 border-b border-red-800 pb-1">Skills</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 bg-gray-800/70 p-3 rounded-xl border border-red-900 max-h-[450px] overflow-y-auto">
              {skills.sort((a, b) => a[0].localeCompare(b[0])).map(([name, skill]) => (<SkillEntry key={name} name={name} skill={skill} setRollResult={setRollResult} onDiceRoll={onDiceRoll} />))}
            </div>
          </div>
        </div>

        {/* Spellcasting Section */}
        {character.spellcasting ? (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-purple-500 border-b border-purple-800 pb-1">Spellcasting</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Spellcasting Stats */}
              <div className="p-4 bg-gray-800 rounded-xl shadow-lg border-l-4 border-purple-500">
                <h3 className="text-lg font-bold text-purple-400 mb-3">Spell Stats</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Spellcasting Ability:</span>
                    <span className="font-bold text-white">{character.spellcasting.ability}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Spell Save DC:</span>
                    <span className="font-bold text-yellow-300">{character.spellcasting.spellSaveDC}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Spell Attack:</span>
                    <span className="font-bold text-yellow-300">{formatModifier(character.spellcasting.spellAttackBonus)}</span>
                  </div>
                </div>
              </div>

              {/* Spell Slots */}
              <div className="p-4 bg-gray-800 rounded-xl shadow-lg border-l-4 border-blue-500">
                <h3 className="text-lg font-bold text-blue-400 mb-3">Spell Slots</h3>
                <div className="space-y-2 text-sm">
                  {character.spellcasting.spellSlots.map((maxSlots, index) => {
                    if (maxSlots === 0) return null;
                    const spellLevel = index + 1;
                    const usedSlots = character.spellcasting?.usedSpellSlots?.[index] || 0;
                    const availableSlots = maxSlots - usedSlots;

                    return (
                      <div key={spellLevel} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Level {spellLevel}:</span>
                          <span className="font-bold text-white">{availableSlots}/{maxSlots}</span>
                        </div>
                        <div className="flex gap-1">
                          {Array.from({ length: maxSlots }).map((_, slotIndex) => {
                            const isUsed = slotIndex < usedSlots;
                            return (
                              <button
                                key={slotIndex}
                                onClick={() => {
                                  const newUsedSlots = [...(character.spellcasting?.usedSpellSlots || Array(9).fill(0))];
                                  if (isUsed) {
                                    // Uncheck this slot
                                    newUsedSlots[index] = Math.max(0, (newUsedSlots[index] || 0) - 1);
                                  } else {
                                    // Check this slot
                                    newUsedSlots[index] = (newUsedSlots[index] || 0) + 1;
                                  }
                                  onUpdateCharacter({
                                    ...character,
                                    spellcasting: {
                                      ...character.spellcasting!,
                                      usedSpellSlots: newUsedSlots
                                    }
                                  });
                                }}
                                className={`w-6 h-6 rounded border-2 transition-colors ${
                                  isUsed
                                    ? 'bg-gray-600 border-gray-500'
                                    : 'bg-blue-500 border-blue-400 hover:bg-blue-400'
                                }`}
                                title={isUsed ? 'Click to restore slot' : 'Click to use slot'}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cantrips & Spells */}
              <div className="p-4 bg-gray-800 rounded-xl shadow-lg border-l-4 border-green-500">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-green-400">
                    {character.spellcasting.spellcastingType === 'wizard' ? 'Spellcasting' :
                     character.spellcasting.spellcastingType === 'prepared' ? 'Prepared Spells' :
                     'Known Spells'}
                  </h3>
                  {character.spellcasting.spellcastingType === 'prepared' && (
                    <button
                      onClick={() => setShowSpellPreparationModal(true)}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-500 rounded text-sm transition-colors flex items-center gap-1"
                      title="Prepare spells for the day"
                    >
                      <BookOpen className="w-4 h-4" />
                      Prepare
                    </button>
                  )}
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="font-semibold text-gray-300 mb-1">Cantrips ({character.spellcasting.cantripsKnown.length})</div>
                    <ul className="list-disc list-inside space-y-0.5 text-xs text-gray-400">
                      {character.spellcasting.cantripsKnown.map((spellSlug) => {
                        const spell = SPELL_DATABASE.find(s => s.slug === spellSlug);
                        return <li key={spellSlug}>{spell?.name || spellSlug}</li>;
                      })}
                    </ul>
                  </div>

                  {/* Show appropriate spell list based on casting type */}
                  {character.spellcasting.spellcastingType === 'wizard' && character.spellcasting.spellbook && (
                    <div>
                      <div className="font-semibold text-gray-300 mb-1">Spellbook ({character.spellcasting.spellbook.length})</div>
                      <ul className="list-disc list-inside space-y-0.5 text-xs text-gray-400">
                        {character.spellcasting.spellbook.map((spellSlug) => {
                          const spell = SPELL_DATABASE.find(s => s.slug === spellSlug);
                          return <li key={spellSlug}>{spell?.name || spellSlug}</li>;
                        })}
                      </ul>
                    </div>
                  )}

                  {character.spellcasting.spellcastingType === 'wizard' && character.spellcasting.preparedSpells && (
                    <div>
                      <div className="font-semibold text-gray-300 mb-1">Prepared Today ({character.spellcasting.preparedSpells.length})</div>
                      <ul className="list-disc list-inside space-y-0.5 text-xs text-gray-400">
                        {character.spellcasting.preparedSpells.map((spellSlug) => {
                          const spell = SPELL_DATABASE.find(s => s.slug === spellSlug);
                          return <li key={spellSlug}>{spell?.name || spellSlug}</li>;
                        })}
                      </ul>
                    </div>
                  )}

                  {character.spellcasting.spellcastingType === 'known' && character.spellcasting.spellsKnown && (
                    <div>
                      <div className="font-semibold text-gray-300 mb-1">Spells Known ({character.spellcasting.spellsKnown.length})</div>
                      <ul className="list-disc list-inside space-y-0.5 text-xs text-gray-400">
                        {character.spellcasting.spellsKnown.map((spellSlug) => {
                          const spell = SPELL_DATABASE.find(s => s.slug === spellSlug);
                          return <li key={spellSlug}>{spell?.name || spellSlug}</li>;
                        })}
                      </ul>
                    </div>
                  )}

                  {character.spellcasting.spellcastingType === 'prepared' && character.spellcasting.preparedSpells && (
                    <div>
                      <div className="font-semibold text-gray-300 mb-1">Prepared Spells ({character.spellcasting.preparedSpells.length})</div>
                      <ul className="list-disc list-inside space-y-0.5 text-xs text-gray-400">
                        {character.spellcasting.preparedSpells.map((spellSlug) => {
                          const spell = SPELL_DATABASE.find(s => s.slug === spellSlug);
                          return <li key={spellSlug}>{spell?.name || spellSlug}</li>;
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-purple-500 border-b border-purple-800 pb-1">Spellcasting</h2>
            <div className="p-4 bg-gray-800 rounded-xl shadow-lg border-l-4 border-gray-600 text-center">
              <p className="text-gray-400 text-sm">No spellcasting abilities available for this character.</p>
            </div>
          </div>
        )}

        {/* Equipment & Inventory Section */}
        {character.inventory && character.inventory.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-orange-500 border-b border-orange-800 pb-1">Equipment & Inventory</h2>

            {/* Combat Equipment - Equipped Weapons and Armor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Equipped Armor */}
              {character.equippedArmor && (() => {
                const armor = EQUIPMENT_DATABASE.find(eq => eq.slug === character.equippedArmor);
                if (!armor) return null;

                return (
                  <div className="p-4 bg-gray-800 rounded-xl shadow-lg border-l-4 border-blue-500">
                    <h3 className="text-lg font-bold text-blue-400 mb-3 flex items-center justify-between">
                      <span>Equipped Armor</span>
                      <span className="text-xs text-gray-400">{armor.year === 2024 ? '2024' : '2014'}</span>
                    </h3>
                    <div className="space-y-2">
                      <div className="font-bold text-white text-lg">{armor.name}</div>
                      <div className="text-sm text-gray-300">
                        <span className="text-gray-400">Type:</span> {armor.armor_category} Armor
                      </div>
                      <div className="text-sm text-gray-300">
                        <span className="text-gray-400">AC:</span> {armor.armor_class?.base}
                        {armor.armor_class?.dex_bonus && (
                          <span> + DEX {armor.armor_class.max_bonus ? `(max +${armor.armor_class.max_bonus})` : ''}</span>
                        )}
                      </div>
                      {armor.str_minimum && armor.str_minimum > 0 && (
                        <div className="text-sm text-yellow-300">
                          <span className="text-gray-400">STR Required:</span> {armor.str_minimum}
                        </div>
                      )}
                      {armor.stealth_disadvantage && (
                        <div className="text-xs text-red-400">Stealth Disadvantage</div>
                      )}
                      {armor.don_time && (
                        <div className="text-xs text-gray-400">Don: {armor.don_time} | Doff: {armor.doff_time}</div>
                      )}
                      <div className="text-xs text-gray-500">Weight: {armor.weight} lb</div>
                    </div>
                  </div>
                );
              })()}

              {/* Equipped Weapons */}
              {character.equippedWeapons && character.equippedWeapons.length > 0 && (
                <div className="p-4 bg-gray-800 rounded-xl shadow-lg border-l-4 border-red-500">
                  <h3 className="text-lg font-bold text-red-400 mb-3">Equipped Weapons</h3>
                  <div className="space-y-3">
                    {character.equippedWeapons.map((weaponSlug, idx) => {
                      const weapon = EQUIPMENT_DATABASE.find(eq => eq.slug === weaponSlug);
                      if (!weapon) return null;

                      // Calculate attack bonus: prof + STR/DEX modifier
                      const useDex = weapon.properties?.includes('Finesse') || weapon.weapon_range === 'Ranged';
                      const attackMod = useDex ? character.abilities.DEX.modifier : character.abilities.STR.modifier;
                      const attackBonus = character.proficiencyBonus + attackMod;

                      return (
                        <div key={idx} className="bg-gray-700/50 p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <div className="font-bold text-white">{weapon.name}</div>
                            <span className="text-xs text-gray-400">{weapon.year === 2024 ? '2024' : '2014'}</span>
                          </div>
                          <div className="text-sm space-y-1">
                            <div className="text-green-300">
                              <span className="text-gray-400">Attack:</span> {formatModifier(attackBonus)} |
                              <span className="text-gray-400"> Damage:</span> {weapon.damage?.damage_dice} {weapon.damage?.damage_type}
                            </div>
                            {weapon.two_handed_damage && (
                              <div className="text-blue-300 text-xs">
                                Versatile: {weapon.two_handed_damage.damage_dice} {weapon.two_handed_damage.damage_type}
                              </div>
                            )}
                            <div className="text-xs text-gray-400">
                              {weapon.weapon_category} {weapon.weapon_range} | Range: {weapon.range?.normal}
                              {weapon.range?.long && `/${weapon.range.long}`} ft
                            </div>
                            {weapon.properties && weapon.properties.length > 0 && (
                              <div className="text-xs text-gray-500">
                                Properties: {weapon.properties.join(', ')}
                              </div>
                            )}
                            {weapon.mastery && (
                              <div className="text-xs text-purple-400">Mastery: {weapon.mastery}</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Inventory Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Inventory List */}
              <div className="md:col-span-2 p-4 bg-gray-800 rounded-xl shadow-lg border-l-4 border-yellow-500">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-bold text-yellow-400">Inventory ({character.inventory.length} items)</h3>
                  <button
                    onClick={() => {
                      // Show equipment browser modal
                      const randomItem = EQUIPMENT_DATABASE[Math.floor(Math.random() * EQUIPMENT_DATABASE.length)];
                      onAddItem(character.id, randomItem.slug, 1);
                    }}
                    className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 rounded text-xs transition-colors flex items-center gap-1"
                    title="Add item from equipment database"
                  >
                    <Plus className="w-3 h-3" />
                    Add Item
                  </button>
                </div>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {character.inventory.map((item, idx) => {
                    const equipment = EQUIPMENT_DATABASE.find(eq => eq.slug === item.equipmentSlug);
                    if (!equipment) return null;

                    const canEquip = equipment.weapon_category || equipment.armor_category;
                    const isEquippable = canEquip && !item.equipped;
                    const isUnequippable = canEquip && item.equipped;

                    return (
                      <div key={idx} className="bg-gray-700/50 p-2 rounded hover:bg-gray-700 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-grow min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                onClick={() => setEquipmentModal(equipment)}
                                className="font-semibold text-white hover:text-orange-300 transition-colors text-left"
                              >
                                {equipment.name}
                              </button>
                              {item.equipped && <span className="text-xs bg-green-600 px-2 py-0.5 rounded">Equipped</span>}
                              <span className="text-xs text-gray-400">{equipment.year === 2024 ? '2024' : '2014'}</span>
                            </div>
                            <div className="text-xs text-gray-400">
                              {equipment.equipment_category}
                              {equipment.weight && ` | ${equipment.weight * item.quantity} lb`}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="font-mono text-sm text-gray-300">×{item.quantity}</span>
                            <div className="flex gap-1">
                              {isEquippable && (
                                <button
                                  onClick={() => {
                                    if (equipment.armor_category) {
                                      onEquipArmor(character.id, item.equipmentSlug);
                                    } else if (equipment.weapon_category) {
                                      onEquipWeapon(character.id, item.equipmentSlug);
                                    }
                                  }}
                                  className="px-2 py-1 bg-green-600 hover:bg-green-500 rounded text-xs transition-colors"
                                  title="Equip item"
                                >
                                  Equip
                                </button>
                              )}
                              {isUnequippable && (
                                <button
                                  onClick={() => onUnequipItem(character.id, item.equipmentSlug)}
                                  className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs transition-colors"
                                  title="Unequip item"
                                >
                                  Unequip
                                </button>
                              )}
                              <button
                                onClick={() => onRemoveItem(character.id, item.equipmentSlug, 1)}
                                className="px-2 py-1 bg-red-600 hover:bg-red-500 rounded text-xs transition-colors"
                                title="Remove 1 from inventory"
                              >
                                −
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Currency and Encumbrance */}
              <div className="space-y-4">
                {/* Currency */}
                {character.currency && (
                  <div className="p-4 bg-gray-800 rounded-xl shadow-lg border-l-4 border-yellow-600">
                    <h3 className="text-lg font-bold text-yellow-500 mb-3">Currency</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-yellow-200">Platinum (pp):</span>
                        <input
                          type="number"
                          min="0"
                          value={character.currency.pp}
                          onChange={(e) => {
                            const updatedCharacter = {
                              ...character,
                              currency: { ...character.currency!, pp: Math.max(0, parseInt(e.target.value) || 0) }
                            };
                            onUpdateCharacter(updatedCharacter);
                          }}
                          className="w-20 px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:border-yellow-500 focus:outline-none text-right"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-yellow-300">Gold (gp):</span>
                        <input
                          type="number"
                          min="0"
                          value={character.currency.gp}
                          onChange={(e) => {
                            const updatedCharacter = {
                              ...character,
                              currency: { ...character.currency!, gp: Math.max(0, parseInt(e.target.value) || 0) }
                            };
                            onUpdateCharacter(updatedCharacter);
                          }}
                          className="w-20 px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:border-yellow-500 focus:outline-none text-right"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Silver (sp):</span>
                        <input
                          type="number"
                          min="0"
                          value={character.currency.sp}
                          onChange={(e) => {
                            const updatedCharacter = {
                              ...character,
                              currency: { ...character.currency!, sp: Math.max(0, parseInt(e.target.value) || 0) }
                            };
                            onUpdateCharacter(updatedCharacter);
                          }}
                          className="w-20 px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:border-yellow-500 focus:outline-none text-right"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-orange-400">Copper (cp):</span>
                        <input
                          type="number"
                          min="0"
                          value={character.currency.cp}
                          onChange={(e) => {
                            const updatedCharacter = {
                              ...character,
                              currency: { ...character.currency!, cp: Math.max(0, parseInt(e.target.value) || 0) }
                            };
                            onUpdateCharacter(updatedCharacter);
                          }}
                          className="w-20 px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:border-yellow-500 focus:outline-none text-right"
                        />
                      </div>
                      <div className="border-t border-gray-600 pt-2 mt-2">
                        <div className="flex justify-between font-semibold">
                          <span className="text-gray-400">Total Value:</span>
                          <span className="text-yellow-300">
                            {(character.currency.pp * 10 + character.currency.gp + character.currency.sp / 10 + character.currency.cp / 100).toFixed(2)} gp
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Encumbrance */}
                <div className="p-4 bg-gray-800 rounded-xl shadow-lg border-l-4 border-orange-500">
                  <h3 className="text-lg font-bold text-orange-400 mb-3">Encumbrance</h3>
                  {(() => {
                    const totalWeight = character.inventory.reduce((sum, item) => {
                      const equipment = EQUIPMENT_DATABASE.find(eq => eq.slug === item.equipmentSlug);
                      return sum + (equipment?.weight || 0) * item.quantity;
                    }, 0);
                    const capacity = character.abilities.STR.score * 15;
                    const heavyLoad = character.abilities.STR.score * 10;
                    const encumbered = totalWeight > heavyLoad;
                    const overCapacity = totalWeight > capacity;

                    let statusColor = 'text-green-400';
                    let statusText = 'Normal';
                    if (overCapacity) {
                      statusColor = 'text-red-400';
                      statusText = 'Over Capacity!';
                    } else if (encumbered) {
                      statusColor = 'text-yellow-400';
                      statusText = 'Encumbered';
                    }

                    return (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Carrying:</span>
                          <span className="font-bold text-white">{totalWeight.toFixed(1)} lb</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Capacity:</span>
                          <span className="font-bold text-white">{capacity} lb</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full ${overCapacity ? 'bg-red-500' : encumbered ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min((totalWeight / capacity) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <div className={`text-center font-semibold ${statusColor}`}>
                          {statusText}
                        </div>
                        {encumbered && (
                          <div className="text-xs text-gray-400 text-center">
                            {overCapacity ? 'Cannot carry more!' : 'Speed -10 ft'}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Traits and Features Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-red-500 border-b border-red-800 pb-1">Features & Traits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-800 rounded-xl shadow-lg border-l-4 border-blue-500">
              <h3 className="text-lg font-bold text-blue-400 mb-2">Personality, Ideals, Bonds & Flaws</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                <li><span className="font-semibold text-white">Personality:</span> {character.featuresAndTraits.personality}</li>
                <li><span className="font-semibold text-white">Ideals:</span> {character.featuresAndTraits.ideals}</li>
                <li><span className="font-semibold text-white">Bonds:</span> {character.featuresAndTraits.bonds}</li>
                <li><span className="font-semibold text-white">Flaws:</span> {character.featuresAndTraits.flaws}</li>
              </ul>
            </div>
            <div className="p-4 bg-gray-800 rounded-xl shadow-lg border-l-4 border-green-500">
              <h3 className="text-lg font-bold text-green-400 mb-2">Racial Traits</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                {character.featuresAndTraits.racialTraits.map((trait, index) => (
                  <li key={`r-${index}`}>
                    <button onClick={() => onFeatureClick(trait)} className="text-left hover:text-yellow-300 transition-colors cursor-pointer">
                      {trait}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sprint 5: SRD Features Display */}
          {character.srdFeatures && (character.srdFeatures.classFeatures.length > 0 || character.srdFeatures.subclassFeatures.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Class Features */}
              {character.srdFeatures.classFeatures.length > 0 && (
                <div className="p-4 bg-gray-800 rounded-xl shadow-lg border-l-4 border-orange-500">
                  <h3 className="text-lg font-bold text-orange-400 mb-2">Class Features</h3>
                  <div className="space-y-2 text-sm text-gray-300 max-h-60 overflow-y-auto">
                    {character.srdFeatures.classFeatures.map((feature, index) => (
                      <div key={`cf-${index}`} className="flex items-start gap-2">
                        <span className="text-xs bg-orange-700 text-white px-1.5 py-0.5 rounded font-mono">
                          L{feature.level}
                        </span>
                        <button
                          onClick={() => onFeatureClick(feature.name)}
                          className="text-left hover:text-yellow-300 transition-colors cursor-pointer flex-1"
                        >
                          {feature.name}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subclass Features */}
              {character.srdFeatures.subclassFeatures.length > 0 && (
                <div className="p-4 bg-gray-800 rounded-xl shadow-lg border-l-4 border-purple-500">
                  <h3 className="text-lg font-bold text-purple-400 mb-2">Subclass Features</h3>
                  <div className="space-y-2 text-sm text-gray-300 max-h-60 overflow-y-auto">
                    {character.srdFeatures.subclassFeatures.map((feature, index) => (
                      <div key={`scf-${index}`} className="flex items-start gap-2">
                        <span className="text-xs bg-purple-700 text-white px-1.5 py-0.5 rounded font-mono">
                          L{feature.level}
                        </span>
                        <button
                          onClick={() => onFeatureClick(feature.name)}
                          className="text-left hover:text-yellow-300 transition-colors cursor-pointer flex-1"
                        >
                          {feature.name}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Legacy Class Features (for backward compatibility) */}
          {character.featuresAndTraits.classFeatures && character.featuresAndTraits.classFeatures.length > 0 && (
            <div className="p-4 bg-gray-800 rounded-xl shadow-lg border-l-4 border-yellow-500">
              <h3 className="text-lg font-bold text-yellow-400 mb-2">Other Class Features</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                {character.featuresAndTraits.classFeatures.map((feature, index) => (
                  <li key={`lcf-${index}`}>
                    <button onClick={() => onFeatureClick(feature)} className="text-left hover:text-yellow-300 transition-colors cursor-pointer">
                      {feature}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Sprint 5: Selected Feats Display */}
          {character.selectedFeats && character.selectedFeats.length > 0 && (
            <div className="p-4 bg-gray-800 rounded-xl shadow-lg border-l-4 border-cyan-500">
              <h3 className="text-lg font-bold text-cyan-400 mb-2">Feats</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {character.selectedFeats.map((featSlug, index) => {
                  const feat = FEAT_DATABASE.find(f => f.slug === featSlug);
                  if (!feat) return null;

                  return (
                    <div key={`feat-${index}`} className="p-2 bg-gray-700 rounded border border-cyan-700">
                      <div className="flex items-start justify-between">
                        <div className="font-semibold text-cyan-300 text-sm">{feat.name}</div>
                        {feat.abilityScoreIncrease && (
                          <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded ml-2">
                            +ASI
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{feat.source} {feat.year}</p>
                      {feat.prerequisite && (
                        <p className="text-xs text-yellow-400 mt-1">Req: {feat.prerequisite}</p>
                      )}
                      <ul className="list-disc list-inside text-xs text-gray-300 mt-1 space-y-0.5">
                        {feat.benefits.slice(0, 2).map((benefit, idx) => (
                          <li key={idx}>{benefit}</li>
                        ))}
                        {feat.benefits.length > 2 && (
                          <li className="text-gray-500">...and {feat.benefits.length - 2} more</li>
                        )}
                      </ul>
                    </div>
                  );
                })}
               </div>
             </div>
           )}
         </div>

      {/* Spell Preparation Modal */}
      {character.spellcasting?.spellcastingType === 'prepared' && (
        <SpellPreparationModal
          character={character}
          availableSpells={SPELL_DATABASE.filter(spell =>
            character.spellcasting!.spellsKnown?.includes(spell.slug) ||
            character.spellcasting!.spellbook?.includes(spell.slug) || false
          )}
          isOpen={showSpellPreparationModal}
          onClose={() => setShowSpellPreparationModal(false)}
          onSave={handleSpellPreparationSave}
        />
      )}
    </div>
  </div>
  );
};


// --- Character Creation Wizard Steps ---

const STEP_TITLES = [
    'Character Details',        // 0
    'Choose Race',              // 1
    'Choose Class & Subclass',  // 2 - Sprint 5: Updated to include subclass
    'Choose Fighting Style',    // 3 - Sprint 5: Conditional for Fighter/Paladin/Ranger
    'Select Spells',            // 4 - Sprint 2: Conditional for spellcasters
    'Determine Abilities',      // 5
    'Choose Feats',             // 6 - Sprint 5: Optional feat selection
    'Select Languages',         // 7
    'Select Equipment',         // 8
    'Customize Equipment',      // 9 - Sprint 4: Equipment browser
    'Finalize Background',      // 10
    'Final Details'             // 11
];

interface StepProps {
    data: CharacterCreationData;
    updateData: (updates: Partial<CharacterCreationData>) => void;
    nextStep: () => void;
    prevStep: () => void;
    stepIndex: number;
}

const Step0Level: React.FC<StepProps> = ({ data, updateData, nextStep }) => {
    const milestoneLevels = [2, 3, 4, 5, 6, 8, 11, 12, 14, 16, 17, 19, 20];

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

    // Auto-skip if class doesn't get fighting style
    React.useEffect(() => {
        if (!hasFightingStyle) {
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

// Sprint 2: Spell Selection Step
const Step4Spells: React.FC<StepProps> = ({ data, updateData, nextStep, prevStep }) => {
    const allClasses = loadClasses();
    const selectedClass = allClasses.find(c => c.slug === data.classSlug);

    // Auto-advance and validation effects (must be called before any conditional returns)
    React.useEffect(() => {
        if (!selectedClass || !selectedClass.spellcasting ||
            (selectedClass.spellcasting.cantripsKnown === 0 && selectedClass.spellcasting.spellsKnownOrPrepared === 0)) {
            nextStep();
        }
    }, [selectedClass, nextStep]);

    // Clear invalid spell selections if they exceed current limits
    React.useEffect(() => {
        if (selectedClass?.spellcasting) {
            const spellcasting = selectedClass.spellcasting;
            const spellcastingType = getSpellcastingType(selectedClass.slug);

            // Validate cantrips
            const validCantrips = data.spellSelection.selectedCantrips.slice(0, spellcasting.cantripsKnown);

            let updatedSelection = {
                ...data.spellSelection,
                selectedCantrips: validCantrips
            };

            // Validate based on spellcasting type
            if (spellcastingType === 'known') {
                const validSpells = (data.spellSelection.knownSpells || []).slice(0, spellcasting.spellsKnownOrPrepared);
                updatedSelection.knownSpells = validSpells;
            } else if (spellcastingType === 'prepared') {
                const validSpells = (data.spellSelection.preparedSpells || []).slice(0, spellcasting.spellsKnownOrPrepared);
                updatedSelection.preparedSpells = validSpells;
            } else if (spellcastingType === 'wizard') {
                // Validate spellbook (6 spells)
                const validSpellbook = (data.spellSelection.spellbook || []).slice(0, 6);
                // Validate daily preparation
                const maxPrepared = Math.max(1, Math.floor((data.abilities.INT - 10) / 2) + 1);
                const validDaily = (data.spellSelection.dailyPrepared || []).slice(0, maxPrepared);
                updatedSelection.spellbook = validSpellbook;
                updatedSelection.dailyPrepared = validDaily;
            }

            // Check if anything changed
            const hasChanges =
                validCantrips.length !== data.spellSelection.selectedCantrips.length ||
                (spellcastingType === 'known' && updatedSelection.knownSpells?.length !== (data.spellSelection.knownSpells?.length || 0)) ||
                (spellcastingType === 'prepared' && updatedSelection.preparedSpells?.length !== (data.spellSelection.preparedSpells?.length || 0)) ||
                (spellcastingType === 'wizard' && (
                    updatedSelection.spellbook?.length !== (data.spellSelection.spellbook?.length || 0) ||
                    updatedSelection.dailyPrepared?.length !== (data.spellSelection.dailyPrepared?.length || 0)
                ));

            if (hasChanges) {
                updateData({ spellSelection: updatedSelection });
            }
        }
    }, [selectedClass, data.spellSelection, data.abilities.INT, updateData]);

    // If not a spellcaster or has no spells available, skip this step
    if (!selectedClass || !selectedClass.spellcasting ||
        (selectedClass.spellcasting.cantripsKnown === 0 && selectedClass.spellcasting.spellsKnownOrPrepared === 0)) {
        return <div className='text-center text-gray-400'>This class doesn't have spells available at level {data.level}. Advancing...</div>;
    }

    const spellcasting = selectedClass.spellcasting!;
    const spellcastingType = getSpellcastingType(selectedClass.slug);
    const availableCantrips = getCantripsByClass(data.classSlug);
    const availableSpells = getLeveledSpellsByClass(data.classSlug, 1);

    const handleCantripToggle = (spellSlug: string) => {
        const current = data.spellSelection.selectedCantrips;
        const isSelected = current.includes(spellSlug);

        if (isSelected) {
            // Deselect
            updateData({
                spellSelection: {
                    ...data.spellSelection,
                    selectedCantrips: current.filter(s => s !== spellSlug),
                },
            });
        } else if (current.length < spellcasting.cantripsKnown) {
            // Select (if under limit)
            updateData({
                spellSelection: {
                    ...data.spellSelection,
                    selectedCantrips: [...current, spellSlug],
                },
            });
        }
    };

    const handleSpellToggle = (spellSlug: string, field: keyof SpellSelectionData) => {
        const current = (data.spellSelection[field] as string[]) || [];
        const isSelected = current.includes(spellSlug);

        if (isSelected) {
            // Deselect
            updateData({
                spellSelection: {
                    ...data.spellSelection,
                    [field]: current.filter(s => s !== spellSlug),
                },
            });
        } else if (current.length < spellcasting.spellsKnownOrPrepared) {
            // Select (if under limit)
            updateData({
                spellSelection: {
                    ...data.spellSelection,
                    [field]: [...current, spellSlug],
                },
            });
        }
    };



    const cantripsComplete = data.spellSelection.selectedCantrips.length === spellcasting.cantripsKnown;

    let spellsComplete = false;
    if (spellcastingType === 'known') {
        spellsComplete = (data.spellSelection.knownSpells?.length || 0) === spellcasting.spellsKnownOrPrepared;
    } else if (spellcastingType === 'prepared') {
        spellsComplete = (data.spellSelection.preparedSpells?.length || 0) === spellcasting.spellsKnownOrPrepared;
    } else if (spellcastingType === 'wizard') {
        const spellbookComplete = (data.spellSelection.spellbook?.length || 0) === 6;
        const dailyComplete = (data.spellSelection.dailyPrepared?.length || 0) === Math.max(1, Math.floor((data.abilities.INT - 10) / 2) + 1);
        spellsComplete = spellbookComplete && dailyComplete;
    }

    const allSelectionsComplete = cantripsComplete && spellsComplete;

    // Spell mode description
    const modeDescription = spellcastingType === 'wizard'
        ? 'Choose spells for your spellbook. You can prepare a subset of these each day.'
        : spellcastingType === 'prepared'
        ? 'Choose spells to prepare. You can change your prepared spells after a long rest.'
        : 'Choose spells your character knows. These are permanent until you level up.';

    return (
        <div className='space-y-6'>
            <div className='flex justify-between items-start'>
                <div>
                    <h3 className='text-xl font-bold text-red-300'>Select Your Spells</h3>
                    <p className='text-sm text-gray-400 mt-1'>
                        {selectedClass.name} - {modeDescription}
                    </p>
                    <p className='text-xs text-purple-300 mt-1'>
                        Spellcasting Ability: <span className='font-bold'>{spellcasting.ability}</span>
                    </p>
                </div>
                <RandomizeButton
                    onClick={() => {
                        const spells = randomizeSpells(data.classSlug, data.level);
                        updateData({ spellSelection: spells });
                    }}
                    title="Randomize spell selection"
                />
            </div>

            {/* Cantrips Section */}
            <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 space-y-3">
                <h4 className="text-lg font-bold text-yellow-300">
                    Cantrips ({data.spellSelection.selectedCantrips.length} / {spellcasting.cantripsKnown} selected)
                </h4>
                <p className="text-xs text-gray-400">
                    Cantrips are 0-level spells that can be cast at will, without expending spell slots.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableCantrips.map((spell: AppSpell) => {
                        const isSelected = data.spellSelection.selectedCantrips.includes(spell.slug);
                        const canSelect = data.spellSelection.selectedCantrips.length < spellcasting.cantripsKnown;

                        return (
                            <button
                                key={spell.slug}
                                onClick={() => handleCantripToggle(spell.slug)}
                                disabled={!isSelected && !canSelect}
                                className={`p-3 rounded-lg border-2 text-left transition-all ${
                                    isSelected
                                        ? 'bg-blue-900 border-blue-500'
                                        : canSelect
                                        ? 'bg-gray-700 border-gray-600 hover:border-blue-400'
                                        : 'bg-gray-800 border-gray-700 opacity-50 cursor-not-allowed'
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="font-semibold text-white">{spell.name}</div>
                                        <div className="text-xs text-purple-300">{spell.school}</div>
                                    </div>
                                    {isSelected && <Check className="w-5 h-5 text-green-400" />}
                                </div>
                                <div className="text-xs text-gray-400 mt-2 line-clamp-2">
                                    {spell.description}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {spell.castingTime} • {spell.range}
                                    {spell.concentration && ' • Concentration'}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Spell Selection Sections - Varies by spellcasting type */}
            {spellcastingType === 'wizard' && (
                <>
                    {/* Wizard Spellbook Section */}
                    <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 space-y-3">
                        <h4 className="text-lg font-bold text-yellow-300">
                            Spellbook ({data.spellSelection.spellbook?.length || 0} / 6 selected)
                        </h4>
                        <p className="text-xs text-gray-400">
                            Choose 6 1st-level spells for your permanent spellbook. You can prepare a subset of these each day.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {availableSpells.map((spell: AppSpell) => {
                                const isSelected = data.spellSelection.spellbook?.includes(spell.slug) || false;
                                const canSelect = (data.spellSelection.spellbook?.length || 0) < 6;

                                return (
                                    <button
                                        key={spell.slug}
                                        onClick={() => handleSpellToggle(spell.slug, 'spellbook')}
                                        disabled={!isSelected && !canSelect}
                                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                                            isSelected
                                                ? 'bg-blue-900 border-blue-500'
                                                : canSelect
                                                ? 'bg-gray-700 border-gray-600 hover:border-blue-400'
                                                : 'bg-gray-800 border-gray-700 opacity-50 cursor-not-allowed'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="font-semibold text-white">{spell.name}</div>
                                                <div className="text-xs text-purple-300">{spell.school}</div>
                                            </div>
                                            {isSelected && <Check className="w-5 h-5 text-green-400" />}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-2 line-clamp-2">
                                            {spell.description}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {spell.castingTime} • {spell.range}
                                            {spell.concentration && ' • Concentration'}
                                            {spell.ritual && ' • Ritual'}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Wizard Daily Preparation Section */}
                    <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 space-y-3">
                        <h4 className="text-lg font-bold text-yellow-300">
                            Daily Preparation ({data.spellSelection.dailyPrepared?.length || 0} / {Math.max(1, Math.floor((data.abilities.INT - 10) / 2) + 1)} selected)
                        </h4>
                        <p className="text-xs text-gray-400">
                            Choose spells to prepare for today from your spellbook. You can change this after a long rest.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {(data.spellSelection.spellbook || []).map((spellSlug) => {
                                const spell = availableSpells.find(s => s.slug === spellSlug);
                                if (!spell) return null;

                                const isSelected = data.spellSelection.dailyPrepared?.includes(spell.slug) || false;
                                const maxPrepared = Math.max(1, Math.floor((data.abilities.INT - 10) / 2) + 1);
                                const canSelect = (data.spellSelection.dailyPrepared?.length || 0) < maxPrepared;

                                return (
                                    <button
                                        key={spell.slug}
                                        onClick={() => handleSpellToggle(spell.slug, 'dailyPrepared')}
                                        disabled={!isSelected && !canSelect}
                                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                                            isSelected
                                                ? 'bg-green-900 border-green-500'
                                                : canSelect
                                                ? 'bg-gray-700 border-gray-600 hover:border-green-400'
                                                : 'bg-gray-800 border-gray-700 opacity-50 cursor-not-allowed'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="font-semibold text-white">{spell.name}</div>
                                                <div className="text-xs text-purple-300">{spell.school}</div>
                                            </div>
                                            {isSelected && <Check className="w-5 h-5 text-green-400" />}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-2 line-clamp-2">
                                            {spell.description}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {spell.castingTime} • {spell.range}
                                            {spell.concentration && ' • Concentration'}
                                            {spell.ritual && ' • Ritual'}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}

            {spellcastingType === 'known' && (
                <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 space-y-3">
                    <h4 className="text-lg font-bold text-yellow-300">
                        Spells Known ({data.spellSelection.knownSpells?.length || 0} / {spellcasting.spellsKnownOrPrepared} selected)
                    </h4>
                    <p className="text-xs text-gray-400">
                        These are the spells your character knows permanently. You can change them when you level up.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {availableSpells.map((spell: AppSpell) => {
                            const isSelected = data.spellSelection.knownSpells?.includes(spell.slug) || false;
                            const canSelect = (data.spellSelection.knownSpells?.length || 0) < spellcasting.spellsKnownOrPrepared;

                            return (
                                <button
                                    key={spell.slug}
                                    onClick={() => handleSpellToggle(spell.slug, 'knownSpells')}
                                    disabled={!isSelected && !canSelect}
                                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                                        isSelected
                                            ? 'bg-blue-900 border-blue-500'
                                            : canSelect
                                            ? 'bg-gray-700 border-gray-600 hover:border-blue-400'
                                            : 'bg-gray-800 border-gray-700 opacity-50 cursor-not-allowed'
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="font-semibold text-white">{spell.name}</div>
                                            <div className="text-xs text-purple-300">{spell.school}</div>
                                        </div>
                                        {isSelected && <Check className="w-5 h-5 text-green-400" />}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-2 line-clamp-2">
                                        {spell.description}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {spell.castingTime} • {spell.range}
                                        {spell.concentration && ' • Concentration'}
                                        {spell.ritual && ' • Ritual'}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {spellcastingType === 'prepared' && (
                <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 space-y-3">
                    <h4 className="text-lg font-bold text-yellow-300">
                        Prepared Spells ({data.spellSelection.preparedSpells?.length || 0} / {spellcasting.spellsKnownOrPrepared} selected)
                    </h4>
                    <p className="text-xs text-gray-400">
                        Choose spells to prepare. You can change your prepared spells after a long rest.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {availableSpells.map((spell: AppSpell) => {
                            const isSelected = data.spellSelection.preparedSpells?.includes(spell.slug) || false;
                            const canSelect = (data.spellSelection.preparedSpells?.length || 0) < spellcasting.spellsKnownOrPrepared;

                            return (
                                <button
                                    key={spell.slug}
                                    onClick={() => handleSpellToggle(spell.slug, 'preparedSpells')}
                                    disabled={!isSelected && !canSelect}
                                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                                        isSelected
                                            ? 'bg-blue-900 border-blue-500'
                                            : canSelect
                                            ? 'bg-gray-700 border-gray-600 hover:border-blue-400'
                                            : 'bg-gray-800 border-gray-700 opacity-50 cursor-not-allowed'
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="font-semibold text-white">{spell.name}</div>
                                            <div className="text-xs text-purple-300">{spell.school}</div>
                                        </div>
                                        {isSelected && <Check className="w-5 h-5 text-green-400" />}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-2 line-clamp-2">
                                        {spell.description}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {spell.castingTime} • {spell.range}
                                        {spell.concentration && ' • Concentration'}
                                        {spell.ritual && ' • Ritual'}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div className='flex justify-between'>
                <button onClick={prevStep} className='px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 flex items-center gap-2'>
                    <ArrowLeft className='w-4 h-4' />
                    Back
                </button>
                <button
                    onClick={nextStep}
                    disabled={!allSelectionsComplete}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                        allSelectionsComplete
                            ? 'bg-red-700 text-white hover:bg-red-600'
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                >
                    Next: Abilities
                    <ArrowRight className='w-4 h-4' />
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
                    Next: Traits <ArrowRight className="w-4 h-4 ml-2" />
                </button>
            </div>
        </div>
    );
};

// Sprint 5: Feats Selection Step
const Step5point5Feats: React.FC<StepProps> = ({ data, updateData, nextStep, prevStep }) => {
    const [showFeatDetails, setShowFeatDetails] = useState<string | null>(null);

    // Calculate how many feats the character can take
    const maxFeats = Math.floor((data.level - 1) / 4); // 0 at levels 1-3, 1 at 4-7, 2 at 8-11, etc.
    const selectedFeats = data.selectedFeats || [];

    // For now, all feats are available (prerequisite checking can be enhanced later)
    const availableFeats = FEAT_DATABASE;

    const handleFeatToggle = (featSlug: string) => {
        const isSelected = selectedFeats.includes(featSlug);

        if (isSelected) {
            // Deselect
            updateData({
                selectedFeats: selectedFeats.filter(s => s !== featSlug)
            });
        } else if (selectedFeats.length < maxFeats) {
            // Select
            updateData({
                selectedFeats: [...selectedFeats, featSlug]
            });
        }
    };

    return (
        <div className='space-y-6'>
            <div className='flex justify-between items-start'>
                <div className='flex-1'>
                    <h3 className='text-xl font-bold text-red-300'>Choose Feats (Optional)</h3>
                    <p className='text-sm text-gray-400 mt-2'>
                        Feats represent special talents or areas of expertise. At certain levels, you can choose to take a feat instead of an Ability Score Improvement.
                    </p>
                    <div className="mt-2 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                        <div className="text-sm text-blue-300">
                            <strong>Level {data.level}:</strong> You can select up to {maxFeats} feat{maxFeats !== 1 ? 's' : ''}
                        </div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
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
                <div className="bg-green-900/20 border border-green-700 rounded-lg p-3">
                    <div className="text-sm font-semibold text-green-400 mb-2">
                        Selected Feats ({selectedFeats.length} / {maxFeats}):
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {selectedFeats.map(slug => {
                            const feat = FEAT_DATABASE.find(f => f.slug === slug);
                            return (
                                <span key={slug} className="px-2 py-1 bg-green-700 text-white text-xs rounded">
                                    {feat?.name}
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}

            {maxFeats > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-2">
                    {availableFeats.map(feat => {
                        const isSelected = selectedFeats.includes(feat.slug);
                        const canSelect = selectedFeats.length < maxFeats;

                        return (
                            <div key={feat.slug} className="relative">
                                <button
                                    onClick={() => handleFeatToggle(feat.slug)}
                                    disabled={!canSelect && !isSelected}
                                    className={`w-full p-3 rounded-lg text-left border-2 transition-all ${
                                        isSelected
                                            ? 'bg-green-800 border-green-500 shadow-md'
                                            : canSelect
                                            ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                                            : 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <p className="text-sm font-bold text-yellow-300">{feat.name}</p>
                                        {feat.abilityScoreIncrease && (
                                            <span className="text-xs bg-blue-600 text-white px-1 py-0.5 rounded ml-2">
                                                +ASI
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{feat.source} {feat.year}</p>
                                    {feat.prerequisite && (
                                        <p className="text-xs text-yellow-400 mt-1">
                                            Requires: {feat.prerequisite}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                                        {feat.description}
                                    </p>
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowFeatDetails(showFeatDetails === feat.slug ? null : feat.slug);
                                    }}
                                    className="absolute top-2 right-2 text-xs text-blue-400 hover:text-blue-300"
                                    title="View details"
                                >
                                    {showFeatDetails === feat.slug ? '✕' : 'ℹ️'}
                                </button>
                                {showFeatDetails === feat.slug && (
                                    <div className="absolute z-10 mt-2 p-3 bg-gray-900 border border-gray-600 rounded-lg shadow-xl w-80 left-0">
                                        <h5 className="font-bold text-yellow-300 text-sm mb-2">{feat.name}</h5>
                                        <p className="text-xs text-gray-300 mb-2">{feat.description}</p>
                                        <div className="text-xs text-gray-400">
                                            <strong className="text-gray-300">Benefits:</strong>
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
                <div className="text-center text-gray-400 py-8">
                    <p>Feats become available starting at level 4.</p>
                    <p className="text-sm mt-2">Your character is currently level {data.level}.</p>
                </div>
            )}

            <div className='flex justify-between'>
                <button onClick={prevStep} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white flex items-center">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </button>
                <button
                    onClick={nextStep}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white flex items-center"
                >
                    Next: Equipment <ArrowRight className="w-4 h-4 ml-2" />
                </button>
            </div>
        </div>
    );
};

const Step6Equipment: React.FC<StepProps & { skipToStep?: (step: number) => void }> = ({ data, updateData, nextStep, prevStep, skipToStep }) => {
    const allClasses = loadClasses();
    const selectedClass = allClasses.find(c => c.slug === data.classSlug);

    if (!selectedClass) {
        return <div>Loading...</div>;
    }

    // Initialize equipment choices if not already set
    const equipmentChoices = data.equipmentChoices || [];
    if (equipmentChoices.length === 0 && Array.isArray(selectedClass.equipment_choices) && selectedClass.equipment_choices.length > 0) {
        updateData({ equipmentChoices: selectedClass.equipment_choices });
    }

    const handleEquipmentChoice = (choiceId: string, optionIndex: number) => {
        const currentChoices = data.equipmentChoices || [];
        const updatedChoices = currentChoices.map(choice =>
            choice.choiceId === choiceId ? { ...choice, selected: optionIndex } : choice
        );
        updateData({ equipmentChoices: updatedChoices });
    };

    const allChoicesMade = (data.equipmentChoices || []).every(choice => choice.selected !== null);

    return (
        <div className='space-y-6'>
            <div>
                <h3 className='text-xl font-bold text-red-300'>Select Starting Equipment</h3>
                <p className="text-sm text-gray-400 mt-1">
                    Choose your starting equipment based on your class. Your background will also grant additional items.
                </p>
            </div>

            {/* Equipment Choices */}
            {(data.equipmentChoices || []).map((choice, idx) => (
                <div key={choice.choiceId} className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold text-yellow-300">
                        {idx + 1}. {choice.description}
                    </h4>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         {choice.options.map((option, optionIdx) => {
                             // Check if this option contains an equipment pack
                             const packOption = option.find(item =>
                                 EQUIPMENT_PACKAGES.some(pack => pack.name === item.name)
                             );
                             const pack = packOption ? EQUIPMENT_PACKAGES.find(p => p.name === packOption.name) : null;

                             if (pack) {
                                 // Display as expandable pack
                                 return (
                                     <EquipmentPackDisplay
                                         key={optionIdx}
                                         pack={pack}
                                         isSelected={choice.selected === optionIdx}
                                         onClick={() => handleEquipmentChoice(choice.choiceId, optionIdx)}
                                         showRecommendation={true}
                                         characterClass={data.classSlug}
                                     />
                                 );
                             } else {
                                 // Display as regular equipment option
                                 return (
                                     <button
                                         key={optionIdx}
                                         onClick={() => handleEquipmentChoice(choice.choiceId, optionIdx)}
                                         className={`p-3 rounded-lg border-2 text-left transition-all ${
                                             choice.selected === optionIdx
                                                 ? 'bg-blue-800 border-blue-500'
                                                 : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                                         }`}
                                     >
                                         <div className="space-y-1">
                                             {option.map((item, itemIdx) => (
                                                 <div key={itemIdx} className="text-sm">
                                                     <span className="text-white font-medium">{item.name}</span>
                                                     {item.quantity > 1 && (
                                                         <span className="text-gray-400 ml-1">x{item.quantity}</span>
                                                     )}
                                                     {item.weight && item.weight > 0 && (
                                                         <span className="text-gray-500 text-xs ml-2">({item.weight} lb)</span>
                                                     )}
                                                 </div>
                                             ))}
                                         </div>
                                     </button>
                                 );
                             }
                         })}
                    </div>
                </div>
            ))}

            {/* Background Equipment Info */}
            {(() => {
                const backgroundData = BACKGROUNDS.find(bg => bg.name === data.background);
                if (backgroundData?.equipment) {
                    return (
                        <div className="p-3 bg-green-900/20 border border-green-700 rounded-lg">
                            <div className="text-xs font-semibold text-green-400 mb-2">
                                Background Equipment (Auto-granted from {data.background}):
                            </div>
                            <div className="space-y-1">
                                {Array.isArray(backgroundData.equipment)
                                    ? backgroundData.equipment.map((item, index) => (
                                        <div key={index} className="text-sm text-gray-300">• {item}</div>
                                      ))
                                    : <p className="text-sm text-gray-300">{backgroundData.equipment}</p>
                                }
                            </div>
                        </div>
                    );
                }
                return null;
            })()}

            {!allChoicesMade && (
                <div className="text-xs text-yellow-400">
                    ⚠️ Please make all equipment choices before continuing
                </div>
            )}

            <div className='flex justify-between items-center gap-3'>
                <button onClick={prevStep} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white flex items-center">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </button>
                <button
                    onClick={nextStep}
                    disabled={!allChoicesMade}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg text-white flex items-center disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    Custom Equipment <ArrowRight className="w-4 h-4 ml-2" />
                </button>
                <button
                    onClick={() => {
                        // Skip custom equipment step, go directly to traits (step 11)
                        if (allChoicesMade && skipToStep) {
                            skipToStep(11); // Skip to Traits/Final details step
                        }
                    }}
                    disabled={!allChoicesMade}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white flex items-center disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    Skip to Traits <ArrowRight className="w-4 h-4 ml-2" />
                </button>
            </div>
        </div>
    );
};

const Step8Traits: React.FC<StepProps & { onSubmit: (data: CharacterCreationData) => void }> = ({ data, updateData, prevStep, onSubmit }) => {
    // Set default personality traits for Outlander background
    React.useEffect(() => {
        if (data.background === 'Outlander' && !data.personality) {
            updateData({
                personality: "I'm driven by a wanderlust that led me away from home. I watch over my friends as if they were a litter of newborn pups."
            });
        }
        if (data.background === 'Outlander' && !data.ideals) {
            updateData({
                ideals: "Change: Life is like the seasons, in constant change, and we must change with it. (Chaotic)"
            });
        }
        if (data.background === 'Outlander' && !data.bonds) {
            updateData({
                bonds: "My family, clan, or tribe is the most important thing in my life, even when they are far from me."
            });
        }
        if (data.background === 'Outlander' && !data.flaws) {
            updateData({
                flaws: "I am too enamored of ale, wine, and other intoxicants."
            });
        }
    }, [data.background, data.personality, data.ideals, data.bonds, data.flaws, updateData]);

    return (
        <div className='space-y-6'>
            <div className='flex justify-between items-center'>
                <h3 className='text-xl font-bold text-red-300'>Final Details & Personality</h3>
                <RandomizeButton
                    onClick={() => {
                        const personality = randomizePersonality();
                        updateData(personality);
                    }}
                    title="Randomize personality traits"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Personality Traits
                </label>
                <textarea
                    placeholder="Describe your character's personality traits and quirks..."
                    value={data.personality}
                    onChange={(e) => updateData({ personality: e.target.value })}
                    className="w-full h-20 p-3 bg-gray-700 text-white rounded-lg focus:ring-red-500 focus:border-red-500 resize-none"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Ideals
                </label>
                <textarea
                    placeholder="What principles and beliefs guide your character?"
                    value={data.ideals}
                    onChange={(e) => updateData({ ideals: e.target.value })}
                    className="w-full h-16 p-3 bg-gray-700 text-white rounded-lg focus:ring-red-500 focus:border-red-500 resize-none"
                />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Bonds
                    </label>
                    <textarea
                        placeholder="Who or what is your character connected to?"
                        value={data.bonds}
                        onChange={(e) => updateData({ bonds: e.target.value })}
                        className="w-full h-16 p-3 bg-gray-700 text-white rounded-lg focus:ring-red-500 focus:border-red-500 resize-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Flaws
                    </label>
                    <textarea
                        placeholder="What weaknesses does your character have?"
                        value={data.flaws}
                        onChange={(e) => updateData({ flaws: e.target.value })}
                        className="w-full h-16 p-3 bg-gray-700 text-white rounded-lg focus:ring-red-500 focus:border-red-500 resize-none"
                    />
                </div>
            </div>

            {/* Hit Points Calculation Method */}
            {(() => {
                const allClasses = loadClasses();
                const selectedClass = allClasses.find(c => c.slug === data.classSlug);
                if (!selectedClass) return null;

                const conModifier = getModifier(data.abilities.CON);

                return (
                    <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 space-y-3">
                        <h4 className="text-lg font-bold text-yellow-300">Starting Hit Points</h4>
                        <p className="text-xs text-gray-400">
                            Choose how to determine your starting HP (at 1st level, most players take maximum).
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <button
                                onClick={() => updateData({ hpCalculationMethod: 'max', rolledHP: undefined })}
                                className={`p-3 rounded-lg border-2 text-left transition-all ${
                                    data.hpCalculationMethod === 'max'
                                        ? 'bg-blue-800 border-blue-500'
                                        : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                                }`}
                            >
                                <div className="font-semibold text-white">Take Maximum (Recommended)</div>
                                <div className="text-sm text-gray-300 mt-1">
                                    {selectedClass.hit_die} + {conModifier} = {selectedClass.hit_die + conModifier} HP
                                </div>
                                <div className="text-xs text-gray-400 mt-1">Standard for 1st level characters</div>
                            </button>

                            <button
                                onClick={() => {
                                    // Roll the hit die
                                    const rolled = rollDice(1, selectedClass.hit_die)[0];
                                    updateData({ hpCalculationMethod: 'rolled', rolledHP: rolled });
                                }}
                                className={`p-3 rounded-lg border-2 text-left transition-all ${
                                    data.hpCalculationMethod === 'rolled'
                                        ? 'bg-blue-800 border-blue-500'
                                        : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                                }`}
                            >
                                <div className="font-semibold text-white">Roll Hit Die</div>
                                <div className="text-sm text-gray-300 mt-1">
                                    {data.hpCalculationMethod === 'rolled' && data.rolledHP ? (
                                        <>
                                            Rolled: {data.rolledHP} + {conModifier} = {data.rolledHP + conModifier} HP
                                        </>
                                    ) : (
                                        <>
                                            1d{selectedClass.hit_die} + {conModifier}
                                        </>
                                    )}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                    {data.hpCalculationMethod === 'rolled' ? 'Click to re-roll' : 'Click to roll'}
                                </div>
                            </button>
                        </div>

                        <div className="text-xs text-gray-500 mt-2">
                            Final HP: <span className="text-white font-bold">
                                {data.hpCalculationMethod === 'max'
                                    ? selectedClass.hit_die + conModifier
                                    : data.rolledHP ? data.rolledHP + conModifier : 0
                                } HP
                            </span>
                        </div>
                    </div>
                );
            })()}

            <div className='flex justify-between'>
                <button onClick={prevStep} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white flex items-center"><ArrowLeft className="w-4 h-4 mr-2" /> Back</button>
                <button onClick={() => onSubmit(data)} className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white flex items-center font-bold">Create Character <Check className="w-4 h-4 ml-2" /></button>
            </div>
        </div>
    );
};

const Step9Languages: React.FC<StepProps> = ({ data, updateData, nextStep, prevStep }) => {
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
                    Next: Final Details <ArrowRight className="w-4 h-4 ml-2" />
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

const Step7EquipmentBrowser: React.FC<EquipmentBrowserProps> = ({ data, updateData, prevStep, skipToStep }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('All');
    const [yearFilter, setYearFilter] = useState<number | 'all'>('all');
    const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

    // Get all equipment categories
    const categories = ['All', ...Array.from(new Set(EQUIPMENT_DATABASE.map(eq => eq.equipment_category)))];

    // Filter equipment
    const filteredEquipment = EQUIPMENT_DATABASE.filter(eq => {
        const matchesSearch = eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             eq.equipment_category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || eq.equipment_category === categoryFilter;
        const matchesYear = yearFilter === 'all' || eq.year === yearFilter;
        return matchesSearch && matchesCategory && matchesYear;
    });

    // Check if item is already in starting inventory
    const isInInventory = (equipmentSlug: string): number => {
        return data.startingInventory?.filter(item => item.equipmentSlug === equipmentSlug)
                                      .reduce((sum, item) => sum + item.quantity, 0) || 0;
    };

    // Add item to starting inventory
    const addToInventory = (equipmentSlug: string) => {
        const currentInventory = data.startingInventory || [];
        const existingItem = currentInventory.find(item => item.equipmentSlug === equipmentSlug);

        if (existingItem) {
            updateData({
                startingInventory: currentInventory.map(item =>
                    item.equipmentSlug === equipmentSlug
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            });
        } else {
            updateData({
                startingInventory: [...currentInventory, {
                    equipmentSlug,
                    quantity: 1,
                    equipped: false
                }]
            });
        }
    };

    // Remove item from starting inventory
    const removeFromInventory = (equipmentSlug: string) => {
        const currentInventory = data.startingInventory || [];
        const existingItem = currentInventory.find(item => item.equipmentSlug === equipmentSlug);

        if (existingItem && existingItem.quantity > 1) {
            updateData({
                startingInventory: currentInventory.map(item =>
                    item.equipmentSlug === equipmentSlug
                        ? { ...item, quantity: item.quantity - 1 }
                        : item
                )
            });
        } else {
            updateData({
                startingInventory: currentInventory.filter(item => item.equipmentSlug !== equipmentSlug)
            });
        }
    };

    return (
        <div className="space-y-4">
            <div className='flex justify-between items-start'>
                <div className='flex-1'>
                    <h3 className="text-xl font-bold text-yellow-300 mb-2">Customize Starting Equipment</h3>
                    <p className="text-sm text-gray-400">
                        Browse and add additional equipment to your starting inventory. You already have your class equipment package.
                    </p>
                </div>
                <RandomizeButton
                    onClick={() => {
                        const additionalEquipment = randomizeAdditionalEquipment();
                        updateData({ startingInventory: additionalEquipment });
                    }}
                    title="Randomize additional equipment"
                />
            </div>

            {/* Search and Filters */}
            <div className="space-y-3">
                <input
                    type="text"
                    placeholder="Search equipment..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-yellow-500 focus:outline-none"
                />

                <div className="flex gap-2 flex-wrap">
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-yellow-500 focus:outline-none"
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>

                    <select
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                        className="px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-yellow-500 focus:outline-none"
                    >
                        <option value="all">All Editions</option>
                        <option value="2014">2014 SRD</option>
                        <option value="2024">2024 SRD</option>
                    </select>
                </div>
            </div>

            {/* Equipment List */}
            <div className="bg-gray-700/30 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                <div className="grid grid-cols-1 gap-2">
                    {filteredEquipment.slice(0, 50).map(eq => {
                        const inInventory = isInInventory(eq.slug);
                        return (
                            <div
                                key={`${eq.slug}-${eq.year}`}
                                className="bg-gray-700/50 p-3 rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex-grow min-w-0">
                                        <button
                                            onClick={() => setSelectedEquipment(eq)}
                                            className="text-left hover:text-yellow-300 transition-colors"
                                        >
                                            <div className="font-semibold text-white">{eq.name}</div>
                                            <div className="text-xs text-gray-400 flex items-center gap-2 flex-wrap">
                                                <span>{eq.equipment_category}</span>
                                                <span>•</span>
                                                <span>{eq.cost.quantity} {eq.cost.unit}</span>
                                                <span>•</span>
                                                <span>{eq.weight} lb</span>
                                                <span className="bg-gray-600 px-2 py-0.5 rounded">{eq.year === 2024 ? '2024' : '2014'}</span>
                                            </div>
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {inInventory > 0 && (
                                            <span className="text-sm font-mono text-yellow-300">×{inInventory}</span>
                                        )}
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => addToInventory(eq.slug)}
                                                className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-sm"
                                            >
                                                +
                                            </button>
                                            {inInventory > 0 && (
                                                <button
                                                    onClick={() => removeFromInventory(eq.slug)}
                                                    className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-sm"
                                                >
                                                    −
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                {filteredEquipment.length > 50 && (
                    <p className="text-center text-xs text-gray-400 mt-3">
                        Showing first 50 results. Refine your search to see more.
                    </p>
                )}
                {filteredEquipment.length === 0 && (
                    <p className="text-center text-gray-400 py-8">No equipment found matching your filters.</p>
                )}
            </div>

            {/* Current Custom Additions */}
            {data.startingInventory && data.startingInventory.length > 0 && (
                <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-yellow-400 mb-2">
                        Custom Equipment Added ({data.startingInventory.length} items)
                    </h4>
                    <div className="text-xs text-gray-400">
                        These items will be added to your starting inventory along with your class equipment package.
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4">
                <button
                    onClick={prevStep}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white flex items-center"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </button>
                <button
                    onClick={() => skipToStep?.(11)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white flex items-center"
                >
                    Next: Background <ArrowRight className="w-4 h-4 ml-2" />
                </button>
            </div>

            {/* Equipment Detail Modal */}
            {selectedEquipment && (
                <EquipmentDetailModal
                    equipment={selectedEquipment}
                    onClose={() => setSelectedEquipment(null)}
                />
            )}
        </div>
    );
};

// --- Main Wizard Component ---

const CharacterCreationWizard: React.FC<WizardProps> = ({ isOpen, onClose, onCharacterCreated, setRollResult }) => {
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [creationData, setCreationData] = useState<CharacterCreationData>(initialCreationData);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const updateData = (updates: Partial<CharacterCreationData>) => {
        setCreationData(prev => ({ ...prev, ...updates }));
    };

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEP_TITLES.length - 1));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));
    const skipToStep = (step: number) => setCurrentStep(Math.min(Math.max(step, 0), STEP_TITLES.length - 1));

    const handleSubmit = async (data: CharacterCreationData) => {
        setIsLoading(true);
        setError(null);
        setRollResult({ text: "Creating character sheet...", value: 0 });

        try {
            const finalCharacter = calculateCharacterStats(data);
            await addCharacter(finalCharacter);

            setRollResult({ text: `Successfully created ${finalCharacter.name}!`, value: 0 });
            onCharacterCreated();
            onClose();
            setCreationData(initialCreationData);
            setCurrentStep(0);
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during character creation.";
            console.error("Error creating character:", e);
            setError(`Error: ${errorMessage}. Check console for details.`);
        } finally {
            setIsLoading(false);
        }
    };

    const renderStep = () => {
        const commonProps = { data: creationData, updateData, nextStep, prevStep, stepIndex: currentStep };
        switch (currentStep) {
            case 0: return <Step0Level {...commonProps} />;
            case 1: return <Step1Details {...commonProps} />;
            case 2: return <Step2Race {...commonProps} />;
            case 3: return <Step3Class {...commonProps} />;
            case 4: return <Step3point5FightingStyle {...commonProps} />; // Sprint 5: Fighting Style (Fighter/Paladin/Ranger)
            case 5: return <Step4Spells {...commonProps} />; // Sprint 2: Spell selection
            case 6: return <Step4Abilities {...commonProps} />;
            case 7: return <Step5point5Feats {...commonProps} />; // Sprint 5: Feats selection
            case 8: return <Step9Languages {...commonProps} />; // Language selection
            case 9: return <Step6Equipment {...commonProps} skipToStep={skipToStep} />;
            case 10: return <Step7EquipmentBrowser {...commonProps} skipToStep={skipToStep} />; // Sprint 4: Equipment browser
            case 11: return <Step8Traits {...commonProps} onSubmit={handleSubmit} />;
            default: return <p>Unknown step.</p>;
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
            <div
                className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl transition-all transform duration-300 scale-100 my-8 flex flex-col max-h-[calc(100vh-4rem)]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Fixed Header */}
                <div className="flex-shrink-0 p-6 md:p-8 pb-4">
                    <div className="flex justify-between items-center border-b border-red-700 pb-3">
                        <h2 className="text-2xl font-bold text-red-500 flex items-center">
                            <Dice6 className="w-6 h-6 mr-2" /> {STEP_TITLES[currentStep]}
                        </h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white text-xl font-bold">&times;</button>
                    </div>

                    {/* Progress Bar */}
                    <div className='mt-4'>
                        <div className='h-2 bg-gray-700 rounded-full overflow-hidden'>
                            <div
                                className='h-full bg-red-600 transition-all duration-500'
                                style={{ width: `${((currentStep + 1) / STEP_TITLES.length) * 100}%` }}
                            />
                        </div>
                        <p className='text-center text-sm text-gray-400 mt-2'>Step {currentStep + 1} of {STEP_TITLES.length}</p>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 md:px-8 pb-6 md:pb-8">
                    {/* Error & Loading */}
                    {error && (<div className="bg-red-900/50 text-red-300 p-3 rounded-lg mb-4 text-sm font-medium">{error}</div>)}
                    {isLoading && (
                        <div className="text-center p-8">
                            <Loader2 className="w-8 h-8 mx-auto animate-spin text-red-500" />
                            <p className="mt-2 text-red-400">Calculating stats and saving...</p>
                        </div>
                    )}

                    {/* Wizard Content */}
                    {!isLoading && renderStep()}
                </div>
            </div>
        </div>
    );
};


/** Main Application Component */
const App: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<Set<string>>(new Set());
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [rollResult, setRollResult] = useState<{ text: string; value: number | null }>({ text: 'Ready to Roll!', value: null });
  const [rollHistory, setRollHistory] = useState<DiceRollType[]>([]);
  const [latestRoll, setLatestRoll] = useState<DiceRollType | null>(null);
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
    const featureDesc = featureDescriptions[featureName];
    if (featureDesc) {
      setFeatureModal({ name: featureName, ...featureDesc });
    } else {
      setFeatureModal({ name: featureName, description: 'No description available for this feature.' });
    }
  }, []);

  // Load roll history on mount
  useEffect(() => {
    const history = getRollHistory();
    setRollHistory(history);
  }, []);

  // Handle dice roll
  const handleDiceRoll = useCallback((roll: DiceRollType) => {
    // Add to history
    const updatedHistory = addRollToHistory(roll);
    setRollHistory(updatedHistory);
    setLatestRoll(roll);

    // Play sounds
    diceSounds.playRollSound(roll.diceResults.length);

    if (roll.critical === 'success') {
      setTimeout(() => diceSounds.playCritSuccessSound(), 300);
    } else if (roll.critical === 'failure') {
      setTimeout(() => diceSounds.playCritFailureSound(), 300);
    }
  }, []);

  // Clear roll history
  const handleClearHistory = useCallback(() => {
    clearRollHistory();
    setRollHistory([]);
  }, []);

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

    const hitDie = classData.hit_die;
    const conModifier = character.abilities.CON.modifier;
    const hpIncrease = Math.max(1, Math.floor(hitDie / 2) + 1 + conModifier);

    const updatedCharacter = {
      ...character,
      level: newLevel,
      proficiencyBonus: newProficiencyBonus,
      maxHitPoints: character.maxHitPoints + hpIncrease,
      hitPoints: character.maxHitPoints + hpIncrease, // Also heal to full on level up
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

    const asiLevels = [4, 8, 12, 16, 19];
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
        <RollHistoryModal rolls={rollHistory} onClear={handleClearHistory} />
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

        {/* Dice Roll Display */}
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-xl transition-all duration-300 z-40
          ${rollResult.value !== null ? 'bg-green-800/90 border border-green-500' : 'bg-gray-800/90 border border-gray-600'}`}
        >
          <div className="text-sm font-semibold text-gray-300">{rollResult.text}</div>
          {rollResult.value !== null && (
            <div className="text-4xl font-extrabold text-yellow-300 mt-1">
              {rollResult.value}
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

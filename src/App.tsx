import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Dice6, Plus, Trash2, Loader2, BookOpen, User as UserIcon, Shield, Zap, ArrowLeft, ArrowRight, Check, Download, Upload, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { DiceBox3D } from './components/DiceBox3D';
import { RollHistoryModal, RollHistoryTicker } from './components/RollHistory';
import { FeatureModal } from './components/FeatureModal';
import { createAbilityRoll, createSkillRoll, createInitiativeRoll, getRollHistory, addRollToHistory, clearRollHistory, rollDice, generateUUID, type DiceRoll as DiceRollType } from './utils/diceRoller';
import { diceSounds } from './utils/diceSounds';
import { featureDescriptions } from './utils/featureDescriptions';
import { loadSpells, loadRaces, loadClasses } from './utils/srdLoader';

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
interface AbilityScore { score: number; modifier: number; }
interface Skill { value: number; proficient: boolean; }

interface Character {
  id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  alignment: string;
  background: string;
  inspiration: boolean;
  proficiencyBonus: number;
  armorClass: number;
  hitPoints: number;
  maxHitPoints: number;
  speed: number;
  initiative: number;
  abilities: {
    STR: AbilityScore; DEX: AbilityScore; CON: AbilityScore;
    INT: AbilityScore; WIS: AbilityScore; CHA: AbilityScore;
  };
  skills: {
    Acrobatics: Skill; AnimalHandling: Skill; Arcana: Skill; Athletics: Skill; Deception: Skill; History: Skill; Insight: Skill; Intimidation: Skill; Investigation: Skill; Medicine: Skill; Nature: Skill; Perception: Skill; Performance: Skill; Persuasion: Skill; Religion: Skill; SleightOfHand: Skill; Stealth: Skill; Survival: Skill;
  };
  featuresAndTraits: {
    personality: string;
    ideals: string;
    bonds: string;
    flaws: string;
    classFeatures: string[];
    racialTraits: string[];
  };

  // Sprint 2: Spellcasting data
  spellcasting?: {
    ability: 'INT' | 'WIS' | 'CHA';
    spellSaveDC: number;
    spellAttackBonus: number;
    cantripsKnown: string[]; // Spell slugs
    spellsKnown: string[]; // Spell slugs for known/prepared spells
    spellSlots: number[]; // Available spell slots by level
  };

  // Sprint 3: Character advancement
  subclass?: string; // Subclass name (e.g., "School of Evocation")
  experiencePoints?: number; // Current XP
  feats?: string[]; // Feat slugs
}

// --- Intermediate Wizard Data Structure ---
type AbilityName = keyof Character['abilities'];
type SkillName = keyof Character['skills'];

// Equipment and Skill interfaces for character creation
interface EquipmentItem {
  name: string;
  type: 'weapon' | 'armor' | 'gear' | 'tool';
  quantity: number;
  weight?: number;
}

interface EquipmentChoice {
  choiceId: string;
  description: string;
  options: EquipmentItem[][];
  selected: number | null; // Index of selected option
}

// Sprint 2: Spell system interfaces
interface Spell {
  slug: string;
  name: string;
  level: number; // 0 = cantrip, 1-9 = spell level
  school: 'Abjuration' | 'Conjuration' | 'Divination' | 'Enchantment' | 'Evocation' | 'Illusion' | 'Necromancy' | 'Transmutation';
  castingTime: string; // "1 action", "1 bonus action", "1 minute", etc.
  range: string; // "Self", "Touch", "30 feet", etc.
  components: {
    verbal: boolean;
    somatic: boolean;
    material: boolean;
    materialDescription?: string; // e.g., "a piece of cured leather"
  };
  duration: string; // "Instantaneous", "1 minute", "Concentration, up to 1 hour", etc.
  concentration: boolean;
  ritual: boolean;
  description: string;
  atHigherLevels?: string;
  damageType?: string;
  saveType?: 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';
  classes: string[]; // Which classes can learn this spell
}

interface SpellSelectionData {
  selectedCantrips: string[]; // Spell slugs
  selectedSpells: string[]; // Spell slugs for leveled spells
  spellbook?: string[]; // Only for wizards - spells in spellbook
  preparedSpells?: string[]; // Only for prepared casters (clerics, druids, paladins)
}

// Sprint 3: Feat system
interface Feat {
  slug: string;
  name: string;
  source: string;
  description: string;
  prerequisites?: string; // e.g., "Strength 13 or higher"
  abilityScoreIncrease?: {
    choices: number; // Number of ability scores to increase
    amount: number; // Amount to increase each (usually 1)
  };
  benefits: string[]; // List of mechanical benefits
}

interface CharacterCreationData {
  name: string;
  level: number;
  raceSlug: string;
  classSlug: string;
  abilities: Record<AbilityName, number>; // Raw scores only during creation
  abilityScoreMethod: 'standard-array' | 'standard-roll' | 'classic-roll' | '5d6-drop-2' | 'point-buy' | 'custom';
  background: string;
  alignment: string;

  // Sprint 1 additions
  selectedSkills: SkillName[]; // Skills chosen from class options
  equipmentChoices: EquipmentChoice[]; // Equipment selection choices
  hpCalculationMethod: 'max' | 'rolled';
  rolledHP?: number; // If rolled, store the result

  // Sprint 2: Spell selection
  spellSelection: SpellSelectionData;

  // Custom text for traits
  personality: string;
  ideals: string;
  bonds: string;
  flaws: string;
}

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
  personality: "I'm quiet until I have something important to say.",
  ideals: "Honesty. The truth must be preserved.",
  bonds: "I owe my life to the individual who saved me.",
  flaws: "I trust no one and question everything.",
};

// --- Mock API Data and Ruleset Functions (Simulating dnd5eapi.co) ---

interface Race {
  slug: string;
  name: string;
  source: string;
  ability_bonuses: Partial<Record<AbilityName, number>>;
  racial_traits: string[];
  description: string;
  typicalRoles: string[];
}

interface RaceCategory {
  name: string;
  icon: string;
  description: string;
  races: Race[];
}

// Load races from SRD
const SRD_RACES = loadRaces();

const RACE_CATEGORIES: RaceCategory[] = [
  {
    name: 'SRD Races (2014)',
    icon: '📖',
    description: 'Races from the System Reference Document',
    races: SRD_RACES,
  },
  {
    name: 'Original Hardcoded Races',
    icon: '📚',
    description: 'The most common and essential races from the Player\'s Handbook (backup)',
    races: [
      {
        slug: 'human',
        name: 'Human',
        source: 'Player\'s Handbook',
        ability_bonuses: { STR: 1, DEX: 1, CON: 1, INT: 1, WIS: 1, CHA: 1 },
        racial_traits: ['Ability Score Increase (+1 to all)', 'Speed 30ft', 'Extra Language'],
        description: 'Humans are the most adaptable and ambitious people among the common races. Whatever drives them, humans are the innovators, the achievers, and the pioneers of the worlds.',
        typicalRoles: ['Any class - extremely versatile'],
      },
      {
        slug: 'dwarf-mountain',
        name: 'Dwarf (Mountain)',
        source: 'Player\'s Handbook',
        ability_bonuses: { STR: 2, CON: 2 },
        racial_traits: ['Dwarven Armor Training', 'Speed 25ft', 'Darkvision', 'Dwarven Resilience'],
        description: 'Strong and hardy, mountain dwarves are well-suited for lives of adventuring. Taller than hill dwarves, they tend to have lighter coloration.',
        typicalRoles: ['Fighter', 'Paladin', 'Cleric'],
      },
      {
        slug: 'dwarf-hill',
        name: 'Dwarf (Hill)',
        source: 'Player\'s Handbook',
        ability_bonuses: { CON: 2, WIS: 1 },
        racial_traits: ['Dwarven Toughness (+1 HP/level)', 'Speed 25ft', 'Darkvision', 'Dwarven Resilience'],
        description: 'As a hill dwarf, you have keen senses, deep intuition, and remarkable resilience. Known for their wisdom and toughness.',
        typicalRoles: ['Cleric', 'Fighter', 'Barbarian'],
      },
      {
        slug: 'elf-high',
        name: 'Elf (High)',
        source: 'Player\'s Handbook',
        ability_bonuses: { DEX: 2, INT: 1 },
        racial_traits: ['Cantrip', 'Extra Language', 'Speed 30ft', 'Darkvision', 'Fey Ancestry'],
        description: 'High elves value magic in all its forms and even the warriors among them learn to use it.',
        typicalRoles: ['Wizard', 'Fighter', 'Ranger'],
      },
      {
        slug: 'elf-wood',
        name: 'Elf (Wood)',
        source: 'Player\'s Handbook',
        ability_bonuses: { DEX: 2, WIS: 1 },
        racial_traits: ['Fleet of Foot (35ft speed)', 'Mask of the Wild', 'Darkvision', 'Fey Ancestry'],
        description: 'Wood elves have keen senses and intuition, and their fleet feet carry them quickly through their forest homes.',
        typicalRoles: ['Ranger', 'Druid', 'Rogue', 'Monk'],
      },
      {
        slug: 'elf-drow',
        name: 'Elf (Drow)',
        source: 'Player\'s Handbook',
        ability_bonuses: { DEX: 2, CHA: 1 },
        racial_traits: ['Superior Darkvision (120ft)', 'Sunlight Sensitivity', 'Drow Magic', 'Fey Ancestry'],
        description: 'Descended from an earlier subrace of dark-skinned elves, the drow were banished from the surface world for their worship of evil gods.',
        typicalRoles: ['Warlock', 'Sorcerer', 'Rogue', 'Bard'],
      },
      {
        slug: 'halfling-lightfoot',
        name: 'Halfling (Lightfoot)',
        source: 'Player\'s Handbook',
        ability_bonuses: { DEX: 2, CHA: 1 },
        racial_traits: ['Naturally Stealthy', 'Lucky', 'Brave', 'Speed 25ft'],
        description: 'Lightfoot halflings can easily hide from notice, even using other people as cover. They\'re inclined to get along with others.',
        typicalRoles: ['Rogue', 'Bard', 'Warlock'],
      },
      {
        slug: 'halfling-stout',
        name: 'Halfling (Stout)',
        source: 'Player\'s Handbook',
        ability_bonuses: { DEX: 2, CON: 1 },
        racial_traits: ['Stout Resilience (poison advantage)', 'Lucky', 'Brave', 'Speed 25ft'],
        description: 'Stout halflings are hardier than average and have some resistance to poison. Some say they have dwarven blood.',
        typicalRoles: ['Fighter', 'Barbarian', 'Monk'],
      },
      {
        slug: 'gnome-forest',
        name: 'Gnome (Forest)',
        source: 'Player\'s Handbook',
        ability_bonuses: { INT: 2, DEX: 1 },
        racial_traits: ['Speak with Small Beasts', 'Minor Illusion cantrip', 'Darkvision', 'Gnome Cunning'],
        description: 'Forest gnomes have a natural knack for illusion and inherent quickness. They gather in hidden communities in sylvan forests.',
        typicalRoles: ['Wizard', 'Rogue', 'Ranger'],
      },
      {
        slug: 'gnome-rock',
        name: 'Gnome (Rock)',
        source: 'Player\'s Handbook',
        ability_bonuses: { INT: 2, CON: 1 },
        racial_traits: ['Artificer\'s Lore', 'Tinker', 'Darkvision', 'Gnome Cunning'],
        description: 'Rock gnomes are the most common gnomes, known for their inventiveness and hardy nature.',
        typicalRoles: ['Artificer', 'Wizard', 'Cleric'],
      },
      {
        slug: 'tiefling',
        name: 'Tiefling',
        source: 'Player\'s Handbook',
        ability_bonuses: { CHA: 2, INT: 1 },
        racial_traits: ['Hellish Resistance (fire)', 'Infernal Legacy spells', 'Darkvision'],
        description: 'Tieflings are derived from human bloodlines touched by infernal heritage. They tend to be shunned and meet suspicion from others.',
        typicalRoles: ['Warlock', 'Sorcerer', 'Bard', 'Paladin'],
      },
      {
        slug: 'dragonborn',
        name: 'Dragonborn',
        source: 'Player\'s Handbook',
        ability_bonuses: { STR: 2, CHA: 1 },
        racial_traits: ['Draconic Ancestry', 'Breath Weapon', 'Damage Resistance', 'Speed 30ft'],
        description: 'Born of dragons, dragonborn walk proudly through a world that greets them with fearful incomprehension.',
        typicalRoles: ['Fighter', 'Paladin', 'Sorcerer', 'Barbarian'],
      },
      {
        slug: 'half-elf',
        name: 'Half-Elf',
        source: 'Player\'s Handbook',
        ability_bonuses: { CHA: 2, STR: 1, DEX: 1 },
        racial_traits: ['Skill Versatility (2 skills)', 'Darkvision', 'Fey Ancestry', 'Speed 30ft'],
        description: 'Walking in two worlds but truly belonging to neither, half-elves combine the best qualities of their elf and human parents.',
        typicalRoles: ['Bard', 'Warlock', 'Sorcerer', 'Paladin'],
      },
      {
        slug: 'half-orc',
        name: 'Half-Orc',
        source: 'Player\'s Handbook',
        ability_bonuses: { STR: 2, CON: 1 },
        racial_traits: ['Savage Attacks', 'Relentless Endurance', 'Menacing (Intimidation)', 'Darkvision'],
        description: 'Half-orcs combine the best and worst qualities of their orc and human ancestry, with immense strength and physical prowess.',
        typicalRoles: ['Barbarian', 'Fighter', 'Paladin'],
      },
    ],
  },
  {
    name: 'Exotic Races',
    icon: '🗺️',
    description: 'Unique races from Volo\'s Guide and other expanded sources',
    races: [
      {
        slug: 'goliath',
        name: 'Goliath',
        source: 'Volo\'s Guide to Monsters',
        ability_bonuses: { STR: 2, CON: 1 },
        racial_traits: ['Powerful Build', 'Stone\'s Endurance', 'Mountain Born', 'Natural Athlete'],
        description: 'At the highest mountain peaks dwell the reclusive goliaths, wandering a bleak realm of rock, wind, and cold.',
        typicalRoles: ['Barbarian', 'Fighter', 'Monk', 'Ranger'],
      },
      {
        slug: 'kenku',
        name: 'Kenku',
        source: 'Volo\'s Guide to Monsters',
        ability_bonuses: { DEX: 2, WIS: 1 },
        racial_traits: ['Expert Forgery', 'Mimicry', 'Expert Duplication', 'Speed 30ft'],
        description: 'Kenku are cursed with the inability to fly or speak in their own voices, forced to mimic the sounds they hear.',
        typicalRoles: ['Rogue', 'Bard', 'Ranger', 'Monk'],
      },
      {
        slug: 'aasimar',
        name: 'Aasimar',
        source: 'Volo\'s Guide to Monsters',
        ability_bonuses: { CHA: 2 },
        racial_traits: ['Healing Hands', 'Celestial Resistance', 'Darkvision', 'Light cantrip'],
        description: 'Aasimar bear within their souls the light of the heavens. They are descended from humans with a touch of celestial power.',
        typicalRoles: ['Paladin', 'Cleric', 'Sorcerer', 'Warlock'],
      },
      {
        slug: 'tabaxi',
        name: 'Tabaxi',
        source: 'Volo\'s Guide to Monsters',
        ability_bonuses: { DEX: 2, CHA: 1 },
        racial_traits: ['Feline Agility', 'Cat\'s Claws', 'Cat\'s Talent (Perception/Stealth)', 'Speed 30ft'],
        description: 'Hailing from a strange and distant land, tabaxi are catlike humanoids driven by curiosity to collect interesting artifacts and stories.',
        typicalRoles: ['Rogue', 'Monk', 'Ranger', 'Bard'],
      },
      {
        slug: 'firbolg',
        name: 'Firbolg',
        source: 'Volo\'s Guide to Monsters',
        ability_bonuses: { WIS: 2, STR: 1 },
        racial_traits: ['Firbolg Magic', 'Hidden Step (invisibility)', 'Powerful Build', 'Speech of Beast and Leaf'],
        description: 'Firbolg are humble guardians of the forest, living in harmony with nature and avoiding contact with other races.',
        typicalRoles: ['Druid', 'Ranger', 'Cleric'],
      },
      {
        slug: 'triton',
        name: 'Triton',
        source: 'Volo\'s Guide to Monsters',
        ability_bonuses: { STR: 1, CON: 1, CHA: 1 },
        racial_traits: ['Amphibious', 'Control Air and Water spells', 'Guardians of the Depths', 'Emissary of the Sea'],
        description: 'Tritons guard the ocean depths, building small settlements and waging war against their enemies in defense of their ocean home.',
        typicalRoles: ['Paladin', 'Fighter', 'Cleric'],
      },
    ],
  },
  {
    name: 'Monstrous Races',
    icon: '🚀',
    description: 'Playable monster races for unique and challenging characters',
    races: [
      {
        slug: 'goblin',
        name: 'Goblin',
        source: 'Volo\'s Guide to Monsters',
        ability_bonuses: { DEX: 2, CON: 1 },
        racial_traits: ['Fury of the Small', 'Nimble Escape', 'Darkvision', 'Speed 30ft'],
        description: 'Goblins occupy an uneasy place in a dangerous world, relying on their speed and cunning to survive.',
        typicalRoles: ['Rogue', 'Ranger', 'Artificer'],
      },
      {
        slug: 'kobold',
        name: 'Kobold',
        source: 'Volo\'s Guide to Monsters',
        ability_bonuses: { DEX: 2, STR: -2 },
        racial_traits: ['Pack Tactics', 'Grovel, Cower, and Beg', 'Sunlight Sensitivity', 'Darkvision'],
        description: 'Kobolds are small, reptilian humanoids who believe themselves to be descended from dragons.',
        typicalRoles: ['Rogue', 'Sorcerer', 'Wizard'],
      },
      {
        slug: 'bugbear',
        name: 'Bugbear',
        source: 'Volo\'s Guide to Monsters',
        ability_bonuses: { STR: 2, DEX: 1 },
        racial_traits: ['Surprise Attack', 'Long-Limbed (reach +5ft)', 'Powerful Build', 'Darkvision'],
        description: 'Bugbears are born for battle and mayhem, relying on brute strength and stealth to surprise enemies.',
        typicalRoles: ['Barbarian', 'Fighter', 'Rogue'],
      },
      {
        slug: 'orc',
        name: 'Orc',
        source: 'Volo\'s Guide to Monsters',
        ability_bonuses: { STR: 2, CON: 1, INT: -2 },
        racial_traits: ['Aggressive (bonus action dash)', 'Menacing', 'Powerful Build', 'Darkvision'],
        description: 'Orcs are savage raiders and pillagers, with a culture built on strength and conquest.',
        typicalRoles: ['Barbarian', 'Fighter'],
      },
      {
        slug: 'yuan-ti-pureblood',
        name: 'Yuan-Ti Pureblood',
        source: 'Volo\'s Guide to Monsters',
        ability_bonuses: { CHA: 2, INT: 1 },
        racial_traits: ['Magic Resistance', 'Poison Immunity', 'Innate Spellcasting', 'Darkvision'],
        description: 'The serpent creatures known as yuan-ti are all that remains of an ancient, decadent human empire.',
        typicalRoles: ['Warlock', 'Sorcerer', 'Bard'],
      },
    ],
  },
  {
    name: 'Planar Races',
    icon: '✨',
    description: 'Races from other planes and magical settings',
    races: [
      {
        slug: 'loxodon',
        name: 'Loxodon',
        source: 'Guildmasters\' Guide to Ravnica',
        ability_bonuses: { CON: 2, WIS: 1 },
        racial_traits: ['Powerful Build', 'Natural Armor', 'Trunk (extra appendage)', 'Keen Smell'],
        description: 'Loxodons are humanoid elephants, known for their wisdom, loyalty, and unshakeable calm.',
        typicalRoles: ['Cleric', 'Paladin', 'Monk', 'Druid'],
      },
      {
        slug: 'owlin',
        name: 'Owlin',
        source: 'Strixhaven: A Curriculum of Chaos',
        ability_bonuses: { DEX: 1, WIS: 2 },
        racial_traits: ['Flight', 'Darkvision', 'Silent Feathers (Stealth prof)', 'Speed 30ft'],
        description: 'Owlin are owl-like humanoids with a keen intellect and the ability to fly through the night sky.',
        typicalRoles: ['Ranger', 'Druid', 'Rogue', 'Wizard'],
      },
      {
        slug: 'fairy',
        name: 'Fairy',
        source: 'The Wild Beyond the Witchlight',
        ability_bonuses: { DEX: 2, WIS: 1 },
        racial_traits: ['Flight', 'Fairy Magic', 'Small size', 'Speed 30ft'],
        description: 'Fairies are tiny magical beings from the Feywild, filled with mirth and mischief.',
        typicalRoles: ['Druid', 'Wizard', 'Bard', 'Rogue'],
      },
      {
        slug: 'harengon',
        name: 'Harengon',
        source: 'The Wild Beyond the Witchlight',
        ability_bonuses: { DEX: 2, WIS: 1 },
        racial_traits: ['Hare-Trigger (add proficiency to initiative)', 'Leporine Senses', 'Lucky Footwork', 'Rabbit Hop'],
        description: 'Harengon are rabbit-folk who embody the spirit of freedom and travel from the Feywild.',
        typicalRoles: ['Monk', 'Ranger', 'Rogue', 'Fighter'],
      },
      {
        slug: 'gith',
        name: 'Githyanki',
        source: 'Mordenkainen\'s Tome of Foes',
        ability_bonuses: { STR: 2, INT: 1 },
        racial_traits: ['Decadent Mastery (skill prof)', 'Martial Prodigy (armor prof)', 'Githyanki Psionics'],
        description: 'The brutal githyanki are trained from birth as warriors, riding red dragons into battle.',
        typicalRoles: ['Fighter', 'Wizard', 'Paladin'],
      },
      {
        slug: 'genasi-fire',
        name: 'Genasi (Fire)',
        source: 'Elemental Evil Player\'s Companion',
        ability_bonuses: { CON: 2, INT: 1 },
        racial_traits: ['Darkvision', 'Fire Resistance', 'Reach to the Blaze (fire spells)', 'Speed 30ft'],
        description: 'Fire genasi channel the flamboyant and often destructive nature of flame, with skin that burns to the touch.',
        typicalRoles: ['Sorcerer', 'Wizard', 'Warlock'],
      },
    ],
  },
];

// Helper to get all races from categories
const getAllRaces = (): Race[] => {
  return RACE_CATEGORIES.flatMap(category => category.races);
};

// --- Sprint 2: Spell Database ---
// --- Sprint 2: Spell Database (loaded from SRD - replaces ~25 hardcoded with 1,804 spells) ---
const SPELL_DATABASE: Spell[] = loadSpells();


// Sprint 3: Feat Database (exported for future use)
export const FEAT_DATABASE: Feat[] = [
  {
    slug: 'alert',
    name: 'Alert',
    source: 'Player\'s Handbook',
    description: 'Always on the lookout for danger, you gain the following benefits:',
    benefits: [
      '+5 bonus to initiative',
      'You can\'t be surprised while conscious',
      'Other creatures don\'t gain advantage on attack rolls against you as a result of being unseen by you',
    ],
  },
  {
    slug: 'athlete',
    name: 'Athlete',
    source: 'Player\'s Handbook',
    description: 'You have undergone extensive physical training to gain the following benefits:',
    abilityScoreIncrease: { choices: 1, amount: 1 },
    benefits: [
      'Increase your Strength or Dexterity score by 1, to a maximum of 20',
      'When prone, standing up uses only 5 feet of movement',
      'Climbing doesn\'t cost you extra movement',
      'You can make a running long jump or running high jump after moving only 5 feet',
    ],
  },
  {
    slug: 'dual-wielder',
    name: 'Dual Wielder',
    source: 'Player\'s Handbook',
    description: 'You master fighting with two weapons, gaining the following benefits:',
    benefits: [
      '+1 bonus to AC while wielding a separate melee weapon in each hand',
      'You can use two-weapon fighting even when the one-handed melee weapons you are wielding aren\'t light',
      'You can draw or stow two one-handed weapons when you would normally be able to draw or stow only one',
    ],
  },
  {
    slug: 'great-weapon-master',
    name: 'Great Weapon Master',
    source: 'Player\'s Handbook',
    description: 'You\'ve learned to put the weight of a weapon to your advantage. You gain the following benefits:',
    benefits: [
      'On your turn, when you score a critical hit or reduce a creature to 0 HP with a melee weapon, you can make one melee weapon attack as a bonus action',
      'Before you make a melee attack with a heavy weapon, you can choose to take a -5 penalty to the attack roll. If the attack hits, you add +10 to the attack\'s damage',
    ],
  },
  {
    slug: 'lucky',
    name: 'Lucky',
    source: 'Player\'s Handbook',
    description: 'You have inexplicable luck that seems to kick in at just the right moment. You have 3 luck points. You gain the following benefits:',
    benefits: [
      'Whenever you make an attack roll, ability check, or saving throw, you can spend one luck point to roll an additional d20',
      'You can choose to spend one of your luck points after you roll the die, but before the outcome is determined',
      'You choose which of the d20s is used for the attack roll, ability check, or saving throw',
      'You can also spend one luck point when an attack roll is made against you',
      'You regain expended luck points when you finish a long rest',
    ],
  },
  {
    slug: 'magic-initiate',
    name: 'Magic Initiate',
    source: 'Player\'s Handbook',
    description: 'Choose a class: bard, cleric, druid, sorcerer, warlock, or wizard. You learn two cantrips of your choice from that class\'s spell list. In addition, choose one 1st-level spell from that same list. You learn that spell and can cast it at its lowest level. Once you cast it, you must finish a long rest before you can cast it again using this feat.',
    benefits: [
      'Learn two cantrips from one class',
      'Learn one 1st-level spell from that class',
      'Can cast the 1st-level spell once per long rest',
      'Your spellcasting ability for these spells depends on the class you chose',
    ],
  },
  {
    slug: 'mobile',
    name: 'Mobile',
    source: 'Player\'s Handbook',
    description: 'You are exceptionally speedy and agile. You gain the following benefits:',
    benefits: [
      'Your speed increases by 10 feet',
      'When you use the Dash action, difficult terrain doesn\'t cost you extra movement on that turn',
      'When you make a melee attack against a creature, you don\'t provoke opportunity attacks from that creature for the rest of the turn',
    ],
  },
  {
    slug: 'resilient',
    name: 'Resilient',
    source: 'Player\'s Handbook',
    description: 'Choose one ability score. You gain the following benefits:',
    abilityScoreIncrease: { choices: 1, amount: 1 },
    benefits: [
      'Increase the chosen ability score by 1, to a maximum of 20',
      'You gain proficiency in saving throws using the chosen ability',
    ],
  },
  {
    slug: 'sentinel',
    name: 'Sentinel',
    source: 'Player\'s Handbook',
    description: 'You have mastered techniques to take advantage of every drop in any enemy\'s guard. You gain the following benefits:',
    benefits: [
      'When you hit a creature with an opportunity attack, the creature\'s speed becomes 0 for the rest of the turn',
      'Creatures provoke opportunity attacks from you even if they take the Disengage action before leaving your reach',
      'When a creature makes an attack against a target other than you, you can use your reaction to make a melee weapon attack against the attacking creature',
    ],
  },
  {
    slug: 'sharpshooter',
    name: 'Sharpshooter',
    source: 'Player\'s Handbook',
    description: 'You have mastered ranged weapons and can make shots that others find impossible. You gain the following benefits:',
    benefits: [
      'Attacking at long range doesn\'t impose disadvantage on your ranged weapon attack rolls',
      'Your ranged weapon attacks ignore half cover and three-quarters cover',
      'Before you make an attack with a ranged weapon, you can choose to take a -5 penalty to the attack roll. If the attack hits, you add +10 to the attack\'s damage',
    ],
  },
  {
    slug: 'spell-sniper',
    name: 'Spell Sniper',
    source: 'Player\'s Handbook',
    description: 'You have learned techniques to enhance your attacks with certain kinds of spells. You gain the following benefits:',
    prerequisites: 'The ability to cast at least one spell',
    benefits: [
      'When you cast a spell that requires you to make an attack roll, the spell\'s range is doubled',
      'Your ranged spell attacks ignore half cover and three-quarters cover',
      'You learn one cantrip that requires an attack roll. Choose the cantrip from the bard, cleric, druid, sorcerer, warlock, or wizard spell list',
    ],
  },
  {
    slug: 'tavern-brawler',
    name: 'Tavern Brawler',
    source: 'Player\'s Handbook',
    description: 'Accustomed to rough-and-tumble fighting using whatever weapons happen to be at hand, you gain the following benefits:',
    abilityScoreIncrease: { choices: 1, amount: 1 },
    benefits: [
      'Increase your Strength or Constitution score by 1, to a maximum of 20',
      'You are proficient with improvised weapons',
      'Your unarmed strike uses a d4 for damage',
      'When you hit a creature with an unarmed strike or improvised weapon on your turn, you can use a bonus action to attempt to grapple the target',
    ],
  },
  {
    slug: 'tough',
    name: 'Tough',
    source: 'Player\'s Handbook',
    description: 'Your hit point maximum increases by an amount equal to twice your level when you gain this feat. Whenever you gain a level thereafter, your hit point maximum increases by an additional 2 hit points.',
    benefits: [
      'Hit point maximum increases by 2 per level (including past levels)',
    ],
  },
  {
    slug: 'war-caster',
    name: 'War Caster',
    source: 'Player\'s Handbook',
    description: 'You have practiced casting spells in the midst of combat. You gain the following benefits:',
    prerequisites: 'The ability to cast at least one spell',
    benefits: [
      'You have advantage on Constitution saving throws to maintain concentration on a spell when you take damage',
      'You can perform the somatic components of spells even when you have weapons or a shield in one or both hands',
      'When a hostile creature\'s movement provokes an opportunity attack from you, you can use your reaction to cast a spell at the creature, rather than making an opportunity attack',
    ],
  },
];

interface Class {
  slug: string;
  name: string;
  source: string;
  hit_die: number;
  primary_stat: string;
  save_throws: string[];
  skill_proficiencies: string[]; // Available skill choices
  num_skill_choices?: number; // How many skills to choose (filled by helper if missing)
  class_features: string[];
  description: string;
  keyRole: string;
  equipment_choices?: EquipmentChoice[]; // Starting equipment options (filled by helper if missing)

  // Sprint 2: Spellcasting configuration
  spellcasting?: {
    ability: 'INT' | 'WIS' | 'CHA'; // Spellcasting ability modifier
    mode: 'known' | 'prepared' | 'book'; // How spells are learned/prepared
    cantripsKnown: number; // Number of cantrips at level 1
    spellsKnownOrPrepared: number; // Number of spells known (sorcerer/bard) or can prepare (cleric/druid)
    spellSlots: number[]; // Spell slots by level [0, 2, 0, 0...] means 2 1st-level slots
  };

  // Sprint 3: Subclass support
  isSubclass?: boolean; // True if this is a subclass (archetype)
  parentClass?: string; // Parent class slug (e.g., 'wizard' for 'wizard-evocation')
  subclassLevel?: number; // Level at which this subclass is chosen (usually 3)
  subclassFeatures?: Record<number, string[]>; // Features gained at specific levels
}

interface ClassCategory {
  name: string;
  icon: string;
  description: string;
  classes: Class[];
}

// Load classes from SRD
const SRD_CLASSES = loadClasses();

const CLASS_CATEGORIES: ClassCategory[] = [
  {
    name: 'SRD Classes (2014)',
    icon: '📚',
    description: 'Classes from the System Reference Document',
    classes: SRD_CLASSES,
  },
  {
    name: 'Original Hardcoded Classes',
    icon: '📖',
    description: 'The 13 essential D&D 5e classes from the Player\'s Handbook (backup)',
    classes: [
      {
        slug: 'barbarian',
        name: 'Barbarian',
        source: 'Player\'s Handbook',
        hit_die: 12,
        primary_stat: 'Strength, Constitution',
        save_throws: ['STR', 'CON'],
        skill_proficiencies: ['AnimalHandling', 'Athletics', 'Intimidation', 'Nature', 'Perception', 'Survival'],
        num_skill_choices: 2,
        class_features: ['Rage', 'Unarmored Defense', 'Reckless Attack', 'Danger Sense'],
        description: 'The primal warrior; fueled by Rage to ignore pain and deal massive damage. Barbarians are fierce combatants who draw strength from their anger.',
        keyRole: 'Tank/Damage Dealer - Frontline warrior with high HP and damage resistance',
        equipment_choices: [
          {
            choiceId: 'barbarian-weapon-1',
            description: 'Choose your primary weapon',
            options: [
              [{ name: 'Greataxe', type: 'weapon', quantity: 1, weight: 7 }],
              [{ name: 'Martial Melee Weapon', type: 'weapon', quantity: 1, weight: 0 }],
            ],
            selected: null,
          },
          {
            choiceId: 'barbarian-weapon-2',
            description: 'Choose your secondary weapons',
            options: [
              [{ name: 'Handaxe', type: 'weapon', quantity: 2, weight: 2 }],
              [{ name: 'Simple Weapon', type: 'weapon', quantity: 1, weight: 0 }],
            ],
            selected: null,
          },
          {
            choiceId: 'barbarian-pack',
            description: 'Choose your equipment pack',
            options: [
              [{ name: "Explorer's Pack", type: 'gear', quantity: 1, weight: 59 }],
            ],
            selected: null,
          },
        ],
      },
      {
        slug: 'bard',
        name: 'Bard',
        source: 'Player\'s Handbook',
        hit_die: 8,
        primary_stat: 'Charisma',
        save_throws: ['DEX', 'CHA'],
        skill_proficiencies: ['Acrobatics', 'AnimalHandling', 'Arcana', 'Athletics', 'Deception', 'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine', 'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion', 'SleightOfHand', 'Stealth', 'Survival'],
        num_skill_choices: 3,
        class_features: ['Bardic Inspiration', 'Jack of All Trades', 'Song of Rest', 'Magical Secrets'],
        description: 'The inspiring musician and speaker; uses magic to charm, perform, and support allies. Bards are versatile spellcasters and skill masters.',
        keyRole: 'Support/Utility - Buffs allies, debuffs enemies, and provides magical versatility',
        equipment_choices: [
          {
            choiceId: 'bard-pack',
            description: 'Choose your equipment pack',
            options: [[{ name: "Entertainer's Pack", type: 'gear', quantity: 1, weight: 40 }]],
            selected: null,
          },
        ],
        spellcasting: {
          ability: 'CHA',
          mode: 'known',
          cantripsKnown: 2,
          spellsKnownOrPrepared: 4, // Spells known at level 1
          spellSlots: [0, 2, 0, 0, 0, 0, 0, 0, 0, 0],
        },
      },
      {
        slug: 'cleric',
        name: 'Cleric',
        source: 'Player\'s Handbook',
        hit_die: 8,
        primary_stat: 'Wisdom',
        save_throws: ['WIS', 'CHA'],
        skill_proficiencies: ['History', 'Insight', 'Medicine', 'Persuasion', 'Religion'],
        class_features: ['Divine Domain', 'Channel Divinity', 'Destroy Undead', 'Divine Intervention'],
        description: 'The priest of a god; a versatile magical and martial healer and divine caster. Clerics channel the power of their deity.',
        keyRole: 'Healer/Support - Primary healer with strong combat and utility spells',
        spellcasting: {
          ability: 'WIS',
          mode: 'prepared',
          cantripsKnown: 3,
          spellsKnownOrPrepared: 4, // Can prepare WIS mod + level (default 4 for level 1)
          spellSlots: [0, 2, 0, 0, 0, 0, 0, 0, 0, 0],
        },
      },
      {
        slug: 'druid',
        name: 'Druid',
        source: 'Player\'s Handbook',
        hit_die: 8,
        primary_stat: 'Wisdom',
        save_throws: ['INT', 'WIS'],
        skill_proficiencies: ['Arcana', 'AnimalHandling', 'Insight', 'Medicine', 'Nature', 'Perception', 'Religion', 'Survival'],
        class_features: ['Wild Shape', 'Druidic Circle', 'Timeless Body', 'Beast Spells'],
        description: 'The keeper of nature; harnesses primal magic and can transform into beasts. Druids are guardians of the wilderness.',
        keyRole: 'Controller/Shapeshifter - Versatile caster who can become powerful beasts',
        spellcasting: {
          ability: 'WIS',
          mode: 'prepared',
          cantripsKnown: 2,
          spellsKnownOrPrepared: 4, // Can prepare WIS mod + level (default 4 for level 1)
          spellSlots: [0, 2, 0, 0, 0, 0, 0, 0, 0, 0],
        },
      },
      {
        slug: 'fighter',
        name: 'Fighter',
        source: 'Player\'s Handbook',
        hit_die: 10,
        primary_stat: 'Strength or Dexterity',
        save_throws: ['STR', 'CON'],
        skill_proficiencies: ['Acrobatics', 'Athletics', 'History', 'Insight', 'Intimidation', 'Perception', 'Survival'],
        class_features: ['Fighting Style', 'Second Wind', 'Action Surge', 'Extra Attack'],
        description: 'The master of all weapons and armor; a versatile combat specialist. Fighters are unmatched in physical combat prowess.',
        keyRole: 'Damage Dealer/Tank - Consistent damage output with excellent survivability',
      },
      {
        slug: 'monk',
        name: 'Monk',
        source: 'Player\'s Handbook',
        hit_die: 8,
        primary_stat: 'Dexterity, Wisdom',
        save_throws: ['STR', 'DEX'],
        skill_proficiencies: ['Acrobatics', 'Athletics', 'History', 'Insight', 'Religion', 'Stealth'],
        class_features: ['Martial Arts', 'Ki', 'Unarmored Defense', 'Flurry of Blows', 'Stunning Strike'],
        description: 'The martial artist; uses internal energy (Ki) to perform stunning physical feats. Monks are mobile melee fighters.',
        keyRole: 'Striker/Controller - High mobility with crowd control abilities',
      },
      {
        slug: 'paladin',
        name: 'Paladin',
        source: 'Player\'s Handbook',
        hit_die: 10,
        primary_stat: 'Strength, Charisma',
        save_throws: ['WIS', 'CHA'],
        skill_proficiencies: ['Athletics', 'Insight', 'Intimidation', 'Medicine', 'Persuasion', 'Religion'],
        class_features: ['Divine Sense', 'Lay on Hands', 'Divine Smite', 'Aura of Protection'],
        description: 'The sworn champion of an ideal; uses martial prowess and divine Smites in combat. Paladins are holy warriors bound by oath.',
        keyRole: 'Tank/Burst Damage - Durable frontliner with powerful single-target damage',
      },
      {
        slug: 'ranger',
        name: 'Ranger',
        source: 'Player\'s Handbook',
        hit_die: 10,
        primary_stat: 'Dexterity, Wisdom',
        save_throws: ['STR', 'DEX'],
        skill_proficiencies: ['AnimalHandling', 'Athletics', 'Insight', 'Investigation', 'Nature', 'Perception', 'Stealth', 'Survival'],
        class_features: ['Favored Enemy', 'Natural Explorer', 'Hunter\'s Mark', 'Extra Attack'],
        description: 'The wilderness warrior and tracker; excels at hunting specific foes and navigating terrain. Rangers blend martial and magical abilities.',
        keyRole: 'Striker/Scout - Damage dealer with tracking and exploration expertise',
      },
      {
        slug: 'rogue',
        name: 'Rogue',
        source: 'Player\'s Handbook',
        hit_die: 8,
        primary_stat: 'Dexterity',
        save_throws: ['DEX', 'INT'],
        skill_proficiencies: ['Acrobatics', 'Athletics', 'Deception', 'Insight', 'Intimidation', 'Investigation', 'Perception', 'Performance', 'Persuasion', 'SleightOfHand', 'Stealth'],
        class_features: ['Expertise', 'Sneak Attack', 'Cunning Action', 'Uncanny Dodge', 'Evasion'],
        description: 'The specialist in stealth, deception, and precise Sneak Attack damage. Rogues are masters of skills and deadly precision.',
        keyRole: 'Striker/Skill Monkey - High single-target damage with unmatched skill proficiency',
      },
      {
        slug: 'sorcerer',
        name: 'Sorcerer',
        source: 'Player\'s Handbook',
        hit_die: 6,
        primary_stat: 'Charisma',
        save_throws: ['CON', 'CHA'],
        skill_proficiencies: ['Arcana', 'Deception', 'Insight', 'Intimidation', 'Persuasion', 'Religion'],
        class_features: ['Sorcerous Origin', 'Font of Magic', 'Metamagic', 'Sorcery Points'],
        description: 'The innate spellcaster; magic flows through their bloodline, giving them unique ways to manipulate spells. Sorcerers shape magic itself.',
        keyRole: 'Blaster/Controller - Flexible spellcaster who modifies spell effects',
        spellcasting: {
          ability: 'CHA',
          mode: 'known',
          cantripsKnown: 4,
          spellsKnownOrPrepared: 2, // Spells known at level 1
          spellSlots: [0, 2, 0, 0, 0, 0, 0, 0, 0, 0],
        },
      },
      {
        slug: 'warlock',
        name: 'Warlock',
        source: 'Player\'s Handbook',
        hit_die: 8,
        primary_stat: 'Charisma',
        save_throws: ['WIS', 'CHA'],
        skill_proficiencies: ['Arcana', 'Deception', 'History', 'Intimidation', 'Investigation', 'Nature', 'Religion'],
        class_features: ['Otherworldly Patron', 'Pact Magic', 'Eldritch Invocations', 'Pact Boon'],
        description: 'The dark pact master; draws powerful, focused magic from an otherworldly patron. Warlocks gain power through supernatural bargains.',
        keyRole: 'Blaster/Utility - Consistent damage with customizable magical abilities',
        spellcasting: {
          ability: 'CHA',
          mode: 'known',
          cantripsKnown: 2,
          spellsKnownOrPrepared: 2, // Spells known at level 1
          spellSlots: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0], // Pact Magic: 1 slot at level 1
        },
      },
      {
        slug: 'wizard',
        name: 'Wizard',
        source: 'Player\'s Handbook',
        hit_die: 6,
        primary_stat: 'Intelligence',
        save_throws: ['INT', 'WIS'],
        skill_proficiencies: ['Arcana', 'History', 'Insight', 'Investigation', 'Medicine', 'Religion'],
        class_features: ['Arcane Recovery', 'Arcane Tradition', 'Spell Mastery', 'Signature Spells'],
        description: 'The scholarly archmage; masters the widest variety of spells through study and spellbooks. Wizards are the ultimate magical specialists.',
        keyRole: 'Controller/Utility - Largest spell list with solutions for every problem',
        spellcasting: {
          ability: 'INT',
          mode: 'book',
          cantripsKnown: 3,
          spellsKnownOrPrepared: 6, // Spells in spellbook at level 1
          spellSlots: [0, 2, 0, 0, 0, 0, 0, 0, 0, 0], // 2 1st-level slots
        },
      },
      {
        slug: 'artificer',
        name: 'Artificer',
        source: 'Tasha\'s Cauldron of Everything',
        hit_die: 8,
        primary_stat: 'Intelligence',
        save_throws: ['CON', 'INT'],
        skill_proficiencies: ['Arcana', 'History', 'Investigation', 'Medicine', 'Nature', 'Perception', 'SleightOfHand'],
        class_features: ['Magical Tinkering', 'Infuse Item', 'The Right Tool for the Job', 'Flash of Genius'],
        description: 'The magical inventor; creates and infuses wondrous items and gadgets to augment combat and utility. Artificers blend magic and technology.',
        keyRole: 'Support/Utility - Enhances allies with magical items and versatile spells',
      },
    ],
  },
  {
    name: 'Martial & Skill Specialists',
    icon: '⚔️',
    description: 'Subclasses focused on physical prowess and specialized techniques',
    classes: [
      {
        slug: 'fighter-battle-master',
        name: 'Fighter (Battle Master)',
        source: 'Player\'s Handbook - Subclass',
        hit_die: 10,
        primary_stat: 'Strength or Dexterity',
        save_throws: ['STR', 'CON'],
        skill_proficiencies: ['Acrobatics', 'Athletics', 'History', 'Insight', 'Intimidation', 'Perception', 'Survival'],
        class_features: ['Combat Superiority', 'Maneuvers', 'Student of War', 'Know Your Enemy'],
        description: 'The tactical genius who uses special combat Maneuvers to control the battlefield. Battle Masters are strategic fighters.',
        keyRole: 'Controller/Tactician - Uses maneuvers to disrupt enemies and support allies',
      },
      {
        slug: 'rogue-arcane-trickster',
        name: 'Rogue (Arcane Trickster)',
        source: 'Player\'s Handbook - Subclass',
        hit_die: 8,
        primary_stat: 'Dexterity, Intelligence',
        save_throws: ['DEX', 'INT'],
        skill_proficiencies: ['Acrobatics', 'Athletics', 'Deception', 'Insight', 'Intimidation', 'Investigation', 'Perception', 'Performance'],
        class_features: ['Spellcasting', 'Mage Hand Legerdemain', 'Magical Ambush', 'Versatile Trickster'],
        description: 'The sneaky thief who uses Illusion and Enchantment magic for infiltration and escape. Magic enhances their roguish tricks.',
        keyRole: 'Striker/Utility - Combines stealth with magical deception',
      },
      {
        slug: 'rogue-swashbuckler',
        name: 'Rogue (Swashbuckler)',
        source: 'Xanathar\'s Guide to Everything - Subclass',
        hit_die: 8,
        primary_stat: 'Dexterity, Charisma',
        save_throws: ['DEX', 'INT'],
        skill_proficiencies: ['Acrobatics', 'Athletics', 'Deception', 'Insight', 'Intimidation', 'Investigation', 'Perception', 'Performance', 'Persuasion'],
        class_features: ['Fancy Footwork', 'Rakish Audacity', 'Panache', 'Master Duelist'],
        description: 'The charming, daring duelist who excels at one-on-one combat and social encounters. Swashbucklers are charismatic fighters.',
        keyRole: 'Striker/Face - Mobile damage dealer with social prowess',
      },
      {
        slug: 'barbarian-zealot',
        name: 'Barbarian (Path of the Zealot)',
        source: 'Xanathar\'s Guide to Everything - Subclass',
        hit_die: 12,
        primary_stat: 'Strength, Constitution',
        save_throws: ['STR', 'CON'],
        skill_proficiencies: ['AnimalHandling', 'Athletics', 'Intimidation', 'Nature', 'Perception', 'Survival'],
        class_features: ['Divine Fury', 'Warrior of the Gods', 'Fanatical Focus', 'Rage Beyond Death'],
        description: 'A divinely-inspired warrior whose Rage is so strong they are nearly impossible to kill. Zealots fight with religious fervor.',
        keyRole: 'Tank/Damage Dealer - Unkillable warrior with bonus radiant/necrotic damage',
      },
    ],
  },
  {
    name: 'Divine & Primal Casters',
    icon: '🌿',
    description: 'Subclasses drawing power from gods, nature, and sacred oaths',
    classes: [
      {
        slug: 'cleric-life',
        name: 'Cleric (Life Domain)',
        source: 'Player\'s Handbook - Subclass',
        hit_die: 8,
        primary_stat: 'Wisdom',
        save_throws: ['WIS', 'CHA'],
        skill_proficiencies: ['History', 'Insight', 'Medicine', 'Persuasion', 'Religion'],
        class_features: ['Disciple of Life', 'Channel Divinity: Preserve Life', 'Blessed Healer', 'Supreme Healing'],
        description: 'The ultimate healer; maximizes the power of healing spells and keeps allies alive. Life Clerics are unmatched in restorative magic.',
        keyRole: 'Healer - The best healing in the game with enhanced healing spells',
      },
      {
        slug: 'druid-moon',
        name: 'Druid (Circle of the Moon)',
        source: 'Player\'s Handbook - Subclass',
        hit_die: 8,
        primary_stat: 'Wisdom',
        save_throws: ['INT', 'WIS'],
        skill_proficiencies: ['Arcana', 'AnimalHandling', 'Insight', 'Medicine', 'Nature', 'Perception', 'Religion', 'Survival'],
        class_features: ['Combat Wild Shape', 'Circle Forms', 'Primal Strike', 'Elemental Wild Shape'],
        description: 'The combat shapeshifter; focuses on using Wild Shape to turn into powerful combat beasts. Moon Druids are frontline transformers.',
        keyRole: 'Tank/Shapeshifter - Transforms into powerful beasts for combat',
      },
      {
        slug: 'paladin-devotion',
        name: 'Paladin (Oath of Devotion)',
        source: 'Player\'s Handbook - Subclass',
        hit_die: 10,
        primary_stat: 'Strength, Charisma',
        save_throws: ['WIS', 'CHA'],
        skill_proficiencies: ['Athletics', 'Insight', 'Intimidation', 'Medicine', 'Persuasion', 'Religion'],
        class_features: ['Sacred Weapon', 'Turn the Unholy', 'Aura of Devotion', 'Purity of Spirit'],
        description: 'The classic, honorable knight; upholds the highest ideals of justice, courage, and duty. Devotion Paladins are paragons of virtue.',
        keyRole: 'Tank/Support - Protects allies with auras and channels justice',
      },
      {
        slug: 'paladin-vengeance',
        name: 'Paladin (Oath of Vengeance)',
        source: 'Player\'s Handbook - Subclass',
        hit_die: 10,
        primary_stat: 'Strength, Charisma',
        save_throws: ['WIS', 'CHA'],
        skill_proficiencies: ['Athletics', 'Insight', 'Intimidation', 'Medicine', 'Persuasion', 'Religion'],
        class_features: ['Abjure Enemy', 'Vow of Enmity', 'Relentless Avenger', 'Soul of Vengeance'],
        description: 'A dark knight driven by an unyielding need for retribution against evildoers. Vengeance Paladins hunt their sworn enemies.',
        keyRole: 'Striker - Focused damage dealer hunting specific foes',
      },
      {
        slug: 'ranger-gloom-stalker',
        name: 'Ranger (Gloom Stalker)',
        source: 'Xanathar\'s Guide to Everything - Subclass',
        hit_die: 10,
        primary_stat: 'Dexterity, Wisdom',
        save_throws: ['STR', 'DEX'],
        skill_proficiencies: ['AnimalHandling', 'Athletics', 'Insight', 'Investigation', 'Nature', 'Perception', 'Stealth', 'Survival'],
        class_features: ['Dread Ambusher', 'Umbral Sight', 'Iron Mind', 'Stalker\'s Flurry'],
        description: 'The master of darkness and ambushes; excels at fighting in the dark and making powerful first strikes. Gloom Stalkers are shadow hunters.',
        keyRole: 'Striker/Ambusher - Devastating first-round damage in darkness',
      },
    ],
  },
  {
    name: 'Arcane & Occult Casters',
    icon: '✨',
    description: 'Subclasses mastering magic through study, talent, or dark pacts',
    classes: [
      {
        slug: 'wizard-evocation',
        name: 'Wizard (School of Evocation)',
        source: 'Player\'s Handbook - Subclass',
        hit_die: 6,
        primary_stat: 'Intelligence',
        save_throws: ['INT', 'WIS'],
        skill_proficiencies: ['Arcana', 'History', 'Insight', 'Investigation', 'Medicine', 'Religion'],
        class_features: ['Sculpt Spells', 'Potent Cantrip', 'Empowered Evocation', 'Overchannel'],
        description: 'The master of destructive magic, specializing in dealing massive damage with fire, lightning, and force spells. Evocation Wizards are blasters.',
        keyRole: 'Blaster - Maximum spell damage without harming allies',
      },
      {
        slug: 'sorcerer-draconic',
        name: 'Sorcerer (Draconic Bloodline)',
        source: 'Player\'s Handbook - Subclass',
        hit_die: 6,
        primary_stat: 'Charisma',
        save_throws: ['CON', 'CHA'],
        skill_proficiencies: ['Arcana', 'Deception', 'Insight', 'Intimidation', 'Persuasion', 'Religion'],
        class_features: ['Dragon Ancestor', 'Draconic Resilience', 'Elemental Affinity', 'Dragon Wings'],
        description: 'Magic comes from a dragon ancestor, giving them scales for defense and power over a specific element. Draconic Sorcerers embody draconic might.',
        keyRole: 'Blaster - Enhanced elemental damage with improved survivability',
      },
      {
        slug: 'warlock-hexblade',
        name: 'Warlock (Hexblade Patron)',
        source: 'Xanathar\'s Guide to Everything - Subclass',
        hit_die: 8,
        primary_stat: 'Charisma',
        save_throws: ['WIS', 'CHA'],
        skill_proficiencies: ['Arcana', 'Deception', 'History', 'Intimidation', 'Investigation', 'Nature', 'Religion'],
        class_features: ['Hexblade\'s Curse', 'Hex Warrior', 'Accursed Specter', 'Master of Hexes'],
        description: 'The mysterious warrior; uses their charisma to fight with weapons granted by a sentient weapon or entity. Hexblades are martial spellcasters.',
        keyRole: 'Striker/Gish - Melee-focused warlock with cursed weapon attacks',
      },
      {
        slug: 'bard-lore',
        name: 'Bard (College of Lore)',
        source: 'Player\'s Handbook - Subclass',
        hit_die: 8,
        primary_stat: 'Charisma',
        save_throws: ['DEX', 'CHA'],
        skill_proficiencies: ['Any three skills'],
        class_features: ['Bonus Proficiencies', 'Cutting Words', 'Additional Magical Secrets', 'Peerless Skill'],
        description: 'The scholarly raconteur; learns extra spells from any class and uses cutting words to debuff enemies. Lore Bards are knowledge masters.',
        keyRole: 'Support/Utility - Ultimate support with spells from any class',
      },
    ],
  },
];

// Type for class with guaranteed Sprint 1 fields
type ClassWithDefaults = Omit<Class, 'num_skill_choices' | 'equipment_choices'> & {
  num_skill_choices: number;
  equipment_choices: EquipmentChoice[];
};

// Helper to get all classes from categories and fill in defaults
const getAllClasses = (): ClassWithDefaults[] => {
  const classes = CLASS_CATEGORIES.flatMap(category => category.classes);

  // Default skill list for classes that don't have specific skills defined
  const allSkillNames = ['Acrobatics', 'AnimalHandling', 'Arcana', 'Athletics', 'Deception', 'History',
    'Insight', 'Intimidation', 'Investigation', 'Medicine', 'Nature', 'Perception', 'Performance',
    'Persuasion', 'Religion', 'SleightOfHand', 'Stealth', 'Survival'];

  // Add defaults for classes missing new Sprint 1 fields
  return classes.map(cls => {
    // Ensure skill_proficiencies is always an array
    let skillProfs = cls.skill_proficiencies;
    if (!Array.isArray(skillProfs) || skillProfs.length === 0 || skillProfs[0] === 'Any three skills') {
      // If it's not a valid array, use all skills
      skillProfs = allSkillNames;
    }

    return {
      ...cls,
      skill_proficiencies: skillProfs,
      num_skill_choices: cls.num_skill_choices ?? (
        cls.slug.includes('rogue') ? 4 :
        cls.slug.includes('bard') ? 3 :
        cls.slug.includes('ranger') ? 3 :
        2
      ),
      equipment_choices: cls.equipment_choices ?? [
        {
          choiceId: `${cls.slug}-default-pack`,
          description: 'Starting equipment pack',
          options: [[{ name: "Adventurer's Pack", type: 'gear', quantity: 1, weight: 30 }]],
          selected: null,
        },
      ],
    };
  });
};

// Sprint 2: Spell helper functions
const getSpellsForClass = (classSlug: string): Spell[] => {
  // Extract base class name from slug (e.g., 'wizard-evocation' -> 'wizard')
  const baseClass = classSlug.split('-')[0];
  return SPELL_DATABASE.filter(spell => spell.classes.includes(baseClass));
};

const getCantripsByClass = (classSlug: string): Spell[] => {
  return getSpellsForClass(classSlug).filter(spell => spell.level === 0);
};

const getLeveledSpellsByClass = (classSlug: string, level: number = 1): Spell[] => {
  return getSpellsForClass(classSlug).filter(spell => spell.level === level);
};

const isSpellcaster = (classData: ClassWithDefaults): boolean => {
  return classData.spellcasting !== undefined;
};

const ALIGNMENTS = [
  'Lawful Good',
  'Neutral Good',
  'Chaotic Good',
  'Lawful Neutral',
  'True Neutral',
  'Chaotic Neutral',
  'Lawful Evil',
  'Neutral Evil',
  'Chaotic Evil'
];

const ALIGNMENT_INFO: Record<string, { category: string; description: string; examples: string[] }> = {
  'Lawful Good': {
    category: '🌟 The Good Alignments',
    description: 'A Lawful Good character acts as a model citizen, believing that a well-ordered society with a strong code of conduct is the best way to ensure the most people are safe and happy. They often follow laws, traditions, and authority, but will break a law if it\'s necessary to uphold a greater good (e.g., saving an innocent life).',
    examples: [
      'A paladin who adheres strictly to their religious and knightly oath to protect the innocent and uphold justice.',
      'A just king or judge who follows the letter of the law to maintain peace and order, even when it is difficult.',
    ],
  },
  'Neutral Good': {
    category: '🌟 The Good Alignments',
    description: 'A Neutral Good character believes in doing good above all else, but does not feel bound to either strict rules (Law) or complete freedom (Chaos). They will use the best method available—whether it\'s following the law or breaking it—to help others.',
    examples: [
      'A cleric who travels the land helping the poor and sick, ignoring political boundaries and refusing to join any standing military or order.',
      'A kind-hearted adventurer who fights monsters and protects villagers simply because it\'s the right thing to do, without following a specific code or relying on complicated schemes.',
    ],
  },
  'Chaotic Good': {
    category: '🌟 The Good Alignments',
    description: 'A Chaotic Good character strongly believes in the triumph of good over evil, but views laws, governments, and traditions as oppressive and restrictive. They champion individual freedom and act according to their own moral compass, which often means defying corrupt authority or disrupting unfair systems.',
    examples: [
      'A swashbuckling rogue who steals from corrupt nobles and gives the money to the poor, actively flouting the local laws for a noble cause (a "Robin Hood" figure).',
      'A rebel wizard who forms a secret resistance to overthrow an unjust tyrant, prioritizing personal liberty over the established—but evil—order.',
    ],
  },
  'Lawful Neutral': {
    category: '⚖️ The Neutral Alignments',
    description: 'A Lawful Neutral character values tradition, discipline, honor, and obedience to a code more than any moral outcome. They believe that strong laws and order are necessary for existence, and they follow those laws impartially, whether they lead to good or evil.',
    examples: [
      'A soldier who always follows the orders of their commanding officer, regardless of whether they agree with the specific mission.',
      'A monk dedicated to a specific, strict spiritual tradition whose rules dictate their every action and purpose.',
    ],
  },
  'True Neutral': {
    category: '⚖️ The Neutral Alignments',
    description: 'A True Neutral character—sometimes called "Neutral Neutral"—is defined by a commitment to true impartiality, balance, and survival, often focusing on their own skin or simple needs. They view all extremes (good/evil, law/chaos) as dangerous and will ally with or oppose any side if it serves their current goal or maintains the balance of power.',
    examples: [
      'A druid who strives to protect the balance of nature, seeing civilization and destructive monsters as equally harmful extremes that must be kept in check.',
      'A mercenary who works only for the highest bidder, acting solely out of self-interest and not caring about the justice or wickedness of their client.',
    ],
  },
  'Chaotic Neutral': {
    category: '⚖️ The Neutral Alignments',
    description: 'A Chaotic Neutral character is an individualist and a free spirit who follows their every whim. They are largely motivated by self-interest and personal freedom, with no strong compulsion toward good or evil. They are unpredictable and simply do whatever they feel like doing at the moment.',
    examples: [
      'A jester or trickster who pulls pranks and causes chaos for fun, sometimes helping people and sometimes hindering them, based only on what amuses them.',
      'A wild barbarian who lives outside of society, constantly seeking new experiences and thrills, and caring little for the consequences of their actions on others.',
    ],
  },
  'Lawful Evil': {
    category: '😈 The Evil Alignments',
    description: 'A Lawful Evil character acts within a set of personal or systemic rules, but uses that system to achieve self-serving, evil goals. They believe in the power of hierarchy and control, often using laws, tradition, or oaths to secure power and impose their will on others. They can be relied upon to keep their word, but only if it serves their interests.',
    examples: [
      'A tyrant who uses oppressive laws and fear to control their kingdom and enrich themselves, upholding the letter of the law while violating its spirit.',
      'A devil who follows a strict hierarchy and honors all contracts, knowing that every deal is a path to the corruption and eventual damnation of souls.',
    ],
  },
  'Neutral Evil': {
    category: '😈 The Evil Alignments',
    description: 'A Neutral Evil character is concerned with their own well-being, power, and advancement above all else. They are typically unburdened by loyalty or rules, using whatever method—organized crime, deception, or outright violence—to get what they want. They kill, steal, and deceive without remorse if it benefits them.',
    examples: [
      'A crime boss who runs an organization for personal gain, forming temporary alliances when useful and breaking them when they are no longer beneficial.',
      'A power-hungry wizard who pursues forbidden knowledge and dark magic, seeing others as tools or obstacles to be eliminated in their quest for magical supremacy.',
    ],
  },
  'Chaotic Evil': {
    category: '😈 The Evil Alignments',
    description: 'A Chaotic Evil character represents the destructive force of pure, malicious self-interest and sadism. They are motivated by the desire to cause pain, spread chaos, and destroy beauty or goodness. They are brutal, arbitrary, and unpredictable, often acting alone or in loose bands of monstrous thugs.',
    examples: [
      'A demon whose sole purpose is to destroy and corrupt, delighting in senseless violence and suffering.',
      'A crazed cultist or homicidal maniac who seeks only to burn down society and murder as many people as possible, without any coherent plan or goal beyond destruction.',
    ],
  },
};

const BACKGROUNDS = [
  {
    name: 'Acolyte',
    description: 'You have spent your life in the service of a temple to a specific god or pantheon of gods. You act as an intermediary between the realm of the holy and the mortal world, performing sacred rites and offering sacrifices.',
    skillProficiencies: ['Insight', 'Religion'],
    languages: 'Two of your choice',
    equipment: 'Holy symbol, prayer book, 5 sticks of incense, vestments, common clothes, pouch with 15gp',
    feature: 'Shelter of the Faithful',
    featureDescription: 'As an acolyte, you command the respect of those who share your faith. You and your companions can expect free healing and care at temples, shrines, and other establishments of your faith. Those who share your religion will support you at a modest lifestyle.',
  },
  {
    name: 'Criminal',
    description: 'You are an experienced criminal with a history of breaking the law. You have spent a lot of time among other criminals and still have contacts within the criminal underworld.',
    skillProficiencies: ['Deception', 'Stealth'],
    languages: 'None',
    equipment: 'Crowbar, dark common clothes with hood, pouch with 15gp',
    feature: 'Criminal Contact',
    featureDescription: 'You have a reliable and trustworthy contact who acts as your liaison to a network of other criminals. You know how to get messages to and from your contact, even over great distances.',
  },
  {
    name: 'Folk Hero',
    description: 'You come from a humble social rank, but you are destined for so much more. Already the people of your home village regard you as their champion, and your destiny calls you to stand against the tyrants and monsters that threaten the common folk.',
    skillProficiencies: ['AnimalHandling', 'Survival'],
    languages: 'None',
    equipment: 'Artisan\'s tools, shovel, iron pot, common clothes, pouch with 10gp',
    feature: 'Rustic Hospitality',
    featureDescription: 'Since you come from the ranks of the common folk, you fit in among them with ease. You can find a place to hide, rest, or recuperate among other commoners, unless you have shown yourself to be a danger to them.',
  },
  {
    name: 'Noble',
    description: 'You understand wealth, power, and privilege. You carry a noble title, and your family owns land, collects taxes, and wields significant political influence.',
    skillProficiencies: ['History', 'Persuasion'],
    languages: 'One of your choice',
    equipment: 'Fine clothes, signet ring, scroll of pedigree, purse with 25gp',
    feature: 'Position of Privilege',
    featureDescription: 'Thanks to your noble birth, people are inclined to think the best of you. You are welcome in high society, and people assume you have the right to be wherever you are. The common folk make every effort to accommodate you and avoid your displeasure.',
  },
  {
    name: 'Sage',
    description: 'You spent years learning the lore of the multiverse. You scoured manuscripts, studied scrolls, and listened to the greatest experts on the subjects that interest you.',
    skillProficiencies: ['Arcana', 'History'],
    languages: 'Two of your choice',
    equipment: 'Bottle of ink, quill, small knife, letter from dead colleague, common clothes, pouch with 10gp',
    feature: 'Researcher',
    featureDescription: 'When you attempt to learn or recall a piece of lore, if you do not know that information, you often know where and from whom you can obtain it. Usually, this comes from a library, scriptorium, university, or a sage or other learned person.',
  },
  {
    name: 'Soldier',
    description: 'War has been your life for as long as you care to remember. You trained as a youth, studied the use of weapons and armor, learned basic survival techniques, and eventually took up arms to defend your people.',
    skillProficiencies: ['Athletics', 'Intimidation'],
    languages: 'None',
    equipment: 'Rank insignia, trophy from fallen enemy, bone dice set, common clothes, pouch with 10gp',
    feature: 'Military Rank',
    featureDescription: 'You have a military rank from your career as a soldier. Soldiers loyal to your former military organization still recognize your authority and influence, and they defer to you if they are of a lower rank.',
  },
];

const SKILL_TO_ABILITY: Record<SkillName, AbilityName> = {
    Acrobatics: 'DEX', AnimalHandling: 'WIS', Arcana: 'INT', Athletics: 'STR', Deception: 'CHA', History: 'INT', Insight: 'WIS', Intimidation: 'CHA', Investigation: 'INT', Medicine: 'WIS', Nature: 'INT', Perception: 'WIS', Performance: 'CHA', Persuasion: 'CHA', Religion: 'INT', SleightOfHand: 'DEX', Stealth: 'DEX', Survival: 'WIS',
};
const ALL_SKILLS = Object.keys(SKILL_TO_ABILITY) as SkillName[];
const PROFICIENCY_BONUSES = { 1: 2, 2: 2, 3: 2, 4: 2, 5: 3, 6: 3, 7: 3, 8: 3, 9: 4, 10: 4 };

const getModifier = (score: number): number => Math.floor((score - 10) / 2);

const calculateCharacterStats = (data: CharacterCreationData): Character => {
  const allRaces = getAllRaces();
  const raceData = allRaces.find(r => r.slug === data.raceSlug);
  const allClasses = getAllClasses();
  const classData = allClasses.find(c => c.slug === data.classSlug);

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
  const pb = PROFICIENCY_BONUSES[level as keyof typeof PROFICIENCY_BONUSES] || 2;

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
  const backgroundSkills = backgroundData?.skillProficiencies || [];
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
  if (isSpellcaster(classData) && classData.spellcasting) {
    const spellAbility = classData.spellcasting.ability;
    const spellModifier = finalAbilities[spellAbility].modifier;

    spellcastingData = {
      ability: spellAbility,
      spellSaveDC: 8 + pb + spellModifier,
      spellAttackBonus: pb + spellModifier,
      cantripsKnown: data.spellSelection.selectedCantrips,
      spellsKnown: data.spellSelection.selectedSpells,
      spellSlots: classData.spellcasting.spellSlots,
    };
  }

  // 5. Construct Final Character Object
  return {
    id: generateUUID(), // Generate UUID for IndexedDB
    name: data.name || "Unnamed Hero",
    race: raceData.name,
    class: classData.name,
    level,
    alignment: data.alignment,
    background: data.background,
    inspiration: false,
    proficiencyBonus: pb,
    armorClass: 10 + finalAbilities.DEX.modifier,
    hitPoints: maxHitPoints,
    maxHitPoints,
    speed: 30,
    initiative: finalAbilities.DEX.modifier,
    abilities: finalAbilities,
    skills: finalSkills,
    featuresAndTraits: {
      personality: data.personality,
      ideals: data.ideals,
      bonds: data.bonds,
      flaws: data.flaws,
      classFeatures: classData.class_features,
      racialTraits: raceData.racial_traits,
    },
    spellcasting: spellcastingData, // Sprint 2: Include spell data
  };
};

// --- Component Props Interfaces ---
interface CharacterSheetProps {
  character: Character;
  onClose: () => void;
  onDelete: (id: string) => void;
  setRollResult: React.Dispatch<React.SetStateAction<{ text: string; value: number | null }>>;
  onDiceRoll: (roll: DiceRollType) => void;
  onToggleInspiration: (id: string) => void;
  onFeatureClick: (featureName: string) => void;
}

interface WizardProps {
  isOpen: boolean;
  onClose: () => void;
  onCharacterCreated: () => void;
  setRollResult: React.Dispatch<React.SetStateAction<{ text: string; value: number | null }>>;
}

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

const CharacterSheet: React.FC<CharacterSheetProps> = ({ character, onClose, onDelete, setRollResult, onDiceRoll, onToggleInspiration, onFeatureClick }) => {
  const abilities = Object.entries(character.abilities) as [AbilityName, AbilityScore][];
  const skills = Object.entries(character.skills) as [SkillName, Skill][];
  const passivePerception = (character.skills.Perception.value + 10);

  // Handle initiative roll
  const handleInitiativeRoll = () => {
    const roll = createInitiativeRoll(character.initiative);
    setRollResult({ text: `${roll.label}: ${roll.notation}`, value: roll.total });
    onDiceRoll(roll);
  };

  return (
    <div className="p-4 md:p-8 bg-gray-900 text-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header and Controls */}
        <div className="flex justify-between items-center border-b border-red-700 pb-3">
          <h1 className="text-3xl font-serif font-bold text-red-500 truncate">{character.name}</h1>
          <div className="flex space-x-3">
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
          <div className="col-span-1 flex flex-col items-center"><UserIcon className="w-6 h-6 text-red-500 mb-1" /><span className="text-sm font-semibold text-gray-400">P.Perc</span><div className="text-4xl font-extrabold text-white">{passivePerception}</div></div>
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
        {character.spellcasting && (
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
                <div className="space-y-1 text-sm">
                  {character.spellcasting.spellSlots.map((slots, level) => {
                    if (level === 0 || slots === 0) return null;
                    return (
                      <div key={level} className="flex justify-between">
                        <span className="text-gray-400">Level {level}:</span>
                        <span className="font-bold text-white">{slots} {slots === 1 ? 'slot' : 'slots'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cantrips & Spells */}
              <div className="p-4 bg-gray-800 rounded-xl shadow-lg border-l-4 border-green-500">
                <h3 className="text-lg font-bold text-green-400 mb-3">Known Spells</h3>
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
                  <div>
                    <div className="font-semibold text-gray-300 mb-1">1st Level ({character.spellcasting.spellsKnown.length})</div>
                    <ul className="list-disc list-inside space-y-0.5 text-xs text-gray-400">
                      {character.spellcasting.spellsKnown.map((spellSlug) => {
                        const spell = SPELL_DATABASE.find(s => s.slug === spellSlug);
                        return <li key={spellSlug}>{spell?.name || spellSlug}</li>;
                      })}
                    </ul>
                  </div>
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
              <h3 className="text-lg font-bold text-green-400 mb-2">Racial & Class Features</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                {character.featuresAndTraits.racialTraits.map((trait, index) => (
                  <li key={`r-${index}`}>
                    <button onClick={() => onFeatureClick(trait)} className="text-left hover:text-yellow-300 transition-colors cursor-pointer">
                      <span className="font-semibold text-white">[Racial]</span> {trait}
                    </button>
                  </li>
                ))}
                {character.featuresAndTraits.classFeatures.map((feature, index) => (
                  <li key={`c-${index}`}>
                    <button onClick={() => onFeatureClick(feature)} className="text-left hover:text-yellow-300 transition-colors cursor-pointer">
                      <span className="font-semibold text-white">[Class]</span> {feature}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- Character Creation Wizard Steps ---

const STEP_TITLES = [
    'Character Details',
    'Choose Race',
    'Choose Class & Skills',
    'Select Spells',        // Sprint 2: New step
    'Determine Abilities',
    'Select Equipment',
    'Finalize Background'
];

interface StepProps {
    data: CharacterCreationData;
    updateData: (updates: Partial<CharacterCreationData>) => void;
    nextStep: () => void;
    prevStep: () => void;
    stepIndex: number;
}

const Step1Details: React.FC<StepProps> = ({ data, updateData, nextStep }) => {
    const [showAlignmentInfo, setShowAlignmentInfo] = useState(true);
    const [showBackgroundInfo, setShowBackgroundInfo] = useState(true);

    const selectedAlignment = data.alignment ? ALIGNMENT_INFO[data.alignment] : null;
    const selectedBackground = BACKGROUNDS.find(bg => bg.name === data.background);

    return (
        <div className='space-y-4'>
            <h3 className='text-xl font-bold text-red-300'>Basic Identity</h3>
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

            {selectedAlignment && showAlignmentInfo && (
                <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 space-y-3 relative">
                    <button
                        onClick={() => setShowAlignmentInfo(false)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
                        title="Close"
                    >
                        <XCircle className="w-5 h-5" />
                    </button>

                    <div className="text-sm font-semibold text-purple-400">{selectedAlignment.category}</div>
                    <h4 className="text-lg font-bold text-yellow-300">{data.alignment}</h4>
                    <p className="text-sm text-gray-300">{selectedAlignment.description}</p>

                    <div className="pt-2 border-t border-gray-600">
                        <div className="font-semibold text-yellow-400 mb-2">Examples:</div>
                        <ul className="space-y-2 text-xs text-gray-400">
                            {selectedAlignment.examples.map((example, idx) => (
                                <li key={idx} className="pl-3 border-l-2 border-gray-600">{example}</li>
                            ))}
                        </ul>
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
                <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 space-y-3 relative">
                    <button
                        onClick={() => setShowBackgroundInfo(false)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
                        title="Close"
                    >
                        <XCircle className="w-5 h-5" />
                    </button>

                    <h4 className="text-lg font-bold text-yellow-300">{selectedBackground.name}</h4>
                    <p className="text-sm text-gray-300">{selectedBackground.description}</p>

                    <div className="space-y-2 text-sm">
                        <div>
                            <span className="font-semibold text-red-400">Skill Proficiencies: </span>
                            <span className="text-gray-300">{selectedBackground.skillProficiencies.join(', ')}</span>
                        </div>

                        <div>
                            <span className="font-semibold text-red-400">Languages: </span>
                            <span className="text-gray-300">{selectedBackground.languages}</span>
                        </div>

                        <div>
                            <span className="font-semibold text-red-400">Equipment: </span>
                            <span className="text-gray-300">{selectedBackground.equipment}</span>
                        </div>

                        <div className="pt-2 border-t border-gray-600">
                            <div className="font-semibold text-yellow-400 mb-1">Feature: {selectedBackground.feature}</div>
                            <p className="text-xs text-gray-400">{selectedBackground.featureDescription}</p>
                        </div>
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

    const allRaces = getAllRaces();
    const selectedRace = allRaces.find(r => r.slug === data.raceSlug);

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
            <h3 className='text-xl font-bold text-red-300'>Select Race (Racial Bonuses will be applied automatically)</h3>

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

    const allClasses = getAllClasses();
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
            <h3 className='text-xl font-bold text-red-300'>Select Class (Hit Die and Starting Proficiencies)</h3>

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
                        Choose Skills ({data.selectedSkills.length} / {selectedClass.num_skill_choices} selected)
                    </h4>
                    <p className="text-xs text-gray-400">
                        Select {selectedClass.num_skill_choices} skill{selectedClass.num_skill_choices !== 1 ? 's' : ''} from your class options.
                        Skills from your background are automatically granted.
                    </p>

                    {/* Background Skills (Auto-granted) */}
                    {(() => {
                        const backgroundData = BACKGROUNDS.find(bg => bg.name === data.background);
                        const backgroundSkills = backgroundData?.skillProficiencies || [];

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
                            const backgroundSkills = backgroundData?.skillProficiencies || [];
                            const isBackgroundSkill = backgroundSkills.includes(skill);
                            const isSelected = data.selectedSkills.includes(skill as SkillName);
                            const canSelect = data.selectedSkills.length < selectedClass.num_skill_choices;

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

                    {data.selectedSkills.length < selectedClass.num_skill_choices && (
                        <div className="text-xs text-yellow-400 mt-2">
                            ⚠️ Please select {selectedClass.num_skill_choices - data.selectedSkills.length} more skill{selectedClass.num_skill_choices - data.selectedSkills.length !== 1 ? 's' : ''}
                        </div>
                    )}
                </div>
            )}

            <div className='flex justify-between'>
                <button onClick={prevStep} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white flex items-center">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </button>
                <button
                    onClick={nextStep}
                    disabled={!data.classSlug || !selectedClass || data.selectedSkills.length < selectedClass.num_skill_choices}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white flex items-center disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    Next: Abilities <ArrowRight className="w-4 h-4 ml-2" />
                </button>
            </div>
        </div>
    );
};

// Sprint 2: Spell Selection Step
const Step3point5Spells: React.FC<StepProps> = ({ data, updateData, nextStep, prevStep }) => {
    const allClasses = getAllClasses();
    const selectedClass = allClasses.find(c => c.slug === data.classSlug);

    // If not a spellcaster, skip this step
    if (!selectedClass || !isSpellcaster(selectedClass)) {
        // Auto-advance to next step if not a spellcaster
        React.useEffect(() => {
            nextStep();
        }, []);
        return <div className='text-center text-gray-400'>This class doesn't have spellcasting. Advancing...</div>;
    }

    const spellcasting = selectedClass.spellcasting!;
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

    const handleSpellToggle = (spellSlug: string) => {
        const current = data.spellSelection.selectedSpells;
        const isSelected = current.includes(spellSlug);

        if (isSelected) {
            // Deselect
            updateData({
                spellSelection: {
                    ...data.spellSelection,
                    selectedSpells: current.filter(s => s !== spellSlug),
                },
            });
        } else if (current.length < spellcasting.spellsKnownOrPrepared) {
            // Select (if under limit)
            updateData({
                spellSelection: {
                    ...data.spellSelection,
                    selectedSpells: [...current, spellSlug],
                },
            });
        }
    };

    const cantripsComplete = data.spellSelection.selectedCantrips.length === spellcasting.cantripsKnown;
    const spellsComplete = data.spellSelection.selectedSpells.length === spellcasting.spellsKnownOrPrepared;
    const allSelectionsComplete = cantripsComplete && spellsComplete;

    // Spell mode description
    const modeDescription = spellcasting.mode === 'book'
        ? 'Choose spells for your spellbook. You can prepare a subset of these each day.'
        : spellcasting.mode === 'prepared'
        ? 'Choose spells to prepare. You can change your prepared spells after a long rest.'
        : 'Choose spells your character knows. These are permanent until you level up.';

    return (
        <div className='space-y-6'>
            <div>
                <h3 className='text-xl font-bold text-red-300'>Select Your Spells</h3>
                <p className='text-sm text-gray-400 mt-1'>
                    {selectedClass.name} - {modeDescription}
                </p>
                <p className='text-xs text-purple-300 mt-1'>
                    Spellcasting Ability: <span className='font-bold'>{spellcasting.ability}</span>
                </p>
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
                    {availableCantrips.map(spell => {
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

            {/* 1st Level Spells Section */}
            <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 space-y-3">
                <h4 className="text-lg font-bold text-yellow-300">
                    1st Level Spells ({data.spellSelection.selectedSpells.length} / {spellcasting.spellsKnownOrPrepared} selected)
                </h4>
                <p className="text-xs text-gray-400">
                    {spellcasting.mode === 'book' && 'These spells will be in your spellbook at 1st level.'}
                    {spellcasting.mode === 'prepared' && 'You can prepare these spells from the full list.'}
                    {spellcasting.mode === 'known' && 'These are the spells your character knows permanently.'}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableSpells.map(spell => {
                        const isSelected = data.spellSelection.selectedSpells.includes(spell.slug);
                        const canSelect = data.spellSelection.selectedSpells.length < spellcasting.spellsKnownOrPrepared;

                        return (
                            <button
                                key={spell.slug}
                                onClick={() => handleSpellToggle(spell.slug)}
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

            <h3 className='text-xl font-bold text-red-300'>
                Determine Ability Scores ({methodTitles[data.abilityScoreMethod]})
            </h3>

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

const Step5Equipment: React.FC<StepProps> = ({ data, updateData, nextStep, prevStep }) => {
    const allClasses = getAllClasses();
    const selectedClass = allClasses.find(c => c.slug === data.classSlug);

    if (!selectedClass) {
        return <div>Loading...</div>;
    }

    // Initialize equipment choices if not already set
    if (data.equipmentChoices.length === 0 && selectedClass.equipment_choices.length > 0) {
        updateData({ equipmentChoices: selectedClass.equipment_choices });
    }

    const handleEquipmentChoice = (choiceId: string, optionIndex: number) => {
        const updatedChoices = data.equipmentChoices.map(choice =>
            choice.choiceId === choiceId ? { ...choice, selected: optionIndex } : choice
        );
        updateData({ equipmentChoices: updatedChoices });
    };

    const allChoicesMade = data.equipmentChoices.every(choice => choice.selected !== null);

    return (
        <div className='space-y-6'>
            <h3 className='text-xl font-bold text-red-300'>Select Starting Equipment</h3>
            <p className="text-sm text-gray-400">
                Choose your starting equipment based on your class. Your background will also grant additional items.
            </p>

            {/* Equipment Choices */}
            {data.equipmentChoices.map((choice, idx) => (
                <div key={choice.choiceId} className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold text-yellow-300">
                        {idx + 1}. {choice.description}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {choice.options.map((option, optionIdx) => (
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
                        ))}
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
                            <p className="text-sm text-gray-300">{backgroundData.equipment}</p>
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

            <div className='flex justify-between'>
                <button onClick={prevStep} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white flex items-center">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </button>
                <button
                    onClick={nextStep}
                    disabled={!allChoicesMade}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white flex items-center disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    Next: Traits <ArrowRight className="w-4 h-4 ml-2" />
                </button>
            </div>
        </div>
    );
};

const Step6Traits: React.FC<StepProps & { onSubmit: (data: CharacterCreationData) => void }> = ({ data, updateData, prevStep, onSubmit }) => {
    return (
        <div className='space-y-6'>
            <h3 className='text-xl font-bold text-red-300'>Final Details & Personality</h3>

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
                const allClasses = getAllClasses();
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

    const handleSubmit = async (data: CharacterCreationData) => {
        setIsLoading(true);
        setError(null);
        setRollResult({ text: "Creating character sheet...", value: null });

        try {
            const finalCharacter = calculateCharacterStats(data);
            await addCharacter(finalCharacter);

            setRollResult({ text: `Successfully created ${finalCharacter.name}!`, value: null });
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
            case 0: return <Step1Details {...commonProps} />;
            case 1: return <Step2Race {...commonProps} />;
            case 2: return <Step3Class {...commonProps} />;
            case 3: return <Step3point5Spells {...commonProps} />; // Sprint 2: Spell selection
            case 4: return <Step4Abilities {...commonProps} />;
            case 5: return <Step5Equipment {...commonProps} />;
            case 6: return <Step6Traits {...commonProps} onSubmit={handleSubmit} />;
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
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [rollResult, setRollResult] = useState<{ text: string; value: number | null }>({ text: 'Ready to Roll!', value: null });
  const [rollHistory, setRollHistory] = useState<DiceRollType[]>([]);
  const [latestRoll, setLatestRoll] = useState<DiceRollType | null>(null);
  const [featureModal, setFeatureModal] = useState<{name: string, description: string, source?: string} | null>(null);

  const selectedCharacter = useMemo(() => {
    return characters.find(c => c.id === selectedCharacterId);
  }, [characters, selectedCharacterId]);

  // Handle feature click
  const handleFeatureClick = useCallback((featureName: string) => {
    const feature = featureDescriptions[featureName];
    if (feature) {
      setFeatureModal({ name: featureName, ...feature });
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

  // CRUD Operations
  const handleDeleteCharacter = useCallback(async (id: string) => {
    try {
      await deleteCharacter(id);
      setSelectedCharacterId(null);
      setRollResult({ text: 'Character deleted successfully.', value: null });
      await loadCharacters();
    } catch (e) {
      console.error("Error deleting character:", e);
      setRollResult({ text: 'Error deleting character.', value: null });
    }
  }, [loadCharacters]);

  // Export all characters as JSON
  const handleExportData = useCallback(() => {
    const dataStr = JSON.stringify(characters, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `5e_characters_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setRollResult({ text: 'Characters exported successfully!', value: null });
  }, [characters]);

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
        />
        <DiceBox3D latestRoll={latestRoll} />
        <RollHistoryTicker rolls={rollHistory} />
        <RollHistoryModal rolls={rollHistory} onClear={handleClearHistory} />
        <FeatureModal feature={featureModal} onClose={() => setFeatureModal(null)} />
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
                    <h3 className="text-2xl font-bold text-red-400 truncate">{char.name}</h3>
                    <p className="text-sm text-gray-400 mb-3">{char.race} | {char.class} (Level {char.level})</p>

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
      </div>
    </div>
  );
};

export default App;

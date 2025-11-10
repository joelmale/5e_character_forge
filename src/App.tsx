import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Dice6, Plus, Trash2, Loader2, BookOpen, User as UserIcon, Shield, Zap, ArrowLeft, ArrowRight, Check, Download, Upload, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { DiceBox3D } from './components/DiceBox3D';
import { RollHistoryModal, RollHistoryTicker } from './components/RollHistory';
import { createAbilityRoll, createSkillRoll, createInitiativeRoll, getRollHistory, addRollToHistory, clearRollHistory, type DiceRoll as DiceRollType } from './utils/diceRoller';
import { diceSounds } from './utils/diceSounds';

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
}

// --- Intermediate Wizard Data Structure ---
type AbilityName = keyof Character['abilities'];
type SkillName = keyof Character['skills'];

interface CharacterCreationData {
  name: string;
  level: number;
  raceSlug: string;
  classSlug: string;
  abilities: Record<AbilityName, number>; // Raw scores only during creation
  background: string;
  alignment: string;

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
  abilities: { STR: 8, DEX: 8, CON: 8, INT: 8, WIS: 8, CHA: 8 },
  background: 'Outlander',
  alignment: 'Neutral Good',
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

const RACE_CATEGORIES: RaceCategory[] = [
  {
    name: 'Core Races',
    icon: '📖',
    description: 'The most common and essential races from the Player\'s Handbook',
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

const MOCK_CLASSES = [
  { slug: 'fighter', name: 'Fighter', hit_die: 10, primary_stat: 'STR', save_throws: ['STR', 'CON'], skill_proficiencies: ['Athletics', 'Acrobatics'], class_features: ['Fighting Style', 'Second Wind'] },
  { slug: 'wizard', name: 'Wizard', hit_die: 6, primary_stat: 'INT', save_throws: ['INT', 'WIS'], skill_proficiencies: ['Arcana', 'History'], class_features: ['Spellcasting', 'Arcane Recovery'] },
  { slug: 'rogue', name: 'Rogue', hit_die: 8, primary_stat: 'DEX', save_throws: ['DEX', 'INT'], skill_proficiencies: ['SleightOfHand', 'Stealth', 'Acrobatics', 'Deception'], class_features: ['Expertise', 'Sneak Attack'] },
];

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
  const classData = MOCK_CLASSES.find(c => c.slug === data.classSlug);

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

  // 2. Calculate Hit Points (Simplified for Level 1)
  const maxHitPoints = classData.hit_die + finalAbilities.CON.modifier + (raceData.slug === 'dwarf' ? level : 0);

  // 3. Calculate Skills
  const finalSkills: Character['skills'] = {} as Character['skills'];
  ALL_SKILLS.forEach((skillName) => {
    const ability = SKILL_TO_ABILITY[skillName];
    const modifier = finalAbilities[ability].modifier;
    const isProficient = classData.skill_proficiencies.includes(skillName);

    finalSkills[skillName] = {
      proficient: isProficient,
      value: modifier + (isProficient ? pb : 0),
    };
  });

  // 4. Construct Final Character Object
  return {
    id: crypto.randomUUID(), // Generate UUID for IndexedDB
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
    }
  };
};

// --- Component Props Interfaces ---
interface CharacterSheetProps {
  character: Character;
  onClose: () => void;
  onDelete: (id: string) => void;
  setRollResult: React.Dispatch<React.SetStateAction<{ text: string; value: number | null }>>;
  onDiceRoll: (roll: DiceRollType) => void;
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

const CharacterSheet: React.FC<CharacterSheetProps> = ({ character, onClose, onDelete, setRollResult, onDiceRoll }) => {
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
          <button onClick={handleInitiativeRoll} className="col-span-1 flex flex-col items-center bg-gray-700/50 p-2 rounded-lg hover:bg-red-700/70 transition-colors" title="Roll Initiative"><Dice6 className="w-6 h-6 text-red-500 mb-1" /><span className="text-sm font-semibold text-gray-400">Init</span><div className="text-4xl font-extrabold text-yellow-300">{formatModifier(character.initiative)}</div></button>
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
                <button className={`w-8 h-8 rounded-full transition-all ${character.inspiration ? 'bg-yellow-500' : 'bg-gray-600'}`}>
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
                {character.featuresAndTraits.racialTraits.map((trait, index) => (<li key={`r-${index}`} className='text-gray-400'><span className="font-semibold text-white">[Racial]</span> {trait}</li>))}
                {character.featuresAndTraits.classFeatures.map((feature, index) => (<li key={`c-${index}`} className='text-gray-400'><span className="font-semibold text-white">[Class]</span> {feature}</li>))}
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
    'Choose Class',
    'Determine Abilities',
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

const Step3Class: React.FC<StepProps> = ({ data, updateData, nextStep, prevStep }) => (
    <div className='space-y-6'>
        <h3 className='text-xl font-bold text-red-300'>Select Class (Hit Die and Starting Proficiencies)</h3>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {MOCK_CLASSES.map(_class => (
                <button
                    key={_class.slug}
                    onClick={() => updateData({ classSlug: _class.slug })}
                    className={`p-4 rounded-xl text-left border-2 transition-all ${data.classSlug === _class.slug
                        ? 'bg-red-800 border-red-500 shadow-md'
                        : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`
                    }
                >
                    <p className='text-lg font-bold text-yellow-300'>{_class.name}</p>
                    <p className='text-sm text-gray-400 mt-1'>Hit Die: d{_class.hit_die}</p>
                    <p className='text-xs text-gray-500 mt-1'>Saves: {_class.save_throws.join(', ')}</p>
                </button>
            ))}
        </div>
        <div className='flex justify-between'>
            <button onClick={prevStep} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white flex items-center"><ArrowLeft className="w-4 h-4 mr-2" /> Back</button>
            <button onClick={nextStep} disabled={!data.classSlug} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white flex items-center disabled:bg-gray-600">Next: Abilities <ArrowRight className="w-4 h-4 ml-2" /></button>
        </div>
    </div>
);

const Step4Abilities: React.FC<StepProps> = ({ data, updateData, nextStep, prevStep }) => {
    const scores = useMemo(() => [15, 14, 13, 12, 10, 8], []);
    const availableScores = scores.filter(s => !Object.values(data.abilities).includes(s));
    const isComplete = Object.values(data.abilities).every(score => score !== 8);

    const handleAssignScore = (ability: AbilityName, score: number) => {
        const currentScore = data.abilities[ability];

        if (currentScore === 8 && availableScores.includes(score)) {
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

    const allRaces = getAllRaces();
    const raceData = allRaces.find(r => r.slug === data.raceSlug);
    const abilityNames = Object.keys(data.abilities) as AbilityName[];

    return (
        <div className='space-y-6'>
            <h3 className='text-xl font-bold text-red-300'>Determine Ability Scores (Using Standard Array)</h3>
            <div className='flex flex-wrap gap-2 mb-4 p-3 bg-gray-700 rounded-lg'>
                <span className='text-sm font-semibold text-gray-400 mr-2'>Scores to Assign:</span>
                {scores.map(s => (
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
                                    <option value={8} disabled={baseScore !== 8}>Base Score...</option>
                                    {scores.map(s => (
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
                                    {finalScore} ({formatModifier(modifier)})
                                </span>
                            </div>
                            {racialBonus > 0 && <p className='text-xs text-green-400 mt-1'>+ {racialBonus} (Racial)</p>}
                        </div>
                    );
                })}
            </div>
            <div className='flex justify-between'>
                <button onClick={prevStep} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white flex items-center"><ArrowLeft className="w-4 h-4 mr-2" /> Back</button>
                <button onClick={nextStep} disabled={!isComplete} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white flex items-center disabled:bg-gray-600">Next: Traits <ArrowRight className="w-4 h-4 ml-2" /></button>
            </div>
        </div>
    );
};

const Step5Traits: React.FC<StepProps & { onSubmit: (data: CharacterCreationData) => void }> = ({ data, updateData, prevStep, onSubmit }) => {
    return (
        <div className='space-y-6'>
            <h3 className='text-xl font-bold text-red-300'>Final Details & Personality</h3>

            <textarea
                placeholder="Personality Traits"
                value={data.personality}
                onChange={(e) => updateData({ personality: e.target.value })}
                className="w-full h-20 p-3 bg-gray-700 text-white rounded-lg focus:ring-red-500 focus:border-red-500 resize-none"
            />
             <textarea
                placeholder="Ideals"
                value={data.ideals}
                onChange={(e) => updateData({ ideals: e.target.value })}
                className="w-full h-16 p-3 bg-gray-700 text-white rounded-lg focus:ring-red-500 focus:border-red-500 resize-none"
            />
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <textarea
                    placeholder="Bonds"
                    value={data.bonds}
                    onChange={(e) => updateData({ bonds: e.target.value })}
                    className="w-full h-16 p-3 bg-gray-700 text-white rounded-lg focus:ring-red-500 focus:border-red-500 resize-none"
                />
                <textarea
                    placeholder="Flaws"
                    value={data.flaws}
                    onChange={(e) => updateData({ flaws: e.target.value })}
                    className="w-full h-16 p-3 bg-gray-700 text-white rounded-lg focus:ring-red-500 focus:border-red-500 resize-none"
                />
            </div>

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
            case 3: return <Step4Abilities {...commonProps} />;
            case 4: return <Step5Traits {...commonProps} onSubmit={handleSubmit} />;
            default: return <p>Unknown step.</p>;
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-2xl transition-all transform duration-300 scale-100"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center border-b border-red-700 pb-3 mb-6">
                    <h2 className="text-2xl font-bold text-red-500 flex items-center">
                        <Dice6 className="w-6 h-6 mr-2" /> {STEP_TITLES[currentStep]}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-xl font-bold">&times;</button>
                </div>

                {/* Progress Bar */}
                <div className='mb-6'>
                    <div className='h-2 bg-gray-700 rounded-full overflow-hidden'>
                        <div
                            className='h-full bg-red-600 transition-all duration-500'
                            style={{ width: `${((currentStep + 1) / STEP_TITLES.length) * 100}%` }}
                        />
                    </div>
                    <p className='text-center text-sm text-gray-400 mt-2'>Step {currentStep + 1} of {STEP_TITLES.length}</p>
                </div>

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

  const selectedCharacter = useMemo(() => {
    return characters.find(c => c.id === selectedCharacterId);
  }, [characters, selectedCharacterId]);

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
          const newChar = { ...char, id: crypto.randomUUID() };
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

  if (selectedCharacter) {
    return (
      <>
        <CharacterSheet
          character={selectedCharacter}
          onClose={() => setSelectedCharacterId(null)}
          onDelete={handleDeleteCharacter}
          setRollResult={setRollResult}
          onDiceRoll={handleDiceRoll}
        />
        <DiceBox3D latestRoll={latestRoll} />
        <RollHistoryTicker rolls={rollHistory} />
        <RollHistoryModal rolls={rollHistory} onClear={handleClearHistory} />
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

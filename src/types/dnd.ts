export const ABILITY_SCORES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const;
export type Ability = typeof ABILITY_SCORES[number];

export interface Alignment {
  name: string;
  description: string;
}

export interface Background {
  name: string;
  description: string;
  skill_proficiencies: string[];
  languages?: string[];
  equipment: string[];
  feature: string;
  feature_description: string;
  personality_traits: string[];
  ideals: string[];
  bonds: string[];
  flaws: string[];
  roleplaying_suggestions?: string;
}



export interface EquipmentPackage {
  name: string;
  level?: number;
  startingGold?: number; // in gp
  items: Array<{
    name: string;
    quantity: number;
    slug?: string;
    equipped?: boolean;
  }>;
  recommendedItems?: string[]; // Text descriptions for DM to add
  recommendedFor?: string[]; // Array of class slugs this pack is recommended for
  description?: string; // Optional description of the pack
}

export interface FightingStyle {
  name: string;
  description: string;
  prerequisite: string;
}

export type SpellSlotsByClass = Record<string, number[][]>;
export type CantripsKnownByClass = Record<string, number[]>;

// --- D&D 5e Character Interface (Must be adhered to) ---
export interface AbilityScore { score: number; modifier: number; }
export interface Skill { value: number; proficient: boolean; }

export interface Character {
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
  hitDice: {
    current: number;
    max: number;
    dieType: number; // d6, d8, d10, d12, etc.
  };
  speed: number;
  initiative: number;
  abilities: {
    STR: AbilityScore; DEX: AbilityScore; CON: AbilityScore;
    INT: AbilityScore; WIS: AbilityScore; CHA: AbilityScore;
  };
  skills: {
    Acrobatics: Skill; AnimalHandling: Skill; Arcana: Skill; Athletics: Skill; Deception: Skill; History: Skill; Insight: Skill; Intimidation: Skill; Investigation: Skill; Medicine: Skill; Nature: Skill; Perception: Skill; Performance: Skill; Persuasion: Skill; Religion: Skill; SleightOfHand: Skill; Stealth: Skill; Survival: Skill;
  };
  languages?: string[]; // Known languages
  featuresAndTraits: {
    personality: string;
    ideals: string;
    bonds: string;
    flaws: string;
    classFeatures: string[];
    racialTraits: string[];
  };

  // Sprint 2: Spellcasting data (enhanced for differentiated types)
  spellcasting?: {
    ability: 'INT' | 'WIS' | 'CHA';
    spellSaveDC: number;
    spellAttackBonus: number;

    // Cantrips (always known, chosen at character creation)
    cantripsKnown: string[];

    // Spell knowledge based on casting type
    spellsKnown?: string[];        // Known casters: fixed list (Bard, Sorcerer, etc.)
    spellbook?: string[];          // Wizards: permanent spellbook
    preparedSpells?: string[];     // Prepared casters: daily selection (Cleric, Druid, etc.)

    // Spell slots and usage
    spellSlots: number[];          // Maximum slots by level [cantrips, 1st, 2nd, ...]
    usedSpellSlots: number[];      // Currently used slots by level

    // Metadata and progression
    spellcastingType: 'known' | 'prepared' | 'wizard';
    cantripChoicesByLevel: Record<number, string>;
    spellChoicesByLevel?: Record<number, string>; // For tracking spell learning
  };

  // Sprint 3: Character advancement
  subclass?: string; // Subclass slug (e.g., "berserker")
  experiencePoints?: number; // Current XP
  feats?: string[]; // Feat slugs (deprecated - use selectedFeats)
  selectedFightingStyle?: string; // Fighting Style name (Fighter/Paladin/Ranger)

  // Sprint 5: Features, Subclasses, and Feats
  srdFeatures?: {
    classFeatures: Array<{ name: string; slug: string; level: number; source: 'class' }>;
    subclassFeatures: Array<{ name: string; slug: string; level: number; source: 'subclass' }>;
  };
  selectedFeats?: string[]; // Feat slugs selected during character creation

  // Sprint 4: Equipment and inventory
  inventory?: EquippedItem[]; // All carried items
  currency?: {
    cp: number;
    sp: number;
    gp: number;
    pp: number;
  };
  equippedArmor?: string; // Equipment slug of equipped armor
  equippedWeapons?: string[]; // Equipment slugs of equipped weapons (primary, offhand, etc.)

  // Combat state
  temporaryHitPoints?: number;
  deathSaves?: {
    successes: number;
    failures: number;
  };
  conditions?: string[];

  // Metadata
  createdAt?: string;
  updatedAt?: string;
}

// --- Intermediate Wizard Data Structure ---
export type AbilityName = keyof Character['abilities'];
export type SkillName = keyof Character['skills'];

// Equipment and Skill interfaces for character creation
export interface EquipmentItem {
  name: string;
  type: 'weapon' | 'armor' | 'gear' | 'tool';
  quantity: number;
  weight?: number;
}

export interface EquipmentChoice {
  choiceId: string;
  description: string;
  options: EquipmentItem[][];
  selected: number | null; // Index of selected option
}

// Sprint 2: Spell system interfaces
// Spellcasting type classification
export type SpellcastingType = 'known' | 'prepared' | 'wizard';

export interface SpellSelectionData {
  // All spellcasters - cantrips chosen at character creation
  selectedCantrips: string[]; // Spell slugs

  // Known Casters (Bard, Sorcerer, Warlock, Ranger)
  knownSpells?: string[]; // Fixed spells known at level 1

  // Prepared Casters (Cleric, Druid, Paladin, Artificer)
  preparedSpells?: string[]; // Initially prepared spells from full class list

  // Wizard Special Case
  spellbook?: string[]; // 6 spells permanently in spellbook
  dailyPrepared?: string[]; // Spells prepared for the day from spellbook

  // Legacy support (deprecated - use type-specific fields above)
  selectedSpells?: string[]; // For backward compatibility
}

// Sprint 3: Feat system (interface moved to Sprint 5 section below)

// Sprint 4: Equipment system
export interface Equipment {
  slug: string;
  name: string;
  year: number; // 2014 or 2024
  equipment_category: string; // 'Weapon', 'Armor', 'Adventuring Gear', 'Tools', etc.
  cost: {
    quantity: number;
    unit: 'cp' | 'sp' | 'gp' | 'pp';
  };
  weight: number;
  description?: string;

  // Weapon-specific fields
  weapon_category?: 'Simple' | 'Martial';
  weapon_range?: 'Melee' | 'Ranged';
  damage?: {
    damage_dice: string;
    damage_type: string;
  };
  range?: {
    normal: number;
    long?: number;
  };
  properties?: string[]; // 'Light', 'Finesse', 'Thrown', 'Versatile', etc.
  two_handed_damage?: {
    damage_dice: string;
    damage_type: string;
  };
  mastery?: string; // 2024 only: weapon mastery property

  // Armor-specific fields
  armor_category?: 'Light' | 'Medium' | 'Heavy' | 'Shield';
  armor_class?: {
    base: number;
    dex_bonus: boolean;
    max_bonus?: number; // For medium armor
  };
  str_minimum?: number;
  stealth_disadvantage?: boolean;
  don_time?: string; // 2024 only
  doff_time?: string; // 2024 only

  // Tool/Gear-specific fields
  tool_category?: string;
  gear_category?: string;
  contents?: Array<{ item_index: string; item_name: string; quantity: number }>; // For containers
  capacity?: string; // For containers
}

export interface EquippedItem {
  equipmentSlug: string; // Reference to Equipment slug
  quantity: number;
  equipped: boolean; // Is this item currently equipped?
  notes?: string; // Player notes about the item
}

// Sprint 5: Class Features, Subclasses, and Feats
export interface Feature {
  slug: string;
  name: string;
  class: string; // 'barbarian', 'fighter', etc.
  subclass?: string; // Optional for subclass-specific features
  level: number; // Level when feature is gained
  desc: string[]; // Array of description paragraphs
  featureSpecific?: {
    subfeatureOptions?: {
      choose: number;
      type: string;
      from: { options: Array<{ option_type?: string; item?: { index: string; name: string; url: string }; ability_score?: { index: string; name: string; url: string } }> };
    };
  };
}

export interface Subclass {
  slug: string;
  name: string;
  class: string; // Parent class slug
  desc: string[];
  subclassFlavor: string; // e.g., "Path of the Berserker"

  // Enhanced subclass data
  detailedDescription?: string;
  keyFeatures?: string[];
  roleplayingTips?: string[];
  source?: string;
  icon?: string;
  themeColor?: string;
}

export interface Feat {
  slug: string;
  name: string;
  source: string; // 'PHB', 'XGtE', 'TCoE', 'FToD', 'SRD'
  year: number; // 2014 or 2024
  prerequisite: string | null;
  abilityScoreIncrease?: {
    choices: number;
    options: AbilityName[];
    amount: number;
  };
  benefits: string[];
  description: string;
}

export interface CharacterCreationData {
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

  // Sprint 4: Custom equipment additions
  startingInventory?: EquippedItem[];

  // Sprint 5: Subclass, Fighting Style, and Feats
  subclassSlug?: string;
  selectedFightingStyle?: string;
  selectedFeats?: string[]; // Array of feat slugs

  // Language selection
  knownLanguages?: string[]; // Array of selected language names

  // Custom text for traits
  personality: string;
  ideals: string;
  bonds: string;
  flaws: string;
}

export interface Race {
  slug: string;
  name: string;
  source: string;
  ability_bonuses: Partial<Record<AbilityName, number>>;
  racial_traits: string[];
  description: string;
  typicalRoles: string[];
}

export interface RaceCategory {
  name: string;
  icon: string;
  description: string;
  races: Race[];
}

export interface StartingEquipmentPackage {
  level: number;
  description: string;
  startingGold: number; // in gp
  items: Array<{ slug: string; quantity: number; equipped?: boolean }>;
  recommendedItems: string[]; // Text descriptions for DM to add
}

export interface Class {
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
    type: SpellcastingType; // How spells are learned/prepared
    cantripsKnown: number; // Number of cantrips at level 1
    spellsKnownOrPrepared: number; // Number of spells known (sorcerer/bard) or can prepare (cleric/druid)
    spellSlots: number[]; // Spell slots by level [0, 2, 0, 0...] means 2 1st-level slots

    // Legacy support
    mode?: 'known' | 'prepared' | 'book'; // Deprecated - use type instead
  };

  // Sprint 3: Subclass support
  isSubclass?: boolean; // True if this is a subclass (archetype)
  parentClass?: string; // Parent class slug (e.g., 'wizard' for 'wizard-evocation')
  subclassLevel?: number; // Level at which this subclass is chosen (usually 3)
  subclassFeatures?: Record<number, string[]>; // Features gained at specific levels

  // Enhanced class data for rich selection experience
  category: 'Martial' | 'Arcane' | 'Divine' | 'Primal';
  detailedDescription: string;
  roleplayingTips: string[];
  keyFeatures: string[];
  icon: string;
  themeColor: string;
}

export interface ClassCategory {
  name: string;
  icon: string;
  description: string;
  classes: Class[];
}

export type ClassWithDefaults = Omit<Class, 'num_skill_choices' | 'equipment_choices'> & {
  num_skill_choices: number;
  equipment_choices: EquipmentChoice[];
};

export interface AlignmentData {
  index: string;
  name: string;
  abbreviation: string;
  short_desc: string;  // SRD creature examples
  long_desc: string;   // Our detailed character descriptions
  category: string;
  examples: string[];
}

// Spell Learning Rules
export interface SpellLearningRules {
  type: 'prepared' | 'known' | 'spellbook' | 'none';
  spellsKnown?: number[];          // Spells known by level (known casters)
  spellsPrepared?: number[];        // Spells prepared by level (prepared casters)
  spellbookCapacity?: number[];     // Spellbook capacity by level (wizards)
  domainSpells?: string[];          // Cleric domain spells
  circleSpells?: string[];          // Druid circle spells
  magicalSecrets?: number[];        // Bard magical secrets by level
  invocationsKnown?: number[];      // Warlock invocations by level
}
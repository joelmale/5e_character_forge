// SRD Data Loader and Transformer
// Transforms 5e SRD JSON format to our app's format
// Supports both 2014 and 2024 editions with 'year' field to distinguish

import srdSpells2014 from '../data/srd/2014/5e-SRD-Spells.json';
import srdRaces2014 from '../data/srd/2014/5e-SRD-Races.json';
import srdClasses2014 from '../data/srd/2014/5e-SRD-Classes.json';
import srdEquipment2014 from '../data/srd/2014/5e-SRD-Equipment.json';
import srdEquipment2024 from '../data/srd/2024/5e-SRD-Equipment.json';
// Sprint 5: Features, Subclasses, and Feats
import srdFeatures2014 from '../data/srd/2014/5e-SRD-Features.json';
import srdSubclasses2014 from '../data/srd/2014/5e-SRD-Subclasses.json';
import srdSubclasses2018 from '../data/srd/2018/5e-SRD-Subclasses.json';
import srdSubclasses2020 from '../data/srd/2020/5e-SRD-Subclasses.json';
import srdSubclasses2020egtw from '../data/srd/2020-egtw/5e-SRD-Subclasses.json';
import srdFeats2014 from '../data/srd/2014/5e-SRD-Feats.json';
import featsData from '../data/feats.json';
import { AbilityName, Race, Class, Equipment, Feature, Subclass, Feat } from '../types/dnd';

// --- SRD Type Definitions ---
interface SRDSpell {
  index: string;
  name: string;
  desc: string[];
  higher_level?: string[];
  range: string;
  components: string[];
  material?: string;
  ritual: boolean;
  duration: string;
  concentration: boolean;
  casting_time: string;
  level: number;
  school: { index: string; name: string };
  classes: Array<{ index: string; name: string }>;
  damage?: {
    damage_type?: { index: string; name: string };
  };
  dc?: {
    dc_type: { index: string; name: string };
  };
}

interface SRDRace {
  index: string;
  name: string;
  speed: number;
  ability_bonuses: Array<{ 
    ability_score: { index: string; name: string };
    bonus: number;
  }>;
  traits: Array<{ index: string; name: string }>;
  subraces?: Array<{ index: string; name: string }>;
}

interface SRDClass {
  index: string;
  name: string;
  hit_die: number;
  proficiency_choices: Array<{ 
    choose: number;
    type: string;
    from: { options: Array<{ item: { index: string; name: string } }> };
  }>;
  proficiencies: Array<{ index: string; name: string }>;
  saving_throws: Array<{ index: string; name: string }>;
  spellcasting?: {
    spellcasting_ability: { index: string; name: string };
  };
}

// Equipment SRD Type Definitions
interface SRDEquipment2014 {
  index: string;
  name: string;
  equipment_category: { index: string; name: string };
  cost: { quantity: number; unit: string };
  weight: number;
  url: string;

  // Weapon fields
  weapon_category?: string;
  weapon_range?: string;
  category_range?: string;
  damage?: {
    damage_dice: string;
    damage_type: { index: string; name: string };
  };
  range?: { normal: number; long?: number };
  properties?: Array<{ index: string; name: string }>;
  throw_range?: { normal: number; long: number };
  two_handed_damage?: {
    damage_dice: string;
    damage_type: { index: string; name: string };
  };

  // Armor fields
  armor_category?: string;
  armor_class?: { base: number; dex_bonus: boolean };
  str_minimum?: number;
  stealth_disadvantage?: boolean;

  // Gear fields
  desc?: string[];
  gear_category?: string;
  tool_category?: string;
  contents?: Array<{ item: { index: string; name: string }; quantity: number }>;
  capacity?: string;
}

interface SRDEquipment2024 {
  index: string;
  name: string;
  equipment_categories: Array<{ index: string; name: string }>;
  cost: { quantity: number; unit: string };
  weight: number;
  description?: string;
  url: string;

  // Weapon fields
  damage?: {
    damage_dice: string;
    damage_type: { index: string; name: string };
  };
  range?: { normal: number; long?: number };
  properties?: Array<{ index: string; name: string }>;
  two_handed_damage?: {
    damage_dice: string;
    damage_type: { index: string; name: string };
  };
  mastery?: { index: string; name: string };

  // Armor fields
  armor_category?: string;
  armor_class?: { base: number; dex_bonus: boolean; max_bonus?: number };
  str_minimum?: number;
  stealth_disadvantage?: boolean;
  don_time?: string;
  doff_time?: string;

  // Gear fields
  gear_category?: string;
  tool_category?: string;
  ability?: { index: string; name: string };
  craft?: Array<{ index: string; name: string }>;
  contents?: Array<{ item: { index: string; name: string }; quantity: number }>;
  storage?: { index: string; name: string };
  quantity?: number;
}

// --- App Type Definitions (matching App.tsx) ---
type SchoolName = 'Abjuration' | 'Conjuration' | 'Divination' | 'Enchantment' | 'Evocation' | 'Illusion' | 'Necromancy' | 'Transmutation';

export interface AppSpell {
  slug: string;
  name: string;
  level: number;
  school: SchoolName;
  castingTime: string;
  range: string;
  components: {
    verbal: boolean;
    somatic: boolean;
    material: boolean;
    materialDescription?: string;
  };
  duration: string;
  concentration: boolean;
  ritual: boolean;
  description: string;
  atHigherLevels?: string;
  damageType?: string;
  saveType?: AbilityName;
  classes: string[];
  year: number; // Edition year (2014 or 2024)
}

// --- Transformation Functions ---

function capitalizeSchool(school: string): SchoolName {
  return (school.charAt(0).toUpperCase() + school.slice(1)) as SchoolName;
}

function mapAbilityScore(srdAbility: string): AbilityName {
  const mapping: Record<string, AbilityName> = {
    'str': 'STR',
    'dex': 'DEX',
    'con': 'CON',
    'int': 'INT',
    'wis': 'WIS',
    'cha': 'CHA'
  };
  return mapping[srdAbility.toLowerCase()] || 'STR';
}

export function transformSpell(srdSpell: SRDSpell, year: number = 2014): AppSpell {
  return {
    slug: srdSpell.index,
    name: srdSpell.name,
    level: srdSpell.level,
    school: capitalizeSchool(srdSpell.school.name),
    castingTime: srdSpell.casting_time,
    range: srdSpell.range,
    components: {
      verbal: srdSpell.components.includes('V'),
      somatic: srdSpell.components.includes('S'),
      material: srdSpell.components.includes('M'),
      materialDescription: srdSpell.material,
    },
    duration: srdSpell.duration,
    concentration: srdSpell.concentration,
    ritual: srdSpell.ritual,
    description: srdSpell.desc.join('\n\n'),
    atHigherLevels: srdSpell.higher_level?.join('\n\n'),
    damageType: srdSpell.damage?.damage_type?.name,
    saveType: srdSpell.dc ? mapAbilityScore(srdSpell.dc.dc_type.index) : undefined,
    classes: srdSpell.classes.map(c => c.index),
    year,
  };
}

export function transformRace(srdRace: SRDRace, year: number = 2014): Race {
  const abilityBonuses: Partial<Record<AbilityName, number>> = {};
  srdRace.ability_bonuses.forEach(bonus => {
    const ability = mapAbilityScore(bonus.ability_score.index);
    abilityBonuses[ability] = bonus.bonus;
  });

  return {
    slug: srdRace.index,
    name: srdRace.name,
    source: `SRD ${year}`,
    ability_bonuses: abilityBonuses,
    racial_traits: srdRace.traits.map(t => t.name),
    description: `${srdRace.name} from the System Reference Document.`, 
    typicalRoles: [], // SRD doesn't include this, would need to be added manually
  };
}

export function transformClass(srdClass: SRDClass, year: number = 2014): Class {
  // Extract skill proficiencies from proficiency_choices (with safety checks)
  const skillProficiencies = (srdClass.proficiency_choices || [])
    .filter(choice => choice && choice.type === 'proficiencies')
    .flatMap(choice => 
      (choice.from?.options || [])
        .filter(opt => opt && opt.item && opt.item.name)
        .map(opt => opt.item.name)
    );

  const numSkillChoices = (srdClass.proficiency_choices || [])
    .filter(choice => choice && choice.type === 'proficiencies')
    .reduce((sum, choice) => sum + (choice.choose || 0), 0);

  // Transform spellcasting data if present
  let spellcasting: Class['spellcasting'] = undefined;
  if (srdClass.spellcasting) {
    const ability = mapAbilityScore(srdClass.spellcasting.spellcasting_ability.index) as 'INT' | 'WIS' | 'CHA';

    // Default spell slots for full casters (will need to be adjusted for half-casters)
    const defaultSpellSlots = [0, 2, 3, 4, 4, 4, 4, 4, 4, 4]; // Level 1-9 slots at char level 1

    // Define cantrips, spells known, and mode by class
    let cantripsKnown = 0;
    let spellsKnownOrPrepared = 0;
    let mode: 'known' | 'prepared' | 'book' = 'known';

    // Set defaults based on class (these are level 1 values)
    switch (srdClass.index) {
      case 'wizard':
        cantripsKnown = 3;
        spellsKnownOrPrepared = 6;
        mode = 'book';
        break;
      case 'sorcerer':
        cantripsKnown = 4;
        spellsKnownOrPrepared = 2;
        mode = 'known';
        break;
      case 'bard':
        cantripsKnown = 2;
        spellsKnownOrPrepared = 4;
        mode = 'known';
        break;
      case 'cleric':
      case 'druid':
        cantripsKnown = 3;
        spellsKnownOrPrepared = 3; // Can prepare WIS mod + level spells
        mode = 'prepared';
        break;
      case 'warlock':
        cantripsKnown = 2;
        spellsKnownOrPrepared = 2;
        mode = 'known';
        break;
      case 'paladin':
      case 'ranger':
        cantripsKnown = 0;
        spellsKnownOrPrepared = 0; // Half-casters, get spells at level 2
        mode = 'prepared';
        break;
    }

    spellcasting = {
      ability,
      mode,
      cantripsKnown,
      spellsKnownOrPrepared,
      spellSlots: defaultSpellSlots,
    };
  }

  return {
    slug: srdClass.index,
    name: srdClass.name,
    source: `SRD ${year}`,
    hit_die: srdClass.hit_die,
    primary_stat: 'Varies', // SRD doesn't specify, would need manual mapping
    save_throws: srdClass.saving_throws.map(st => st.name),
    skill_proficiencies: skillProficiencies,
    num_skill_choices: numSkillChoices,
    class_features: [], // Would need to be populated from features database
    description: `${srdClass.name} from the System Reference Document.`, 
    keyRole: 'Varies', // Would need manual mapping
    spellcasting, // Include spellcasting data
  };
}

export function transformEquipment2014(srdEquip: SRDEquipment2014): Equipment {
  return {
    slug: srdEquip.index,
    name: srdEquip.name,
    year: 2014,
    equipment_category: srdEquip.equipment_category.name,
    cost: {
      quantity: srdEquip.cost.quantity,
      unit: srdEquip.cost.unit as 'cp' | 'sp' | 'gp' | 'pp',
    },
    weight: srdEquip.weight,
    description: srdEquip.desc?.join('\n\n'),

    // Weapon fields
    weapon_category: srdEquip.weapon_category as 'Simple' | 'Martial' | undefined,
    weapon_range: srdEquip.weapon_range as 'Melee' | 'Ranged' | undefined,
    damage: srdEquip.damage ? {
      damage_dice: srdEquip.damage.damage_dice,
      damage_type: srdEquip.damage.damage_type.name,
    } : undefined,
    range: srdEquip.throw_range || srdEquip.range ? {
      normal: srdEquip.throw_range?.normal || srdEquip.range?.normal || 5,
      long: srdEquip.throw_range?.long || srdEquip.range?.long,
    } : undefined,
    properties: srdEquip.properties?.map(p => p.name),
    two_handed_damage: srdEquip.two_handed_damage ? {
      damage_dice: srdEquip.two_handed_damage.damage_dice,
      damage_type: srdEquip.two_handed_damage.damage_type.name,
    } : undefined,

    // Armor fields
    armor_category: srdEquip.armor_category as 'Light' | 'Medium' | 'Heavy' | 'Shield' | undefined,
    armor_class: srdEquip.armor_class,
    str_minimum: srdEquip.str_minimum,
    stealth_disadvantage: srdEquip.stealth_disadvantage,

    // Gear fields
    tool_category: srdEquip.tool_category,
    gear_category: srdEquip.gear_category,
    contents: srdEquip.contents
      ?.filter(c => c && c.item && c.item.index && c.item.name)
      .map(c => ({
        item_index: c.item.index,
        item_name: c.item.name,
        quantity: c.quantity,
      })),
    capacity: srdEquip.capacity,
  };
}

export function transformEquipment2024(srdEquip: SRDEquipment2024): Equipment {
  // For 2024, determine category from equipment_categories array
  const primaryCategory = srdEquip.equipment_categories[0]?.name || 'Adventuring Gear';

  // Determine weapon category from equipment_categories
  let weaponCategory: 'Simple' | 'Martial' | undefined;
  let weaponRange: 'Melee' | 'Ranged' | undefined;

  srdEquip.equipment_categories.forEach(cat => {
    if (cat.name.includes('Simple')) weaponCategory = 'Simple';
    if (cat.name.includes('Martial')) weaponCategory = 'Martial';
    if (cat.name.includes('Melee')) weaponRange = 'Melee';
    if (cat.name.includes('Ranged')) weaponRange = 'Ranged';
  });

  return {
    slug: srdEquip.index,
    name: srdEquip.name,
    year: 2024,
    equipment_category: primaryCategory,
    cost: {
      quantity: srdEquip.cost.quantity,
      unit: srdEquip.cost.unit as 'cp' | 'sp' | 'gp' | 'pp',
    },
    weight: srdEquip.weight,
    description: srdEquip.description,

    // Weapon fields
    weapon_category: weaponCategory,
    weapon_range: weaponRange,
    damage: srdEquip.damage ? {
      damage_dice: srdEquip.damage.damage_dice,
      damage_type: srdEquip.damage.damage_type.name,
    } : undefined,
    range: srdEquip.range,
    properties: srdEquip.properties?.map(p => p.name),
    two_handed_damage: srdEquip.two_handed_damage ? {
      damage_dice: srdEquip.two_handed_damage.damage_dice,
      damage_type: srdEquip.two_handed_damage.damage_type.name,
    } : undefined,
    mastery: srdEquip.mastery?.name,

    // Armor fields
    armor_category: srdEquip.armor_category as 'Light' | 'Medium' | 'Heavy' | 'Shield' | undefined,
    armor_class: srdEquip.armor_class,
    str_minimum: srdEquip.str_minimum,
    stealth_disadvantage: srdEquip.stealth_disadvantage,
    don_time: srdEquip.don_time,
    doff_time: srdEquip.doff_time,

    // Gear fields
    tool_category: srdEquip.tool_category,
    gear_category: srdEquip.gear_category,
    contents: srdEquip.contents
      ?.filter(c => c && c.item && c.item.index && c.item.name)
      .map(c => ({
        item_index: c.item.index,
        item_name: c.item.name,
        quantity: c.quantity,
      })),
  };
}

// --- Data Loading Functions ---

export function loadSpells(): AppSpell[] {
  const spells2014 = (srdSpells2014 as SRDSpell[]).map(spell => transformSpell(spell, 2014));
  return spells2014;
}

export const SPELL_DATABASE = loadSpells();

export const getSpellsForClass = (classSlug: string): AppSpell[] => {
  // Extract base class name from slug (e.g., 'wizard-evocation' -> 'wizard')
  const baseClass = classSlug.split('-')[0];
  return SPELL_DATABASE.filter(spell => spell.classes.includes(baseClass));
};

export const getCantripsByClass = (classSlug: string): AppSpell[] => {
  return getSpellsForClass(classSlug).filter(spell => spell.level === 0);
};

export const getLeveledSpellsByClass = (classSlug: string, level: number = 1): AppSpell[] => {
  return getSpellsForClass(classSlug).filter(spell => spell.level === level);
};

export function loadRaces(): Race[] {
  const races2014 = (srdRaces2014 as SRDRace[]).map(race => transformRace(race, 2014));
  return races2014;
}

export function loadClasses(): Class[] {
  const classes2014 = (srdClasses2014 as SRDClass[]).map(cls => transformClass(cls, 2014));
  return classes2014;
}

export function loadEquipment(): Equipment[] {
  const equipment2014 = (srdEquipment2014 as SRDEquipment2014[]).map(eq => transformEquipment2014(eq));
  const equipment2024 = (srdEquipment2024 as SRDEquipment2024[]).map(eq => transformEquipment2024(eq));
  return [...equipment2014, ...equipment2024];
}

// Feature interfaces
interface SRDFeature {
  index: string;
  class: { index: string; name: string };
  subclass?: { index: string; name: string };
  name: string;
  level: number;
  desc: string[];
  feature_specific?: any;
}

// Subclass interfaces
interface SRDSubclass {
  index: string;
  class: { index: string; name: string };
  name: string;
  subclass_flavor: string;
  desc: string[];
}

// Transform functions
export function transformFeature(srdFeature: SRDFeature): Feature {
  return {
    slug: srdFeature.index,
    name: srdFeature.name,
    class: srdFeature.class.index,
    subclass: srdFeature.subclass?.index,
    level: srdFeature.level,
    desc: srdFeature.desc,
    featureSpecific: srdFeature.feature_specific,
  };
}

export function transformSubclass(srdSubclass: SRDSubclass): Subclass {
  return {
    slug: srdSubclass.index,
    name: srdSubclass.name,
    class: srdSubclass.class.index,
    desc: srdSubclass.desc,
    subclassFlavor: srdSubclass.subclass_flavor,
  };
}

// Load all features from SRD
export function loadFeatures(): Feature[] {
  return (srdFeatures2014 as SRDFeature[]).map(f => transformFeature(f));
}

// Load all subclasses from SRD
export function loadSubclasses(): Subclass[] {
  const subclasses2014 = (srdSubclasses2014 as SRDSubclass[]).map(sc => transformSubclass(sc));
  const subclasses2018 = (srdSubclasses2018 as SRDSubclass[]).map(sc => transformSubclass(sc));
  const subclasses2020 = (srdSubclasses2020 as SRDSubclass[]).map(sc => transformSubclass(sc));
  const subclasses2020egtw = (srdSubclasses2020egtw as SRDSubclass[]).map(sc => transformSubclass(sc));
  return [...subclasses2014, ...subclasses2018, ...subclasses2020, ...subclasses2020egtw];
}

// Load all feats (merge SRD + custom feats)
export function loadFeats(): Feat[] {
  // Load custom feats from our JSON
  const customFeats = featsData as Feat[];

  // Load SRD Grappler feat
  const srdGrappler = srdFeats2014 as any[];
  const grapplerFeat: Feat = {
    slug: 'grappler',
    name: 'Grappler',
    source: 'SRD',
    year: 2014,
    prerequisite: 'Strength 13 or higher',
    benefits: [
      'Advantage on attack rolls against creatures you\'re grappling',
      'Can restrain a creature grappled by you'
    ],
    description: srdGrappler[0]?.desc?.join('\n\n') || 'You\'ve developed the skills necessary to hold your own in close-quarters grappling.'
  };

  // Check if Grappler already exists in custom feats
  const hasGrappler = customFeats.some(f => f.slug === 'grappler');

  return hasGrappler ? customFeats : [...customFeats, grapplerFeat];
}

// Helper functions to filter features
export function getFeaturesByClass(classSlug: string, level: number): Feature[] {
  return FEATURE_DATABASE.filter(f =>
    f.class === classSlug &&
    f.level <= level &&
    !f.subclass  // Only base class features
  );
}

export function getFeaturesBySubclass(classSlug: string, subclassSlug: string, level: number): Feature[] {
  return FEATURE_DATABASE.filter(f =>
    f.class === classSlug &&
    f.subclass === subclassSlug &&
    f.level <= level
  );
}

export function getSubclassesByClass(classSlug: string): Subclass[] {
  return SUBCLASS_DATABASE.filter(sc => sc.class === classSlug);
}

// Export databases
export const FEATURE_DATABASE = loadFeatures();
export const SUBCLASS_DATABASE = loadSubclasses();
export const FEAT_DATABASE = loadFeats();

// Export raw data for reference
export { srdSpells2014, srdRaces2014, srdClasses2014, srdEquipment2014, srdEquipment2024, srdFeatures2014, srdSubclasses2014 };

import { SkillName, SpellSlotsByClass, CantripsKnownByClass } from '../types/dnd';
import { SPELL_SLOTS_BY_CLASS } from '../data/spellSlots';
import { CANTRIPS_KNOWN_BY_CLASS } from '../data/cantrips';

// --- Static Data and Helper Functions from App.tsx ---

export const PROFICIENCY_BONUSES = [2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6];

export function getModifier(abilityScore: number): number {
  return Math.floor((abilityScore - 10) / 2);
}

export const SKILL_TO_ABILITY: Record<SkillName, AbilityName> = {
  'Acrobatics': 'DEX',
  'Animal Handling': 'WIS',
  'Arcana': 'INT',
  'Athletics': 'STR',
  'Deception': 'CHA',
  'History': 'INT',
  'Insight': 'WIS',
  'Intimidation': 'CHA',
  'Investigation': 'INT',
  'Medicine': 'WIS',
  'Nature': 'INT',
  'Perception': 'WIS',
  'Performance': 'CHA',
  'Persuasion': 'CHA',
  'Religion': 'INT',
  'Sleight of Hand': 'DEX',
  'Stealth': 'DEX',
  'Survival': 'WIS',
};

export const ALL_SKILLS: SkillName[] = Object.keys(SKILL_TO_ABILITY) as SkillName[];

export const ALIGNMENTS_DATA: Alignment[] = [
  { name: 'Lawful Good', description: 'Creatures can make their own choices, but they must follow the rules of society and help others.' },
  { name: 'Neutral Good', description: 'Creatures can make their own choices, but they must follow the rules of society and help others.' },
  { name: 'Chaotic Good', description: 'Creatures can make their own choices, but they must follow the rules of society and help others.' },
  { name: 'Lawful Neutral', description: 'Creatures can make their own choices, but they must follow the rules of society and help others.' },
  { name: 'True Neutral', description: 'Creatures can make their own choices, but they must follow the rules of society and help others.' },
  { name: 'Chaotic Neutral', description: 'Creatures can make their own choices, but they must follow the rules of society and help others.' },
  { name: 'Lawful Evil', description: 'Creatures can make their own choices, but they must follow the rules of society and help others.' },
  { name: 'Neutral Evil', description: 'Creatures can make their own choices, but they must follow the rules of society and help others.' },
  { name: 'Chaotic Evil', description: 'Creatures can make their own choices, but they must follow the rules of society and help others.' },
];

export const ALIGNMENTS = ALIGNMENTS_DATA.map(a => a.name);

export const ALIGNMENT_INFO: Record<string, string> = ALIGNMENTS_DATA.reduce((acc, alignment) => {
  acc[alignment.name] = alignment.description;
  return acc;
}, {} as Record<string, string>);

export const BACKGROUNDS: Background[] = [
  { name: 'Acolyte', description: 'You have spent your life in the service of a temple or other religious institution.' },
  { name: 'Charlatan', description: 'You have always been good at getting what you want by bending the truth and manipulating others.' },
  { name: 'Criminal', description: 'You are an experienced criminal with a history of breaking the law.' },
  { name: 'Entertainer', description: 'You thrive on the attention of others, and you are skilled at captivating an audience.' },
  { name: 'Folk Hero', description: 'You are a champion of the common people, who look to you for guidance and protection.' },
  { name: 'Guild Artisan', description: 'You are a member of an artisan\'s guild, skilled in a particular craft.' },
  { name: 'Hermit', description: 'You have lived a life of seclusion, either in a remote wilderness or in a monastery.' },
  { name: 'Noble', description: 'You are a member of the upper class, with all the privileges and responsibilities that entails.' },
  { name: 'Outlander', description: 'You grew up in the wilds, far from civilization and its comforts.' },
  { name: 'Sage', description: 'You are a scholar, well-versed in ancient lore and forgotten secrets.' },
  { name: 'Sailor', description: 'You have spent your life on the open sea, and you are at home on any ship.' },
  { name: 'Soldier', description: 'You are a trained warrior, experienced in combat and military tactics.' },
  { name: 'Urchin', description: 'You grew up on the streets, fending for yourself in a harsh and unforgiving world.' },
];

export const RACE_CATEGORIES: RaceCategory[] = [
  { name: 'Dwarf', description: 'Dwarves are a stoic and hardy folk, known for their craftsmanship and their love of gold.' },
  { name: 'Elf', description: 'Elves are a graceful and long-lived people, known for their connection to nature and their magical abilities.' },
  { name: 'Halfling', description: 'Halflings are a small and nimble folk, known for their good cheer and their love of home.' },
  { name: 'Human', description: 'Humans are a diverse and adaptable people, found in every corner of the world.' },
  { name: 'Dragonborn', description: 'Dragonborn are a proud and honorable race, born of dragons and infused with their power.' },
  { name: 'Gnome', description: 'Gnomes are a curious and inventive folk, known for their love of tinkering and their mischievous sense of humor.' },
  { name: 'Half-Elf', description: 'Half-elves are a blend of human and elf, combining the best qualities of both races.' },
  { name: 'Half-Orc', description: 'Half-orcs are a fierce and powerful people, born of humans and orcs.' },
  { name: 'Tiefling', description: 'Tieflings are a mysterious and often feared race, descended from devils.' },
];

export const CLASS_CATEGORIES: ClassCategory[] = [
  { name: 'Barbarian', description: 'A fierce warrior of primitive background who can enter a battle rage.' },
  { name: 'Bard', description: 'An inspiring magician whose power echoes the music of creation.' },
  { name: 'Cleric', description: 'A priestly champion who wields divine magic in service of a higher power.' },
  { name: 'Druid', description: 'A priest of the Old Faith, wielding the powers of nature—moonlight and plant growth, fire and lightning—and adopting animal forms.' },
  { name: 'Fighter', description: 'A master of martial combat, skilled with a variety of weapons and armor.' },
  { name: 'Monk', description: 'A master of martial arts, harnessing the power of the body in pursuit of physical and spiritual perfection.' },
  { name: 'Paladin', description: 'A holy warrior bound to a sacred oath.' },
  { name: 'Ranger', description: 'A warrior who uses martial prowess and nature magic to combat threats on the fringes of civilization.' },
  { name: 'Rogue', description: 'A scoundrel who uses stealth and trickery to overcome obstacles and enemies.' },
  { name: 'Sorcerer', description: 'A spellcaster who draws on inherent magic from a gift or bloodline.' },
  { name: 'Warlock', description: 'A wielder of magic that is derived from a bargain with an otherworldly entity.' },
  { name: 'Wizard', description: 'A scholarly magic-user adept in the arcane arts.' },
];

export const EQUIPMENT_PACKAGES: EquipmentPackage[] = [
  {
    name: 'Burglar\'s Pack',
    items: [
      { name: 'Backpack', quantity: 1 },
      { name: 'Ball bearings (1,000)', quantity: 1 },
      { name: 'String (10 feet)', quantity: 1 },
      { name: 'Bell', quantity: 1 },
      { name: 'Candles', quantity: 5 },
      { name: 'Crowbar', quantity: 1 },
      { name: 'Hammer', quantity: 1 },
      { name: 'Pitons', quantity: 10 },
      { name: 'Lantern', quantity: 1 },
      { name: 'Oil flasks', quantity: 2 },
      { name: 'Rations (1 day)', quantity: 5 },
      { name: 'Tinderbox', quantity: 1 },
      { name: 'Waterskin', quantity: 1 },
      { name: 'Rope (50 feet)', quantity: 1 },
    ],
  },
  {
    name: 'Diplomat\'s Pack',
    items: [
      { name: 'Chest', quantity: 1 },
      { name: 'Map case (scroll case)', quantity: 2 },
      { name: 'Fine clothes', quantity: 1 },
      { name: 'Ink', quantity: 1 },
      { name: 'Ink pen', quantity: 1 },
      { name: 'Lamp', quantity: 1 },
      { name: 'Oil flasks', quantity: 2 },
      { name: 'Paper (5 sheets)', quantity: 5 },
      { name: 'Perfume', quantity: 1 },
      { name: 'Sealing wax', quantity: 1 },
      { name: 'Soap', quantity: 1 },
    ],
  },
  {
    name: 'Dungeoneer\'s Pack',
    items: [
      { name: 'Backpack', quantity: 1 },
      { name: 'Crowbar', quantity: 1 },
      { name: 'Hammer', quantity: 1 },
      { name: 'Pitons', quantity: 10 },
      { name: 'Torches', quantity: 10 },
      { name: 'Tinderbox', quantity: 1 },
      { name: 'Rations (1 day)', quantity: 10 },
      { name: 'Waterskin', quantity: 1 },
      { name: 'Rope (50 feet)', quantity: 1 },
    ],
  },
  {
    name: 'Explorer\'s Pack',
    items: [
      { name: 'Backpack', quantity: 1 },
      { name: 'Tent (two-person)', quantity: 1 },
      { name: 'Mess kit', quantity: 1 },
      { name: 'Tinderbox', quantity: 1 },
      { name: 'Torches', quantity: 10 },
      { name: 'Rations (1 day)', quantity: 10 },
      { name: 'Waterskin', quantity: 1 },
      { name: 'Rope (50 feet)', quantity: 1 },
    ],
  },
  {
    name: 'Priest\'s Pack',
    items: [
      { name: 'Backpack', quantity: 1 },
      { name: 'Blanket', quantity: 1 },
      { name: 'Candles', quantity: 10 },
      { name: 'Tinderbox', quantity: 1 },
      { name: 'Alms box', quantity: 1 },
      { name: 'Incense (2 blocks)', quantity: 2 },
      { name: 'Censer', quantity: 1 },
      { name: 'Vestments', quantity: 1 },
      { name: 'Rations (1 day)', quantity: 2 },
      { name: 'Waterskin', quantity: 1 },
    ],
  },
  {
    name: 'Scholar\'s Pack',
    items: [
      { name: 'Backpack', quantity: 1 },
      { name: 'Book of lore', quantity: 1 },
      { name: 'Ink', quantity: 1 },
      { name: 'Ink pen', quantity: 1 },
      { name: 'Parchment (10 sheets)', quantity: 10 },
      { name: 'Sand', quantity: 1 },
      { name: 'Small knife', quantity: 1 },
    ],
  },
];

export const FIGHTING_STYLES: FightingStyle[] = [
  {
    name: 'Archery',
    description: 'You gain a +2 bonus to attack rolls you make with ranged weapons.',
    prerequisite: 'Fighter, Ranger',
  },
  {
    name: 'Defense',
    description: 'While you are wearing armor, you gain a +1 bonus to AC.',
    prerequisite: 'Fighter, Paladin, Ranger',
  },
  {
    name: 'Dueling',
    description: 'When you are wielding a melee weapon in one hand and no other weapons, you gain a +2 bonus to damage rolls with that weapon.',
    prerequisite: 'Fighter, Paladin, Ranger',
  },
  {
    name: 'Great Weapon Fighting',
    description: 'When you roll a 1 or 2 on a damage die for an attack you make with a melee weapon that you are wielding with two hands, you can reroll the die and must use the new roll, even if the new roll is a 1 or a 2. The weapon must have the two-handed or versatile property to gain this benefit.',
    prerequisite: 'Fighter, Paladin',
  },
  {
    name: 'Protection',
    description: 'When a creature you can see attacks a target other than you that is within 5 feet of you, you can use your reaction to impose disadvantage on the attack roll. You must be wielding a shield.',
    prerequisite: 'Fighter, Paladin',
  },
  {
    name: 'Two-Weapon Fighting',
    description: 'When you engage in two-weapon fighting, you can add your ability modifier to the damage of the second attack.',
    prerequisite: 'Fighter, Ranger',
  },
];

export { SPELL_SLOTS_BY_CLASS, CANTRIPS_KNOWN_BY_CLASS };


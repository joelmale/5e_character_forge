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
import alignmentsData from '../data/alignments.json';
import { AbilityName, Race, Class, Equipment, Feature, Subclass, Feat, RaceCategory, ClassCategory, EquipmentPackage, EquipmentChoice, EquipmentItem, EquippedItem, SpellcastingType, SkillName } from '../types/dnd';

// Local type definitions for dataService
interface Alignment {
  index: string;
  name: string;
  abbreviation: string;
  category: string;
  examples: string[];
  short_desc: string;
  long_desc: string;
}

interface Background {
  name: string;
  description: string;
  skill_proficiencies: string[];
  languages?: string[];
  equipment: string[];
  feature: string;
  feature_description: string;
  suggested_characteristics?: string;
  personality_traits?: string[];
  ideals?: string[];
  bonds?: string[];
  flaws?: string[];
  roleplaying_suggestions?: string;
}







interface FightingStyle {
  name: string;
  description: string;
  prerequisite: string;
}

// --- App Type Definitions ---
export interface AppSubclass {
  slug: string;
  name: string;
  class: string;
  subclassFlavor: string;
  desc?: string[];
}

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
  starting_equipment?: Array<{
    equipment: { index: string; name: string; url: string };
    quantity: number;
  }>;
  starting_equipment_options?: Array<{
    desc: string;
    choose: number;
    type: string;
    from: {
      option_set_type: string;
      options: Array<{
        option_type?: string;
        equipment?: { index: string; name: string; url: string };
        equipment_category?: { index: string; name: string };
      }>;
    };
  }>;
  spellcasting?: {
    level?: number;
    spellcasting_ability: { index: string; name: string };
    info?: Array<{
      name: string;
      desc: string[];
    }>;
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

    // Define cantrips, spells known, and type by class
    let cantripsKnown = 0;
    let spellsKnownOrPrepared = 0;
    let type: SpellcastingType = 'known';

    // Set defaults based on class (these are level 1 values)
    switch (srdClass.index) {
      case 'wizard':
        cantripsKnown = 3;
        spellsKnownOrPrepared = 6;
        type = 'wizard';
        break;
      case 'sorcerer':
        cantripsKnown = 4;
        spellsKnownOrPrepared = 2;
        type = 'known';
        break;
      case 'bard':
        cantripsKnown = 2;
        spellsKnownOrPrepared = 4;
        type = 'known';
        break;
      case 'warlock':
        cantripsKnown = 2;
        spellsKnownOrPrepared = 2;
        type = 'known';
        break;
      case 'cleric':
        cantripsKnown = 3;
        spellsKnownOrPrepared = 2;
        type = 'prepared';
        break;
      case 'druid':
        cantripsKnown = 2;
        spellsKnownOrPrepared = 2;
        type = 'prepared';
        break;
      case 'paladin':
        cantripsKnown = 0;
        spellsKnownOrPrepared = 0;
        type = 'prepared';
        break;
      case 'ranger':
        cantripsKnown = 0;
        spellsKnownOrPrepared = 0;
        type = 'known';
        break;
      case 'artificer':
        cantripsKnown = 0;
        spellsKnownOrPrepared = 0;
        type = 'prepared';
        break;
    }

    spellcasting = {
      ability,
      type,
      cantripsKnown,
      spellsKnownOrPrepared,
      spellSlots: defaultSpellSlots,
    };
  }

  // Process starting equipment options
  const equipment_choices: EquipmentChoice[] = [];
  if (srdClass.starting_equipment_options) {
    srdClass.starting_equipment_options.forEach((option, index) => {
      const choiceId = `${srdClass.index}-choice-${index}`;

      // Convert SRD options to EquipmentItem format
      let options: EquipmentItem[][] = [];
      if (option.from.options) {
        options = option.from.options.map(opt => {
          if (opt.equipment) {
            // Simple equipment reference
            return [{
              name: opt.equipment.name,
              type: 'gear' as const, // Default type, could be enhanced
              quantity: 1
            }];
          } else if (opt.equipment_category) {
            // Equipment category - for now, return a placeholder
            // This would need expansion to actual items in the category
            return [{
              name: `${opt.equipment_category.name} (choose one)`,
              type: 'gear' as const,
              quantity: 1
            }];
          }
          return [];
        }).filter(arr => arr.length > 0);
      } else if ((option.from as any).equipment_category) {
        options = [[{
          name: `Any ${(option.from as any).equipment_category.name}`,
          type: 'gear' as const,
          quantity: 1
        }]];
      }

      if (options.length > 0) {
        equipment_choices.push({
          choiceId,
          description: option.desc,
          options,
          selected: null
        });
      }
    });
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

    // Enhanced fields with defaults (will be overridden by ENHANCED_CLASS_DATA)
    category: 'Martial' as const,
    detailedDescription: `${srdClass.name} is a versatile class with unique abilities.`,
    roleplayingTips: ['Play to your character\'s strengths and background'],
    keyFeatures: [],
    icon: '⚔️',
    themeColor: '#666666'
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
  // Return comprehensive race database instead of just SRD
  return COMPREHENSIVE_RACES;
}

// Legacy function for backward compatibility - returns SRD races only
export function loadSRDRaces(): Race[] {
  const races2014 = (srdRaces2014 as SRDRace[]).map(race => transformRace(race, 2014));
  return races2014;
}

// Get all races from categories (flattened)
export function getAllRaces(): Race[] {
  return RACE_CATEGORIES.flatMap(category => category.races);
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
  feature_specific?: {
    [key: string]: {
      choose?: number;
      type?: string;
      from?: {
        option_set_type?: string;
        options?: Array<{
          option_type?: string;
          item?: { index: string; name: string; url: string };
          ability_score?: { index: string; name: string; url: string };
        }>;
      };
    };
  };
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
  const srdGrappler = srdFeats2014 as Array<{ index: string; name: string; prerequisites?: unknown[]; desc: string[]; url: string }>;
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


import { SPELL_SLOTS_BY_CLASS } from '../data/spellSlots';
import { CANTRIPS_KNOWN_BY_CLASS } from '../data/cantrips';

// --- Static Data and Helper Functions from App.tsx ---

export const PROFICIENCY_BONUSES = [2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6];

export function getModifier(abilityScore: number): number {
  return Math.floor((abilityScore - 10) / 2);
}

export const SKILL_TO_ABILITY: Record<SkillName, AbilityName> = {
  'Acrobatics': 'DEX',
  'AnimalHandling': 'WIS',
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
  'SleightOfHand': 'DEX',
  'Stealth': 'DEX',
  'Survival': 'WIS',
};

export const ALL_SKILLS: SkillName[] = Object.keys(SKILL_TO_ABILITY) as SkillName[];

export function loadAlignments(): Alignment[] {
  return alignmentsData as Alignment[];
}

export const ALIGNMENTS_DATA: Alignment[] = loadAlignments();

export const ALIGNMENTS = ALIGNMENTS_DATA.map(a => a.name);

export const ALIGNMENT_INFO: Record<string, string> = ALIGNMENTS_DATA.reduce((acc, alignment) => {
  acc[alignment.name] = alignment.short_desc;
  return acc;
}, {} as Record<string, string>);

export const BACKGROUNDS: Background[] = [
  {
    name: 'Acolyte',
    description: 'You have spent your life in the service of a temple or other religious institution.',
    skill_proficiencies: ['Insight', 'Religion'],
    languages: ['Two of your choice'],
    equipment: ['Holy symbol', 'Prayer book', '5 sticks of incense', 'Vestments', 'Common clothes', '15 gp'],
    feature: 'Shelter of the Faithful',
    feature_description: 'As an acolyte, you command the respect of those who share your faith, and you can perform the religious ceremonies of your deity. You and your adventuring companions can expect to receive free healing and care at a temple, shrine, or other established presence of your faith, though you must provide any material components needed for spells. Those who share your religion will support you (but only you) at a modest lifestyle.',
    personality_traits: [
      'I idolize a particular hero of my faith, and constantly refer to their deeds and example.',
      'I can find common ground between the fiercest enemies, empathizing with them and always working toward peace.',
      'I see omens in every event and action. The gods try to speak to us, we just need to listen.',
      'Nothing can shake my optimistic attitude.',
      'I quote (or misquote) sacred texts and proverbs in almost every situation.',
      'I am suspicious of strangers and expect the worst of them.',
      'I am tolerant (or intolerant) of other faiths and respect (or condemn) the worship of other gods.',
      'I have been given a holy symbol that is a sign of my position within the faith.'
    ],
    ideals: [
      'Change: We must help bring change about the only way the gods see fit. (Chaotic)',
      'Tradition: The ancient ways of our faith must be preserved. (Lawful)',
      'Charity: I always try to help those in need, no matter what the personal cost. (Good)',
      'Power: I hope to one day rise to the top of my faith\'s religious hierarchy. (Lawful)',
      'Faith: I trust that my deity will guide my actions. I have faith that if I work hard, things will go well. (Lawful)',
      'Aspiration: I seek to prove myself worthy of my god\'s favor by matching my actions against their teachings. (Any)'
    ],
    bonds: [
      'I owe my life to the priest who took me in when my parents died.',
      'Everything I do is for the common people.',
      'I will someday get revenge on the corrupt temple hierarchy who branded me a heretic.',
      'I owe a debt I can never repay to the people who helped me when I was starving on the streets.',
      'I protect an ancient text that my enemies would do anything to seize.',
      'I work to preserve a temple that is in danger of being destroyed.'
    ],
    flaws: [
      'I am suspicious of strangers and expect the worst of them.',
      'I am suspicious of strangers and expect the worst of them.',
      'Once I pick an ideal, I become rigid in my pursuit of it.',
      'I am suspicious of strangers and expect the worst of them.',
      'I am suspicious of strangers and expect the worst of them.',
      'I am suspicious of strangers and expect the worst of them.'
    ],
    roleplaying_suggestions: 'Temple acolytes are often devout followers who have dedicated their lives to service. They might be pious and reverent, or they could be cynical about their faith after years of service. Consider how your character\'s faith influences their worldview and interactions with others.'
  },
  {
    name: 'Charlatan',
    description: 'You have always been good at getting what you want by bending the truth and manipulating others.',
    skill_proficiencies: ['Deception', 'Sleight of Hand'],
    languages: [],
    equipment: ['Fine clothes', 'Disguise kit', 'Tools of the con of your choice', '15 gp'],
    feature: 'False Identity',
    feature_description: 'You have created a second identity that includes documentation, established acquaintances, and disguises that allow you to assume that persona. Additionally, you can forge official documents including official papers and personal letters.',
    personality_traits: [
      'I fall in and out of love easily, and am always pursuing someone.',
      'I have a joke for every occasion, especially occasions where humor is inappropriate.',
      'Flattery is my preferred trick for getting what I want.',
      'I am a born gambler who cannot resist taking a risk for a potential payoff.',
      'I lie about almost everything, even when there\'s no good reason to.',
      'Sarcasm and insults are my weapons of choice.',
      'I keep multiple holy symbols on me and invoke whatever deity might come in useful at any given moment.',
      'I pocket anything I see that might have some value.'
    ],
    ideals: [
      'Independence: I am a free spirit - no one tells me what to do. (Chaotic)',
      'Fairness: I never target people who can\'t afford to lose a few coins. (Lawful)',
      'Charity: I distribute the money I acquire to the people who really need it. (Good)',
      'Creativity: I never run the same con twice. (Chaotic)',
      'Friendship: Material goods come and go. Bonds of friendship last forever. (Good)',
      'Aspiration: I\'m determined to make something of myself. (Any)'
    ],
    bonds: [
      'I fleeced the wrong person and must work to ensure that this individual never crosses paths with me or those I care about.',
      'I owe everything to my mentor - a horrible person who\'s probably rotting in jail somewhere.',
      'Somewhere out there, I have a child who doesn\'t know me. I\'m making the world better for him or her.',
      'I owe my guild a great debt for forging my identity and have to work off that debt.',
      'My town or city is my home, and I\'ll fight to defend it.',
      'I was cheated out of my fair share of the profits, and I want to get my due.'
    ],
    flaws: [
      'I can\'t resist a pretty face.',
      'I\'m always in debt. I spend my ill-gotten gains on decadent luxuries faster than I bring them in.',
      'I\'m convinced that no one could ever fool me the way I fool others.',
      'I\'m too greedy for my own good. I can\'t resist taking a risk if there\'s money involved.',
      'I can\'t resist swindling people who are more powerful than me.',
      'I hate to admit it and will hate myself for it, but I\'ll run and preserve my own hide if the going gets tough.'
    ],
    roleplaying_suggestions: 'Charlatans are smooth talkers and confidence artists who excel at deception and manipulation. They might be charming rogues who see the world as a game, or hardened survivors who learned early that trust is a weakness. Consider how your character justifies their cons - is it just for survival, or do they enjoy the thrill?'
  },
  {
    name: 'Criminal',
    description: 'You are an experienced criminal with a history of breaking the law.',
    skill_proficiencies: ['Deception', 'Stealth'],
    languages: [],
    equipment: ['Crowbar', 'Dark common clothes with hood', '15 gp'],
    feature: 'Criminal Contact',
    feature_description: 'You have a reliable and trustworthy contact who acts as your liaison to a network of criminals. You know how to get messages to and from your contact, even over great distances; specifically, you know the local messengers, corrupt caravan masters, and seedy sailors who can deliver messages for you.',
    personality_traits: [
      'I always have a plan for what to do when things go wrong.',
      'I am always calm, no matter what the situation. I never raise my voice or let my emotions control me.',
      'The first thing I do in a new place is note the locations of everything valuable - or where such things could be hidden.',
      'I would rather make a new friend than a new enemy.',
      'I am incredibly slow to trust. Those who seem the fairest often have the most to hide.',
      'I don\'t pay attention to the risks in a situation. Never tell me the odds.',
      'The best way to get me to do something is to tell me I can\'t do it.',
      'I blow up at the slightest insult.'
    ],
    ideals: [
      'Honor: I don\'t steal from others in the trade. (Lawful)',
      'Freedom: Chains are meant to be broken, as are those who would forge them. (Chaotic)',
      'Charity: I steal from the wealthy so that I can help people in need. (Good)',
      'Greed: I will do whatever it takes to become wealthy. (Evil)',
      'People: I\'m loyal to my friends, not to any ideals, and everyone else can take a trip down the Styx for all I care. (Neutral)',
      'Redemption: There\'s a spark of good in everyone. (Good)'
    ],
    bonds: [
      'I\'m trying to pay off an old debt I owe to a generous benefactor.',
      'My ill-gotten gains go to support my family.',
      'Something important was taken from me, and I aim to steal it back.',
      'I will become the greatest thief that ever lived.',
      'I\'m guilty of a terrible crime. I hope I can redeem myself for it.',
      'Someone I loved died because of a mistake I made. That will never happen again.'
    ],
    flaws: [
      'When I see something valuable, I can\'t think about anything but how to steal it.',
      'When faced with a choice between money and my friends, I usually choose the money.',
      'If there\'s a plan, I\'ll forget it. If I don\'t forget it, I\'ll ignore it.',
      'I have a "tell" that reveals when I\'m lying.',
      'I turn tail and run when things look bad.',
      'An innocent person is in prison for a crime that I committed. I\'m okay with that.'
    ],
    roleplaying_suggestions: 'Criminals come from all walks of life and have committed various crimes. They might be hardened thugs, master thieves, or desperate survivors. Consider what drove your character to crime - poverty, revenge, thrill-seeking, or necessity? How do they feel about their criminal past?'
  },
  {
    name: 'Entertainer',
    description: 'You thrive on the attention of others, and you are skilled at captivating an audience.',
    skill_proficiencies: ['Acrobatics', 'Performance'],
    languages: [],
    equipment: ['Musical instrument of your choice', 'Favor of an admirer', 'Costume', '15 gp'],
    feature: 'By Popular Demand',
    feature_description: 'You can always find a place to perform, usually in an inn or tavern but possibly with a circus, at a theater, or even in a noble\'s court. At such a place, you receive free lodging and food of a modest or comfortable standard (depending on the quality of the establishment), as long as you perform each night. In addition, your performance makes you something of a local figure. When strangers recognize you in a town where you have performed, they typically take a liking to you.',
    personality_traits: [
      'I know a story relevant to almost every situation.',
      'Whenever I come to a new place, I collect local rumors and spread gossip.',
      'I\'m a hopeless romantic, always searching for that "special someone."',
      'Nobody stays angry at me or around me for long, since I can defuse any amount of tension.',
      'I love a good insult, even one directed at me.',
      'I get bitter if I\'m not the center of attention.',
      'I\'ll settle for nothing less than perfection.',
      'I change my mood or my mind as quickly as I change key in a song.'
    ],
    ideals: [
      'Beauty: When I perform, I make the world better than it was. (Good)',
      'Tradition: The stories, legends, and songs of the past must never be forgotten, for they teach us who we are. (Lawful)',
      'Creativity: The world is in need of new ideas and bold action. (Chaotic)',
      'Greed: I\'m only in it for the money and fame. (Evil)',
      'People: I like seeing the smiles on people\'s faces when I perform. That\'s all that matters. (Neutral)',
      'Honesty: Art should reflect the soul; it should come from within and reveal who we really are. (Any)'
    ],
    bonds: [
      'My instrument is my most treasured possession, and it reminds me of someone I love.',
      'Someone stole my precious instrument, and someday I\'ll get it back.',
      'I want to be famous, whatever it takes.',
      'I idolize a hero of the old tales and measure my deeds against that person\'s.',
      'I will do anything to prove myself superior to my hated rival.',
      'I would do anything for the other members of my old troupe.'
    ],
    flaws: [
      'I\'ll do anything to win fame and renown.',
      'I\'m a sucker for a pretty face.',
      'A scandal prevents me from ever going home again. That kind of trouble seems to follow me around.',
      'I once satirized a noble who still wants my head. It was a mistake that I will likely repeat.',
      'I have trouble keeping my true feelings hidden. My sharp tongue lands me in trouble.',
      'Despite my best efforts, I am unreliable to my friends.'
    ],
    roleplaying_suggestions: 'Entertainers are charismatic performers who live for the spotlight. They might be traveling bards, circus performers, actors, or musicians. Consider what type of entertainment your character specializes in and how their personality shines through in their performances.'
  },
  {
    name: 'Folk Hero',
    description: 'You are a champion of the common people, who look to you for guidance and protection.',
    skill_proficiencies: ['Animal Handling', 'Survival'],
    languages: [],
    equipment: ['Artisan\'s tools of your choice', 'Shovel', 'Iron pot', 'Common clothes', '10 gp'],
    feature: 'Rustic Hospitality',
    feature_description: 'Since you come from the ranks of the common folk, you fit in among them with ease. You can find a place to hide, rest, or recuperate among other commoners, unless you have shown yourself to be a danger to them. They will shield you from the law or anyone else searching for you, though they will not risk their lives for you.'
  },
  {
    name: 'Guild Artisan',
    description: 'You are a member of an artisan\'s guild, skilled in a particular craft.',
    skill_proficiencies: ['Insight', 'Persuasion'],
    languages: ['One of your choice'],
    equipment: ['Artisan\'s tools of your choice', 'Letter of introduction from your guild', 'Traveler\'s clothes', '15 gp'],
    feature: 'Guild Membership',
    feature_description: 'As an established and respected member of a guild, you can rely on certain benefits that membership provides. Your fellow guild members will provide you with lodging and food if necessary, and pay for your funeral if needed. In some cities and towns, a guildhall offers a central place to meet other members of your profession, which can be a good place to meet potential patrons, allies, or hirelings.'
  },
  {
    name: 'Hermit',
    description: 'You have lived a life of seclusion, either in a remote wilderness or in a monastery.',
    skill_proficiencies: ['Medicine', 'Religion'],
    languages: ['One of your choice'],
    equipment: ['Scroll case of notes from studies', 'Winter blanket', 'Common clothes', 'Herbalism kit', '5 gp'],
    feature: 'Discovery',
    feature_description: 'The quiet seclusion of your extended hermitage gave you access to a unique and powerful discovery. The exact nature of this revelation depends on the nature of your seclusion. It might be a great truth about the cosmos, the deities, the powerful beings of the outer planes, or the forces of nature. It could be a site that no one else has ever seen. You might have uncovered a fact that has long been forgotten, or unearthed some relic of the past that could rewrite history.'
  },
  {
    name: 'Noble',
    description: 'You are a member of the upper class, with all the privileges and responsibilities that entails.',
    skill_proficiencies: ['History', 'Persuasion'],
    languages: ['One of your choice'],
    equipment: ['Fine clothes', 'Signet ring', 'Scroll of pedigree', '25 gp'],
    feature: 'Position of Privilege',
    feature_description: 'Thanks to your noble birth, people are inclined to think the best of you. You are welcome in high society, and people assume you have the right to be wherever you are. The common folk make every effort to accommodate you and avoid your displeasure, and other people of high birth treat you as a member of the same social sphere. You can secure an audience with a local noble if you need to.'
  },
  {
    name: 'Outlander',
    description: 'You grew up in the wilds, far from civilization and its comforts.',
    skill_proficiencies: ['Athletics', 'Survival'],
    languages: ['One of your choice'],
    equipment: ['Staff', 'Hunting trap', 'Trophy from animal you killed', 'Traveler\'s clothes', '10 gp'],
    feature: 'Wanderer',
    feature_description: 'You have an excellent memory for maps and geography, and you can always recall the general layout of terrain, settlements, and other features around you. In addition, you can find food and fresh water for yourself and up to five other people each day, provided that the land offers berries, small game, water, and so forth.',
    personality_traits: [
      'I\'m driven by a wanderlust that led me away from home.',
      'I watch over my friends as if they were a litter of newborn pups.',
      'I once ran twenty-five miles without stopping to warn my clan of an approaching orc horde. I\'d do it again if I had to.',
      'I have a lesson for every situation, drawn from observing nature.',
      'I place no stock in wealthy or well-mannered folk. Money and manners won\'t save you from a hungry owlbear.',
      'I\'m always picking things up, absently fiddling with them, and sometimes accidentally breaking them.',
      'I feel far more comfortable around animals than people.',
      'I was, in fact, raised by wolves.'
    ],
    ideals: [
      'Change: Life is like the seasons, in constant change, and we must change with it. (Chaotic)',
      'Greater Good: It is each person\'s responsibility to make the most happiness for the whole tribe. (Good)',
      'Honor: If I dishonor myself, I dishonor my whole clan. (Lawful)',
      'Might: The strongest are meant to rule. (Evil)',
      'Nature: The natural world is more important than all the constructs of civilization. (Neutral)',
      'Glory: I must earn glory in battle, for myself and my clan. (Any)'
    ],
    bonds: [
      'My family, clan, or tribe is the most important thing in my life, even when they are far from me.',
      'An injury to the unspoiled wilderness of my home is an injury to me.',
      'I will bring terrible wrath down on the evildoers who destroyed my homeland.',
      'I am the last of my tribe, and it is up to me to ensure their names enter legend.',
      'I suffer awful visions of a coming disaster and will do anything to prevent it.',
      'It is my duty to provide children to sustain my tribe.'
    ],
    flaws: [
      'I am too enamored of ale, wine, and other intoxicants.',
      'There\'s no room for caution in a life lived to the fullest.',
      'I remember every insult I\'ve received and nurse a silent resentment toward anyone who\'s ever wronged me.',
      'I am slow to trust members of other races, tribes, and societies.',
      'Violence is my answer to almost any challenge.',
      'Don\'t expect me to save those who can\'t save themselves. It is nature\'s way that the strong thrive and the weak perish.'
    ],
    roleplaying_suggestions: 'Outlanders are wilderness survivors who feel most at home in nature. They might be tribal warriors, nomadic hunters, or exiles from civilized society. Consider what drove your character from civilization - were they born in the wilds, or did they flee there seeking freedom?'
  },
  {
    name: 'Sage',
    description: 'You are a scholar, well-versed in ancient lore and forgotten secrets.',
    skill_proficiencies: ['Arcana', 'History'],
    languages: [],
    equipment: ['Bottle of ink', 'Quill', 'Small knife', 'Letter from colleague', 'Common clothes', '10 gp'],
    feature: 'Researcher',
    feature_description: 'When you attempt to learn or recall a piece of lore, if you do not know that information, you often know where and from whom you can obtain it. Usually, this information comes from a library, scriptorium, university, or a sage or other learned person or creature. Your DM might rule that the knowledge you seek is secreted away in an almost inaccessible place, or that it simply cannot be found. Unearthing the deepest secrets of the multiverse can require an adventure or even a whole campaign.'
  },
  {
    name: 'Sailor',
    description: 'You have spent your life on the open sea, and you are at home on any ship.',
    skill_proficiencies: ['Athletics', 'Perception'],
    languages: [],
    equipment: ['Belaying pin (club)', '50 feet of silk rope', 'Lucky charm', 'Common clothes', '10 gp'],
    feature: 'Bad Reputation',
    feature_description: 'No matter where you go, people are afraid of you due to your reputation. When you are in a civilized settlement, you can get away with minor criminal offenses, such as refusing to pay for food at a tavern or breaking down doors at a local shop, since most people will not report your activity to the authorities.'
  },
  {
    name: 'Soldier',
    description: 'You are a trained warrior, experienced in combat and military tactics.',
    skill_proficiencies: ['Athletics', 'Intimidation'],
    languages: [],
    equipment: ['Insignia of rank', 'Trophy from fallen enemy', 'Bone dice or deck of cards', 'Common clothes', '10 gp'],
    feature: 'Military Rank',
    feature_description: 'You have a military rank from your career as a soldier. Soldiers loyal to your former military organization still recognize your authority and influence, and they defer to you if they are of a lower rank. You can invoke your rank to exert influence over other soldiers and requisition simple equipment or horses for temporary use. You can also usually gain access to friendly military encampments and fortresses where your rank is recognized.'
  },
  {
    name: 'Urchin',
    description: 'You grew up on the streets, fending for yourself in a harsh and unforgiving world.',
    skill_proficiencies: ['Sleight of Hand', 'Stealth'],
    languages: [],
    equipment: ['Small knife', 'Map of your home city', 'Pet mouse', 'Token to remember your parents', 'Common clothes', '10 gp'],
    feature: 'City Secrets',
    feature_description: 'You know the secret patterns and flow to cities and can find passages through the urban sprawl that others would miss. When you are not in combat, you (and companions you lead) can travel between any two locations in the city twice as fast as your speed would normally allow.'
  },
];

// Comprehensive race database with 40+ races from multiple sources
const COMPREHENSIVE_RACES: Race[] = [
  // Core Races (Player's Handbook)
  {
    slug: 'human',
    name: 'Human',
    source: 'PHB',
    ability_bonuses: { STR: 1, DEX: 1, CON: 1, INT: 1, WIS: 1, CHA: 1 },
    racial_traits: ['Versatile', 'Skilled'],
    description: 'Humans are the most adaptable and ambitious people among the common races. Whatever drives them, humans are the innovators, the achievers, and the pioneers of the worlds.',
    typicalRoles: ['Fighter', 'Wizard', 'Rogue', 'Cleric', 'Any']
  },
  {
    slug: 'mountain-dwarf',
    name: 'Mountain Dwarf',
    source: 'PHB',
    ability_bonuses: { STR: 2, CON: 2 },
    racial_traits: ['Darkvision', 'Dwarven Resilience', 'Stonecunning', 'Dwarven Combat Training', 'Tool Proficiency'],
    description: 'Bold and hardy, dwarves are known as skilled warriors, miners, and workers of stone and metal. Mountain dwarves are strong and hardy inhabitants of the mountains.',
    typicalRoles: ['Fighter', 'Barbarian', 'Cleric', 'Paladin']
  },
  {
    slug: 'hill-dwarf',
    name: 'Hill Dwarf',
    source: 'PHB',
    ability_bonuses: { CON: 2, WIS: 1 },
    racial_traits: ['Darkvision', 'Dwarven Resilience', 'Stonecunning', 'Dwarven Combat Training', 'Tool Proficiency'],
    description: 'Bold and hardy, dwarves are known as skilled warriors, miners, and workers of stone and metal. Hill dwarves have keen senses, deep intuition, and remarkable resilience.',
    typicalRoles: ['Cleric', 'Fighter', 'Barbarian', 'Paladin']
  },
  {
    slug: 'high-elf',
    name: 'High Elf',
    source: 'PHB',
    ability_bonuses: { DEX: 2, INT: 1 },
    racial_traits: ['Darkvision', 'Fey Ancestry', 'Trance', 'Keen Senses', 'Elf Weapon Training', 'Cantrip'],
    description: 'Elves are a magical people of otherworldly grace, living in the world but not entirely part of it. High elves are the most common subrace, known for their pursuit of arcane magic.',
    typicalRoles: ['Wizard', 'Fighter', 'Rogue', 'Druid']
  },
  {
    slug: 'wood-elf',
    name: 'Wood Elf',
    source: 'PHB',
    ability_bonuses: { DEX: 2, WIS: 1 },
    racial_traits: ['Darkvision', 'Fey Ancestry', 'Trance', 'Keen Senses', 'Elf Weapon Training', 'Fleet of Foot', 'Mask of the Wild'],
    description: 'Elves are a magical people of otherworldly grace, living in the world but not entirely part of it. Wood elves are reclusive and suspicious of non-elves.',
    typicalRoles: ['Ranger', 'Druid', 'Fighter', 'Rogue']
  },
  {
    slug: 'drow',
    name: 'Drow (Dark Elf)',
    source: 'PHB',
    ability_bonuses: { DEX: 2, CHA: 1 },
    racial_traits: ['Superior Darkvision', 'Fey Ancestry', 'Trance', 'Keen Senses', 'Drow Magic', 'Sunlight Sensitivity'],
    description: 'Elves are a magical people of otherworldly grace, living in the world but not entirely part of it. Drow, or dark elves, have black skin that resembles polished obsidian and stark white or pale yellow hair.',
    typicalRoles: ['Wizard', 'Rogue', 'Fighter', 'Warlock']
  },
  {
    slug: 'lightfoot-halfling',
    name: 'Lightfoot Halfling',
    source: 'PHB',
    ability_bonuses: { DEX: 2, CHA: 1 },
    racial_traits: ['Lucky', 'Brave', 'Halfling Nimbleness', 'Naturally Stealthy'],
    description: 'Halflings are an affable and cheerful people. They cherish the bonds of family and friendship as well as the comforts of hearth and home. Lightfoot halflings are stealthy and good-natured.',
    typicalRoles: ['Rogue', 'Bard', 'Cleric', 'Wizard']
  },
  {
    slug: 'stout-halfling',
    name: 'Stout Halfling',
    source: 'PHB',
    ability_bonuses: { DEX: 2, CON: 1 },
    racial_traits: ['Lucky', 'Brave', 'Halfling Nimbleness', 'Stout Resilience'],
    description: 'Halflings are an affable and cheerful people. They cherish the bonds of family and friendship as well as the comforts of hearth and home. Stout halflings are hardier than average and have some resistance to poison.',
    typicalRoles: ['Rogue', 'Barbarian', 'Fighter', 'Cleric']
  },
  {
    slug: 'forest-gnome',
    name: 'Forest Gnome',
    source: 'PHB',
    ability_bonuses: { INT: 2, DEX: 1 },
    racial_traits: ['Darkvision', 'Gnome Cunning', 'Natural Illusionist', 'Speak with Small Beasts'],
    description: 'Gnomes are small folk full of quirky inventiveness. Forest gnomes have a natural knack for illusion and a way with animals.',
    typicalRoles: ['Wizard', 'Druid', 'Bard', 'Rogue']
  },
  {
    slug: 'rock-gnome',
    name: 'Rock Gnome',
    source: 'PHB',
    ability_bonuses: { INT: 2, CON: 1 },
    racial_traits: ['Darkvision', 'Gnome Cunning', 'Artificer\'s Lore', 'Tinker'],
    description: 'Gnomes are small folk full of quirky inventiveness. Rock gnomes are natural inventors and tinkerers.',
    typicalRoles: ['Wizard', 'Artificer', 'Bard', 'Rogue']
  },
  {
    slug: 'dragonborn',
    name: 'Dragonborn',
    source: 'PHB',
    ability_bonuses: { STR: 2, CHA: 1 },
    racial_traits: ['Draconic Ancestry', 'Breath Weapon', 'Damage Resistance'],
    description: 'Dragonborn look very much like dragons standing erect in humanoid form, though they lack wings or a tail. Dragonborn are proud, honorable warriors.',
    typicalRoles: ['Fighter', 'Barbarian', 'Paladin', 'Sorcerer']
  },
  {
    slug: 'half-elf',
    name: 'Half-Elf',
    source: 'PHB',
    ability_bonuses: { CHA: 2 },
    racial_traits: ['Darkvision', 'Fey Ancestry', 'Skill Versatility'],
    description: 'Half-elves combine what some say are the best qualities of their elf and human parents: human curiosity, inventiveness, and ambition tempered by the refined senses, love of nature, and artistic tastes of the elves.',
    typicalRoles: ['Bard', 'Fighter', 'Rogue', 'Paladin', 'Any']
  },
  {
    slug: 'half-orc',
    name: 'Half-Orc',
    source: 'PHB',
    ability_bonuses: { STR: 2, CON: 1 },
    racial_traits: ['Darkvision', 'Menacing', 'Relentless Endurance', 'Savage Attacks'],
    description: 'Half-orcs are the short-tempered and sullen result of human and orc pairings. They are strong and tough, but they are often shunned by both races.',
    typicalRoles: ['Barbarian', 'Fighter', 'Rogue', 'Paladin']
  },
  {
    slug: 'tiefling',
    name: 'Tiefling',
    source: 'PHB',
    ability_bonuses: { INT: 1, CHA: 2 },
    racial_traits: ['Darkvision', 'Hellish Resistance', 'Infernal Legacy'],
    description: 'Tieflings are derived from human bloodlines, and in the broadest possible sense, they still look human. However, their infernal heritage has left a clear imprint on their appearance.',
    typicalRoles: ['Warlock', 'Wizard', 'Rogue', 'Bard']
  },

  // Exotic Races (Volo's Guide to Monsters)
  {
    slug: 'aasimar',
    name: 'Aasimar',
    source: 'VGtM',
    ability_bonuses: { WIS: 1, CHA: 2 },
    racial_traits: ['Darkvision', 'Celestial Resistance', 'Healing Hands', 'Light Bearer'],
    description: 'Aasimars are mortals who carry a spark of the Upper Planes within their souls. They are humanoids with a touch of the celestial in their appearance.',
    typicalRoles: ['Paladin', 'Cleric', 'Bard', 'Fighter']
  },
  {
    slug: 'firbolg',
    name: 'Firbolg',
    source: 'VGtM',
    ability_bonuses: { STR: 1, WIS: 2 },
    racial_traits: ['Firbolg Magic', 'Hidden Step', 'Powerful Build', 'Speech of Beast and Leaf'],
    description: 'Firbolgs are reclusive giant-kin who dwell in remote forests and mountains. They are peaceful and wise, but they can be terrifying when roused to anger.',
    typicalRoles: ['Druid', 'Barbarian', 'Fighter', 'Cleric']
  },
  {
    slug: 'goliath',
    name: 'Goliath',
    source: 'VGtM',
    ability_bonuses: { STR: 2, CON: 1 },
    racial_traits: ['Stone\'s Endurance', 'Powerful Build', 'Mountain Born'],
    description: 'Goliaths are strong and reclusive people who dwell in remote mountain peaks. They are known for their great strength and endurance.',
    typicalRoles: ['Barbarian', 'Fighter', 'Ranger', 'Paladin']
  },
  {
    slug: 'kenku',
    name: 'Kenku',
    source: 'VGtM',
    ability_bonuses: { DEX: 2, WIS: 1 },
    racial_traits: ['Expert Forgery', 'Kenku Training', 'Mimicry'],
    description: 'Kenku are crow-like humanoids who were transformed by powerful magic. They are cunning and resourceful, but they cannot speak except by mimicking sounds they have heard.',
    typicalRoles: ['Rogue', 'Bard', 'Monk', 'Wizard']
  },
  {
    slug: 'tabaxi',
    name: 'Tabaxi',
    source: 'VGtM',
    ability_bonuses: { DEX: 2, CHA: 1 },
    racial_traits: ['Darkvision', 'Feline Agility', 'Cat\'s Claws', 'Cat\'s Talent'],
    description: 'Tabaxi are cat-like humanoids who hail from distant jungles. They are curious, agile, and often follow their whims.',
    typicalRoles: ['Rogue', 'Bard', 'Druid', 'Fighter']
  },
  {
    slug: 'triton',
    name: 'Triton',
    source: 'VGtM',
    ability_bonuses: { STR: 1, CON: 1, CHA: 1 },
    racial_traits: ['Amphibious', 'Control Air and Water', 'Emissary of the Sea', 'Guardians of the Depths'],
    description: 'Tritons are fish-like humanoids who dwell in the depths of the ocean. They are guardians of the sea and often serve powerful aquatic beings.',
    typicalRoles: ['Cleric', 'Fighter', 'Paladin', 'Wizard']
  },

  // Monstrous Races (Volo's Guide to Monsters)
  {
    slug: 'bugbear',
    name: 'Bugbear',
    source: 'VGtM',
    ability_bonuses: { STR: 2, DEX: 1 },
    racial_traits: ['Darkvision', 'Long-Limbed', 'Powerful Build', 'Sneaky', 'Surprise Attack'],
    description: 'Bugbears are hulking, furry goblinoids that tower over their goblin and hobgoblin kin. They are stealthy predators who strike from the shadows.',
    typicalRoles: ['Rogue', 'Barbarian', 'Fighter', 'Ranger']
  },
  {
    slug: 'goblin',
    name: 'Goblin',
    source: 'VGtM',
    ability_bonuses: { DEX: 2, CON: 1 },
    racial_traits: ['Darkvision', 'Fury of the Small', 'Nimble Escape'],
    description: 'Goblins are small, green-skinned creatures that dwell in dark, cramped places. They are cunning and vicious, but they are often cowardly.',
    typicalRoles: ['Rogue', 'Wizard', 'Bard', 'Warlock']
  },
  {
    slug: 'hobgoblin',
    name: 'Hobgoblin',
    source: 'VGtM',
    ability_bonuses: { CON: 2, INT: 1 },
    racial_traits: ['Darkvision', 'Martial Training', 'Saving Face'],
    description: 'Hobgoblins are large, militaristic goblinoids that organize themselves into legions. They are disciplined warriors who value honor and tradition.',
    typicalRoles: ['Fighter', 'Barbarian', 'Rogue', 'Wizard']
  },
  {
    slug: 'kobold',
    name: 'Kobold',
    source: 'VGtM',
    ability_bonuses: { DEX: 2, STR: -2 },
    racial_traits: ['Darkvision', 'Grovel, Cower, and Beg', 'Pack Tactics', 'Sunlight Sensitivity'],
    description: 'Kobolds are small, reptilian humanoids that dwell in dark places. They are cowardly and subservient, but they can be surprisingly cunning.',
    typicalRoles: ['Rogue', 'Wizard', 'Sorcerer', 'Warlock']
  },
  {
    slug: 'orc',
    name: 'Orc',
    source: 'VGtM',
    ability_bonuses: { STR: 2, CON: 1, INT: -2 },
    racial_traits: ['Darkvision', 'Aggressive', 'Menacing', 'Powerful Build'],
    description: 'Orcs are brutish, green-skinned humanoids that dwell in tribal societies. They are fierce warriors who revel in battle.',
    typicalRoles: ['Barbarian', 'Fighter', 'Rogue', 'Shaman']
  },
  {
    slug: 'yuan-ti-pureblood',
    name: 'Yuan-Ti Pureblood',
    source: 'VGtM',
    ability_bonuses: { CHA: 2, INT: 1 },
    racial_traits: ['Darkvision', 'Innate Spellcasting', 'Magic Resistance', 'Poison Immunity'],
    description: 'Yuan-ti purebloods are snake-like humanoids who appear mostly human. They are cunning and manipulative, with a natural affinity for magic.',
    typicalRoles: ['Warlock', 'Wizard', 'Rogue', 'Sorcerer']
  },

  // Planar Races (Various Sources)
  {
    slug: 'fairy',
    name: 'Fairy',
    source: 'WGtE',
    ability_bonuses: { DEX: 2, CHA: 1 },
    racial_traits: ['Fairy Magic', 'Flight'],
    description: 'Fairies are tiny, magical beings from the Feywild. They are playful and mischievous, with a natural affinity for illusion magic.',
    typicalRoles: ['Bard', 'Druid', 'Rogue', 'Wizard']
  },
  {
    slug: 'harengon',
    name: 'Harengon',
    source: 'WGtE',
    ability_bonuses: { DEX: 2, WIS: 1 },
    racial_traits: ['Hare-Trigger', 'Leporine Senses', 'Lucky Footwork', 'Rabbit Hop'],
    description: 'Harengons are rabbit-like humanoids who hail from the Feywild. They are quick and lucky, with enhanced senses and agility.',
    typicalRoles: ['Rogue', 'Ranger', 'Bard', 'Monk']
  },
  {
    slug: 'loxodon',
    name: 'Loxodon',
    source: 'GGtR',
    ability_bonuses: { CON: 2, WIS: 1 },
    racial_traits: ['Powerful Build', 'Loxodon Serenity', 'Natural Armor', 'Trunk'],
    description: 'Loxodons are elephant-like humanoids known for their wisdom and calm demeanor. They are peaceful and introspective.',
    typicalRoles: ['Cleric', 'Druid', 'Monk', 'Paladin']
  },
  {
    slug: 'owlin',
    name: 'Owlin',
    source: 'Strixhaven',
    ability_bonuses: { DEX: 2, WIS: 1 },
    racial_traits: ['Darkvision', 'Flight', 'Silent Feathers'],
    description: 'Owlin are owl-like humanoids who can fly silently through the night. They are wise and observant.',
    typicalRoles: ['Druid', 'Wizard', 'Rogue', 'Cleric']
  },
  {
    slug: 'githyanki',
    name: 'Githyanki',
    source: 'MToF',
    ability_bonuses: { STR: 1, INT: 1 },
    racial_traits: ['Decadent Mastery', 'Githyanki Psionics', 'Martial Prodigy'],
    description: 'Githyanki are humanoid warriors from the Astral Plane. They are fierce fighters with psionic abilities.',
    typicalRoles: ['Fighter', 'Wizard', 'Rogue', 'Barbarian']
  },
  {
    slug: 'fire-genasi',
    name: 'Fire Genasi',
    source: 'EE',
    ability_bonuses: { CON: 2, INT: 1 },
    racial_traits: ['Darkvision', 'Fire Resistance', 'Reach to the Blaze'],
    description: 'Fire genasi are humanoids infused with elemental fire. They have a fiery temper and resistance to heat.',
    typicalRoles: ['Sorcerer', 'Fighter', 'Barbarian', 'Wizard']
  }
];

export const RACE_CATEGORIES: RaceCategory[] = [
  {
    name: '📖 Core Races',
    icon: '📖',
    description: 'The fundamental races from the Player\'s Handbook, perfect for traditional D&D campaigns.',
    races: COMPREHENSIVE_RACES.filter(race => race.source === 'PHB')
  },
  {
    name: '🗺️ Exotic Races',
    icon: '🗺️',
    description: 'Unique and flavorful races from Volo\'s Guide to Monsters, adding exotic flair to your character.',
    races: COMPREHENSIVE_RACES.filter(race => race.source === 'VGtM')
  },
  {
    name: '🚀 Monstrous Races',
    icon: '🚀',
    description: 'Play as the monsters! Challenging but rewarding races for experienced players.',
    races: COMPREHENSIVE_RACES.filter(race => ['VGtM'].includes(race.source) && ['bugbear', 'goblin', 'hobgoblin', 'kobold', 'orc', 'yuan-ti-pureblood'].includes(race.slug))
  },
  {
    name: '✨ Planar Races',
    icon: '✨',
    description: 'Beings touched by other planes, from the Feywild to the Elemental Planes.',
    races: COMPREHENSIVE_RACES.filter(race => ['WGtE', 'GGtR', 'Strixhaven', 'MToF', 'EE'].includes(race.source))
  }
];

// Enhanced class data with rich descriptions and categorization
const ENHANCED_CLASS_DATA: Record<string, Partial<Class>> = {
  barbarian: {
    category: 'Martial',
    detailedDescription: 'Barbarians are fierce warriors who draw on primal rage to enhance their combat abilities. They are often seen as brutish and uncivilized by those who don\'t understand their ways, but they possess deep wisdom about the natural world and their place in it.',
    roleplayingTips: [
      'Embrace your primal instincts and connection to nature',
      'Show respect for the wilderness and its dangers',
      'Let your rage guide you in battle, but control it when among allies'
    ],
    keyFeatures: ['Rage', 'Unarmored Defense', 'Reckless Attack', 'Extra Attack'],
    icon: '⚔️',
    themeColor: '#8B4513'
  },
  bard: {
    category: 'Arcane',
    detailedDescription: 'Bards are versatile performers whose music and magic inspire allies and confound enemies. They are the keepers of lore, the chroniclers of history, and the entertainers who bring joy and inspiration to the world.',
    roleplayingTips: [
      'Use your performance skills to gather information and influence others',
      'Share stories and songs that preserve history and culture',
      'Balance your love of performance with the serious responsibilities of adventuring'
    ],
    keyFeatures: ['Bardic Inspiration', 'Spellcasting', 'Jack of All Trades', 'Song of Rest'],
    icon: '🎭',
    themeColor: '#9370DB'
  },
  cleric: {
    category: 'Divine',
    detailedDescription: 'Clerics are divine spellcasters who wield the power of their deity to heal, protect, and smite their enemies. They are the mortal representatives of gods, carrying out divine will while serving as spiritual guides to their communities.',
    roleplayingTips: [
      'Act as a spiritual guide and moral compass for your party',
      'Demonstrate the teachings and values of your deity through actions',
      'Balance divine power with humility and wisdom'
    ],
    keyFeatures: ['Divine Domain', 'Spellcasting', 'Divine Intervention', 'Turn Undead'],
    icon: '✨',
    themeColor: '#FFD700'
  },
  druid: {
    category: 'Primal',
    detailedDescription: 'Druids are guardians of nature who can shapeshift into animals and command the elements. They protect the natural world from those who would harm it, maintaining the delicate balance between civilization and wilderness.',
    roleplayingTips: [
      'Show reverence for nature and all living things',
      'Protect the wilderness from those who would exploit it',
      'Embrace the cycles of life, death, and rebirth'
    ],
    keyFeatures: ['Druidcraft', 'Wild Shape', 'Spellcasting', 'Circle Spells'],
    icon: '🌿',
    themeColor: '#228B22'
  },
  fighter: {
    category: 'Martial',
    detailedDescription: 'Fighters are masters of martial combat, skilled with a wide variety of weapons and armor. They are versatile warriors who excel in any form of combat, from swordplay to archery to unarmed fighting.',
    roleplayingTips: [
      'Demonstrate discipline and dedication to your martial training',
      'Protect your allies and stand firm against overwhelming odds',
      'Seek to master new fighting techniques and weapons'
    ],
    keyFeatures: ['Fighting Style', 'Second Wind', 'Action Surge', 'Extra Attack'],
    icon: '⚔️',
    themeColor: '#B22222'
  },
  monk: {
    category: 'Martial',
    detailedDescription: 'Monks are martial artists who harness ki energy to perform superhuman feats. They follow ancient traditions of physical and mental discipline, seeking enlightenment through perfect mastery of body and mind.',
    roleplayingTips: [
      'Maintain discipline and focus in all your actions',
      'Seek enlightenment through meditation and self-improvement',
      'Use your ki abilities with precision and restraint'
    ],
    keyFeatures: ['Unarmored Defense', 'Martial Arts', 'Ki', 'Flurry of Blows'],
    icon: '🥋',
    themeColor: '#FF6347'
  },
  paladin: {
    category: 'Divine',
    detailedDescription: 'Paladins are holy warriors bound by sacred oaths to uphold justice and righteousness. They combine martial prowess with divine magic, serving as beacons of hope and champions against evil.',
    roleplayingTips: [
      'Uphold your sacred oath with unwavering dedication',
      'Protect the innocent and stand against tyranny and evil',
      'Inspire others with your courage and moral strength'
    ],
    keyFeatures: ['Divine Sense', 'Lay on Hands', 'Divine Smite', 'Aura of Protection'],
    icon: '🛡️',
    themeColor: '#FFD700'
  },
  ranger: {
    category: 'Primal',
    detailedDescription: 'Rangers are skilled hunters and explorers who protect the wilderness from threats. They are experts in tracking, survival, and ranged combat, often forming deep bonds with animal companions.',
    roleplayingTips: [
      'Protect the wilderness and its inhabitants from harm',
      'Use your knowledge of nature to guide and protect your allies',
      'Form bonds with animals and respect the natural world'
    ],
    keyFeatures: ['Favored Enemy', 'Natural Explorer', 'Primeval Awareness', 'Hunter\'s Mark'],
    icon: '🏹',
    themeColor: '#8B4513'
  },
  rogue: {
    category: 'Martial',
    detailedDescription: 'Rogues are cunning experts in stealth, deception, and precision strikes. They operate in the shadows, using skill and cunning to overcome obstacles and achieve their goals.',
    roleplayingTips: [
      'Use stealth and cunning to achieve your objectives',
      'Navigate social situations with charm and deception when needed',
      'Strike precisely when the moment is right'
    ],
    keyFeatures: ['Sneak Attack', 'Cunning Action', 'Uncanny Dodge', 'Evasion'],
    icon: '🗡️',
    themeColor: '#2F4F4F'
  },
  sorcerer: {
    category: 'Arcane',
    detailedDescription: 'Sorcerers wield raw magical power that flows through their bloodline. Their magic is instinctive and powerful, drawing from innate talent rather than studied knowledge.',
    roleplayingTips: [
      'Embrace the wild, instinctive nature of your magic',
      'Explore the source of your magical bloodline',
      'Balance raw power with wisdom in its application'
    ],
    keyFeatures: ['Spellcasting', 'Sorcery Points', 'Flexible Casting', 'Metamagic'],
    icon: '🔮',
    themeColor: '#8A2BE2'
  },
  warlock: {
    category: 'Arcane',
    detailedDescription: 'Warlocks gain magical power through pacts with otherworldly entities. Their magic is granted by patrons who demand service in return, creating complex relationships of power and obligation.',
    roleplayingTips: [
      'Navigate the complex relationship with your otherworldly patron',
      'Balance the benefits of your pact with its demands and costs',
      'Use your unique magical abilities strategically'
    ],
    keyFeatures: ['Otherworldly Patron', 'Pact Magic', 'Eldritch Invocations', 'Pact Boon'],
    icon: '🌑',
    themeColor: '#4B0082'
  },
  wizard: {
    category: 'Arcane',
    detailedDescription: 'Wizards are scholars of arcane magic who master spells through study and intellect. They are repositories of magical knowledge, capable of wielding incredible power through understanding and preparation.',
    roleplayingTips: [
      'Pursue knowledge and understanding of magic relentlessly',
      'Document your discoveries and share knowledge with others',
      'Approach problems with logic and scholarly analysis'
    ],
    keyFeatures: ['Spellcasting', 'Arcane Recovery', 'Spellbook', 'Ritual Casting'],
    icon: '📚',
    themeColor: '#4169E1'
  }
};

// Helper function to get enhanced class data
export function getEnhancedClassData(classSlug: string): Partial<Class> | undefined {
  return ENHANCED_CLASS_DATA[classSlug];
}

// Enhanced class categories with rich data
export const CLASS_CATEGORIES: ClassCategory[] = [
  {
    name: '⚔️ Martial Classes',
    icon: '⚔️',
    description: 'Warriors who excel in physical combat, discipline, and martial prowess. These classes focus on strength, skill, and tactical mastery.',
    classes: loadClasses().filter(cls =>
      ['barbarian', 'fighter', 'monk', 'rogue'].includes(cls.slug)
    ).map(cls => {
      const enhanced = ENHANCED_CLASS_DATA[cls.slug];
      return enhanced ? { ...cls, ...enhanced } : cls;
    })
  },
  {
    name: '🔮 Arcane Classes',
    icon: '🔮',
    description: 'Spellcasters who master magical forces through study, innate talent, or otherworldly pacts. These classes wield powerful magic and arcane knowledge.',
    classes: loadClasses().filter(cls =>
      ['bard', 'sorcerer', 'warlock', 'wizard'].includes(cls.slug)
    ).map(cls => {
      const enhanced = ENHANCED_CLASS_DATA[cls.slug];
      return enhanced ? { ...cls, ...enhanced } : cls;
    })
  },
  {
    name: '✨ Divine Classes',
    icon: '✨',
    description: 'Champions of faith who draw power from deities and divine forces. These classes combine martial skill with divine magic and spiritual guidance.',
    classes: loadClasses().filter(cls =>
      ['cleric', 'paladin'].includes(cls.slug)
    ).map(cls => {
      const enhanced = ENHANCED_CLASS_DATA[cls.slug];
      return enhanced ? { ...cls, ...enhanced } : cls;
    })
  },
  {
    name: '🌿 Primal Classes',
    icon: '🌿',
    description: 'Guardians of nature who commune with the wilderness and wield primal forces. These classes protect the natural world and harness its raw power.',
    classes: loadClasses().filter(cls =>
      ['druid', 'ranger'].includes(cls.slug)
    ).map(cls => {
      const enhanced = ENHANCED_CLASS_DATA[cls.slug];
      return enhanced ? { ...cls, ...enhanced } : cls;
    })
  }
];

export const EQUIPMENT_PACKAGES: EquipmentPackage[] = [
  {
    name: 'Burglar\'s Pack',
    level: 1,
    startingGold: 16,
    items: [
      { name: 'Backpack', slug: 'backpack', quantity: 1, equipped: false },
      { name: 'Ball bearings (1,000)', slug: 'ball-bearings-bag-of-1000', quantity: 1, equipped: false },
      { name: 'String (10 feet)', slug: 'string', quantity: 1, equipped: false },
      { name: 'Bell', slug: 'bell', quantity: 1, equipped: false },
      { name: 'Candles', slug: 'candle', quantity: 5, equipped: false },
      { name: 'Crowbar', slug: 'crowbar', quantity: 1, equipped: false },
      { name: 'Hammer', slug: 'hammer', quantity: 1, equipped: false },
      { name: 'Pitons', slug: 'piton', quantity: 10, equipped: false },
      { name: 'Lantern', slug: 'hooded-lantern', quantity: 1, equipped: false },
      { name: 'Oil flasks', slug: 'oil-flask', quantity: 2, equipped: false },
      { name: 'Rations (1 day)', slug: 'rations-1-day', quantity: 5, equipped: false },
      { name: 'Tinderbox', slug: 'tinderbox', quantity: 1, equipped: false },
      { name: 'Waterskin', slug: 'waterskin', quantity: 1, equipped: false },
      { name: 'Rope (50 feet)', slug: 'hempen-rope-50-feet', quantity: 1, equipped: false },
    ],
  },
  {
    name: 'Diplomat\'s Pack',
    startingGold: 39,
    recommendedFor: ['noble', 'bard', 'paladin'],
    description: 'A pack for those who need to impress and document their journeys.',
    items: [
      { name: 'Chest', slug: 'chest', quantity: 1, equipped: false },
      { name: 'Map case (scroll case)', slug: 'map-or-scroll-case', quantity: 2, equipped: false },
      { name: 'Fine clothes', slug: 'fine-clothes', quantity: 1, equipped: false },
      { name: 'Ink', slug: 'ink-1-ounce-bottle', quantity: 1, equipped: false },
      { name: 'Ink pen', slug: 'ink-pen', quantity: 1, equipped: false },
      { name: 'Lamp', slug: 'lamp', quantity: 1, equipped: false },
      { name: 'Oil flasks', slug: 'oil-flask', quantity: 2, equipped: false },
      { name: 'Paper (5 sheets)', slug: 'paper-one-sheet', quantity: 5, equipped: false },
      { name: 'Perfume', slug: 'perfume-vial', quantity: 1, equipped: false },
      { name: 'Sealing wax', slug: 'sealing-wax', quantity: 1, equipped: false },
      { name: 'Soap', slug: 'soap', quantity: 1, equipped: false },
    ],
  },
  {
    name: 'Dungeoneer\'s Pack',
    startingGold: 12,
    recommendedFor: ['fighter', 'rogue', 'ranger'],
    description: 'Essential gear for dungeon exploration and survival.',
    items: [
      { name: 'Backpack', slug: 'backpack', quantity: 1, equipped: false },
      { name: 'Crowbar', slug: 'crowbar', quantity: 1, equipped: false },
      { name: 'Hammer', slug: 'hammer', quantity: 1, equipped: false },
      { name: 'Pitons', slug: 'piton', quantity: 10, equipped: false },
      { name: 'Torches', slug: 'torch', quantity: 10, equipped: false },
      { name: 'Tinderbox', slug: 'tinderbox', quantity: 1, equipped: false },
      { name: 'Rations (1 day)', slug: 'rations-1-day', quantity: 10, equipped: false },
      { name: 'Waterskin', slug: 'waterskin', quantity: 1, equipped: false },
      { name: 'Rope (50 feet)', slug: 'hempen-rope-50-feet', quantity: 1, equipped: false },
    ],
  },
  {
    name: 'Explorer\'s Pack',
    startingGold: 10,
    recommendedFor: ['ranger', 'druid', 'barbarian'],
    description: 'Perfect for wilderness adventures and long journeys.',
    items: [
      { name: 'Backpack', slug: 'backpack', quantity: 1, equipped: false },
      { name: 'Tent (two-person)', slug: 'tent', quantity: 1, equipped: false },
      { name: 'Mess kit', slug: 'mess-kit', quantity: 1, equipped: false },
      { name: 'Tinderbox', slug: 'tinderbox', quantity: 1, equipped: false },
      { name: 'Torches', slug: 'torch', quantity: 10, equipped: false },
      { name: 'Rations (1 day)', slug: 'rations-1-day', quantity: 10, equipped: false },
      { name: 'Waterskin', slug: 'waterskin', quantity: 1, equipped: false },
      { name: 'Rope (50 feet)', slug: 'hempen-rope-50-feet', quantity: 1, equipped: false },
    ],
  },
  {
    name: 'Priest\'s Pack',
    startingGold: 19,
    recommendedFor: ['cleric', 'paladin', 'druid'],
    description: 'Sacred items and supplies for divine practitioners.',
    items: [
      { name: 'Backpack', slug: 'backpack', quantity: 1, equipped: false },
      { name: 'Blanket', slug: 'blanket', quantity: 1, equipped: false },
      { name: 'Candles', slug: 'candle', quantity: 10, equipped: false },
      { name: 'Tinderbox', slug: 'tinderbox', quantity: 1, equipped: false },
      { name: 'Alms box', slug: 'alms-box', quantity: 1, equipped: false },
      { name: 'Incense (2 blocks)', slug: 'incense', quantity: 2, equipped: false },
      { name: 'Censer', slug: 'censer', quantity: 1, equipped: false },
      { name: 'Vestments', slug: 'vestments', quantity: 1, equipped: false },
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

// --- Randomization Utilities ---

/**
 * Get a random element from an array
 */
const getRandomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

/**
 * Generate a random fantasy character name
 */
const generateRandomName = (): string => {
  const firstParts = [
    'Aer', 'Al', 'Ar', 'Bal', 'Bel', 'Bor', 'Bran', 'Cael', 'Cor', 'Dael', 'Dar', 'Del', 'Eld', 'El', 'Fael', 'Far', 'Gal', 'Gar', 'Glyn', 'Gor', 'Hal', 'Har', 'Hel', 'Hor', 'Jor', 'Kael', 'Kar', 'Kel', 'Keth', 'Kyr', 'Lir', 'Lor', 'Mal', 'Mar', 'Mor', 'Nal', 'Nar', 'Nor', 'Ol', 'Or', 'Pael', 'Par', 'Per', 'Quor', 'Rael', 'Ran', 'Ril', 'Ror', 'Sael', 'Sar', 'Sel', 'Sil', 'Sor', 'Tar', 'Tel', 'Tor', 'Ul', 'Ur', 'Val', 'Vor', 'Wyl', 'Xar', 'Yor', 'Zel', 'Zor'
  ];

  const secondParts = [
    'a', 'ae', 'ai', 'al', 'an', 'ar', 'ath', 'el', 'en', 'er', 'eth', 'ia', 'iel', 'in', 'is', 'ith', 'on', 'or', 'oth', 'us', 'ya', 'yn'
  ];

  const titles = [
    'Shadow', 'Storm', 'Light', 'Dark', 'Blood', 'Iron', 'Fire', 'Ice', 'Wind', 'Earth', 'Star', 'Moon', 'Sun', 'Void', 'Soul', 'Spirit', 'Heart', 'Mind', 'Will', 'Fate', 'Destiny', 'Hope', 'Fear', 'Rage', 'Peace', 'War', 'Death', 'Life', 'Time', 'Space', 'Dream', 'Nightmare'
  ];

  const formats = [
    () => `${getRandomElement(firstParts)}${getRandomElement(secondParts)}`, // FirstLast
    () => `${getRandomElement(firstParts)}${getRandomElement(secondParts)} ${getRandomElement(titles)}${getRandomElement(['', 'bane', 'born', 'breaker', 'caller', 'dawn', 'eye', 'fall', 'fire', 'fist', 'forge', 'fury', 'guard', 'hammer', 'hand', 'heart', 'hunter', 'keeper', 'lord', 'master', 'rage', 'reaver', 'rider', 'seeker', 'shadow', 'slayer', 'song', 'soul', 'spawn', 'storm', 'sword', 'ward', 'weaver', 'whisper', 'wind', 'wing', 'wisp'])}`, // FirstLast Title
    () => `${getRandomElement(titles)}${getRandomElement(['', 'bane', 'born', 'breaker', 'caller', 'dawn', 'eye', 'fall', 'fire', 'fist', 'forge', 'fury', 'guard', 'hammer', 'hand', 'heart', 'hunter', 'keeper', 'lord', 'master', 'rage', 'reaver', 'rider', 'seeker', 'shadow', 'slayer', 'song', 'soul', 'spawn', 'storm', 'sword', 'ward', 'weaver', 'whisper', 'wind', 'wing', 'wisp'])} ${getRandomElement(firstParts)}${getRandomElement(secondParts)}` // Title FirstLast
  ];

  return getRandomElement(formats)();
};

/**
 * Randomize character level with bias toward milestone levels
 */
export const randomizeLevel = (): number => {
  const milestoneLevels = [2, 3, 4, 5, 6, 8, 11, 12, 14, 16, 17, 19, 20];
  const regularLevels = Array.from({ length: 20 }, (_, i) => i + 1).filter(l => !milestoneLevels.includes(l));

  // 70% chance for milestone levels, 30% for regular levels
  return Math.random() < 0.7 ? getRandomElement(milestoneLevels) : getRandomElement(regularLevels);
};

/**
 * Randomize character identity (name, alignment, background)
 */
export const randomizeIdentity = (): { name: string; alignment: string; background: string } => {
  return {
    name: generateRandomName(),
    alignment: getRandomElement(ALIGNMENTS),
    background: getRandomElement(BACKGROUNDS).name
  };
};

/**
 * Randomize race selection
 */
export const randomizeRace = (): string => {
  const category = getRandomElement(RACE_CATEGORIES);
  const race = getRandomElement(category.races);
  return race.slug;
};

/**
 * Randomize class and required skills
 */
export const randomizeClassAndSkills = (): { classSlug: string; selectedSkills: SkillName[]; subclassSlug?: string } => {
  const category = getRandomElement(CLASS_CATEGORIES);
  const _class = getRandomElement(category.classes);
  const classData = loadClasses().find(c => c.slug === _class.slug);

  if (!classData) {
    throw new Error(`Class data not found for ${category.name}`);
  }

  // Randomly select required number of skills from class options
  const availableSkills = classData.skill_proficiencies;
  const numSkills = classData.num_skill_choices || 0;
  const selectedSkills: string[] = [];

  if (numSkills > 0 && availableSkills.length > 0) {
    const shuffled = [...availableSkills].sort(() => Math.random() - 0.5);
    selectedSkills.push(...shuffled.slice(0, numSkills));
  }

  // Random subclass if available
  const subclasses = getSubclassesByClass(_class.slug);
  const subclassSlug = subclasses.length > 0 ? getRandomElement(subclasses).slug : undefined;

  return {
    classSlug: _class.slug,
    selectedSkills: selectedSkills as SkillName[],
    subclassSlug
  };
};

/**
 * Randomize fighting style for applicable classes
 */
export const randomizeFightingStyle = (classSlug: string): string | undefined => {
  const applicableClasses = ['fighter', 'paladin', 'ranger'];
  if (!applicableClasses.includes(classSlug)) {
    return undefined;
  }

  // Get styles that include this class in their prerequisite
  const availableStyles = FIGHTING_STYLES.filter(style =>
    style.prerequisite.toLowerCase().includes(classSlug)
  );

  // If no specific styles for this class, allow any style
  const stylePool = availableStyles.length > 0 ? availableStyles : FIGHTING_STYLES;
  return getRandomElement(stylePool).name;
};

/**
 * Randomize spell selection for spellcasters
 */
export const randomizeSpells = (classSlug: string, level: number = 1): { selectedCantrips: string[]; selectedSpells: string[] } => {
  const classData = loadClasses().find(c => c.slug === classSlug);
  if (!classData?.spellcasting) {
    return { selectedCantrips: [], selectedSpells: [] };
  }

  const cantrips = getCantripsByClass(classSlug);
  const spells = getLeveledSpellsByClass(classSlug, level);

  // Get cantrip limit for this class and level
  const cantripLimit = CANTRIPS_KNOWN_BY_CLASS[classSlug]?.[level] || 0;
  const spellLimit = SPELL_SLOTS_BY_CLASS[classSlug]?.[level]?.[0] || 0; // Level 1 spells

  const selectedCantrips = cantrips.length > 0 && cantripLimit > 0
    ? [...cantrips].sort(() => Math.random() - 0.5).slice(0, cantripLimit).map(s => s.slug)
    : [];

  const selectedSpells = spells.length > 0 && spellLimit > 0
    ? [...spells].sort(() => Math.random() - 0.5).slice(0, spellLimit).map(s => s.slug)
    : [];

  return { selectedCantrips, selectedSpells };
};

/**
 * Randomize ability scores
 */
export const randomizeAbilities = (): { abilities: Record<string, number>; abilityScoreMethod: 'standard-array' | 'point-buy' | 'standard-roll' } => {
  const methods: ('standard-array' | 'point-buy' | 'standard-roll')[] = ['standard-array', 'point-buy', 'standard-roll'];
  const method = getRandomElement(methods);

  let abilities: Record<string, number>;

  if (method === 'standard-array') {
    // Standard array: 15, 14, 13, 12, 10, 8
    const scores = [15, 14, 13, 12, 10, 8];
    const abilityNames = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
    const shuffled = [...abilityNames].sort(() => Math.random() - 0.5);

    abilities = {};
    shuffled.forEach((ability, index) => {
      abilities[ability] = scores[index];
    });
  } else if (method === 'point-buy') {
    // Point buy: start with 8 in each, distribute 27 points
    abilities = { STR: 8, DEX: 8, CON: 8, INT: 8, WIS: 8, CHA: 8 };
    let points = 27;

    while (points > 0) {
      const ability = getRandomElement(['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']);
      const current = abilities[ability];
      const cost = current >= 13 ? 2 : 1; // 14+ costs 2 points

      if (current < 15 && points >= cost) {
        abilities[ability] = current + 1;
        points -= cost;
      }
    }
  } else {
    // Standard roll: 4d6 drop lowest for each ability
    abilities = {};
    ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].forEach(ability => {
      const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
      rolls.sort((a, b) => b - a); // Sort descending
      abilities[ability] = rolls[0] + rolls[1] + rolls[2]; // Drop lowest
    });
  }

  return { abilities, abilityScoreMethod: method };
};

/**
 * Randomize feat selection
 */
export const randomizeFeats = (): string[] => {
  // For now, just return empty array as feats are optional
  // Could be enhanced to select appropriate feats based on character
  return [];
};

/**
 * Randomize equipment choices
 */
export const randomizeEquipmentChoices = (classSlug: string): EquipmentChoice[] => {
  const classData = loadClasses().find(c => c.slug === classSlug);
  if (!classData?.equipment_choices) {
    return [];
  }

  // For each equipment choice, randomly select one option
  return classData.equipment_choices.map(choice => ({
    ...choice,
    selected: Math.floor(Math.random() * choice.options.length)
  }));
};

/**
 * Randomize additional equipment
 */
export const randomizeAdditionalEquipment = (): EquippedItem[] => {
  // For now, return empty array - could add random starting items
  return [];
};

/**
 * Randomize language selection
 */
export const randomizeLanguages = (raceSlug: string, background: string): string[] => {
  // For now, return basic languages - can be enhanced later
  const languages = new Set<string>();

  // Always include Common
  languages.add('Common');

  // Add basic racial languages
  const racialLanguageMap: Record<string, string[]> = {
    'dwarf': ['Dwarvish'],
    'elf': ['Elvish'],
    'gnome': ['Gnomish'],
    'halfling': ['Halfling'],
    'half-orc': ['Orc'],
    'dragonborn': ['Draconic'],
    'tiefling': ['Infernal']
  };

  const racialLanguages = racialLanguageMap[raceSlug] || [];
  racialLanguages.forEach(lang => languages.add(lang));

  // Add background languages (simplified)
  const backgroundLanguages: Record<string, string[]> = {
    'Sage': ['Two additional languages of your choice'],
    'Soldier': [],
    'Sailor': [],
    'Criminal': ['Thieves\' Cant'],
    'Entertainer': [],
    'Guild Artisan': ['One additional language of your choice'],
    'Noble': ['One additional language of your choice'],
    'Outlander': ['One additional language of your choice'],
    'Hermit': ['One additional language of your choice'],
    'Folk Hero': [],
    'Acolyte': ['Two additional languages of your choice'],
    'Charlatan': []
  };

  const bgLanguages = backgroundLanguages[background] || [];
  bgLanguages.forEach(lang => {
    if (!lang.includes('additional') && !lang.includes('choice')) {
      languages.add(lang);
    }
  });

  return Array.from(languages).sort();
};

/**
 * Randomize personality traits
 */
export const randomizePersonality = (): { personality: string; ideals: string; bonds: string; flaws: string } => {
  const personalities = [
    "I'm always polite and respectful.",
    "I have a joke for every occasion.",
    "I never pass up a chance to learn something new.",
    "I have a strong sense of fair play.",
    "I am suspicious of strangers and expect the worst of them.",
    "I like to know as much as I can about everything.",
    "I am slow to trust members of other races, townsfolk, or anyone else I don't know.",
    "I am always calm, no matter what the situation.",
    "I idolize a particular hero of my faith.",
    "I see omens in death.",
    "I am always picking things up, absently fiddling with them, and sometimes accidentally breaking them.",
    "I am horribly, horribly awkward in social situations.",
    "I am suspicious of new ideas and new ways of doing things.",
    "I am a sucker for a pretty face.",
    "I am deathly afraid of enclosed spaces.",
    "I am well known for my work, and I want to make certain everyone appreciates it.",
    "I am not used to wearing nice clothes.",
    "I connect everything that happens to me to a grand, cosmic plan.",
    "I am always working on some project or other.",
    "I am terribly jealous of anyone who can outshine my handiwork."
  ];

  const ideals = [
    "Change. We must help bring change about. (Chaotic)",
    "Tradition. The ancient ways of our people must be preserved. (Lawful)",
    "Honor. I will uphold my honor no matter the cost. (Lawful)",
    "Power. I want power, and I will do anything to get it. (Evil)",
    "Family. Blood runs thicker than water. (Any)",
    "Fairness. No one should get preferential treatment. (Lawful)",
    "Freedom. Everyone should be free to pursue his or her livelihood. (Chaotic)",
    "Responsibility. I do what I must and obey just authority. (Lawful)",
    "Independence. I am a free spirit - no one tells me what to do. (Chaotic)",
    "Might. The strongest are meant to rule. (Evil)",
    "Live and Let Live. Meddling in the affairs of others only causes trouble. (Neutral)",
    "Noble Obligation. It is my duty to protect and care for the people beneath me. (Good)",
    "Change. Life is like the seasons, in constant change, and we must change with it. (Chaotic)",
    "Greater Good. My gifts are meant to be shared with all, not used for my own benefit. (Good)",
    "Logic. Emotions must not cloud our logical thinking. (Lawful)",
    "Free Thinking. Inquiry and curiosity are the pillars of progress. (Chaotic)",
    "Power. Knowledge is the path to power and domination. (Evil)",
    "Self-Improvement. The goal of a life of study is the betterment of oneself. (Any)",
    "Respect. Respect is due to me because of my position, but all people regardless of station deserve to be treated with dignity. (Good)",
    "Community. It is the duty of all civilized people to strengthen the bonds of community and the security of civilization. (Lawful)"
  ];

  const bonds = [
    "I owe my guild a great debt for forging me into the person I am today.",
    "I will face any challenge to win the approval of my family.",
    "My honor is my life.",
    "I owe everything to my mentor - a horrible person who's probably rotting in jail somewhere.",
    "I protect those who cannot protect themselves.",
    "I work to preserve a library, university, scriptorium, or monastery.",
    "My town or city is my home, and I'll fight to defend it.",
    "I idolize a hero of the old tales and measure my deeds against that person's.",
    "I am the last of my tribe, and it is up to me to ensure their names enter legend.",
    "I suffer awful visions of a coming disaster and will do anything to prevent it.",
    "It is my duty to provide children to sustain my tribe.",
    "I worked the land, I love the land, and I will protect the land.",
    "A proud noble once gave me a horrible beating, and I will take my revenge on any bully I encounter.",
    "My tools are symbols of my past life, and I carry them so that I will never forget my roots.",
    "I protect those who cannot protect themselves.",
    "I wish my childhood sweetheart had come with me to pursue my destiny.",
    "The workshop where I learned my trade is the most important place in the world to me.",
    "I created an extraordinary work for someone, and then found them unworthy to receive it. I'm still looking for someone worthy.",
    "I owe my survival to another urchin who taught me to live on the streets.",
    "I would still lay down my life for the people I served with."
  ];

  const flaws = [
    "I am suspicious of strangers and expect the worst of them.",
    "Once someone questions my courage, I never back down no matter how dangerous the situation.",
    "Once I start drinking, it's hard for me to stop.",
    "I can't help but pocket loose coins and other trinkets I come across.",
    "I always have a plan for what to do when things go wrong.",
    "I am always calm, no matter what the situation. I never raise my voice or let my emotions control me.",
    "I am incredibly slow to trust. Those who seem the fairest often have the most to hide.",
    "I am suspicious of strangers and expect the worst of them.",
    "I like keeping secrets and won't share them with anyone.",
    "I secretly believe that everyone is beneath me.",
    "I hide a truly scandalous secret that could ruin my family forever.",
    "I too often hear veiled insults and threats in every word addressed to me, and I'm quick to anger at them.",
    "I turn tail and run when things look bad.",
    "When I see something valuable, I can't think about anything but how to steal it.",
    "When faced with a choice between money and my friends, I usually choose the money.",
    "In fact, the worst insult I can receive is to be ignored.",
    "I have no respect for anyone who is not a proven warrior.",
    "I made a terrible mistake in battle that cost many lives - and I would do anything to keep that mistake secret.",
    "My hatred of my enemies is blind and unreasoning.",
    "I obey the law, even if the law causes misery."
  ];

  return {
    personality: getRandomElement(personalities),
    ideals: getRandomElement(ideals),
    bonds: getRandomElement(bonds),
    flaws: getRandomElement(flaws)
  };
};


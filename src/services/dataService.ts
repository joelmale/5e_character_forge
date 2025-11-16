// SRD Data Loader and Transformer
// Transforms 5e SRD JSON format to our app's format
// Supports both 2014 and 2024 editions with 'year' field to distinguish

import srdSpellsMerged from '../data/srd/5e-SRD-Spells-Merged.json';
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
import backgroundsData from '../data/backgrounds.json';
import equipmentPackagesData from '../data/equipmentPackages.json';
import fightingStylesData from '../data/fightingStyles.json';
import raceCategoriesData from '../data/raceCategories.json';
import classCategoriesData from '../data/classCategories.json';
import enhancedClassData from '../data/enhancedClassData.json';
import gameConstantsData from '../data/gameConstants.json';
import levelConstantsData from '../data/levelConstants.json';
import spellcastingTypesData from '../data/spellcastingTypes.json';
import racialLanguagesData from '../data/racialLanguages.json';
import backgroundDefaultsData from '../data/backgroundDefaults.json';
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
  index?: string;
  name: string;
  desc?: string[]; // Raw SRD format
  description?: string; // Already transformed format
  higher_level?: string[];
  higherLevelSlot?: string;
  range: string;
  components: string[];
  material?: string;
  ritual: boolean;
  duration: string;
  concentration: boolean;
  casting_time?: string;
  actionType?: string;
  level: number;
  school: string | { index: string; name: string };
  classes: string[] | Array<{ index: string; name: string }>;
  damage?: {
    damage_type?: { index: string; name: string };
  };
  dc?: {
    dc_type: { index: string; name: string };
  };
  source: '2014' | '2024';
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
  source: '2014' | '2024'; // Source edition
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

export function transformSpell(srdSpell: SRDSpell): AppSpell {
  // Handle different school formats (2014 nested vs 2024 flat)
  const schoolName = typeof srdSpell.school === 'string'
    ? srdSpell.school
    : srdSpell.school.name;

  // Handle different casting time formats
  const castingTime = srdSpell.casting_time || srdSpell.actionType || '1 action';

  // Handle different higher level formats
  const atHigherLevels = srdSpell.higher_level?.join('\n\n') || srdSpell.higherLevelSlot;

  // Handle different class formats
  const classes = Array.isArray(srdSpell.classes) && typeof srdSpell.classes[0] === 'object' && srdSpell.classes[0]?.index
    ? (srdSpell.classes as Array<{ index: string }>).map(c => c.index) // 2014 nested format
    : srdSpell.classes as string[]; // 2024 flat format

  return {
    slug: srdSpell.index || srdSpell.name.toLowerCase().replace(/\s+/g, '-'),
    name: srdSpell.name,
    level: srdSpell.level,
    school: capitalizeSchool(schoolName),
    castingTime,
    range: srdSpell.range,
    components: {
      verbal: srdSpell.components.some((c: string) => c.toLowerCase() === 'v'),
      somatic: srdSpell.components.some((c: string) => c.toLowerCase() === 's'),
      material: srdSpell.components.some((c: string) => c.toLowerCase() === 'm'),
      materialDescription: srdSpell.material,
    },
    duration: srdSpell.duration,
    concentration: srdSpell.concentration,
    ritual: srdSpell.ritual,
    description: srdSpell.description || (srdSpell.desc ? srdSpell.desc.join('\n\n') : ''),
    atHigherLevels,
    damageType: srdSpell.damage?.damage_type?.name,
    saveType: srdSpell.dc ? mapAbilityScore(srdSpell.dc.dc_type.index) : undefined,
    classes,
    source: srdSpell.source,
    year: srdSpell.source === '2024' ? 2024 : 2014,
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
    speed: srdRace.speed,
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
      } else if (option.from && typeof option.from === 'object' && 'equipment_category' in option.from) {
        const fromObj = option.from as { equipment_category?: { name?: string } };
        if (fromObj.equipment_category?.name) {
          options = [[{
            name: `Any ${fromObj.equipment_category.name}`,
            type: 'gear' as const,
            quantity: 1
          }]];
        }
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
  return (srdSpellsMerged as SRDSpell[]).map(spell => transformSpell(spell));
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
export { srdSpellsMerged, srdRaces2014, srdClasses2014, srdEquipment2014, srdEquipment2024, srdFeatures2014, srdSubclasses2014 };


import { SPELL_SLOTS_BY_CLASS } from '../data/spellSlots';
import cantripsData from '../data/cantrips.json';

// --- Static Data and Helper Functions from App.tsx ---

export const PROFICIENCY_BONUSES = gameConstantsData.PROFICIENCY_BONUSES;

export function getModifier(abilityScore: number): number {
  return Math.floor((abilityScore - 10) / 2);
}

export const SKILL_TO_ABILITY: Record<SkillName, AbilityName> = gameConstantsData.SKILL_TO_ABILITY as Record<SkillName, AbilityName>;

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

export const BACKGROUNDS: Background[] = backgroundsData;

// Comprehensive race database with 40+ races from multiple sources
const COMPREHENSIVE_RACES: Race[] = [
  // Core Races (Player's Handbook)
  {
    slug: 'human',
    name: 'Human',
    source: 'PHB',
    speed: 30,
    ability_bonuses: { STR: 1, DEX: 1, CON: 1, INT: 1, WIS: 1, CHA: 1 },
    racial_traits: ['Versatile', 'Skilled'],
    description: 'Humans are the most adaptable and ambitious people among the common races. Whatever drives them, humans are the innovators, the achievers, and the pioneers of the worlds.',
    typicalRoles: ['Fighter', 'Wizard', 'Rogue', 'Cleric', 'Any']
  },
  {
    slug: 'mountain-dwarf',
    name: 'Mountain Dwarf',
    source: 'PHB',
    speed: 25,
    ability_bonuses: { STR: 2, CON: 2 },
    racial_traits: ['Darkvision', 'Dwarven Resilience', 'Stonecunning', 'Dwarven Combat Training', 'Tool Proficiency'],
    description: 'Bold and hardy, dwarves are known as skilled warriors, miners, and workers of stone and metal. Mountain dwarves are strong and hardy inhabitants of the mountains.',
    typicalRoles: ['Fighter', 'Barbarian', 'Cleric', 'Paladin']
  },
  {
    slug: 'hill-dwarf',
    name: 'Hill Dwarf',
    source: 'PHB',
    speed: 25,
    ability_bonuses: { CON: 2, WIS: 1 },
    racial_traits: ['Darkvision', 'Dwarven Resilience', 'Stonecunning', 'Dwarven Combat Training', 'Tool Proficiency'],
    description: 'Bold and hardy, dwarves are known as skilled warriors, miners, and workers of stone and metal. Hill dwarves are wise and tough inhabitants of the hills.',
    typicalRoles: ['Cleric', 'Fighter', 'Barbarian', 'Paladin']
  },
  {
    slug: 'high-elf',
    name: 'High Elf',
    speed: 30,
    source: 'PHB',
    ability_bonuses: { DEX: 2, INT: 1 },
    racial_traits: ['Darkvision', 'Fey Ancestry', 'Trance', 'Elf Weapon Training', 'Cantrip'],
    description: 'Elves are a magical people of otherworldly grace, living in the world but not entirely part of it. High elves are the most common elves, known for their intelligence and magical affinity.',
    typicalRoles: ['Wizard', 'Fighter', 'Rogue', 'Cleric', 'Any']
  },
  {
    slug: 'wood-elf',
    name: 'Wood Elf',
    speed: 30,
    source: 'PHB',
    ability_bonuses: { DEX: 2, WIS: 1 },
    racial_traits: ['Darkvision', 'Fey Ancestry', 'Trance', 'Keen Senses', 'Elf Weapon Training', 'Fleet of Foot', 'Mask of the Wild'],
    description: 'Elves are a magical people of otherworldly grace, living in the world but not entirely part of it. Wood elves are reclusive and suspicious of non-elves.',
    typicalRoles: ['Ranger', 'Druid', 'Fighter', 'Rogue']
  },
  {
    slug: 'drow',
    name: 'Drow (Dark Elf)',
    speed: 30,
    source: 'PHB',
    ability_bonuses: { DEX: 2, CHA: 1 },
    racial_traits: ['Superior Darkvision (120ft)', 'Fey Ancestry', 'Trance', 'Keen Senses', 'Drow Magic', 'Sunlight Sensitivity'],
    description: 'Elves are a magical people of otherworldly grace, living in the world but not entirely part of it. Drow, or dark elves, have black skin that resembles polished obsidian and stark white or pale yellow hair.',
    typicalRoles: ['Wizard', 'Rogue', 'Fighter', 'Warlock']
  },
  {
    slug: 'lightfoot-halfling',
    name: 'Lightfoot Halfling',
    speed: 30,
    source: 'PHB',
    ability_bonuses: { DEX: 2, CHA: 1 },
    racial_traits: ['Lucky', 'Brave', 'Halfling Nimbleness', 'Naturally Stealthy'],
    description: 'Halflings are cheerful, brave, and lucky people who live in close-knit communities. Lightfoot halflings are stealthy and charismatic.',
    typicalRoles: ['Rogue', 'Bard', 'Cleric', 'Wizard', 'Any']
  },
  {
    slug: 'stout-halfling',
    name: 'Stout Halfling',
    speed: 30,
    source: 'PHB',
    ability_bonuses: { DEX: 2, CON: 1 },
    racial_traits: ['Lucky', 'Brave', 'Halfling Nimbleness', 'Stout Resilience (poison advantage)'],
    description: 'Halflings are an affable and cheerful people. They cherish the bonds of family and friendship as well as the comforts of hearth and home. Stout halflings are hardier than average and have some resistance to poison.',
    typicalRoles: ['Rogue', 'Barbarian', 'Fighter', 'Cleric']
  },
  {
    slug: 'forest-gnome',
    name: 'Forest Gnome',
    speed: 30,
    source: 'PHB',
    ability_bonuses: { INT: 2, DEX: 1 },
    racial_traits: ['Darkvision', 'Gnome Cunning', 'Natural Illusionist', 'Speak with Small Beasts'],
    description: 'Gnomes are small folk full of quirky inventiveness. Forest gnomes have a natural knack for illusion and a way with animals.',
    typicalRoles: ['Wizard', 'Druid', 'Bard', 'Rogue']
  },
  {
    slug: 'rock-gnome',
    name: 'Rock Gnome',
    speed: 30,
    source: 'PHB',
    ability_bonuses: { INT: 2, CON: 1 },
    racial_traits: ['Darkvision', 'Gnome Cunning', 'Artificer\'s Lore', 'Tinker'],
    description: 'Gnomes are small folk full of quirky inventiveness. Rock gnomes are natural inventors and tinkerers.',
    typicalRoles: ['Wizard', 'Artificer', 'Bard', 'Rogue']
  },
  {
    slug: 'dragonborn',
    name: 'Dragonborn',
    speed: 30,
    source: 'PHB',
    ability_bonuses: { STR: 2, CHA: 1 },
    racial_traits: ['Draconic Ancestry', 'Breath Weapon', 'Damage Resistance'],
    description: 'Dragonborn look very much like dragons standing erect in humanoid form, though they lack wings or a tail. Dragonborn are proud, honorable warriors.',
    typicalRoles: ['Fighter', 'Barbarian', 'Paladin', 'Sorcerer']
  },
  {
    slug: 'half-elf',
    name: 'Half-Elf',
    speed: 30,
    source: 'PHB',
    ability_bonuses: { CHA: 2 },
    racial_traits: ['Darkvision', 'Fey Ancestry', 'Skill Versatility (2 skills)'],
    description: 'Half-elves combine what some say are the best qualities of their elf and human parents: human curiosity, inventiveness, and ambition tempered by the refined senses, love of nature, and artistic tastes of the elves.',
    typicalRoles: ['Bard', 'Fighter', 'Rogue', 'Paladin', 'Any']
  },
  {
    slug: 'half-orc',
    name: 'Half-Orc',
    speed: 30,
    source: 'PHB',
    ability_bonuses: { STR: 2, CON: 1 },
    racial_traits: ['Darkvision', 'Menacing (Intimidation)', 'Relentless Endurance', 'Savage Attacks'],
    description: 'Half-orcs are the short-tempered and sullen result of human and orc pairings. They are strong and tough, but they are often shunned by both races.',
    typicalRoles: ['Barbarian', 'Fighter', 'Rogue', 'Paladin']
  },
  {
    slug: 'tiefling',
    name: 'Tiefling',
    speed: 30,
    source: 'PHB',
    ability_bonuses: { INT: 1, CHA: 2 },
    racial_traits: ['Darkvision', 'Hellish Resistance (fire)', 'Infernal Legacy'],
    description: 'Tieflings are derived from human bloodlines, and in the broadest possible sense, they still look human. However, their infernal heritage has left a clear imprint on their appearance.',
    typicalRoles: ['Warlock', 'Wizard', 'Rogue', 'Bard']
  },

  // Exotic Races (Volo's Guide to Monsters)
  {
    slug: 'aasimar',
    name: 'Aasimar',
    speed: 30,
    source: 'VGtM',
    ability_bonuses: { WIS: 1, CHA: 2 },
    racial_traits: ['Darkvision', 'Celestial Resistance', 'Healing Hands', 'Light Bearer'],
    description: 'Aasimars are mortals who carry a spark of the Upper Planes within their souls. They are humanoids with a touch of the celestial in their appearance.',
    typicalRoles: ['Paladin', 'Cleric', 'Bard', 'Fighter']
  },
  {
    slug: 'firbolg',
    name: 'Firbolg',
    speed: 30,
    source: 'VGtM',
    ability_bonuses: { STR: 1, WIS: 2 },
    racial_traits: ['Firbolg Magic', 'Hidden Step', 'Powerful Build', 'Speech of Beast and Leaf'],
    description: 'Firbolgs are reclusive giant-kin who dwell in remote forests and mountains. They are peaceful and wise, but they can be terrifying when roused to anger.',
    typicalRoles: ['Druid', 'Barbarian', 'Fighter', 'Cleric']
  },
  {
    slug: 'goliath',
    name: 'Goliath',
    speed: 30,
    source: 'VGtM',
    ability_bonuses: { STR: 2, CON: 1 },
    racial_traits: ['Stone\'s Endurance', 'Powerful Build', 'Mountain Born'],
    description: 'Goliaths are strong and reclusive people who dwell in remote mountain peaks. They are known for their great strength and endurance.',
    typicalRoles: ['Barbarian', 'Fighter', 'Ranger', 'Paladin']
  },
  {
    slug: 'kenku',
    name: 'Kenku',
    speed: 30,
    source: 'VGtM',
    ability_bonuses: { DEX: 2, WIS: 1 },
    racial_traits: ['Expert Forgery', 'Kenku Training', 'Mimicry'],
    description: 'Kenku are crow-like humanoids who were transformed by powerful magic. They are cunning and resourceful, but they cannot speak except by mimicking sounds they have heard.',
    typicalRoles: ['Rogue', 'Bard', 'Monk', 'Wizard']
  },
  {
    slug: 'tabaxi',
    name: 'Tabaxi',
    speed: 30,
    source: 'VGtM',
    ability_bonuses: { DEX: 2, CHA: 1 },
    racial_traits: ['Darkvision', 'Feline Agility', 'Cat\'s Claws', 'Cat\'s Talent'],
    description: 'Tabaxi are cat-like humanoids who hail from distant jungles. They are curious, agile, and often follow their whims.',
    typicalRoles: ['Rogue', 'Bard', 'Druid', 'Fighter']
  },
  {
    slug: 'triton',
    name: 'Triton',
    speed: 30,
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
    speed: 30,
    source: 'VGtM',
    ability_bonuses: { STR: 2, DEX: 1 },
    racial_traits: ['Darkvision', 'Long-Limbed', 'Powerful Build', 'Sneaky', 'Surprise Attack'],
    description: 'Bugbears are hulking, furry goblinoids that tower over their goblin and hobgoblin kin. They are stealthy predators who strike from the shadows.',
    typicalRoles: ['Rogue', 'Barbarian', 'Fighter', 'Ranger']
  },
  {
    slug: 'goblin',
    name: 'Goblin',
    speed: 30,
    source: 'VGtM',
    ability_bonuses: { DEX: 2, CON: 1 },
    racial_traits: ['Darkvision', 'Fury of the Small', 'Nimble Escape'],
    description: 'Goblins are small, green-skinned creatures that dwell in dark, cramped places. They are cunning and vicious, but they are often cowardly.',
    typicalRoles: ['Rogue', 'Wizard', 'Bard', 'Warlock']
  },
  {
    slug: 'hobgoblin',
    name: 'Hobgoblin',
    speed: 30,
    source: 'VGtM',
    ability_bonuses: { CON: 2, INT: 1 },
    racial_traits: ['Darkvision', 'Martial Training', 'Saving Face'],
    description: 'Hobgoblins are large, militaristic goblinoids that organize themselves into legions. They are disciplined warriors who value honor and tradition.',
    typicalRoles: ['Fighter', 'Barbarian', 'Rogue', 'Wizard']
  },
  {
    slug: 'kobold',
    name: 'Kobold',
    speed: 30,
    source: 'VGtM',
    ability_bonuses: { DEX: 2, STR: -2 },
    racial_traits: ['Darkvision', 'Grovel, Cower, and Beg', 'Pack Tactics', 'Sunlight Sensitivity'],
    description: 'Kobolds are small, reptilian humanoids that dwell in dark places. They are cowardly and subservient, but they can be surprisingly cunning.',
    typicalRoles: ['Rogue', 'Wizard', 'Sorcerer', 'Warlock']
  },
  {
    slug: 'orc',
    name: 'Orc',
    speed: 30,
    source: 'VGtM',
    ability_bonuses: { STR: 2, CON: 1, INT: -2 },
    racial_traits: ['Darkvision', 'Aggressive', 'Menacing (Intimidation)', 'Powerful Build'],
    description: 'Orcs are brutish, green-skinned humanoids that dwell in tribal societies. They are fierce warriors who revel in battle.',
    typicalRoles: ['Barbarian', 'Fighter', 'Rogue', 'Shaman']
  },
  {
    slug: 'yuan-ti-pureblood',
    name: 'Yuan-Ti Pureblood',
    speed: 30,
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
    speed: 30,
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
    speed: 30,
    ability_bonuses: { DEX: 2, WIS: 1 },
    racial_traits: ['Hare-Trigger', 'Leporine Senses', 'Lucky Footwork', 'Rabbit Hop'],
    description: 'Harengons are rabbit-like humanoids who hail from the Feywild. They are quick and lucky, with enhanced senses and agility.',
    typicalRoles: ['Rogue', 'Ranger', 'Bard', 'Monk']
  },
  {
    slug: 'loxodon',
    name: 'Loxodon',
    speed: 30,
    source: 'GGtR',
    ability_bonuses: { CON: 2, WIS: 1 },
    racial_traits: ['Powerful Build', 'Loxodon Serenity', 'Natural Armor', 'Trunk'],
    description: 'Loxodons are elephant-like humanoids known for their wisdom and calm demeanor. They are peaceful and introspective.',
    typicalRoles: ['Cleric', 'Druid', 'Monk', 'Paladin']
  },
  {
    slug: 'owlin',
    name: 'Owlin',
    speed: 30,
    source: 'Strixhaven',
    ability_bonuses: { DEX: 2, WIS: 1 },
    racial_traits: ['Darkvision', 'Flight', 'Silent Feathers'],
    description: 'Owlin are owl-like humanoids who can fly silently through the night. They are wise and observant.',
    typicalRoles: ['Druid', 'Wizard', 'Rogue', 'Cleric']
  },
  {
    slug: 'githyanki',
    name: 'Githyanki',
    speed: 30,
    source: 'MToF',
    ability_bonuses: { STR: 1, INT: 1 },
    racial_traits: ['Decadent Mastery', 'Githyanki Psionics', 'Martial Prodigy'],
    description: 'Githyanki are humanoid warriors from the Astral Plane. They are fierce fighters with psionic abilities.',
    typicalRoles: ['Fighter', 'Wizard', 'Rogue', 'Barbarian']
  },
  {
    slug: 'fire-genasi',
    name: 'Fire Genasi',
    speed: 30,
    source: 'EE',
    ability_bonuses: { CON: 2, INT: 1 },
    racial_traits: ['Darkvision', 'Fire Resistance', 'Reach to the Blaze'],
    description: 'Fire genasi are humanoids infused with elemental fire. They have a fiery temper and resistance to heat.',
    typicalRoles: ['Sorcerer', 'Fighter', 'Barbarian', 'Wizard']
  }
];

interface RaceCategoryData {
  name: string;
  icon: string;
  description: string;
  filterCriteria: {
    source?: string;
    sources?: string[];
    slugs?: string[];
  };
}

export const RACE_CATEGORIES: RaceCategory[] = raceCategoriesData.map((category: RaceCategoryData) => ({
  name: category.name,
  icon: category.icon,
  description: category.description,
  races: category.filterCriteria.source
    ? COMPREHENSIVE_RACES.filter(race => race.source === category.filterCriteria.source)
    : category.filterCriteria.sources
    ? COMPREHENSIVE_RACES.filter(race => category.filterCriteria.sources?.includes(race.source))
    : category.filterCriteria.slugs
    ? COMPREHENSIVE_RACES.filter(race =>
        ['VGtM'].includes(race.source) && category.filterCriteria.slugs?.includes(race.slug)
      )
    : []
}));

// Enhanced class data with rich descriptions and categorization
interface EnhancedClassData {
  [key: string]: Partial<Class>;
}

interface ClassCategoryData {
  name: string;
  icon: string;
  description: string;
  classSlugs: string[];
}

// Helper function to get enhanced class data
export function getEnhancedClassData(classSlug: string): Partial<Class> | undefined {
  return (enhancedClassData as EnhancedClassData)[classSlug];
}

// Enhanced class categories with rich data
export const CLASS_CATEGORIES: ClassCategory[] = classCategoriesData.map((category: ClassCategoryData) => ({
  name: category.name,
  icon: category.icon,
  description: category.description,
  classes: loadClasses().filter(cls =>
    category.classSlugs.includes(cls.slug)
  ).map(cls => {
    const enhanced = (enhancedClassData as EnhancedClassData)[cls.slug];
    return enhanced ? { ...cls, ...enhanced } : cls;
  })
}));

export const EQUIPMENT_PACKAGES: EquipmentPackage[] = equipmentPackagesData;

export const FIGHTING_STYLES: FightingStyle[] = fightingStylesData;

export { SPELL_SLOTS_BY_CLASS, cantripsData as CANTRIPS_KNOWN_BY_CLASS };

// New JSON data exports
export const SPELLCASTING_TYPE_MAP = spellcastingTypesData.SPELLCASTING_TYPE_MAP;
export const RACIAL_LANGUAGE_MAP = racialLanguagesData.RACIAL_LANGUAGE_MAP;
export const BACKGROUND_DEFAULTS = backgroundDefaultsData.BACKGROUND_DEFAULTS;

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
  const milestoneLevels = levelConstantsData.milestoneLevels;
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

interface CantripsData {
  [key: string]: {
    [key: number]: number;
  };
}

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
  const cantripLimit = (cantripsData as CantripsData)[classSlug]?.[level] || 0;
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

/**
 * Extract proficiencies from race data
 */
export const getRaceProficiencies = (raceSlug: string): { armor?: string[]; weapons?: string[]; tools?: string[] } => {
  const race = loadRaces().find(r => r.slug === raceSlug);
  if (!race) return { armor: [], weapons: [], tools: [] };

  const proficiencies: { armor?: string[]; weapons?: string[]; tools?: string[] } = {
    armor: [],
    weapons: [],
    tools: []
  };

  // Check racial traits for proficiency information
  race.racial_traits.forEach(trait => {
    const traitLower = trait.toLowerCase();

    // Armor proficiencies
    if (traitLower.includes('light armor') || traitLower.includes('medium armor') || traitLower.includes('heavy armor') || traitLower.includes('shields')) {
      if (!proficiencies.armor) proficiencies.armor = [];
      if (traitLower.includes('light')) proficiencies.armor.push('Light armor');
      if (traitLower.includes('medium')) proficiencies.armor.push('Medium armor');
      if (traitLower.includes('heavy')) proficiencies.armor.push('Heavy armor');
      if (traitLower.includes('shields')) proficiencies.armor.push('Shields');
    }

    // Weapon proficiencies
    if (traitLower.includes('weapon training') || traitLower.includes('combat training')) {
      if (!proficiencies.weapons) proficiencies.weapons = [];
      // This is a simplified extraction - in a real implementation, you'd parse the trait descriptions
      if (traitLower.includes('battleaxe') || traitLower.includes('handaxe') || traitLower.includes('warhammer')) {
        proficiencies.weapons.push('Battleaxe', 'Handaxe', 'Light hammer', 'Warhammer');
      }
    }

    // Tool proficiencies
    if (traitLower.includes('tool proficiency') || traitLower.includes('smith') || traitLower.includes('brewer')) {
      if (!proficiencies.tools) proficiencies.tools = [];
      if (traitLower.includes('smith')) proficiencies.tools.push('Smith\'s tools');
      if (traitLower.includes('brewer')) proficiencies.tools.push('Brewer\'s supplies');
    }
  });

  return proficiencies;
};

/**
 * Extract proficiencies from class data
 */
export const getClassProficiencies = (classSlug: string): { armor?: string[]; weapons?: string[]; tools?: string[] } => {
  const classData = loadClasses().find(c => c.slug === classSlug);
  if (!classData) return { armor: [], weapons: [], tools: [] };

  const proficiencies: { armor?: string[]; weapons?: string[]; tools?: string[] } = {
    armor: [],
    weapons: [],
    tools: []
  };

  // Extract from class features and descriptions
  const classDesc = classData.description.toLowerCase();

  // Armor proficiencies
  if (classDesc.includes('light armor')) {
    if (!proficiencies.armor) proficiencies.armor = [];
    proficiencies.armor.push('Light armor');
  }
  if (classDesc.includes('medium armor')) {
    if (!proficiencies.armor) proficiencies.armor = [];
    proficiencies.armor.push('Medium armor');
  }
  if (classDesc.includes('heavy armor')) {
    if (!proficiencies.armor) proficiencies.armor = [];
    proficiencies.armor.push('Heavy armor');
  }
  if (classDesc.includes('shields')) {
    if (!proficiencies.armor) proficiencies.armor = [];
    proficiencies.armor.push('Shields');
  }

  // Weapon proficiencies
  if (classDesc.includes('simple weapons')) {
    if (!proficiencies.weapons) proficiencies.weapons = [];
    proficiencies.weapons.push('Simple weapons');
  }
  if (classDesc.includes('martial weapons')) {
    if (!proficiencies.weapons) proficiencies.weapons = [];
    proficiencies.weapons.push('Martial weapons');
  }

  // Tool proficiencies
  if (classDesc.includes('thieves\' tools')) {
    if (!proficiencies.tools) proficiencies.tools = [];
    proficiencies.tools.push('Thieves\' tools');
  }

  return proficiencies;
};

/**
 * Extract proficiencies from background data
 */
export const getBackgroundProficiencies = (background: string): { armor?: string[]; weapons?: string[]; tools?: string[] } => {
  // Simplified background proficiency extraction
  const proficiencies: { armor?: string[]; weapons?: string[]; tools?: string[] } = {};

  const bgLower = background.toLowerCase();

  // Tool proficiencies based on background
  if (bgLower.includes('criminal') || bgLower.includes('spy')) {
    proficiencies.tools = ['Thieves\' tools'];
  }
  if (bgLower.includes('entertainer')) {
    proficiencies.tools = ['Disguise kit', 'One musical instrument'];
  }
  if (bgLower.includes('guild artisan')) {
    proficiencies.tools = ['One type of artisan\'s tools'];
  }

  return proficiencies;
};

/**
 * Aggregate proficiencies from race, class, and background
 */
export const aggregateProficiencies = (raceSlug: string, classSlug: string, background: string): { armor?: string[]; weapons?: string[]; tools?: string[] } => {
  const raceProf = getRaceProficiencies(raceSlug);
  const classProf = getClassProficiencies(classSlug);
  const backgroundProf = getBackgroundProficiencies(background);

  const aggregated: { armor: string[]; weapons: string[]; tools: string[] } = {
    armor: [],
    weapons: [],
    tools: []
  };

  // Merge armor proficiencies
  const armorSet = new Set([...(raceProf.armor || []), ...(classProf.armor || []), ...(backgroundProf.armor || [])]);
  aggregated.armor = Array.from(armorSet);

  // Merge weapon proficiencies
  const weaponSet = new Set([...(raceProf.weapons || []), ...(classProf.weapons || []), ...(backgroundProf.weapons || [])]);
  aggregated.weapons = Array.from(weaponSet);

  // Merge tool proficiencies
  const toolSet = new Set([...(raceProf.tools || []), ...(classProf.tools || []), ...(backgroundProf.tools || [])]);
  aggregated.tools = Array.from(toolSet);

  return aggregated;
};

/**
 * Get hit die for a character class
 */
export const getHitDieForClass = (classSlug: string): number => {
  // Extract base class name from slug (e.g., 'wizard-evocation' -> 'wizard')
  const baseClass = classSlug.split('-')[0];

  const hitDice: Record<string, number> = {
    'barbarian': 12,
    'fighter': 10,
    'paladin': 10,
    'ranger': 10,
    'bard': 8,
    'cleric': 8,
    'druid': 8,
    'monk': 8,
    'rogue': 8,
    'sorcerer': 6,
    'warlock': 8,
    'wizard': 6,
  };

  return hitDice[baseClass] || 8; // Default to d8 if class not found
};


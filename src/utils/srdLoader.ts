// SRD Data Loader and Transformer
// Transforms 5e SRD JSON format to our app's format
// Supports both 2014 and 2024 editions with 'year' field to distinguish

import srdSpells2014 from '../data/srd/2014/5e-SRD-Spells.json';
import srdRaces2014 from '../data/srd/2014/5e-SRD-Races.json';
import srdClasses2014 from '../data/srd/2014/5e-SRD-Classes.json';
import srdEquipment2014 from '../data/srd/2014/5e-SRD-Equipment.json';
import srdEquipment2024 from '../data/srd/2024/5e-SRD-Equipment.json';

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

// --- App Type Definitions (matching App.tsx) ---
type AbilityName = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';
type SchoolName = 'Abjuration' | 'Conjuration' | 'Divination' | 'Enchantment' | 'Evocation' | 'Illusion' | 'Necromancy' | 'Transmutation';

interface AppSpell {
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

interface AppRace {
  slug: string;
  name: string;
  source: string;
  ability_bonuses: Partial<Record<AbilityName, number>>;
  racial_traits: string[];
  description: string;
  typicalRoles: string[];
  year: number;
}

interface AppClass {
  slug: string;
  name: string;
  source: string;
  hit_die: number;
  primary_stat: string;
  save_throws: string[];
  skill_proficiencies: string[];
  num_skill_choices?: number;
  class_features: string[];
  description: string;
  keyRole: string;
  year: number;
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

export function transformRace(srdRace: SRDRace, year: number = 2014): AppRace {
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
    year,
  };
}

export function transformClass(srdClass: SRDClass, year: number = 2014): AppClass {
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
    year,
  };
}

// --- Data Loading Functions ---

export function loadSpells(): AppSpell[] {
  const spells2014 = (srdSpells2014 as SRDSpell[]).map(spell => transformSpell(spell, 2014));
  return spells2014;
}

export function loadRaces(): AppRace[] {
  const races2014 = (srdRaces2014 as SRDRace[]).map(race => transformRace(race, 2014));
  return races2014;
}

export function loadClasses(): AppClass[] {
  const classes2014 = (srdClasses2014 as SRDClass[]).map(cls => transformClass(cls, 2014));
  return classes2014;
}

// Export raw data for reference
export { srdSpells2014, srdRaces2014, srdClasses2014, srdEquipment2014, srdEquipment2024 };

// Spell management utilities for character creation and campaign play
import { SpellcastingType, Class, Character, SpellSelectionData } from '../types/dnd';
import { getLeveledSpellsByClass } from '../services/dataService';

// Map class slugs to spellcasting types
const SPELLCASTING_TYPE_MAP: Record<string, SpellcastingType> = {
  // Known Casters
  'bard': 'known',
  'sorcerer': 'known',
  'warlock': 'known',
  'ranger': 'known',

  // Prepared Casters
  'cleric': 'prepared',
  'druid': 'prepared',
  'paladin': 'prepared',
  'artificer': 'prepared',

  // Wizard (Special)
  'wizard': 'wizard'
};

/**
 * Get the spellcasting type for a given class
 */
export function getSpellcastingType(classSlug: string): SpellcastingType | null {
  return SPELLCASTING_TYPE_MAP[classSlug] || null;
}

/**
 * Check if a class is a spellcaster
 */
export function isSpellcaster(classSlug: string): boolean {
  return getSpellcastingType(classSlug) !== null;
}

/**
 * Calculate spell save DC
 */
export function calculateSpellSaveDC(abilities: Record<string, number>, spellcastingAbility: string): number {
  const modifier = Math.floor((abilities[spellcastingAbility] - 10) / 2);
  return 8 + modifier + 2; // +2 for proficiency bonus at level 1
}

/**
 * Calculate spell attack bonus
 */
export function calculateSpellAttackBonus(abilities: Record<string, number>, spellcastingAbility: string): number {
  const modifier = Math.floor((abilities[spellcastingAbility] - 10) / 2);
  return modifier + 2; // +2 for proficiency bonus at level 1
}

/**
 * Get the maximum number of spells that can be prepared
 */
export function getMaxPreparedSpells(abilities: Record<string, number>, spellcastingAbility: string, characterLevel: number): number {
  const modifier = Math.floor((abilities[spellcastingAbility] - 10) / 2);
  return Math.max(1, modifier + characterLevel);
}

/**
 * Validate spell selection data for a given class and level
 */
export function validateSpellSelection(
  spellSelection: SpellSelectionData,
  classData: Class,
  characterLevel: number = 1
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const spellcastingType = getSpellcastingType(classData.slug);

  if (!spellcastingType || !classData.spellcasting) {
    return { isValid: true, errors: [] }; // Not a spellcaster
  }

  const spellcasting = classData.spellcasting;

  // Validate cantrips
  if (spellSelection.selectedCantrips.length !== spellcasting.cantripsKnown) {
    errors.push(`Must select exactly ${spellcasting.cantripsKnown} cantrips`);
  }

  // Validate based on spellcasting type
  switch (spellcastingType) {
    case 'known':
      if (!spellSelection.knownSpells || spellSelection.knownSpells.length !== spellcasting.spellsKnownOrPrepared) {
        errors.push(`Must select exactly ${spellcasting.spellsKnownOrPrepared} known spells`);
      }
      break;

    case 'prepared':
      if (!spellSelection.preparedSpells || spellSelection.preparedSpells.length !== spellcasting.spellsKnownOrPrepared) {
        errors.push(`Must select exactly ${spellcasting.spellsKnownOrPrepared} prepared spells`);
      }
      break;

    case 'wizard':
      // Validate spellbook (6 spells)
      if (!spellSelection.spellbook || spellSelection.spellbook.length !== 6) {
        errors.push('Must select exactly 6 spells for your spellbook');
      }
      // Validate daily preparation (INT modifier + level)
      const maxPrepared = getMaxPreparedSpells({ INT: 16 }, 'INT', characterLevel); // Default INT 16 for validation
      if (!spellSelection.dailyPrepared || spellSelection.dailyPrepared.length > maxPrepared) {
        errors.push(`Can prepare at most ${maxPrepared} spells per day`);
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Convert character creation spell selection to campaign character spellcasting data
 */
export function migrateSpellSelectionToCharacter(
  spellSelection: SpellSelectionData,
  classData: Class,
  abilities: Record<string, number>,
  characterLevel: number = 1
): Character['spellcasting'] {

  const spellcastingType = getSpellcastingType(classData.slug);
  if (!spellcastingType || !classData.spellcasting) {
    return undefined;
  }

  const spellcasting = classData.spellcasting;
  const baseSpellcasting = {
    ability: spellcasting.ability,
    spellSaveDC: calculateSpellSaveDC(abilities, spellcasting.ability),
    spellAttackBonus: calculateSpellAttackBonus(abilities, spellcasting.ability),
    cantripsKnown: spellSelection.selectedCantrips,
    spellSlots: [...spellcasting.spellSlots],
    usedSpellSlots: new Array(spellcasting.spellSlots.length).fill(0),
    spellcastingType,
    cantripChoicesByLevel: { [characterLevel]: spellSelection.selectedCantrips.join(',') }
  };

  switch (spellcastingType) {
    case 'known':
      return {
        ...baseSpellcasting,
        spellsKnown: spellSelection.knownSpells || spellSelection.selectedSpells || []
      };

    case 'prepared':
      return {
        ...baseSpellcasting,
        spellsKnown: getLeveledSpellsByClass(classData.slug, characterLevel).map((s: any) => s.slug),
        preparedSpells: spellSelection.preparedSpells || spellSelection.selectedSpells || []
      };

    case 'wizard':
      return {
        ...baseSpellcasting,
        spellbook: spellSelection.spellbook || spellSelection.selectedSpells || [],
        preparedSpells: spellSelection.dailyPrepared || []
      };

    default:
      return baseSpellcasting;
  }
}
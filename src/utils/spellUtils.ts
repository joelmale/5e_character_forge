// Spell management utilities for character creation and campaign play
import { SpellcastingType, Class, Character, SpellSelectionData } from '../types/dnd';
import { getCantripsByClass, getLeveledSpellsByClass, loadClasses, AppSpell } from '../services/dataService';
import { SPELL_SLOT_TABLES } from '../data/spellSlots';
import { SPELL_LEARNING_RULES } from '../data/spellLearning';
import spellcastingTypesData from '../data/spellcastingTypes.json';

// Map class slugs to spellcasting types
const SPELLCASTING_TYPE_MAP: Record<string, SpellcastingType> = spellcastingTypesData.SPELLCASTING_TYPE_MAP as Record<string, SpellcastingType>;

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

    case 'wizard': {
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
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Check if a class has spellcasting available at the current level
 */
export function hasSpellcastingAtLevel(classSlug: string): boolean {
  const allClasses = loadClasses();
  const selectedClass = allClasses.find((c: Class) => c.slug === classSlug);

  if (!selectedClass || !selectedClass.spellcasting) {
    return false;
  }

  // Check if they have any spells available at this level
  return selectedClass.spellcasting.cantripsKnown > 0 ||
         selectedClass.spellcasting.spellsKnownOrPrepared > 0;
}

/**
 * Get available spells for character creation
 */
export function getAvailableSpellsForCreation(classSlug: string, level: number) {
  return {
    cantrips: getCantripsByClass(classSlug),
    spells: getLeveledSpellsByClass(classSlug, level)
  };
}

/**
 * Check if spell selections are complete for character creation
 */
export function areSpellSelectionsComplete(
  spellSelection: SpellSelectionData,
  classSlug: string,
  level: number,
  abilities: Record<string, number>
): boolean {
  const allClasses = loadClasses();
  const selectedClass = allClasses.find(c => c.slug === classSlug);

  if (!selectedClass?.spellcasting) {
    return true; // Non-spellcasters are always "complete"
  }

  const spellcasting = selectedClass.spellcasting;
  const spellcastingType = getSpellcastingType(classSlug);

  // Check cantrips
  const cantripsComplete = spellSelection.selectedCantrips.length === spellcasting.cantripsKnown;

  let spellsComplete = false;
  if (spellcastingType === 'known') {
    spellsComplete = (spellSelection.knownSpells?.length || 0) === spellcasting.spellsKnownOrPrepared;
  } else if (spellcastingType === 'prepared') {
    spellsComplete = (spellSelection.preparedSpells?.length || 0) === spellcasting.spellsKnownOrPrepared;
  } else if (spellcastingType === 'wizard') {
    const spellbookComplete = (spellSelection.spellbook?.length || 0) === 6;
    const maxPrepared = getMaxPreparedSpells(abilities, 'INT', level);
    const dailyComplete = (spellSelection.dailyPrepared?.length || 0) === maxPrepared;
    spellsComplete = spellbookComplete && dailyComplete;
  }

  return cantripsComplete && spellsComplete;
}

/**
 * Clean up invalid spell selections when character data changes
 */
export function cleanupInvalidSpellSelections(
  spellSelection: SpellSelectionData,
  classSlug: string,
  level: number,
  abilities: Record<string, number>
): SpellSelectionData {
  const allClasses = loadClasses();
  const selectedClass = allClasses.find(c => c.slug === classSlug);

  if (!selectedClass?.spellcasting) {
    return spellSelection;
  }

  const spellcasting = selectedClass.spellcasting;
  const spellcastingType = getSpellcastingType(classSlug);
  const updatedSelection = { ...spellSelection };

  // Validate cantrips
  updatedSelection.selectedCantrips = spellSelection.selectedCantrips.slice(0, spellcasting.cantripsKnown);

  // Validate based on spellcasting type
  if (spellcastingType === 'known') {
    updatedSelection.knownSpells = (spellSelection.knownSpells || []).slice(0, spellcasting.spellsKnownOrPrepared);
  } else if (spellcastingType === 'prepared') {
    updatedSelection.preparedSpells = (spellSelection.preparedSpells || []).slice(0, spellcasting.spellsKnownOrPrepared);
  } else if (spellcastingType === 'wizard') {
    // Validate spellbook (6 spells)
    updatedSelection.spellbook = (spellSelection.spellbook || []).slice(0, 6);
    // Validate daily preparation
    const maxPrepared = getMaxPreparedSpells(abilities, 'INT', level);
    updatedSelection.dailyPrepared = (spellSelection.dailyPrepared || []).slice(0, maxPrepared);
  }

  return updatedSelection;
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
  const slotRules = SPELL_SLOT_TABLES[classData.slug];
  const learningRules = SPELL_LEARNING_RULES[classData.slug];

  // Get correct spell slots for the character's level
  const spellSlots = slotRules?.byLevel?.[characterLevel] || spellcasting.spellSlots;

  const baseSpellcasting = {
    ability: spellcasting.ability,
    spellSaveDC: calculateSpellSaveDC(abilities, spellcasting.ability),
    spellAttackBonus: calculateSpellAttackBonus(abilities, spellcasting.ability),
    cantripsKnown: spellSelection.selectedCantrips,
    spellSlots: [...spellSlots],
    usedSpellSlots: new Array(spellSlots.length).fill(0),
    spellcastingType,
    cantripChoicesByLevel: { [characterLevel]: spellSelection.selectedCantrips.join(',') }
  };

  switch (learningRules?.type) {
    case 'known':
      return {
        ...baseSpellcasting,
        spellsKnown: spellSelection.knownSpells || spellSelection.selectedSpells || []
      };

    case 'prepared':
      return {
        ...baseSpellcasting,
        spellsKnown: getLeveledSpellsByClass(classData.slug, characterLevel).map((s: AppSpell) => s.slug),
        preparedSpells: spellSelection.preparedSpells || spellSelection.selectedSpells || []
      };

    case 'spellbook':
      return {
        ...baseSpellcasting,
        spellbook: spellSelection.spellbook || spellSelection.selectedSpells || [],
        preparedSpells: spellSelection.dailyPrepared || []
      };

    default:
      return baseSpellcasting;
  }
}
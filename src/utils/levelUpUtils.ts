/**
 * Level-Up Utilities
 *
 * Core calculation logic for character level advancement.
 * Handles HP increases, spell slot progression, feature grants, and player choices.
 */

import { Character, LevelUpChoices } from '../types/dnd';
import {
  ClassProgression,
  LevelUpData,
  LevelUpRecord,
  FeatureChoice,
  grantsASI
} from '../data/classProgression';
import { fighter2024Progression } from '../data/progressions/fighter2024';
import { paladin2024Progression } from '../data/progressions/paladin2024';
import { ranger2024Progression } from '../data/progressions/ranger2024';
import { wizard2024Progression } from '../data/progressions/wizard2024';
import { barbarian2024Progression } from '../data/progressions/barbarian2024';
import { monk2024Progression } from '../data/progressions/monk2024';
import { rogue2024Progression } from '../data/progressions/rogue2024';
import { PROFICIENCY_BONUSES, CANTRIPS_KNOWN_BY_CLASS, loadSpells, loadFeats } from '../services/dataService';
import { SPELL_LEARNING_RULES } from '../data/spellLearning';
import { SPELL_SLOTS_BY_CLASS } from '../data/spellSlots';

/**
 * Get the class progression data for a given class
 */
export function getClassProgression(classSlug: string, edition: '2014' | '2024' = '2024'): ClassProgression | null {
  // Implemented class progressions
  if (classSlug === 'barbarian' && edition === '2024') {
    return barbarian2024Progression;
  }
  if (classSlug === 'fighter' && edition === '2024') {
    return fighter2024Progression;
  }
  if (classSlug === 'monk' && edition === '2024') {
    return monk2024Progression;
  }
  if (classSlug === 'rogue' && edition === '2024') {
    return rogue2024Progression;
  }
  if (classSlug === 'paladin' && edition === '2024') {
    return paladin2024Progression;
  }
  if (classSlug === 'ranger' && edition === '2024') {
    return ranger2024Progression;
  }
  if (classSlug === 'wizard' && edition === '2024') {
    return wizard2024Progression;
  }

  // TODO: Add other class progressions as they are implemented
  return null;
}

/**
 * Calculate all data needed for a level-up
 */
export function calculateLevelUpData(character: Character): LevelUpData | null {
  const fromLevel = character.level;
  const toLevel = fromLevel + 1;

  if (toLevel > 20) {
    return null; // Max level reached
  }

  // Get class progression data
  const progression = getClassProgression(character.class.toLowerCase(), character.edition);
  if (!progression) {
    // Fallback for classes without progression data yet
    return createFallbackLevelUpData(character, fromLevel, toLevel);
  }

  // Get features for the new level
  const featuresAtLevel = progression.features.filter(f => f.level === toLevel);

  // Determine if any choices are required
  const choices: FeatureChoice[] = [];
  featuresAtLevel.forEach(feature => {
    if (!feature.automatic && feature.choices) {
      choices.push(...feature.choices);
    }
  });

  // Calculate HP gain
  const hitDie = progression.hitDie;
  const conModifier = character.abilities.CON.modifier;
  const averageHpGain = Math.floor(parseInt(hitDie.substring(1)) / 2) + 1 + conModifier;

  // Calculate new proficiency bonus
  const newProficiencyBonus = PROFICIENCY_BONUSES[toLevel - 1];

  // Calculate spell slot changes (for spellcasters)
  let newSpellSlots: Record<string, number> | undefined;
  let newCantripsKnown: number | undefined;
  let newSpellsKnown: number | undefined;

  if (character.spellcasting) {
    const classSlug = character.class.toLowerCase();
    const currentSlots = SPELL_SLOTS_BY_CLASS[classSlug]?.[fromLevel] || [];
    const nextLevelSlots = SPELL_SLOTS_BY_CLASS[classSlug]?.[toLevel] || [];

    // Check if spell slots changed
    if (JSON.stringify(currentSlots) !== JSON.stringify(nextLevelSlots)) {
      newSpellSlots = {};
      nextLevelSlots.forEach((count, level) => {
        if (level > 0 && count > (currentSlots[level] || 0)) {
          newSpellSlots![`level${level}`] = count;
        }
      });
    }

    // Check if cantrips known changed
    const currentCantrips = (CANTRIPS_KNOWN_BY_CLASS as Record<string, Record<string, number>>)[classSlug]?.[fromLevel.toString()] || 0;
    const nextCantrips = (CANTRIPS_KNOWN_BY_CLASS as Record<string, Record<string, number>>)[classSlug]?.[toLevel.toString()] || 0;
    if (nextCantrips > currentCantrips) {
      newCantripsKnown = nextCantrips;
    }

    // For known casters, calculate new spells known
    if (character.spellcasting.spellcastingType === 'known') {
      const learningRules = SPELL_LEARNING_RULES[classSlug];
      if (learningRules && learningRules.spellsKnown) {
        const currentSpellsKnown = character.spellcasting.spellsKnown?.length || 0;
        const expectedSpellsKnown = learningRules.spellsKnown[toLevel - 1] || 0; // Array is 0-indexed
        const spellsToLearn = Math.max(0, expectedSpellsKnown - currentSpellsKnown);
        if (spellsToLearn > 0) {
          newSpellsKnown = spellsToLearn;
        }
      }
    }

    // Add spell choice if appropriate
    if (newCantripsKnown || newSpellsKnown) {
      choices.push({
        type: 'spells',
        description: `Learn new spells at level ${toLevel}`,
        count: (newCantripsKnown ? 1 : 0) + (newSpellsKnown || 0)
      });
    }
  }

  return {
    fromLevel,
    toLevel,
    newProficiencyBonus,
    hitDie,
    conModifier,
    averageHpGain,
    newSpellSlots,
    newCantripsKnown,
    newSpellsKnown,
    features: featuresAtLevel,
    requiresChoices: choices.length > 0,
    choices
  };
}

/**
 * Fallback level-up calculation for classes without progression data
 */
function createFallbackLevelUpData(
  character: Character,
  fromLevel: number,
  toLevel: number
): LevelUpData {
  const classSlug = character.class.toLowerCase();

  // Determine hit die based on class
  const hitDieMap: Record<string, string> = {
    'barbarian': 'd12',
    'fighter': 'd10',
    'paladin': 'd10',
    'ranger': 'd10',
    'monk': 'd8',
    'rogue': 'd8',
    'bard': 'd8',
    'cleric': 'd8',
    'druid': 'd8',
    'warlock': 'd8',
    'sorcerer': 'd6',
    'wizard': 'd6'
  };
  const hitDie = hitDieMap[classSlug] || 'd8';

  const conModifier = character.abilities.CON.modifier;
  const averageHpGain = Math.floor(parseInt(hitDie.substring(1)) / 2) + 1 + conModifier;
  const newProficiencyBonus = PROFICIENCY_BONUSES[toLevel - 1];

  // Check for ASI/Feat
  const choices: FeatureChoice[] = [];
  if (grantsASI(toLevel, classSlug)) {
    choices.push({
      type: 'asi',
      description: 'Increase ability scores or choose a feat',
      count: 2
    });
  }

  return {
    fromLevel,
    toLevel,
    newProficiencyBonus,
    hitDie,
    conModifier,
    averageHpGain,
    features: [],
    requiresChoices: choices.length > 0,
    choices
  };
}

/**
 * Determine which wizard steps are needed for a level-up
 */
export function getLevelUpSteps(levelUpData: LevelUpData): string[] {
  const steps: string[] = ['overview', 'hp'];

  // Check for ASI/Feat choice
  const hasASI = levelUpData.choices.some(c => c.type === 'asi');
  const hasFeat = levelUpData.choices.some(c => c.type === 'feat');
  if (hasASI || hasFeat) {
    steps.push('asi-feat');
  }

  // Check for subclass choice
  const hasSubclass = levelUpData.choices.some(c => c.type === 'subclass');
  if (hasSubclass) {
    steps.push('subclass');
  }

  // Check for spell choices - create separate steps for each spell choice
  const spellChoices = levelUpData.choices.filter(c => c.type === 'spells');
  spellChoices.forEach((choice, index) => {
    steps.push(`spells-${index}`);
  });

  // Check for fighting style
  const hasFightingStyle = levelUpData.choices.some(c => c.type === 'fighting-style');
  if (hasFightingStyle) {
    steps.push('fighting-style');
  }

  // Always show features summary (even if automatic)
  if (levelUpData.features.length > 0) {
    steps.push('features');
  }

  steps.push('confirm');

  return steps;
}

/**
 * Apply a level-up to a character
 */
export function applyLevelUp(
  character: Character,
  levelUpData: LevelUpData,
  choices: LevelUpChoices
): Character {
  const updatedCharacter = { ...character };

  // Apply level increase
  updatedCharacter.level = levelUpData.toLevel;

  // Apply HP increase
  const hpGain = choices.hpGained || 0;
  updatedCharacter.maxHitPoints += hpGain;
  updatedCharacter.hitPoints += hpGain; // Also increase current HP

  // Apply hit dice
  updatedCharacter.hitDice.max += 1;
  updatedCharacter.hitDice.current += 1;

  // Apply proficiency bonus
  updatedCharacter.proficiencyBonus = levelUpData.newProficiencyBonus;

  // Apply ASI choices
  if (choices.asiChoices) {
    choices.asiChoices.forEach(choice => {
      const ability = choice.ability as keyof Character['abilities'];
      updatedCharacter.abilities[ability].score += choice.increase;
      updatedCharacter.abilities[ability].modifier = Math.floor(
        (updatedCharacter.abilities[ability].score - 10) / 2
      );
    });
  }

  // Apply feat
  if (choices.featChosen) {
    if (!updatedCharacter.selectedFeats) {
      updatedCharacter.selectedFeats = [];
    }
    updatedCharacter.selectedFeats.push(choices.featChosen);

  // Process feat-granted abilities and spells
  applyFeatEffects(updatedCharacter, choices.featChosen);
  }

  // Apply subclass
  if (choices.subclassChosen) {
    updatedCharacter.subclass = choices.subclassChosen;
  }

  // Apply fighting style
  if (choices.fightingStyleChosen) {
    updatedCharacter.fightingStyle = choices.fightingStyleChosen;
  }

  // Apply spell slot increases
  if (levelUpData.newSpellSlots && updatedCharacter.spellcasting) {
    const classSlug = character.class.toLowerCase();
    const newSlots = SPELL_SLOTS_BY_CLASS[classSlug]?.[levelUpData.toLevel] || [];
    updatedCharacter.spellcasting.spellSlots = newSlots;
    updatedCharacter.spellcasting.usedSpellSlots = new Array(newSlots.length).fill(0);
  }

  // Apply spells learned
  if (choices.spellsLearned && updatedCharacter.spellcasting) {
    // Load spell data to separate cantrips from leveled spells
    const allSpells = loadSpells();
    const cantrips = choices.spellsLearned.filter((spellSlug: string) => {
      const spell = allSpells.find((s: any) => s.slug === spellSlug);
      return spell && spell.level === 0;
    });
    const leveledSpells = choices.spellsLearned.filter((spellSlug: string) => {
      const spell = allSpells.find((s: any) => s.slug === spellSlug);
      return spell && spell.level > 0;
    });

    // Add cantrips to cantripsKnown
    if (cantrips.length > 0) {
      if (!updatedCharacter.spellcasting.cantripsKnown) {
        updatedCharacter.spellcasting.cantripsKnown = [];
      }
      updatedCharacter.spellcasting.cantripsKnown.push(...cantrips);
    }

    // Add leveled spells based on casting type
    if (leveledSpells.length > 0) {
      if (updatedCharacter.spellcasting.spellcastingType === 'known') {
        if (!updatedCharacter.spellcasting.spellsKnown) {
          updatedCharacter.spellcasting.spellsKnown = [];
        }
        updatedCharacter.spellcasting.spellsKnown.push(...leveledSpells);
      } else if (updatedCharacter.spellcasting.spellcastingType === 'wizard') {
        if (!updatedCharacter.spellcasting.spellbook) {
          updatedCharacter.spellcasting.spellbook = [];
        }
        updatedCharacter.spellcasting.spellbook.push(...leveledSpells);
      }
    }
  }

  // Apply automatic features to class features list
  levelUpData.features
    .filter(f => f.automatic)
    .forEach(feature => {
      if (!updatedCharacter.featuresAndTraits.classFeatures.includes(feature.name)) {
        updatedCharacter.featuresAndTraits.classFeatures.push(feature.name);
      }
    });

  // Update resources (Second Wind, Action Surge, etc.)
  levelUpData.features.forEach(feature => {
    if (feature.resources) {
      if (!updatedCharacter.resources) {
        updatedCharacter.resources = [];
      }

      feature.resources.forEach(newResource => {
        // Find existing resource or add new one
        const existingIndex = updatedCharacter.resources!.findIndex(
          r => r.id === newResource.id
        );

        if (existingIndex >= 0) {
          // Update existing resource (e.g., increase max uses)
          updatedCharacter.resources![existingIndex] = {
            ...updatedCharacter.resources![existingIndex],
            maxUses: newResource.maxUses,
            currentUses: newResource.maxUses // Reset to max on level-up
          };
        } else {
          // Add new resource
          updatedCharacter.resources!.push({
            ...newResource,
            currentUses: newResource.maxUses
          });
        }
      });
    }
  });

  // Record level-up in history
  const levelUpRecord: LevelUpRecord = {
    level: levelUpData.toLevel,
    timestamp: new Date().toISOString(),
    hpRolled: choices.hpRoll,
    hpGained: choices.hpGained || 0,
    asiChoices: choices.asiChoices,
    featChosen: choices.featChosen,
    subclassChosen: choices.subclassChosen,
    spellsLearned: choices.spellsLearned,
    fightingStyleChosen: choices.fightingStyleChosen,
    featuresGained: levelUpData.features.filter(f => f.automatic).map(f => f.name)
  };

  if (!updatedCharacter.levelHistory) {
    updatedCharacter.levelHistory = [];
  }
  updatedCharacter.levelHistory.push(levelUpRecord);

  // Update timestamp
  updatedCharacter.updatedAt = new Date().toISOString();

  return updatedCharacter;
}

/**
 * Roll hit points for level-up (alternative to taking average)
 */
export function rollHitPoints(hitDie: string, conModifier: number): number {
  const dieSize = parseInt(hitDie.substring(1));
  const roll = Math.floor(Math.random() * dieSize) + 1;
  return Math.max(1, roll + conModifier); // Minimum 1 HP
}

/**
 * Get the average HP gain (rounded up) for a level-up
 */
export function getAverageHPGain(hitDie: string, conModifier: number): number {
  const dieSize = parseInt(hitDie.substring(1));
  const average = Math.floor(dieSize / 2) + 1;
  return Math.max(1, average + conModifier); // Minimum 1 HP
}

/**
 * Apply effects granted by a feat to the character
 */
function applyFeatEffects(character: Character, featSlug: string): void {
  const feats = loadFeats();
  const feat = feats.find(f => f.slug === featSlug);

  if (!feat) return;

  // Initialize featGrantedSpells array if it doesn't exist and feat grants spells
  if (!character.spellcasting) {
    // Some feats might grant spells to non-spellcasters, but for now we'll assume they need spellcasting
    return;
  }

  if (!character.spellcasting.featGrantedSpells) {
    character.spellcasting.featGrantedSpells = [];
  }

  // Process feats that grant spells
  switch (featSlug) {
    case 'drow-high-magic':
      // Detect Magic - at will
      character.spellcasting.featGrantedSpells.push({
        spellSlug: 'detect-magic',
        spellcastingAbility: 'CHA',
        rechargeType: 'at-will',
        featSlug: 'drow-high-magic'
      });

      // Levitate - 1 per long rest
      character.spellcasting.featGrantedSpells.push({
        spellSlug: 'levitate',
        spellcastingAbility: 'CHA',
        usesPerDay: 1,
        rechargeType: 'long-rest',
        featSlug: 'drow-high-magic'
      });

      // Dispel Magic - 1 per long rest
      character.spellcasting.featGrantedSpells.push({
        spellSlug: 'dispel-magic',
        spellcastingAbility: 'CHA',
        usesPerDay: 1,
        rechargeType: 'long-rest',
        featSlug: 'drow-high-magic'
      });
      break;

    case 'fey-touched':
      // Misty Step - 1 per long rest
      character.spellcasting.featGrantedSpells.push({
        spellSlug: 'misty-step',
        spellcastingAbility: 'CHA', // Uses the ability increased by this feat
        usesPerDay: 1,
        rechargeType: 'long-rest',
        featSlug: 'fey-touched'
      });
      // Note: Also grants one 1st-level divination/enchantment spell, but this requires player choice
      // This would need to be handled during feat selection
      break;

    case 'shadow-touched':
      // Invisibility - 1 per short rest
      character.spellcasting.featGrantedSpells.push({
        spellSlug: 'invisibility',
        spellcastingAbility: 'CHA', // Uses the ability increased by this feat
        usesPerDay: 1,
        rechargeType: 'short-rest',
        featSlug: 'shadow-touched'
      });
      break;

    case 'wood-elf-magic':
      // Longstrider - 1 per long rest
      character.spellcasting.featGrantedSpells.push({
        spellSlug: 'longstrider',
        spellcastingAbility: 'WIS',
        usesPerDay: 1,
        rechargeType: 'long-rest',
        featSlug: 'wood-elf-magic'
      });

      // Pass Without Trace - 1 per long rest
      character.spellcasting.featGrantedSpells.push({
        spellSlug: 'pass-without-trace',
        spellcastingAbility: 'WIS',
        usesPerDay: 1,
        rechargeType: 'long-rest',
        featSlug: 'wood-elf-magic'
      });
      break;

    case 'metallic-dragon-adept':
      // Cure Wounds - 1 per long rest
      character.spellcasting.featGrantedSpells.push({
        spellSlug: 'cure-wounds',
        spellcastingAbility: 'CHA', // Uses the ability increased by this feat
        usesPerDay: 1,
        rechargeType: 'long-rest',
        featSlug: 'metallic-dragon-adept'
      });
      break;

    case 'artificer-initiate':
      // Note: This feat grants player choice of cantrip and 1st-level spell
      // For now, we'll implement a default - in a full implementation,
      // this would require additional UI for spell selection
      // Grants: 1 artificer cantrip + 1 artificer 1st-level spell (1/LR)
      break;

    case 'spell-sniper':
      // Note: This feat grants player choice of one attack cantrip
      // For now, we'll implement a default - in a full implementation,
      // this would require additional UI for cantrip selection
      // Grants: One cantrip that requires attack roll (at-will)
      break;

    case 'telekinetic':
      // Mage Hand cantrip (enhanced)
      character.spellcasting.featGrantedSpells.push({
        spellSlug: 'mage-hand',
        spellcastingAbility: 'CHA', // Uses the ability increased by this feat
        rechargeType: 'at-will',
        featSlug: 'telekinetic'
      });
      break;

    case 'telepathic':
      // Detect Thoughts - 1 per long rest
      character.spellcasting.featGrantedSpells.push({
        spellSlug: 'detect-thoughts',
        spellcastingAbility: 'CHA', // Uses the ability increased by this feat
        usesPerDay: 1,
        rechargeType: 'long-rest',
        featSlug: 'telepathic'
      });
      break;

    // Add more feat spell processing logic here as needed

    // Add more feats as needed
    default:
      // No special effects for this feat
      break;
  }

  // TODO: Handle non-spell feat effects:
  // - Ability score increases (handled elsewhere)
  // - Skill/tool/language proficiencies
  // - Special combat abilities (Lucky, Great Weapon Master, etc.)
  // - Resistance/immunities
  // - Special actions/reactions
}

/**
 * Check if a character can level up
 */
export function canLevelUp(character: Character): boolean {
  return character.level < 20;
}

/**
 * Get all level-up choices for creating a high-level character
 * (e.g., creating a level 10 character requires 9 level-ups worth of choices)
 */
export function getHighLevelChoices(
  classSlug: string,
  edition: '2014' | '2024',
  targetLevel: number
): LevelUpData[] {
  const progression = getClassProgression(classSlug, edition);
  if (!progression) {
    return [];
  }

  const levelUpDataList: LevelUpData[] = [];

  for (let level = 2; level <= targetLevel; level++) {
    // Create a mock character at the previous level
    const mockCharacter = {
      level: level - 1,
      class: classSlug,
      edition,
      abilities: {
        CON: { score: 10, modifier: 0 }
      }
    } as Character;

    const levelUpData = calculateLevelUpData(mockCharacter);
    if (levelUpData) {
      levelUpDataList.push(levelUpData);
    }
  }

  return levelUpDataList;
}

import { Feat, CharacterCreationData } from '../types/dnd';

/**
 * Calculate how many feats a character can take based on their level
 * Feats are available at levels 4, 8, 12, 16, 19 (every 4 levels starting at 4)
 */
export const calculateFeatAvailability = (level: number): number => {
  return Math.floor((level - 1) / 4);
};

/**
 * Check if a feat's prerequisites are met by the character
 * This is a basic implementation - can be enhanced with more complex prerequisite checking
 */
export const checkFeatPrerequisites = (feat: Feat, character: Partial<CharacterCreationData>): boolean => {
  if (!feat.prerequisite) return true;

  const prerequisite = feat.prerequisite.toLowerCase();

  // Check for ability score prerequisites (e.g., "Strength 13")
  const abilityMatch = prerequisite.match(/(\w+)\s+(\d+)/);
  if (abilityMatch) {
    const [, abilityName, requiredScore] = abilityMatch;
    const abilityKey = abilityName.toUpperCase().slice(0, 3) as keyof CharacterCreationData['abilities'];

    if (character.abilities && character.abilities[abilityKey]) {
      return character.abilities[abilityKey] >= parseInt(requiredScore);
    }
  }

  // Check for level prerequisites (e.g., "Level 5")
  const levelMatch = prerequisite.match(/level\s+(\d+)/i);
  if (levelMatch) {
    const requiredLevel = parseInt(levelMatch[1]);
    return (character.level || 1) >= requiredLevel;
  }

  // Check for class prerequisites (e.g., "Fighter")
  if (character.classSlug) {
    return prerequisite.toLowerCase().includes(character.classSlug.toLowerCase());
  }

  // Check for armor proficiency prerequisites
  if (prerequisite.toLowerCase().includes('proficiency with light armor')) {
    // For now, assume all characters can take light armor feats
    // This could be enhanced to check actual armor proficiencies
    return true;
  }

  // Check for other proficiency prerequisites
  if (prerequisite.toLowerCase().includes('proficiency with')) {
    // For now, return true for proficiency prerequisites
    // This could be enhanced to check actual proficiencies
    return true;
  }

  // For now, return true for unhandled prerequisites
  // This can be enhanced with more sophisticated prerequisite parsing
  return true;
};

/**
 * Filter feats based on character data and prerequisites
 */
export const filterAvailableFeats = (allFeats: Feat[], character: Partial<CharacterCreationData>): Feat[] => {
  return allFeats.filter(feat => checkFeatPrerequisites(feat, character));
};

/**
 * Check if a feat provides ability score increases
 */
export const featProvidesAbilityIncrease = (feat: Feat): boolean => {
  return !!feat.abilityScoreIncrease;
};

/**
 * Get the source information for a feat (SRD version, etc.)
 */
export const getFeatSourceInfo = (feat: Feat): string => {
  return `${feat.source} ${feat.year}`;
};

/**
 * Check if the character has reached the maximum number of feats for their level
 */
export const canSelectMoreFeats = (currentFeats: string[], level: number): boolean => {
  const maxFeats = calculateFeatAvailability(level);
  return currentFeats.length < maxFeats;
};

/**
 * Get available feats for a character based on 2024 category rules
 */
export const getAvailableFeatsForCharacter = (
  allFeats: Feat[],
  character: Partial<CharacterCreationData>,
  context: 'asi' | 'fighting_style' | 'background' = 'asi'
): Feat[] => {
  const level = character.level || 1;
  const classSlug = character.classSlug || '';

  return allFeats.filter(feat => {
    // Check category availability based on context and level
    switch (context) {
      case 'background':
        return feat.category === 'origin';

      case 'fighting_style':
        // Only available to classes with Fighting Style feature
        if (!['fighter', 'paladin', 'ranger'].includes(classSlug)) return false;
        return feat.category === 'fighting_style';

      case 'asi':
      default:
        // General feats available at level 4+
        if (level < 4) return false;

        // Epic boons only at level 19+
        if (feat.category === 'epic_boon' && level < 19) return false;

        // Fighting styles not available in ASI (except via Fighting Initiate)
        if (feat.category === 'fighting_style') return false;

        // Origin feats are allowed but generally players pick general feats
        return ['general', 'origin'].includes(feat.category);
    }
  }).filter(feat => checkFeatPrerequisites2024(feat, character));
};

/**
 * Enhanced prerequisite checking for 2024 system
 */
export const checkFeatPrerequisites2024 = (feat: Feat, character: Partial<CharacterCreationData>): boolean => {
  // Check new structured prerequisites first
  if (feat.prerequisites) {
    const prereqs = feat.prerequisites;

    // Level check
    if (prereqs.level && (character.level || 1) < prereqs.level) return false;

    // Ability score checks
    if (prereqs.stats && character.abilities) {
      for (const [ability, required] of Object.entries(prereqs.stats)) {
        const abilityKey = ability as keyof typeof character.abilities;
        if ((character.abilities[abilityKey] || 10) < required) return false;
      }
    }

    // Spellcasting requirement
    if (prereqs.spellcasting) {
      // Check if character has spellcasting ability
      const spellcastingClasses = ['wizard', 'sorcerer', 'druid', 'cleric', 'bard', 'paladin', 'ranger', 'warlock'];
      if (!spellcastingClasses.includes(character.classSlug || '')) return false;
    }

    // Feature checks would go here if implemented
    if (prereqs.features) {
      // For now, skip feature checks as they're not implemented yet
    }

    return true;
  }

  // Fall back to old prerequisite checking
  return checkFeatPrerequisites(feat, character);
};

/**
 * Validate feat selection for a character
 */
export const validateFeatSelection = (selectedFeats: string[], allFeats: Feat[], character: Partial<CharacterCreationData>): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  const maxFeats = calculateFeatAvailability(character.level || 1);

  if (selectedFeats.length > maxFeats) {
    errors.push(`Too many feats selected. Maximum ${maxFeats} allowed at level ${character.level}.`);
  }

  // Check for duplicate feats
  const uniqueFeats = new Set(selectedFeats);
  if (uniqueFeats.size !== selectedFeats.length) {
    errors.push('Duplicate feats selected.');
  }

  // Check prerequisites for selected feats using 2024 system
  selectedFeats.forEach(featSlug => {
    const feat = allFeats.find(f => f.slug === featSlug);
    if (feat && !checkFeatPrerequisites2024(feat, character)) {
      errors.push(`Prerequisites not met for feat: ${feat.name}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};
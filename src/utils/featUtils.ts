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

  // Check prerequisites for selected feats
  selectedFeats.forEach(featSlug => {
    const feat = allFeats.find(f => f.slug === featSlug);
    if (feat && !checkFeatPrerequisites(feat, character)) {
      errors.push(`Prerequisites not met for feat: ${feat.name}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};
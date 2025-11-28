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

  // Check for ability score prerequisites (e.g., "Strength 13", "Dexterity 13 or higher")
  const abilityMatch = prerequisite.match(/(\w+)\s+(\d+)/);
  if (abilityMatch) {
    const [, abilityName, requiredScore] = abilityMatch;
    const abilityKey = abilityName.toUpperCase().slice(0, 3) as keyof CharacterCreationData['abilities'];

    if (character.abilities && character.abilities[abilityKey]) {
      return character.abilities[abilityKey] >= parseInt(requiredScore);
    }
    return false;
  }

  // Check for complex ability prerequisites (e.g., "Intelligence or Wisdom 13 or higher")
  const complexAbilityMatch = prerequisite.match(/(intelligence|wisdom|strength|dexterity|constitution|charisma).*?(\d+)/i);
  if (complexAbilityMatch) {
    const [, ability1, requiredScore] = complexAbilityMatch;
    const abilityKey1 = ability1.toUpperCase().slice(0, 3) as keyof CharacterCreationData['abilities'];

    if (character.abilities) {
      if (ability1.toLowerCase().includes('or')) {
        // Handle "Intelligence or Wisdom" type prerequisites
        const abilities = prerequisite.split(' or ').map(a => a.trim().toUpperCase().slice(0, 3));
        return abilities.some(ability => {
          const abilityKey = ability as keyof CharacterCreationData['abilities'];
          return character.abilities![abilityKey] >= parseInt(requiredScore);
        });
      } else {
        return character.abilities[abilityKey1] >= parseInt(requiredScore);
      }
    }
    return false;
  }

  // Check for level prerequisites (e.g., "Level 5")
  const levelMatch = prerequisite.match(/level\s+(\d+)/i);
  if (levelMatch) {
    const requiredLevel = parseInt(levelMatch[1]);
    return (character.level || 1) >= requiredLevel;
  }

  // Check for race prerequisites
  if (character.raceSlug) {
    const characterRace = character.raceSlug.toLowerCase();

    if (prerequisite.includes('halfling') && characterRace !== 'halfling') return false;
    if (prerequisite.includes('dragonborn') && characterRace !== 'dragonborn') return false;
    if (prerequisite.includes('dwarf') && characterRace !== 'dwarf') return false;
    if (prerequisite.includes('elf') && !characterRace.includes('elf')) return false;
    if (prerequisite.includes('tiefling') && characterRace !== 'tiefling') return false;
    if (prerequisite.includes('gnome') && characterRace !== 'gnome') return false;
    if (prerequisite.includes('half-elf') && characterRace !== 'half-elf') return false;
    if (prerequisite.includes('half-orc') && characterRace !== 'half-orc') return false;
    if (prerequisite.includes('human') && characterRace !== 'human') return false;
  }

  // Check for spellcasting prerequisites
  if (prerequisite.includes('spellcasting') || prerequisite.includes('the ability to cast')) {
    // Check if character has spellcasting ability based on class
    if (character.classSlug) {
      const spellcastingClasses = ['wizard', 'sorcerer', 'bard', 'cleric', 'druid', 'paladin', 'ranger', 'warlock', 'artificer'];
      return spellcastingClasses.includes(character.classSlug.toLowerCase());
    }
    return false;
  }

  // Check for proficiency prerequisites
  if (prerequisite.includes('proficiency with light armor')) {
    // Most classes get light armor proficiency
    if (character.classSlug) {
      const noLightArmorClasses = ['barbarian', 'monk']; // Classes that don't get light armor
      return !noLightArmorClasses.includes(character.classSlug.toLowerCase());
    }
    return true;
  }

  if (prerequisite.includes('proficiency with medium armor')) {
    // Specific classes get medium armor
    if (character.classSlug) {
      const mediumArmorClasses = ['fighter', 'paladin', 'ranger', 'bard'];
      return mediumArmorClasses.includes(character.classSlug.toLowerCase());
    }
    return false;
  }

  if (prerequisite.includes('proficiency with heavy armor')) {
    // Only specific classes get heavy armor
    if (character.classSlug) {
      const heavyArmorClasses = ['fighter', 'paladin'];
      return heavyArmorClasses.includes(character.classSlug.toLowerCase());
    }
    return false;
  }

  if (prerequisite.includes('proficiency with a martial weapon')) {
    // Fighters, paladins, rangers, and barbarians get martial weapons
    if (character.classSlug) {
      const martialWeaponClasses = ['fighter', 'paladin', 'ranger', 'barbarian'];
      return martialWeaponClasses.includes(character.classSlug.toLowerCase());
    }
    return false;
  }

  // Check for class prerequisites (basic check)
  if (character.classSlug) {
    const classNames = ['fighter', 'rogue', 'wizard', 'cleric', 'barbarian', 'paladin', 'ranger', 'sorcerer', 'bard', 'druid', 'monk', 'warlock', 'artificer'];
    for (const className of classNames) {
      if (prerequisite.includes(className)) {
        return prerequisite.includes(character.classSlug.toLowerCase());
      }
    }
  }

  // For complex prerequisites we can't parse, allow the feat to be visible
  // The UI will show it as available or with requirements
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
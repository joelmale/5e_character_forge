// Enhanced Name Generator with Race-Specific Names, Cultural Patterns, and Quality Controls
import nameData from '../data/nameData.json';

export interface NameOptions {
  race?: string;
  gender?: 'male' | 'female' | 'any';
  length?: 'short' | 'medium' | 'long' | 'any';
  includeTitle?: boolean;
  includeMeaning?: boolean;
  includePronunciation?: boolean;
}

export interface GeneratedName {
  name: string;
  meaning?: string;
  pronunciation?: string;
  gender?: string;
  race?: string;
}

// Cache for frequently used combinations
const nameCache = new Map<string, GeneratedName[]>();
const MAX_CACHE_SIZE = 1000;
const MAX_NAMES_PER_CACHE_KEY = 50;

// Track used names for uniqueness
const usedNames = new Set<string>();

/**
 * Get random element from array
 */
function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Get base race name (remove parenthetical variants)
 */
function getBaseRace(race: string): string {
  const parenIndex = race.indexOf(' (');
  const baseName = parenIndex > 0 ? race.substring(0, parenIndex) : race;

  // Map some race variations, but keep specific ones like Half-Elf
  if (baseName === 'High Elf' || baseName === 'Wood Elf' || baseName === 'Dark Elf') return 'Elf';
  if (baseName === 'Hobgoblin' || baseName === 'Goblin') return 'Half-Orc';
  if (baseName === 'Aasimar' || baseName === 'Genasi') return 'Tiefling';

  return baseName;
}

/**
 * Generate race-specific name
 */
function generateRaceSpecificName(race: string, gender: 'male' | 'female' | 'any' = 'any'): string {
  const baseRace = getBaseRace(race);
  const raceData = nameData.races[baseRace as keyof typeof nameData.races];

  if (!raceData) {
    return generateFantasyName();
  }

  let firstName: string;
  let lastName: string = '';

  // Select gender-appropriate first name
  if (gender === 'any') {
    const genderOptions = raceData.female && raceData.male ? ['male', 'female'] : ['male'];
    const selectedGender = getRandomElement(genderOptions);
    firstName = getRandomElement(raceData[selectedGender as 'male' | 'female']);
  } else if (raceData[gender]) {
    firstName = getRandomElement(raceData[gender]);
  } else {
    // Fallback if specific gender not available
    firstName = getRandomElement(raceData.male || raceData.female || []);
  }

  // Add surname based on cultural patterns
  const patterns = raceData.cultural_patterns || [];
  if (patterns.length > 0 && raceData.surnames && raceData.surnames.length > 0) {
    const pattern = getRandomElement(patterns);

    switch (pattern) {
      case 'First Last':
        lastName = getRandomElement(raceData.surnames.filter(s => s.length > 0));
        break;
      case 'First':
        // No surname
        break;
      case 'First\'el':
      case 'First\'iel':
        lastName = firstName + (pattern.includes('iel') ? 'iel' : 'el');
        break;
      case 'Firstsson':
        lastName = firstName + 'sson';
        break;
      case 'Firstdottir':
        lastName = firstName + 'dottir';
        break;
      case 'Clan of First':
        lastName = `of Clan ${firstName}`;
        break;
      default:
        if (Math.random() > 0.5 && raceData.surnames.some(s => s.length > 0)) {
          lastName = getRandomElement(raceData.surnames.filter(s => s.length > 0));
        }
    }
  }

  return lastName ? `${firstName} ${lastName}` : firstName;
}

/**
 * Generate fantasy syllable-based name
 */
function generateFantasyName(options: NameOptions = {}): string {
  const { length = 'any', includeTitle = false } = options;
  const syllables = nameData.syllables.fantasy;

  let name = '';
  let syllableCount = 0;

  // Determine syllable count based on length preference
  switch (length) {
    case 'short':
      syllableCount = Math.random() < 0.7 ? 2 : 3;
      break;
    case 'medium':
      syllableCount = Math.random() < 0.6 ? 3 : Math.random() < 0.8 ? 2 : 4;
      break;
    case 'long':
      syllableCount = Math.random() < 0.5 ? 4 : 5;
      break;
    default:
      syllableCount = Math.floor(Math.random() * 4) + 2; // 2-5 syllables
  }

  // Build name from syllables
  for (let i = 0; i < syllableCount; i++) {
    if (i === 0) {
      name += getRandomElement(syllables.prefixes);
    } else {
      name += getRandomElement(syllables.suffixes);
    }
  }

  // Optionally add title
  if (includeTitle && Math.random() > 0.6) {
    const title = getRandomElement(nameData.titles);
    const suffix = getRandomElement(nameData.suffixes);

    if (Math.random() > 0.5) {
      name = `${title}${suffix} ${name}`;
    } else {
      name = `${name} ${title}${suffix}`;
    }
  }

  return name;
}

/**
 * Check name uniqueness
 */
function isNameUnique(name: string): boolean {
  return !usedNames.has(name.toLowerCase());
}

/**
 * Add name to used names set
 */
function markNameAsUsed(name: string): void {
  usedNames.add(name.toLowerCase());

  // Limit the size of used names set to prevent memory issues
  if (usedNames.size > 10000) {
    const iterator = usedNames.values();
    for (let i = 0; i < 1000; i++) {
      const value = iterator.next().value;
      if (value !== undefined) {
        usedNames.delete(value);
      }
    }
  }
}



/**
 * Generate pronunciation guide
 */
function generatePronunciation(name: string, race?: string): string {
  let pronunciation = name;

  // Get race-specific pronunciation guide
  if (race) {
    const baseRace = getBaseRace(race);
    const raceData = nameData.races[baseRace as keyof typeof nameData.races];
    if (raceData && 'pronunciation_guide' in raceData && raceData.pronunciation_guide) {
      Object.entries(raceData.pronunciation_guide).forEach(([pattern, replacement]) => {
        const regex = new RegExp(pattern, 'gi');
        pronunciation = pronunciation.replace(regex, replacement as string);
      });
    }
  }

  // General fantasy pronunciation rules
  pronunciation = pronunciation
    .replace(/ae/gi, 'ay')
    .replace(/ea/gi, 'ee')
    .replace(/th/gi, 'th')
    .replace(/ph/gi, 'f')
    .replace(/qu/gi, 'kw')
    .replace(/x/gi, 'ks')
    .replace(/y/gi, 'ee')
    .replace(/z/gi, 'z');

  return pronunciation;
}

/**
 * Get name meaning
 */
function getNameMeaning(name: string): string | undefined {
  const words = name.split(/\s+/);
  const meanings: string[] = [];

  for (const word of words) {
    // Check for exact matches first
    if (nameData.name_meanings[word as keyof typeof nameData.name_meanings]) {
      meanings.push(nameData.name_meanings[word as keyof typeof nameData.name_meanings]);
    } else {
      // Check for partial matches (prefixes)
      for (const [prefix, meaning] of Object.entries(nameData.name_meanings)) {
        if (word.toLowerCase().startsWith(prefix.toLowerCase())) {
          meanings.push(meaning as string);
          break;
        }
      }
    }
  }

  return meanings.length > 0 ? meanings.join(', ') : undefined;
}

/**
 * Main name generation function
 */
export function generateName(options: NameOptions = {}): GeneratedName {
  const {
    race,
    gender = 'any',
    length = 'any',
    includeMeaning = false,
    includePronunciation = false
  } = options;

  // Skip cache for now to ensure name variety
  // TODO: Implement smarter caching that doesn't reduce variety
  const cacheKey = `${race || 'fantasy'}-${gender}-${length}`;

  let name: string;
  let attempts = 0;
  const maxAttempts = 100;

  // Generate name with uniqueness check
  do {
    if (race && nameData.races[getBaseRace(race) as keyof typeof nameData.races]) {
      name = generateRaceSpecificName(race, gender);
    } else {
      name = generateFantasyName({ length, includeTitle: Math.random() > 0.7 });
    }
    attempts++;
  } while (!isNameUnique(name) && attempts < maxAttempts);

  // Mark name as used
  markNameAsUsed(name);

  // Build result
  const result: GeneratedName = {
    name,
    race: race ? getBaseRace(race) : undefined,
    gender: gender !== 'any' ? gender : undefined
  };

  // Add optional features
  if (includeMeaning) {
    result.meaning = getNameMeaning(name);
  }

  if (includePronunciation) {
    result.pronunciation = generatePronunciation(name, race);
  }

  // Cache the result (but don't use cache for uniqueness - let it generate fresh names)
  // The cache is mainly for performance, but uniqueness requires variety
  // So we'll cache but not rely on it for uniqueness

  // Limit total cache size
  if (nameCache.size > MAX_CACHE_SIZE) {
    const firstKey = nameCache.keys().next().value;
    if (firstKey !== undefined) {
      nameCache.delete(firstKey);
    }
  }

  return result;
}

/**
 * Generate multiple names at once
 */
export function generateNames(count: number, options: NameOptions = {}): GeneratedName[] {
  const names: GeneratedName[] = [];

  for (let i = 0; i < count; i++) {
    names.push(generateName(options));
  }

  return names;
}

/**
 * Clear name cache and used names
 */
export function clearNameCache(): void {
  nameCache.clear();
  usedNames.clear();
}

/**
 * Get available races for name generation
 */
export function getAvailableRaces(): string[] {
  return Object.keys(nameData.races);
}

/**
 * Get name generation statistics
 */
export function getNameStats(): {
  cacheSize: number;
  usedNamesCount: number;
  availableRaces: number;
} {
  return {
    cacheSize: nameCache.size,
    usedNamesCount: usedNames.size,
    availableRaces: Object.keys(nameData.races).length
  };
}
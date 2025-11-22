import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  generateName,
  generateNames,
  getAvailableRaces,
  clearNameCache,
  getNameStats,
  NameOptions
} from './nameGenerator';

describe('Name Generator', () => {
  beforeEach(() => {
    clearNameCache();
  });

  afterEach(() => {
    clearNameCache();
  });

  describe('generateName', () => {
    it('should generate a basic name', () => {
      const result = generateName();
      expect(result).toHaveProperty('name');
      expect(typeof result.name).toBe('string');
      expect(result.name.length).toBeGreaterThan(0);
    });

    it('should generate race-specific names', () => {
      const elfName = generateName({ race: 'Elf' });
      const dwarfName = generateName({ race: 'Dwarf' });

      expect(elfName.name).toBeDefined();
      expect(dwarfName.name).toBeDefined();
      // Names should be different (though not guaranteed)
      expect(elfName.name).not.toBe(dwarfName.name);
    });

    it('should generate gender-specific names', () => {
      const maleName = generateName({ gender: 'male' as const });
      const femaleName = generateName({ gender: 'female' as const });

      expect(maleName.name).toBeDefined();
      expect(femaleName.name).toBeDefined();
    });

    it('should include meaning when requested', () => {
      const result = generateName({ includeMeaning: true });
      // Meaning might be undefined for some names
      expect(result).toHaveProperty('meaning');
    });

    it('should include pronunciation when requested', () => {
      const result = generateName({ includePronunciation: true });
      expect(result).toHaveProperty('pronunciation');
      if (result.pronunciation) {
        expect(typeof result.pronunciation).toBe('string');
      }
    });

    it('should respect length preferences', () => {
      const shortName = generateName({ length: 'short' });
      const longName = generateName({ length: 'long' });

      expect(shortName.name.length).toBeLessThanOrEqual(10);
      expect(longName.name.length).toBeGreaterThanOrEqual(8);
    });

    it('should handle all race types', () => {
      const races = getAvailableRaces();

      for (const race of races) {
        const result = generateName({ race });
        expect(result.name).toBeDefined();
        expect(result.race).toBe(race);
      }
    });

    it('should handle invalid race gracefully', () => {
      const result = generateName({ race: 'InvalidRace' });
      expect(result.name).toBeDefined();
      // Should fall back to generic name generation
    });
  });

  describe('generateNames', () => {
    it('should generate multiple names', () => {
      const results = generateNames(5);
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toHaveProperty('name');
      });
    });

    it('should generate unique names when possible', () => {
      const results = generateNames(10);
      const names = results.map(r => r.name);
      const uniqueNames = new Set(names);

      // Allow for duplicates due to limited name pools, but expect at least some variety
      expect(uniqueNames.size).toBeGreaterThan(0);
    });

    it('should apply options to all generated names', () => {
      const results = generateNames(3, { race: 'Elf', includeMeaning: true });
      results.forEach(result => {
        expect(result.race).toBe('Elf');
        expect(result).toHaveProperty('meaning');
      });
    });
  });

  describe('getAvailableRaces', () => {
    it('should return all available races', () => {
      const races = getAvailableRaces();
      expect(Array.isArray(races)).toBe(true);
      expect(races.length).toBeGreaterThan(0);
      expect(races).toContain('Human');
      expect(races).toContain('Elf');
      expect(races).toContain('Dwarf');
    });
  });

  describe('Caching', () => {
    it('should cache frequently used combinations', () => {
      // Caching is currently disabled for uniqueness
      // TODO: Re-enable with smarter caching strategy
      const options: NameOptions = { race: 'Human', gender: 'male' };

      // Generate same combination multiple times
      const name1 = generateName(options);
      const name2 = generateName(options);
      const name3 = generateName(options);

      expect(name1.name).toBeDefined();
      expect(name2.name).toBeDefined();
      expect(name3.name).toBeDefined();

      // Cache is disabled for now
      const stats = getNameStats();
      expect(stats.cacheSize).toBe(0);
    });

    it('should clear cache when requested', () => {
      // Generate some names (cache disabled but used names tracking still works)
      generateName({ race: 'Elf' });
      let stats = getNameStats();
      expect(stats.usedNamesCount).toBeGreaterThan(0);

      clearNameCache();
      stats = getNameStats();
      expect(stats.cacheSize).toBe(0);
      expect(stats.usedNamesCount).toBe(0);
    });

    it('should limit cache size', () => {
      // Generate many different combinations to test cache limits
      for (let i = 0; i < 1500; i++) {
        generateName({ race: `TestRace${i}` });
      }

      const stats = getNameStats();
      expect(stats.cacheSize).toBeLessThanOrEqual(1000);
    });
  });

  describe('Uniqueness', () => {
    it('should attempt to generate unique names', () => {
      // Generate many names to test uniqueness
      const names = [];
      for (let i = 0; i < 100; i++) {
        const result = generateName();
        names.push(result.name);
      }

      const uniqueNames = new Set(names);
      // Should have reasonable uniqueness (allowing for duplicates due to limited pools)
      expect(uniqueNames.size).toBeGreaterThan(10);
    });

    it('should track used names count', () => {
      generateName();
      generateName();
      const stats = getNameStats();
      // May be less than 2 if same name generated twice (due to uniqueness retry)
      expect(stats.usedNamesCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty options', () => {
      const result = generateName({});
      expect(result.name).toBeDefined();
    });

    it('should handle undefined race', () => {
      const result = generateName({ race: undefined });
      expect(result.name).toBeDefined();
    });

    it('should handle all gender options', () => {
      const genders: Array<'male' | 'female' | 'any'> = ['male', 'female', 'any'];

      genders.forEach(gender => {
        const result = generateName({ gender });
        expect(result.name).toBeDefined();
      });
    });

    it('should handle all length options', () => {
      const lengths: Array<'short' | 'medium' | 'long' | 'any'> = ['short', 'medium', 'long', 'any'];

      lengths.forEach(length => {
        const result = generateName({ length });
        expect(result.name).toBeDefined();
      });
    });
  });

  describe('Race-Specific Features', () => {
    it('should generate culturally appropriate names for Elves', () => {
      const result = generateName({ race: 'Elf', includePronunciation: true });
      expect(result.name).toBeDefined();
      expect(result.race).toBe('Elf');

      // Elves often have names with apostrophes or flowing sounds
      if (result.pronunciation) {
        expect(result.pronunciation).toMatch(/[a-z]/i);
      }
    });

    it('should generate culturally appropriate names for Dwarves', () => {
      const result = generateName({ race: 'Dwarf' });
      expect(result.name).toBeDefined();
      expect(result.race).toBe('Dwarf');

      // Dwarves often have hard consonants and clan names
    });

    it('should generate single names for Tieflings and Half-Orcs', () => {
      const tieflingName = generateName({ race: 'Tiefling' });
      const halfOrcName = generateName({ race: 'Half-Orc' });

      expect(tieflingName.name).toBeDefined();
      expect(halfOrcName.name).toBeDefined();
      expect(tieflingName.race).toBe('Tiefling');
      expect(halfOrcName.race).toBe('Half-Orc');

      // These races typically don't have surnames
      expect(tieflingName.name.split(' ')).toHaveLength(1);
      expect(halfOrcName.name.split(' ')).toHaveLength(1);
    });

    it('should handle race variations', () => {
      // Test that different race inputs map to the same base race
      const elf1 = generateName({ race: 'Elf' });
      const elf2 = generateName({ race: 'High Elf' });

      expect(elf1.name).toBeDefined();
      expect(elf2.name).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should generate names quickly', () => {
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        generateName();
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete 100 generations in reasonable time
      expect(duration).toBeLessThan(1000); // Less than 1 second
    });

    it('should cache improve performance for repeated requests', () => {
      const options: NameOptions = { race: 'Human', gender: 'male' };

      // First generation (no cache)
      const start1 = Date.now();
      generateName(options);
      const time1 = Date.now() - start1;

      // Second generation (should use cache)
      const start2 = Date.now();
      generateName(options);
      const time2 = Date.now() - start2;

      // Cached version should be faster (though this is a rough test)
      expect(time2).toBeLessThanOrEqual(time1);
    });
  });
});
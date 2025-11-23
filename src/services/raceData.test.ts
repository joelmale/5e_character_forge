import { describe, it, expect } from 'vitest';
import { loadRaces } from '../services/dataService';

describe('Race Data Loading', () => {
  it('should load all 32 races from JSON', () => {
    const races = loadRaces();
    expect(races).toHaveLength(32);
  });

  it('should have valid race data structure', () => {
    const races = loadRaces();
    races.forEach(race => {
      expect(race.slug).toBeDefined();
      expect(typeof race.slug).toBe('string');
      expect(race.name).toBeDefined();
      expect(typeof race.name).toBe('string');
      expect(race.source).toBeDefined();
      expect(typeof race.source).toBe('string');
      expect(race.speed).toBeDefined();
      expect(typeof race.speed).toBe('number');
      expect(race.ability_bonuses).toBeDefined();
      expect(typeof race.ability_bonuses).toBe('object');
      expect(Array.isArray(race.racial_traits)).toBe(true);
      expect(race.description).toBeDefined();
      expect(typeof race.description).toBe('string');
      expect(Array.isArray(race.typicalRoles)).toBe(true);
    });
  });

  it('should include all expected races', () => {
    const races = loadRaces();
    const raceSlugs = races.map(r => r.slug);

    // Test some key races
    expect(raceSlugs).toContain('human');
    expect(raceSlugs).toContain('wood-elf');
    expect(raceSlugs).toContain('mountain-dwarf');
    expect(raceSlugs).toContain('dragonborn');
    expect(raceSlugs).toContain('tiefling');
    expect(raceSlugs).toContain('aasimar');
    expect(raceSlugs).toContain('firbolg');
    expect(raceSlugs).toContain('goliath');
    expect(raceSlugs).toContain('kenku');
    expect(raceSlugs).toContain('tabaxi');
    expect(raceSlugs).toContain('triton');
    expect(raceSlugs).toContain('bugbear');
    expect(raceSlugs).toContain('goblin');
    expect(raceSlugs).toContain('hobgoblin');
    expect(raceSlugs).toContain('kobold');
    expect(raceSlugs).toContain('orc');
    expect(raceSlugs).toContain('yuan-ti-pureblood');
    expect(raceSlugs).toContain('fairy');
    expect(raceSlugs).toContain('harengon');
    expect(raceSlugs).toContain('loxodon');
    expect(raceSlugs).toContain('owlin');
    expect(raceSlugs).toContain('githyanki');
    expect(raceSlugs).toContain('fire-genasi');
  });

  it('should have correct ability bonuses for human', () => {
    const races = loadRaces();
    const human = races.find(r => r.slug === 'human');
    expect(human).toBeDefined();
    expect(human?.ability_bonuses).toEqual({
      STR: 1,
      DEX: 1,
      CON: 1,
      INT: 1,
      WIS: 1,
      CHA: 1
    });
  });

  it('should have correct data for wood elf', () => {
    const races = loadRaces();
    const woodElf = races.find(r => r.slug === 'wood-elf');
    expect(woodElf).toBeDefined();
    expect(woodElf?.name).toBe('Wood Elf');
    expect(woodElf?.source).toBe('PHB');
    expect(woodElf?.speed).toBe(30);
    expect(woodElf?.ability_bonuses).toEqual({ DEX: 2, WIS: 1 });
    expect(woodElf?.racial_traits).toContain('Mask of the Wild');
    expect(woodElf?.typicalRoles).toContain('Ranger');
  });

  it('should have valid speed values', () => {
    const races = loadRaces();
    races.forEach(race => {
      expect(race.speed).toBeGreaterThanOrEqual(20);
      expect(race.speed).toBeLessThanOrEqual(40);
    });
  });

  it('should have valid ability bonus values', () => {
    const races = loadRaces();
    races.forEach(race => {
      Object.values(race.ability_bonuses).forEach(bonus => {
        expect(bonus).toBeGreaterThanOrEqual(-2);
        expect(bonus).toBeLessThanOrEqual(3);
      });
    });
  });
});
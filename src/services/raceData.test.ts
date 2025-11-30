import { describe, it, expect } from 'vitest';
import { loadSpecies } from '../services/dataService';

describe('Species Data Loading', () => {
  it('should load all 32 species from JSON', () => {
    const species = loadSpecies();
    expect(species).toHaveLength(32);
  });

  it('should have valid species data structure', () => {
    const species = loadSpecies();
    species.forEach(species => {
      expect(species.slug).toBeDefined();
      expect(typeof species.slug).toBe('string');
      expect(species.name).toBeDefined();
      expect(typeof species.name).toBe('string');
      expect(species.source).toBeDefined();
      expect(typeof species.source).toBe('string');
      expect(species.speed).toBeDefined();
      expect(typeof species.speed).toBe('number');
      expect(species.ability_bonuses).toBeDefined();
      expect(typeof species.ability_bonuses).toBe('object');
      expect(Array.isArray(species.species_traits)).toBe(true);
      expect(species.description).toBeDefined();
      expect(typeof species.description).toBe('string');
      expect(Array.isArray(species.typicalRoles)).toBe(true);
    });
  });

  it('should include all expected species', () => {
    const species = loadSpecies();
    const speciesSlugs = species.map(s => s.slug);

    // Test some key races
    expect(speciesSlugs).toContain('human');
    expect(speciesSlugs).toContain('wood-elf');
    expect(speciesSlugs).toContain('mountain-dwarf');
    expect(speciesSlugs).toContain('dragonborn');
    expect(speciesSlugs).toContain('tiefling');
    expect(speciesSlugs).toContain('aasimar');
    expect(speciesSlugs).toContain('firbolg');
    expect(speciesSlugs).toContain('goliath');
    expect(speciesSlugs).toContain('kenku');
    expect(speciesSlugs).toContain('tabaxi');
    expect(speciesSlugs).toContain('triton');
    expect(speciesSlugs).toContain('bugbear');
    expect(speciesSlugs).toContain('goblin');
    expect(speciesSlugs).toContain('hobgoblin');
    expect(speciesSlugs).toContain('kobold');
    expect(speciesSlugs).toContain('orc');
    expect(speciesSlugs).toContain('yuan-ti-pureblood');
    expect(speciesSlugs).toContain('fairy');
    expect(speciesSlugs).toContain('harengon');
    expect(speciesSlugs).toContain('loxodon');
    expect(speciesSlugs).toContain('owlin');
    expect(speciesSlugs).toContain('githyanki');
    expect(speciesSlugs).toContain('fire-genasi');
  });

  it('should have correct ability bonuses for human', () => {
    const species = loadSpecies();
    const human = species.find(s => s.slug === 'human');
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
    const species = loadSpecies();
    const woodElf = species.find(s => s.slug === 'wood-elf');
    expect(woodElf).toBeDefined();
    expect(woodElf?.name).toBe('Wood Elf');
    expect(woodElf?.source).toBe('PHB');
    expect(woodElf?.speed).toBe(30);
    expect(woodElf?.ability_bonuses).toEqual({ DEX: 2, WIS: 1 });
    expect(woodElf?.species_traits).toContain('Mask of the Wild');
    expect(woodElf?.typicalRoles).toContain('Ranger');
  });

  it('should have valid speed values', () => {
    const species = loadSpecies();
    species.forEach(species => {
      expect(species.speed).toBeGreaterThanOrEqual(20);
      expect(species.speed).toBeLessThanOrEqual(40);
    });
  });

  it('should have valid ability bonus values', () => {
    const species = loadSpecies();
    species.forEach(species => {
      Object.values(species.ability_bonuses).forEach(bonus => {
        expect(bonus).toBeGreaterThanOrEqual(-2);
        expect(bonus).toBeLessThanOrEqual(3);
      });
    });
  });
});
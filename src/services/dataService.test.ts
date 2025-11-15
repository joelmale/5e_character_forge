import { describe, it, expect } from 'vitest';
import {
  getHitDieForClass,
  getSpellsForClass,
  getCantripsByClass,
  getLeveledSpellsByClass,
  aggregateProficiencies,
  getRaceProficiencies,
  getClassProficiencies,
  getBackgroundProficiencies,
  loadRaces,
  loadClasses,
  SPELL_DATABASE,
} from '../services/dataService';

describe('Data Service Functions', () => {
  describe('getHitDieForClass', () => {
    it('should return correct hit die for each class', () => {
      expect(getHitDieForClass('barbarian')).toBe(12);
      expect(getHitDieForClass('fighter')).toBe(10);
      expect(getHitDieForClass('paladin')).toBe(10);
      expect(getHitDieForClass('ranger')).toBe(10);
      expect(getHitDieForClass('bard')).toBe(8);
      expect(getHitDieForClass('cleric')).toBe(8);
      expect(getHitDieForClass('druid')).toBe(8);
      expect(getHitDieForClass('monk')).toBe(8);
      expect(getHitDieForClass('rogue')).toBe(8);
      expect(getHitDieForClass('sorcerer')).toBe(6);
      expect(getHitDieForClass('warlock')).toBe(8);
      expect(getHitDieForClass('wizard')).toBe(6);
    });

    it('should handle class name variations', () => {
      expect(getHitDieForClass('wizard-evocation')).toBe(6); // Subclass
      expect(getHitDieForClass('fighter-champion')).toBe(10); // Subclass
    });

    it('should return default d8 for unknown classes', () => {
      expect(getHitDieForClass('unknown-class')).toBe(8);
      expect(getHitDieForClass('')).toBe(8);
    });
  });

  describe('Spell Functions', () => {
    it('should return spells for wizard class', () => {
      const spells = getSpellsForClass('wizard');
      expect(spells.length).toBeGreaterThan(0);
      expect(spells.some(spell => spell.name.includes('Magic Missile'))).toBe(true);
    });

    it('should return cantrips for cleric class', () => {
      const cantrips = getCantripsByClass('cleric');
      expect(cantrips.length).toBeGreaterThan(0);
      expect(cantrips.every(spell => spell.level === 0)).toBe(true);
    });

    it('should return leveled spells for wizard class', () => {
      const spells = getLeveledSpellsByClass('wizard', 1);
      expect(spells.length).toBeGreaterThan(0);
      expect(spells.every(spell => spell.level === 1)).toBe(true);
    });

    it('should include source information in spells', () => {
      const spells = SPELL_DATABASE;
      expect(spells.length).toBeGreaterThan(300); // Should have merged spells

      // Check that all spells have source field
      expect(spells.every(spell => spell.source === '2014' || spell.source === '2024')).toBe(true);

      // Check that we have both sources
      const sources = [...new Set(spells.map(s => s.source))];
      expect(sources.length).toBeGreaterThan(1); // Should have both 2014 and 2024
      expect(sources).toContain('2014');
      expect(sources).toContain('2024');
    });
  });

  describe('Proficiency Functions', () => {
    it('should return race proficiencies for dwarf', () => {
      const proficiencies = getRaceProficiencies('mountain-dwarf');
      expect(proficiencies).toHaveProperty('armor');
      expect(proficiencies).toHaveProperty('weapons');
      expect(proficiencies).toHaveProperty('tools');
    });

    it('should return class proficiencies for fighter', () => {
      const proficiencies = getClassProficiencies('fighter');
      expect(proficiencies).toHaveProperty('armor');
      expect(proficiencies).toHaveProperty('weapons');
    });

    it('should aggregate proficiencies correctly', () => {
      const proficiencies = aggregateProficiencies('mountain-dwarf', 'fighter', 'soldier');
      expect(proficiencies.armor).toBeDefined();
      expect(proficiencies.weapons).toBeDefined();
      expect(Array.isArray(proficiencies.armor)).toBe(true);
      expect(Array.isArray(proficiencies.weapons)).toBe(true);
    });
  });

  describe('Data Loading', () => {
    it('should load races successfully', () => {
      const races = loadRaces();
      expect(races.length).toBeGreaterThan(0);
      expect(races[0]).toHaveProperty('slug');
      expect(races[0]).toHaveProperty('name');
      expect(races[0]).toHaveProperty('speed');
    });

    it('should load classes successfully', () => {
      const classes = loadClasses();
      expect(classes.length).toBeGreaterThan(0);
      expect(classes[0]).toHaveProperty('slug');
      expect(classes[0]).toHaveProperty('name');
      expect(classes[0]).toHaveProperty('hit_die');
    });
  });
});
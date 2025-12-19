/**
 * Rogue Class Effects
 * Pure data - no game logic in code
 *
 * Rogue is a versatile class focused on skills, stealth, and precision damage.
 * Key features: Sneak Attack, Expertise, Cunning Action, Evasion
 */

import type { SourcedEffect } from '../../types/effects';

/**
 * Rogue Proficiencies
 * Armor: Light armor
 * Weapons: Simple weapons, hand crossbows, longswords, rapiers, shortswords
 * Tools: Thieves' tools
 * Saves: DEX, INT
 * Skills: Choose 4 from Acrobatics, Athletics, Deception, Insight, Intimidation,
 *         Investigation, Perception, Performance, Persuasion, Sleight of Hand, Stealth
 */
export const rogueProficiencies: SourcedEffect = {
  sourceId: 'class:rogue',
  effectId: 'rogue-proficiencies',
  name: 'Rogue Proficiencies',
  description: 'You gain proficiency with light armor, simple weapons, and thieves\' tools.',
  effects: [
    {
      kind: 'grantProficiency',
      profType: 'armor',
      values: ['Light armor'],
    },
    {
      kind: 'grantProficiency',
      profType: 'weapon',
      values: ['Simple weapons', 'Hand crossbows', 'Longswords', 'Rapiers', 'Shortswords'],
    },
    {
      kind: 'grantProficiency',
      profType: 'tool',
      values: ['Thieves\' tools'],
    },
    {
      kind: 'grantProficiency',
      profType: 'savingThrow',
      values: ['DEX', 'INT'],
    },
  ],
};

/**
 * Sneak Attack
 * Level 1+: Deal extra damage when you have advantage or ally within 5 feet
 * Damage scales: 1d6 at level 1, +1d6 every 2 levels
 */
export const sneakAttack: SourcedEffect = {
  sourceId: 'class:rogue',
  effectId: 'sneak-attack',
  name: 'Sneak Attack',
  description: 'Once per turn, you can deal an extra 1d6 damage to one creature you hit with an attack if you have advantage on the attack roll. The attack must use a finesse or ranged weapon. You don\'t need advantage if another enemy of the target is within 5 feet of it. The sneak attack damage increases as you gain levels.',
  effects: [
    {
      kind: 'grantFeature',
      featureId: 'sneak-attack',
      name: 'Sneak Attack',
      description: 'Deal extra damage when you have advantage on attack rolls with finesse or ranged weapons.',
    },
    {
      kind: 'tag',
      tags: ['sneak-attack'],
    },
  ],
};

/**
 * Thieves' Cant
 * Level 1: Secret language known to all rogues
 */
export const thievesCant: SourcedEffect = {
  sourceId: 'class:rogue',
  effectId: 'thieves-cant',
  name: 'Thieves\' Cant',
  description: 'You know thieves\' cant, a secret mix of dialect, jargon, and code that allows you to hide messages in seemingly normal conversation.',
  effects: [
    {
      kind: 'grantProficiency',
      profType: 'language',
      values: ['Thieves\' Cant'],
      predicate: [{ type: 'classLevelAtLeast', classSlug: 'rogue', level: 1 }],
    },
    {
      kind: 'grantFeature',
      featureId: 'thieves-cant',
      name: 'Thieves\' Cant',
      description: 'You know a secret language used by rogues to communicate covertly.',
      predicate: [{ type: 'classLevelAtLeast', classSlug: 'rogue', level: 1 }],
    },
  ],
};

/**
 * Expertise
 * Level 1: Choose 2 skills, double proficiency bonus
 * Level 6: Choose 2 more skills
 */
export const expertiseLevel1: SourcedEffect = {
  sourceId: 'class:rogue',
  effectId: 'expertise-1',
  name: 'Expertise (Level 1)',
  description: 'Choose two of your skill proficiencies. Your proficiency bonus is doubled for any ability check you make that uses either of the chosen proficiencies.',
  choice: {
    id: 'rogue-expertise-1',
    prompt: 'Choose 2 skills to gain expertise',
    type: 'multiselect',
    min: 2,
    max: 2,
    predicate: [{ type: 'classLevelAtLeast', classSlug: 'rogue', level: 1 }],
    options: [
      { value: 'Acrobatics', label: 'Acrobatics', description: 'Double proficiency for Acrobatics checks', effects: [{ kind: 'skillExpertise', skill: 'Acrobatics' }] },
      { value: 'Athletics', label: 'Athletics', description: 'Double proficiency for Athletics checks', effects: [{ kind: 'skillExpertise', skill: 'Athletics' }] },
      { value: 'Deception', label: 'Deception', description: 'Double proficiency for Deception checks', effects: [{ kind: 'skillExpertise', skill: 'Deception' }] },
      { value: 'Insight', label: 'Insight', description: 'Double proficiency for Insight checks', effects: [{ kind: 'skillExpertise', skill: 'Insight' }] },
      { value: 'Intimidation', label: 'Intimidation', description: 'Double proficiency for Intimidation checks', effects: [{ kind: 'skillExpertise', skill: 'Intimidation' }] },
      { value: 'Investigation', label: 'Investigation', description: 'Double proficiency for Investigation checks', effects: [{ kind: 'skillExpertise', skill: 'Investigation' }] },
      { value: 'Perception', label: 'Perception', description: 'Double proficiency for Perception checks', effects: [{ kind: 'skillExpertise', skill: 'Perception' }] },
      { value: 'Performance', label: 'Performance', description: 'Double proficiency for Performance checks', effects: [{ kind: 'skillExpertise', skill: 'Performance' }] },
      { value: 'Persuasion', label: 'Persuasion', description: 'Double proficiency for Persuasion checks', effects: [{ kind: 'skillExpertise', skill: 'Persuasion' }] },
      { value: 'Sleight of Hand', label: 'Sleight of Hand', description: 'Double proficiency for Sleight of Hand checks', effects: [{ kind: 'skillExpertise', skill: 'Sleight of Hand' }] },
      { value: 'Stealth', label: 'Stealth', description: 'Double proficiency for Stealth checks', effects: [{ kind: 'skillExpertise', skill: 'Stealth' }] },
    ],
  },
};

/**
 * Cunning Action
 * Level 2: Bonus action to Dash, Disengage, or Hide
 */
export const cunningAction: SourcedEffect = {
  sourceId: 'class:rogue',
  effectId: 'cunning-action',
  name: 'Cunning Action',
  description: 'You can take a bonus action on each of your turns in combat to take the Dash, Disengage, or Hide action.',
  effects: [
    {
      kind: 'grantFeature',
      featureId: 'cunning-action',
      name: 'Cunning Action',
      description: 'Use a bonus action to Dash, Disengage, or Hide.',
      predicate: [{ type: 'classLevelAtLeast', classSlug: 'rogue', level: 2 }],
    },
    {
      kind: 'tag',
      tags: ['cunning-action', 'bonus-action-dash', 'bonus-action-disengage', 'bonus-action-hide'],
      predicate: [{ type: 'classLevelAtLeast', classSlug: 'rogue', level: 2 }],
    },
  ],
};

/**
 * Uncanny Dodge
 * Level 5: Use reaction to halve damage from one attack
 */
export const uncannyDodge: SourcedEffect = {
  sourceId: 'class:rogue',
  effectId: 'uncanny-dodge',
  name: 'Uncanny Dodge',
  description: 'When an attacker that you can see hits you with an attack, you can use your reaction to halve the attack\'s damage against you.',
  effects: [
    {
      kind: 'grantFeature',
      featureId: 'uncanny-dodge',
      name: 'Uncanny Dodge',
      description: 'Use your reaction to halve damage from one attack.',
      predicate: [{ type: 'classLevelAtLeast', classSlug: 'rogue', level: 5 }],
    },
    {
      kind: 'tag',
      tags: ['uncanny-dodge', 'reaction-damage-reduction'],
      predicate: [{ type: 'classLevelAtLeast', classSlug: 'rogue', level: 5 }],
    },
  ],
};

/**
 * Evasion
 * Level 7: No damage on successful DEX save, half damage on failed save
 */
export const evasion: SourcedEffect = {
  sourceId: 'class:rogue',
  effectId: 'evasion',
  name: 'Evasion',
  description: 'When you are subjected to an effect that allows you to make a Dexterity saving throw to take only half damage, you instead take no damage if you succeed on the saving throw, and only half damage if you fail.',
  effects: [
    {
      kind: 'grantFeature',
      featureId: 'evasion',
      name: 'Evasion',
      description: 'Take no damage on successful DEX save, half damage on failed save.',
      predicate: [{ type: 'classLevelAtLeast', classSlug: 'rogue', level: 7 }],
    },
    {
      kind: 'tag',
      tags: ['evasion'],
      predicate: [{ type: 'classLevelAtLeast', classSlug: 'rogue', level: 7 }],
    },
  ],
};

/**
 * Reliable Talent
 * Level 11: Minimum roll of 10 on any ability check with proficiency
 */
export const reliableTalent: SourcedEffect = {
  sourceId: 'class:rogue',
  effectId: 'reliable-talent',
  name: 'Reliable Talent',
  description: 'Whenever you make an ability check that lets you add your proficiency bonus, you can treat a d20 roll of 9 or lower as a 10.',
  effects: [
    {
      kind: 'grantFeature',
      featureId: 'reliable-talent',
      name: 'Reliable Talent',
      description: 'Minimum roll of 10 on ability checks with proficiency.',
      predicate: [{ type: 'classLevelAtLeast', classSlug: 'rogue', level: 11 }],
    },
    {
      kind: 'tag',
      tags: ['reliable-talent'],
      predicate: [{ type: 'classLevelAtLeast', classSlug: 'rogue', level: 11 }],
    },
  ],
};

/**
 * Blindsense
 * Level 14: Detect invisible/hidden creatures within 10 feet
 */
export const blindsense: SourcedEffect = {
  sourceId: 'class:rogue',
  effectId: 'blindsense',
  name: 'Blindsense',
  description: 'If you are able to hear, you are aware of the location of any hidden or invisible creature within 10 feet of you.',
  effects: [
    {
      kind: 'sense',
      senseType: 'blindsight',
      range: 10,
      predicate: [{ type: 'classLevelAtLeast', classSlug: 'rogue', level: 14 }],
    },
    {
      kind: 'grantFeature',
      featureId: 'blindsense',
      name: 'Blindsense',
      description: 'Detect hidden/invisible creatures within 10 feet.',
      predicate: [{ type: 'classLevelAtLeast', classSlug: 'rogue', level: 14 }],
    },
    {
      kind: 'tag',
      tags: ['blindsense'],
      predicate: [{ type: 'classLevelAtLeast', classSlug: 'rogue', level: 14 }],
    },
  ],
};

/**
 * Slippery Mind
 * Level 15: Proficiency in WIS saves
 */
export const slipperyMind: SourcedEffect = {
  sourceId: 'class:rogue',
  effectId: 'slippery-mind',
  name: 'Slippery Mind',
  description: 'You have acquired greater mental strength. You gain proficiency in Wisdom saving throws.',
  effects: [
    {
      kind: 'grantProficiency',
      profType: 'savingThrow',
      values: ['WIS'],
      predicate: [{ type: 'classLevelAtLeast', classSlug: 'rogue', level: 15 }],
    },
    {
      kind: 'grantFeature',
      featureId: 'slippery-mind',
      name: 'Slippery Mind',
      description: 'You gain proficiency in Wisdom saving throws.',
      predicate: [{ type: 'classLevelAtLeast', classSlug: 'rogue', level: 15 }],
    },
  ],
};

/**
 * Elusive
 * Level 18: No attack has advantage against you while you're not incapacitated
 */
export const elusive: SourcedEffect = {
  sourceId: 'class:rogue',
  effectId: 'elusive',
  name: 'Elusive',
  description: 'You are so evasive that attackers rarely gain the upper hand against you. No attack roll has advantage against you while you aren\'t incapacitated.',
  effects: [
    {
      kind: 'grantFeature',
      featureId: 'elusive',
      name: 'Elusive',
      description: 'No attack has advantage against you while not incapacitated.',
      predicate: [{ type: 'classLevelAtLeast', classSlug: 'rogue', level: 18 }],
    },
    {
      kind: 'tag',
      tags: ['elusive', 'no-advantage-against'],
      predicate: [{ type: 'classLevelAtLeast', classSlug: 'rogue', level: 18 }],
    },
  ],
};

/**
 * All Rogue effects
 */
export const rogueEffects: SourcedEffect[] = [
  rogueProficiencies,
  sneakAttack,
  thievesCant,
  expertiseLevel1,
  cunningAction,
  uncannyDodge,
  evasion,
  reliableTalent,
  blindsense,
  slipperyMind,
  elusive,
];

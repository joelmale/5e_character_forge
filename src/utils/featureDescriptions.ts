// src/utils/featureDescriptions.ts

export const featureDescriptions: Record<string, { description: string; source?: string }> = {
  // General
  'Darkvision': {
    description: 'Accustomed to life underground, you have superior vision in dark and dim conditions. You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can’t discern color in darkness, only shades of gray.',
    source: 'Player\'s Handbook'
  },
  'Superior Darkvision (120ft)': {
    description: 'Your darkvision has a radius of 120 feet.',
    source: 'Player\'s Handbook'
  },
  'Speed 30ft': {
    description: 'Your base walking speed is 30 feet.',
    source: 'Player\'s Handbook'
  },
  'Speed 25ft': {
    description: 'Your base walking speed is 25 feet. Your speed is not reduced by wearing heavy armor.',
    source: 'Player\'s Handbook'
  },

  // Dwarf
  'Dwarven Resilience': {
    description: 'You have advantage on saving throws against poison, and you have resistance against poison damage.',
    source: 'Player\'s Handbook'
  },
  'Dwarven Armor Training': {
    description: 'You have proficiency with light and medium armor.',
    source: 'Player\'s Handbook'
  },
  'Dwarven Toughness (+1 HP/level)': {
    description: 'Your hit point maximum increases by 1, and it increases by 1 every time you gain a level.',
    source: 'Player\'s Handbook'
  },

  // Elf
  'Fey Ancestry': {
    description: 'You have advantage on saving throws against being charmed, and magic can’t put you to sleep.',
    source: 'Player\'s Handbook'
  },
  'Trance': {
    description: 'Elves don’t need to sleep. Instead, they meditate deeply, remaining semiconscious, for 4 hours a day. After resting in this way, you gain the same benefit that a human does from 8 hours of sleep.',
    source: 'Player\'s Handbook'
  },
  'Sunlight Sensitivity': {
    description: 'You have disadvantage on attack rolls and on Wisdom (Perception) checks that rely on sight when you, the target of your attack, or whatever you are trying to perceive is in direct sunlight.',
    source: 'Player\'s Handbook'
  },
  'Drow Magic': {
    description: 'You know the Dancing Lights cantrip. When you reach 3rd level, you can cast the Faerie Fire spell once per day. When you reach 5th level, you can also cast the Darkness spell once per day. Charisma is your spellcasting ability for these spells.',
    source: 'Player\'s Handbook'
  },
  'Mask of the Wild': {
    description: 'You can attempt to hide even when you are only lightly obscured by foliage, heavy rain, falling snow, mist, and other natural phenomena.',
    source: 'Player\'s Handbook'
  },

  // Halfling
  'Lucky': {
    description: 'When you roll a 1 on an attack roll, ability check, or saving throw, you can reroll the die and must use the new roll.',
    source: 'Player\'s Handbook'
  },
  'Brave': {
    description: 'You have advantage on saving throws against being frightened.',
    source: 'Player\'s Handbook'
  },
  'Naturally Stealthy': {
    description: 'You can attempt to hide even when you are obscured only by a creature that is at least one size larger than you.',
    source: 'Player\'s Handbook'
  },
  'Stout Resilience (poison advantage)': {
    description: 'You have advantage on saving throws against poison, and you have resistance against poison damage.',
    source: 'Player\'s Handbook'
  },

  // Human
  'Ability Score Increase (+1 to all)': {
    description: 'All of your ability scores increase by 1.',
    source: 'Player\'s Handbook'
  },
  'Extra Language': {
    description: 'You can speak, read, and write one extra language of your choice.',
    source: 'Player\'s Handbook'
  },

  // Dragonborn
  'Draconic Ancestry': {
    description: 'You have a draconic ancestry. Choose one type of dragon from the Draconic Ancestry table. Your breath weapon and damage resistance are determined by the dragon type, as shown in the table.',
    source: 'Player\'s Handbook'
  },
  'Breath Weapon': {
    description: 'You can use your action to exhale destructive energy. Your draconic ancestry determines the size, shape, and damage type of the exhalation. When you use your breath weapon, each creature in the area of the exhalation must make a saving throw, the type of which is determined by your draconic ancestry. The DC for this saving throw equals 8 + your Constitution modifier + your proficiency bonus. A creature takes 2d6 damage on a failed save, and half as much damage on a successful one. The damage increases to 3d6 at 6th level, 4d6 at 11th level, and 5d6 at 16th level. After you use your breath weapon, you can’t use it again until you complete a short or long rest.',
    source: 'Player\'s Handbook'
  },
  'Damage Resistance': {
    description: 'You have resistance to the damage type associated with your draconic ancestry.',
    source: 'Player\'s Handbook'
  },

  // Gnome
  'Gnome Cunning': {
    description: 'You have advantage on all Intelligence, Wisdom, and Charisma saving throws against magic.',
    source: 'Player\'s Handbook'
  },

  // Half-Elf
  'Skill Versatility (2 skills)': {
    description: 'You gain proficiency in two skills of your choice.',
    source: 'Player\'s Handbook'
  },

  // Half-Orc
  'Relentless Endurance': {
    description: 'When you are reduced to 0 hit points but not killed outright, you can drop to 1 hit point instead. You can’t use this feature again until you finish a long rest.',
    source: 'Player\'s Handbook'
  },
  'Savage Attacks': {
    description: 'When you score a critical hit with a melee weapon attack, you can roll one of the weapon’s damage dice one additional time and add it to the extra damage of the critical hit.',
    source: 'Player\'s Handbook'
  },
  'Menacing (Intimidation)': {
    description: 'You gain proficiency in the Intimidation skill.',
    source: 'Player\'s Handbook'
  },

  // Tiefling
  'Hellish Resistance (fire)': {
    description: 'You have resistance to fire damage.',
    source: 'Player\'s Handbook'
  },

  // Barbarian
  'Rage': {
    description: 'On your turn, you can enter a rage as a bonus action. While raging, you gain the following benefits if you aren’t wearing heavy armor: you have advantage on Strength checks and Strength saving throws; when you make a melee weapon attack using Strength, you gain a bonus to the damage roll that increases as you gain levels as a barbarian; you have resistance to bludgeoning, piercing, and slashing damage. Your rage lasts for 1 minute. It ends early if you are knocked unconscious or if your turn ends and you haven’t attacked a hostile creature since your last turn or taken damage since then. You can also end your rage on your turn as a bonus action.',
    source: 'Player\'s Handbook'
  },
  'Unarmored Defense': {
    description: 'While you are not wearing any armor, your Armor Class equals 10 + your Dexterity modifier + your Constitution modifier. You can use a shield and still gain this benefit.',
    source: 'Player\'s Handbook'
  },
};

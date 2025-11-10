import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Dice6, Plus, Trash2, Loader2, BookOpen, User as UserIcon, Shield, Zap, ArrowLeft, ArrowRight, Check, Download, Upload } from 'lucide-react';
import { DiceBox3D } from './components/DiceBox3D';
import { RollHistoryModal, RollHistoryTicker } from './components/RollHistory';
import { createAbilityRoll, createSkillRoll, createInitiativeRoll, getRollHistory, addRollToHistory, clearRollHistory, type DiceRoll as DiceRollType } from './utils/diceRoller';
import { diceSounds } from './utils/diceSounds';

// --- IndexedDB Configuration ---
const DB_NAME = '5e_character_forge';
const DB_VERSION = 1;
const STORE_NAME = 'characters';

// --- IndexedDB Helper Functions ---
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: false });
        objectStore.createIndex('name', 'name', { unique: false });
        objectStore.createIndex('class', 'class', { unique: false });
        objectStore.createIndex('level', 'level', { unique: false });
      }
    };
  });
};

const getAllCharacters = async (): Promise<Character[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

const addCharacter = async (character: Character): Promise<string> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.add(character);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(character.id);
  });
};

const deleteCharacter = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

// --- D&D 5e Character Interface (Must be adhered to) ---
interface AbilityScore { score: number; modifier: number; }
interface Skill { value: number; proficient: boolean; }

interface Character {
  id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  alignment: string;
  background: string;
  inspiration: boolean;
  proficiencyBonus: number;
  armorClass: number;
  hitPoints: number;
  maxHitPoints: number;
  speed: number;
  initiative: number;
  abilities: {
    STR: AbilityScore; DEX: AbilityScore; CON: AbilityScore;
    INT: AbilityScore; WIS: AbilityScore; CHA: AbilityScore;
  };
  skills: {
    Acrobatics: Skill; AnimalHandling: Skill; Arcana: Skill; Athletics: Skill; Deception: Skill; History: Skill; Insight: Skill; Intimidation: Skill; Investigation: Skill; Medicine: Skill; Nature: Skill; Perception: Skill; Performance: Skill; Persuasion: Skill; Religion: Skill; SleightOfHand: Skill; Stealth: Skill; Survival: Skill;
  };
  featuresAndTraits: {
    personality: string;
    ideals: string;
    bonds: string;
    flaws: string;
    classFeatures: string[];
    racialTraits: string[];
  };
}

// --- Intermediate Wizard Data Structure ---
type AbilityName = keyof Character['abilities'];
type SkillName = keyof Character['skills'];

interface CharacterCreationData {
  name: string;
  level: number;
  raceSlug: string;
  classSlug: string;
  abilities: Record<AbilityName, number>; // Raw scores only during creation
  background: string;
  alignment: string;

  // Custom text for traits
  personality: string;
  ideals: string;
  bonds: string;
  flaws: string;
}

// Initial state for the creation process
const initialCreationData: CharacterCreationData = {
  name: '',
  level: 1,
  raceSlug: '',
  classSlug: '',
  abilities: { STR: 8, DEX: 8, CON: 8, INT: 8, WIS: 8, CHA: 8 },
  background: 'Outlander',
  alignment: 'Neutral Good',
  personality: "I'm quiet until I have something important to say.",
  ideals: "Honesty. The truth must be preserved.",
  bonds: "I owe my life to the individual who saved me.",
  flaws: "I trust no one and question everything.",
};

// --- Mock API Data and Ruleset Functions (Simulating dnd5eapi.co) ---

const MOCK_RACES = [
  { slug: 'human', name: 'Human', ability_bonuses: { STR: 1, DEX: 1, CON: 1, INT: 1, WIS: 1, CHA: 1 }, racial_traits: ['Ability Score Increase (+1 to all)', 'Speed 30ft', 'Skills: Common'] },
  { slug: 'dwarf', name: 'Dwarf (Hill)', ability_bonuses: { CON: 2, WIS: 1 }, racial_traits: ['Ability Score Increase', 'Speed 25ft', 'Dwarven Toughness (+1 HP/level)'] },
  { slug: 'elf', name: 'Elf (High)', ability_bonuses: { DEX: 2, INT: 1 }, racial_traits: ['Ability Score Increase', 'Speed 30ft', 'Darkvision', 'Fey Ancestry'] },
];

const MOCK_CLASSES = [
  { slug: 'fighter', name: 'Fighter', hit_die: 10, primary_stat: 'STR', save_throws: ['STR', 'CON'], skill_proficiencies: ['Athletics', 'Acrobatics'], class_features: ['Fighting Style', 'Second Wind'] },
  { slug: 'wizard', name: 'Wizard', hit_die: 6, primary_stat: 'INT', save_throws: ['INT', 'WIS'], skill_proficiencies: ['Arcana', 'History'], class_features: ['Spellcasting', 'Arcane Recovery'] },
  { slug: 'rogue', name: 'Rogue', hit_die: 8, primary_stat: 'DEX', save_throws: ['DEX', 'INT'], skill_proficiencies: ['SleightOfHand', 'Stealth', 'Acrobatics', 'Deception'], class_features: ['Expertise', 'Sneak Attack'] },
];

const ALIGNMENTS = [
  'Lawful Good',
  'Neutral Good',
  'Chaotic Good',
  'Lawful Neutral',
  'True Neutral',
  'Chaotic Neutral',
  'Lawful Evil',
  'Neutral Evil',
  'Chaotic Evil'
];

const BACKGROUNDS = [
  {
    name: 'Acolyte',
    description: 'You have spent your life in the service of a temple to a specific god or pantheon of gods. You act as an intermediary between the realm of the holy and the mortal world, performing sacred rites and offering sacrifices.',
    skillProficiencies: ['Insight', 'Religion'],
    languages: 'Two of your choice',
    equipment: 'Holy symbol, prayer book, 5 sticks of incense, vestments, common clothes, pouch with 15gp',
    feature: 'Shelter of the Faithful',
    featureDescription: 'As an acolyte, you command the respect of those who share your faith. You and your companions can expect free healing and care at temples, shrines, and other establishments of your faith. Those who share your religion will support you at a modest lifestyle.',
  },
  {
    name: 'Criminal',
    description: 'You are an experienced criminal with a history of breaking the law. You have spent a lot of time among other criminals and still have contacts within the criminal underworld.',
    skillProficiencies: ['Deception', 'Stealth'],
    languages: 'None',
    equipment: 'Crowbar, dark common clothes with hood, pouch with 15gp',
    feature: 'Criminal Contact',
    featureDescription: 'You have a reliable and trustworthy contact who acts as your liaison to a network of other criminals. You know how to get messages to and from your contact, even over great distances.',
  },
  {
    name: 'Folk Hero',
    description: 'You come from a humble social rank, but you are destined for so much more. Already the people of your home village regard you as their champion, and your destiny calls you to stand against the tyrants and monsters that threaten the common folk.',
    skillProficiencies: ['AnimalHandling', 'Survival'],
    languages: 'None',
    equipment: 'Artisan\'s tools, shovel, iron pot, common clothes, pouch with 10gp',
    feature: 'Rustic Hospitality',
    featureDescription: 'Since you come from the ranks of the common folk, you fit in among them with ease. You can find a place to hide, rest, or recuperate among other commoners, unless you have shown yourself to be a danger to them.',
  },
  {
    name: 'Noble',
    description: 'You understand wealth, power, and privilege. You carry a noble title, and your family owns land, collects taxes, and wields significant political influence.',
    skillProficiencies: ['History', 'Persuasion'],
    languages: 'One of your choice',
    equipment: 'Fine clothes, signet ring, scroll of pedigree, purse with 25gp',
    feature: 'Position of Privilege',
    featureDescription: 'Thanks to your noble birth, people are inclined to think the best of you. You are welcome in high society, and people assume you have the right to be wherever you are. The common folk make every effort to accommodate you and avoid your displeasure.',
  },
  {
    name: 'Sage',
    description: 'You spent years learning the lore of the multiverse. You scoured manuscripts, studied scrolls, and listened to the greatest experts on the subjects that interest you.',
    skillProficiencies: ['Arcana', 'History'],
    languages: 'Two of your choice',
    equipment: 'Bottle of ink, quill, small knife, letter from dead colleague, common clothes, pouch with 10gp',
    feature: 'Researcher',
    featureDescription: 'When you attempt to learn or recall a piece of lore, if you do not know that information, you often know where and from whom you can obtain it. Usually, this comes from a library, scriptorium, university, or a sage or other learned person.',
  },
  {
    name: 'Soldier',
    description: 'War has been your life for as long as you care to remember. You trained as a youth, studied the use of weapons and armor, learned basic survival techniques, and eventually took up arms to defend your people.',
    skillProficiencies: ['Athletics', 'Intimidation'],
    languages: 'None',
    equipment: 'Rank insignia, trophy from fallen enemy, bone dice set, common clothes, pouch with 10gp',
    feature: 'Military Rank',
    featureDescription: 'You have a military rank from your career as a soldier. Soldiers loyal to your former military organization still recognize your authority and influence, and they defer to you if they are of a lower rank.',
  },
];

const SKILL_TO_ABILITY: Record<SkillName, AbilityName> = {
    Acrobatics: 'DEX', AnimalHandling: 'WIS', Arcana: 'INT', Athletics: 'STR', Deception: 'CHA', History: 'INT', Insight: 'WIS', Intimidation: 'CHA', Investigation: 'INT', Medicine: 'WIS', Nature: 'INT', Perception: 'WIS', Performance: 'CHA', Persuasion: 'CHA', Religion: 'INT', SleightOfHand: 'DEX', Stealth: 'DEX', Survival: 'WIS',
};
const ALL_SKILLS = Object.keys(SKILL_TO_ABILITY) as SkillName[];
const PROFICIENCY_BONUSES = { 1: 2, 2: 2, 3: 2, 4: 2, 5: 3, 6: 3, 7: 3, 8: 3, 9: 4, 10: 4 };

const getModifier = (score: number): number => Math.floor((score - 10) / 2);

const calculateCharacterStats = (data: CharacterCreationData): Character => {
  const raceData = MOCK_RACES.find(r => r.slug === data.raceSlug);
  const classData = MOCK_CLASSES.find(c => c.slug === data.classSlug);

  if (!raceData || !classData) {
    throw new Error("Incomplete creation data.");
  }

  const finalAbilities: Character['abilities'] = {} as Character['abilities'];

  // 1. Calculate Abilities with Racial Bonuses
  (Object.keys(data.abilities) as AbilityName[]).forEach((ability) => {
    const rawScore = data.abilities[ability] + (raceData.ability_bonuses[ability] || 0);
    const modifier = getModifier(rawScore);
    finalAbilities[ability] = { score: rawScore, modifier };
  });

  const level = data.level;
  const pb = PROFICIENCY_BONUSES[level as keyof typeof PROFICIENCY_BONUSES] || 2;

  // 2. Calculate Hit Points (Simplified for Level 1)
  const maxHitPoints = classData.hit_die + finalAbilities.CON.modifier + (raceData.slug === 'dwarf' ? level : 0);

  // 3. Calculate Skills
  const finalSkills: Character['skills'] = {} as Character['skills'];
  ALL_SKILLS.forEach((skillName) => {
    const ability = SKILL_TO_ABILITY[skillName];
    const modifier = finalAbilities[ability].modifier;
    const isProficient = classData.skill_proficiencies.includes(skillName);

    finalSkills[skillName] = {
      proficient: isProficient,
      value: modifier + (isProficient ? pb : 0),
    };
  });

  // 4. Construct Final Character Object
  return {
    id: crypto.randomUUID(), // Generate UUID for IndexedDB
    name: data.name || "Unnamed Hero",
    race: raceData.name,
    class: classData.name,
    level,
    alignment: data.alignment,
    background: data.background,
    inspiration: false,
    proficiencyBonus: pb,
    armorClass: 10 + finalAbilities.DEX.modifier,
    hitPoints: maxHitPoints,
    maxHitPoints,
    speed: 30,
    initiative: finalAbilities.DEX.modifier,
    abilities: finalAbilities,
    skills: finalSkills,
    featuresAndTraits: {
      personality: data.personality,
      ideals: data.ideals,
      bonds: data.bonds,
      flaws: data.flaws,
      classFeatures: classData.class_features,
      racialTraits: raceData.racial_traits,
    }
  };
};

// --- Component Props Interfaces ---
interface CharacterSheetProps {
  character: Character;
  onClose: () => void;
  onDelete: (id: string) => void;
  setRollResult: React.Dispatch<React.SetStateAction<{ text: string; value: number | null }>>;
  onDiceRoll: (roll: DiceRollType) => void;
}

interface WizardProps {
  isOpen: boolean;
  onClose: () => void;
  onCharacterCreated: () => void;
  setRollResult: React.Dispatch<React.SetStateAction<{ text: string; value: number | null }>>;
}

// --- Utility Functions ---

const formatModifier = (mod: number): string => mod >= 0 ? `+${mod}` : `${mod}`;


// --- Sub-Components (CharacterSheet) ---

const AbilityScoreBlock: React.FC<{ name: AbilityName; ability: AbilityScore; setRollResult: CharacterSheetProps['setRollResult']; onDiceRoll: (roll: DiceRollType) => void }> = ({ name, ability, setRollResult, onDiceRoll }) => {
  const handleClick = () => {
    const roll = createAbilityRoll(name, ability.score);
    setRollResult({ text: `${roll.label}: ${roll.notation}`, value: roll.total });
    onDiceRoll(roll);
  };

  return (
    <button
      onClick={handleClick}
      className="flex flex-col items-center justify-center p-1 bg-gray-700/50 rounded-lg shadow-inner hover:bg-red-700/70 transition-colors cursor-pointer w-full"
    >
      <div className="text-xs font-bold text-red-400">{name}</div>
      <div className="text-lg font-extrabold text-white bg-gray-900 rounded-full w-10 h-10 flex items-center justify-center border-2 border-red-500 my-1">{ability.score}</div>
      <div className="text-xl font-extrabold text-yellow-300">{formatModifier(ability.modifier)}</div>
    </button>
  );
};

const SkillEntry: React.FC<{ name: SkillName; skill: Skill; setRollResult: CharacterSheetProps['setRollResult']; onDiceRoll: (roll: DiceRollType) => void }> = ({ name, skill, setRollResult, onDiceRoll }) => {
  const skillLabel = name.replace(/([A-Z])/g, ' $1').trim();

  const handleClick = () => {
    const roll = createSkillRoll(skillLabel, skill.value);
    setRollResult({ text: `${roll.label}: ${roll.notation}`, value: roll.total });
    onDiceRoll(roll);
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center space-x-2 p-1.5 hover:bg-gray-800/50 rounded-lg transition-colors w-full text-left"
    >
      <input type="checkbox" checked={skill.proficient} readOnly className="form-checkbox text-red-600 rounded-sm bg-gray-700/50 border-gray-600 w-4 h-4 cursor-pointer" />
      <span className="font-mono text-lg w-8 text-yellow-400">{formatModifier(skill.value)}</span>
      <span className="text-sm font-semibold text-white truncate">{skillLabel}</span>
    </button>
  );
};

const CharacterSheet: React.FC<CharacterSheetProps> = ({ character, onClose, onDelete, setRollResult, onDiceRoll }) => {
  const abilities = Object.entries(character.abilities) as [AbilityName, AbilityScore][];
  const skills = Object.entries(character.skills) as [SkillName, Skill][];
  const passivePerception = (character.skills.Perception.value + 10);

  // Handle initiative roll
  const handleInitiativeRoll = () => {
    const roll = createInitiativeRoll(character.initiative);
    setRollResult({ text: `${roll.label}: ${roll.notation}`, value: roll.total });
    onDiceRoll(roll);
  };

  return (
    <div className="p-4 md:p-8 bg-gray-900 text-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header and Controls */}
        <div className="flex justify-between items-center border-b border-red-700 pb-3">
          <h1 className="text-3xl font-serif font-bold text-red-500 truncate">{character.name}</h1>
          <div className="flex space-x-3">
            <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors font-medium">Back to List</button>
            <button onClick={() => onDelete(character.id)} className="p-2 bg-red-800 hover:bg-red-700 rounded-lg transition-colors" title="Delete Character"><Trash2 className="w-5 h-5 text-white" /></button>
          </div>
        </div>

        {/* Core Info Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center text-xs font-semibold">
          <div className="p-2 bg-gray-800 rounded-lg">Race: <span className="text-yellow-400 block text-sm">{character.race}</span></div>
          <div className="p-2 bg-gray-800 rounded-lg">Class: <span className="text-yellow-400 block text-sm">{character.class}</span></div>
          <div className="p-2 bg-gray-800 rounded-lg">Level: <span className="text-yellow-400 block text-sm">{character.level}</span></div>
          <div className="p-2 bg-gray-800 rounded-lg col-span-2 md:col-span-1">Alignment: <span className="text-yellow-400 block text-sm">{character.alignment}</span></div>
          <div className="p-2 bg-gray-800 rounded-lg col-span-2 md:col-span-1">Background: <span className="text-yellow-400 block text-sm">{character.background}</span></div>
        </div>

        {/* Main Stat Block */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 bg-gray-800/70 p-4 rounded-xl shadow-lg border border-red-900">
          <div className="col-span-1 flex flex-col items-center"><Shield className="w-6 h-6 text-red-500 mb-1" /><span className="text-sm font-semibold text-gray-400">AC</span><div className="text-4xl font-extrabold text-white">{character.armorClass}</div></div>
          <div className="col-span-2 flex flex-col items-center"><Zap className="w-6 h-6 text-red-500 mb-1" /><span className="text-sm font-semibold text-gray-400">HP (Max)</span><div className="text-4xl font-extrabold text-green-400">{character.hitPoints} <span className="text-gray-400">/</span> {character.maxHitPoints}</div></div>
          <button onClick={handleInitiativeRoll} className="col-span-1 flex flex-col items-center bg-gray-700/50 p-2 rounded-lg hover:bg-red-700/70 transition-colors" title="Roll Initiative"><Dice6 className="w-6 h-6 text-red-500 mb-1" /><span className="text-sm font-semibold text-gray-400">Init</span><div className="text-4xl font-extrabold text-yellow-300">{formatModifier(character.initiative)}</div></button>
          <div className="col-span-1 flex flex-col items-center"><BookOpen className="w-6 h-6 text-red-500 mb-1" /><span className="text-sm font-semibold text-gray-400">Prof.</span><div className="text-4xl font-extrabold text-yellow-300">{formatModifier(character.proficiencyBonus)}</div></div>
          <div className="col-span-1 flex flex-col items-center"><UserIcon className="w-6 h-6 text-red-500 mb-1" /><span className="text-sm font-semibold text-gray-400">P.Perc</span><div className="text-4xl font-extrabold text-white">{passivePerception}</div></div>
        </div>

        {/* Abilities and Skills Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1 space-y-4">
            <h2 className="text-xl font-bold text-red-500 border-b border-red-800 pb-1">Ability Scores</h2>
            <div className="grid grid-cols-3 gap-2">
              {abilities.map(([name, ability]) => (<AbilityScoreBlock key={name} name={name} ability={ability} setRollResult={setRollResult} onDiceRoll={onDiceRoll} />))}
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border-l-4 border-yellow-500">
                <span className="text-lg font-bold">Inspiration</span>
                <button className={`w-8 h-8 rounded-full transition-all ${character.inspiration ? 'bg-yellow-500' : 'bg-gray-600'}`}>
                    {character.inspiration && <Zap className="w-5 h-5 mx-auto text-gray-900" />}
                </button>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-red-500 border-b border-red-800 pb-1">Skills</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 bg-gray-800/70 p-3 rounded-xl border border-red-900 max-h-[450px] overflow-y-auto">
              {skills.sort((a, b) => a[0].localeCompare(b[0])).map(([name, skill]) => (<SkillEntry key={name} name={name} skill={skill} setRollResult={setRollResult} onDiceRoll={onDiceRoll} />))}
            </div>
          </div>
        </div>

        {/* Traits and Features Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-red-500 border-b border-red-800 pb-1">Features & Traits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-800 rounded-xl shadow-lg border-l-4 border-blue-500">
              <h3 className="text-lg font-bold text-blue-400 mb-2">Personality, Ideals, Bonds & Flaws</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                <li><span className="font-semibold text-white">Personality:</span> {character.featuresAndTraits.personality}</li>
                <li><span className="font-semibold text-white">Ideals:</span> {character.featuresAndTraits.ideals}</li>
                <li><span className="font-semibold text-white">Bonds:</span> {character.featuresAndTraits.bonds}</li>
                <li><span className="font-semibold text-white">Flaws:</span> {character.featuresAndTraits.flaws}</li>
              </ul>
            </div>
            <div className="p-4 bg-gray-800 rounded-xl shadow-lg border-l-4 border-green-500">
              <h3 className="text-lg font-bold text-green-400 mb-2">Racial & Class Features</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                {character.featuresAndTraits.racialTraits.map((trait, index) => (<li key={`r-${index}`} className='text-gray-400'><span className="font-semibold text-white">[Racial]</span> {trait}</li>))}
                {character.featuresAndTraits.classFeatures.map((feature, index) => (<li key={`c-${index}`} className='text-gray-400'><span className="font-semibold text-white">[Class]</span> {feature}</li>))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- Character Creation Wizard Steps ---

const STEP_TITLES = [
    'Character Details',
    'Choose Race',
    'Choose Class',
    'Determine Abilities',
    'Finalize Background'
];

interface StepProps {
    data: CharacterCreationData;
    updateData: (updates: Partial<CharacterCreationData>) => void;
    nextStep: () => void;
    prevStep: () => void;
    stepIndex: number;
}

const Step1Details: React.FC<StepProps> = ({ data, updateData, nextStep }) => {
    const selectedBackground = BACKGROUNDS.find(bg => bg.name === data.background);

    return (
        <div className='space-y-4'>
            <h3 className='text-xl font-bold text-red-300'>Basic Identity</h3>
            <input
                type="text"
                placeholder="Character Name (e.g., Elara Windwalker)"
                value={data.name}
                onChange={(e) => updateData({ name: e.target.value })}
                className="w-full p-3 bg-gray-700 text-white rounded-lg focus:ring-red-500 focus:border-red-500"
            />

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Alignment</label>
                <select
                    value={data.alignment}
                    onChange={(e) => updateData({ alignment: e.target.value })}
                    className="w-full p-3 bg-gray-700 text-white rounded-lg focus:ring-red-500 focus:border-red-500"
                >
                    <option value="">Select Alignment</option>
                    {ALIGNMENTS.map(alignment => (
                        <option key={alignment} value={alignment}>{alignment}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Background</label>
                <select
                    value={data.background}
                    onChange={(e) => updateData({ background: e.target.value })}
                    className="w-full p-3 bg-gray-700 text-white rounded-lg focus:ring-red-500 focus:border-red-500"
                >
                    <option value="">Select Background</option>
                    {BACKGROUNDS.map(bg => (
                        <option key={bg.name} value={bg.name}>{bg.name}</option>
                    ))}
                </select>
            </div>

            {selectedBackground && (
                <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 space-y-3">
                    <h4 className="text-lg font-bold text-yellow-300">{selectedBackground.name}</h4>
                    <p className="text-sm text-gray-300">{selectedBackground.description}</p>

                    <div className="space-y-2 text-sm">
                        <div>
                            <span className="font-semibold text-red-400">Skill Proficiencies: </span>
                            <span className="text-gray-300">{selectedBackground.skillProficiencies.join(', ')}</span>
                        </div>

                        <div>
                            <span className="font-semibold text-red-400">Languages: </span>
                            <span className="text-gray-300">{selectedBackground.languages}</span>
                        </div>

                        <div>
                            <span className="font-semibold text-red-400">Equipment: </span>
                            <span className="text-gray-300">{selectedBackground.equipment}</span>
                        </div>

                        <div className="pt-2 border-t border-gray-600">
                            <div className="font-semibold text-yellow-400 mb-1">Feature: {selectedBackground.feature}</div>
                            <p className="text-xs text-gray-400">{selectedBackground.featureDescription}</p>
                        </div>
                    </div>
                </div>
            )}

            <button
                onClick={nextStep}
                disabled={!data.name || !data.alignment || !data.background}
                className="w-full py-3 bg-red-600 hover:bg-red-500 rounded-xl text-white font-bold transition-colors disabled:bg-gray-600"
            >
                Next: Choose Race
            </button>
        </div>
    );
};

const Step2Race: React.FC<StepProps> = ({ data, updateData, nextStep, prevStep }) => (
    <div className='space-y-6'>
        <h3 className='text-xl font-bold text-red-300'>Select Race (Racial Bonuses will be applied automatically)</h3>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {MOCK_RACES.map(race => (
                <button
                    key={race.slug}
                    onClick={() => updateData({ raceSlug: race.slug })}
                    className={`p-4 rounded-xl text-left border-2 transition-all ${data.raceSlug === race.slug
                        ? 'bg-red-800 border-red-500 shadow-md'
                        : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`
                    }
                >
                    <p className='text-lg font-bold text-yellow-300'>{race.name}</p>
                    <ul className='text-xs text-gray-400 mt-1 list-disc list-inside'>
                        {race.racial_traits.map((trait, i) => <li key={i}>{trait}</li>)}
                    </ul>
                </button>
            ))}
        </div>
        <div className='flex justify-between'>
            <button onClick={prevStep} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white flex items-center"><ArrowLeft className="w-4 h-4 mr-2" /> Back</button>
            <button onClick={nextStep} disabled={!data.raceSlug} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white flex items-center disabled:bg-gray-600">Next: Choose Class <ArrowRight className="w-4 h-4 ml-2" /></button>
        </div>
    </div>
);

const Step3Class: React.FC<StepProps> = ({ data, updateData, nextStep, prevStep }) => (
    <div className='space-y-6'>
        <h3 className='text-xl font-bold text-red-300'>Select Class (Hit Die and Starting Proficiencies)</h3>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {MOCK_CLASSES.map(_class => (
                <button
                    key={_class.slug}
                    onClick={() => updateData({ classSlug: _class.slug })}
                    className={`p-4 rounded-xl text-left border-2 transition-all ${data.classSlug === _class.slug
                        ? 'bg-red-800 border-red-500 shadow-md'
                        : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`
                    }
                >
                    <p className='text-lg font-bold text-yellow-300'>{_class.name}</p>
                    <p className='text-sm text-gray-400 mt-1'>Hit Die: d{_class.hit_die}</p>
                    <p className='text-xs text-gray-500 mt-1'>Saves: {_class.save_throws.join(', ')}</p>
                </button>
            ))}
        </div>
        <div className='flex justify-between'>
            <button onClick={prevStep} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white flex items-center"><ArrowLeft className="w-4 h-4 mr-2" /> Back</button>
            <button onClick={nextStep} disabled={!data.classSlug} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white flex items-center disabled:bg-gray-600">Next: Abilities <ArrowRight className="w-4 h-4 ml-2" /></button>
        </div>
    </div>
);

const Step4Abilities: React.FC<StepProps> = ({ data, updateData, nextStep, prevStep }) => {
    const scores = useMemo(() => [15, 14, 13, 12, 10, 8], []);
    const availableScores = scores.filter(s => !Object.values(data.abilities).includes(s));
    const isComplete = Object.values(data.abilities).every(score => score !== 8);

    const handleAssignScore = (ability: AbilityName, score: number) => {
        const currentScore = data.abilities[ability];

        if (currentScore === 8 && availableScores.includes(score)) {
            updateData({ abilities: { ...data.abilities, [ability]: score } });
            return;
        }

        const abilityToSwap = (Object.keys(data.abilities) as AbilityName[]).find(a => data.abilities[a] === score);

        if (abilityToSwap) {
            updateData({
                abilities: {
                    ...data.abilities,
                    [ability]: score,
                    [abilityToSwap]: currentScore
                }
            });
        }
    };

    const raceData = MOCK_RACES.find(r => r.slug === data.raceSlug);
    const abilityNames = Object.keys(data.abilities) as AbilityName[];

    return (
        <div className='space-y-6'>
            <h3 className='text-xl font-bold text-red-300'>Determine Ability Scores (Using Standard Array)</h3>
            <div className='flex flex-wrap gap-2 mb-4 p-3 bg-gray-700 rounded-lg'>
                <span className='text-sm font-semibold text-gray-400 mr-2'>Scores to Assign:</span>
                {scores.map(s => (
                    <span key={s} className={`px-3 py-1 text-lg font-bold rounded-full ${availableScores.includes(s) ? 'bg-yellow-500 text-gray-900' : 'bg-gray-600 text-gray-400'}`}>
                        {s}
                    </span>
                ))}
            </div>

            <div className='grid grid-cols-2 gap-4'>
                {abilityNames.map(ability => {
                    const baseScore = data.abilities[ability];
                    const racialBonus = raceData?.ability_bonuses[ability] || 0;
                    const finalScore = baseScore + racialBonus;
                    const modifier = getModifier(finalScore);

                    return (
                        <div key={ability} className='p-3 bg-gray-800 rounded-lg border-l-4 border-red-500'>
                            <p className='text-lg font-bold text-red-400 mb-1'>{ability}</p>
                            <div className='flex items-center justify-between'>
                                <select
                                    value={baseScore}
                                    onChange={(e) => handleAssignScore(ability, parseInt(e.target.value))}
                                    className="p-2 bg-gray-700 rounded-lg text-white font-mono"
                                >
                                    <option value={8} disabled={baseScore !== 8}>Base Score...</option>
                                    {scores.map(s => (
                                        <option
                                            key={s}
                                            value={s}
                                            disabled={baseScore !== s && !availableScores.includes(s)}
                                        >
                                            {s}
                                        </option>
                                    ))}
                                </select>

                                <span className='text-xl text-yellow-300 font-bold'>
                                    {finalScore} ({formatModifier(modifier)})
                                </span>
                            </div>
                            {racialBonus > 0 && <p className='text-xs text-green-400 mt-1'>+ {racialBonus} (Racial)</p>}
                        </div>
                    );
                })}
            </div>
            <div className='flex justify-between'>
                <button onClick={prevStep} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white flex items-center"><ArrowLeft className="w-4 h-4 mr-2" /> Back</button>
                <button onClick={nextStep} disabled={!isComplete} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white flex items-center disabled:bg-gray-600">Next: Traits <ArrowRight className="w-4 h-4 ml-2" /></button>
            </div>
        </div>
    );
};

const Step5Traits: React.FC<StepProps & { onSubmit: (data: CharacterCreationData) => void }> = ({ data, updateData, prevStep, onSubmit }) => {
    return (
        <div className='space-y-6'>
            <h3 className='text-xl font-bold text-red-300'>Final Details & Personality</h3>

            <textarea
                placeholder="Personality Traits"
                value={data.personality}
                onChange={(e) => updateData({ personality: e.target.value })}
                className="w-full h-20 p-3 bg-gray-700 text-white rounded-lg focus:ring-red-500 focus:border-red-500 resize-none"
            />
             <textarea
                placeholder="Ideals"
                value={data.ideals}
                onChange={(e) => updateData({ ideals: e.target.value })}
                className="w-full h-16 p-3 bg-gray-700 text-white rounded-lg focus:ring-red-500 focus:border-red-500 resize-none"
            />
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <textarea
                    placeholder="Bonds"
                    value={data.bonds}
                    onChange={(e) => updateData({ bonds: e.target.value })}
                    className="w-full h-16 p-3 bg-gray-700 text-white rounded-lg focus:ring-red-500 focus:border-red-500 resize-none"
                />
                <textarea
                    placeholder="Flaws"
                    value={data.flaws}
                    onChange={(e) => updateData({ flaws: e.target.value })}
                    className="w-full h-16 p-3 bg-gray-700 text-white rounded-lg focus:ring-red-500 focus:border-red-500 resize-none"
                />
            </div>

            <div className='flex justify-between'>
                <button onClick={prevStep} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white flex items-center"><ArrowLeft className="w-4 h-4 mr-2" /> Back</button>
                <button onClick={() => onSubmit(data)} className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white flex items-center font-bold">Create Character <Check className="w-4 h-4 ml-2" /></button>
            </div>
        </div>
    );
};

// --- Main Wizard Component ---

const CharacterCreationWizard: React.FC<WizardProps> = ({ isOpen, onClose, onCharacterCreated, setRollResult }) => {
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [creationData, setCreationData] = useState<CharacterCreationData>(initialCreationData);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const updateData = (updates: Partial<CharacterCreationData>) => {
        setCreationData(prev => ({ ...prev, ...updates }));
    };

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEP_TITLES.length - 1));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

    const handleSubmit = async (data: CharacterCreationData) => {
        setIsLoading(true);
        setError(null);
        setRollResult({ text: "Creating character sheet...", value: null });

        try {
            const finalCharacter = calculateCharacterStats(data);
            await addCharacter(finalCharacter);

            setRollResult({ text: `Successfully created ${finalCharacter.name}!`, value: null });
            onCharacterCreated();
            onClose();
            setCreationData(initialCreationData);
            setCurrentStep(0);
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during character creation.";
            console.error("Error creating character:", e);
            setError(`Error: ${errorMessage}. Check console for details.`);
        } finally {
            setIsLoading(false);
        }
    };

    const renderStep = () => {
        const commonProps = { data: creationData, updateData, nextStep, prevStep, stepIndex: currentStep };
        switch (currentStep) {
            case 0: return <Step1Details {...commonProps} />;
            case 1: return <Step2Race {...commonProps} />;
            case 2: return <Step3Class {...commonProps} />;
            case 3: return <Step4Abilities {...commonProps} />;
            case 4: return <Step5Traits {...commonProps} onSubmit={handleSubmit} />;
            default: return <p>Unknown step.</p>;
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-2xl transition-all transform duration-300 scale-100"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center border-b border-red-700 pb-3 mb-6">
                    <h2 className="text-2xl font-bold text-red-500 flex items-center">
                        <Dice6 className="w-6 h-6 mr-2" /> {STEP_TITLES[currentStep]}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-xl font-bold">&times;</button>
                </div>

                {/* Progress Bar */}
                <div className='mb-6'>
                    <div className='h-2 bg-gray-700 rounded-full overflow-hidden'>
                        <div
                            className='h-full bg-red-600 transition-all duration-500'
                            style={{ width: `${((currentStep + 1) / STEP_TITLES.length) * 100}%` }}
                        />
                    </div>
                    <p className='text-center text-sm text-gray-400 mt-2'>Step {currentStep + 1} of {STEP_TITLES.length}</p>
                </div>

                {/* Error & Loading */}
                {error && (<div className="bg-red-900/50 text-red-300 p-3 rounded-lg mb-4 text-sm font-medium">{error}</div>)}
                {isLoading && (
                    <div className="text-center p-8">
                        <Loader2 className="w-8 h-8 mx-auto animate-spin text-red-500" />
                        <p className="mt-2 text-red-400">Calculating stats and saving...</p>
                    </div>
                )}

                {/* Wizard Content */}
                {!isLoading && renderStep()}
            </div>
        </div>
    );
};


/** Main Application Component */
const App: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [rollResult, setRollResult] = useState<{ text: string; value: number | null }>({ text: 'Ready to Roll!', value: null });
  const [rollHistory, setRollHistory] = useState<DiceRollType[]>([]);
  const [latestRoll, setLatestRoll] = useState<DiceRollType | null>(null);

  const selectedCharacter = useMemo(() => {
    return characters.find(c => c.id === selectedCharacterId);
  }, [characters, selectedCharacterId]);

  // Load roll history on mount
  useEffect(() => {
    const history = getRollHistory();
    setRollHistory(history);
  }, []);

  // Handle dice roll
  const handleDiceRoll = useCallback((roll: DiceRollType) => {
    // Add to history
    const updatedHistory = addRollToHistory(roll);
    setRollHistory(updatedHistory);
    setLatestRoll(roll);

    // Play sounds
    diceSounds.playRollSound(roll.diceResults.length);

    if (roll.critical === 'success') {
      setTimeout(() => diceSounds.playCritSuccessSound(), 300);
    } else if (roll.critical === 'failure') {
      setTimeout(() => diceSounds.playCritFailureSound(), 300);
    }
  }, []);

  // Clear roll history
  const handleClearHistory = useCallback(() => {
    clearRollHistory();
    setRollHistory([]);
  }, []);

  // Load characters from IndexedDB
  const loadCharacters = useCallback(async () => {
    try {
      const chars = await getAllCharacters();
      setCharacters(chars);
    } catch (e) {
      console.error("Error loading characters:", e);
    }
  }, []);

  useEffect(() => {
    loadCharacters();
  }, [loadCharacters]);

  // CRUD Operations
  const handleDeleteCharacter = useCallback(async (id: string) => {
    try {
      await deleteCharacter(id);
      setSelectedCharacterId(null);
      setRollResult({ text: 'Character deleted successfully.', value: null });
      await loadCharacters();
    } catch (e) {
      console.error("Error deleting character:", e);
      setRollResult({ text: 'Error deleting character.', value: null });
    }
  }, [loadCharacters]);

  // Export all characters as JSON
  const handleExportData = useCallback(() => {
    const dataStr = JSON.stringify(characters, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `5e_characters_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setRollResult({ text: 'Characters exported successfully!', value: null });
  }, [characters]);

  // Import characters from JSON
  const handleImportData = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string) as Character[];

        // Validate imported data
        if (!Array.isArray(importedData)) {
          throw new Error('Invalid data format');
        }

        // Add each character
        for (const char of importedData) {
          // Generate new ID to avoid conflicts
          const newChar = { ...char, id: crypto.randomUUID() };
          await addCharacter(newChar);
        }

        await loadCharacters();
        setRollResult({ text: `Imported ${importedData.length} character(s)!`, value: null });
      } catch (error) {
        console.error('Error importing data:', error);
        setRollResult({ text: 'Error importing data. Check file format.', value: null });
      }
    };
    reader.readAsText(file);
  }, [loadCharacters]);

  if (selectedCharacter) {
    return (
      <>
        <CharacterSheet
          character={selectedCharacter}
          onClose={() => setSelectedCharacterId(null)}
          onDelete={handleDeleteCharacter}
          setRollResult={setRollResult}
          onDiceRoll={handleDiceRoll}
        />
        <DiceBox3D latestRoll={latestRoll} />
        <RollHistoryTicker rolls={rollHistory} />
        <RollHistoryModal rolls={rollHistory} onClear={handleClearHistory} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header and Controls */}
        <header className="flex flex-col md:flex-row justify-between items-center border-b border-red-700 pb-4 mb-8">
          <h1 className="text-4xl font-extrabold text-red-500 mb-4 md:mb-0">
            The Character Forge
          </h1>
          <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:space-x-3 w-full md:w-auto">
             <button
              onClick={() => setIsWizardOpen(true)}
              className="w-full md:w-auto px-6 py-3 bg-red-600 hover:bg-red-500 rounded-xl text-white font-bold shadow-red-800/50 shadow-lg transition-all flex items-center justify-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Character Wizard
            </button>
            <button
              onClick={handleExportData}
              disabled={characters.length === 0}
              className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-bold shadow-blue-800/50 shadow-lg transition-all flex items-center justify-center disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5 mr-2" />
              Export Data
            </button>
            <label className="w-full md:w-auto px-6 py-3 bg-green-600 hover:bg-green-500 rounded-xl text-white font-bold shadow-green-800/50 shadow-lg transition-all flex items-center justify-center cursor-pointer">
              <Upload className="w-5 h-5 mr-2" />
              Import Data
              <input
                type="file"
                accept="application/json"
                onChange={handleImportData}
                className="hidden"
              />
            </label>
          </div>
        </header>

        {/* Dice Roll Display */}
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-xl transition-all duration-300 z-40
          ${rollResult.value !== null ? 'bg-green-800/90 border border-green-500' : 'bg-gray-800/90 border border-gray-600'}`}
        >
          <div className="text-sm font-semibold text-gray-300">{rollResult.text}</div>
          {rollResult.value !== null && (
            <div className="text-4xl font-extrabold text-yellow-300 mt-1">
              {rollResult.value}
            </div>
          )}
        </div>

        {/* Character List */}
        <section>
          <h2 className="text-2xl font-bold text-gray-200 mb-4">Your Heroes ({characters.length})</h2>

          {characters.length === 0 ? (
            <div className="text-center p-12 bg-gray-800 rounded-xl border-2 border-dashed border-gray-700">
              <Shield className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <p className="text-xl font-semibold text-gray-400">Ready your destiny!</p>
              <p className="text-gray-500">Use the "New Character Wizard" button to start forging your hero.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {characters.map((char) => (
                <div key={char.id} className="bg-gray-800 rounded-xl shadow-xl hover:shadow-red-700/30 transition-shadow duration-300 overflow-hidden">
                  <div className="p-5">
                    <h3 className="text-2xl font-bold text-red-400 truncate">{char.name}</h3>
                    <p className="text-sm text-gray-400 mb-3">{char.race} | {char.class} (Level {char.level})</p>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-medium bg-gray-700/50 p-3 rounded-lg">
                       <div>AC: <span className="text-yellow-300 block text-lg font-bold">{char.armorClass}</span></div>
                       <div>HP: <span className="text-green-400 block text-lg font-bold">{char.hitPoints}</span></div>
                       <div>Prof: <span className="text-yellow-300 block text-lg font-bold">{formatModifier(char.proficiencyBonus)}</span></div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between items-center mt-4 space-x-3">
                      <button
                        onClick={() => setSelectedCharacterId(char.id)}
                        className="flex-grow py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white font-semibold transition-colors flex items-center justify-center text-sm"
                      >
                        <BookOpen className="w-4 h-4 mr-2" /> View Sheet
                      </button>
                      <button
                        onClick={() => handleDeleteCharacter(char.id)}
                        className="p-2 bg-gray-600 hover:bg-red-700 rounded-lg transition-colors"
                        title="Delete Character"
                      >
                        <Trash2 className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Character Creation Wizard */}
        <CharacterCreationWizard
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          onCharacterCreated={loadCharacters}
          setRollResult={setRollResult}
        />
      </div>
    </div>
  );
};

export default App;

import { CharacterCreationData } from '../../../types/dnd';

export const STEP_TITLES = [
    'Character Level',            // New Step 0: Choose Level
    'Character Details',          // 1
    'Choose Race',                // 2
    'Choose Class & Subclass',    // 3 - Sprint 5: Updated to include subclass
    'Choose Fighting Style',      // 4 - Sprint 5: Conditional for Fighter/Paladin/Ranger
    'Select Spells',              // 5 - Sprint 2: Conditional for spellcasters
    'Determine Abilities',        // 6 - Ability score determination
    'Choose Feats',               // 7 - Sprint 5: Optional feat selection
    'Select Languages',           // 8 - Language selection
    'Select Equipment',           // 9 - Equipment selection
    'Customize Equipment',        // 10 - Sprint 4: Equipment browser
    'Finalize Background'         // 11 - Background and trait finalization
];

export const initialCreationData: CharacterCreationData = {
  name: '',
  level: 1,
  raceSlug: '',
  classSlug: '',
  abilities: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
  abilityScoreMethod: 'standard-array',
  background: 'Outlander',
  alignment: 'Neutral Good',
  selectedSkills: [],
  equipmentChoices: [],
  hpCalculationMethod: 'max',
  spellSelection: {
    selectedCantrips: [],
    selectedSpells: [],
  },
  startingInventory: [],
  subclassSlug: undefined,
  selectedFightingStyle: undefined,
  selectedFeats: [],
  knownLanguages: [],
  personality: "I'm quiet until I have something important to say.",
  ideals: "Honesty. The truth must be preserved.",
  bonds: "I owe my life to the individual who saved me.",
  flaws: "I trust no one and question everything.",
};
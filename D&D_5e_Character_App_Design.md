# D&D 5e Character Generator & Sheet App Design

## 1. Goal

To create a single-page, fully responsive React/TypeScript application
that allows a user to store, view, and generate D&D 5e character sheets,
leveraging Firebase for persistence and procedural generation via a
guided **Character Creation Wizard**.

## 2. Core Features (User Stories)

  -----------------------------------------------------------------------
  **ID**                  **Feature**             **Description**
  ----------------------- ----------------------- -----------------------
  **F1**                  **Persistent Storage**  The user can save,
                                                  load, and delete
                                                  multiple characters,
                                                  with data stored
                                                  securely in Firestore.

  **F2**                  **Character List**      The user sees a
                                                  dashboard of all their
                                                  saved characters with
                                                  key details (Name,
                                                  Race, Class, Level).

  **F3**                  **Creation Wizard**     A step-by-step wizard
                                                  guides the user through
                                                  character creation:
                                                  **Race, Class, Ability
                                                  Scores, and final
                                                  details.**

  **F4**                  **Rule-Based            The app calculates and
                          Generation**            populates derived stats
                                                  (modifiers, skill
                                                  proficiencies, HP)
                                                  based on user
                                                  selections and
                                                  integrated 5e rules.

  **F5**                  **Interactive Sheet**   The character sheet
                                                  display is interactive,
                                                  allowing the user to
                                                  click to roll dice and
                                                  easily view complex
                                                  features.

  **F6**                  **Responsive Design**   The app must look good
                                                  and be fully functional
                                                  on both mobile phones
                                                  and desktop displays
                                                  (using Tailwind CSS
                                                  breakpoints).
  -----------------------------------------------------------------------

## 3. Technical Architecture

  -----------------------------------------------------------------------------------------------
  **Component**           **Technology**          **Responsibility**
  ----------------------- ----------------------- -----------------------------------------------
  **Frontend UI**         React (TSX) & Tailwind  State management, rendering, responsiveness,
                          CSS                     user interaction.

  **Data Persistence**    IndexedDB               Client-side storage of Character documents in
                                                  browser database. All data stored locally with
                                                  zero server dependency.

  **Data Backup**         JSON Export/Import      Users can export all characters as JSON for
                                                  backup and import them back into any browser.

  **Ruleset Integration** External API Mock       Simulating fetching D&D rules data (Races,
                                                  Classes, Features) from a source like
                                                  dnd5eapi.co.

  **User Flow**           Multi-Step Wizard       Manages the guided creation process (F3).
  -----------------------------------------------------------------------------------------------

## 4. TypeScript Data Model (The Character Interface)

The data model remains the same as it represents the final D&D 5e sheet
structure.

// Define the structure for a single D&D 5e character\
interface Character {\
id: string; // Firestore Document ID\
userId: string; // The user who owns the character\
name: string;\
race: string;\
class: string;\
level: number;\
alignment: string;\
background: string;\
inspiration: boolean;\
proficiencyBonus: number;\
armorClass: number;\
hitPoints: number;\
maxHitPoints: number;\
speed: number;\
initiative: number;\
// Ability Scores (Strength, Dexterity, Constitution, Intelligence,
Wisdom, Charisma)\
abilities: {\
STR: { score: number; modifier: number; };\
DEX: { score: number; modifier: number; };\
CON: { score: number; modifier: number; };\
INT: { score: number; modifier: number; };\
WIS: { score: number; modifier: number; };\
CHA: { score: number; modifier: number; };\
};\
// Skills (using a simplified map for calculation)\
skills: {\
Acrobatics: { value: number; proficient: boolean; }; // DEX\
AnimalHandling: { value: number; proficient: boolean; }; // WIS\
Arcana: { value: number; proficient: boolean; }; // INT\
Athletics: { value: number; proficient: boolean; }; // STR\
Deception: { value: number; proficient: boolean; }; // CHA\
History: { value: number; proficient: boolean; }; // INT\
Insight: { value: number; proficient: boolean; }; // WIS\
Intimidation: { value: number; proficient: boolean; }; // CHA\
Investigation: { value: number; proficient: boolean; }; // INT\
Medicine: { value: number; proficient: boolean; }; // WIS\
Nature: { value: number; proficient: boolean; }; // INT\
Perception: { value: number; proficient: boolean; }; // WIS\
Performance: { value: number; proficient: boolean; }; // CHA\
Persuasion: { value: number; proficient: boolean; }; // CHA\
Religion: { value: number; proficient: boolean; }; // INT\
SleightOfHand: { value: number; proficient: boolean; }; // DEX\
Stealth: { value: number; proficient: boolean; }; // DEX\
Survival: { value: number; proficient: boolean; }; // WIS\
};\
// Feature and trait descriptions generated by the app\'s rules\
featuresAndTraits: {\
personality: string;\
ideals: string;\
bonds: string;\
flaws: string;\
classFeatures: string\[\];\
racialTraits: string\[\];\
};\
}

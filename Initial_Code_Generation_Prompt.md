Please generate a complete, single-file React/TypeScript application
(App.tsx) for a D&D 5e Character Sheet Generator.

**Mandatory Requirements:**

1.  **Language & Styling:** Use TypeScript, Functional Components with
    Hooks, and **Tailwind CSS** for a fully responsive, visually
    appealing design. The primary layout must be mobile-first.

2.  **State Management:** Use useState and useEffect hooks. Define the
    Character interface as per the dnd_app_design.md file (replicated
    below).

3.  **Authentication & Firebase:**

    - Initialize Firebase services (db, auth) using the global variables
      \_\_firebase_config and \_\_app_id.

    - Handle user authentication using \_\_initial_auth_token for
      signInWithCustomToken or signInAnonymously.

    - Establish a userId from auth.currentUser.uid or
      crypto.randomUUID().

    - **Data Path:** Store and retrieve all character data from the
      Firestore path: /artifacts/\${appId}/users/\${userId}/characters.

    - Use onSnapshot to listen for real-time updates to the character
      list.

4.  **Application Flow (3 Main Components):**

    - **Dashboard (CharacterList):** Displays a list/grid of all saved
      characters. Each card shows Name, Race, Class, Level, and a \"View
      Sheet\" button.

    - **AI Generation Form (AICreationModal):** A modal or panel
      containing a text area for the user to input a creative prompt
      (e.g., \"A grizzled Dwarven Paladin of the Crown\").

    - **Character Sheet Display (CharacterSheet):** A detailed,
      responsive view of the selected character\'s stats and features.

**Gemini API Integration (AI Character Generation):**

1.  **API URL & Model:** Use gemini-2.5-flash-preview-09-2025 and the
    standard API URL structure. The apiKey variable must be an empty
    string (const apiKey = \"\").

2.  **Structured Output:** The AI must generate a JSON object that
    strictly adheres to the provided Character TypeScript interface. You
    MUST include the responseMimeType: \"application/json\" and the full
    JSON schema derivation from the Character interface in the
    generationConfig.

3.  **Prompt Construction:** The user\'s creative text prompt should be
    combined with a robust system instruction telling the AI to act as a
    **D&D 5e expert** and generate the full character data in JSON
    format only.

4.  **Error Handling:** Include loading states (isLoading), and clear
    error messages for API failures or parsing issues.

**TypeScript Character Interface (MUST be used):**

// Define the structure for a single D&D 5e character\
interface Character {\
id: string; // Firestore Document ID (must be added after Firestore
addDoc)\
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
// Ability Scores\
abilities: {\
STR: { score: number; modifier: number; };\
DEX: { score: number; modifier: number; };\
CON: { score: number; modifier: number; };\
INT: { score: number; modifier: number; };\
WIS: { score: number; modifier: number; };\
CHA: { score: number; modifier: number; };\
};\
// Skills\
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
// Feature and trait descriptions\
featuresAndTraits: {\
personality: string;\
ideals: string;\
bonds: string;\
flaws: string;\
classFeatures: string\[\];\
racialTraits: string\[\];\
};\
}

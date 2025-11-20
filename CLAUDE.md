# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

5e Character Forge is a **100% client-side** D&D 5e character creation and management application built with React 18, TypeScript, and Vite. All character data is stored in IndexedDB with no backend or server required.

**Key Constraints:**
- All data must remain client-side - no external API calls for character data
- IndexedDB is the single source of truth for character persistence
- The app must work completely offline after initial load
- SRD data is bundled statically from `/src/data/srd/` directories

## Development Commands

### Essential Commands
```bash
npm run dev          # Start dev server on http://localhost:3000
npm run build        # TypeScript compile + Vite production build
npm run preview      # Preview production build locally
npm run lint         # Run ESLint on all TypeScript files
npm test             # Run Vitest test suite
npm test -- --ui     # Run tests with UI dashboard
```

### Testing
```bash
npm test                           # Run all tests in watch mode
npm test -- --run                  # Run tests once (CI mode)
npm test -- src/utils/spellUtils   # Run specific test file
npm test -- --coverage             # Generate coverage report
```

**Test Coverage Requirements:**
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

Configuration: `vitest.config.ts` with jsdom environment and `@testing-library/react`

### Code Quality
- ESLint config: `eslint.config.js` with TypeScript, React Hooks rules
- `no-console: warn` - console statements trigger warnings
- React Hooks exhaustive deps are enforced
- TypeScript strict mode enabled in `tsconfig.json`

## Architecture

### State Management - Context API Pattern

The app uses React Context for global state, organized in `/src/context/`:

1. **CharacterContext** - Character CRUD operations via IndexedDB
2. **DiceContext** - 3D dice rendering and roll history
3. **ModalContext** - Modal state management

**Important:** All contexts are wired together in `src/main.tsx`:
```tsx
<CharacterProvider>
  <DiceProvider>
    <ModalProvider>
      <App />
    </ModalProvider>
  </DiceProvider>
</CharacterProvider>
```

### Data Flow Architecture

```
User Action
    ↓
Component (calls hook)
    ↓
Custom Hook (/src/hooks/*.ts)
    ↓
Service Layer (/src/services/*.ts)
    ↓
IndexedDB (dbService.ts) or SRD Data (dataService.ts)
```

### Service Layer (`/src/services/`)

- **dbService.ts** - IndexedDB operations (CRUD for characters)
- **dataService.ts** - SRD data loading and transformation from `/src/data/srd/`
- **characterService.ts** - Character stat calculations, leveling, resting
- **diceService.ts** - Dice roll logic, history management, UUID generation

### Custom Hooks (`/src/hooks/`)

All custom hooks are exported from `/src/hooks/index.ts`:
- **useCharacterManagement** - Character CRUD with loading states
- **useSpellcasting** - Spell slot tracking, preparation, learning
- **useEquipment** - Inventory management, armor/weapon equipping
- **useDiceRolling** - Roll creation, history, sound effects
- **useModalState** - Generic modal open/close state

### Type System (`/src/types/dnd.ts`)

**Core Character Interface:**
The `Character` interface is the canonical data structure for all saved characters. Key sections:
- Basic stats (name, race, class, level, alignment)
- Abilities (STR, DEX, CON, INT, WIS, CHA) with modifiers
- 18 D&D skills with proficiency tracking
- Optional spellcasting data (ability, slots, known/prepared spells)
- Optional inventory and equipment
- Optional feats, subclass, fighting style

**Character Creation:**
`CharacterCreationData` is the intermediate structure used during the wizard flow. It gets transformed into a `Character` by `calculateCharacterStats()` in `characterService.ts`.

### SRD Data Structure

Located in `/src/data/srd/`:
- `5e-SRD-Spells-Merged.json` - **Merged spell database** (2014 + 2024 editions)
- `2014/` - Core D&D 5e 2014 SRD data (archived)
- `2024/` - Updated 2024 rules (equipment)
- `2018/`, `2020/`, `2020-egtw/` - Additional subclasses
- `archive/` - **Archived original spell files**

**Data Loading:**
- Merged spell database combines 2014 and 2024 SRD editions
- All SRD JSON is imported statically in `dataService.ts`
- Data is transformed from SRD format to app-specific types
- Each spell includes `source: '2014' | '2024'` for edition tracking
- Reference SRD database: `/Users/JoelN/Coding/5e-SRD-database/src/2014/*.json`

### Component Organization

```
/src/components/
├── CharacterCreationWizard/  # Multi-step character creation flow
├── CharacterList/            # Character dashboard/card grid
├── CharacterSheet/           # Full character sheet view
└── DiceSystem/               # 3D dice box integration
```

**Modal Components:** Standalone modal components in `/src/components/` (e.g., `SpellPreparationModal.tsx`, `AbilityScoreIncreaseModal.tsx`) handle character interactions.

### Dice System

**3D Dice Integration:**
- Uses `@3d-dice/dice-box` v1.1.4 library for physics-based 3D dice
- Configured in `/src/components/DiceSystem/DiceBox3D.tsx`
- Uses v1.1.x API with `container` property for initialization
- CORS headers required in dev server (see `vite.config.ts`):
  - `Cross-Origin-Embedder-Policy: require-corp`
  - `Cross-Origin-Opener-Policy: same-origin`
- Dice sounds managed in `/src/utils/diceSounds.ts`

**DiceBox Configuration (v1.1.x API):**
- **Container**: `'#dice-box'` selector
- **Asset Path**: `/assets/dice-box/` for 3D models and textures
- **Physics Settings**:
  - Gravity: 1, Friction: 0.8, Restitution: 0.6
  - Linear Damping: 0.4, Angular Damping: 0.4
  - Spin Force: 3, Throw Force: 4, Starting Height: 8
- **Visual Settings**: Enable Shadows, Scale: 6
- **Timing**: Settle Timeout: 5000ms

**Canvas Management:**
- 50% viewport sizing (width/height) with proper canvas positioning
- Lazy initialization on first roll to improve performance
- Auto-hide after 5 seconds with opacity transitions
- Click-to-dismiss overlay with backdrop blur effect

**Roll Types Supported:**
- `ability`: Ability checks (STR, DEX, CON, INT, WIS, CHA)
- `skill`: Skill checks with proficiency tracking
- `initiative`: Initiative rolls with DEX modifier
- `saving-throw`: Saving throws with proficiency bonus
- `attack`: Weapon/spell attack rolls
- `complex`: Damage rolls, advantage/disadvantage, custom notations

**Roll History:**
- Persisted in localStorage (not IndexedDB) as `5e-forge-rolls`
- Maximum 10 rolls retained (FIFO)
- Roll data includes: ID, type, label, notation, results, modifier, total, critical status, timestamp
- Components: `RollHistoryModal.tsx` (full history), `RollHistoryTicker.tsx` (recent rolls display)
- **3D Visualization Sync**: DiceBox generates random results, then roll history is updated with actual dice values for perfect synchronization

**Level-Aware Character Creation**:
- **Level 1-2**: Class selection only, subclass preview (unlocked at level 3)
- **Level 3+**: Class and subclass selection required
- **Level 4+**: Ability Score Improvements and Feats available
- **Dynamic UI**: Steps and options adapt based on selected character level

**Sound Effects:**
- Roll sounds based on dice count (1-4 dice variations)
- Critical success/failure audio cues with 300ms delay
- Sound files managed in `/src/utils/diceSounds.ts`

**Error Handling:**
- User-facing error display for DiceBox initialization failures
- Graceful fallback if 3D dice unavailable
- Console logging for debugging with 🎲 emoji prefixes

**DiceRollerModal Integration:**
- Standalone dice roller with its own DiceBox instance
- Pre-calculates dice results for consistent 3D visualization
- Supports multiple dice types simultaneously (d4, d6, d8, d10, d12, d20, d100)
- Displays immediate results with modifier calculations
- Results are synchronized between 3D dice and displayed values

## Critical Data Rules

### Spellcasting System

**Three Spellcasting Types:**
1. **Known Casters** (Bard, Sorcerer, Warlock, Ranger)
   - Fixed spell list in `spellsKnown[]`
   - Cannot change spells without leveling

2. **Prepared Casters** (Cleric, Druid, Paladin, Artificer)
   - Access to full class spell list
   - Daily preparation in `preparedSpells[]`
   - Can change prepared spells after long rest

3. **Wizard (Special Case)**
   - Permanent `spellbook[]` (starts with 6 spells)
   - Daily `preparedSpells[]` selected from spellbook
   - Can add spells to spellbook permanently

**Spell Data Location:**
- Spell slots by class/level: `/src/data/spellSlots.ts`
- Cantrips known: `/src/data/cantrips.ts`
- Spell database: **Merged 2014+2024 SRD** loaded in `dataService.ts` as `SPELL_DATABASE`
- Source tracking: Each spell has `source` field ('2014' or '2024')

### Equipment System

**Equipped Item Flow:**
1. Item exists in equipment database (`loadEquipment()` from `dataService.ts`)
2. Added to character's `inventory[]` as `EquippedItem` with `equipmentSlug` reference
3. Optionally marked as equipped via `equippedArmor` or `equippedWeapons[]`

**AC Calculation:**
- Default: 10 + DEX modifier
- With armor: Uses armor's base AC + DEX bonus (subject to armor type limits)
- Implemented in character stat calculator

### Level Advancement

**Leveling Up Triggers:**
1. Proficiency bonus increase (every 4 levels)
2. Ability Score Increase or Feat (levels 4, 8, 12, 16, 19)
3. New spell slots (for spellcasters)
4. New cantrips (varies by class)
5. Subclass selection (usually level 3)
6. Class features (see `getFeaturesByClass()`)

**Important:** HP increases use average rounded up by default, or player can roll hit die.

## Build and Deployment

### Vite Configuration

**Dev Server Settings:**
- Port: 3000
- CORS headers for dice box: `Cross-Origin-Embedder-Policy`, `Cross-Origin-Opener-Policy`

**Production Build:**
- Minifier: Terser
- `drop_console: true` - All console logs removed in production
- Manual chunks: React vendor bundle separated
- Output: `dist/`

### Tailwind CSS v4 Configuration

**Setup:**
- Uses Tailwind CSS v4.1.17 with CSS-first configuration
- PostCSS plugin: `@tailwindcss/postcss`
- CSS import: `@import "tailwindcss";` in `src/index.css`
- Custom theme values defined using `@theme` directive in CSS
- No `tailwind.config.js` file needed (removed for v4 compatibility)

### Docker Deployment

```bash
docker build -t 5e-character-forge .
docker run -p 8080:80 5e-character-forge
```

Multi-stage Dockerfile uses nginx to serve static build. Configuration in `nginx.conf` includes SPA fallback to `index.html`.

## Common Patterns

### Adding a New Modal

1. Create modal component in `/src/components/YourModal.tsx`
2. Add state to `useModalState` hook or use local `useState`
3. Import and render in `App.tsx` or parent component
4. Pass `character` and update callback

### Adding a New SRD Data Type

1. Add JSON to `/src/data/srd/2014/` or reference external SRD database
2. Import in `dataService.ts`
3. Create TypeScript interface in `/src/types/dnd.ts`
4. Write transformer function in `dataService.ts`
5. Export loading function (e.g., `loadYourData()`)

### Adding a Character Field

1. Update `Character` interface in `/src/types/dnd.ts`
2. Update `CharacterCreationData` if needed during creation
3. Modify `calculateCharacterStats()` in `characterService.ts`
4. Update relevant components in `CharacterSheet/` or wizard steps
5. Handle migration for existing characters in IndexedDB if needed

## External Data Reference

The project references a local SRD database at:
```
/Users/JoelN/Coding/5e-SRD-database/src/2014/*.json
```

This is used as a reference when adding new SRD content. Copy files into `/src/data/srd/` and transform them in `dataService.ts`.

## IndexedDB Schema

**Database:** `5e_character_forge`
**Object Store:** `characters`
**Key Path:** `id` (UUID string)
**Indexes:**
- `name` (character name)
- `class` (character class)
- `level` (character level)

**Migration:** Database version is 1. If schema changes are needed, increment `DB_VERSION` in `dbService.ts` and handle migration in `onupgradeneeded`.

## Utility Functions

### Character Calculators (`/src/utils/`)

- **characterCalculator.ts** - Stat derivation, AC, initiative, saves
- **spellUtils.ts** - Spell slot management, preparation validation
- **equipmentUtils.ts** - Equipment filtering, AC calculations
- **featUtils.ts** - Feat validation, ability score increases
- **languageUtils.ts** - Language selection from race/background
- **formatters.ts** - Display formatting (modifiers, HP, etc.)

### Important Helper Functions

- `getModifier(score: number)`: Converts ability score to modifier
- `PROFICIENCY_BONUSES`: Array of proficiency bonuses by character level (1-20)
- `SKILL_TO_ABILITY`: Maps skill names to their governing ability
- `generateUUID()`: Creates unique character IDs

## Testing Guidelines

- Tests use Vitest + React Testing Library
- Setup in `/src/test/setup.ts` includes mocks for `matchMedia`, `ResizeObserver`, `IntersectionObserver`
- Test files: `*.test.ts` or `*.test.tsx` co-located with source
- Use `describe`, `it`, `expect` from Vitest
- Mock IndexedDB operations in tests (not implemented in actual browser)

## Performance Considerations

- Bundle size limit enforced via `size-limit` package
- React vendor chunk separated for better caching
- Dice box loaded lazily when dice are needed
- SRD data is tree-shaken by Vite (only imported data is bundled)

## Known Limitations

- IndexedDB data is browser-specific and cleared with browser data
- Users must manually export/import for backup
- No multiplayer or cloud sync
- Limited to SRD content (no proprietary D&D material)
- 3D dice requires modern browser with WebGL support

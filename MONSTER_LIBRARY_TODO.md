# Monster Library & DM Tools - Implementation Plan

## Overview
Add a complete monster reference and encounter management system with tabbed dashboard navigation, custom monster creation, and multi-monster encounter views.

---

## Architecture Approach

### Data Layer

#### 1. Monster Type Definition (`src/types/dnd.ts`)
- [ ] Add `Monster` interface matching SRD structure
- [ ] Add `UserMonster` interface (extends Monster with user metadata)
- [ ] Add `Encounter` interface for multi-monster tracking

#### 2. Data Service (`src/services/dataService.ts`)
- [ ] Copy `/Users/JoelN/Coding/5e-SRD-database/src/2014/5e-SRD-Monsters.json` to `src/data/srd/2014/`
- [ ] Create `loadMonsters()` function
- [ ] Export `MONSTER_DATABASE` constant (334 SRD monsters)
- [ ] Create `MONSTER_TYPE_CATEGORIES` for filtering

#### 3. IndexedDB Schema (`src/services/dbService.ts`)
- [ ] Add `customMonsters` object store (user-created monsters)
- [ ] Add `favoriteMonsters` object store (bookmarked monster IDs)
- [ ] Add `encounters` object store (selected monster groups)

### UI Layer

#### 1. Navigation (`src/App.tsx`)
- [ ] Add tab state: `'characters' | 'monsters'`
- [ ] Add tabbed header navigation
- [ ] Conditional rendering for each tab

#### 2. Monster Library Components (`src/components/MonsterLibrary/`)
- [ ] Create `MonsterLibrary.tsx` - Main container with filters
- [ ] Create `MonsterList.tsx` - Grid layout (reuse CharacterList pattern)
- [ ] Create `MonsterCard.tsx` - Monster preview card
- [ ] Create `MonsterStatBlock.tsx` - Full stat block view
- [ ] Create `MonsterFilters.tsx` - Type/CR filtering
- [ ] Create `CreateMonsterModal.tsx` - Custom monster form

#### 3. Encounter Management (`src/components/EncounterView/`)
- [ ] Create `EncounterView.tsx` - Container for selected monsters
- [ ] Create `EncounterGrid.tsx` - Multi-monster grid display
- [ ] Create `EncounterTabs.tsx` - Tabbed single-monster view
- [ ] Create `EncounterSelector.tsx` - Checkbox selection UI

### Custom Hooks
- [ ] Create `useMonsters()` - Load SRD + custom monsters, filtering
- [ ] Create `useFavorites()` - Manage bookmarked monsters
- [ ] Create `useEncounter()` - Manage selected monsters, grid/tab view

---

## Implementation Phases

### Phase 1: Core Monster Library (MVP)
**Goal:** Browse and view SRD monsters with basic filtering
**Estimated time:** 3-4 hours

#### Data Layer
- [ ] Add `Monster` interface to `src/types/dnd.ts`
  - Include: index, name, size, type, alignment, armor_class, hit_points, hit_dice
  - Include: ability scores (STR, DEX, CON, INT, WIS, CHA)
  - Include: speed, senses, languages, challenge_rating, proficiency_bonus, xp
  - Include: special_abilities[], actions[], legendary_actions[]
  - Include: damage resistances/immunities, condition immunities
- [ ] Copy monster JSON from `/Users/JoelN/Coding/5e-SRD-database/src/2014/5e-SRD-Monsters.json` to `src/data/srd/2014/5e-SRD-Monsters.json`
- [ ] Add monster import to `src/services/dataService.ts`
- [ ] Create `loadMonsters()` function (transform SRD format to app format if needed)
- [ ] Export `MONSTER_DATABASE` constant
- [ ] Create `MONSTER_TYPE_CATEGORIES` array with icons:
  - Aberrations 👁️
  - Beasts 🐻
  - Celestials ✨
  - Constructs 🗿
  - Dragons 🐉
  - Elementals 🔥
  - Fey 🧚
  - Fiends 😈
  - Giants ⛰️
  - Humanoids 🧑
  - Monstrosities 🦎
  - Oozes 💧
  - Plants 🌿
  - Undead 💀

#### Components
- [ ] Create `/src/components/MonsterLibrary/` directory
- [ ] Create `MonsterLibrary.tsx`
  - Container component with header
  - Include filter sidebar/panel
  - Include monster grid
  - Handle empty state
- [ ] Create `MonsterList.tsx`
  - Grid layout: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
  - Map over filtered monsters to render MonsterCard components
  - Handle empty state with appropriate icon/message
- [ ] Create `MonsterCard.tsx`
  - Display: Name, Type, Size, CR
  - Display: AC, HP, Speed (walk)
  - Click handler to open stat block
  - Hover effects
  - Badge for CR with color coding (green: 0-4, yellow: 5-10, orange: 11-16, red: 17+)
- [ ] Create `MonsterStatBlock.tsx`
  - Full-page overlay (similar to CharacterSheet)
  - Sections: Header (name, size, type, alignment)
  - Sections: Armor Class, Hit Points, Speed
  - Sections: Ability Scores (horizontal layout)
  - Sections: Saving Throws, Skills (if any)
  - Sections: Damage Resistances/Immunities, Condition Immunities
  - Sections: Senses, Languages
  - Sections: Challenge Rating & XP
  - Sections: Special Abilities (collapsible)
  - Sections: Actions (collapsible)
  - Sections: Legendary Actions (if any, collapsible)
  - Close button to return to library
- [ ] Create `MonsterFilters.tsx`
  - Type filter (dropdown or checkboxes for all 14 types)
  - CR filter (range slider or min/max inputs: 0-30)
  - Search bar (filter by name)
  - Clear filters button

#### Navigation
- [ ] Update `src/App.tsx`
  - Add state: `const [activeTab, setActiveTab] = useState<'characters' | 'monsters'>('characters')`
  - Add state: `const [selectedMonsterId, setSelectedMonsterId] = useState<string | null>(null)`
  - Add tabbed header with buttons/links for "Characters" and "Monsters"
  - Add conditional rendering:
    ```tsx
    if (selectedCharacter) return <CharacterSheet ... />
    if (selectedMonster) return <MonsterStatBlock ... />

    return (
      <div>
        <Header with tabs />
        {activeTab === 'characters' ? <CharacterList /> : <MonsterLibrary />}
      </div>
    )
    ```

#### Hooks
- [ ] Create `src/hooks/useMonsters.ts`
  - Load MONSTER_DATABASE on mount
  - State for filters: `{ type: string | null, crMin: number, crMax: number, search: string }`
  - State for filtered monsters
  - Function to apply filters
  - Return: `{ monsters: filteredMonsters, filters, setFilters, clearFilters }`

#### Testing
- [ ] Manual test: Browse all monsters
- [ ] Manual test: Filter by each type
- [ ] Manual test: Filter by CR range
- [ ] Manual test: Search by name
- [ ] Manual test: View stat block for various monsters (simple, complex, legendary)
- [ ] Manual test: Mobile responsive layout

---

### Phase 2: Favorites & Custom Monsters
**Goal:** Bookmark monsters and create custom stat blocks
**Estimated time:** 3-4 hours

#### IndexedDB Schema Updates
- [ ] Update `src/services/dbService.ts`
  - Increment DB_VERSION to 2
  - Add migration logic in onupgradeneeded
  - Create `customMonsters` object store
    - Key path: `id` (UUID)
    - Indexes: `name`, `type`, `challenge_rating`
  - Create `favoriteMonsters` object store
    - Key path: `monsterId` (references monster index or custom monster id)
    - Index: `createdAt` for sorting
  - Add CRUD functions for custom monsters:
    - `getAllCustomMonsters(): Promise<UserMonster[]>`
    - `addCustomMonster(monster: UserMonster): Promise<string>`
    - `updateCustomMonster(monster: UserMonster): Promise<void>`
    - `deleteCustomMonster(id: string): Promise<void>`
  - Add functions for favorites:
    - `getFavoriteMonsters(): Promise<string[]>`
    - `addFavorite(monsterId: string): Promise<void>`
    - `removeFavorite(monsterId: string): Promise<void>`
    - `isFavorite(monsterId: string): Promise<boolean>`

#### Type Updates
- [ ] Update `src/types/dnd.ts`
  - Add `UserMonster` interface extending `Monster`
    - Add: `id: string` (UUID)
    - Add: `isCustom: boolean` (always true)
    - Add: `createdAt: number` (timestamp)
    - Add: `updatedAt: number` (timestamp)

#### Components
- [ ] Create `CreateMonsterModal.tsx`
  - Form sections: Basic Info (name, size, type, alignment)
  - Form sections: Stats (AC, HP, hit dice)
  - Form sections: Ability Scores (6 inputs)
  - Form sections: Speed (walk, fly, swim, burrow, climb)
  - Form sections: CR and Proficiency Bonus
  - Form sections: Senses, Languages
  - Form sections: Special Abilities (dynamic list)
  - Form sections: Actions (dynamic list)
  - Form sections: Legendary Actions (optional, dynamic list)
  - Save button (validates and creates monster)
  - Cancel button
- [ ] Update `MonsterCard.tsx`
  - Add favorite star icon (filled if favorited, outline if not)
  - Click handler for favorite toggle
  - Add badge/indicator for custom monsters
  - Add edit button for custom monsters (opens CreateMonsterModal in edit mode)
  - Add delete button for custom monsters
- [ ] Update `MonsterStatBlock.tsx`
  - Add favorite toggle button in header
  - Add edit button for custom monsters
  - Add delete button for custom monsters
- [ ] Update `MonsterLibrary.tsx`
  - Add "Create Custom Monster" button in header
  - Opens CreateMonsterModal
- [ ] Update `MonsterFilters.tsx`
  - Add "Show Favorites Only" toggle
  - Add "Show Custom Only" toggle
  - Add "Show SRD Only" toggle

#### Hooks
- [ ] Create `src/hooks/useFavorites.ts`
  - Load favorites on mount
  - Function to toggle favorite
  - Function to check if monster is favorite
  - Return: `{ favorites, toggleFavorite, isFavorite }`
- [ ] Create `src/hooks/useCustomMonsters.ts`
  - Load custom monsters on mount
  - CRUD functions
  - Return: `{ customMonsters, createMonster, updateMonster, deleteMonster, loading, error }`
- [ ] Update `src/hooks/useMonsters.ts`
  - Merge SRD monsters + custom monsters
  - Apply favorite/custom filters
  - Sort by name, CR, or favorites

#### Testing
- [ ] Manual test: Favorite a monster
- [ ] Manual test: Unfavorite a monster
- [ ] Manual test: Filter to show only favorites
- [ ] Manual test: Create custom monster with minimal fields
- [ ] Manual test: Create custom monster with all fields
- [ ] Manual test: Edit custom monster
- [ ] Manual test: Delete custom monster
- [ ] Manual test: Custom monsters persist after reload
- [ ] Manual test: Favorites persist after reload

---

### Phase 3: Encounter Management
**Goal:** Select multiple monsters and view in grid/tabbed format
**Estimated time:** 2-3 hours

#### IndexedDB Schema Updates
- [ ] Update `src/services/dbService.ts`
  - Increment DB_VERSION to 3
  - Add migration logic
  - Create `encounters` object store
    - Key path: `id` (UUID)
    - Index: `name`, `createdAt`
    - Structure: `{ id, name, monsterIds: string[], createdAt, updatedAt }`
  - Add CRUD functions:
    - `getAllEncounters(): Promise<Encounter[]>`
    - `getEncounter(id: string): Promise<Encounter | undefined>`
    - `saveEncounter(encounter: Encounter): Promise<string>`
    - `deleteEncounter(id: string): Promise<void>`

#### Type Updates
- [ ] Update `src/types/dnd.ts`
  - Add `Encounter` interface:
    - `id: string`
    - `name: string`
    - `monsterIds: string[]` (references to monster index or custom monster id)
    - `createdAt: number`
    - `updatedAt: number`

#### Components
- [ ] Create `src/components/EncounterView/` directory
- [ ] Create `EncounterView.tsx`
  - Container for encounter display
  - Header with encounter name
  - Toggle between grid/tab view
  - Pass selected monsters to grid or tab component
  - Save encounter button
  - Clear encounter button
- [ ] Create `EncounterGrid.tsx`
  - Grid layout for multiple stat blocks
  - Responsive: 1 column mobile, 2 columns tablet, 3 columns desktop
  - Each grid item shows condensed stat block
  - Click to expand individual monster
- [ ] Create `EncounterTabs.tsx`
  - Tab navigation for each monster
  - Display full stat block for selected tab
  - Previous/Next buttons
  - Tab shows monster name and CR
- [ ] Create `SaveEncounterModal.tsx`
  - Input for encounter name
  - List of selected monsters (read-only preview)
  - Save button
  - Cancel button
- [ ] Update `MonsterCard.tsx`
  - Add checkbox for selection (when in selection mode)
  - Visual indicator when selected
  - Disable click-to-view when in selection mode
- [ ] Update `MonsterLibrary.tsx`
  - Add "Select for Encounter" mode toggle button
  - Show selected count when in selection mode
  - Show "View Encounter" button (disabled if no monsters selected)
  - Show "Clear Selection" button

#### Navigation
- [ ] Update `src/App.tsx`
  - Add state: `const [encounterMonsterIds, setEncounterMonsterIds] = useState<string[]>([])`
  - Add state: `const [encounterViewMode, setEncounterViewMode] = useState<'grid' | 'tabs'>('grid')`
  - Add state: `const [showEncounterView, setShowEncounterView] = useState(false)`
  - Conditional rendering for EncounterView
  - Pass encounter state to MonsterLibrary

#### Hooks
- [ ] Create `src/hooks/useEncounter.ts`
  - State for selected monster IDs
  - State for view mode (grid/tabs)
  - Function to toggle monster selection
  - Function to clear selection
  - Function to load monsters by IDs
  - Function to save encounter
  - Function to load saved encounters
  - Return: `{ selectedIds, toggleSelection, clearSelection, monsters, viewMode, setViewMode, saveEncounter, encounters }`

#### Testing
- [ ] Manual test: Select multiple monsters from library
- [ ] Manual test: View selection count
- [ ] Manual test: Deselect monsters
- [ ] Manual test: Clear all selections
- [ ] Manual test: View encounter in grid mode
- [ ] Manual test: View encounter in tab mode
- [ ] Manual test: Save encounter with name
- [ ] Manual test: Load saved encounter
- [ ] Manual test: Delete saved encounter
- [ ] Manual test: Encounters persist after reload
- [ ] Manual test: Grid layout responsive on mobile/tablet/desktop
- [ ] Manual test: Tab navigation works correctly

---

## Additional Enhancements (Future)

### Quick Reference Features
- [ ] Add "Quick Reference" button accessible from character sheet
- [ ] Opens searchable monster modal overlay
- [ ] Can add monster to encounter without leaving character view

### Print & Export
- [ ] Add print-friendly CSS for stat blocks
- [ ] Add "Print Stat Block" button
- [ ] Add "Export Encounter to PDF" functionality

### Advanced Filtering
- [ ] Filter by specific ability scores
- [ ] Filter by damage types (resistance/immunity)
- [ ] Filter by special abilities (e.g., "has legendary actions")
- [ ] Filter by environment/terrain

### Initiative Tracker
- [ ] Add initiative rolling for encounter monsters
- [ ] Track turn order
- [ ] Track HP damage during encounter
- [ ] Mark conditions on monsters

---

## Key Technical Decisions

1. **Bundle Size**: Load all monster data upfront (~1.3MB) - acceptable for modern browsers
2. **Data Storage**:
   - SRD monsters: Static, loaded from `dataService.ts`
   - Custom monsters: IndexedDB `customMonsters` store
   - Favorites: IndexedDB `favoriteMonsters` store
   - Encounters: IndexedDB `encounters` store
3. **UI Pattern**: Follow existing patterns (grid cards, collapsible sections, modal forms)
4. **Responsive Design**: Mobile-first, collapsible stat blocks, stack on small screens

---

## Success Criteria

### ✅ Phase 1 Complete When:
- DMs can browse 334 SRD monsters
- Filter by type and CR
- Search by name
- View complete stat blocks with all sections
- Tab between Characters and Monsters views
- Mobile responsive

### ✅ Phase 2 Complete When:
- DMs can favorite monsters (star icon)
- Favorites persist across sessions
- DMs can create custom monsters with form
- DMs can edit custom monsters
- DMs can delete custom monsters
- Custom monsters appear in library alongside SRD
- Filter to show favorites/custom/SRD only

### ✅ Phase 3 Complete When:
- DMs can select multiple monsters via checkboxes
- View encounter in grid mode (all stat blocks visible)
- View encounter in tab mode (one stat block at a time)
- Save encounters with custom names
- Load saved encounters
- Delete saved encounters
- Encounters persist across sessions
- Clear selection functionality works

---

## Recommended Execution Order

1. **Implement Phase 1** (Core Monster Library)
   - Get basic browsing, filtering, and stat block viewing working
   - Test with variety of monsters (simple beasts, complex dragons, legendary creatures)

2. **User Testing & Feedback**
   - Use the library in actual game prep
   - Identify pain points and missing features

3. **Implement Phase 2** (Favorites & Custom Monsters)
   - Add bookmark functionality
   - Build custom monster creation form
   - Test custom monster workflow

4. **Implement Phase 3** (Encounter Management)
   - Add selection UI
   - Build grid and tab views
   - Test encounter saving/loading

5. **Polish & Optimize**
   - Improve performance if needed
   - Add loading states
   - Error handling
   - Accessibility improvements

---

## Notes

- All monster data comes from `/Users/JoelN/Coding/5e-SRD-database/src/2014/5e-SRD-Monsters.json`
- 334 monsters total, CR 0-30
- 14 different creature types
- Some monsters have legendary actions (32 total)
- Most monsters have special abilities
- Follow existing codebase patterns from character management
- Reuse UI components where possible (cards, grids, collapsible sections)
- Keep user data separate in IndexedDB (custom monsters, favorites, encounters)

---

**Created:** 2025-11-15
**Status:** Planning Phase
**Next Step:** Begin Phase 1 implementation

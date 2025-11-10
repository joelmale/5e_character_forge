# Character Creation Wizard - Complete Guide

## Overview

The 5e Character Forge features a comprehensive 5-step character creation wizard that guides users through creating a complete D&D 5th Edition character. The wizard provides an intuitive, interactive interface with validation, visual feedback, and support for multiple character creation methods.

---

## Wizard Steps

### Step 1: Basic Identity

**Purpose**: Define your character's name, alignment, and background.

#### Fields:

1. **Character Name** (Text Input)
   - Required field
   - Enter your character's name
   - No validation constraints

2. **Alignment** (Dropdown)
   - Required field
   - 9 alignment options organized by ethical categories:
     - **Good Alignments** (🌟): Lawful Good, Neutral Good, Chaotic Good
     - **Neutral Alignments** (⚖️): Lawful Neutral, True Neutral, Chaotic Neutral
     - **Evil Alignments** (😈): Lawful Evil, Neutral Evil, Chaotic Evil
   - **Info Pane**: When an alignment is selected, an expandable information pane appears showing:
     - Alignment category and icon
     - Detailed description of the alignment philosophy
     - 2-3 character examples from popular media/fiction
     - Close button (X icon in upper right) to hide the pane

3. **Background** (Dropdown)
   - Required field
   - 6 background options from the Player's Handbook:
     - Acolyte
     - Criminal
     - Folk Hero
     - Noble
     - Sage
     - Outlander
   - **Info Pane**: When a background is selected, an expandable information pane appears showing:
     - Background name and full description
     - Skill proficiencies granted
     - Languages granted
     - Starting equipment
     - Special feature name and description
     - Close button (X icon in upper right) to hide the pane

#### Navigation:
- **Next Button**: "Next: Choose Race" (disabled until name is entered)

---

### Step 2: Choose Race

**Purpose**: Select your character's race from a comprehensive list organized by categories.

#### Race Categories (Collapsible):

The races are organized into 4 collapsible categories. Each category shows:
- Category name with icon
- Brief description
- Chevron icon indicating expanded/collapsed state
- "Core Races" category is expanded by default

**1. Core Races** (📖)
- Description: "The most common and essential races from the Player's Handbook"
- 14 races including:
  - Human, Elf (High Elf), Dwarf (Mountain Dwarf), Halfling (Lightfoot)
  - Dragonborn, Gnome (Rock Gnome), Half-Elf, Half-Orc
  - Tiefling, Aarakocra, Goliath, Firbolg, Kenku, Tabaxi

**2. Exotic Races** (🌟)
- Description: "Unusual and rare races from supplemental books"
- 6 races including:
  - Genasi (Air), Aasimar (Protector), Triton, Yuan-Ti Pureblood, Bugbear, Lizardfolk

**3. Monstrous Races** (👹)
- Description: "Traditionally hostile races, often requiring DM approval"
- 5 races including:
  - Goblin, Hobgoblin, Kobold, Orc, Changeling

**4. Planar Races** (✨)
- Description: "Beings from other planes of existence"
- 6 races including:
  - Githyanki, Githzerai, Shadar-kai, Eladrin, Warforged, Kalashtar

#### Race Selection:
- Click on any category to expand/collapse it
- Click on a race button to select it
- Selected race is highlighted with red border and background
- Each race button shows:
  - Race name
  - Source book

#### Race Info Pane:
When a race is selected, a detailed information pane appears showing:
- **Race name** (large, bold)
- **Source book** (e.g., "Player's Handbook")
- **Ability Score Bonuses** (e.g., "+2 STR, +1 CON")
- **Racial Traits** (bulleted list of special abilities)
- **Description** (lore and overview)
- **Typical Roles** (suggested classes/playstyles)
- **Close button** (X icon in upper right)

#### Navigation:
- **Back Button**: Returns to Step 1
- **Next Button**: "Next: Choose Class" (disabled until a race is selected)

---

### Step 3: Choose Class

**Purpose**: Select your character's class from a comprehensive list organized by thematic categories.

#### Class Categories (Collapsible):

Classes are organized into 4 collapsible categories. "Core Classes" is expanded by default.

**1. Core Classes** (📚)
- Description: "The 13 essential D&D 5e classes from the Player's Handbook"
- 13 classes including:
  - Barbarian, Bard, Cleric, Druid, Fighter
  - Monk, Paladin, Ranger, Rogue, Sorcerer
  - Warlock, Wizard, Artificer

**2. Martial & Skill Specialists** (⚔️)
- Description: "Combat experts and skill-focused subclasses"
- Classes/subclasses from specialized sources

**3. Divine & Primal Casters** (🌿)
- Description: "Nature and divine magic wielders"
- Classes/subclasses focused on divine/primal magic

**4. Arcane & Occult Casters** (🔮)
- Description: "Masters of arcane and mysterious magic"
- Classes/subclasses focused on arcane magic

#### Class Selection:
- Click on any category to expand/collapse it
- Click on a class button to select it
- Selected class is highlighted with red border and background
- Each class button shows:
  - Class name
  - Source book

#### Class Info Pane:
When a class is selected, a detailed information pane appears showing:
- **Class name** (large, bold)
- **Source book**
- **Hit Die** (e.g., "d12")
- **Primary Ability** (recommended ability scores)
- **Saving Throws** (proficient saves)
- **Skill Proficiencies** (available skills to choose from)
- **Key Features** (first 4 class features, bulleted)
- **Description** (class overview and playstyle)
- **Key Role** (role in party and combat style)
- **Close button** (X icon in upper right)

#### Navigation:
- **Back Button**: Returns to Step 2
- **Next Button**: "Next: Abilities" (disabled until a class is selected)

---

### Step 4: Determine Ability Scores

**Purpose**: Set your character's six core ability scores using one of six different methods.

#### Ability Score Method Selection (Dropdown):

At the top of the page, select your preferred method:

**1. Standard Array**
- **Scores**: 15, 14, 13, 12, 10, 8
- **UI**: Visual chips show available scores (yellow) vs assigned scores (gray)
- **Assignment**: Use dropdowns to assign each score to an ability
- **Swapping**: Can swap scores by selecting a different value
- **Default method**

**2. 4d6, Drop Lowest (Standard Dice Roll)**
- **Mechanics**: Roll 4 six-sided dice, drop the lowest die, sum the remaining 3
- **UI**:
  - "Roll Ability Scores" button (purple)
  - After rolling, shows 6 rolled sets with individual dice values
  - Yellow chips show unassigned rolls, gray shows assigned
- **Assignment**: Use dropdowns to assign rolled totals to abilities
- **Re-rolling**: Click "Re-roll All Scores" to generate new values

**3. 3d6 in Order (Classic Dice Roll)**
- **Mechanics**: Roll 3d6 for each ability in fixed order (STR, DEX, CON, INT, WIS, CHA)
- **UI**:
  - "Roll Ability Scores" button (purple)
  - Automatically assigns rolls in order
  - Shows individual dice values for each ability
- **Assignment**: Automatic - no manual assignment needed
- **Re-rolling**: Click "Re-roll All Scores" to generate new values

**4. 5d6, Drop Two Lowest**
- **Mechanics**: Roll 5 six-sided dice, drop the two lowest, sum the remaining 3
- **UI**: Same as Standard Roll method
- **Assignment**: Use dropdowns to assign rolled totals to abilities
- **Re-rolling**: Available

**5. Point Buy (27 Points)**
- **Budget**: 27 points total
- **Range**: Scores from 8-15 only
- **Costs**:
  - 8 = 0 points
  - 9 = 1 point
  - 10 = 2 points
  - 11 = 3 points
  - 12 = 4 points
  - 13 = 5 points
  - 14 = 7 points
  - 15 = 9 points
- **UI**:
  - Large points remaining display (purple border)
  - Dropdowns show score and point cost
  - Disabled options if insufficient points
- **Starting values**: All abilities start at 8 (0 points spent)

**6. Custom Entry**
- **Purpose**: DM-approved custom scores
- **UI**:
  - Yellow warning banner explaining DM consultation needed
  - Number inputs for each ability (1-20 range)
- **No validation**: Allows any values within range

#### Ability Display (All Methods):

For each of the 6 abilities (STR, DEX, CON, INT, WIS, CHA):
- **Ability name** (red text)
- **Input control** (dropdown, number input, or display based on method)
- **Final score with modifier** (large yellow text)
  - Format: "16 (+3)"
  - Shows base score + racial bonus
- **Racial bonus indicator** (green text)
  - Example: "+ 2 (Racial)"
  - Only shown if race grants a bonus to that ability

#### Navigation:
- **Back Button**: Returns to Step 3
- **Next Button**: "Next: Traits" (disabled until all abilities have valid scores > 0)

---

### Step 5: Final Details & Personality

**Purpose**: Define your character's personality, ideals, bonds, and flaws.

#### Fields:

All fields are optional text areas with helpful labels and placeholders:

1. **Personality Traits**
   - **Label**: "Personality Traits"
   - **Placeholder**: "Describe your character's personality traits and quirks..."
   - **Size**: 5 rows (larger)
   - **Purpose**: Character's behavioral traits, mannerisms, habits

2. **Ideals**
   - **Label**: "Ideals"
   - **Placeholder**: "What principles and beliefs guide your character?"
   - **Size**: 4 rows
   - **Purpose**: Character's core values and motivations

3. **Bonds**
   - **Label**: "Bonds"
   - **Placeholder**: "Who or what is your character connected to?"
   - **Size**: 4 rows
   - **Purpose**: Connections to people, places, or things

4. **Flaws**
   - **Label**: "Flaws"
   - **Placeholder**: "What weaknesses does your character have?"
   - **Size**: 4 rows
   - **Purpose**: Character's vulnerabilities and shortcomings

#### Layout:
- Personality Traits: Full width
- Ideals: Full width
- Bonds and Flaws: Side-by-side on desktop, stacked on mobile

#### Navigation:
- **Back Button**: Returns to Step 4
- **Create Character Button** (green):
  - Validates all required fields
  - Calculates final stats (modifiers, proficiency, skills, HP, AC, etc.)
  - Saves character to IndexedDB
  - Closes wizard
  - Displays success message

---

## Wizard Features

### Progress Tracking
- **Progress Bar**: Visual bar at top showing current step (1-5)
- **Step Counter**: Text display "Step X of 5"
- **Color**: Red progress bar matching theme

### Visual Design
- **Modal**: Large centered modal (max-width: 1024px on desktop)
- **Responsive**: Adapts to mobile, tablet, and desktop
- **Scrollable**: Content area scrolls when too tall for viewport
- **Fixed Header**: Progress bar and title stay visible while scrolling

### Validation
- **Required Fields**: Name, alignment, background, race, class, all ability scores
- **Next Button**: Disabled until current step is valid
- **Visual Feedback**: Disabled buttons are grayed out

### Data Persistence
- **Draft**: Wizard maintains state during session
- **Reset**: Closing wizard resets the form
- **Final Save**: Character saved to IndexedDB on completion

### Information Panes
- **Expandable**: Show/hide detailed information
- **Close Buttons**: X icon in upper right corner
- **Content**: Comprehensive details about selections
- **Styling**: Bordered boxes with distinct background colors

---

## Technical Implementation

### Component Structure
```
CharacterCreationWizard
├── Step1Details (Basic Identity)
├── Step2Race (Choose Race)
├── Step3Class (Choose Class)
├── Step4Abilities (Ability Scores)
└── Step5Traits (Final Details)
```

### State Management
- **Wizard State**: Current step, loading state, errors
- **Character Data**: All character creation data in single object
- **Local State**: Method-specific state (rolled sets, point buy points, etc.)

### Data Flow
1. User makes selections in each step
2. Data stored in `CharacterCreationData` object
3. Validation checked before allowing next step
4. Final submission calculates derived stats
5. Complete character saved to IndexedDB
6. Character list refreshed in main app

---

## Character Data Structure

### Input Data (Wizard Collects):
```typescript
{
  name: string                    // Character name
  level: number                   // Starting level (always 1)
  raceSlug: string               // Selected race identifier
  classSlug: string              // Selected class identifier
  abilities: {                   // Raw ability scores
    STR: number
    DEX: number
    CON: number
    INT: number
    WIS: number
    CHA: number
  }
  abilityScoreMethod: string     // Method used for ability scores
  background: string             // Selected background
  alignment: string              // Selected alignment
  personality: string            // Personality traits text
  ideals: string                // Ideals text
  bonds: string                 // Bonds text
  flaws: string                 // Flaws text
}
```

### Calculated Data (On Submission):
- **Ability Modifiers**: Calculated from final scores
- **Proficiency Bonus**: Based on level
- **Skills**: All skills with modifiers
- **Hit Points**: Class hit die + CON modifier
- **Armor Class**: 10 + DEX modifier (base)
- **Initiative**: DEX modifier
- **Speed**: From race
- **Proficiencies**: From class and background
- **Languages**: From race and background
- **Racial Traits**: From race
- **Class Features**: From class
- **Equipment**: From background and class

---

## User Experience Highlights

### Intuitive Flow
- Linear progression through logical steps
- Clear labels and helpful placeholders
- Visual feedback for selections
- Informative descriptions

### Helpful Features
- **Info Panes**: Detailed information without overwhelming the UI
- **Collapsible Categories**: Organize large lists of options
- **Visual Indicators**: Show available vs assigned scores
- **Racial Bonuses**: Automatically calculated and displayed
- **Method Flexibility**: 6 different ways to determine ability scores

### Accessibility
- Keyboard navigation supported
- Clear visual hierarchy
- Descriptive labels and placeholders
- Disabled state clearly indicated

### Error Prevention
- Required fields enforced
- Invalid states prevent progression
- Clear validation messages
- Confirmation required for final submission

---

## Ability Score Methods - Detailed Comparison

| Method | Randomness | Player Control | Avg Score Total | Best For |
|--------|-----------|----------------|-----------------|----------|
| Standard Array | None | Full | 72 | Balanced, consistent characters |
| 4d6 Drop Lowest | High | Medium | ~73 | Traditional D&D experience |
| 3d6 in Order | Very High | None | ~63 | Old-school challenge |
| 5d6 Drop Two | Medium | Medium | ~75 | Slightly more powerful |
| Point Buy | None | Full | 72 | Optimized builds |
| Custom | None | Full | Varies | DM-approved concepts |

---

## Tips for Users

1. **Read the Info Panes**: They contain valuable information about your choices
2. **Consider Synergy**: Choose race/class combinations that complement each other
3. **Racial Bonuses**: Remember that your race will boost certain ability scores
4. **Primary Abilities**: Focus high scores on your class's primary ability
5. **Roleplay First**: Sometimes sub-optimal choices make better stories
6. **Ability Score Methods**:
   - Use Standard Array for balanced parties
   - Use Point Buy for optimized builds
   - Use dice rolls for fun randomness
7. **Save Your Work**: The wizard will calculate everything for you on submission

---

## Future Enhancements (Potential)

- **Multi-classing**: Support for multiple classes
- **Custom Races**: User-defined racial traits
- **Subclass Selection**: Choose subclass archetypes
- **Equipment Selection**: Choose starting gear
- **Spell Selection**: For spellcasting classes
- **Feat Selection**: If using variant rules
- **Export Options**: PDF, JSON, D&D Beyond import
- **Templates**: Save character builds as templates
- **Guided Mode**: Recommendations based on playstyle preferences

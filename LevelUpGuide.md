# Level Up Modal Guide - Comprehensive Design

## Overview

This document outlines the design and implementation plan for a comprehensive level up modal guide for the D&D 5e Character Forge application. The modal will replace the current simple level up functionality with a guided, step-by-step experience that shows all changes and walks users through all choices.

## Current State Analysis

### Existing Level Up Logic (from `handleLevelUp` in App.tsx)
- ✅ Automatic: Level +1, proficiency bonus, HP increase, hit dice, spell slots
- ✅ Conditional Modals: ASI (levels 4,8,12,14,16,19), Wizard subclass (level 2), Cantrips
- ❌ Missing: Comprehensive overview and guided choice flow

### Problems with Current Implementation
1. No overview of what changes at each level
2. Choices happen in separate modals without context
3. Users may miss important decisions
4. No way to review all changes before confirming

## Proposed Solution: Level Up Modal Guide

### Phase 1: Level Overview Screen

**Modal Structure:**
```
┌─ Level Up to Level X ──────────────────────────┐
│ 🎉 Congratulations! You're leveling up!        │
│                                               │
│ Current Level: 3 → New Level: 4              │
│                                               │
│ 📋 CHANGES THIS LEVEL:                        │
│ • +1 Proficiency Bonus (from +2 to +3)        │
│ • +HP increase (avg +4 from CON +1)          │
│ • +1 Hit Die (d8)                            │
│                                               │
│ 🎯 CHOICES THIS LEVEL:                        │
│ • Ability Score Improvement (+2) OR Feat     │
│ • New Spells (if spellcaster)                │
│ • New Features (class/race/subclass)         │
│                                               │
│ [Continue to Level Up Guide]                  │
└───────────────────────────────────────────────┘
```

### Phase 2: Guided Choice Flow

**Step-by-Step Wizard Structure:**

#### Step 1: HP & Automatic Updates
- Show HP increase calculation
- Confirm automatic updates (proficiency, hit dice)
- Display new features gained

#### Step 2: Ability Score Improvement (ASI)
- For levels: 4, 8, 12, 14, 16, 19
- Choice: +2 to one ability OR +1 to two abilities OR Feat
- Reuse existing `AbilityScoreIncreaseModal` logic

#### Step 3: Feat Selection (if chosen)
- Show available feats based on prerequisites
- Reuse existing feat selection logic

#### Step 4: Subclass Selection
- For classes that get subclasses at specific levels
- Currently only handles Wizard (level 2)
- Should expand to all classes (Barbarian 3, etc.)

#### Step 5: Spellcasting Updates
- New spell slots (automatic)
- New cantrips (choice modal)
- New spell learning (for Wizards, etc.)

#### Step 6: Class Features
- Display new class features gained
- Show feature descriptions
- Handle any feature choices

#### Step 7: Confirmation & Summary
- Show complete character changes
- Allow final confirmation
- Option to go back and change choices

## Implementation Architecture

### New Components Needed

#### 1. `LevelUpModal.tsx` - Main Container
```typescript
interface LevelUpModalProps {
  isOpen: boolean;
  character: Character;
  newLevel: number;
  onClose: () => void;
  onComplete: (updatedCharacter: Character) => void;
}

interface LevelUpStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  isRequired: boolean;
  isCompleted: boolean;
}
```

#### 2. `LevelUpOverview.tsx` - Phase 1
- Calculates and displays all changes
- Lists all choices needed
- Shows level milestone information

#### 3. `LevelUpWizard.tsx` - Phase 2
- Step-by-step guided flow
- Progress tracking
- Back/forward navigation
- State management for choices

#### 4. `LevelUpStepContainer.tsx`
- Generic container for each step
- Navigation controls
- Validation logic

### Integration Points

#### 1. Update `handleLevelUp` in App.tsx
```typescript
const handleLevelUp = useCallback(async (characterId: string) => {
  const character = characters.find(c => c.id === characterId);
  if (!character) return;

  if (character.level >= 20) {
    setRollResult({ text: `${character.name} is already at max level!`, value: null });
    return;
  }

  const newLevel = character.level + 1;

  // Open level up modal instead of auto-leveling
  setLevelUpModalState({
    isOpen: true,
    characterId,
    newLevel
  });
}, [characters]);
```

#### 2. Add Level Up Modal State
```typescript
const [levelUpModalState, setLevelUpModalState] = useState<{
  isOpen: boolean;
  characterId: string;
  newLevel: number;
}>({ isOpen: false, characterId: '', newLevel: 1 });
```

#### 3. Update Character Sheet Layouts
- Replace direct level up call with modal trigger
- Pass level up modal state to layouts

## Level-Specific Logic

### Automatic Changes (No Choice)
- Level increase
- Proficiency bonus update
- HP increase (with CON modifier)
- Hit dice increase
- Spell slot updates
- New class/race/subclass features

### Choice-Based Changes
- **ASI/Feat**: Levels 4, 8, 12, 14, 16, 19
- **Subclass**: Class-specific levels (Barbarian 3, etc.)
- **Spells**: Cantrips, spell learning
- **Fighting Style**: Fighter/Paladin/Ranger level 2
- **Other**: Class-specific choices

## Data Requirements

### 1. Level Change Data Structure
```typescript
interface LevelChange {
  level: number;
  changes: {
    proficiencyBonus?: number;
    hpIncrease?: number;
    hitDiceIncrease?: number;
    spellSlots?: Record<string, number>;
    features?: Feature[];
  };
  choices: {
    asi?: boolean;
    feat?: boolean;
    subclass?: boolean;
    spells?: boolean;
    fightingStyle?: boolean;
    // ... other choices
  };
}
```

### 2. Level Milestone Data
```typescript
const LEVEL_MILESTONES = {
  2: { name: "Class Features", description: "Gain signature class features" },
  3: { name: "Subclass", description: "Choose your specialization" },
  4: { name: "ASI/Feat", description: "First Ability Score Improvement" },
  5: { name: "Extra Attack", description: "Make two attacks per turn" },
  // ... etc
};
```

## UI/UX Considerations

### 1. Progressive Disclosure
- Start with overview to set expectations
- Guide through choices one at a time
- Show progress and remaining steps

### 2. Validation & Error Handling
- Prevent invalid choices
- Show prerequisites and restrictions
- Allow going back to change previous choices

### 3. Responsive Design
- Work on mobile and desktop
- Clear visual hierarchy
- Accessible navigation

### 4. State Management
- Track choices across steps
- Persist partial progress
- Handle modal close/cancel gracefully

## Integration with Existing Systems

### 1. Reuse Existing Modals
- `AbilityScoreIncreaseModal` for ASI choices
- `ChooseSubclassModal` for subclass selection
- `ChooseCantripModal` for cantrip choices
- Existing feat selection logic

### 2. Update Character Calculation
- Modify `characterCalculator.ts` to handle level-based changes
- Ensure all automatic updates are applied correctly

### 3. Database Updates
- Ensure level up changes are properly saved
- Handle rollback if level up is cancelled

## Testing Scenarios

1. **Level 2 Fighter**: HP increase, Fighting Style choice
2. **Level 3 Barbarian**: HP increase, Subclass choice
3. **Level 4 Wizard**: HP increase, ASI/Feat choice
4. **Level 5 Sorcerer**: HP increase, Extra Attack feature
5. **Level 19 Champion**: Multiple ASI choices, capstone features

## Implementation Phases

### Phase 1: Core Infrastructure
- Create LevelUpModal component structure
- Implement LevelUpOverview screen
- Basic state management

### Phase 2: Step-by-Step Flow
- Implement LevelUpWizard with navigation
- Integrate existing modal components
- Add validation and error handling

### Phase 3: Level-Specific Logic
- Implement level milestone detection
- Add automatic change calculations
- Handle class-specific requirements

### Phase 4: Polish & Testing
- UI/UX improvements
- Comprehensive testing
- Performance optimization

## Benefits

1. **Better User Experience**: Clear overview of what happens when leveling up
2. **Guided Process**: Step-by-step guidance prevents missed choices
3. **Educational**: Teaches players about level progression
4. **Error Prevention**: Validation ensures valid character builds
5. **Flexibility**: Easy to add new level-based features

This comprehensive level up modal would transform the leveling experience from a confusing series of separate modals into a cohesive, educational, and user-friendly guided process.</content>
<parameter name="filePath">LevelUpGuide.md
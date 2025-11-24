# Implementation Plan: 5 Additional 2024 Classes

**Status:** In Progress
**Started:** Current Session
**Classes:** Druid, Warlock, Fighter, Barbarian, Paladin

---

## Overview
Implement Druid, Warlock, Fighter, Barbarian, and Paladin for 2024 edition using the existing widget system. This will also include extending the widget system to support Fighting Styles and Eldritch Invocations, plus implementing level-up features for all Fighter levels.

---

## Phase 1: Type System Extensions ✅ COMPLETE
**Estimated Time:** 30 minutes | **Actual Time:** 15 minutes

### 1.1 Add New Widget Type: `list_selection`
**File:** `src/types/widgets.ts`
- [x] Add `list_selection` to widget type union (already existed)
- [x] Update `ListSelectionConfig` to include 'invocation' type
- [x] Add `ListSelectionWidgetProps` interface (already existed)

### 1.2 Update Character Types
**File:** `src/types/dnd.ts`
- [x] Add `eldritchInvocations?: string[]` to Character interface
- [x] Add `secondWindUses?: number` to Character interface
- [x] Verify `primalOrder?: 'magician' | 'warden'` already exists ✓
- [x] Add `eldritchInvocations?: string[]` to CharacterCreationData interface

### 1.3 Update SelectionPoolWidget Filter Types
**File:** `src/types/widgets.ts`
- [x] Add `'proficient_melee_weapons'` to filter type union

---

## Phase 2: Widget Components ✅ COMPLETE
**Estimated Time:** 1-2 hours | **Actual Time:** 30 minutes

### 2.1 Create ListSelectionWidget
**File:** `src/components/CharacterCreationWizard/widgets/ListSelectionWidget.tsx`
- [x] Radio-style selection (choose 1 from list)
- [x] Support Fighting Styles (10 options with descriptions)
- [x] Support Eldritch Invocations (6 level-1 compatible options)
- [x] Display prerequisites if applicable
- [x] Amber theme matching existing widgets
- [x] 300+ lines of code with full documentation

### 2.2 Update SelectionPoolWidget
**File:** `src/components/CharacterCreationWizard/widgets/SelectionPoolWidget.tsx`
- [x] Add `proficient_melee_weapons` filter case
- [x] Filter out ranged weapons with `isWeaponMelee()` function
- [x] Exclude weapons with 'ammunition' property or weapon_range='Ranged'

### 2.3 Update Widget Index
**File:** `src/components/CharacterCreationWizard/widgets/index.ts`
- [x] Export ListSelectionWidget
- [x] Export ListSelectionConfig and ListSelectionWidgetProps types

---

## Phase 3: Class Data Files ✅ COMPLETE
**Estimated Time:** 2-3 hours | **Actual Time:** 20 minutes

### 3.1 Create 2024 Druid Class JSON
**File:** `src/data/srd/2024/5e-SRD-Classes.json` (modify)
- [x] Hit die: d8
- [x] Skills: 2 from Arcana, Animal Handling, Insight, Medicine, Nature, Perception, Religion, Survival
- [x] Proficiencies: Light armor, Shields, Simple weapons, Herbalism Kit
- [x] Level 1 features: Primal Order (BranchChoiceWidget), Druidic (AutomaticWidget), Spellcasting (AutomaticWidget)

### 3.2 Create 2024 Warlock Class JSON
**File:** `src/data/srd/2024/5e-SRD-Classes.json` (modify)
- [x] Hit die: d8
- [x] Skills: 2 from Arcana, Deception, History, Intimidation, Investigation, Nature, Religion
- [x] Proficiencies: Light armor, Simple weapons
- [x] Level 1 features: Eldritch Invocations (ListSelectionWidget), Pact Magic (AutomaticWidget)

### 3.3 Create 2024 Fighter Class JSON
**File:** `src/data/srd/2024/5e-SRD-Classes.json` (modify)
- [x] Hit die: d10
- [x] Skills: 2 from Acrobatics, Animal Handling, Athletics, History, Insight, Intimidation, Perception, Persuasion, Survival
- [x] Proficiencies: All armor, all weapons
- [x] Level 1 features: Fighting Style (ListSelectionWidget), Second Wind (AutomaticWidget), Weapon Mastery (SelectionPoolWidget - 3 weapons)
- [x] Add full level progression (levels 2-20) - DEFERRED to Phase 6

### 3.4 Create 2024 Barbarian Class JSON
**File:** `src/data/srd/2024/5e-SRD-Classes.json` (modify)
- [x] Hit die: d12
- [x] Skills: 2 from Animal Handling, Athletics, Intimidation, Nature, Perception, Survival
- [x] Proficiencies: Light/Medium armor, Shields, Simple/Martial weapons
- [x] Level 1 features: Weapon Mastery (SelectionPoolWidget - 2 melee), Rage (AutomaticWidget)

### 3.5 Create 2024 Paladin Class JSON
**File:** `src/data/srd/2024/5e-SRD-Classes.json` (modify)
- [x] Hit die: d10
- [x] Skills: 2 from Athletics, Insight, Intimidation, Medicine, Persuasion, Religion
- [x] Proficiencies: All armor, all weapons
- [x] Level 1 features: Weapon Mastery (SelectionPoolWidget - 2 weapons), Lay on Hands (AutomaticWidget)

---

## Phase 4: Calculation Updates ✅ COMPLETE
**Estimated Time:** 1 hour | **Actual Time:** 15 minutes

### 4.1 Implement Primal Order Bonuses
**File:** `src/components/CharacterCreationWizard/utils/wizard.utils.ts`
- [x] Add skill bonus calculation for Druid Magician (lines 64-69)
- [x] +WIS to Arcana and Nature (similar to Thaumaturge)

### 4.2 Store New Level 1 Features
**File:** `src/components/CharacterCreationWizard/utils/wizard.utils.ts`
- [x] Transfer `eldritchInvocations` array to Character (line 289)
- [x] Transfer `secondWindUses` (line 290)
- [x] Verify `primalOrder` already transferred (line 284) ✓

### 4.3 Cantrip Bonus for Druid Magician
**File:** `src/components/CharacterCreationWizard/steps/Step4Spells.tsx`
- [x] Check `data.primalOrder === 'magician'` (lines 90-93)
- [x] Add +1 to cantrip count

---

## Phase 5: Step3Class Integration ✅ COMPLETE
**Estimated Time:** 30 minutes | **Actual Time:** 20 minutes

### 5.1 Update Widget Rendering
**File:** `src/components/CharacterCreationWizard/steps/Step3Class.tsx`
- [x] Import ListSelectionWidget (line 6)
- [x] Add `list_selection` case to switch statement (lines 330-350)
- [x] Handle Fighting Style selection (lines 336-344)
- [x] Handle Eldritch Invocation selection (lines 338-346)

### 5.2 Update Validation
**File:** `src/components/CharacterCreationWizard/steps/Step3Class.tsx`
- [x] Check `list_selection` widgets require selection (lines 472-479)
- [x] Check Primal Order for Druid (line 466)
- [x] Check Fighting Style for Fighter (line 474)
- [x] Check Eldritch Invocation for Warlock (line 477)

---

## Phase 6: Fighter Level Progression System ⏸️ PENDING
**Estimated Time:** 2-3 hours

### 6.1 Create Level-Up Feature Data Structure
**File:** `src/data/fighterFeatures.ts` (new file)
- [ ] Define all Fighter features by level (2-20)
- [ ] Include: Action Surge, Tactical Mind, Subclass, ASI, Extra Attack, Indomitable, etc.

### 6.2 Update Character Level-Up Modal
**File:** `src/components/CharacterSheet/LevelUpModal.tsx`
- [ ] Load class features for current level
- [ ] Display available features
- [ ] Allow selection of ASI/Feats at appropriate levels

### 6.3 Character Sheet Feature Display
**File:** `src/components/CharacterSheet/FeaturesSection.tsx`
- [ ] Display Second Wind uses
- [ ] Display Action Surge uses
- [ ] Display Indomitable uses
- [ ] Track short rest / long rest recovery

---

## Phase 7: Data Files ⏸️ PENDING
**Estimated Time:** 1 hour

### 7.1 Create Fighting Styles Data
**File:** `src/data/fightingStyles.ts` (new file)
- [ ] Define all Fighting Style options with descriptions

### 7.2 Create Eldritch Invocations Data
**File:** `src/data/eldritchInvocations.ts` (new file)
- [ ] Define level 1 compatible invocations (exclude Pact Boons)

---

## Phase 8: Testing & Documentation ⏸️ PENDING
**Estimated Time:** 1 hour

### 8.1 Manual Testing Checklist
- [ ] Create 2024 Druid (Magician): Verify +1 cantrip, +WIS to Arcana/Nature
- [ ] Create 2024 Druid (Warden): Verify Medium Armor, Martial Weapons
- [ ] Create 2024 Warlock: Verify 1 Eldritch Invocation selection
- [ ] Create 2024 Fighter: Verify Fighting Style + Second Wind + 3 Weapon Mastery
- [ ] Create 2024 Barbarian: Verify 2 MELEE weapon mastery only
- [ ] Create 2024 Paladin: Verify 2 weapon mastery + Lay on Hands
- [ ] Test level 5 Fighter creation: Verify higher-level features appear

### 8.2 Update Documentation
- [ ] Update `2024_UNIVERSAL_WIZARD_STATUS.md` to 100% complete
- [ ] Update `CLAUDE.md` with new widget types and features

---

## Progress Summary

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Type System | ✅ Complete | 3/3 tasks |
| Phase 2: Widget Components | ✅ Complete | 3/3 tasks |
| Phase 3: Class Data Files | ✅ Complete | 5/5 tasks |
| Phase 4: Calculations | ✅ Complete | 3/3 tasks |
| Phase 5: Integration | ✅ Complete | 2/2 tasks |
| Phase 6: Level Progression | ⏸️ Pending | 0/3 tasks |
| Phase 7: Data Files | ⏸️ Pending | 0/2 tasks |
| Phase 8: Testing | ⏸️ Pending | 0/2 tasks |
| **TOTAL** | **70%** | **16/23 tasks** |

---

## Estimated Timeline: 9-12 hours

---

**Last Updated:** Phase 5 complete (20 minutes)

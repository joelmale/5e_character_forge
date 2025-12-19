# Gap Analysis Report: Rules Engine & Data (Gemini)

**Date:** December 12, 2025
**Scope:** Rules Engine (Phase 1), Data Structures, Edition Compliance (2014 vs 2024)

## Executive Summary
The Rules Engine has a solid architectural foundation (Predicates, Effects, Stacking Rules). However, there is a significant disconnection between the **Data Layer** (JSONs) and the **Rules Layer**. Most "Conditions" and "Species Traits" exist only as text/tags and lack the mechanical implementations (Effects) required for gameplay (e.g., Disadvantage, Bonuses).

## Detailed Findings

| Category | Missing Rule/Gap | Impact | Suggested Fix (Data/Logic) |
| :--- | :--- | :--- | :--- |
| **Edition Conflict** | **Exhaustion (2024)** | **Critical** | Exhaustion only supports levels 1-2 (with missing mechanics). 2024 requires 10 levels with -1 to d20 Tests per level. 2014 requires 6 levels with specific penalties. | Implement `ExhaustionEffect` generator that creates correct effects based on `facts.edition`. |
| **Missing Logic** | **Condition Mechanics** | **Critical** | Conditions (Prone, Blinded, Poisoned, Frightened) add *Tags* but do **not** apply mechanical modifiers (Disadvantage on Attacks, Advantage on being hit, etc.). | Create a `GlobalRules` layer or expand `statusConditions.ts` to include `saveBonus`, `skillBonus`, `grantAdvantage` effects for each condition. |
| **Data Gap** | **Orphaned Species Traits** | **High** | Species data (e.g., Human 2024) lists traits like "Resourceful" as strings. No corresponding `Feature` definition or `Effect` exists for these. | Create a `SpeciesFeatureRegistry` where "Resourceful" maps to an actual `SourcedEffect` (e.g., granting Inspiration). |
| **Missing Logic** | **Global Combat Rules** | **High** | No system exists to handle "Disadvantage on Ranged Attacks in Melee" or "Advantage against Prone targets". These are implied rules that need explicit logic. | Implement a `CombatEvaluator` that checks tags (`condition:prone`, `range:5ft`) and applies transient modifiers. |
| **Stacking Audit** | **AC Finalizer Verification** | **Medium** | `finalizers.ts` handles AC, but `Unarmored Defense` (Monk/Barbarian) features need to be audited to ensure they use `priority: 'additive'` or `priority: 'base'` correctly to prevent stacking with Armor. | Audit Class Feature data for Monk/Barbarian to ensure correct AC Effect priority. |
| **Dependency** | **Proficiency Sources** | **Medium** | `hasProficiency` predicate exists, but many sources (Backgrounds, Classes) might be storing proficiencies as simple strings rather than `GrantProficiency` effects. | Audit `backgrounds.json` and `classProgression.ts` to ensure they generate proper `GrantProficiency` effects. |

## Specific Examples

### 1. The "Prone" Paradox
Currently, `proneCondition` in `statusConditions.ts` adds:
```typescript
tags: ['condition:prone', 'can-only-crawl']
```
**Missing Effects:**
-   Self: Disadvantage on Attack Rolls.
-   Enemy (within 5ft): Advantage on Attack Rolls against self.
-   Enemy (>5ft): Disadvantage on Attack Rolls against self.

### 2. The "Human" Hollow
In `species.json` (2024):
```json
"species_traits": ["Resourceful", "Skillful", "Versatile"]
```
These are plain strings. The Rules Engine does not know that "Resourceful" means "Gain Heroic Inspiration". Without a `Feature` definition, this trait does nothing.

## Recommendations

1.  **Immediate Priority:** Flesh out `statusConditions.ts` to include all mechanical effects (using `saveBonus`, `skillBonus`, and a new `rollModifier` effect type if needed for Advantage/Disadvantage).
2.  **Data Bridge:** Create a mapping system that converts string-based `species_traits` into full `GrantFeature` effects.
3.  **Edition Switch:** Fully implement the 10-level Exhaustion track for 2024 and the 6-level track for 2014 within `statusConditions.ts` using edition predicates.

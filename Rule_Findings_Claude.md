# Rules Engine Gap Analysis Report - Phase 10 Audit

**Auditor Role**: Senior QA Engineer & D&D 5e Rules Lawyer
**Audit Date**: 2025-12-12
**Phase Audited**: Phase 10 - Advanced Features & Polish
**Audit Scope**: Multiclass support, Species (Elf, Dwarf, Halfling, Dragonborn), Classes (Rogue, Paladin, Ranger, Bard)

---

## Executive Summary

**Critical Findings**: 23
**High Priority Findings**: 31
**Medium Priority Findings**: 18
**Total Gaps Identified**: 72

**Overall Assessment**: ⚠️ The rules engine has excellent data structure and multiclass support, but lacks critical gameplay mechanics. Many tags are defined but have no executable effects. Combat, conditions, and resource management are missing.

---

## 1. Edition Conflict Audit (2014 vs 2024)

| Category | Missing Rule/Gap | Impact | Suggested Fix |
|:---------|:----------------|:-------|:--------------|
| **Edition Conflict** | **Exhaustion levels differ** (2014: 6 levels, 2024: 10 levels) | **CRITICAL** | Add `exhaustionLevel` effect kind with edition-specific max values. Add predicates for each exhaustion level with different effects per edition. |
| **Edition Conflict** | **Inspiration mechanics differ** (2024 uses "Heroic Inspiration" with different rules) | **HIGH** | Add `inspiration` vs `heroicInspiration` as separate resources. 2024 grants on long rest (Human Resourceful), 2014 is DM-awarded. |
| **Edition Conflict** | **Ranger completely different** (Phase 10 has both but test coverage missing) | **HIGH** | Add integration tests validating 2014 Ranger (Favored Enemy/Natural Explorer) vs 2024 Ranger (Favored Foe/Deft Explorer) work correctly and don't conflict. |
| **Edition Conflict** | **Ability Score max differs** (2014: 20 base, 2024: may differ) | **MEDIUM** | Add `abilityScoreMax` effect with edition predicate. Enforce cap in evaluator. |
| **Edition Conflict** | **Critical Hit rules differ** (2014: double dice, 2024: max damage + roll) | **HIGH** | Add `criticalHitRule` effect kind. Current engine has no combat mechanics. |
| **Edition Conflict** | **Spell list access differs** (some 2024 classes get different spells) | **MEDIUM** | Spell lists not yet implemented. Will need edition filtering. |
| **Edition Conflict** | **Bonus Action spell restriction** (2014: can't cast leveled spell, 2024: changed) | **MEDIUM** | Add `spellcastingRestriction` effect kind with edition predicates. |
| **Edition Conflict** | **Dragonborn Breath Weapon scaling** (2014: static, 2024: may scale differently) | **LOW** | Current implementation assumes 2014 rules. Add 2024 variant with level scaling. |

---

## 2. Implied Rules Audit (Tags Without Effects)

### 2A. Combat Mechanics (CRITICAL - Complete Subsystem Missing)

| Category | Missing Rule/Gap | Impact | Suggested Fix |
|:---------|:----------------|:-------|:--------------|
| **Missing Logic** | **Advantage/Disadvantage calculation** | **CRITICAL** | Add `advantageSource` and `disadvantageSource` effect kinds. Evaluator must track all sources and determine final roll state (advantage, disadvantage, or normal). |
| **Missing Logic** | **Attack roll calculation** | **CRITICAL** | Add `attackBonus` derived stat: `1d20 + proficiency + ability modifier + magical bonus`. Currently only tags attacks, doesn't calculate them. |
| **Missing Logic** | **Damage roll calculation** | **CRITICAL** | Add `damageBonus` effect kind. Track weapon damage dice, ability modifiers, magical bonuses. |
| **Missing Logic** | **Armor Class calculation** | **CRITICAL** | AC formula exists for Unarmored Defense but not for worn armor. Need `equippedArmor` state and AC lookup table. |
| **Missing Logic** | **Ranged attacks in melee range** (disadvantage) | **HIGH** | Add global combat rule: `{ kind: 'combatRule', rule: 'ranged-in-melee', effect: 'disadvantage' }`. Requires position tracking. |
| **Missing Logic** | **Cover bonuses** (+2 AC for half cover, +5 for 3/4 cover) | **HIGH** | Add `cover` condition with AC bonus effects. Requires position/environment tracking. |
| **Missing Logic** | **Opportunity attacks** | **HIGH** | Add `opportunityAttack` mechanic. Requires movement and positioning tracking. |
| **Missing Logic** | **Two-weapon fighting** (bonus action attack, no ability modifier unless Fighting Style) | **HIGH** | Tag exists (`'two-weapon-fighting'`) but no actual bonus action attack or damage calculation. |

### 2B. Conditions (HIGH - Tagged but Not Executed)

| Category | Missing Rule/Gap | Impact | Suggested Fix |
|:---------|:----------------|:-------|:--------------|
| **Missing Logic** | **Prone condition effects** (disadvantage on attacks, advantage for melee attackers) | **HIGH** | Add `conditionEffect` kind: `{ condition: 'prone', attackRolls: 'disadvantage', incomingMeleeAttacks: 'advantage' }`. |
| **Missing Logic** | **Invisible condition effects** (advantage on attacks, attackers have disadvantage) | **HIGH** | Add `conditionEffect` kind: `{ condition: 'invisible', attackRolls: 'advantage', incomingAttacks: 'disadvantage' }`. |
| **Missing Logic** | **Frightened condition effects** (disadvantage on ability checks and attacks while source visible) | **HIGH** | Add `conditionEffect` kind with visibility check predicate. |
| **Missing Logic** | **Charmed condition effects** (can't attack charmer, charmer has advantage on social checks) | **HIGH** | Add `conditionEffect` kind with target-specific rules. |
| **Missing Logic** | **Poisoned condition effects** (disadvantage on attack rolls and ability checks) | **HIGH** | Add `conditionEffect` kind: `{ condition: 'poisoned', attackRolls: 'disadvantage', abilityChecks: 'disadvantage' }`. |
| **Missing Logic** | **Restrained condition effects** (speed 0, attacks disadvantage, attacks against advantage, DEX saves disadvantage) | **HIGH** | Add comprehensive `conditionEffect` object with multiple mechanical impacts. |
| **Missing Logic** | **Stunned condition effects** (incapacitated, can't move, fail STR/DEX saves, attacks against have advantage) | **HIGH** | Add `conditionEffect` with auto-fail saves mechanic. |
| **Missing Logic** | **Paralyzed condition effects** (incapacitated, auto-fail STR/DEX saves, attacks within 5ft are crits) | **CRITICAL** | Add `conditionEffect` with critical hit mechanic. |
| **Missing Logic** | **Unconscious condition effects** (prone, incapacitated, drop items, fail saves, attacks within 5ft are crits) | **CRITICAL** | Add comprehensive `conditionEffect` covering all unconscious rules. |

### 2C. Size-Based Restrictions (MEDIUM - Partially Tagged)

| Category | Missing Rule/Gap | Impact | Suggested Fix |
|:---------|:----------------|:-------|:--------------|
| **Missing Logic** | **Small creatures can't use Heavy weapons** | **MEDIUM** | Add predicate to Heavy weapon proficiency: `{ type: 'not', predicate: [{ type: 'sizeIs', size: 'Small' }] }`. Currently Halflings could use Heavy weapons. |
| **Missing Logic** | **Grapple size restrictions** (can grapple up to 1 size larger) | **MEDIUM** | Add `grappleRule` effect with size comparison logic. |
| **Missing Logic** | **Mount size restrictions** (mount must be 1+ size larger) | **LOW** | Add `mountingRule` effect. |
| **Missing Logic** | **Halfling Nimbleness movement** | **MEDIUM** | Tag `'halfling-nimbleness'` exists but doesn't actually enable moving through larger creature spaces. Add movement rule effect. |

### 2D. Spellcasting Mechanics (HIGH - Partially Implemented)

| Category | Missing Rule/Gap | Impact | Suggested Fix |
|:---------|:----------------|:-------|:--------------|
| **Missing Logic** | **Spell Attack Bonus calculation** | **HIGH** | Add derived stat: `spellAttackBonus = proficiency + spellcasting ability modifier`. Currently ability is stored but attack bonus is not calculated. |
| **Missing Logic** | **Spell Save DC calculation** | **HIGH** | Add derived stat: `spellSaveDC = 8 + proficiency + spellcasting ability modifier`. Test expects this (line 38 of multiclass test) but not implemented. |
| **Missing Logic** | **Concentration tracking** | **HIGH** | Tag `'concentration'` exists on spells but no concentration slot tracking, no CON save on damage, no automatic drop on incapacitated. |
| **Missing Logic** | **Ritual casting** | **MEDIUM** | Many classes can ritual cast but no `ritualCasting` effect or spell filtering. |
| **Missing Logic** | **Spell slot consumption** | **HIGH** | Spell slots granted but no consumption mechanic. Need `consumeResource` action. |
| **Missing Logic** | **Cantrip scaling** | **MEDIUM** | Cantrips scale at levels 5, 11, 17 but no `cantripDamageScale` effect. |
| **Missing Logic** | **Wizard Spellbook mechanics** | **HIGH** | Tag `'spellbook'` exists, feature granted, but no spell copying, no spell preparation from book, no spell addition on level up. |
| **Missing Logic** | **Prepared Caster daily preparation** | **HIGH** | Tags `'prepared-caster'` but no mechanic to choose prepared spells. Cleric/Druid/Paladin can't actually prepare spells. |
| **Missing Logic** | **Known Caster spell learning** | **HIGH** | Tags `'known-caster'` but no mechanic to choose known spells. Bard/Sorcerer/Ranger can't learn spells. |

### 2E. Resource Management (HIGH - Defined but Not Tracked)

| Category | Missing Rule/Gap | Impact | Suggested Fix |
|:---------|:----------------|:-------|:--------------|
| **Missing Logic** | **Short Rest mechanics** | **HIGH** | Resources marked `'perShortRest'` but no short rest action to restore them. No Hit Dice spending during short rest. |
| **Missing Logic** | **Long Rest mechanics** | **HIGH** | Resources marked `'perLongRest'` but no long rest action. No HP restoration. No spell slot restoration. |
| **Missing Logic** | **Hit Dice pool** | **HIGH** | Characters gain Hit Dice per level but no `hitDice` resource tracking. Can't spend during short rests. |
| **Missing Logic** | **Death Saves** | **CRITICAL** | No death save tracking. No 3 failures = death, 3 successes = stable mechanic. |
| **Missing Logic** | **Temporary Hit Points** | **HIGH** | No `temporaryHP` storage. Lay on Hands and many spells grant temp HP but can't track it. |

### 2F. Proficiency & Expertise (MEDIUM - Tagged but Not Calculated)

| Category | Missing Rule/Gap | Impact | Suggested Fix |
|:---------|:----------------|:-------|:--------------|
| **Missing Logic** | **Expertise doubling** | **HIGH** | Tag `'expertise'` granted by Rogue/Bard but no actual doubling of proficiency bonus in skill calculations. Needs `skillBonus` derived stat calculation. |
| **Missing Logic** | **Jack of All Trades** | **MEDIUM** | Bard feature grants tag but doesn't actually add ½ proficiency to unproficient checks. Needs skill calculation modification. |
| **Missing Logic** | **Skill check calculation** | **HIGH** | No derived stats for skill bonuses. Should be: `d20 + ability modifier + proficiency (if proficient) + other bonuses`. |
| **Missing Logic** | **Passive Perception** | **MEDIUM** | Not calculated. Should be: `10 + Perception skill bonus`. Many monsters reference passive Perception. |
| **Missing Logic** | **Tool proficiency uses** | **LOW** | Granted by many classes/species but no actual tool check mechanics. |
| **Missing Logic** | **Language communication** | **LOW** | Languages granted but no communication/translation mechanics. Low priority for combat engine. |

### 2G. Senses (MEDIUM - Granted but Not Used)

| Category | Missing Rule/Gap | Impact | Suggested Fix |
|:---------|:----------------|:-------|:--------------|
| **Missing Logic** | **Darkvision mechanics** | **MEDIUM** | Darkvision ranges granted (60ft, 120ft) but no light level tracking or dim light perception rules. |
| **Missing Logic** | **Blindsight** | **MEDIUM** | Rogue Blindsense grants 10ft blindsight but no actual invisible creature detection. |
| **Missing Logic** | **Tremorsense** | **LOW** | Not implemented in any current content but will be needed for monsters. |

---

## 3. Dependency Audit (Orphaned Predicates)

### 3A. Missing Equipment System

| Category | Missing Rule/Gap | Impact | Suggested Fix |
|:---------|:----------------|:-------|:--------------|
| **Orphaned Predicate** | **`hasTag('wearing-armor')` predicate** | **CRITICAL** | Multiple effects check for wearing armor (Fighting Style: Defense, Barbarian Unarmored Defense) but NOTHING grants this tag. Need equipment system to set tag when armor is equipped. |
| **Orphaned Predicate** | **Armor proficiency checks** | **HIGH** | Classes grant armor proficiency but no armor items exist. Can't actually wear armor. Need armor database with AC values. |
| **Orphaned Predicate** | **Weapon proficiency checks** | **HIGH** | Classes grant weapon proficiency but no weapon items exist. Can't actually attack with weapons. Need weapon database with damage dice. |
| **Orphaned Predicate** | **Shield proficiency** | **MEDIUM** | Granted by Fighter, Paladin, Ranger but no shield items. Shields add +2 AC when equipped. |
| **Orphaned Predicate** | **Heavy weapon restriction** | **MEDIUM** | Fighting Style: Great Weapon Fighting references heavy weapons but no weapon data defines which weapons are heavy. |

### 3B. Missing Subclass Data

| Category | Missing Rule/Gap | Impact | Suggested Fix |
|:---------|:----------------|:-------|:--------------|
| **Orphaned Predicate** | **Paladin Sacred Oath** | **HIGH** | Level 3 feature grants `'sacred-oath'` tag and prompts subclass choice but ZERO Sacred Oath subclasses exist (Devotion, Ancients, Vengeance, etc.). |
| **Orphaned Predicate** | **Ranger Archetype** | **HIGH** | Level 3 feature prompts subclass choice but no archetypes exist (Hunter, Beast Master, Gloom Stalker, etc.). |
| **Orphaned Predicate** | **Bard College** | **HIGH** | Level 3 feature prompts subclass choice but no colleges exist (Lore, Valor, etc.). |
| **Orphaned Predicate** | **Rogue Archetype** | **HIGH** | Rogue has no subclass feature at all. Missing level 3 subclass choice (Thief, Assassin, Arcane Trickster, etc.). |
| **Orphaned Predicate** | **Other class subclasses** | **MEDIUM** | Fighter (Champion, Battle Master), Wizard (Evocation, Abjuration), Cleric (Life, War), Barbarian (Berserker, Totem Warrior), Monk (Open Hand, Shadow), Sorcerer (Draconic, Wild Magic) - all missing. |

### 3C. Missing Feat System

| Category | Missing Rule/Gap | Impact | Suggested Fix |
|:---------|:----------------|:-------|:--------------|
| **Orphaned Predicate** | **Origin Feats** | **CRITICAL** | 2024 backgrounds and Human Versatile reference Origin Feats but feat data is NOT in rules engine (stored in `/src/data/feats.json`, not `/src/rulesEngine/`). Need to migrate feat data to rules engine as `SourcedEffect[]`. |
| **Orphaned Predicate** | **ASI vs Feat choice** | **HIGH** | Classes grant ASI at levels 4, 8, 12, 16, 19 but no choice mechanism between ASI (+2 to one stat or +1 to two stats) vs taking a feat. |
| **Orphaned Predicate** | **Feat prerequisites** | **MEDIUM** | Many feats have prerequisites (ability scores, proficiencies, spellcasting) but no validation system. |

### 3D. Missing Spell Data in Rules Engine

| Category | Missing Rule/Gap | Impact | Suggested Fix |
|:---------|:----------------|:-------|:--------------|
| **Orphaned Predicate** | **Cantrip spell data** | **HIGH** | Elf lineages grant Prestidigitation, Dancing Lights, Druidcraft cantrips but spell data not in rules engine. References spell name but spell doesn't exist as effect. |
| **Orphaned Predicate** | **Class spell lists** | **HIGH** | Wizard, Cleric, Bard, etc. have spellcasting but no class spell lists defined. Bard Magical Secrets says "from any class" but no class lists exist. |
| **Orphaned Predicate** | **Wizard starting spellbook** | **HIGH** | Wizard gets 6 1st-level spells in spellbook but no spell selection mechanism. Which 6 spells? |
| **Orphaned Predicate** | **Spell level access** | **MEDIUM** | Spell slots granted by level but no validation that characters can only learn/prepare spells they have slots for. |

---

## 4. Stacking Audit (Incorrect or Missing Stacking Rules)

### 4A. Stacking Correctly Implemented ✅

| Category | Rule | Status | Notes |
|:---------|:-----|:-------|:------|
| **Correct** | AC from different sources (Unarmored Defense vs Armor) | ✅ Uses `stacking: 'max'` | Correctly takes highest AC formula, not both. |
| **Correct** | Speed bonuses (Wood Elf +5, Monk bonuses) | ✅ Uses `stacking: 'stack'` | Correctly stacks speed bonuses additively. |
| **Correct** | HP bonuses (Dwarven Toughness, Hill Dwarf) | ✅ Uses `stacking: 'stack'` | Correctly stacks to +2 HP per level. |
| **Correct** | Proficiency bonus (total level based) | ✅ Single source | Only one proficiency bonus, correctly calculated from total level. |

### 4B. Potentially Incorrect Stacking

| Category | Missing Rule/Gap | Impact | Suggested Fix |
|:---------|:----------------|:-------|:--------------|
| **Stacking Bug** | **Damage resistance stacking** | **MEDIUM** | Multiple species/classes grant poison resistance (Dwarf, Stout Halfling, Green Dragonborn). Should NOT stack to "double resistance" - resistance is binary. Need `stacking: 'max'` or unique deduplication. |
| **Stacking Bug** | **Condition immunity stacking** | **LOW** | Multiple sources might grant same immunity. Should deduplicate. Currently uses no explicit stacking rule. |
| **Stacking Bug** | **Darkvision range stacking** | **MEDIUM** | Base Elf (60ft) + Drow (additional 60ft) uses `stacking: 'max'` which is correct for taking highest value BUT the Drow effect adds +60 as additive. Should just set to 120ft absolute, not stack. |
| **Missing Rule** | **Magical item bonuses** | **HIGH** | When magical items are added, need to track NAMED bonuses. Two "Rings of Protection" should NOT stack (+1 AC each = +1 total, not +2). Need `namedBonus` property with deduplication. |
| **Missing Rule** | **Ability score cap** | **MEDIUM** | Multiple ASI sources stack but no enforcement of 20 cap (30 with magical items). Can currently boost to unlimited. Need cap validation in evaluator. |

### 4C. Missing Stacking Rules

| Category | Missing Rule/Gap | Impact | Suggested Fix |
|:---------|:----------------|:-------|:--------------|
| **Missing Rule** | **Advantage/Disadvantage cancellation** | **CRITICAL** | Any number of advantage sources + any number of disadvantage sources = normal roll (they cancel). Need special stacking: 'cancel' logic. |
| **Missing Rule** | **Concentration limit** | **HIGH** | Can only concentrate on one spell at a time. Need `maxConcurrent: 1` on concentration resource. |
| **Missing Rule** | **Reaction limit** | **HIGH** | Only one reaction per round. Uncanny Dodge, Opportunity Attack, Shield spell, etc. all use reaction. Need reaction resource tracking. |
| **Missing Rule** | **Bonus action limit** | **HIGH** | Only one bonus action per turn. Many features grant bonus action options but no enforcement. |

---

## 5. Critical Missing Core Mechanics

### 5A. Combat System (Entire Subsystem Missing)

| Category | Missing Rule/Gap | Impact | Suggested Fix |
|:---------|:----------------|:-------|:--------------|
| **Missing System** | **Initiative** | **CRITICAL** | No initiative roll mechanic. Should be `1d20 + DEX modifier + bonuses`. |
| **Missing System** | **Attack Resolution** | **CRITICAL** | No attack roll (1d20 + attack bonus) vs AC comparison. |
| **Missing System** | **Damage Resolution** | **CRITICAL** | No damage roll, resistance/vulnerability/immunity application. |
| **Missing System** | **Saving Throw Resolution** | **CRITICAL** | No save roll (1d20 + save bonus) vs DC comparison. |
| **Missing System** | **Critical Hits** | **HIGH** | No critical hit on natural 20 (or Champion Fighter's 19-20). |
| **Missing System** | **Fumbles** | **LOW** | Natural 1 auto-fails but no implementation. |

### 5B. Character State Tracking

| Category | Missing Rule/Gap | Impact | Suggested Fix |
|:---------|:----------------|:-------|:--------------|
| **Missing System** | **Current HP tracking** | **CRITICAL** | Max HP calculated but no current HP. Can't take damage or heal. |
| **Missing System** | **Temporary HP** | **HIGH** | No temp HP storage. Many features grant temp HP. |
| **Missing System** | **Condition tracking** | **HIGH** | Conditions referenced but no active condition list on character. |
| **Missing System** | **Resource consumption** | **HIGH** | Resources defined but no consumption/expenditure tracking. |
| **Missing System** | **Spell slot tracking** | **HIGH** | Spell slots granted but no current vs max tracking. |

### 5C. Progression System

| Category | Missing Rule/Gap | Impact | Suggested Fix |
|:---------|:----------------|:-------|:--------------|
| **Missing System** | **Level up** | **HIGH** | No level advancement mechanic. How do characters go from level 1 to 2? |
| **Missing System** | **XP tracking** | **MEDIUM** | No experience points system (if using XP instead of milestone). |
| **Missing System** | **Multiclass prerequisites** | **MEDIUM** | Multiclassing requires minimum ability scores (13 in relevant abilities) but no validation. |

---

## 6. Data Completeness Gaps

### 6A. Species Coverage

| Category | Missing Rule/Gap | Impact | Suggested Fix |
|:---------|:----------------|:-------|:--------------|
| **Missing Species** | **Tiefling** | **MEDIUM** | Core PHB species not implemented. |
| **Missing Species** | **Half-Elf** | **MEDIUM** | Core PHB species not implemented. |
| **Missing Species** | **Half-Orc** | **MEDIUM** | Core PHB species not implemented. |
| **Missing Species** | **Orc (2024)** | **MEDIUM** | 2024 PHB species not implemented. |
| **Missing Species** | **Aasimar** | **LOW** | Common species not implemented. |
| **Missing Species** | **Goliath** | **LOW** | Common species not implemented. |

### 6B. Class Coverage

| Category | Missing Rule/Gap | Impact | Suggested Fix |
|:---------|:----------------|:-------|:--------------|
| **Missing Class** | **Druid** | **HIGH** | Core PHB class not implemented. |
| **Missing Class** | **Warlock** | **HIGH** | Core PHB class not implemented. Unique spell slot mechanics (pact magic). |
| **Missing Class** | **Artificer** | **MEDIUM** | Popular class from Tasha's not implemented. |

---

## 7. Test Coverage Gaps

| Category | Missing Test | Impact | Suggested Fix |
|:---------|:------------|:-------|:--------------|
| **Missing Test** | **2014 vs 2024 Ranger integration** | **HIGH** | Multiclass tests don't verify edition-specific features don't conflict. |
| **Missing Test** | **Ability score cap enforcement** | **MEDIUM** | No test for 20 cap or exceeding with multiple ASI sources. |
| **Missing Test** | **Expertise calculation** | **HIGH** | Rogue/Bard expertise granted but no test verifying double proficiency in derived stats. |
| **Missing Test** | **Spell Save DC calculation** | **HIGH** | Multiclass test expects `spellSaveDC` but no test verifies the calculation formula. |
| **Missing Test** | **Resource consumption** | **HIGH** | No test for spending Rage uses, Bardic Inspiration, spell slots, etc. |

---

## 8. Schema/Type System Gaps

| Category | Missing Rule/Gap | Impact | Suggested Fix |
|:---------|:----------------|:-------|:--------------|
| **Missing Type** | **`combatRule` effect kind** | **HIGH** | Need for global combat rules (ranged in melee, cover, opportunity attacks). |
| **Missing Type** | **`conditionEffect` effect kind** | **HIGH** | Map conditions to their mechanical effects. |
| **Missing Type** | **`advantageSource` effect kind** | **HIGH** | Track sources of advantage for proper cancellation logic. |
| **Missing Type** | **`disadvantageSource` effect kind** | **HIGH** | Track sources of disadvantage for proper cancellation logic. |
| **Missing Type** | **`namedBonus` property** | **MEDIUM** | For magical item stacking rules. |
| **Missing Type** | **`resourceConsumption` action** | **HIGH** | Currently no way to spend resources. |
| **Missing Type** | **`currentValue` in resources** | **CRITICAL** | Resources have max but no current tracking. |

---

## Priority Recommendations

### CRITICAL (Do First) - Blockers for Gameplay
1. ✅ Multiclass support (DONE in Phase 10)
2. ❌ **Combat resolution** (attack rolls, damage, saves)
3. ❌ **Current HP tracking** (can't play without tracking damage)
4. ❌ **Resource consumption** (can't use class features without spending resources)
5. ❌ **Condition effects** (conditions exist but do nothing)
6. ❌ **Equipment system** (armor/weapon proficiencies are useless without items)

### HIGH (Do Next) - Core Gameplay Features
1. ❌ **Advantage/Disadvantage system**
2. ❌ **Spell Save DC and Spell Attack calculation**
3. ❌ **Skill check calculation with Expertise**
4. ❌ **Short/Long Rest mechanics**
5. ❌ **Subclass data** (Paladin, Ranger, Bard, Rogue all missing subclasses)
6. ❌ **Origin Feats migration** (2024 requires this data in rules engine)

### MEDIUM (Do Later) - Enhanced Features
1. ❌ **Remaining species** (Tiefling, Half-Elf, Half-Orc, Aasimar, Goliath)
2. ❌ **Remaining classes** (Druid, Warlock, Artificer)
3. ❌ **Ability score cap enforcement**
4. ❌ **Magical item stacking rules**
5. ❌ **Size-based restrictions** (Heavy weapons for Small creatures)

### LOW (Nice to Have) - Edge Cases
1. ❌ **Tool proficiency mechanics**
2. ❌ **Language communication**
3. ❌ **Darkvision light tracking**
4. ❌ **Mount/Grapple size restrictions**

---

## Conclusion

**The Good**:
- ✅ Excellent data structure with `SourcedEffect` pattern
- ✅ Solid multiclass support with proper predicates
- ✅ Comprehensive species/class content for what's implemented
- ✅ Clean separation between 2014 and 2024 editions
- ✅ Type-safe implementation with no `any` types

**The Bad**:
- ❌ **Many tags are "dead" - defined but have no executable effects**
- ❌ **Combat system completely missing** (can't attack, defend, or deal damage)
- ❌ **Condition system is decorative** (conditions exist but don't affect gameplay)
- ❌ **Resource management is theoretical** (can't spend resources)
- ❌ **Equipment system missing** (armor/weapon proficiencies are orphaned)

**The Critical Path Forward**:
1. Implement combat resolution (attacks, damage, saves)
2. Add HP tracking (current, max, temporary)
3. Implement resource consumption
4. Add condition mechanical effects
5. Build equipment system with armor/weapon data
6. Complete subclass implementations

**Risk Assessment**: ⚠️ **HIGH RISK** for production use. The engine can *represent* character data beautifully but cannot *execute* gameplay. Need 3-4 more phases focused on executable game mechanics before this is playable.

---

**Total Issues Found**: 72
**Estimated Work**: 6-8 additional implementation phases
**Recommendation**: Prioritize combat and resource systems over additional content expansion.

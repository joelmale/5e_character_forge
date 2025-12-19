# Gap Analysis Report: Rules Engine Implementation

## 1. Edition Conflicts (2014 vs 2024)

| Category | Missing Rule/Gap | Impact | Suggested Fix |
|----------|------------------|--------|---------------|
| Edition Conflict | Exhaustion levels incomplete | Critical | Only levels 1-2 implemented, but 2014 has 6 levels and 2024 has 10 levels. Missing effects for higher levels (speed halved again, disadvantage on attacks, etc.) | Add exhaustion levels 3-10 with appropriate effects, edition predicates |
| Edition Conflict | Multiclassing ASI rules missing | High | 2024 changed multiclassing ASI requirements (no longer need 13 in prerequisite ability), but no multiclassing rules implemented at all | Implement multiclassing effects with edition-specific predicates |
| Edition Conflict | Healer feat edition mismatch | Medium | Healer feat marked as 2024 but description matches 2014; in 2024 PHB, Healer was removed | Verify feat availability by edition, add edition predicate to feat effects |
| Edition Conflict | Spellcasting changes | High | 2024 has different cantrip/spell lists, pact magic changes, but no edition handling for spells | Add edition predicates to spell effects and cantrip grants |
| Edition Conflict | Fighting Style changes | Medium | Some fighting styles changed in 2024 (e.g., Two-Weapon Fighting), but implemented as 'both' | Split fighting style effects by edition |

## 2. Implied Rules (Invisible Mechanics)

| Category | Missing Rule/Gap | Impact | Suggested Fix |
|----------|------------------|--------|---------------|
| Missing Logic | Condition mechanical effects | Critical | Conditions like Prone, Blinded add tags but no actual mechanical penalties (disadvantage on attacks, auto-fail checks) | Add global combat rule effects that check condition tags |
| Missing Logic | Size-based restrictions | High | Small size tag exists but no restriction on Heavy Weapons or Large weapons | Add equipment restriction effects for size categories |
| Missing Logic | Proficiency bonuses not applied | Critical | GrantProficiency effects exist but no logic to apply +prof bonus to checks | Add global rule to apply proficiency bonus when hasProficiency predicate is true |
| Missing Logic | Ability score modifiers | Critical | Ability scores increased but modifiers (+2 for 16, etc.) not calculated | Add derived calculation for ability modifiers from base scores |
| Missing Logic | Saving throw mechanics | High | SaveAdvantage effects exist but no disadvantage from conditions or global rules | Add global saving throw bonus effects for conditions |
| Missing Logic | Attack roll modifiers | High | No global effects for attack rolls (advantage/disadvantage from conditions) | Add global attack roll effects checking condition tags |
| Missing Logic | Skill check modifiers | High | Skill bonuses exist but no global disadvantage from exhaustion/conditions | Add global skill check effects for conditions |
| Missing Logic | Armor restrictions | Medium | Strength requirements for heavy armor not enforced | Add equipment restriction effects based on ability scores |
| Missing Logic | Weapon properties | Medium | Finesse, Versatile, etc. properties not implemented as effects | Add weapon property effects (e.g., finesse allows DEX for attacks) |

## 3. Dependency Audit (Orphaned Predicates)

| Category | Missing Rule/Gap | Impact | Suggested Fix |
|----------|------------------|--------|---------------|
| Orphaned Predicate | hasProficiency('Heavy Armor') | Medium | Predicate exists but no class/background grants specific armor types beyond broad categories | Ensure all proficiency predicates have corresponding grant sources |
| Orphaned Predicate | hasFeat('various') | High | Many feat predicates in types but feats not implemented as effects | Implement all feat effects from feats.json data |
| Orphaned Predicate | hasFeature('various') | High | Feature predicates exist but features not defined as effects | Define all class features as sourced effects |
| Orphaned Predicate | equipped('item tags') | Medium | Equipment predicates exist but no equipment effects implemented | Implement equipment effects from equipment.json |
| Orphaned Predicate | hasCondition('various') | Low | Conditions implemented but may not be applied via effects | Ensure conditions can be applied via temporary effects |
| Orphaned Predicate | classLevelAtLeast | High | Multiclassing not implemented, so class levels beyond primary don't exist | Implement multiclassing level tracking |

## 4. Stacking Audit

| Category | Missing Rule/Gap | Impact | Suggested Fix |
|----------|------------------|--------|---------------|
| Stacking Logic | Magic item uniqueness | Critical | No prevention of stacking identical magic items (e.g., two Rings of Protection) | Add uniqueness checks in equipment effects |
| Stacking Logic | Bonus type interactions | High | Stacking rules exist but not all bonus types defined (e.g., enhancement vs. deflection) | Define comprehensive bonus types and stacking rules |
| Stacking Logic | Conditional stacking | Medium | Effects stack regardless of conditions (e.g., multiple sources of same bonus) | Implement conditional stacking based on source types |
| Stacking Logic | Ability score caps | Critical | No enforcement of ability score maximums (20 normally, 22 with ASI) | Add validation effects for ability score limits |
| Stacking Logic | Proficiency stacking | Medium | Double proficiency not prevented (e.g., two sources granting same proficiency) | Add uniqueness for proficiency grants |

## Summary

The current implementation covers basic static effects (proficiencies, ability increases) but critically lacks:

1. **Global Rules Engine**: No system for applying universal mechanics (attack rolls, saving throws, ability checks)
2. **Condition Integration**: Conditions exist as tags but don't trigger mechanical effects
3. **Edition Handling**: Minimal edition-specific logic, incomplete for 2024 changes
4. **Complete Feature Set**: Many feats, equipment, and advanced class features not implemented
5. **Validation Logic**: No enforcement of game rules (ability caps, equipment restrictions)

Priority fixes: Implement global combat/skill check effects, complete condition mechanics, add edition predicates, and build out missing feat/equipment effects.</content>
<parameter name="filePath">Rule_Findings_Grok.md
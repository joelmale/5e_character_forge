| Category | Missing Rule/Gap | Impact | Suggested Fix (Data Structure) |
| :--- | :--- | :--- | :--- |
| Edition Conflict | Exhaustion: 2014 has 6 levels; 2024 uses 10-level, -1 to d20/ability checks per level | Critical — wrong survivability math and condition handling across editions | Add `condition.exhaustion` effect with edition-specific track length and per-level modifiers; predicate on `edition` |
| Edition Conflict | Inspiration/Boon: 2024 grants/uses differently (e.g., humans start with it; name “Boon” in PHB2024) | High — advantage currency flow incorrect | Add `resource: inspiration` with edition-tagged grants (species/human, backgrounds) and usage; predicate `edition` |
| Edition Conflict | Weapon Mastery (2024 only) vs no mastery (2014) | High — attacks may miss mastery riders or incorrectly show them in 2014 | Add `attack.mastery` tag/effects gated by `edition:2024` and class/weapon predicates |
| Edition Conflict | Prepared caster math: 2014 prepared = ability mod + level; 2024 may alter per class (e.g., Cleric/Druid updates) | High — wrong prepared count | Add `spellPrepFormula` in class effects with `edition` predicate |
| Edition Conflict | Long Rest rules: 2014 fully restores HP/half HD; 2024 long rest mechanics differ (e.g., all HD back, exhaustion recovery?) | Medium — rest recovery off | Add `rest.recovery` effect objects per edition for HP, HD, exhaustion |
| Edition Conflict | Common Conditions: Grappled/Prone/Invisible wording and effects tweaked in 2024 | Medium — advantage/disadvantage flags may diverge | Version conditions with `edition` and map to advantage/disadvantage/speed modifiers accordingly |
| Edition Conflict | Light/Heavy Armor Strength/Stealth rules (unchanged? but 2024 may adjust) not tagged per edition | Low — AC/stealth incorrect if rules change | Store armor properties with edition tags and apply via predicates |

| Category | Missing Rule/Gap | Impact | Suggested Fix (Data Structure) |
| :--- | :--- | :--- | :--- |
| Missing Logic | Tags without effects: Small size does not impose Disadvantage on Heavy weapons | High — attack rolls wrong for small races | Add `attack.disadvantage` effect predicate: size=Small & weapon tag=Heavy |
| Missing Logic | Conditions lack mechanical effects (Prone, Restrained, Grappled, Invisible, Exhaustion levels, etc.) | High — advantage/disadvantage/speed not applied | Add condition-to-effect map: movement modifiers, attack advantage/disadvantage flags, ability check penalties |
| Missing Logic | Advantage stacking cap (multiple sources still just advantage) | Medium — double-advantage incorrectly applied | Normalize roll context: store `advantageState` per check/save/attack; cap at adv/disadv with override precedence |
| Missing Logic | Attunement limits and item slot stacking (rings, cloaks) | Medium — AC/saves can stack illegally | Add `equipSlot` and `stackingRule` to items; enforce `maxEquippedPerSlot` with conflicts |
| Missing Logic | Shield + weapon two-handed conflict; Versatile handling | Medium — equips illegal combos | Add equip predicates: `weapon.twoHanded` blocks shield; `versatile` rules for off-hand |
| Missing Logic | Spell concentration tracking and restriction | Medium — multiple concentration spells could coexist | Add `concentration` tag to spells; enforce single-active concentration effect per caster |
| Missing Logic | Senses (Darkvision, Blindsight, Tremorsense) unused beyond display | Low — perception/visibility logic wrong | Add `senses` effects with ranges; propagate to visibility/advantage/disadvantage checks |
| Missing Logic | Speed modifiers (difficult terrain, encumbrance, armor speed penalties) | Low — movement incorrect | Add `speed.modifier` effects with predicates (armor category, encumbrance thresholds) |

| Category | Missing Rule/Gap | Impact | Suggested Fix (Data Structure) |
| :--- | :--- | :--- | :--- |
| Dependency | Predicates use `classSlug`/`speciesSlug`, but existing data uses names in places (e.g., “Bard” vs `bard`) | Medium — effects never fire | Normalize identifiers and add validation to flag unknown slugs; enforce slug usage in predicates |
| Dependency | Advantage effects need condition data; condition states not stored | High — condition-based predicates always false | Add `conditions` array to base state; include source and duration; validate predicates against it |
| Dependency | Equipment tag predicates (e.g., `weapon:Heavy`, `armor:Light`) require items to carry tags; current JSON lacks them (e.g., staff missing weapon tags) | High — equip/attack rules skip | Extend equipment normalization to add tags/categories and validate presence during load |
| Dependency | Spell-school/class-list predicates need spell metadata; current spell records may be incomplete | Medium — class/feat spell grants fail | Ensure spell data includes school, level, lists, tags; add loader validation |

| Category | Missing Rule/Gap | Impact | Suggested Fix (Data Structure) |
| :--- | :--- | :--- | :--- |
| Stacking | Multiple identical magic items (e.g., Ring of Protection) stack AC/saves | High — inflated defenses | Add `stackingRule: 'highest' | 'none' | 'stack'` to item effects; dedupe by effectId/source type |
| Stacking | Dual Unarmored Defense (e.g., Barbarian/Monk) stacking | Medium — AC too high | Mark AC formulas with exclusivity (`category: 'unarmored-defense'`, stackingRule: 'exclusive-highest') |
| Stacking | Advantage sources stacking beyond adv/disadv cap | Medium — inflated roll odds | Normalize roll context to a single advantage state with priority; log merged sources instead of stacking |
| Stacking | Multiple shields or shield + specific two-handed weapons | Medium — illegal configurations allowed | Add equip-slot limits (`slot: shield`, max 1) and conflict predicates on weapons (two-handed blocks shield slot) |

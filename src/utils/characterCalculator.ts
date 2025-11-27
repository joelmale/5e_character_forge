import { Character, CharacterCreationData, AbilityName, SkillName, EquippedItem } from '../types/dnd';
import { calculateKnownLanguages } from '../utils/languageUtils';
import { initializeSpellcasting } from '../utils/spellcastingInit';
import { generateUUID } from '../services/diceService';
import {
  getAllRaces,
  loadClasses,
  loadEquipment,
  PROFICIENCY_BONUSES,
  getModifier,
  SKILL_TO_ABILITY,
  ALL_SKILLS,
  BACKGROUNDS,
  EQUIPMENT_PACKAGES,
  getFeaturesByClass,
  getFeaturesBySubclass,
  getHitDieForClass,
} from '../services/dataService';
import { BASE_ARMOR_CLASS, SHIELD_AC_BONUS, MAX_DEX_BONUS_MEDIUM_ARMOR } from '../constants/combat';

export const calculateCharacterStats = (data: CharacterCreationData): Character => {
  const raceData = getAllRaces().find(r => r.slug === data.raceSlug);
  const classData = loadClasses().find(c => c.slug === data.classSlug);

  if (!raceData || !classData) {
    throw new Error("Incomplete creation data.");
  }

  const finalAbilities: Character['abilities'] = {} as Character['abilities'];

  // 1. Calculate Abilities with Racial Bonuses
  (Object.keys(data.abilities) as AbilityName[]).forEach((ability) => {
    const rawScore = data.abilities[ability] + (raceData.ability_bonuses[ability] || 0);
    const modifier = getModifier(rawScore);
    finalAbilities[ability] = { score: rawScore, modifier };
  });

  const level = data.level;
  const pb = PROFICIENCY_BONUSES[level - 1] || 2;

  // 2. Calculate Hit Points (Based on chosen method)
  let hitDieValue: number;
  if (data.hpCalculationMethod === 'rolled' && data.rolledHP) {
    hitDieValue = data.rolledHP;
  } else {
    // Default to max for level 1
    hitDieValue = classData.hit_die;
  }
  const maxHitPoints = hitDieValue + finalAbilities.CON.modifier + (raceData.slug === 'dwarf' ? level : 0);

  // 3. Calculate Skills (from selected skills + background skills)
  const backgroundData = BACKGROUNDS.find(bg => bg.name === data.background);
  const backgroundSkills = backgroundData?.skill_proficiencies || [];
  const allProficientSkills = [...data.selectedSkills, ...backgroundSkills.map(s => s as SkillName)];

  const finalSkills: Character['skills'] = {} as Character['skills'];
  ALL_SKILLS.forEach((skillName) => {
    const ability = SKILL_TO_ABILITY[skillName];
    const modifier = finalAbilities[ability].modifier;
    const isProficient = allProficientSkills.includes(skillName);

    finalSkills[skillName] = {
      proficient: isProficient,
      value: modifier + (isProficient ? pb : 0),
    };
  });

  // 4. Calculate Spellcasting Stats (if applicable)
  let spellcastingData: Character['spellcasting'] = undefined;
  if (classData.spellcasting) {
    spellcastingData = initializeSpellcasting(
      data.classSlug,
      level,
      {
        STR: finalAbilities.STR.score,
        DEX: finalAbilities.DEX.score,
        CON: finalAbilities.CON.score,
        INT: finalAbilities.INT.score,
        WIS: finalAbilities.WIS.score,
        CHA: finalAbilities.CHA.score,
      }
    );
  }

  // 5. Build Equipment Inventory
  const inventory: EquippedItem[] = [];
  let equippedArmor: string | undefined;
  const equippedWeapons: string[] = [];

  // Get equipment package for the character's level
  const equipmentPackage = EQUIPMENT_PACKAGES.find(pkg => pkg.level === level) || EQUIPMENT_PACKAGES[0];

  // Add items from equipment package
  equipmentPackage.items.forEach(item => {
    const itemSlug = item.slug || item.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    inventory.push({
      equipmentSlug: itemSlug,
      quantity: item.quantity,
      equipped: item.equipped || false,
    });

    // Track equipped items
    const equipment = loadEquipment().find(eq => eq.slug === itemSlug);
    if (item.equipped && equipment) {
      if (equipment.armor_category) {
        equippedArmor = itemSlug;
      } else if (equipment.weapon_category) {
        equippedWeapons.push(itemSlug);
      }
    }
  });

  // Add items from class equipment choices
  data.equipmentChoices.forEach(choice => {
    if (choice.selected !== null) {
      const selectedBundle = choice.options[choice.selected];
      selectedBundle.forEach(item => {
        // Try to find matching equipment in database
        const equipmentSlug = item.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const foundEquipment = loadEquipment().find(eq =>
          eq.slug === equipmentSlug || eq.name.toLowerCase() === item.name.toLowerCase()
        );

        if (foundEquipment) {
          inventory.push({
            equipmentSlug: foundEquipment.slug,
            quantity: item.quantity,
            equipped: false, // Will be equipped manually by player
          });
        }
      });
    }
  });

  // Add custom starting inventory from equipment browser (Sprint 4)
  if (data.startingInventory) {
    data.startingInventory.forEach(item => {
      // Check if item already exists in inventory
      const existingItem = inventory.find(inv => inv.equipmentSlug === item.equipmentSlug);
      if (existingItem) {
        existingItem.quantity += item.quantity;
      } else {
        inventory.push({
          equipmentSlug: item.equipmentSlug,
          quantity: item.quantity,
          equipped: item.equipped || false,
        });
      }
    });
  }

  // 6. Calculate AC based on equipped armor
  let armorClass = BASE_ARMOR_CLASS + finalAbilities.DEX.modifier; // Default unarmored
  if (equippedArmor) {
    const armor = loadEquipment().find(eq => eq.slug === equippedArmor);
    if (armor?.armor_class) {
      if (armor.armor_category === 'Light') {
        // Light armor: base + full DEX
        armorClass = armor.armor_class.base + finalAbilities.DEX.modifier;
      } else if (armor.armor_category === 'Medium') {
        // Medium armor: base + DEX (max +2)
        const dexBonus = Math.min(finalAbilities.DEX.modifier, armor.armor_class.max_bonus || MAX_DEX_BONUS_MEDIUM_ARMOR);
        armorClass = armor.armor_class.base + dexBonus;
      } else if (armor.armor_category === 'Heavy') {
        // Heavy armor: base only
        armorClass = armor.armor_class.base;
      } else if (armor.armor_category === 'Shield') {
        // Shield adds bonus to current AC
        armorClass += SHIELD_AC_BONUS;
      }
    }
  }

  // 7. Load Class Features from SRD (Sprint 5)
  const classFeatures = getFeaturesByClass(data.classSlug, level);

  // 8. Load Subclass Features from SRD (Sprint 5)
  let subclassFeatures: typeof classFeatures = [];
  if (data.subclassSlug) {
    subclassFeatures = getFeaturesBySubclass(data.classSlug, data.subclassSlug, level);
  }

  // 9. Build complete class features list (Sprint 5)
  // Include Fighting Style if selected
  const allClassFeatures = [...classData.class_features];
  if (data.selectedFightingStyle) {
    allClassFeatures.push(`Fighting Style: ${data.selectedFightingStyle}`);
  }

  // 10. Calculate Known Languages
  const knownLanguages = calculateKnownLanguages(data);

  // 11. Construct Final Character Object
  return {
    id: generateUUID(), // Generate UUID for IndexedDB
    name: data.name || "Unnamed Hero",
    race: raceData.name,
    class: classData.name,
    subclass: data.subclassSlug, // Sprint 5: Store subclass slug
    level,
    alignment: data.alignment,
    background: data.background,
    languages: knownLanguages,
    inspiration: false,
    proficiencyBonus: pb,
    armorClass,
    hitPoints: maxHitPoints,
    maxHitPoints,
      hitDice: {
        current: data.level,
        max: data.level,
        dieType: getHitDieForClass(data.classSlug),
      },
    speed: 30,
    initiative: finalAbilities.DEX.modifier,
    abilities: finalAbilities,
    skills: finalSkills,
    featuresAndTraits: {
      personality: data.personality,
      ideals: data.ideals,
      bonds: data.bonds,
      flaws: data.flaws,
      classFeatures: allClassFeatures, // Includes fighting style if applicable
      racialTraits: raceData.racial_traits,
    },
    spellcasting: spellcastingData, // Sprint 2: Include spell data
    // Sprint 4: Equipment and inventory
    inventory,
    currency: {
      cp: 0,
      sp: 0,
      gp: equipmentPackage.startingGold || 0,
      pp: 0,
    },
    equippedArmor,
    equippedWeapons,
    selectedFightingStyle: data.selectedFightingStyle, // Sprint 5: Store fighting style
    // Sprint 5: Store SRD features and selected feats
    srdFeatures: {
      classFeatures: classFeatures.map(f => ({ name: f.name, slug: f.slug, level: f.level, source: 'class' as const })),
      subclassFeatures: subclassFeatures.map(f => ({ name: f.name, slug: f.slug, level: f.level, source: 'subclass' as const })),
    },
    selectedFeats: data.selectedFeats || [],
  };
};
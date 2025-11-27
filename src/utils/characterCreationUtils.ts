import { CharacterCreationData, Character, AbilityName, SkillName } from '../types/dnd';
import { getAllRaces, loadClasses, BACKGROUNDS, PROFICIENCY_BONUSES, getModifier, SKILL_TO_ABILITY, ALL_SKILLS, getHitDieForClass } from '../services/dataService';
import { migrateSpellSelectionToCharacter } from '../utils/spellUtils';
import { addItemToInventoryByName } from '../utils/equipmentMatching';
import { BASE_ARMOR_CLASS } from '../constants/combat';

/**
 * Calculate final character stats from character creation data
 */
export const calculateCharacterStats = (data: CharacterCreationData): Character => {
  console.log('🔧 [CharacterCreation] Starting stat calculation');
  console.log('📊 [CharacterCreation] Input data:', {
    raceSlug: data.raceSlug,
    classSlug: data.classSlug,
    level: data.level,
    background: data.background,
    abilities: data.abilities,
    selectedSkills: data.selectedSkills
  });

  const raceData = getAllRaces().find(r => r.slug === data.raceSlug);
  const classData = loadClasses().find(c => c.slug === data.classSlug);

  console.log('🔍 [CharacterCreation] Data lookup results:', {
    raceData: raceData ? { name: raceData.name, slug: raceData.slug } : null,
    classData: classData ? { name: classData.name, slug: classData.slug } : null
  });

  if (!raceData || !classData) {
    console.error('❌ [CharacterCreation] Missing race or class data - throwing error');
    throw new Error("Incomplete creation data.");
  }

  console.log('✅ [CharacterCreation] Data validation passed, proceeding with character creation');

  const finalAbilities: Character['abilities'] = {} as Character['abilities'];

  // 1. Calculate Abilities with Racial Bonuses and ASI increases
  (Object.keys(data.abilities) as AbilityName[]).forEach((ability) => {
    let rawScore = data.abilities[ability] + (raceData.ability_bonuses[ability] || 0);

    // Apply cumulative ASI increases for high-level characters
    if (data.cumulativeASI) {
      data.cumulativeASI.forEach(asiChoice => {
        if (asiChoice.type === 'asi' && asiChoice.asiAllocations) {
          rawScore += asiChoice.asiAllocations[ability] || 0;
        }
      });
    }

    const modifier = getModifier(rawScore);
    finalAbilities[ability] = { score: rawScore, modifier };
  });

  const level = data.level;
  const pb = PROFICIENCY_BONUSES[level - 1] || 2;

  // 2. Calculate Hit Points (Based on chosen method)
  let maxHitPoints: number;

  if (level === 1) {
    // Level 1: Full hit die + CON modifier
    let hitDieValue: number;
    if (data.hpCalculationMethod === 'rolled' && data.rolledHP) {
      hitDieValue = data.rolledHP;
    } else {
      // Default to max for level 1
      hitDieValue = classData.hit_die;
    }
    maxHitPoints = hitDieValue + finalAbilities.CON.modifier;
  } else if (data.highLevelSetup) {
    // Use high-level setup HP if available
    maxHitPoints = data.highLevelSetup.totalHP;
  } else {
    // Fallback: Multi-level calculation using average HP
    const conModifier = finalAbilities.CON.modifier;
    const hitDie = classData.hit_die;

    // Level 1: Full hit die + CON
    let totalHP = hitDie + conModifier;

    // Levels 2+: Average HP per level + CON
    const avgHPPerLevel = Math.floor(hitDie / 2) + 1 + conModifier;
    totalHP += avgHPPerLevel * (level - 1);

    maxHitPoints = totalHP;
  }

  // Add racial bonuses (like Dwarf toughness)
  maxHitPoints += (raceData.slug === 'dwarf' ? level : 0);

  // 3. Calculate Skills (from selected skills + background skills + expertise)
  const backgroundData = BACKGROUNDS.find(bg => bg.name === data.background);
  const backgroundSkills = backgroundData?.skill_proficiencies || [];
  const allProficientSkills = [...data.selectedSkills, ...backgroundSkills.map(s => s as SkillName)];

  const finalSkills: Character['skills'] = {} as Character['skills'];
  ALL_SKILLS.forEach((skillName) => {
    const ability = SKILL_TO_ABILITY[skillName];
    const modifier = finalAbilities[ability].modifier;
    const isProficient = allProficientSkills.includes(skillName);
    const hasExpertise = data.expertiseSkills?.includes(skillName) || false;

    // Expertise applies 2x proficiency bonus
    let skillBonus = 0;
    if (isProficient) {
      skillBonus = hasExpertise ? (pb * 2) : pb;
    }

    finalSkills[skillName] = {
      proficient: isProficient,
      value: modifier + skillBonus,
    };
  });

  // 3.5. Calculate Inventory from Equipment Choices
  const inventory: Character['inventory'] = [];

  // Add items from class equipment choices
  if (data.equipmentChoices) {
    data.equipmentChoices.forEach(choice => {
      if (choice.selected !== null && choice.selected !== undefined) {
        const selectedBundle = choice.options[choice.selected];
        selectedBundle.forEach(item => {
          // Use the equipment matching utility to find and add items
          const results = addItemToInventoryByName(item.name, item.quantity);

          // Process each result (can be multiple if pack expanded)
          results.forEach(result => {
            // Check if item already exists in inventory
            const existingItem = inventory.find(inv => inv.equipmentSlug === result.equipmentSlug);
            if (existingItem) {
              existingItem.quantity += result.quantity;
            } else {
              inventory.push({
                equipmentSlug: result.equipmentSlug,
                quantity: result.quantity,
                equipped: false, // Will be equipped manually by player
              });
            }
          });
        });
      }
    });
  }

  // Add custom starting inventory from equipment browser
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

  // 4. Calculate Spellcasting Stats (if applicable)
  let spellcastingData: Character['spellcasting'] = undefined;
  if (classData.spellcasting) {
    spellcastingData = migrateSpellSelectionToCharacter(
      data.spellSelection,
      classData,
      Object.fromEntries(
        Object.entries(finalAbilities).map(([key, value]) => [key, value.score])
      ) as Record<string, number>,
      level
    );
  }

  // 5. Calculate Armor Class (simple calculation)
  const armorClass = BASE_ARMOR_CLASS + finalAbilities.DEX.modifier;

  // 6. Calculate Initiative
  const initiative = finalAbilities.DEX.modifier;

  // 7. Load Features and Traits
  const featuresAndTraits: Character['featuresAndTraits'] = {
    personality: data.personality || '',
    ideals: data.ideals || '',
    bonds: data.bonds || '',
    flaws: data.flaws || '',
    classFeatures: classData.class_features || [],
    racialTraits: raceData.racial_traits || [],
  };

  // 8. Calculate SRD Features (from the original implementation)
  const srdFeatures = {
    classFeatures: [], // Would need to be populated from SRD data
    subclassFeatures: [],
  };

  // 9. Create final character object
  // Collect all feats (level 1 + cumulative ASI feats)
  const allFeats = [...(data.selectedFeats || [])];
  if (data.cumulativeASI) {
    data.cumulativeASI.forEach(asiChoice => {
      if (asiChoice.type === 'feat' && asiChoice.featSlug) {
        allFeats.push(asiChoice.featSlug);
      }
    });
  }

  const character: Character = {
    id: '', // Will be set when saving
    name: data.name,
    race: raceData.name,
    class: classData.name,
    level,
    alignment: data.alignment,
    background: data.background,
    edition: data.edition,
    inspiration: false,
    proficiencyBonus: pb,
    armorClass,
    hitPoints: maxHitPoints, // Current hit points
    maxHitPoints,
    hitDice: {
      current: level,
      max: level,
      dieType: getHitDieForClass(data.classSlug),
    },
    speed: 30, // Default speed, would need race-specific logic
    initiative,
    abilities: finalAbilities,
    skills: finalSkills,
    languages: data.knownLanguages,
    featuresAndTraits,
     selectedFeats: allFeats,
     spellcasting: spellcastingData,
     srdFeatures,
     subclass: data.subclassSlug,
     experiencePoints: 0,
     feats: allFeats, // Legacy support
     selectedFightingStyle: data.selectedFightingStyle,
     inventory,
     trinket: data.selectedTrinket,
     expertiseSkills: data.expertiseSkills,
     weaponMastery: data.weaponMastery,
     divineOrder: data.divineOrder,
     primalOrder: data.primalOrder,
     fightingStyle: data.fightingStyle,
     eldritchInvocations: data.eldritchInvocations,
    currency: {
      cp: 0,
      sp: 0,
      gp: 0,
      pp: 0,
    },
    equippedArmor: undefined,
    equippedWeapons: [],
    temporaryHitPoints: 0,
    deathSaves: { successes: 0, failures: 0 },
    conditions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return character;
};
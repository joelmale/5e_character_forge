import { CharacterCreationData, Character, AbilityName, SkillName } from '../types/dnd';
import { getAllRaces, loadClasses, loadEquipment, BACKGROUNDS, PROFICIENCY_BONUSES, getModifier, SKILL_TO_ABILITY, ALL_SKILLS, getHitDieForClass } from '../services/dataService';
import { migrateSpellSelectionToCharacter } from '../utils/spellUtils';

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

  // 1. Calculate Abilities with Racial Bonuses
  (Object.keys(data.abilities) as AbilityName[]).forEach((ability) => {
    const rawScore = data.abilities[ability] + (raceData.ability_bonuses[ability] || 0);
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
  } else {
    // Multi-level: Calculate HP for all levels
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

  // 3.5. Calculate Inventory from Equipment Choices
  const inventory: Character['inventory'] = [];

  // Add items from class equipment choices
  if (data.equipmentChoices) {
    data.equipmentChoices.forEach(choice => {
      if (choice.selected !== null && choice.selected !== undefined) {
        const selectedBundle = choice.options[choice.selected];
        selectedBundle.forEach(item => {
          // Try to find matching equipment in database
          const equipmentSlug = item.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          const foundEquipment = loadEquipment().find(eq =>
            eq.slug === equipmentSlug || eq.name.toLowerCase() === item.name.toLowerCase()
          );

          if (foundEquipment) {
            // Check if item already exists in inventory
            const existingItem = inventory.find(inv => inv.equipmentSlug === foundEquipment.slug);
            if (existingItem) {
              existingItem.quantity += item.quantity;
            } else {
              inventory.push({
                equipmentSlug: foundEquipment.slug,
                quantity: item.quantity,
                equipped: false, // Will be equipped manually by player
              });
            }
          }
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
  const armorClass = 10 + finalAbilities.DEX.modifier;

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
  const character: Character = {
    id: '', // Will be set when saving
    name: data.name,
    race: raceData.name,
    class: classData.name,
    level,
    alignment: data.alignment,
    background: data.background,
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
     selectedFeats: data.selectedFeats || [],
     spellcasting: spellcastingData,
     srdFeatures,
     subclass: data.subclassSlug,
     experiencePoints: 0,
     feats: data.selectedFeats || [], // Legacy support
     selectedFightingStyle: data.selectedFightingStyle,
     inventory,
     trinket: data.selectedTrinket,
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
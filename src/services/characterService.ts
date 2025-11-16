/* eslint-disable no-empty */
import { generateUUID } from './diceService';
import levelConstantsData from '../data/levelConstants.json';
import {
    loadRaces,
    loadClasses,
    getModifier,
    PROFICIENCY_BONUSES,
    SKILL_TO_ABILITY,
    ALL_SKILLS,
    loadEquipment,
    getFeaturesByClass,
    getFeaturesBySubclass,
    aggregateProficiencies,
    getHitDieForClass,
    // FEAT_DATABASE,
} from './dataService';
import { SPELL_SLOTS_BY_CLASS, CANTRIPS_KNOWN_BY_CLASS } from './dataService';
// import { CANTRIPS_KNOWN_BY_CLASS } from '../data/cantrips';
import {
    CharacterCreationData,
    Character,
    AbilityName,
    SkillName,
    EquippedItem,
    // Equipment,
    // Subclass,
    Class,
    // Ability,
} from '../types/dnd';
import { updateCharacter } from '../services/dbService'; // Added this import
import { migrateSpellSelectionToCharacter } from '../utils/spellUtils';

// Helper to check if a class is a spellcaster
export const isSpellcaster = (characterClass: Class | undefined | null): boolean => {
    if (!characterClass) return false;
    return !!characterClass.spellcasting;
};

export const calculateCharacterStats = (data: CharacterCreationData): Character => {
    const raceData = loadRaces().find(r => r.slug === data.raceSlug);
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
    const backgroundSkills: string[] = []; // TODO: Implement background skill proficiencies
    const allProficientSkills = [...data.selectedSkills, ...backgroundSkills.map((s: string) => s as SkillName)];

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
    if (isSpellcaster(classData) && classData.spellcasting) {
        spellcastingData = migrateSpellSelectionToCharacter(
            data.spellSelection,
            classData,
            {
                STR: finalAbilities.STR.score,
                DEX: finalAbilities.DEX.score,
                CON: finalAbilities.CON.score,
                INT: finalAbilities.INT.score,
                WIS: finalAbilities.WIS.score,
                CHA: finalAbilities.CHA.score,
            },
            level
        );
    }

    // 5. Build Equipment Inventory
    const inventory: EquippedItem[] = [];
    let equippedArmor: string | undefined;
    const equippedWeapons: string[] = [];

    // TODO: Implement equipment packages for higher level characters
    // For now, equipment is handled through equipment choices in character creation

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
    let armorClass = 10 + finalAbilities.DEX.modifier; // Default unarmored
    if (equippedArmor) {
        const armor = loadEquipment().find(eq => eq.slug === equippedArmor);
        if (armor?.armor_class) {
            if (armor.armor_category === 'Light') {
                armorClass = armor.armor_class.base + finalAbilities.DEX.modifier;
            } else if (armor.armor_category === 'Medium') {
                const dexBonus = Math.min(finalAbilities.DEX.modifier, armor.armor_class.max_bonus || 2);
                armorClass = armor.armor_class.base + dexBonus;
            } else if (armor.armor_category === 'Heavy') {
                armorClass = armor.armor_class.base;
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

    // 10. Calculate Proficiencies
    const proficiencies = aggregateProficiencies(data.raceSlug, data.classSlug, data.background);

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
        inspiration: false,
        proficiencyBonus: pb,
        armorClass,
        hitPoints: maxHitPoints,
        maxHitPoints,
         hitDice: {
             current: level,
             max: level,
             dieType: getHitDieForClass(data.classSlug),
         },
         speed: raceData.speed || 30,
        initiative: finalAbilities.DEX.modifier,
        abilities: finalAbilities,
        skills: finalSkills,
        proficiencies,
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
            gp: 15, // Default starting gold - TODO: Implement level-based starting gold
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

export const recalculateAC = (character: Character): number => {
    let armorClass = 10 + character.abilities.DEX.modifier; // Default unarmored

    if (character.equippedArmor) {
        const armor = loadEquipment().find(eq => eq.slug === character.equippedArmor);
        if (armor?.armor_class) {
            if (armor.armor_category === 'Light') {
                armorClass = armor.armor_class.base + character.abilities.DEX.modifier;
            } else if (armor.armor_category === 'Medium') {
                const dexBonus = Math.min(character.abilities.DEX.modifier, armor.armor_class.max_bonus || 2);
                armorClass = armor.armor_class.base + dexBonus;
            } else if (armor.armor_category === 'Heavy') {
                armorClass = armor.armor_class.base;
            }
        }
    }

    // Add shield bonus if equipped
    if (character.equippedWeapons?.some(slug => {
        const item = loadEquipment().find(eq => eq.slug === slug);
        return item?.armor_category === 'Shield';
    })) {
        armorClass += 2;
    }

    return armorClass;
};

export const toggleInspiration = async (
    characterId: string,
    characters: Character[],
    setCharacters: React.Dispatch<React.SetStateAction<Character[]>>,
    updateCharacter: (character: Character) => Promise<void>
) => {
    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    const updatedCharacter = { ...character, inspiration: !character.inspiration };

    try {
        await updateCharacter(updatedCharacter);
        // Optimistically update the state
        setCharacters(prev => prev.map(c => c.id === characterId ? updatedCharacter : c));
    } catch {} {
        // Optionally revert state if DB update fails
    }
};

export const handleShortRest = async (
    characterId: string,
    characters: Character[],
    setCharacters: React.Dispatch<React.SetStateAction<Character[]>>,
    setRollResult: React.Dispatch<React.SetStateAction<{ text: string; value: number | null }>>
) => {
    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    if (character.hitDice.current <= 0) {
        setRollResult({ text: "No hit dice remaining!", value: null });
        return;
    }

    const diceToSpendStr = prompt(`How many hit dice to spend? (Available: ${character.hitDice.current}/${character.hitDice.max})`);
    if (!diceToSpendStr) return;

    const diceToSpend = parseInt(diceToSpendStr, 10);
    if (isNaN(diceToSpend) || diceToSpend <= 0 || diceToSpend > character.hitDice.current) {
        setRollResult({ text: "Invalid number of hit dice.", value: null });
        return;
    }

    const allClasses = loadClasses();
    const classData = allClasses.find((c: Class) => c.name === character.class);
    if (!classData) return;

    const hitDie = classData.hit_die;
    const conModifier = character.abilities.CON.modifier;
    let hpRecovered = 0;
    for (let i = 0; i < diceToSpend; i++) {
        hpRecovered += Math.max(1, Math.floor(Math.random() * hitDie) + 1 + conModifier);
    }

    const newHP = Math.min(character.maxHitPoints, character.hitPoints + hpRecovered);
    const updatedCharacter = {
        ...character,
        hitPoints: newHP,
        hitDice: {
            ...character.hitDice,
            current: character.hitDice.current - diceToSpend,
        },
    };

    try {
        await updateCharacter(updatedCharacter);
        setCharacters(prev => prev.map(c => c.id === characterId ? updatedCharacter : c));
        setRollResult({ text: `Recovered ${hpRecovered} HP.`, value: newHP });

    } catch {} {
        // Error taking short rest
    }
};

export const handleLevelUp = async (
    characterId: string,
    characters: Character[],
    setCharacters: React.Dispatch<React.SetStateAction<Character[]>>,
    setRollResult: React.Dispatch<React.SetStateAction<{ text: string; value: number | null }>>,
    setAsiModalState: React.Dispatch<React.SetStateAction<{ isOpen: boolean; characterId: string | null }>>,
    setSubclassModalState: React.Dispatch<React.SetStateAction<{ isOpen: boolean; characterId: string | null; characterClass: string | null }>>,
    setCantripModalState: React.Dispatch<React.SetStateAction<{ isOpen: boolean; characterId: string | null; characterClass: string | null }>>
) => {
    const character = characters.find((c: Character) => c.id === characterId);
    if (!character) return;

    if (character.level >= 20) {
        setRollResult({ text: `${character.name} is already at max level!`, value: null });
        return;
    }

    const newLevel = character.level + 1;
    const newProficiencyBonus = PROFICIENCY_BONUSES[newLevel - 1] || character.proficiencyBonus;

    const allClasses = loadClasses();
    const classData = allClasses.find(c => c.name === character.class);
    if (!classData) {
        return;
    }

    const hitDie = classData.hit_die;
    const conModifier = character.abilities.CON.modifier;
    const hpIncrease = Math.max(1, Math.floor(hitDie / 2) + 1 + conModifier);

    const updatedCharacter = {
        ...character,
        level: newLevel,
        proficiencyBonus: newProficiencyBonus,
        maxHitPoints: character.maxHitPoints + hpIncrease,
        hitPoints: character.maxHitPoints + hpIncrease, // Also heal to full on level up
    };

    if (updatedCharacter.spellcasting) {
        const classSpellSlots = SPELL_SLOTS_BY_CLASS[classData.slug]?.[newLevel];
        if (classSpellSlots) {
            updatedCharacter.spellcasting = {
                ...updatedCharacter.spellcasting,
                spellSlots: classSpellSlots,
            };
        }
    }

    const asiLevels = levelConstantsData.asiLevels;
    if (asiLevels.includes(newLevel)) {
        setAsiModalState({ isOpen: true, characterId: characterId });
    }

    if (classData.slug === 'wizard' && newLevel === 2) {
        setSubclassModalState({ isOpen: true, characterId: characterId, characterClass: classData.slug });
    }

    if (updatedCharacter.spellcasting) {
        const cantripsKnownAtNewLevel = (CANTRIPS_KNOWN_BY_CLASS as any)[classData.slug]?.[newLevel];
        if (cantripsKnownAtNewLevel && cantripsKnownAtNewLevel > updatedCharacter.spellcasting.cantripsKnown.length) {
            // Open modal to choose cantrip instead of adding a placeholder
            setCantripModalState({
                isOpen: true,
                characterId: characterId,
                characterClass: classData.slug,
            });
        }
    }

    try {
        await updateCharacter(updatedCharacter);
        setCharacters(prev => prev.map(c => c.id === characterId ? updatedCharacter : c));
        setRollResult({ text: `${character.name} is now level ${newLevel}!`, value: null });

    } catch {} {
        // Error leveling up character
    }
};

export const handleEquipArmor = async (
    characterId: string,
    armorSlug: string,
    characters: Character[],
    setCharacters: React.Dispatch<React.SetStateAction<Character[]>>
) => {
    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    const armor = loadEquipment().find(eq => eq.slug === armorSlug);
    if (!armor?.armor_category) return;

    // Update character with new equipped armor
    const updatedCharacter = {
        ...character,
        equippedArmor: armorSlug,
        inventory: character.inventory?.map(item =>
            item.equipmentSlug === armorSlug
                ? { ...item, equipped: true }
                : { ...item, equipped: item.equipped && loadEquipment().find(eq => eq.slug === item.equipmentSlug)?.armor_category !== armor.armor_category ? item.equipped : false }
        ),
    };

    // Recalculate AC
    updatedCharacter.armorClass = recalculateAC(updatedCharacter);

    try {
        await updateCharacter(updatedCharacter);
        setCharacters(prev => prev.map(c => c.id === characterId ? updatedCharacter : c));

    } catch {} {
        // Error equipping armor
    }
};

export const handleEquipWeapon = async (
    characterId: string,
    weaponSlug: string,
    characters: Character[],
    setCharacters: React.Dispatch<React.SetStateAction<Character[]>>
) => {
    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    const weapon = loadEquipment().find(eq => eq.slug === weaponSlug);
    if (!weapon?.weapon_category) return;

    // Add weapon to equipped weapons (max 2)
    const equippedWeapons = character.equippedWeapons || [];
    if (!equippedWeapons.includes(weaponSlug)) {
        const updatedWeapons = [...equippedWeapons, weaponSlug].slice(0, 2); // Max 2 weapons

        const updatedCharacter = {
            ...character,
            equippedWeapons: updatedWeapons,
            inventory: character.inventory?.map(item =>
                item.equipmentSlug === weaponSlug ? { ...item, equipped: true } : item
            ),
        };

        try {
            await updateCharacter(updatedCharacter);
            setCharacters(prev => prev.map(c => c.id === characterId ? updatedCharacter : c));

        } catch {} {
            // Error equipping weapon
        }
    }
};

export const handleUnequipItem = async (
    characterId: string,
    itemSlug: string,
    characters: Character[],
    setCharacters: React.Dispatch<React.SetStateAction<Character[]>>
) => {
    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    const updatedCharacter = { ...character };

    // Check if it's armor
    if (character.equippedArmor === itemSlug) {
        updatedCharacter.equippedArmor = undefined;
        updatedCharacter.armorClass = recalculateAC(updatedCharacter);
    }

    // Check if it's a weapon
    if (character.equippedWeapons?.includes(itemSlug)) {
        updatedCharacter.equippedWeapons = character.equippedWeapons.filter(slug => slug !== itemSlug);
    }

    // Update inventory
    updatedCharacter.inventory = character.inventory?.map(item =>
        item.equipmentSlug === itemSlug ? { ...item, equipped: false } : item
    );

    try {
        await updateCharacter(updatedCharacter);
        setCharacters(prev => prev.map(c => c.id === characterId ? updatedCharacter : c));

    } catch {} {
        // Error unequipping item
    }
};

export const handleAddItem = async (
    characterId: string,
    equipmentSlug: string,
    quantity: number,
    characters: Character[],
    setCharacters: React.Dispatch<React.SetStateAction<Character[]>>
) => {
    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    const equipment = loadEquipment().find(eq => eq.slug === equipmentSlug);
    if (!equipment) return;

    // Check if item already in inventory
    const existingItem = character.inventory?.find(item => item.equipmentSlug === equipmentSlug);

    let updatedInventory: EquippedItem[];
    if (existingItem) {
        // Increase quantity
        updatedInventory = character.inventory!.map(item =>
            item.equipmentSlug === equipmentSlug ? { ...item, quantity: item.quantity + quantity } : item
        );
    } else {
        // Add new item
        updatedInventory = [...(character.inventory || []), { equipmentSlug, quantity, equipped: false }];
    }

    const updatedCharacter = { ...character, inventory: updatedInventory };

    try {
        await updateCharacter(updatedCharacter);
        setCharacters(prev => prev.map(c => c.id === characterId ? updatedCharacter : c));

    } catch {} {
        // Error adding item
    }
};

export const handleRemoveItem = async (
    characterId: string,
    equipmentSlug: string,
    quantity: number,
    characters: Character[],
    setCharacters: React.Dispatch<React.SetStateAction<Character[]>>
) => {
    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    const existingItem = character.inventory?.find(item => item.equipmentSlug === equipmentSlug);
    if (!existingItem) return;

    let updatedInventory: EquippedItem[];
    if (existingItem.quantity <= quantity) {
        // Remove item entirely
        updatedInventory = character.inventory!.filter(item => item.equipmentSlug !== equipmentSlug);

        // Unequip if equipped
        if (character.equippedArmor === equipmentSlug) {
            character.equippedArmor = undefined;
        }
        if (character.equippedWeapons?.includes(equipmentSlug)) {
            character.equippedWeapons = character.equippedWeapons.filter(slug => slug !== equipmentSlug);
        }
    } else {
        // Decrease quantity
        updatedInventory = character.inventory!.map(item =>
            item.equipmentSlug === equipmentSlug ? { ...item, quantity: item.quantity - quantity } : item
        );
    }

    const updatedCharacter = { ...character, inventory: updatedInventory };
    updatedCharacter.armorClass = recalculateAC(updatedCharacter);

    try {
        await updateCharacter(updatedCharacter);
        setCharacters(prev => prev.map(c => c.id === characterId ? updatedCharacter : c));

    } catch {} {
        // Error removing item
    }
};

export const handleLevelDown = async (
    characterId: string,
    characters: Character[],
    setCharacters: React.Dispatch<React.SetStateAction<Character[]>>,
    setRollResult: React.Dispatch<React.SetStateAction<{ text: string; value: number | null }>>
) => {
    const character = characters.find((c: Character) => c.id === characterId);
    if (!character) return;

    if (character.level <= 1) {
        setRollResult({ text: `${character.name} is already at level 1.`, value: null });
        return;
    }

    const newLevel = character.level - 1;
    const newProficiencyBonus = PROFICIENCY_BONUSES[newLevel - 1] || character.proficiencyBonus;

    const allClasses = loadClasses();
    const classData = allClasses.find(c => c.name === character.class);
    if (!classData) {
        return;
    }

    const hitDie = classData.hit_die;
    const conModifier = character.abilities.CON.modifier;
    const hpReduction = Math.max(1, Math.floor(hitDie / 2) + 1 + conModifier);

    const updatedCharacter = {
        ...character,
        level: newLevel,
        proficiencyBonus: newProficiencyBonus,
        maxHitPoints: Math.max(1, character.maxHitPoints - hpReduction),
        hitPoints: Math.max(1, character.maxHitPoints - hpReduction),
    };

    if (updatedCharacter.spellcasting) {
        const classSpellSlots = SPELL_SLOTS_BY_CLASS[classData.slug]?.[newLevel];
        if (classSpellSlots) {
            updatedCharacter.spellcasting = {
                ...updatedCharacter.spellcasting,
                spellSlots: classSpellSlots,
            };
        }

        const cantripChoiceAtLevel = updatedCharacter.spellcasting.cantripChoicesByLevel?.[character.level];
        if (cantripChoiceAtLevel) {
            updatedCharacter.spellcasting = {
                ...updatedCharacter.spellcasting,
                cantripsKnown: updatedCharacter.spellcasting.cantripsKnown.filter(c => c !== cantripChoiceAtLevel),
            };
            delete updatedCharacter.spellcasting.cantripChoicesByLevel?.[character.level];
        }
    }

    try {
        await updateCharacter(updatedCharacter);
        setCharacters(prev => prev.map(c => c.id === characterId ? updatedCharacter : c));
        setRollResult({ text: `${character.name} is now level ${newLevel}.`, value: null });

    } catch {} {
        // Error leveling down character
    }
};

export const handleLongRest = async (
    characterId: string,
    characters: Character[],
    setCharacters: React.Dispatch<React.SetStateAction<Character[]>>,
    setRollResult: React.Dispatch<React.SetStateAction<{ text: string; value: number | null }>>
) => {
    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    const updatedCharacter = {
        ...character,
        hitPoints: character.maxHitPoints, // Restore HP to max
        hitDice: {
            ...character.hitDice,
            current: character.hitDice.max, // Restore all spent hit dice
        },
    };

    // Restore all spell slots
    if (updatedCharacter.spellcasting) {
        updatedCharacter.spellcasting = {
            ...updatedCharacter.spellcasting,
            usedSpellSlots: Array(9).fill(0), // Reset all used spell slots
        };
    }

    try {
        await updateCharacter(updatedCharacter);
        setCharacters(prev => prev.map(c => c.id === characterId ? updatedCharacter : c));
        setRollResult({ text: `${character.name} took a long rest and recovered!`, value: null });

    } catch {} {
        setRollResult({ text: 'Error taking long rest.', value: null });
    }
};

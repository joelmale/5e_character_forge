/* eslint-disable no-empty */
import { useCallback } from 'react';
import { Character, EquippedItem, Equipment } from '../types/dnd';
import { updateCharacter } from '../services/dbService';
import { loadEquipment } from '../services/dataService';

const EQUIPMENT_DATABASE: Equipment[] = loadEquipment();

interface UseEquipmentProps {
  characters: Character[];
  setCharacters: React.Dispatch<React.SetStateAction<Character[]>>;
  recalculateAC: (character: Character) => number;
}

export function useEquipment({ characters, setCharacters, recalculateAC }: UseEquipmentProps) {
  const equipArmor = useCallback(async (characterId: string, armorSlug: string) => {
    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    const armor = EQUIPMENT_DATABASE.find(eq => eq.slug === armorSlug);
    if (!armor?.armor_category) return;

    // Update character with new equipped armor
    const updatedCharacter = {
      ...character,
      equippedArmor: armorSlug,
      inventory: character.inventory?.map(item =>
        item.equipmentSlug === armorSlug
          ? { ...item, equipped: true }
          : { ...item, equipped: item.equipped && EQUIPMENT_DATABASE.find(eq => eq.slug === item.equipmentSlug)?.armor_category !== armor.armor_category ? item.equipped : false }
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
  }, [characters, setCharacters, recalculateAC]);

  const equipWeapon = useCallback(async (characterId: string, weaponSlug: string) => {
    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    const weapon = EQUIPMENT_DATABASE.find(eq => eq.slug === weaponSlug);
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
  }, [characters, setCharacters]);

  const unequipItem = useCallback(async (characterId: string, itemSlug: string) => {
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
  }, [characters, setCharacters, recalculateAC]);

  const addItem = useCallback(async (characterId: string, equipmentSlug: string, quantity: number = 1) => {
    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    const equipment = EQUIPMENT_DATABASE.find(eq => eq.slug === equipmentSlug);
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
  }, [characters, setCharacters]);

  const removeItem = useCallback(async (characterId: string, equipmentSlug: string, quantity: number = 1) => {
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
  }, [characters, setCharacters, recalculateAC]);

  return {
    equipArmor,
    equipWeapon,
    unequipItem,
    addItem,
    removeItem,
  };
}
import { useCallback } from 'react';
import { Character, Ability } from '../types/dnd';
import { updateCharacter } from '../services/dbService';
import { getModifier } from '../services/dataService';

interface UseSpellcastingProps {
  characters: Character[];
  setCharacters: React.Dispatch<React.SetStateAction<Character[]>>;
  cantripModalState: { isOpen: boolean; characterId: string | null; characterClass: string | null };
  subclassModalState: { isOpen: boolean; characterId: string | null; characterClass: string | null };
  asiModalState: { isOpen: boolean; characterId: string | null };
  setCantripModalState: React.Dispatch<React.SetStateAction<{ isOpen: boolean; characterId: string | null; characterClass: string | null }>>;
  setSubclassModalState: React.Dispatch<React.SetStateAction<{ isOpen: boolean; characterId: string | null; characterClass: string | null }>>;
  setAsiModalState: React.Dispatch<React.SetStateAction<{ isOpen: boolean; characterId: string | null }>>;
}

export function useSpellcasting({
  characters,
  setCharacters,
  cantripModalState,
  subclassModalState,
  asiModalState,
  setCantripModalState,
  setSubclassModalState,
  setAsiModalState,
}: UseSpellcastingProps) {
  const selectCantrip = useCallback(async (cantripSlug: string) => {
    const { characterId } = cantripModalState;
    if (!characterId) return;

    const character = characters.find(c => c.id === characterId);
    if (!character || !character.spellcasting) return;

    const updatedCharacter = {
      ...character,
      spellcasting: {
        ...character.spellcasting,
        cantripsKnown: [...character.spellcasting.cantripsKnown, cantripSlug],
        cantripChoicesByLevel: {
          ...character.spellcasting.cantripChoicesByLevel,
          [character.level]: cantripSlug,
        },
      },
    };

    try {
      await updateCharacter(updatedCharacter);
      setCharacters(prev => prev.map(c => c.id === characterId ? updatedCharacter : c));
      setCantripModalState({ isOpen: false, characterId: null, characterClass: null });
    } catch (e) {
      console.error("Error selecting cantrip:", e);
    }
  }, [characters, setCharacters, cantripModalState, setCantripModalState]);

  const selectSubclass = useCallback(async (subclass: any) => {
    const { characterId } = subclassModalState;
    if (!characterId) return;

    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    const updatedCharacter = {
      ...character,
      subclass: subclass.slug,
    };

    try {
      await updateCharacter(updatedCharacter);
      setCharacters(prev => prev.map(c => c.id === characterId ? updatedCharacter : c));
      setSubclassModalState({ isOpen: false, characterId: null, characterClass: null });
    } catch (e) {
      console.error("Error selecting subclass:", e);
    }
  }, [characters, setCharacters, subclassModalState, setSubclassModalState]);

  const applyAsi = useCallback(async (increases: Partial<Record<Ability, number>>) => {
    const { characterId } = asiModalState;
    if (!characterId) return;

    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    const updatedAbilities = { ...character.abilities };
    for (const key in increases) {
      const ability = key as Ability;
      const increase = increases[ability] || 0;
      updatedAbilities[ability].score += increase;
      updatedAbilities[ability].modifier = getModifier(updatedAbilities[ability].score);
    }

    const updatedCharacter = {
      ...character,
      abilities: updatedAbilities,
    };

    try {
      await updateCharacter(updatedCharacter);
      setCharacters(prev => prev.map(c => c.id === characterId ? updatedCharacter : c));
      setAsiModalState({ isOpen: false, characterId: null });
    } catch (e) {
      console.error("Error applying ASI:", e);
    }
  }, [characters, setCharacters, asiModalState, setAsiModalState]);

  return {
    selectCantrip,
    selectSubclass,
    applyAsi,
  };
}
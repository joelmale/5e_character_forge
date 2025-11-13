import React, { createContext, useContext, ReactNode } from 'react';
import { Character } from '../types/dnd';
import { useCharacterManagement } from '../hooks';

interface CharacterContextType {
  characters: Character[];
  loading: boolean;
  error: string | null;
  loadCharacters: () => Promise<void>;
  createCharacter: (character: Character) => Promise<boolean>;
  removeCharacter: (id: string) => Promise<boolean>;
  updateCharacter: (character: Character) => Promise<boolean>;
}

const CharacterContext = createContext<CharacterContextType | undefined>(undefined);

export const useCharacterContext = () => {
  const context = useContext(CharacterContext);
  if (context === undefined) {
    throw new Error('useCharacterContext must be used within a CharacterProvider');
  }
  return context;
};

interface CharacterProviderProps {
  children: ReactNode;
}

export const CharacterProvider: React.FC<CharacterProviderProps> = ({ children }) => {
  const characterManagement = useCharacterManagement();

  return (
    <CharacterContext.Provider value={characterManagement}>
      {children}
    </CharacterContext.Provider>
  );
};
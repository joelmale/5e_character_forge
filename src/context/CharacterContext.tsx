import React, { ReactNode } from 'react';
import { useCharacterManagement } from '../hooks';
import { CharacterContext } from './CharacterContextObject';

// useCharacterContext hook moved to separate file to fix React refresh warning

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
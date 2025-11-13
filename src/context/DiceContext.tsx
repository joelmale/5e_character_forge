import React, { createContext, useContext, ReactNode } from 'react';
import { DiceRoll } from '../services/diceService';
import { useDiceRolling } from '../hooks';

interface DiceContextType {
  rollHistory: DiceRoll[];
  latestRoll: DiceRoll | null;
  rollDice: (roll: DiceRoll) => DiceRoll;
  clearHistory: () => void;
  createAndRollAbility: (ability: string, score: number) => DiceRoll;
  createAndRollSkill: (skillLabel: string, value: number) => DiceRoll;
  createAndRollInitiative: (modifier: number) => DiceRoll;
}

const DiceContext = createContext<DiceContextType | undefined>(undefined);

export const useDiceContext = () => {
  const context = useContext(DiceContext);
  if (context === undefined) {
    throw new Error('useDiceContext must be used within a DiceProvider');
  }
  return context;
};

interface DiceProviderProps {
  children: ReactNode;
}

export const DiceProvider: React.FC<DiceProviderProps> = ({ children }) => {
  const diceManagement = useDiceRolling();

  return (
    <DiceContext.Provider value={diceManagement}>
      {children}
    </DiceContext.Provider>
  );
};
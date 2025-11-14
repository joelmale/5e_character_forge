import React from 'react';
import { Character } from '../../types/dnd';

interface SavingThrowsProps {
  character: Character;
  setRollResult: (result: {
    text: string;
    value: number | null;
    details?: Array<{ value: number; kept: boolean; critical?: 'success' | 'failure' }>
  }) => void;
  onDiceRoll: (roll: any) => void;
}

export const SavingThrows: React.FC<SavingThrowsProps> = ({
  character,
  setRollResult,
  onDiceRoll,
}) => {
  return (
    <div style={{backgroundColor: 'orange', color: 'white', padding: '20px', margin: '10px', border: '4px solid yellow'}}>
      <h3>🛡️ SAVING THROWS COMPONENT IS RENDERING</h3>
      <p>Character: {character.name}</p>
      <p>Level: {character.level}</p>
      <p>Class: {character.class}</p>
    </div>
  );
};
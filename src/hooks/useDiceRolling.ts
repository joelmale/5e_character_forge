import React, { useState, useCallback } from 'react';
import { DiceRoll, createAbilityRoll, createSkillRoll, createInitiativeRoll, getRollHistory, addRollToHistory, clearRollHistory } from '../services/diceService';
import { diceSounds } from '../utils/diceSounds';

export function useDiceRolling() {
  const [rollHistory, setRollHistory] = useState<DiceRoll[]>([]);
  const [latestRoll, setLatestRoll] = useState<DiceRoll | null>(null);

  // Load roll history on mount
  React.useEffect(() => {
    const history = getRollHistory();
    setRollHistory(history);
  }, []);

  const rollDice = useCallback((roll: DiceRoll) => {
    // Add to history
    const updatedHistory = addRollToHistory(roll);
    setRollHistory(updatedHistory);
    setLatestRoll(roll);

    // Play sounds
    diceSounds.playRollSound(roll.diceResults.length);

    if (roll.critical === 'success') {
      setTimeout(() => diceSounds.playCritSuccessSound(), 300);
    } else if (roll.critical === 'failure') {
      setTimeout(() => diceSounds.playCritFailureSound(), 300);
    }

    return roll;
  }, []);

  const clearHistory = useCallback(() => {
    clearRollHistory();
    setRollHistory([]);
  }, []);

  const createAndRollAbility = useCallback((ability: string, score: number) => {
    const roll = createAbilityRoll(ability, score);
    return rollDice(roll);
  }, [rollDice]);

  const createAndRollSkill = useCallback((skillLabel: string, value: number) => {
    const roll = createSkillRoll(skillLabel, value);
    return rollDice(roll);
  }, [rollDice]);

  const createAndRollInitiative = useCallback((modifier: number) => {
    const roll = createInitiativeRoll(modifier);
    return rollDice(roll);
  }, [rollDice]);

  return {
    rollHistory,
    latestRoll,
    rollDice,
    clearHistory,
    createAndRollAbility,
    createAndRollSkill,
    createAndRollInitiative,
  };
}
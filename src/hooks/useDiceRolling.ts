import React, { useState, useCallback } from 'react';
import { DiceRoll, createAbilityRoll, createSkillRoll, createInitiativeRoll, getRollHistory, addRollToHistory, clearRollHistory, saveRollHistory } from '../services/diceService';
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
    console.error('🎲 [DICE PROCESSING] Processing dice roll:', roll.label, roll.notation);

    // Add to history
    const updatedHistory = addRollToHistory(roll);
    setRollHistory(updatedHistory);
    setLatestRoll(roll);
    console.error('🎲 [DICE PROCESSING] latestRoll set to:', roll);

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

  const updateRollWithRealResults = useCallback((rollId: string, realDiceResults: number[], realTotal?: number) => {
    setRollHistory(prevHistory => {
      const updatedHistory = prevHistory.map(roll => {
        if (roll.id === rollId) {
          const updatedRoll = {
            ...roll,
            diceResults: realDiceResults,
            total: realTotal !== undefined ? realTotal : realDiceResults.reduce((sum, val) => sum + val, 0) + roll.modifier
          };
          console.log('🎲 [ROLL UPDATE] Updated roll with real results:', updatedRoll);
          return updatedRoll;
        }
        return roll;
      });

      // Update localStorage
      saveRollHistory(updatedHistory.slice(-10));

      return updatedHistory;
    });

    // Also update latestRoll if it matches
    setLatestRoll(prevLatest => {
      if (prevLatest && prevLatest.id === rollId) {
        const updatedRoll = {
          ...prevLatest,
          diceResults: realDiceResults,
          total: realTotal !== undefined ? realTotal : realDiceResults.reduce((sum, val) => sum + val, 0) + prevLatest.modifier
        };
        console.log('🎲 [ROLL UPDATE] Updated latestRoll with real results:', updatedRoll);
        return updatedRoll;
      }
      return prevLatest;
    });
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
    updateRollWithRealResults,
    createAndRollAbility,
    createAndRollSkill,
    createAndRollInitiative,
  };
}
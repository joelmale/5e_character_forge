import React from 'react';
import { Dice6 } from 'lucide-react';
import { Character } from '../../types/dnd';
import { getModifier } from '../../services/dataService';

interface HitDiceProps {
  character: Character;
  onUpdateCharacter: (character: Character) => void;
}

export const HitDice: React.FC<HitDiceProps> = ({
  character,
  onUpdateCharacter,
}) => {
  // Calculate hit dice based on class and level
  const getHitDiceInfo = () => {
    // This is a simplified calculation - in a full implementation,
    // this would look up the character's class hit die from SRD data
    const hitDieType = 12; // Assume d12 for barbarian, would be dynamic
    const maxHitDice = character.level;

    return {
      dieType: hitDieType,
      max: maxHitDice,
      current: character.hitDice.current,
      available: character.hitDice.current
    };
  };

  const hitDiceInfo = getHitDiceInfo();

  const spendHitDie = () => {
    if (hitDiceInfo.available <= 0) return;

    // Calculate healing: (hit die / 2) + CON modifier, minimum 1
    const conMod = getModifier(character.abilities.CON.score);
    const avgRoll = Math.floor(hitDiceInfo.dieType / 2);
    const healing = Math.max(1, avgRoll + conMod);

    // Update character
    const updatedCharacter = {
      ...character,
      hitDice: {
        ...character.hitDice,
        current: character.hitDice.current - 1
      },
      hitPoints: Math.min(character.maxHitPoints, character.hitPoints + healing)
    };

    onUpdateCharacter(updatedCharacter);
  };

  const resetHitDice = () => {
    // Reset on long rest
    const updatedCharacter = {
      ...character,
      hitDice: {
        ...character.hitDice,
        current: character.hitDice.max
      }
    };

    onUpdateCharacter(updatedCharacter);
  };

  return (
    <div className="bg-gray-700/50 border border-gray-600 rounded p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
          <Dice6 className="w-3 h-3" />
          Hit Dice
        </h3>
      </div>

      <div className="space-y-2">
        {/* Current Hit Dice Display */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400">Available</div>
            <div className="text-lg font-bold text-white">
              {hitDiceInfo.current} / {hitDiceInfo.max}
            </div>
            <div className="text-xs text-gray-400">d{hitDiceInfo.dieType}</div>
          </div>

          <div className="flex gap-1">
            <button
              onClick={spendHitDie}
              disabled={hitDiceInfo.available <= 0}
              className="px-2 py-1 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 rounded text-xs transition-colors"
              title="Spend hit die (short rest)"
            >
              Spend
            </button>
            <button
              onClick={resetHitDice}
              className="px-2 py-1 bg-green-600 hover:bg-green-500 rounded text-xs transition-colors"
              title="Reset hit dice (long rest)"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Hit Die Healing Preview */}
        {hitDiceInfo.available > 0 && (
          <div className="pt-2 border-t border-gray-600">
            <div className="text-xs text-gray-400">Next healing:</div>
            <div className="text-sm text-white">
              {Math.max(1, Math.floor(hitDiceInfo.dieType / 2) + getModifier(character.abilities.CON.score))} HP
              <span className="text-gray-400 text-xs ml-1">
                (avg + CON)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
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
    <div className="bg-purple-900 rounded-xl shadow-lg border-l-4 border-yellow-500 p-4">
      <h3 className="text-lg font-bold text-yellow-400 mb-4">🎲 Hit Dice</h3>

      <div className="space-y-4">
        {/* Current Hit Dice Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Dice6 className="w-6 h-6 text-purple-400" />
            <div>
              <div className="text-sm text-gray-400">Available</div>
              <div className="text-xl font-bold text-white">
                {hitDiceInfo.current} / {hitDiceInfo.max}
              </div>
              <div className="text-xs text-gray-400">d{hitDiceInfo.dieType}</div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={spendHitDie}
              disabled={hitDiceInfo.available <= 0}
              className="px-3 py-1 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 rounded text-sm transition-colors"
              title="Spend hit die (short rest)"
            >
              Spend
            </button>
            <button
              onClick={resetHitDice}
              className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-sm transition-colors"
              title="Reset hit dice (long rest)"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Hit Die Healing Preview */}
        {hitDiceInfo.available > 0 && (
          <div className="p-3 bg-gray-800/50 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Next Hit Die Healing:</div>
            <div className="text-white">
              {Math.max(1, Math.floor(hitDiceInfo.dieType / 2) + getModifier(character.abilities.CON.score))} HP
              <span className="text-gray-400 text-xs ml-1">
                (avg roll + CON mod)
              </span>
            </div>
          </div>
        )}

        {/* Hit Dice Info */}
        <div className="text-xs text-gray-500">
          Hit dice recover on long rests. Spend during short rests to heal.
        </div>
      </div>
    </div>
  );
};
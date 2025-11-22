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
    const hitDieType = character.hitDice.dieType;
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
    <div className="bg-theme-tertiary/50 border border-theme-primary rounded p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-theme-muted uppercase tracking-wider flex items-center gap-1">
          <Dice6 className="w-3 h-3" />
          Hit Dice
        </h3>
      </div>

      <div className="space-y-2">
        {/* Current Hit Dice Display */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-theme-muted">Available</div>
            <div className="text-lg font-bold text-theme-primary">
              {hitDiceInfo.current} / {hitDiceInfo.max}
            </div>
            <div className="text-xs text-theme-muted">d{hitDiceInfo.dieType}</div>
          </div>

          <div className="flex gap-1">
            <button
              onClick={spendHitDie}
              disabled={hitDiceInfo.available <= 0}
              className="px-2 py-1 bg-accent-red hover:bg-accent-red-light disabled:bg-theme-quaternary rounded text-xs transition-colors"
              title="Spend hit die (short rest)"
            >
              Spend
            </button>
            <button
              onClick={resetHitDice}
              className="px-2 py-1 bg-accent-green hover:bg-accent-green rounded text-xs transition-colors"
              title="Reset hit dice (long rest)"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Hit Die Healing Preview */}
        {hitDiceInfo.available > 0 && (
          <div className="pt-2 border-t border-theme-primary">
            <div className="text-xs text-theme-muted">Next healing:</div>
            <div className="text-sm text-theme-primary">
              {Math.max(1, Math.floor(hitDiceInfo.dieType / 2) + getModifier(character.abilities.CON.score))} HP
              <span className="text-theme-muted text-xs ml-1">
                (avg + CON)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
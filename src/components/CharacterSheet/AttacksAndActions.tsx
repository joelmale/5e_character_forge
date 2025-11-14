import React from 'react';
import { Dice6 } from 'lucide-react';
import { Character } from '../../types/dnd';
import { createComplexRoll } from '../../services/diceService';
import { getModifier } from '../../services/dataService';

interface AttacksAndActionsProps {
  character: Character;
  setRollResult: (result: {
    text: string;
    value: number | null;
    details?: Array<{ value: number; kept: boolean; critical?: 'success' | 'failure' }>
  }) => void;
  onDiceRoll: (roll: any) => void;
}

export const AttacksAndActions: React.FC<AttacksAndActionsProps> = ({
  character,
  setRollResult,
  onDiceRoll,
}) => {
  // Get equipped weapons
  const getEquippedWeapons = () => {
    if (!character.equippedWeapons || character.equippedWeapons.length === 0) {
      return [];
    }

    // This would need to be implemented to fetch weapon data from equipment
    // For now, return empty array - will be populated when equipment system is enhanced
    return [];
  };

  const handleWeaponAttack = (weaponName: string, attackBonus: number, damageDice: string, damageType: string) => {
    // Roll attack (1d20 + attack bonus)
    const attackRoll = createComplexRoll(`${weaponName} Attack`, `1d20+${attackBonus}`);
    setRollResult({
      text: `${weaponName} Attack: ${attackRoll.notation}`,
      value: attackRoll.total,
      details: attackRoll.pools?.[0]?.results.map((value, idx) => ({
        value,
        kept: true,
        critical: attackRoll.diceResults.length === 1 && attackRoll.diceResults[0] === value ? attackRoll.critical : undefined
      }))
    });
    onDiceRoll(attackRoll);
  };

  const handleUnarmedStrike = () => {
    const strMod = getModifier(character.abilities.STR.score);
    const attackBonus = strMod + character.proficiencyBonus;
    const damageDice = '1';
    const damageType = 'bludgeoning';

    const attackRoll = createComplexRoll('Unarmed Strike', `1d20+${attackBonus}`);
    setRollResult({
      text: `Unarmed Strike: ${attackRoll.notation}`,
      value: attackRoll.total,
      details: attackRoll.pools?.[0]?.results.map((value, idx) => ({
        value,
        kept: true,
        critical: attackRoll.diceResults.length === 1 && attackRoll.diceResults[0] === value ? attackRoll.critical : undefined
      }))
    });
    onDiceRoll(attackRoll);
  };

  const equippedWeapons = getEquippedWeapons();

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg border-l-4 border-red-500">
      <h3 className="text-lg font-bold text-red-400 mb-4 px-6 pt-4">Attacks & Actions</h3>

      <div className="px-6 pb-4 space-y-3">
        {/* Unarmed Strike - Always available */}
        <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
          <div className="flex items-center gap-3">
            <button
              onClick={handleUnarmedStrike}
              className="p-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
              title="Roll Unarmed Strike"
            >
              <Dice6 className="w-4 h-4 text-white" />
            </button>
            <div>
              <div className="font-semibold text-white">Unarmed Strike</div>
              <div className="text-sm text-gray-400">
                +{getModifier(character.abilities.STR.score) + character.proficiencyBonus} | 1 {getModifier(character.abilities.STR.score) >= 0 ? '+' : ''}{getModifier(character.abilities.STR.score)} bludgeoning
              </div>
            </div>
          </div>
        </div>

        {/* Equipped Weapons - TODO: Implement when equipment system is enhanced */}
        <div className="text-center py-4 text-gray-500">
          <p className="text-sm">Weapon attacks coming soon</p>
          <p className="text-xs mt-1">Enhanced equipment system integration planned</p>
        </div>

        {/* Spell Attacks - if spellcaster */}
        {character.spellcasting && (
          <div className="mt-4 pt-4 border-t border-gray-600">
            <h4 className="text-md font-semibold text-blue-400 mb-2">Spell Attacks</h4>
            <div className="text-sm text-gray-400">
              Spell attack modifier: +{character.proficiencyBonus + getModifier(character.abilities[character.spellcasting.ability].score)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
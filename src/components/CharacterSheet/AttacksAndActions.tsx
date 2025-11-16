import React from 'react';
import { Character, Equipment } from '../../types/dnd';
import { loadEquipment } from '../../services/dataService';
import { DiceRoll } from '../../services/diceService';

type CustomRoll = DiceRoll & {
  description: string;
  damageNotation?: string;
  damageType?: string;
};

interface AttacksAndActionsProps {
  character: Character;
  setRollResult: (result: {
    text: string;
    value: number | null;
    details?: Array<{ value: number; kept: boolean; critical?: 'success' | 'failure' }>
  }) => void;
  onDiceRoll: (roll: CustomRoll) => void;
}

// Helper function to calculate attack bonus for a weapon
const calculateAttackBonus = (character: Character, weapon: Equipment): number => {
  const isFinesse = weapon.properties?.includes('Finesse');
  const isRanged = weapon.weapon_range === 'Ranged';

  // Determine ability modifier
  let abilityMod = 0;
  if (isRanged || (isFinesse && character.abilities.DEX.modifier > character.abilities.STR.modifier)) {
    abilityMod = character.abilities.DEX.modifier;
  } else {
    abilityMod = character.abilities.STR.modifier;
  }

  // Add proficiency bonus if proficient
  const isProficient = character.proficiencies?.weapons?.some(w =>
    w.toLowerCase().includes(weapon.name.toLowerCase()) ||
    weapon.weapon_category?.toLowerCase() === w.toLowerCase()
  );

  return abilityMod + (isProficient ? character.proficiencyBonus : 0);
};

// Helper function to get weapon damage
const getWeaponDamage = (weapon: Equipment, character: Character): string => {
  if (!weapon.damage) return '0';

  const isFinesse = weapon.properties?.includes('Finesse');
  const isRanged = weapon.weapon_range === 'Ranged';

  // Determine ability modifier for damage
  let abilityMod = 0;
  if (isRanged || (isFinesse && character.abilities.DEX.modifier > character.abilities.STR.modifier)) {
    abilityMod = character.abilities.DEX.modifier;
  } else {
    abilityMod = character.abilities.STR.modifier;
  }

  const sign = abilityMod >= 0 ? '+' : '';
  return `${weapon.damage.damage_dice}${sign}${abilityMod}`;
};

export const AttacksAndActions: React.FC<AttacksAndActionsProps> = ({
  character,
  setRollResult: _setRollResult,
  onDiceRoll,
}) => {
  const allEquipment = loadEquipment();

  // Get equipped weapons
  const equippedWeapons = character.equippedWeapons?.map(slug =>
    allEquipment.find(eq => eq.slug === slug)
  ).filter(Boolean) as Equipment[] || [];

  // Check for Extra Attack feature (Fighter, etc.)
  const hasExtraAttack = character.level >= 5 && ['fighter', 'paladin', 'ranger'].includes(character.class);

  // Check for Two-Weapon Fighting style
  const hasTwoWeaponFighting = character.selectedFightingStyle === 'Two-Weapon Fighting';

  const handleWeaponAttack = (weapon: Equipment, isExtraAttack = false, isOffHand = false) => {
    const attackBonus = calculateAttackBonus(character, weapon);
    const attackRoll = `1d20${attackBonus >= 0 ? '+' : ''}${attackBonus}`;
    const damageRoll = getWeaponDamage(weapon, character);

    const rollText = `${isExtraAttack ? 'Extra Attack: ' : ''}${isOffHand ? 'Off-hand: ' : ''}${weapon.name} Attack`;

    // Create the roll object for the dice system
    const roll: CustomRoll = {
      id: `attack-${Date.now()}`,
      notation: attackRoll,
      type: 'attack' as const,
      description: rollText,
      damageNotation: damageRoll,
      damageType: weapon.damage?.damage_type || 'slashing',
      label: rollText,
      diceResults: [],
      modifier: 0,
      total: 0,
      timestamp: 0
    };

    onDiceRoll(roll);
  };

  const handleSpellAttack = () => {
    if (!character.spellcasting) return;

    const attackBonus = character.spellcasting.spellAttackBonus;
    const attackRoll = `1d20${attackBonus >= 0 ? '+' : ''}${attackBonus}`;

    const roll: CustomRoll = {
      id: `spell-attack-${Date.now()}`,
      notation: attackRoll,
      type: 'complex' as const,
      description: 'Spell Attack',
      label: 'Spell Attack',
      diceResults: [],
      modifier: 0,
      total: 0,
      timestamp: 0
    };

    onDiceRoll(roll);
  };

  const handleCantripAttack = (cantripSlug: string) => {
    if (!character.spellcasting) return;

    const attackBonus = character.spellcasting.spellAttackBonus;
    const attackRoll = `1d20${attackBonus >= 0 ? '+' : ''}${attackBonus}`;

    const roll: CustomRoll = {
      id: `cantrip-attack-${cantripSlug}-${Date.now()}`,
      notation: attackRoll,
      type: 'complex' as const,
      description: `${cantripSlug} Attack`,
      label: `${cantripSlug} Attack`,
      diceResults: [],
      modifier: 0,
      total: 0,
      timestamp: 0
    };

    onDiceRoll(roll);
  };

  const handleSavingThrow = (ability: keyof Character['abilities']) => {
    const modifier = character.abilities[ability].modifier;
    // TODO: Implement proper saving throw proficiency checking based on class features
    const isProficient = false; // Temporary fix - saving throw proficiency needs proper implementation
    const saveBonus = modifier + (isProficient ? character.proficiencyBonus : 0);
    const saveRoll = `1d20${saveBonus >= 0 ? '+' : ''}${saveBonus}`;

    const roll: CustomRoll = {
      id: `save-${ability}-${Date.now()}`,
      notation: saveRoll,
      type: 'saving-throw' as const,
      description: `${ability} Saving Throw`,
      label: `${ability} Saving Throw`,
      diceResults: [],
      modifier: 0,
      total: 0,
      timestamp: 0
    };

    onDiceRoll(roll);
  };

  const handleInitiative = () => {
    const initiativeRoll = `1d20${character.initiative >= 0 ? '+' : ''}${character.initiative}`;

    const roll: CustomRoll = {
      id: `initiative-${Date.now()}`,
      notation: initiativeRoll,
      type: 'initiative' as const,
      description: 'Initiative',
      label: 'Initiative',
      diceResults: [],
      modifier: 0,
      total: 0,
      timestamp: 0
    };

    onDiceRoll(roll);
  };

  const handleSkillCheck = (skillName: string, ability: keyof Character['abilities']) => {
    const skill = character.skills[skillName as keyof Character['skills']];
    const skillBonus = skill.value;
    const skillRoll = `1d20${skillBonus >= 0 ? '+' : ''}${skillBonus}`;

    const roll: CustomRoll = {
      id: `skill-${skillName}-${Date.now()}`,
      notation: skillRoll,
      type: 'skill' as const,
      description: `${skillName} (${ability}) Check`,
      label: `${skillName} (${ability}) Check`,
      diceResults: [],
      modifier: 0,
      total: 0,
      timestamp: 0
    };

    onDiceRoll(roll);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-red-500 border-b border-red-800 pb-1">⚔️ Attacks & Actions</h2>

      {/* Weapon Attacks */}
      {equippedWeapons.length > 0 && (
        <div className="p-4 bg-gray-800 rounded-xl shadow-lg border-l-4 border-red-500">
          <h3 className="text-lg font-bold text-red-400 mb-3">Weapon Attacks</h3>
          <div className="space-y-3">
            {equippedWeapons.map((weapon, index) => (
              <div key={weapon.slug} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                <div className="flex-1">
                  <div className="font-semibold text-white">{weapon.name}</div>
                  <div className="text-sm text-gray-400">
                    +{calculateAttackBonus(character, weapon)} to hit • {getWeaponDamage(weapon, character)} {weapon.damage?.damage_type}
                    {weapon.properties && weapon.properties.length > 0 && (
                      <span className="ml-2 text-xs">({weapon.properties.join(', ')})</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleWeaponAttack(weapon)}
                    className="px-3 py-2 bg-red-600 hover:bg-red-500 rounded text-sm font-medium transition-colors"
                  >
                    Attack
                  </button>
                  {hasExtraAttack && (
                    <button
                      onClick={() => handleWeaponAttack(weapon, true)}
                      className="px-3 py-2 bg-orange-600 hover:bg-orange-500 rounded text-sm font-medium transition-colors"
                    >
                      Extra
                    </button>
                  )}
                  {hasTwoWeaponFighting && weapon.properties?.includes('Light') && index === 0 && (
                    <button
                      onClick={() => handleWeaponAttack(weapon, false, true)}
                      className="px-3 py-2 bg-yellow-600 hover:bg-yellow-500 rounded text-sm font-medium transition-colors"
                    >
                      Off-hand
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spell Attacks */}
      {character.spellcasting && (
        <div className="p-4 bg-gray-800 rounded-xl shadow-lg border-l-4 border-purple-500">
          <h3 className="text-lg font-bold text-purple-400 mb-3">Spell Attacks</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-gray-700/50 rounded-lg">
              <div className="text-sm text-gray-400">Spell Attack</div>
              <div className="font-bold text-white">+{character.spellcasting.spellAttackBonus}</div>
              <button
                onClick={handleSpellAttack}
                className="mt-2 px-3 py-2 bg-purple-600 hover:bg-purple-500 rounded text-sm font-medium transition-colors w-full"
              >
                Roll Spell Attack
              </button>
            </div>
            <div className="p-3 bg-gray-700/50 rounded-lg">
              <div className="text-sm text-gray-400">Spell Save DC</div>
              <div className="font-bold text-white">{character.spellcasting.spellSaveDC}</div>
              <div className="text-xs text-gray-500 mt-1">Enemies roll against this DC</div>
            </div>
          </div>

          {/* Cantrips that make attacks */}
          {character.spellcasting.cantripsKnown.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Attack Cantrips</h4>
              <div className="grid grid-cols-2 gap-2">
                {character.spellcasting.cantripsKnown
                  .filter(cantrip => ['fire-bolt', 'shocking-grasp', 'ray-of-frost', 'magic-missile'].includes(cantrip))
                  .map(cantripSlug => (
                    <button
                      key={cantripSlug}
                      onClick={() => handleCantripAttack(cantripSlug)}
                      className="p-2 bg-purple-700 hover:bg-purple-600 rounded text-sm transition-colors text-left"
                    >
                      <div className="font-medium text-white">{cantripSlug.replace('-', ' ')}</div>
                      <div className="text-xs text-gray-400">+{character.spellcasting?.spellAttackBonus || 0} to hit</div>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Utility Actions */}
      <div className="p-4 bg-gray-800 rounded-xl shadow-lg border-l-4 border-blue-500">
        <h3 className="text-lg font-bold text-blue-400 mb-3">Quick Rolls</h3>

        {/* Initiative */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-300">Initiative</span>
            <span className="text-white font-medium">+{character.initiative}</span>
          </div>
          <button
            onClick={handleInitiative}
            className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium transition-colors"
          >
            Roll Initiative
          </button>
        </div>

        {/* Saving Throws */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-2">Saving Throws</h4>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(character.abilities) as Array<keyof Character['abilities']>).map(ability => {
              const modifier = character.abilities[ability].modifier;
              // TODO: Implement proper saving throw proficiency checking based on class features
              const isProficient = false; // Temporary fix - saving throw proficiency needs proper implementation
              const saveBonus = modifier + (isProficient ? character.proficiencyBonus : 0);

              return (
                <button
                  key={ability}
                  onClick={() => handleSavingThrow(ability)}
                  className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors text-left"
                >
                  <div className="font-medium text-white">{ability}</div>
                  <div className="text-xs text-gray-400">
                    {saveBonus >= 0 ? '+' : ''}{saveBonus}
                    {isProficient && <span className="text-yellow-400 ml-1">●</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Common Combat Skills */}
        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-2">Combat Skills</h4>
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: 'Athletics', ability: 'STR' as const },
              { name: 'Acrobatics', ability: 'DEX' as const },
              { name: 'SleightOfHand', ability: 'DEX' as const },
              { name: 'Stealth', ability: 'DEX' as const },
            ].map(({ name, ability }) => {
              const skill = character.skills[name as keyof Character['skills']];
              return (
                <button
                  key={name}
                  onClick={() => handleSkillCheck(name, ability)}
                  className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors text-left"
                >
                  <div className="font-medium text-white">{name.replace(/([A-Z])/g, ' $1').trim()}</div>
                  <div className="text-xs text-gray-400">
                    {skill.value >= 0 ? '+' : ''}{skill.value}
                    {skill.proficient && <span className="text-yellow-400 ml-1">●</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
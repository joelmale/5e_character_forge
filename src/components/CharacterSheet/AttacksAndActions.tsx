import React from 'react';
import { Character, Equipment } from '../../types/dnd';
import { loadEquipment, COMBAT_ACTIONS } from '../../services/dataService';
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
       id: `attack-${crypto.randomUUID()}`,
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
      id: `spell-attack-${crypto.randomUUID()}`,
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
      id: `cantrip-attack-${cantripSlug}-${crypto.randomUUID()}`,
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
      id: `save-${ability}-${crypto.randomUUID()}`,
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
      id: `initiative-${crypto.randomUUID()}`,
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
      id: `skill-${skillName}-${crypto.randomUUID()}`,
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

  const handleUnarmedStrike = () => {
    const strMod = character.abilities.STR.modifier;
    const attackBonus = strMod + character.proficiencyBonus;
    const attackRoll = `1d20${attackBonus >= 0 ? '+' : ''}${attackBonus}`;
    const damageRoll = `1${strMod >= 0 ? '+' : ''}${strMod}`;

    const roll: CustomRoll = {
      id: `unarmed-${crypto.randomUUID()}`,
      notation: attackRoll,
      type: 'attack' as const,
      description: 'Unarmed Strike',
      damageNotation: damageRoll,
      damageType: 'bludgeoning',
      label: 'Unarmed Strike',
      diceResults: [],
      modifier: 0,
      total: 0,
      timestamp: 0
    };

    onDiceRoll(roll);
  };

  const handleCombatAction = (actionSlug: string) => {
    const allActions = [...COMBAT_ACTIONS.basicActions, ...COMBAT_ACTIONS.classFeatureActions];
    const action = allActions.find(a => a.slug === actionSlug);
    if (!action) return;

    // Handle rollable actions
    if (action.rollType === 'skill' && action.ability && action.skill) {
      handleSkillCheck(action.skill, action.ability);
    } else if (action.rollType === 'healing' && action.notation) {
      const healingRoll = action.notation;
      const levelBonus = action.slug === 'second-wind' ? character.level : 0;
      const totalNotation = levelBonus > 0 ? `${healingRoll}+${levelBonus}` : healingRoll;

      const roll: CustomRoll = {
        id: `healing-${actionSlug}-${crypto.randomUUID()}`,
        notation: totalNotation,
        type: 'complex' as const,
        description: action.name,
        label: action.name,
        diceResults: [],
        modifier: 0,
        total: 0,
        timestamp: 0
      };

      onDiceRoll(roll);
    }
  };

  // Get class-specific combat actions
  const getClassActions = () => {
    const classSlug = character.class.toLowerCase();
    return COMBAT_ACTIONS.classFeatureActions.filter(action => {
      if (action.class !== classSlug) return false;
      if (action.minLevel && character.level < action.minLevel) return false;
      if (action.subclass && character.subclass?.toLowerCase() !== action.subclass) return false;
      return true;
    });
  };

  const classActions = getClassActions();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-red-500 border-b border-red-800 pb-1">⚔️ Attacks & Actions</h2>

      {/* Weapon Attacks */}
      {equippedWeapons.length > 0 && (
        <div className="p-4 bg-theme-secondary rounded-xl shadow-lg border-l-4 border-red-500">
          <h3 className="text-lg font-bold text-accent-red-light mb-3">Weapon Attacks</h3>
          <div className="space-y-3">
            {equippedWeapons.map((weapon, index) => (
              <div key={weapon.slug} className="flex items-center justify-between p-3 bg-theme-tertiary/50 rounded-lg">
                <div className="flex-1">
                  <div className="font-semibold text-theme-primary">{weapon.name}</div>
                  <div className="text-sm text-theme-muted">
                    +{calculateAttackBonus(character, weapon)} to hit • {getWeaponDamage(weapon, character)} {weapon.damage?.damage_type}
                    {weapon.properties && weapon.properties.length > 0 && (
                      <span className="ml-2 text-xs">({weapon.properties.join(', ')})</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleWeaponAttack(weapon)}
                    className="px-3 py-2 bg-accent-red hover:bg-accent-red-light rounded text-sm font-medium transition-colors"
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
                      className="px-3 py-2 bg-accent-yellow-dark hover:bg-accent-yellow rounded text-sm font-medium transition-colors"
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
        <div className="p-4 bg-theme-secondary rounded-xl shadow-lg border-l-4 border-accent-purple">
          <h3 className="text-lg font-bold text-accent-purple-light mb-3">Spell Attacks</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-theme-tertiary/50 rounded-lg">
              <div className="text-sm text-theme-muted">Spell Attack</div>
              <div className="font-bold text-theme-primary">+{character.spellcasting.spellAttackBonus}</div>
              <button
                onClick={handleSpellAttack}
                className="mt-2 px-3 py-2 bg-accent-purple hover:bg-accent-purple-light rounded text-sm font-medium transition-colors w-full"
              >
                Roll Spell Attack
              </button>
            </div>
            <div className="p-3 bg-theme-tertiary/50 rounded-lg">
              <div className="text-sm text-theme-muted">Spell Save DC</div>
              <div className="font-bold text-theme-primary">{character.spellcasting.spellSaveDC}</div>
              <div className="text-xs text-theme-disabled mt-1">Enemies roll against this DC</div>
            </div>
          </div>

          {/* Cantrips that make attacks */}
          {character.spellcasting.cantripsKnown.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-theme-tertiary mb-2">Attack Cantrips</h4>
              <div className="grid grid-cols-2 gap-2">
                {character.spellcasting.cantripsKnown
                  .filter(cantrip => ['fire-bolt', 'shocking-grasp', 'ray-of-frost', 'magic-missile'].includes(cantrip))
                  .map(cantripSlug => (
                    <button
                      key={cantripSlug}
                      onClick={() => handleCantripAttack(cantripSlug)}
                      className="p-2 bg-purple-700 hover:bg-accent-purple rounded text-sm transition-colors text-left"
                    >
                      <div className="font-medium text-theme-primary">{cantripSlug.replace('-', ' ')}</div>
                      <div className="text-xs text-theme-muted">+{character.spellcasting?.spellAttackBonus || 0} to hit</div>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Combat Actions */}
      <div className="p-4 bg-theme-secondary rounded-xl shadow-lg border-l-4 border-orange-500">
        <h3 className="text-lg font-bold text-orange-400 mb-3">Combat Actions</h3>

        {/* Unarmed Strike */}
        <div className="mb-4">
          <div className="flex items-center justify-between p-3 bg-theme-tertiary/50 rounded-lg">
            <div className="flex-1">
              <div className="font-semibold text-theme-primary">Unarmed Strike</div>
              <div className="text-sm text-theme-muted">
                +{character.abilities.STR.modifier + character.proficiencyBonus} to hit • 1{character.abilities.STR.modifier >= 0 ? '+' : ''}{character.abilities.STR.modifier} bludgeoning
              </div>
            </div>
            <button
              onClick={handleUnarmedStrike}
              className="px-3 py-2 bg-orange-600 hover:bg-orange-500 rounded text-sm font-medium transition-colors"
            >
              Attack
            </button>
          </div>
        </div>

        {/* Special Attacks */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-theme-tertiary mb-2">Special Attacks</h4>
          <div className="grid grid-cols-2 gap-2">
            {COMBAT_ACTIONS.basicActions
              .filter(action => action.category === 'special-attack')
              .map(action => (
                <button
                  key={action.slug}
                  onClick={() => handleCombatAction(action.slug)}
                  className="p-2 bg-orange-700 hover:bg-orange-600 rounded text-sm transition-colors text-left"
                >
                  <div className="font-medium text-theme-primary">{action.name}</div>
                  <div className="text-xs text-theme-muted truncate" title={action.description}>
                    {action.rollType === 'skill' && action.ability && action.skill && (
                      <>+{character.skills[action.skill as keyof Character['skills']].value} {action.skill}</>
                    )}
                  </div>
                </button>
              ))}
          </div>
        </div>

        {/* Class Features */}
        {classActions.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-theme-tertiary mb-2">Class Features</h4>
            <div className="space-y-2">
              {classActions.map(action => (
                <button
                  key={action.slug}
                  onClick={() => handleCombatAction(action.slug)}
                  className="w-full p-3 bg-orange-700 hover:bg-orange-600 rounded text-sm transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-theme-primary">{action.name}</div>
                    {action.usageType === 'limited' && action.usesPerLevel && (
                      <div className="text-xs text-orange-300">
                        {typeof action.usesPerLevel[character.level] === 'number'
                          ? `${action.usesPerLevel[character.level]}/${action.rechargeType === 'short' ? 'short rest' : 'long rest'}`
                          : action.usesPerLevel[character.level] === 'CHA'
                            ? `${character.abilities.CHA.modifier}/${action.rechargeType === 'short' ? 'short rest' : 'long rest'}`
                            : ''}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-theme-muted mt-1 line-clamp-2">{action.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tactical Actions */}
        <div>
          <h4 className="text-sm font-semibold text-theme-tertiary mb-2">Tactical Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            {COMBAT_ACTIONS.basicActions
              .filter(action => action.category === 'tactical')
              .map(action => (
                <button
                  key={action.slug}
                  onClick={() => handleCombatAction(action.slug)}
                  className="p-2 bg-theme-tertiary hover:bg-theme-quaternary rounded text-sm transition-colors text-left"
                  title={action.description}
                >
                  <div className="font-medium text-theme-primary">{action.name}</div>
                  <div className="text-xs text-theme-muted">
                    {action.rollType === 'skill' && action.ability && action.skill && (
                      <>+{character.skills[action.skill as keyof Character['skills']].value} {action.skill}</>
                    )}
                    {action.rollType === 'none' && <span className="text-orange-300">No roll</span>}
                  </div>
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
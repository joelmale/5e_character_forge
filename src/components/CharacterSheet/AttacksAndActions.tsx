import React from 'react';
import { Character, Equipment } from '../../types/dnd';
import { loadEquipment, COMBAT_ACTIONS } from '../../services/dataService';
import { DiceRoll } from '../../services/diceService';
import { consumeResource, getResourceUses } from '../../utils/resourceUtils';

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
  onUpdateCharacter: (character: Character) => void;
  layoutMode?: 'paper-sheet' | 'classic-dnd' | 'modern';
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
  onUpdateCharacter,
  layoutMode = 'modern',
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

  // Action Surge usage tracking (now uses resource system)
  const getActionSurgeInfo = () => {
    return getResourceUses(character, 'action-surge');
  };

  const canUseActionSurge = () => {
    const info = getActionSurgeInfo();
    return info.current > 0;
  };

  const useActionSurge = () => {
    if (canUseActionSurge()) {
      const updatedCharacter = consumeResource(character, 'action-surge');
      onUpdateCharacter(updatedCharacter);
    }
  };

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
    // Special handling for Action Surge
    if (actionSlug === 'action-surge') {
      if (canUseActionSurge()) {
        useActionSurge();
      }
      return;
    }

    const allActions = [
      ...COMBAT_ACTIONS.standardActions,
      ...COMBAT_ACTIONS.bonusActions,
      ...COMBAT_ACTIONS.reactions,
      ...COMBAT_ACTIONS.movement,
      ...COMBAT_ACTIONS.classFeatureActions
    ];
    const action = allActions.find(a => a.slug === actionSlug);

    // Consume resource if this action has limited uses
    if (action?.usageType === 'limited') {
      const updatedCharacter = consumeResource(character, actionSlug);
      onUpdateCharacter(updatedCharacter);
    }
    if (!action) return;

    // Handle rollable actions
    if (action.rollType === 'skill' && action.ability && action.skill) {
      handleSkillCheck(action.skill, action.ability);
    } else if (action.rollType === 'healing' && action.notation) {
      const healingRoll = action.notation;
      const levelBonus = action.slug === 'second-wind' && character.class.toLowerCase() === 'fighter' ? character.level : 0;
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

  // Determine color scheme based on layout mode
  const isPaperSheet = layoutMode === 'paper-sheet';
  const bgSecondaryClass = isPaperSheet ? 'bg-[#fcf6e3]' : 'bg-theme-secondary';
  const bgTertiaryClass = isPaperSheet ? 'bg-[#f5ebd2]' : 'bg-theme-tertiary/50';
  const textPrimaryClass = isPaperSheet ? 'text-[#1e140a]' : 'text-theme-primary';
  const textMutedClass = isPaperSheet ? 'text-[#3d2817]' : 'text-theme-muted';
  const textTertiaryClass = isPaperSheet ? 'text-[#3d2817]' : 'text-theme-tertiary';
  const borderClass = isPaperSheet ? 'border-[#1e140a]/20' : 'border-red-800';

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-red-500 border-b border-red-800 pb-1">⚔️ Attacks & Actions</h2>

      {/* Weapon Attacks */}
      {equippedWeapons.length > 0 && (
        <div className={`p-4 ${bgSecondaryClass} rounded-xl shadow-lg border-l-4 border-red-500`}>
          <h3 className="text-lg font-bold text-accent-red-light mb-3">Weapon Attacks</h3>
          <div className="space-y-3">
            {equippedWeapons.map((weapon, index) => (
              <div key={weapon.slug} className={`flex items-center justify-between p-3 ${bgTertiaryClass} rounded-lg`}>
                <div className="flex-1">
                  <div className={`font-semibold ${textPrimaryClass}`}>{weapon.name}</div>
                  <div className={`text-sm ${textMutedClass}`}>
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
        <div className={`p-4 ${bgSecondaryClass} rounded-xl shadow-lg border-l-4 border-accent-purple`}>
          <h3 className="text-lg font-bold text-accent-purple-light mb-3">Spell Attacks</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className={`p-3 ${bgTertiaryClass} rounded-lg`}>
              <div className={`text-sm ${textMutedClass}`}>Spell Attack</div>
              <div className={`font-bold ${textPrimaryClass}`}>+{character.spellcasting.spellAttackBonus}</div>
              <button
                onClick={handleSpellAttack}
                className="mt-2 px-3 py-2 bg-accent-purple hover:bg-accent-purple-light rounded text-sm font-medium transition-colors w-full"
              >
                Roll Spell Attack
              </button>
            </div>
            <div className={`p-3 ${bgTertiaryClass} rounded-lg`}>
              <div className={`text-sm ${textMutedClass}`}>Spell Save DC</div>
              <div className={`font-bold ${textPrimaryClass}`}>{character.spellcasting.spellSaveDC}</div>
              <div className="text-xs text-theme-disabled mt-1">Enemies roll against this DC</div>
            </div>
          </div>

          {/* Cantrips that make attacks */}
          {character.spellcasting.cantripsKnown.length > 0 && (
            <div>
              <h4 className={`text-sm font-semibold ${textTertiaryClass} mb-2`}>Attack Cantrips</h4>
              <div className="grid grid-cols-2 gap-2">
                {character.spellcasting.cantripsKnown
                  .filter(cantrip => ['fire-bolt', 'shocking-grasp', 'ray-of-frost', 'magic-missile'].includes(cantrip))
                  .map(cantripSlug => (
                    <button
                      key={cantripSlug}
                      onClick={() => handleCantripAttack(cantripSlug)}
                      className="p-2 bg-purple-700 hover:bg-accent-purple rounded text-sm transition-colors text-left"
                    >
                      <div className={`font-medium ${textPrimaryClass}`}>{cantripSlug.replace('-', ' ')}</div>
                      <div className={`text-xs ${textMutedClass}`}>+{character.spellcasting?.spellAttackBonus || 0} to hit</div>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Combat Actions */}
      <div className={`p-4 ${bgSecondaryClass} rounded-xl shadow-lg border-l-4 border-orange-500`}>
        <h3 className="text-lg font-bold text-orange-400 mb-3">Combat Actions</h3>

        {/* Unarmed Strike */}
        <div className="mb-4">
          <div className={`flex items-center justify-between p-3 ${bgTertiaryClass} rounded-lg`}>
            <div className="flex-1">
              <div className={`font-semibold ${textPrimaryClass}`}>Unarmed Strike</div>
              <div className={`text-sm ${textMutedClass}`}>
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
          <h4 className={`text-sm font-semibold ${textTertiaryClass} mb-2`}>Special Attacks</h4>
          <div className="grid grid-cols-2 gap-2">
            {COMBAT_ACTIONS.standardActions
              .filter(action => action.category === 'special-attack')
              .map(action => (
                <button
                  key={action.slug}
                  onClick={() => handleCombatAction(action.slug)}
                  className="p-2 bg-orange-700 hover:bg-orange-600 rounded text-sm transition-colors text-left"
                  title={action.summary}
                >
                  <div className={`font-medium ${textPrimaryClass}`}>{action.name}</div>
                  <div className={`text-xs ${textMutedClass} truncate`} title={action.description}>
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
            <h4 className={`text-sm font-semibold ${textTertiaryClass} mb-2`}>Class Features</h4>
            <div className="space-y-2">
              {classActions.map(action => (
                 action.slug === 'action-surge' ? (
                   // Special handling for Action Surge with spell slot-style bubbles
                   <div key={action.slug} className="w-full p-3 bg-orange-700 hover:bg-orange-600 rounded text-sm transition-colors">
                     <div className="flex items-center justify-between mb-2">
                       <span className={`${textMutedClass} text-xs`}>Action Surge</span>
                       <span className={`font-bold ${textPrimaryClass} text-xs`}>
                         {getActionSurgeInfo().current}/{getActionSurgeInfo().max} uses
                       </span>
                     </div>
                     <div className="flex items-center gap-1 justify-center flex-wrap mb-2">
                       {Array.from({ length: getActionSurgeInfo().max }, (_, surgeIndex) => (
                         <button
                           key={surgeIndex}
                           onClick={() => {
                             const current = getActionSurgeInfo().current;
                             if (surgeIndex < current) {
                               // Reset this use (mark as unused) - add back the use
                               const updatedCharacter = { ...character };
                               if (updatedCharacter.resources) {
                                 updatedCharacter.resources = updatedCharacter.resources.map(resource => {
                                   if (resource.id === 'action-surge') {
                                     return { ...resource, currentUses: (resource.currentUses || 0) + (current - surgeIndex) };
                                   }
                                   return resource;
                                 });
                               }
                               onUpdateCharacter(updatedCharacter);
                             } else if (surgeIndex === current && canUseActionSurge()) {
                               // Use Action Surge
                               useActionSurge();
                             }
                           }}
                           className={`w-4 h-4 rounded-full border-2 transition-colors ${
                             surgeIndex < getActionSurgeInfo().current
                               ? 'bg-accent-red-light border-red-400 cursor-pointer hover:bg-red-400'
                               : surgeIndex === getActionSurgeInfo().current && canUseActionSurge()
                               ? 'bg-orange-400 border-orange-300 cursor-pointer hover:bg-orange-300'
                               : 'bg-gray-700 border-gray-600'
                           }`}
                           title={
                             surgeIndex < getActionSurgeInfo().current
                               ? 'Click to reset this use'
                               : surgeIndex === getActionSurgeInfo().current && canUseActionSurge()
                               ? 'Click to use Action Surge'
                               : 'Unavailable'
                           }
                         />
                       ))}
                     </div>
                     <div className={`text-xs ${textMutedClass} line-clamp-2`}>{action.description}</div>
                   </div>
                ) : (
                  <button
                    key={action.slug}
                    onClick={() => handleCombatAction(action.slug)}
                    className="w-full p-3 bg-orange-700 hover:bg-orange-600 rounded text-sm transition-colors text-left"
                  >
                  <div className="flex items-center justify-between">
                    <div className={`font-medium ${textPrimaryClass}`}>{action.name}</div>
                    {action.usageType === 'limited' && (
                      <div className="text-xs text-orange-300">
                        {(() => {
                          const resourceInfo = getResourceUses(character, action.slug);
                          return resourceInfo.max > 0
                            ? `${resourceInfo.current}/${resourceInfo.max} ${action.rechargeType === 'short' ? 'short rest' : 'long rest'}`
                            : '';
                        })()}
                      </div>
                    )}
                  </div>
                    <div className={`text-xs ${textMutedClass} mt-1 line-clamp-2`}>{action.description}</div>
                  </button>
                )
              ))}
            </div>
          </div>
        )}

        {/* Tactical Actions */}
        <div>
          <h4 className={`text-sm font-semibold ${textTertiaryClass} mb-2`}>Tactical Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            {COMBAT_ACTIONS.standardActions
              .filter(action => action.category === 'tactical')
              .map(action => (
                <button
                  key={action.slug}
                  onClick={() => handleCombatAction(action.slug)}
                  className={`p-2 ${bgTertiaryClass} hover:bg-theme-quaternary rounded text-sm transition-colors text-left`}
                  title={action.summary}
                >
                  <div className={`font-medium ${textPrimaryClass}`}>{action.name}</div>
                  <div className={`text-xs ${textMutedClass}`}>
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
import React, { useState } from 'react';
import { Shield, Dice6, Footprints, Plus } from 'lucide-react';
import { Character } from '../../types/dnd';
import { createInitiativeRoll, createAdvantageRoll, createDisadvantageRoll, DiceRoll } from '../../services/diceService';
import { formatModifier } from '../../utils/formatters';
import { loadEquipment } from '../../services/dataService';
import { HitDice } from './HitDice';
import { DeathSaves } from './DeathSaves';

interface CombatStatsPanelProps {
  character: Character;
  setRollResult: (result: {
    text: string;
    value: number | null;
    details?: Array<{ value: number; kept: boolean; critical?: 'success' | 'failure' }>
  }) => void;
  onDiceRoll: (roll: DiceRoll) => void;
  onUpdateCharacter: (character: Character) => void;
}

type RollType = 'normal' | 'advantage' | 'disadvantage';

export const CombatStatsPanel: React.FC<CombatStatsPanelProps> = ({
  character,
  setRollResult,
  onDiceRoll,
  onUpdateCharacter,
}) => {
  const [initiativeRollType, setInitiativeRollType] = useState<RollType>('normal');
  const [tempHpInput, setTempHpInput] = useState('');

  const handleInitiativeRoll = (type: RollType = initiativeRollType) => {
    let roll;
    switch (type) {
      case 'advantage':
        roll = createAdvantageRoll('Initiative', character.initiative);
        break;
      case 'disadvantage':
        roll = createDisadvantageRoll('Initiative', character.initiative);
        break;
      default:
        roll = createInitiativeRoll(character.initiative);
    }

    const details = roll.pools && roll.pools.length > 0
      ? roll.pools[0].results.map((value) => ({
          value,
          kept: roll.diceResults.includes(value),
          critical: roll.diceResults.length === 1 && roll.diceResults[0] === value ? roll.critical : undefined
        }))
      : roll.diceResults.map((value) => ({
          value,
          kept: true,
          critical: roll.diceResults.length === 1 ? roll.critical : undefined
        }));

    setRollResult({
      text: `${roll.label}: ${roll.notation}`,
      value: roll.total,
      details
    });
    onDiceRoll(roll);
  };

  const getSpeed = () => {
    return character.speed;
  };

  const handleAddTempHp = () => {
    const amount = parseInt(tempHpInput);
    if (isNaN(amount) || amount <= 0) return;

    const currentTempHp = character.temporaryHitPoints || 0;
    const newTempHp = Math.max(0, currentTempHp + amount);

    onUpdateCharacter({
      ...character,
      temporaryHitPoints: newTempHp
    });
    setTempHpInput('');
  };

  const handleRemoveTempHp = () => {
    onUpdateCharacter({
      ...character,
      temporaryHitPoints: 0
    });
  };

  const getACBreakdown = () => {
    const breakdown = [];
    breakdown.push(`Base: 10 + ${character.abilities.DEX.modifier >= 0 ? '+' : ''}${character.abilities.DEX.modifier} DEX`);

    // Get equipped armor details
    const equippedArmor = character.equippedArmor
      ? loadEquipment().find(eq => eq.slug === character.equippedArmor)
      : null;

    // Get equipped shield
    const equippedShield = character.equippedWeapons?.find(slug => {
      const item = loadEquipment().find(eq => eq.slug === slug);
      return item?.equipment_category === 'Armor' && item.armor_category === 'Shield';
    });

    if (equippedArmor && equippedArmor.armor_class) {
      if (equippedArmor.armor_category === 'Light') {
        breakdown.push(`${equippedArmor.name}: ${equippedArmor.armor_class.base} + full DEX bonus`);
      } else if (equippedArmor.armor_category === 'Medium') {
        const dexBonus = Math.min(character.abilities.DEX.modifier, equippedArmor.armor_class.max_bonus || 2);
        breakdown.push(`${equippedArmor.name}: ${equippedArmor.armor_class.base} + ${dexBonus} DEX (max ${equippedArmor.armor_class.max_bonus || 2})`);
      } else if (equippedArmor.armor_category === 'Heavy') {
        breakdown.push(`${equippedArmor.name}: ${equippedArmor.armor_class.base} (no DEX bonus)`);
      }
    }

    if (equippedShield) {
      const shield = loadEquipment().find(eq => eq.slug === equippedShield);
      if (shield) {
        breakdown.push(`${shield.name}: +2 AC`);
      }
    }

    return breakdown;
  };

  return (
    <div className="space-y-3">
      {/* Top Row - AC, Initiative, Speed */}
      <div className="grid grid-cols-3 gap-3">
        {/* Armor Class */}
        <div
          className="flex flex-col items-center bg-theme-tertiary/50 p-3 rounded border border-theme-primary cursor-help"
          title={getACBreakdown().join('\n')}
        >
          <Shield className="w-5 h-5 text-red-500 mb-1" />
          <span className="text-xs font-semibold text-theme-muted uppercase">AC</span>
          <div className="text-3xl font-extrabold text-white">{character.armorClass}</div>
        </div>

        {/* Initiative */}
        <div className="relative">
          <button
            onClick={() => handleInitiativeRoll()}
            onContextMenu={(e) => {
              e.preventDefault();
              setInitiativeRollType(prev =>
                prev === 'normal' ? 'advantage' : prev === 'advantage' ? 'disadvantage' : 'normal'
              );
            }}
            className="flex flex-col items-center bg-theme-tertiary/50 p-3 rounded border border-theme-primary hover:bg-accent-red-dark/50 transition-colors cursor-pointer w-full h-full"
            title={`Roll Initiative (${initiativeRollType}) - Right-click to cycle`}
          >
            <div className="flex items-center gap-1 mb-1">
              <Dice6 className="w-5 h-5 text-red-500" />
              {initiativeRollType !== 'normal' && (
                <span className="text-xs font-bold text-accent-green-light">
                  {initiativeRollType === 'advantage' ? 'A' : 'D'}
                </span>
              )}
            </div>
            <span className="text-xs font-semibold text-theme-muted uppercase">Init</span>
            <div className="text-2xl font-extrabold text-accent-yellow-light">{formatModifier(character.initiative)}</div>
          </button>
        </div>

        {/* Speed */}
        <div className="flex flex-col items-center bg-theme-tertiary/50 p-3 rounded border border-theme-primary">
          <Footprints className="w-5 h-5 text-blue-500 mb-1" />
          <span className="text-xs font-semibold text-theme-muted uppercase">Speed</span>
          <div className="text-xl font-extrabold text-accent-blue-light">{getSpeed()} ft</div>
        </div>
      </div>

      {/* Middle Section - Hit Points */}
      <div className="bg-theme-tertiary/50 border border-theme-primary rounded p-3 space-y-2">
        {/* HP Maximum */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-theme-muted uppercase">Hit Point Maximum</span>
          <span className="text-lg font-bold text-white">{character.maxHitPoints}</span>
        </div>

        {/* Current HP */}
        <div className="flex items-center justify-between border-t border-theme-primary pt-2">
          <span className="text-xs font-semibold text-theme-muted uppercase">Current Hit Points</span>
          <div className="text-2xl font-extrabold text-accent-green-light">
            {character.hitPoints}
          </div>
        </div>

        {/* Temporary HP */}
        <div className="flex items-center justify-between border-t border-theme-primary pt-2">
          <span className="text-xs font-semibold text-theme-muted uppercase">Temporary Hit Points</span>
          <div className="flex items-center gap-2">
            {character.temporaryHitPoints && character.temporaryHitPoints > 0 ? (
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-accent-blue-light">+{character.temporaryHitPoints}</span>
                <button
                  onClick={handleRemoveTempHp}
                  className="text-xs text-accent-red-light hover:text-red-300"
                  title="Remove temporary HP"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={tempHpInput}
                  onChange={(e) => setTempHpInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTempHp()}
                  placeholder="0"
                  className="w-12 h-6 text-xs bg-theme-tertiary text-white rounded border border-theme-primary focus:border-blue-500 focus:outline-none text-center"
                  min="1"
                />
                <button
                  onClick={handleAddTempHp}
                  className="w-6 h-6 flex items-center justify-center bg-accent-blue hover:bg-accent-blue-light rounded text-white"
                  title="Add temporary HP"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row - Hit Dice & Death Saves */}
      <div className="grid grid-cols-2 gap-3">
        <HitDice
          character={character}
          onUpdateCharacter={onUpdateCharacter}
        />
        <DeathSaves
          character={character}
          onUpdateCharacter={onUpdateCharacter}
        />
      </div>
    </div>
  );
};

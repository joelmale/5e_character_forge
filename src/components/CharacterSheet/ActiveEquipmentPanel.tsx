import React from 'react';
import { Shield, Sword, Package } from 'lucide-react';
import { Character } from '../../types/dnd';
import { loadEquipment } from '../../services/dataService';

interface ActiveEquipmentPanelProps {
  character: Character;
}

export const ActiveEquipmentPanel: React.FC<ActiveEquipmentPanelProps> = ({
  character,
}) => {
  // Get equipped armor details
  const equippedArmor = character.equippedArmor
    ? loadEquipment().find(eq => eq.slug === character.equippedArmor)
    : null;

  // Get equipped weapons (excluding shields)
  const equippedWeapons = character.equippedWeapons?.filter(slug => {
    const item = loadEquipment().find(eq => eq.slug === slug);
    return item && item.equipment_category !== 'Armor'; // Exclude shields
  }) || [];

  // Get equipped shield
  const equippedShield = character.equippedWeapons?.find(slug => {
    const item = loadEquipment().find(eq => eq.slug === slug);
    return item?.equipment_category === 'Armor' && item.armor_category === 'Shield';
  });

  // Calculate AC breakdown
  const getACBreakdown = () => {
    const breakdown = [];
    breakdown.push(`Base: 10 + ${character.abilities.DEX.modifier >= 0 ? '+' : ''}${character.abilities.DEX.modifier} DEX`);

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
    <div className="space-y-4">
      {/* Equipped Armor Section */}
      <div>
        <div className="flex items-center gap-2 text-emerald-300 mb-2">
          <Shield className="w-4 h-4" />
          <span className="text-sm font-semibold">Armor</span>
        </div>
        {equippedArmor ? (
          <div className="bg-theme-tertiary/50 p-3 rounded-lg">
            <div className="font-semibold text-white">{equippedArmor.name}</div>
            <div className="text-sm text-theme-tertiary">
              AC Contribution: {getACBreakdown().slice(1).join(' + ')}
            </div>
          </div>
        ) : (
          <div className="text-sm text-theme-muted italic">No armor equipped</div>
        )}
      </div>

      {/* Equipped Weapons Section */}
      <div>
        <div className="flex items-center gap-2 text-emerald-300 mb-2">
          <Sword className="w-4 h-4" />
          <span className="text-sm font-semibold">Weapons</span>
        </div>
        {equippedWeapons.length > 0 ? (
          <div className="space-y-2">
            {equippedWeapons.map((weaponSlug, index) => {
              const weapon = loadEquipment().find(eq => eq.slug === weaponSlug);
              if (!weapon) return null;

              return (
                <div key={index} className="bg-theme-tertiary/50 p-3 rounded-lg">
                  <div className="font-semibold text-white">{weapon.name}</div>
                  <div className="text-sm text-theme-tertiary">
                    {weapon.weapon_range || 'Melee'} • {weapon.damage?.damage_dice || 'Special'}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-theme-muted italic">No weapons equipped</div>
        )}
      </div>

      {/* Active Items Section */}
      <div>
        <div className="flex items-center gap-2 text-emerald-300 mb-2">
          <Package className="w-4 h-4" />
          <span className="text-sm font-semibold">Active Items</span>
        </div>
        {character.inventory?.some(item => item.equipped) ? (
          <div className="space-y-2">
            {character.inventory
              .filter(item => item.equipped)
              .map((item, index) => {
                const itemData = loadEquipment().find(eq => eq.slug === item.equipmentSlug);
                return (
                  <div key={index} className="bg-theme-tertiary/50 p-2 rounded-lg">
                    <div className="font-semibold text-white text-sm">{itemData?.name || item.equipmentSlug}</div>
                    <div className="text-xs text-theme-muted">Equipped</div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="text-sm text-theme-muted italic">No active items</div>
        )}
      </div>
    </div>
  );
};
import React from 'react';
import { Box, Plus } from 'lucide-react';
import { Character, Equipment } from '../../types/dnd';
import { loadEquipment } from '../../services/dataService';
import { EquipmentModal } from './EquipmentModal';
import { EquipmentManagerModal } from './EquipmentManagerModal';
import { canEquipItem } from '../../utils/equipmentValidation';

interface EquipmentSectionProps {
  character: Character;
  onUpdateCharacter: (character: Character) => void;
  onEquipArmor: (characterId: string, armorSlug: string) => void;
  onEquipWeapon: (characterId: string, weaponSlug: string) => void;
  onUnequipItem: (characterId: string, itemSlug: string) => void;
  onAddItem: (characterId: string, equipmentSlug: string, quantity?: number) => void;
  onRemoveItem: (characterId: string, equipmentSlug: string, quantity?: number) => void;
  setEquipmentModal: (item: Equipment | null) => void;
  layoutMode?: 'paper-sheet' | 'classic-dnd' | 'modern';
}

export const EquipmentSection: React.FC<EquipmentSectionProps> = ({
  character,
  onUpdateCharacter: _onUpdateCharacter,
  onEquipArmor,
  onEquipWeapon,
  onUnequipItem,
  onAddItem,
  onRemoveItem,
  setEquipmentModal: _setEquipmentModal,
  layoutMode = 'modern',
}) => {
  const [selectedEquipment, setSelectedEquipment] = React.useState<Equipment | null>(null);
  const [equipError, setEquipError] = React.useState<string>('');
  const [equipmentManagerOpen, setEquipmentManagerOpen] = React.useState(false);
  const [filter, setFilter] = React.useState<'all' | 'weapons' | 'armor' | 'gear' | 'equipped'>('all');

  const handleEquipmentClick = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setEquipError('');
  };

  const handleEquipFromModal = () => {
    if (!selectedEquipment) return;

    const validation = canEquipItem(character, selectedEquipment);
    if (!validation.canEquip) {
      setEquipError(validation.reason || 'Cannot equip this item');
      return;
    }

    if (selectedEquipment.equipment_category === 'Armor') {
      onEquipArmor(character.id, selectedEquipment.slug);
    } else if (selectedEquipment.equipment_category === 'Weapon') {
      onEquipWeapon(character.id, selectedEquipment.slug);
    }

    setSelectedEquipment(null);
    setEquipError('');
  };

  const handleUnequipFromModal = () => {
    if (!selectedEquipment) return;

    onUnequipItem(character.id, selectedEquipment.slug);
    setSelectedEquipment(null);
    setEquipError('');
  };

  // Filter inventory items
  const filteredInventory = character.inventory?.filter(item => {
    const equipment = loadEquipment().find(eq => eq.slug === item.equipmentSlug);
    if (!equipment) return false;

    switch (filter) {
      case 'weapons':
        return equipment.equipment_category === 'Weapon';
      case 'armor':
        return equipment.equipment_category === 'Armor';
      case 'gear':
        return equipment.equipment_category === 'Adventuring Gear' || equipment.equipment_category === 'Tools';
      case 'equipped':
        return item.equipped ||
               character.equippedArmor === item.equipmentSlug ||
               character.equippedWeapons?.includes(item.equipmentSlug);
      default:
        return true;
    }
  }) || [];

  // Determine color scheme based on layout mode
  const isPaperSheet = layoutMode === 'paper-sheet';
  const bgSecondaryClass = isPaperSheet ? 'bg-[#fcf6e3]' : 'bg-theme-secondary';
  const bgTertiaryClass = isPaperSheet ? 'bg-[#f5ebd2]' : 'bg-theme-tertiary/50';
  const hoverBgClass = isPaperSheet ? 'hover:bg-[#ebe1c8]' : 'hover:bg-theme-tertiary';
  const textPrimaryClass = isPaperSheet ? 'text-[#1e140a]' : 'text-theme-primary';
  const textMutedClass = isPaperSheet ? 'text-[#3d2817]' : 'text-theme-muted';
  const textTertiaryClass = isPaperSheet ? 'text-[#3d2817]' : 'text-theme-tertiary';
  const textDisabledClass = isPaperSheet ? 'text-[#8b7355]' : 'text-theme-disabled';

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-orange-500 border-b border-orange-800 pb-1">Inventory</h2>

      {/* Inventory List - Full Width */}
      <div className={`p-4 ${bgSecondaryClass} rounded-xl shadow-lg border-l-4 border-yellow-500`}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold text-orange-500">
            Inventory ({character.inventory?.length || 0} items)
          </h3>
          <button
            onClick={() => setEquipmentManagerOpen(true)}
            className="px-3 py-2 bg-accent-blue hover:bg-accent-blue-light text-white rounded-lg flex items-center gap-2 transition-colors"
            title="Add items to inventory"
          >
            <Plus className="w-4 h-4" />
            Add Items
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { key: 'all', label: 'All', count: character.inventory?.length || 0 },
            { key: 'equipped', label: 'Equipped', count: character.inventory?.filter(item =>
              item.equipped ||
              character.equippedArmor === item.equipmentSlug ||
              character.equippedWeapons?.includes(item.equipmentSlug)
            ).length || 0 },
            { key: 'weapons', label: 'Weapons', count: character.inventory?.filter(item => {
              const equipment = loadEquipment().find(eq => eq.slug === item.equipmentSlug);
              return equipment?.equipment_category === 'Weapon';
            }).length || 0 },
            { key: 'armor', label: 'Armor', count: character.inventory?.filter(item => {
              const equipment = loadEquipment().find(eq => eq.slug === item.equipmentSlug);
              return equipment?.equipment_category === 'Armor';
            }).length || 0 },
            { key: 'gear', label: 'Gear/Tools', count: character.inventory?.filter(item => {
              const equipment = loadEquipment().find(eq => eq.slug === item.equipmentSlug);
              return equipment?.equipment_category === 'Adventuring Gear' || equipment?.equipment_category === 'Tools';
            }).length || 0 }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filter === key
                  ? 'bg-accent-blue text-white'
                  : `${bgTertiaryClass} ${textMutedClass} ${hoverBgClass}`
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        {(!filteredInventory || filteredInventory.length === 0) ? (
          <div className={`text-center py-8 ${textDisabledClass}`}>
            <Box className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">
              {filter === 'all' ? 'No items in inventory' : `No ${filter} items found`}
            </p>
            <p className="text-sm">
              {filter === 'all' ? 'Equipment is assigned during character creation' : 'Try a different filter'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
            {filteredInventory.map((item, idx) => {
              const equipment = loadEquipment().find(eq => eq.slug === item.equipmentSlug);
              const isWeapon = equipment?.weapon_category !== undefined;
              const isMastered = character.weaponMastery?.includes(item.equipmentSlug);
              const masteryProperty = equipment?.mastery;

              return (
                <div key={idx} className={`${bgTertiaryClass} p-2 rounded ${hoverBgClass} transition-colors`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => equipment && handleEquipmentClick(equipment)}
                          className={`font-semibold ${textPrimaryClass} hover:text-orange-300 transition-colors text-left`}
                        >
                          {equipment?.name || item.equipmentSlug}
                        </button>
                        {item.equipped && <span className="text-xs bg-accent-green px-2 py-0.5 rounded">Equipped</span>}
                        {/* Weapon Mastery Indicator */}
                        {isWeapon && isMastered && masteryProperty && (
                          <span
                            className="text-xs bg-amber-900/50 border border-amber-500/50 text-amber-300 px-2 py-0.5 rounded flex items-center gap-1"
                            title={`Mastery: ${masteryProperty.name}`}
                          >
                            ⚔️ {masteryProperty.name}
                          </span>
                        )}
                      </div>
                      <div className={`text-xs ${textMutedClass}`}>
                        Equipment | Weight: {item.quantity * 1} lb
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`font-mono text-sm ${textTertiaryClass}`}>×{item.quantity}</span>
                      <div className="flex gap-1">
                        {/* Equip/Unequip buttons */}
                        {equipment && (
                          <>
                            {equipment.equipment_category === 'Armor' && equipment.armor_category !== 'Shield' && (
                              <button
                                onClick={() => {
                                  if (item.equipped) {
                                    onUnequipItem(character.id, item.equipmentSlug);
                                  } else {
                                    onEquipArmor(character.id, item.equipmentSlug);
                                  }
                                }}
                                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                                  item.equipped
                                    ? 'bg-accent-red hover:bg-accent-red-light text-white'
                                    : 'bg-accent-green hover:bg-accent-green-dark text-white'
                                }`}
                                title={item.equipped ? 'Unequip armor' : 'Equip armor'}
                              >
                                {item.equipped ? 'Unequip' : 'Equip'}
                              </button>
                            )}
                            {equipment.equipment_category === 'Weapon' && (
                              <button
                                onClick={() => {
                                  if (item.equipped) {
                                    onUnequipItem(character.id, item.equipmentSlug);
                                  } else {
                                    onEquipWeapon(character.id, item.equipmentSlug);
                                  }
                                }}
                                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                                  item.equipped
                                    ? 'bg-accent-red hover:bg-accent-red-light text-white'
                                    : 'bg-accent-blue hover:bg-accent-blue-dark text-white'
                                }`}
                                title={item.equipped ? 'Unequip weapon' : 'Equip weapon'}
                              >
                                {item.equipped ? 'Unequip' : 'Equip'}
                              </button>
                            )}
                            {equipment.armor_category === 'Shield' && (
                              <button
                                onClick={() => {
                                  if (item.equipped) {
                                    onUnequipItem(character.id, item.equipmentSlug);
                                  } else {
                                    onEquipWeapon(character.id, item.equipmentSlug);
                                  }
                                }}
                                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                                  item.equipped
                                    ? 'bg-accent-red hover:bg-accent-red-light text-white'
                                    : 'bg-accent-purple hover:bg-accent-purple-dark text-white'
                                }`}
                                title={item.equipped ? 'Unequip shield' : 'Equip shield'}
                              >
                                {item.equipped ? 'Unequip' : 'Equip'}
                              </button>
                            )}
                          </>
                        )}
                        {/* Quantity adjustment buttons */}
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onAddItem(character.id, item.equipmentSlug, 1)}
                              className="w-5 h-5 bg-green-600 hover:bg-green-700 text-white rounded flex items-center justify-center text-xs font-bold"
                              title="Add 1 to inventory"
                            >
                              +
                            </button>
                            <button
                              onClick={() => onRemoveItem(character.id, item.equipmentSlug, 1)}
                              className="w-5 h-5 bg-red-600 hover:bg-red-700 text-white rounded flex items-center justify-center text-xs font-bold"
                              title={item.quantity > 1 ? "Use/consume 1 (reduce quantity)" : "Remove from inventory"}
                            >
                              −
                            </button>
                          </div>
                          <div className={`text-xs ${textMutedClass} text-center`}>
                            {item.quantity > 1 ? "Use" : "Remove"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        </div>

        {/* Equipment Modal */}
        <EquipmentModal
          equipment={selectedEquipment}
          isOpen={selectedEquipment !== null}
          onClose={() => {
            setSelectedEquipment(null);
            setEquipError('');
          }}
          onEquip={selectedEquipment ? handleEquipFromModal : undefined}
          onUnequip={selectedEquipment && (
            character.equippedArmor === selectedEquipment.slug ||
            character.equippedWeapons?.includes(selectedEquipment.slug)
          ) ? handleUnequipFromModal : undefined}
          canEquip={selectedEquipment ? canEquipItem(character, selectedEquipment).canEquip : true}
          equipError={equipError}
        />

        {/* Equipment Manager Modal */}
        <EquipmentManagerModal
          isOpen={equipmentManagerOpen}
          onClose={() => setEquipmentManagerOpen(false)}
          character={character}
          onAddItems={(items) => {
            // Use the existing onAddItem function for each item
            items.forEach(item => {
              for (let i = 0; i < item.quantity; i++) {
                onAddItem(character.id, item.equipmentSlug, 1);
              }
            });
            setEquipmentManagerOpen(false);
          }}
        />
    </div>
  );
};
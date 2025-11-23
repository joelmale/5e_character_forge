import React from 'react';
import { Plus, Box } from 'lucide-react';
import { Character, Equipment } from '../../types/dnd';
import { loadEquipment } from '../../services/dataService';

interface EquipmentSectionProps {
  character: Character;
  onUpdateCharacter: (character: Character) => void;
  onEquipArmor: (characterId: string, armorSlug: string) => void;
  onEquipWeapon: (characterId: string, weaponSlug: string) => void;
  onUnequipItem: (characterId: string, itemSlug: string) => void;
  onAddItem: (characterId: string, equipmentSlug: string, quantity?: number) => void;
  onRemoveItem: (characterId: string, equipmentSlug: string, quantity?: number) => void;
  setEquipmentModal: (item: Equipment | null) => void;
}

export const EquipmentSection: React.FC<EquipmentSectionProps> = ({
  character,
  onUpdateCharacter: _onUpdateCharacter,
  onEquipArmor: _onEquipArmor,
  onEquipWeapon: _onEquipWeapon,
  onUnequipItem: _onUnequipItem,
  onAddItem,
  onRemoveItem,
  setEquipmentModal,
}) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-orange-500 border-b border-orange-800 pb-1">Inventory</h2>

      {/* Inventory List - Full Width */}
      <div className="p-4 bg-theme-secondary rounded-xl shadow-lg border-l-4 border-yellow-500">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-bold text-accent-yellow-light">
            Inventory ({character.inventory?.length || 0} items)
          </h3>
          <button
            onClick={() => {
              // Show equipment browser modal
              onAddItem(character.id, 'random-item', 1);
            }}
            className="px-3 py-1 bg-accent-yellow-dark hover:bg-accent-yellow rounded text-xs transition-colors flex items-center gap-1"
            title="Add item from equipment database"
          >
            <Plus className="w-3 h-3" />
            Add Item
          </button>
        </div>

        {(!character.inventory || character.inventory.length === 0) ? (
          <div className="text-center py-8 text-theme-disabled">
            <Box className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No items in inventory</p>
            <p className="text-sm">Use the "Add Item" button to get started</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {character.inventory.map((item, idx) => {
              const equipment = loadEquipment().find(eq => eq.slug === item.equipmentSlug);
              const isWeapon = equipment?.weapon_category !== undefined;
              const isMastered = character.weaponMastery?.includes(item.equipmentSlug);
              const masteryProperty = equipment?.mastery;

              return (
                <div key={idx} className="bg-theme-tertiary/50 p-2 rounded hover:bg-theme-tertiary transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => {
                            setEquipmentModal(equipment || null);
                          }}
                          className="font-semibold text-theme-primary hover:text-orange-300 transition-colors text-left"
                        >
                          {item.equipmentSlug}
                        </button>
                        {item.equipped && <span className="text-xs bg-accent-green px-2 py-0.5 rounded">Equipped</span>}
                        {/* Weapon Mastery Indicator */}
                        {isWeapon && isMastered && masteryProperty && (
                          <span
                            className="text-xs bg-amber-900/50 border border-amber-500/50 text-amber-300 px-2 py-0.5 rounded flex items-center gap-1"
                            title={`Mastery: ${masteryProperty.name} - ${masteryProperty.description || 'Special weapon technique'}`}
                          >
                            ⚔️ {masteryProperty.name}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-theme-muted">
                        Equipment | Weight: {item.quantity * 1} lb
                      </div>
                    </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-mono text-sm text-theme-tertiary">×{item.quantity}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => onRemoveItem(character.id, item.equipmentSlug, 1)}
                        className="px-2 py-1 bg-accent-red hover:bg-accent-red-light rounded text-xs transition-colors"
                        title="Remove 1 from inventory"
                      >
                        −
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
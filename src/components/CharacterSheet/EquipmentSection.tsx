import React from 'react';
import { Plus, Box } from 'lucide-react';
import { Character } from '../../types/dnd';

interface EquipmentSectionProps {
  character: Character;
  onUpdateCharacter: (character: Character) => void;
  onEquipArmor: (characterId: string, armorSlug: string) => void;
  onEquipWeapon: (characterId: string, weaponSlug: string) => void;
  onUnequipItem: (characterId: string, itemSlug: string) => void;
  onAddItem: (characterId: string, equipmentSlug: string, quantity?: number) => void;
  onRemoveItem: (characterId: string, equipmentSlug: string, quantity?: number) => void;
  setEquipmentModal: (item: any) => void;
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
      <div className="p-4 bg-gray-800 rounded-xl shadow-lg border-l-4 border-yellow-500">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-bold text-yellow-400">
            Inventory ({character.inventory?.length || 0} items)
          </h3>
          <button
            onClick={() => {
              // Show equipment browser modal
              onAddItem(character.id, 'random-item', 1);
            }}
            className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 rounded text-xs transition-colors flex items-center gap-1"
            title="Add item from equipment database"
          >
            <Plus className="w-3 h-3" />
            Add Item
          </button>
        </div>

        {(!character.inventory || character.inventory.length === 0) ? (
          <div className="text-center py-8 text-gray-500">
            <Box className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No items in inventory</p>
            <p className="text-sm">Use the "Add Item" button to get started</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {character.inventory.map((item, idx) => (
              <div key={idx} className="bg-gray-700/50 p-2 rounded hover:bg-gray-700 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => setEquipmentModal({ slug: item.equipmentSlug })}
                        className="font-semibold text-white hover:text-orange-300 transition-colors text-left"
                      >
                        {item.equipmentSlug}
                      </button>
                      {item.equipped && <span className="text-xs bg-green-600 px-2 py-0.5 rounded">Equipped</span>}
                    </div>
                    <div className="text-xs text-gray-400">
                      Equipment | Weight: {item.quantity * 1} lb
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-mono text-sm text-gray-300">×{item.quantity}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => onRemoveItem(character.id, item.equipmentSlug, 1)}
                        className="px-2 py-1 bg-red-600 hover:bg-red-500 rounded text-xs transition-colors"
                        title="Remove 1 from inventory"
                      >
                        −
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
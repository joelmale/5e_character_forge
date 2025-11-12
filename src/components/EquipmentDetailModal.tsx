import React from 'react';
import { X, Sword, Shield, Package } from 'lucide-react';

interface Equipment {
  slug: string;
  name: string;
  year: number;
  equipment_category: string;
  cost: {
    quantity: number;
    unit: 'cp' | 'sp' | 'gp' | 'pp';
  };
  weight: number;
  description?: string;
  weapon_category?: 'Simple' | 'Martial';
  weapon_range?: 'Melee' | 'Ranged';
  damage?: {
    damage_dice: string;
    damage_type: string;
  };
  range?: {
    normal: number;
    long?: number;
  };
  properties?: string[];
  two_handed_damage?: {
    damage_dice: string;
    damage_type: string;
  };
  mastery?: string;
  armor_category?: 'Light' | 'Medium' | 'Heavy' | 'Shield';
  armor_class?: {
    base: number;
    dex_bonus: boolean;
    max_bonus?: number;
  };
  str_minimum?: number;
  stealth_disadvantage?: boolean;
  don_time?: string;
  doff_time?: string;
  tool_category?: string;
  gear_category?: string;
  contents?: Array<{ item_index: string; item_name: string; quantity: number }>;
  capacity?: string;
}

interface EquipmentDetailModalProps {
  equipment: Equipment | null;
  onClose: () => void;
}

export const EquipmentDetailModal: React.FC<EquipmentDetailModalProps> = ({ equipment, onClose }) => {
  if (!equipment) {
    return null;
  }

  const isWeapon = equipment.weapon_category;
  const isArmor = equipment.armor_category;
  const isGear = !isWeapon && !isArmor;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl border border-orange-700 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-orange-800 flex justify-between items-start sticky top-0 bg-gray-800 z-10">
          <div className="flex-grow">
            <div className="flex items-center gap-3 mb-2">
              {isWeapon && <Sword className="w-6 h-6 text-red-400" />}
              {isArmor && <Shield className="w-6 h-6 text-blue-400" />}
              {isGear && <Package className="w-6 h-6 text-yellow-400" />}
              <h3 className="text-2xl font-bold text-orange-400">{equipment.name}</h3>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <span className="bg-gray-700 px-2 py-1 rounded">{equipment.equipment_category}</span>
              <span className="bg-gray-700 px-2 py-1 rounded">SRD {equipment.year}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors ml-4"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          {equipment.description && (
            <div>
              <h4 className="text-lg font-bold text-orange-300 mb-2">Description</h4>
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{equipment.description}</p>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-700/50 p-3 rounded">
              <div className="text-xs text-gray-400 mb-1">Cost</div>
              <div className="text-lg font-bold text-yellow-300">
                {equipment.cost.quantity} {equipment.cost.unit}
              </div>
            </div>
            <div className="bg-gray-700/50 p-3 rounded">
              <div className="text-xs text-gray-400 mb-1">Weight</div>
              <div className="text-lg font-bold text-white">{equipment.weight} lb</div>
            </div>
          </div>

          {/* Weapon Stats */}
          {isWeapon && (
            <div>
              <h4 className="text-lg font-bold text-red-300 mb-3">Weapon Properties</h4>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-700/50 p-3 rounded">
                    <div className="text-xs text-gray-400 mb-1">Category</div>
                    <div className="text-sm font-bold text-white">
                      {equipment.weapon_category} {equipment.weapon_range}
                    </div>
                  </div>
                  {equipment.damage && (
                    <div className="bg-gray-700/50 p-3 rounded">
                      <div className="text-xs text-gray-400 mb-1">Damage</div>
                      <div className="text-sm font-bold text-green-300">
                        {equipment.damage.damage_dice} {equipment.damage.damage_type}
                      </div>
                    </div>
                  )}
                </div>

                {equipment.two_handed_damage && (
                  <div className="bg-blue-900/30 p-3 rounded border border-blue-700">
                    <div className="text-xs text-blue-400 mb-1">Versatile (Two-Handed)</div>
                    <div className="text-sm font-bold text-blue-300">
                      {equipment.two_handed_damage.damage_dice} {equipment.two_handed_damage.damage_type}
                    </div>
                  </div>
                )}

                {equipment.range && (
                  <div className="bg-gray-700/50 p-3 rounded">
                    <div className="text-xs text-gray-400 mb-1">Range</div>
                    <div className="text-sm font-bold text-white">
                      {equipment.range.normal} ft{equipment.range.long && ` / ${equipment.range.long} ft`}
                    </div>
                  </div>
                )}

                {equipment.properties && equipment.properties.length > 0 && (
                  <div className="bg-gray-700/50 p-3 rounded">
                    <div className="text-xs text-gray-400 mb-1">Properties</div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {equipment.properties.map((prop, idx) => (
                        <span key={idx} className="bg-gray-600 px-2 py-1 rounded text-xs text-gray-200">
                          {prop}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {equipment.mastery && (
                  <div className="bg-purple-900/30 p-3 rounded border border-purple-700">
                    <div className="text-xs text-purple-400 mb-1">Weapon Mastery (2024)</div>
                    <div className="text-sm font-bold text-purple-300">{equipment.mastery}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Armor Stats */}
          {isArmor && (
            <div>
              <h4 className="text-lg font-bold text-blue-300 mb-3">Armor Properties</h4>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-700/50 p-3 rounded">
                    <div className="text-xs text-gray-400 mb-1">Category</div>
                    <div className="text-sm font-bold text-white">{equipment.armor_category} Armor</div>
                  </div>
                  {equipment.armor_class && (
                    <div className="bg-gray-700/50 p-3 rounded">
                      <div className="text-xs text-gray-400 mb-1">Armor Class</div>
                      <div className="text-sm font-bold text-blue-300">
                        {equipment.armor_class.base}
                        {equipment.armor_class.dex_bonus && (
                          <span className="text-xs text-gray-400">
                            {' '}+ DEX {equipment.armor_class.max_bonus && `(max +${equipment.armor_class.max_bonus})`}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {equipment.str_minimum && equipment.str_minimum > 0 && (
                  <div className="bg-yellow-900/30 p-3 rounded border border-yellow-700">
                    <div className="text-xs text-yellow-400 mb-1">Strength Requirement</div>
                    <div className="text-sm font-bold text-yellow-300">STR {equipment.str_minimum}</div>
                  </div>
                )}

                {equipment.stealth_disadvantage && (
                  <div className="bg-red-900/30 p-3 rounded border border-red-700">
                    <div className="text-sm font-bold text-red-300">Stealth Disadvantage</div>
                    <div className="text-xs text-gray-400">This armor imposes disadvantage on Stealth checks</div>
                  </div>
                )}

                {equipment.don_time && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-700/50 p-3 rounded">
                      <div className="text-xs text-gray-400 mb-1">Don Time</div>
                      <div className="text-sm font-bold text-white">{equipment.don_time}</div>
                    </div>
                    <div className="bg-gray-700/50 p-3 rounded">
                      <div className="text-xs text-gray-400 mb-1">Doff Time</div>
                      <div className="text-sm font-bold text-white">{equipment.doff_time}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Container Contents */}
          {equipment.contents && equipment.contents.length > 0 && (
            <div>
              <h4 className="text-lg font-bold text-yellow-300 mb-3">Contains</h4>
              <div className="bg-gray-700/50 p-3 rounded">
                <ul className="space-y-1 text-sm">
                  {equipment.contents.map((item, idx) => (
                    <li key={idx} className="text-gray-300">
                      <span className="font-mono text-yellow-300">×{item.quantity}</span> {item.item_name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {equipment.capacity && (
            <div className="bg-gray-700/50 p-3 rounded">
              <div className="text-xs text-gray-400 mb-1">Capacity</div>
              <div className="text-sm font-bold text-white">{equipment.capacity}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

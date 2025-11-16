import React from 'react';
import { BookOpen, Trash2 } from 'lucide-react';
import { Character } from '../../types/dnd';
import { formatModifier } from '../../utils/formatters';

interface CharacterCardProps {
  character: Character;
  isSelected: boolean;
  onSelect: () => void;
  onView: () => void;
  onDelete: () => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  isSelected,
  onSelect,
  onView,
  onDelete,
}) => (
  <div className="bg-gray-800 rounded-xl shadow-xl hover:shadow-red-700/30 transition-shadow duration-300 overflow-hidden">
    <div className="p-5">
      {/* Checkbox for selection */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-grow">
          <h3 className="text-2xl font-bold text-red-400 truncate">{character.name}</h3>
          <p className="text-sm text-gray-400 mb-3">{character.race} | {character.class} (Level {character.level})</p>
        </div>
        <label className="flex items-center cursor-pointer ml-2" title="Select for export">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="w-5 h-5 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500 focus:ring-2 cursor-pointer"
          />
        </label>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs font-medium bg-gray-700/50 p-3 rounded-lg">
        <div>AC: <span className="text-yellow-300 block text-lg font-bold">{character.armorClass}</span></div>
        <div>HP: <span className="text-green-400 block text-lg font-bold">{character.hitPoints}</span></div>
        <div>Prof: <span className="text-yellow-300 block text-lg font-bold">{formatModifier(character.proficiencyBonus)}</span></div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center mt-4 space-x-3">
        <button
          onClick={onView}
          className="flex-grow py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white font-semibold transition-colors flex items-center justify-center text-sm"
        >
          <BookOpen className="w-4 h-4 mr-2" /> View Sheet
        </button>
        <button
          onClick={onDelete}
          className="p-2 bg-gray-600 hover:bg-red-700 rounded-lg transition-colors"
          title="Delete Character"
        >
          <Trash2 className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  </div>
);
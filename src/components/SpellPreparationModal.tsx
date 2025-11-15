// Spell Preparation Modal for Prepared Casters
import React, { useState, useEffect } from 'react';
import { X, Check, BookOpen } from 'lucide-react';
import { Character } from '../types/dnd';
import { AppSpell } from '../services/dataService';

interface SpellPreparationModalProps {
  character: Character;
  availableSpells: AppSpell[]; // All spells the character can prepare
  isOpen: boolean;
  onClose: () => void;
  onSave: (preparedSpells: string[]) => void;
}

export const SpellPreparationModal: React.FC<SpellPreparationModalProps> = ({
  character,
  availableSpells,
  isOpen,
  onClose,
  onSave
}) => {
  const [selectedSpells, setSelectedSpells] = useState<string[]>(
    character.spellcasting?.preparedSpells || []
  );

  // Calculate max prepared spells
  const maxPrepared = character.spellcasting ?
    Math.max(1, Math.floor((character.abilities[character.spellcasting.ability].score - 10) / 2) + character.level) : 0;

  useEffect(() => {
    if (isOpen) {
      setSelectedSpells(character.spellcasting?.preparedSpells || []);
    }
  }, [isOpen, character.spellcasting?.preparedSpells]);

  const handleSpellToggle = (spellSlug: string) => {
    setSelectedSpells(prev => {
      const isSelected = prev.includes(spellSlug);
      if (isSelected) {
        return prev.filter(s => s !== spellSlug);
      } else if (prev.length < maxPrepared) {
        return [...prev, spellSlug];
      }
      return prev;
    });
  };

  const handleSave = () => {
    onSave(selectedSpells);
    onClose();
  };

  if (!isOpen || !character.spellcasting) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Prepare Spells</h2>
              <p className="text-sm text-gray-400">
                {character.name} - {character.class} Level {character.level}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Stats */}
          <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Spellcasting Ability</div>
                <div className="font-semibold text-white">{character.spellcasting.ability}</div>
              </div>
              <div>
                <div className="text-gray-400">Spell Save DC</div>
                <div className="font-semibold text-white">{character.spellcasting.spellSaveDC}</div>
              </div>
              <div>
                <div className="text-gray-400">Spell Attack</div>
                <div className="font-semibold text-white">+{character.spellcasting.spellAttackBonus}</div>
              </div>
              <div>
                <div className="text-gray-400">Max Prepared</div>
                <div className="font-semibold text-white">{maxPrepared}</div>
              </div>
            </div>
          </div>

          {/* Selected Spells Summary */}
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-bold text-blue-400 mb-2">
              Currently Prepared ({selectedSpells.length}/{maxPrepared})
            </h3>
            {selectedSpells.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedSpells.map(spellSlug => {
                  const spell = availableSpells.find(s => s.slug === spellSlug);
                  return (
                    <span
                      key={spellSlug}
                      className="px-3 py-1 bg-blue-800 text-blue-100 rounded-full text-sm"
                    >
                      {spell?.name || spellSlug}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No spells prepared</p>
            )}
          </div>

          {/* Spell Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-yellow-400">Available Spells</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableSpells.map((spell) => {
                const isSelected = selectedSpells.includes(spell.slug);
                const canSelect = selectedSpells.length < maxPrepared || isSelected;

                return (
                  <button
                    key={spell.slug}
                    onClick={() => handleSpellToggle(spell.slug)}
                    disabled={!canSelect && !isSelected}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      isSelected
                        ? 'bg-green-900 border-green-500'
                        : canSelect
                        ? 'bg-gray-700 border-gray-600 hover:border-green-400'
                        : 'bg-gray-800 border-gray-700 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-white flex items-center gap-2">
                          {spell.name}
                          {isSelected && <Check className="w-4 h-4 text-green-400" />}
                        </div>
                        <div className="text-xs text-purple-300 mt-1 flex items-center gap-2">
                          {spell.school}
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                            spell.source === '2024'
                              ? 'bg-blue-900/50 text-blue-300 border border-blue-700'
                              : 'bg-gray-700/50 text-gray-300 border border-gray-600'
                          }`}>
                            {spell.source}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 mt-2 line-clamp-2">
                      {spell.description}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {spell.castingTime} • {spell.range}
                      {spell.concentration && ' • Concentration'}
                      {spell.ritual && ' • Ritual'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            Save Preparation
          </button>
        </div>
      </div>
    </div>
  );
};
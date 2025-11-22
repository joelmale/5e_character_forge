import React, { useState, useMemo } from 'react';
import { X, Check, Sparkles, BookOpen } from 'lucide-react';
import { SpellSelectionData } from '../types/dnd';
import { AppSpell, getCantripsByClass, getLeveledSpellsByClass } from '../services/dataService';
import { getSpellcastingType } from '../utils/spellUtils';
import { SPELL_LEARNING_RULES } from '../data/spellLearning';
import cantripsData from '../data/cantrips.json';

interface SpellEditModalProps {
  classSlug: string;
  level: number;
  currentSelection: SpellSelectionData;
  abilities: Record<string, number>;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newSelection: SpellSelectionData) => void;
}

const SpellEditModal: React.FC<SpellEditModalProps> = ({
  classSlug,
  level,
  currentSelection,
  abilities,
  isOpen,
  onClose,
  onSave
}) => {
  const spellcastingType = getSpellcastingType(classSlug);
  const learningRules = SPELL_LEARNING_RULES[classSlug];

  // Get available spells
  const availableCantrips = useMemo(() => getCantripsByClass(classSlug), [classSlug]);
  const availableSpells = useMemo(() => getLeveledSpellsByClass(classSlug, level), [classSlug, level]);

  // Calculate spell limits
  const numCantrips = (cantripsData as any)[classSlug]?.[level.toString()] || 0;
  const numSpells = useMemo(() => {
    if (spellcastingType === 'known' && learningRules?.spellsKnown) {
      return learningRules.spellsKnown[level - 1] || 0;
    } else if (spellcastingType === 'prepared' && learningRules?.spellsPrepared) {
      return learningRules.spellsPrepared[level - 1] || 0;
    } else if (spellcastingType === 'wizard' && learningRules?.spellbookCapacity) {
      return learningRules.spellbookCapacity[level - 1] || 6;
    }
    return 0;
  }, [spellcastingType, learningRules, level]);

  const numWizardPrepared = useMemo(() => {
    if (spellcastingType === 'wizard') {
      const intMod = Math.floor((abilities.INT - 10) / 2);
      return Math.max(1, intMod + level);
    }
    return 0;
  }, [spellcastingType, abilities, level]);

  // Local state for selections
  const [selectedCantrips, setSelectedCantrips] = useState<string[]>(currentSelection.selectedCantrips || []);
  const [selectedKnownSpells, setSelectedKnownSpells] = useState<string[]>(currentSelection.knownSpells || []);
  const [selectedPreparedSpells, setSelectedPreparedSpells] = useState<string[]>(currentSelection.preparedSpells || []);
  const [selectedSpellbook, setSelectedSpellbook] = useState<string[]>(currentSelection.spellbook || []);

  const handleCantripToggle = (spellSlug: string) => {
    setSelectedCantrips(prev => {
      const isSelected = prev.includes(spellSlug);
      if (isSelected) {
        return prev.filter(s => s !== spellSlug);
      } else if (prev.length < numCantrips) {
        return [...prev, spellSlug];
      }
      return prev;
    });
  };

  const handleSpellToggle = (spellSlug: string) => {
    if (spellcastingType === 'known') {
      setSelectedKnownSpells(prev => {
        const isSelected = prev.includes(spellSlug);
        if (isSelected) {
          return prev.filter(s => s !== spellSlug);
        } else if (prev.length < numSpells) {
          return [...prev, spellSlug];
        }
        return prev;
      });
    } else if (spellcastingType === 'prepared') {
      setSelectedPreparedSpells(prev => {
        const isSelected = prev.includes(spellSlug);
        if (isSelected) {
          return prev.filter(s => s !== spellSlug);
        } else if (prev.length < numSpells) {
          return [...prev, spellSlug];
        }
        return prev;
      });
    } else if (spellcastingType === 'wizard') {
      setSelectedSpellbook(prev => {
        const isSelected = prev.includes(spellSlug);
        if (isSelected) {
          return prev.filter(s => s !== spellSlug);
        } else if (prev.length < numSpells) {
          return [...prev, spellSlug];
        }
        return prev;
      });
    }
  };

  const handleWizardPreparedToggle = (spellSlug: string) => {
    setSelectedPreparedSpells(prev => {
      const isSelected = prev.includes(spellSlug);
      if (isSelected) {
        return prev.filter(s => s !== spellSlug);
      } else if (prev.length < numWizardPrepared) {
        return [...prev, spellSlug];
      }
      return prev;
    });
  };

  const handleSave = () => {
    const newSelection: SpellSelectionData = {
      selectedCantrips,
      knownSpells: spellcastingType === 'known' ? selectedKnownSpells : [],
      preparedSpells: spellcastingType === 'prepared' ? selectedPreparedSpells :
                      spellcastingType === 'wizard' ? selectedPreparedSpells : [],
      spellbook: spellcastingType === 'wizard' ? selectedSpellbook : undefined,
    };
    onSave(newSelection);
    onClose();
  };

  const getSpellInfo = (spell: AppSpell) => {
    return {
      name: spell.name,
      slug: spell.slug,
      level: spell.level,
      school: spell.school?.name || 'Unknown',
      castingTime: spell.casting_time || 'Unknown',
      range: spell.range || 'Unknown',
    };
  };

  if (!isOpen || !spellcastingType) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Edit Spells</h2>
              <p className="text-sm text-gray-400">
                Choose your starting spells for your {classSlug} character
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Cantrips Section */}
          {numCantrips > 0 && (
            <div className="mb-8">
              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-bold text-blue-400 mb-2">
                  Cantrips ({selectedCantrips.length}/{numCantrips})
                </h3>
                <p className="text-sm text-gray-400">
                  Select {numCantrips} cantrip{numCantrips !== 1 ? 's' : ''} to know
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableCantrips.map(spell => {
                  const isSelected = selectedCantrips.includes(spell.slug);
                  return (
                    <button
                      key={spell.slug}
                      onClick={() => handleCantripToggle(spell.slug)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        isSelected
                          ? 'bg-blue-800 border-blue-500 shadow-md'
                          : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                      }`}
                      disabled={!isSelected && selectedCantrips.length >= numCantrips}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-white">{spell.name}</h4>
                        {isSelected && <Check className="w-5 h-5 text-blue-400 flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-400">{spell.school?.name || 'Cantrip'}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Spells Section - Known Casters */}
          {spellcastingType === 'known' && numSpells > 0 && (
            <div className="mb-8">
              <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-bold text-purple-400 mb-2">
                  Known Spells ({selectedKnownSpells.length}/{numSpells})
                </h3>
                <p className="text-sm text-gray-400">
                  Select {numSpells} spell{numSpells !== 1 ? 's' : ''} to add to your known spells
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableSpells.map(spell => {
                  const isSelected = selectedKnownSpells.includes(spell.slug);
                  return (
                    <button
                      key={spell.slug}
                      onClick={() => handleSpellToggle(spell.slug)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        isSelected
                          ? 'bg-purple-800 border-purple-500 shadow-md'
                          : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                      }`}
                      disabled={!isSelected && selectedKnownSpells.length >= numSpells}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-white">{spell.name}</h4>
                        {isSelected && <Check className="w-5 h-5 text-purple-400 flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-400">Level {spell.level} • {spell.school?.name || 'Unknown'}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Spells Section - Prepared Casters */}
          {spellcastingType === 'prepared' && numSpells > 0 && (
            <div className="mb-8">
              <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-bold text-green-400 mb-2">
                  Prepared Spells ({selectedPreparedSpells.length}/{numSpells})
                </h3>
                <p className="text-sm text-gray-400">
                  Select {numSpells} spell{numSpells !== 1 ? 's' : ''} to prepare today
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableSpells.map(spell => {
                  const isSelected = selectedPreparedSpells.includes(spell.slug);
                  return (
                    <button
                      key={spell.slug}
                      onClick={() => handleSpellToggle(spell.slug)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        isSelected
                          ? 'bg-green-800 border-green-500 shadow-md'
                          : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                      }`}
                      disabled={!isSelected && selectedPreparedSpells.length >= numSpells}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-white">{spell.name}</h4>
                        {isSelected && <Check className="w-5 h-5 text-green-400 flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-400">Level {spell.level} • {spell.school?.name || 'Unknown'}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Spells Section - Wizard (Spellbook + Prepared) */}
          {spellcastingType === 'wizard' && (
            <>
              {/* Spellbook */}
              <div className="mb-8">
                <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-bold text-purple-400">
                      Spellbook ({selectedSpellbook.length}/{numSpells})
                    </h3>
                  </div>
                  <p className="text-sm text-gray-400">
                    Select {numSpells} spell{numSpells !== 1 ? 's' : ''} for your spellbook
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableSpells.map(spell => {
                    const isSelected = selectedSpellbook.includes(spell.slug);
                    return (
                      <button
                        key={spell.slug}
                        onClick={() => handleSpellToggle(spell.slug)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          isSelected
                            ? 'bg-purple-800 border-purple-500 shadow-md'
                            : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                        }`}
                        disabled={!isSelected && selectedSpellbook.length >= numSpells}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-white">{spell.name}</h4>
                          {isSelected && <Check className="w-5 h-5 text-purple-400 flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-gray-400">Level {spell.level} • {spell.school?.name || 'Unknown'}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Prepared from Spellbook */}
              {selectedSpellbook.length > 0 && (
                <div className="mb-8">
                  <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-4">
                    <h3 className="text-lg font-bold text-blue-400 mb-2">
                      Daily Prepared Spells ({selectedPreparedSpells.length}/{numWizardPrepared})
                    </h3>
                    <p className="text-sm text-gray-400">
                      Select {numWizardPrepared} spell{numWizardPrepared !== 1 ? 's' : ''} from your spellbook to prepare
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedSpellbook.map(spellSlug => {
                      const spell = availableSpells.find(s => s.slug === spellSlug);
                      if (!spell) return null;
                      const isSelected = selectedPreparedSpells.includes(spell.slug);
                      return (
                        <button
                          key={spell.slug}
                          onClick={() => handleWizardPreparedToggle(spell.slug)}
                          className={`p-4 rounded-lg border-2 transition-all text-left ${
                            isSelected
                              ? 'bg-blue-800 border-blue-500 shadow-md'
                              : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                          }`}
                          disabled={!isSelected && selectedPreparedSpells.length >= numWizardPrepared}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-white">{spell.name}</h4>
                            {isSelected && <Check className="w-5 h-5 text-blue-400 flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-gray-400">Level {spell.level} • {spell.school?.name || 'Unknown'}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700 bg-gray-900">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white font-semibold transition-colors flex items-center gap-2"
          >
            <Check className="w-5 h-5" />
            Save Spells
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpellEditModal;

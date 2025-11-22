import React, { useState, useMemo } from 'react';
import { X, Check, Plus, Minus } from 'lucide-react';

interface AbilityScoreEditModalProps {
  currentScores: Record<string, number>;
  isOpen: boolean;
  onClose: () => void;
  onSave: (scores: Record<string, number>) => void;
}

const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
const ABILITY_NAMES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
const ABILITY_FULL_NAMES: Record<string, string> = {
  STR: 'Strength',
  DEX: 'Dexterity',
  CON: 'Constitution',
  INT: 'Intelligence',
  WIS: 'Wisdom',
  CHA: 'Charisma'
};

const AbilityScoreEditModal: React.FC<AbilityScoreEditModalProps> = ({
  currentScores,
  isOpen,
  onClose,
  onSave
}) => {
  const [scores, setScores] = useState<Record<string, number>>(currentScores);

  // Calculate available values from standard array
  const availableValues = useMemo(() => {
    const usedValues = Object.values(scores);
    return STANDARD_ARRAY.filter(val => {
      const timesUsed = usedValues.filter(used => used === val).length;
      const timesInArray = STANDARD_ARRAY.filter(arrayVal => arrayVal === val).length;
      return timesUsed < timesInArray;
    });
  }, [scores]);

  // Calculate points available (should be 0 when using standard array correctly)
  const pointsAvailable = useMemo(() => {
    const totalUsed = Object.values(scores).reduce((sum, val) => sum + val, 0);
    const totalArray = STANDARD_ARRAY.reduce((sum, val) => sum + val, 0);
    return totalArray - totalUsed;
  }, [scores]);

  const handleIncrease = (ability: string) => {
    const currentValue = scores[ability];
    const sortedAvailable = [...availableValues, currentValue].sort((a, b) => b - a);
    const currentIndex = sortedAvailable.indexOf(currentValue);

    if (currentIndex > 0) {
      const nextValue = sortedAvailable[currentIndex - 1];
      setScores({ ...scores, [ability]: nextValue });
    }
  };

  const handleDecrease = (ability: string) => {
    const currentValue = scores[ability];
    const sortedAvailable = [...availableValues, currentValue].sort((a, b) => b - a);
    const currentIndex = sortedAvailable.indexOf(currentValue);

    if (currentIndex < sortedAvailable.length - 1) {
      const nextValue = sortedAvailable[currentIndex + 1];
      setScores({ ...scores, [ability]: nextValue });
    }
  };

  const getModifier = (score: number) => {
    return Math.floor((score - 10) / 2);
  };

  const handleSave = () => {
    if (pointsAvailable === 0) {
      onSave(scores);
      onClose();
    }
  };

  const handleReset = () => {
    setScores(currentScores);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white">Edit Ability Scores</h2>
            <p className="text-sm text-gray-400">
              Redistribute the standard array values (15, 14, 13, 12, 10, 8)
            </p>
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
          {/* Points Available */}
          <div className={`mb-6 p-4 rounded-lg border-2 ${
            pointsAvailable === 0
              ? 'bg-green-900/20 border-green-700'
              : 'bg-yellow-900/20 border-yellow-700'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Points Avail</h3>
                <p className="text-xs text-gray-400">
                  {pointsAvailable === 0
                    ? 'All standard array values assigned correctly'
                    : 'Adjust scores to use all standard array values'
                  }
                </p>
              </div>
              <div className={`text-3xl font-bold ${
                pointsAvailable === 0 ? 'text-green-400' : 'text-yellow-400'
              }`}>
                {pointsAvailable}
              </div>
            </div>
          </div>

          {/* Ability Scores Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {ABILITY_NAMES.map(ability => {
              const score = scores[ability];
              const modifier = getModifier(score);
              const canIncrease = availableValues.some(val => val > score);
              const canDecrease = availableValues.some(val => val < score) || score > Math.min(...STANDARD_ARRAY);

              return (
                <div key={ability} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-400 uppercase">{ability}</h4>
                      <p className="text-xs text-gray-500">{ABILITY_FULL_NAMES[ability]}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-yellow-300">{score}</div>
                      <div className="text-sm text-green-400">
                        {modifier >= 0 ? '+' : ''}{modifier}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDecrease(ability)}
                      disabled={!canDecrease}
                      className={`flex-1 px-3 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1 ${
                        canDecrease
                          ? 'bg-red-700 hover:bg-red-600 text-white'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleIncrease(ability)}
                      disabled={!canIncrease}
                      className={`flex-1 px-3 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1 ${
                        canIncrease
                          ? 'bg-green-700 hover:bg-green-600 text-white'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Standard Array Reference */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-400 mb-2">Standard Array Values</h4>
            <div className="flex gap-2 flex-wrap">
              {STANDARD_ARRAY.map((value, idx) => (
                <div key={idx} className="px-3 py-1 bg-gray-600 rounded text-center">
                  <div className="text-lg font-bold text-yellow-300">{value}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Each value must be used exactly once across all six abilities
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700 bg-gray-900">
          <button
            onClick={handleReset}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
          >
            Reset
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={pointsAvailable !== 0}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                pointsAvailable === 0
                  ? 'bg-purple-600 hover:bg-purple-500 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Check className="w-5 h-5" />
              Save Scores
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AbilityScoreEditModal;

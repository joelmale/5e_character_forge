import React, { useState } from 'react';
import { AlertTriangle, X, Plus } from 'lucide-react';
import { Character } from '../../types/dnd';

interface ConditionsProps {
  character: Character;
  onUpdateCharacter: (character: Character) => void;
}

export const Conditions: React.FC<ConditionsProps> = ({
  character,
  onUpdateCharacter,
}) => {
  const [newCondition, setNewCondition] = useState('');

  // Common D&D 5e conditions
  const commonConditions = [
    'Blinded', 'Charmed', 'Deafened', 'Frightened', 'Grappled',
    'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified', 'Poisoned',
    'Prone', 'Restrained', 'Stunned', 'Unconscious'
  ];

  const activeConditions = character.conditions || [];

  const addCondition = (condition: string) => {
    if (!condition.trim() || activeConditions.includes(condition)) return;

    const updatedCharacter = {
      ...character,
      conditions: [...activeConditions, condition]
    };

    onUpdateCharacter(updatedCharacter);
    setNewCondition('');
  };

  const removeCondition = (condition: string) => {
    const updatedCharacter = {
      ...character,
      conditions: activeConditions.filter(c => c !== condition)
    };

    onUpdateCharacter(updatedCharacter);
  };

  const addCustomCondition = () => {
    if (newCondition.trim()) {
      addCondition(newCondition.trim());
    }
  };

  return (
    <div className="bg-red-900 rounded-xl shadow-lg border-l-4 border-yellow-500 p-4">
      <h3 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5" />
        Conditions
      </h3>

      {/* Active Conditions */}
      {activeConditions.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-red-300 mb-2">Active Conditions:</h4>
          <div className="flex flex-wrap gap-2">
            {activeConditions.map((condition, index) => (
              <div
                key={index}
                className="flex items-center gap-1 px-3 py-1 bg-red-800/70 rounded-full text-sm text-white"
              >
                <span>{condition}</span>
                <button
                  onClick={() => removeCondition(condition)}
                  className="ml-1 hover:bg-red-700 rounded-full p-0.5"
                  title={`Remove ${condition}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Condition */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={newCondition}
            onChange={(e) => setNewCondition(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addCustomCondition()}
            placeholder="Add custom condition"
            className="flex-1 px-3 py-2 bg-gray-800 text-white rounded border border-gray-600 focus:border-yellow-500 focus:outline-none"
          />
          <button
            onClick={addCustomCondition}
            className="px-2 py-2 bg-yellow-600 hover:bg-yellow-500 rounded transition-colors flex items-center justify-center"
            title="Add condition"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Common Conditions */}
        <div>
          <h4 className="text-sm font-semibold text-red-300 mb-2">Common Conditions:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {commonConditions
              .filter(condition => !activeConditions.includes(condition))
              .map((condition, index) => (
              <button
                key={index}
                onClick={() => addCondition(condition)}
                className="px-2 py-1 bg-gray-800/50 hover:bg-red-800/70 rounded text-xs text-gray-300 hover:text-white transition-colors text-left"
                title={`Add ${condition}`}
              >
                {condition}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Condition Effects Summary */}
      {activeConditions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-600">
          <div className="text-xs text-gray-400 text-center">
            Active conditions may affect ability checks, attacks, and movement
          </div>
        </div>
      )}
    </div>
  );
};
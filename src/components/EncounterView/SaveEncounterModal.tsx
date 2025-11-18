import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useMonsterContext } from '../../hooks';

interface SaveEncounterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const SaveEncounterModal: React.FC<SaveEncounterModalProps> = ({ isOpen, onClose, onSave }) => {
  const { saveEncounter, selectedEncounterMonsters, allMonsters } = useMonsterContext();
  const [encounterName, setEncounterName] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const totalMonsters = Object.values(selectedEncounterMonsters).reduce((sum, qty) => sum + qty, 0);
  const uniqueMonsters = Object.keys(selectedEncounterMonsters).length;

  const handleSave = async () => {
    if (!encounterName.trim()) {
      alert('Please enter a name for this encounter');
      return;
    }

    setSaving(true);
    try {
      const success = await saveEncounter(encounterName.trim());
      if (success) {
        setEncounterName('');
        onSave();
      } else {
        alert('Failed to save encounter. Please try again.');
      }
    } catch (err) {
      console.error('Error saving encounter:', err);
      alert('Failed to save encounter. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setEncounterName('');
    onClose();
  };

  // Get monster names for preview
  const monsterNames = Object.keys(selectedEncounterMonsters).map((monsterId) => {
    const monster = allMonsters.find((m) => m.index === monsterId);
    const quantity = selectedEncounterMonsters[monsterId];
    return monster ? `${monster.name} x${quantity}` : null;
  }).filter(Boolean);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 to-red-900 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Save Encounter</h2>
          <button
            onClick={handleClose}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Encounter Name Input */}
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">
              Encounter Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={encounterName}
              onChange={(e) => setEncounterName(e.target.value)}
              placeholder="e.g., Goblin Ambush, Dragon's Lair"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSave();
                }
              }}
            />
          </div>

          {/* Encounter Summary */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="font-bold text-purple-400 mb-3">Encounter Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Monsters:</span>
                <span className="text-white font-bold">{totalMonsters}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Unique Types:</span>
                <span className="text-white font-bold">{uniqueMonsters}</span>
              </div>
            </div>
          </div>

          {/* Monster List Preview */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="font-bold text-purple-400 mb-3">Monsters in Encounter</h3>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {monsterNames.map((name, index) => (
                <div key={index} className="text-sm text-gray-300 py-1 border-b border-gray-700 last:border-0">
                  {name}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={saving || !encounterName.trim()}
            >
              {saving ? 'Saving...' : 'Save Encounter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

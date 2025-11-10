import React, { useState } from 'react';
import { History, X, Trash2 } from 'lucide-react';
import type { DiceRoll } from '../utils/diceRoller';
import { clearRollHistory } from '../utils/diceRoller';

interface RollHistoryProps {
  rolls: DiceRoll[];
  onClear: () => void;
}

export const RollHistoryTicker: React.FC<RollHistoryProps> = ({ rolls }) => {
  if (rolls.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800/95 border-t border-gray-700 py-2 px-4 z-30 overflow-hidden">
      <div className="max-w-7xl mx-auto flex items-center gap-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        <span className="text-xs font-bold text-gray-400 whitespace-nowrap">
          Recent Rolls:
        </span>
        <div className="flex gap-4 flex-nowrap">
          {rolls.slice().reverse().map((roll) => (
            <div
              key={roll.id}
              className="flex items-center gap-2 text-sm whitespace-nowrap"
            >
              <span className="text-gray-300">{roll.label}:</span>
              <span className="font-mono text-yellow-300">{roll.notation}</span>
              <span className="text-gray-500">→</span>
              <span
                className={`font-bold ${
                  roll.critical === 'success'
                    ? 'text-green-400'
                    : roll.critical === 'failure'
                    ? 'text-red-400'
                    : 'text-white'
                }`}
              >
                {roll.total}
              </span>
              {roll.critical && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-700">
                  {roll.critical === 'success' ? 'CRIT!' : 'FAIL!'}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const RollHistoryModal: React.FC<RollHistoryProps> = ({
  rolls,
  onClear,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-red-600 hover:bg-red-500 rounded-full shadow-lg transition-colors z-30"
        title="View Roll History"
      >
        <History className="w-6 h-6 text-white" />
      </button>
    );
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-700 p-4">
          <h2 className="text-xl font-bold text-red-500 flex items-center gap-2">
            <History className="w-5 h-5" />
            Roll History
          </h2>
          <div className="flex gap-2">
            {rolls.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Clear all roll history?')) {
                    onClear();
                  }
                }}
                className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                title="Clear History"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
          {rolls.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-semibold">No rolls yet</p>
              <p className="text-sm">
                Click on ability scores or skills to roll dice
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rolls
                .slice()
                .reverse()
                .map((roll) => (
                  <div
                    key={roll.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      roll.critical === 'success'
                        ? 'bg-green-900/20 border-green-500'
                        : roll.critical === 'failure'
                        ? 'bg-red-900/20 border-red-500'
                        : 'bg-gray-700/50 border-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">
                          {roll.label}
                        </span>
                        {roll.critical && (
                          <span
                            className={`text-xs px-2 py-1 rounded font-bold ${
                              roll.critical === 'success'
                                ? 'bg-green-500 text-white'
                                : 'bg-red-500 text-white'
                            }`}
                          >
                            {roll.critical === 'success'
                              ? 'CRITICAL SUCCESS!'
                              : 'CRITICAL FAILURE!'}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatTime(roll.timestamp)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-lg">
                      <span className="font-mono text-yellow-300">
                        {roll.notation}
                      </span>
                      <span className="text-gray-500">→</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">
                          [
                          {roll.diceResults.map((die, i) => (
                            <span key={i}>
                              {die}
                              {i < roll.diceResults.length - 1 && ', '}
                            </span>
                          ))}
                          ]
                        </span>
                        {roll.modifier !== 0 && (
                          <span className="text-sm text-gray-400">
                            {roll.modifier > 0 ? '+' : ''}
                            {roll.modifier}
                          </span>
                        )}
                        <span className="text-gray-500">=</span>
                        <span
                          className={`text-2xl font-bold ${
                            roll.critical === 'success'
                              ? 'text-green-400'
                              : roll.critical === 'failure'
                              ? 'text-red-400'
                              : 'text-white'
                          }`}
                        >
                          {roll.total}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RollHistoryModal;

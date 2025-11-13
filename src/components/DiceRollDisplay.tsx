import React from 'react';

interface DiceRollDisplayProps {
  rollResult: { text: string; value: number | null };
}

export const DiceRollDisplay: React.FC<DiceRollDisplayProps> = ({ rollResult }) => {
  return (
    <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-xl transition-all duration-300 z-40
      ${rollResult.value !== null ? 'bg-green-800/90 border border-green-500' : 'bg-gray-800/90 border border-gray-600'}`}
    >
      <div className="text-sm font-semibold text-gray-300">{rollResult.text}</div>
      {rollResult.value !== null && (
        <div className="text-4xl font-extrabold text-yellow-300 mt-1">
          {rollResult.value}
        </div>
      )}
    </div>
  );
};
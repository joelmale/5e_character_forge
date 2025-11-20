import React, { useState } from 'react';
import { Trash2, Tent, TrendingUp, TrendingDown, Dice6 } from 'lucide-react';
import { Character } from '../../types/dnd';
import { LayoutSelector } from './LayoutSelector';

interface CharacterHeaderProps {
  character: Character;
  onClose: () => void;
  onDelete: (id: string) => void;
  onShortRest: (id: string) => void;
  onLongRest: (id: string) => void;
  onLevelUp: (id: string) => void;
  onLevelDown?: (id: string) => void;
  onOpenDiceTray?: () => void;
}

export const CharacterHeader: React.FC<CharacterHeaderProps> = ({
  character,
  onClose,
  onDelete,
  onShortRest,
  onLongRest,
  onLevelUp,
  onLevelDown,
  onOpenDiceTray,
}) => {
  const [rollOnSheet, setRollOnSheet] = useState(false);
  return (
    <>
      {/* Header and Controls */}
      <div className="flex justify-between items-center border-b border-red-700 pb-3 gap-4">
        {/* Player Name and Details */}
        <div className="flex flex-col">
          <h1 className="text-2xl font-serif font-bold text-red-400">
            {character.name}
          </h1>
          <div className="text-sm text-gray-300">
            {character.race} {character.class} • Level {character.level}
          </div>
        </div>

        <div className="flex items-center gap-3">
           {/* Dice Rolling Tray Section */}
           <div className="flex flex-col items-center gap-1" style={{ paddingRight: '160px' }}>
              <button
                onClick={() => {
                  console.log('🎲 [CharacterHeader] Dice Rolling Tray button clicked');
                  console.log('🎲 [CharacterHeader] onOpenDiceTray function:', onOpenDiceTray);
                  if (onOpenDiceTray) {
                    console.log('🎲 [CharacterHeader] Calling onOpenDiceTray...');
                    onOpenDiceTray();
                    console.log('🎲 [CharacterHeader] onOpenDiceTray called successfully');
                  } else {
                    console.error('❌ [CharacterHeader] onOpenDiceTray is undefined!');
                  }
                }}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                title="Open Dice Rolling Tray"
              >
               <Dice6 className="w-4 h-4" />
               Dice Rolling Tray
             </button>
             <label className="flex items-center gap-1 text-xs text-gray-300">
               <input
                 type="checkbox"
                 checked={rollOnSheet}
                 onChange={(e) => setRollOnSheet(e.target.checked)}
                 className="w-3 h-3 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500"
               />
               Roll on sheet
               {/* TODO: Implement functionality to turn on/off character sheet rolls */}
             </label>
           </div>

           <LayoutSelector />

           <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onShortRest(character.id)}
              className="px-2 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center justify-center"
              title="Take a Short Rest (recover HP with hit dice)"
            >
              <Tent className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => onLongRest(character.id)}
              className="px-2 py-2 bg-green-600 hover:bg-green-500 rounded-lg transition-colors flex items-center justify-center"
              title="Take a Long Rest (recover all HP and spell slots)"
            >
              <Tent className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => onLevelUp(character.id)}
              className="px-2 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors flex items-center justify-center"
              title="Level up your character"
            >
              <TrendingUp className="w-5 h-5 text-white" />
            </button>
            {onLevelDown && (
              <button
                onClick={() => onLevelDown(character.id)}
                className="px-2 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg transition-colors flex items-center justify-center"
                title="Level down your character (debug)"
              >
                <TrendingDown className="w-5 h-5 text-white" />
              </button>
            )}
          </div>
          <div className="flex space-x-3 ml-4">
            <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors font-medium">Back to List</button>
            <button onClick={() => onDelete(character.id)} className="px-2 py-2 bg-red-800 hover:bg-red-700 rounded-lg transition-colors" title="Delete Character"><Trash2 className="w-5 h-5 text-white" /></button>
          </div>
        </div>
      </div>

      {/* Core Info Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center text-xs font-semibold">
        <div className="p-2 bg-gray-800 rounded-lg">Race: <span className="text-yellow-400 block text-sm">{character.race}</span></div>
        <div className="p-2 bg-gray-800 rounded-lg">Class: <span className="text-yellow-400 block text-sm">{character.class}</span></div>
        <div className="p-2 bg-gray-800 rounded-lg">Level: <span className="text-yellow-400 block text-sm">{character.level}</span></div>
        <div className="p-2 bg-gray-800 rounded-lg col-span-2 md:col-span-1">Alignment: <span className="text-yellow-400 block text-sm">{character.alignment}</span></div>
        <div className="p-2 bg-gray-800 rounded-lg col-span-2 md:col-span-1">Background: <span className="text-yellow-400 block text-sm">{character.background}</span></div>
      </div>
    </>
  );
};
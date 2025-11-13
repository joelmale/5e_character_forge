import React from 'react';
import { Plus, Download, Upload } from 'lucide-react';
import { Character } from '../types/dnd';

interface ImportExportControlsProps {
  characters: Character[];
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  onNewCharacter: () => void;
}

export const ImportExportControls: React.FC<ImportExportControlsProps> = ({
  characters,
  onImport,
  onExport,
  onNewCharacter,
}) => {

  return (
    <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:space-x-3 w-full md:w-auto">
      <button
        onClick={onNewCharacter}
        className="w-full md:w-auto px-6 py-3 bg-red-600 hover:bg-red-500 rounded-xl text-white font-bold shadow-red-800/50 shadow-lg transition-all flex items-center justify-center"
      >
        <Plus className="w-5 h-5 mr-2" />
        New Character Wizard
      </button>
      <button
        onClick={onExport}
        disabled={characters.length === 0}
        className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-bold shadow-blue-800/50 shadow-lg transition-all flex items-center justify-center disabled:bg-gray-600 disabled:cursor-not-allowed"
      >
        <Download className="w-5 h-5 mr-2" />
        Export Data
      </button>
      <label className="w-full md:w-auto px-6 py-3 bg-green-600 hover:bg-green-500 rounded-xl text-white font-bold shadow-green-800/50 shadow-lg transition-all flex items-center justify-center cursor-pointer">
        <Upload className="w-5 h-5 mr-2" />
        Import Data
        <input
          type="file"
          accept="application/json"
          onChange={onImport}
          className="hidden"
        />
      </label>
    </div>
  );
};
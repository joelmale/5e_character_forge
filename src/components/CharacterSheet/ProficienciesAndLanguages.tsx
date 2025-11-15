import React from 'react';
import { Shield, Sword, Hammer, Languages } from 'lucide-react';
import { Character } from '../../types/dnd';

interface ProficienciesAndLanguagesProps {
  character: Character;
}

export const ProficienciesAndLanguages: React.FC<ProficienciesAndLanguagesProps> = ({
  character,
}) => {
  // Use real proficiency data from character
  const armorProficiencies = character.proficiencies?.armor || [];
  const weaponProficiencies = character.proficiencies?.weapons || [];
  const toolProficiencies = character.proficiencies?.tools || [];
  const languages = character.languages || [];

  return (
    <div className="bg-emerald-900 rounded-xl shadow-lg border-l-4 border-yellow-500 p-4">
      <h3 className="text-lg font-bold text-yellow-400 mb-4">Proficiencies & Languages</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Armor Proficiencies */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-300">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-semibold">Armor</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {armorProficiencies.map((proficiency, index) => (
              <span key={index} className="px-2 py-1 bg-blue-700 text-white text-xs rounded">
                {proficiency}
              </span>
            ))}
          </div>
        </div>

        {/* Weapon Proficiencies */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-300">
            <Sword className="w-4 h-4" />
            <span className="text-sm font-semibold">Weapons</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {weaponProficiencies.map((proficiency, index) => (
              <span key={index} className="px-2 py-1 bg-blue-700 text-white text-xs rounded">
                {proficiency}
              </span>
            ))}
          </div>
        </div>

        {/* Tool Proficiencies */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-300">
            <Hammer className="w-4 h-4" />
            <span className="text-sm font-semibold">Tools</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {toolProficiencies.map((proficiency, index) => (
              <span key={index} className="px-2 py-1 bg-blue-700 text-white text-xs rounded">
                {proficiency}
              </span>
            ))}
          </div>
        </div>

        {/* Languages */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-300">
            <Languages className="w-4 h-4" />
            <span className="text-sm font-semibold">Languages</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {languages.map((language, index) => (
              <span key={index} className="px-2 py-1 bg-green-700 text-white text-xs rounded">
                {language}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-600">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-white">{armorProficiencies.length}</div>
            <div className="text-xs text-gray-400">Armor Proficiencies</div>
          </div>
          <div>
            <div className="text-lg font-bold text-white">{weaponProficiencies.length}</div>
            <div className="text-xs text-gray-400">Weapon Proficiencies</div>
          </div>
          <div>
            <div className="text-lg font-bold text-white">{toolProficiencies.length}</div>
            <div className="text-xs text-gray-400">Tool Proficiencies</div>
          </div>
          <div>
            <div className="text-lg font-bold text-white">{languages.length}</div>
            <div className="text-xs text-gray-400">Languages</div>
          </div>
        </div>
      </div>
    </div>
  );
};
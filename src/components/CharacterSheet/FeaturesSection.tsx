import React from 'react';
import { Character } from '../../types/dnd';

interface FeaturesSectionProps {
  character: Character;
  onFeatureClick: (feature: string) => void;
}

export const FeaturesSection: React.FC<FeaturesSectionProps> = ({
  character,
  onFeatureClick,
}) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-red-500 border-b border-red-800 pb-1">Features & Traits</h2>
        <div className="grid grid-cols-1 gap-4">
        <div className="p-4 bg-gray-800 rounded-xl shadow-lg border-l-4 border-blue-500">
          <h3 className="text-lg font-bold text-blue-400 mb-2">Personality, Ideals, Bonds & Flaws</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
            <li><span className="font-semibold text-white">Personality:</span> {character.featuresAndTraits.personality}</li>
            <li><span className="font-semibold text-white">Ideals:</span> {character.featuresAndTraits.ideals}</li>
            <li><span className="font-semibold text-white">Bonds:</span> {character.featuresAndTraits.bonds}</li>
            <li><span className="font-semibold text-white">Flaws:</span> {character.featuresAndTraits.flaws}</li>
          </ul>
        </div>
        <div className="p-4 bg-gray-800 rounded-xl shadow-lg border-l-4 border-green-500">
          <h3 className="text-lg font-bold text-green-400 mb-2">Racial Traits</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
            {character.featuresAndTraits.racialTraits.map((trait, index) => (
              <li key={`r-${index}`}>
                <button onClick={() => onFeatureClick(trait)} className="text-left hover:text-yellow-300 transition-colors cursor-pointer">
                  {trait}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* SRD Features Display */}
      {character.srdFeatures && (character.srdFeatures.classFeatures.length > 0 || character.srdFeatures.subclassFeatures.length > 0) && (
      <div className="grid grid-cols-1 gap-4">
          {/* Class Features */}
          {character.srdFeatures.classFeatures.length > 0 && (
            <div className="p-4 bg-gray-800 rounded-xl shadow-lg border-l-4 border-orange-500">
              <h3 className="text-lg font-bold text-orange-400 mb-2">Class Features</h3>
              <div className="space-y-2 text-sm text-gray-300 max-h-60 overflow-y-auto">
                {character.srdFeatures.classFeatures.map((feature, index) => (
                  <div key={`cf-${index}`} className="flex items-start gap-2">
                    <span className="text-xs bg-orange-700 text-white px-1.5 py-0.5 rounded font-mono">
                      L{feature.level}
                    </span>
                    <button
                      onClick={() => onFeatureClick(feature.name)}
                      className="text-left hover:text-yellow-300 transition-colors cursor-pointer flex-1"
                    >
                      {feature.name}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subclass Features */}
          {character.srdFeatures.subclassFeatures.length > 0 && (
            <div className="p-4 bg-gray-800 rounded-xl shadow-lg border-l-4 border-purple-500">
              <h3 className="text-lg font-bold text-purple-400 mb-2">Subclass Features</h3>
              <div className="space-y-2 text-sm text-gray-300 max-h-60 overflow-y-auto">
                {character.srdFeatures.subclassFeatures.map((feature, index) => (
                  <div key={`scf-${index}`} className="flex items-start gap-2">
                    <span className="text-xs bg-purple-700 text-white px-1.5 py-0.5 rounded font-mono">
                      L{feature.level}
                    </span>
                    <button
                      onClick={() => onFeatureClick(feature.name)}
                      className="text-left hover:text-yellow-300 transition-colors cursor-pointer flex-1"
                    >
                      {feature.name}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legacy Class Features */}
      {character.featuresAndTraits.classFeatures && character.featuresAndTraits.classFeatures.length > 0 && (
        <div className="p-4 bg-gray-800 rounded-xl shadow-lg border-l-4 border-yellow-500">
          <h3 className="text-lg font-bold text-yellow-400 mb-2">Other Class Features</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
            {character.featuresAndTraits.classFeatures.map((feature, index) => (
              <li key={`lcf-${index}`}>
                <button onClick={() => onFeatureClick(feature)} className="text-left hover:text-yellow-300 transition-colors cursor-pointer">
                  {feature}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Selected Feats Display */}
      {character.selectedFeats && character.selectedFeats.length > 0 && (
        <div className="p-4 bg-gray-800 rounded-xl shadow-lg border-l-4 border-cyan-500">
          <h3 className="text-lg font-bold text-cyan-400 mb-2">Feats</h3>
          <div className="grid grid-cols-1 gap-2">
            {character.selectedFeats.map((featSlug, index) => (
              <div key={`feat-${index}`} className="p-2 bg-gray-700 rounded border border-cyan-700">
                <div className="font-semibold text-cyan-300 text-sm">{featSlug}</div>
                <p className="text-xs text-gray-400 mt-1">Feat</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
import React, { useState } from 'react';
import { ChevronUp, ChevronDown, XCircle, Shuffle, ArrowLeft, ArrowRight } from 'lucide-react';
import { StepProps } from '../types/wizard.types';
import { getAllRaces, RACE_CATEGORIES, randomizeRace } from '../../../services/dataService';

interface RandomizeButtonProps {
  onClick: () => void;
  title: string;
}

const RandomizeButton: React.FC<RandomizeButtonProps> = ({ onClick, title }) => (
  <button
    onClick={onClick}
    title={title}
    className="p-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg text-white transition-colors"
  >
    <Shuffle className="w-4 h-4" />
  </button>
);

export const Step2Race: React.FC<StepProps> = ({ data, updateData, nextStep, prevStep, getNextStepLabel }) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Core Races']));
  const [showRaceInfo, setShowRaceInfo] = useState(true);

  const selectedRace = getAllRaces().find(r => r.slug === data.raceSlug);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h3 className='text-xl font-bold text-red-300'>Select Race (Racial Bonuses will be applied automatically)</h3>
        <RandomizeButton
          onClick={() => updateData({ raceSlug: randomizeRace() })}
          title="Randomize race selection"
        />
      </div>

      {/* Race Categories */}
      <div className='space-y-3'>
        {RACE_CATEGORIES.map(category => (
          <div key={category.name} className='border border-gray-600 rounded-lg overflow-hidden'>
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category.name)}
              className='w-full p-4 bg-gray-700 hover:bg-gray-650 flex items-center justify-between transition-colors'
            >
              <div className='flex items-center gap-3'>
                <span className='text-2xl'>{category.icon}</span>
                <div className='text-left'>
                  <div className='font-bold text-yellow-300 text-lg'>{category.name}</div>
                  <div className='text-xs text-gray-400'>{category.description}</div>
                </div>
              </div>
              {expandedCategories.has(category.name) ? (
                <ChevronUp className='w-5 h-5 text-gray-400' />
              ) : (
                <ChevronDown className='w-5 h-5 text-gray-400' />
              )}
            </button>

            {/* Category Races */}
            {expandedCategories.has(category.name) && (
              <div className='p-4 bg-gray-800/50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
                {category.races.map(race => (
                  <button
                    key={race.slug}
                    onClick={() => updateData({ raceSlug: race.slug })}
                    className={`p-3 rounded-lg text-left border-2 transition-all ${
                      data.raceSlug === race.slug
                        ? 'bg-red-800 border-red-500 shadow-md'
                        : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                    }`}
                  >
                    <p className='text-sm font-bold text-yellow-300'>{race.name}</p>
                    <p className='text-xs text-gray-500 mt-1'>{race.source}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Selected Race Details */}
      {selectedRace && showRaceInfo && (
        <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 space-y-3 relative">
          <button
            onClick={() => setShowRaceInfo(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
            title="Close"
          >
            <XCircle className="w-5 h-5" />
          </button>

          <div className="flex items-start justify-between pr-8">
            <div>
              <h4 className="text-lg font-bold text-yellow-300">{selectedRace.name}</h4>
              <p className="text-xs text-gray-500">{selectedRace.source}</p>
            </div>
          </div>

          <p className="text-sm text-gray-300">{selectedRace.description}</p>

          <div className="space-y-2 text-sm">
            <div>
              <span className="font-semibold text-red-400">Ability Bonuses: </span>
              <span className="text-gray-300">
                {Object.entries(selectedRace.ability_bonuses)
                  .map(([ability, bonus]) => `${ability} +${bonus}`)
                  .join(', ')}
              </span>
            </div>

            <div>
              <span className="font-semibold text-red-400">Racial Traits: </span>
              <ul className="list-disc list-inside text-gray-300 ml-4">
                {selectedRace.racial_traits.map((trait, idx) => (
                  <li key={idx} className="text-xs">{trait}</li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t border-gray-600">
              <div className="font-semibold text-yellow-400 mb-1">Typical Roles:</div>
              <p className="text-xs text-gray-400">{selectedRace.typicalRoles.join(', ')}</p>
            </div>
          </div>
        </div>
      )}

      <div className='flex justify-between'>
        <button onClick={prevStep} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white flex items-center">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </button>
        <button
          onClick={nextStep}
          disabled={!data.raceSlug}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white flex items-center disabled:bg-gray-600"
        >
          Next: {getNextStepLabel?.() || 'Continue'} <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
};
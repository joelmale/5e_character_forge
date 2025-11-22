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
    className="p-2 bg-accent-yellow-dark hover:bg-accent-yellow rounded-lg text-white transition-colors"
  >
    <Shuffle className="w-4 h-4" />
  </button>
);

export const Step2Race: React.FC<StepProps> = ({ data, updateData, nextStep, prevStep, getNextStepLabel, openTraitModal }) => {
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
          <div key={category.name} className='border border-theme-primary rounded-lg overflow-hidden'>
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category.name)}
              className='w-full p-4 bg-theme-tertiary hover:bg-gray-650 flex items-center justify-between transition-colors'
            >
              <div className='flex items-center gap-3'>
                <span className='text-2xl'>{category.icon}</span>
                <div className='text-left'>
                  <div className='font-bold text-accent-yellow-light text-lg'>{category.name}</div>
                  <div className='text-xs text-theme-muted'>{category.description}</div>
                </div>
              </div>
              {expandedCategories.has(category.name) ? (
                <ChevronUp className='w-5 h-5 text-theme-muted' />
              ) : (
                <ChevronDown className='w-5 h-5 text-theme-muted' />
              )}
            </button>

            {/* Category Races */}
            {expandedCategories.has(category.name) && (
              <div className='p-4 bg-theme-secondary/50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
                {category.races.map(race => (
                  <button
                    key={race.slug}
                    onClick={() => updateData({ raceSlug: race.slug })}
                    className={`p-3 rounded-lg text-left border-2 transition-all ${
                      data.raceSlug === race.slug
                        ? 'bg-accent-red-darker border-red-500 shadow-md'
                        : 'bg-theme-tertiary border-theme-primary hover:bg-theme-quaternary'
                    }`}
                  >
                    <p className='text-sm font-bold text-accent-yellow-light'>{race.name}</p>
                    <p className='text-xs text-theme-disabled mt-1'>{race.source}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Selected Race Details */}
      {selectedRace && showRaceInfo && (
        <div className="bg-theme-tertiary/50 border border-theme-primary rounded-lg p-4 space-y-3 relative">
          <button
            onClick={() => setShowRaceInfo(false)}
            className="absolute top-2 right-2 text-theme-muted hover:text-white transition-colors"
            title="Close"
          >
            <XCircle className="w-5 h-5" />
          </button>

          <div className="flex items-start justify-between pr-8">
            <div>
              <h4 className="text-lg font-bold text-accent-yellow-light">{selectedRace.name}</h4>
              <p className="text-xs text-theme-disabled">{selectedRace.source}</p>
            </div>
          </div>

          <p className="text-sm text-theme-tertiary">{selectedRace.description}</p>

          <div className="space-y-2 text-sm">
            <div>
              <span className="font-semibold text-accent-red-light">Ability Bonuses: </span>
              <div className="flex flex-wrap gap-2 mt-1">
                {Object.entries(selectedRace.ability_bonuses).map(([ability, bonus]) => (
                  <span key={ability} className="px-2 py-1 bg-blue-700 text-white text-xs rounded">
                    {ability} +{bonus}
                  </span>
                ))}
              </div>
            </div>

             <div>
               <span className="font-semibold text-accent-red-light">Racial Traits: </span>
               <div className="flex flex-wrap gap-2 mt-1">
                 {selectedRace.racial_traits.map((trait, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const position = {
                          x: rect.left + rect.width / 2,
                          y: rect.top + rect.height / 2
                        };
                        openTraitModal?.(trait, position);
                      }}
                      className="px-2 py-1 bg-accent-green-dark hover:bg-accent-green text-white text-xs rounded transition-colors cursor-pointer"
                      title={`Click to learn more about ${trait}`}
                    >
                      {trait}
                    </button>
                 ))}
               </div>
             </div>

            <div className="pt-2 border-t border-theme-primary">
              <div className="font-semibold text-accent-yellow-light mb-1">Typical Roles:</div>
              <p className="text-xs text-theme-muted">{selectedRace.typicalRoles.join(', ')}</p>
            </div>
          </div>
        </div>
      )}

      <div className='flex justify-between'>
        <button onClick={prevStep} className="px-4 py-2 bg-theme-quaternary hover:bg-theme-hover rounded-lg text-white flex items-center">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </button>
        <button
          onClick={nextStep}
          disabled={!data.raceSlug}
          className="px-4 py-2 bg-accent-red hover:bg-accent-red-light rounded-lg text-white flex items-center disabled:bg-theme-quaternary"
        >
          Next: {getNextStepLabel?.() || 'Continue'} <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
};
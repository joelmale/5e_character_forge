import React, { useState } from 'react';
import { ChevronUp, ChevronDown, XCircle, Shuffle, ArrowLeft, ArrowRight } from 'lucide-react';
import { StepProps } from '../types/wizard.types';
import { loadClasses, CLASS_CATEGORIES, BACKGROUNDS, getSubclassesByClass, randomizeClassAndSkills } from '../../../services/dataService';
import { SkillName } from '../../../types/dnd';

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

export const Step3Class: React.FC<StepProps> = ({ data, updateData, nextStep, prevStep, getNextStepLabel }) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Core Classes']));
  const [showClassInfo, setShowClassInfo] = useState(true);

  const allClasses = loadClasses();
  const selectedClass = allClasses.find(c => c.slug === data.classSlug);

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
        <h3 className='text-xl font-bold text-red-300'>
          Select Class {data.level >= 3 ? '& Subclass ' : ''}(Hit Die and Starting Proficiencies)
        </h3>
        <RandomizeButton
          onClick={() => {
            const classAndSkills = randomizeClassAndSkills();
            updateData({
              classSlug: classAndSkills.classSlug,
              selectedSkills: classAndSkills.selectedSkills,
              subclassSlug: classAndSkills.subclassSlug
            });
          }}
          title="Randomize class, skills, and subclass"
        />
      </div>

      {/* Class Categories */}
      <div className='space-y-3'>
        {CLASS_CATEGORIES.map(category => (
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

            {/* Category Classes */}
            {expandedCategories.has(category.name) && (
              <div className='p-4 bg-gray-800/50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
                {category.classes.map(_class => (
                  <button
                    key={_class.slug}
                     onClick={() => updateData({ classSlug: _class.slug, selectedSkills: [], subclassSlug: null })}
                    className={`p-3 rounded-lg text-left border-2 transition-all ${
                      data.classSlug === _class.slug
                        ? 'bg-red-800 border-red-500 shadow-md'
                        : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                    }`}
                  >
                    <p className='text-sm font-bold text-yellow-300'>{_class.name}</p>
                    <p className='text-xs text-gray-500 mt-1'>Hit Die: d{_class.hit_die}</p>
                    <p className='text-xs text-gray-500'>{_class.primary_stat}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Selected Class Details */}
      {selectedClass && showClassInfo && (
        <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 space-y-3 relative">
          <button
            onClick={() => setShowClassInfo(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
            title="Close"
          >
            <XCircle className="w-5 h-5" />
          </button>

          <div className="flex items-start justify-between pr-8">
            <div>
              <h4 className="text-lg font-bold text-yellow-300">{selectedClass.name}</h4>
              <p className="text-xs text-gray-500">{selectedClass.source}</p>
            </div>
          </div>

          <p className="text-sm text-gray-300">{selectedClass.description}</p>

          <div className="space-y-2 text-sm">
            <div>
              <span className="font-semibold text-red-400">Hit Die: </span>
              <span className="text-gray-300">d{selectedClass.hit_die}</span>
            </div>

            <div>
              <span className="font-semibold text-red-400">Primary Ability: </span>
              <span className="text-gray-300">{selectedClass.primary_stat}</span>
            </div>

            <div>
              <span className="font-semibold text-red-400">Saving Throws: </span>
              <span className="text-gray-300">{selectedClass.save_throws.join(', ')}</span>
            </div>

            <div>
              <span className="font-semibold text-red-400">Key Features: </span>
              <ul className="list-disc list-inside text-gray-300 ml-4">
                {selectedClass.class_features.slice(0, 4).map((feature, idx) => (
                  <li key={idx} className="text-xs">{feature}</li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t border-gray-600">
              <div className="font-semibold text-yellow-400 mb-1">Key Role:</div>
              <p className="text-xs text-gray-400">{selectedClass.keyRole}</p>
            </div>
          </div>
        </div>
      )}

      {/* Skill Selection */}
      {selectedClass && (
        <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 space-y-3">
          <h4 className="text-lg font-bold text-yellow-300">
            Choose Skills ({data.selectedSkills.length} / {(selectedClass.num_skill_choices || 0)} selected)
          </h4>
          <p className="text-xs text-gray-400">
            Select {(selectedClass.num_skill_choices || 0)} skill{(selectedClass.num_skill_choices || 0) !== 1 ? 's' : ''} from your class options.
            Skills from your background are automatically granted.
          </p>

          {/* Background Skills (Auto-granted) */}
          {(() => {
            const backgroundData = BACKGROUNDS.find(bg => bg.name === data.background);
            const backgroundSkills = backgroundData?.skill_proficiencies || [];

            if (backgroundSkills.length > 0) {
              return (
                <div className="p-3 bg-green-900/20 border border-green-700 rounded-lg">
                  <div className="text-xs font-semibold text-green-400 mb-2">
                    Background Skills (Auto-granted from {data.background}):
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {backgroundSkills.map(skill => (
                      <span key={skill} className="px-2 py-1 bg-green-700 text-white text-xs rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Class Skill Selection */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {selectedClass.skill_proficiencies.map(skill => {
              const backgroundData = BACKGROUNDS.find(bg => bg.name === data.background);
              const backgroundSkills = backgroundData?.skill_proficiencies || [];
              const isBackgroundSkill = backgroundSkills.includes(skill);
              const isSelected = data.selectedSkills.includes(skill as SkillName);
              const canSelect = data.selectedSkills.length < (selectedClass.num_skill_choices || 0);

              return (
                <button
                  key={skill}
                  onClick={() => {
                    if (isBackgroundSkill) return; // Can't select background skills

                    if (isSelected) {
                      // Deselect
                      updateData({
                        selectedSkills: data.selectedSkills.filter(s => s !== skill)
                      });
                    } else if (canSelect) {
                      // Select
                      updateData({
                        selectedSkills: [...data.selectedSkills, skill as SkillName]
                      });
                    }
                  }}
                  disabled={isBackgroundSkill}
                  className={`p-2 rounded-lg text-sm border-2 transition-all ${
                    isBackgroundSkill
                      ? 'bg-green-900/20 border-green-700 text-green-400 cursor-not-allowed opacity-60'
                      : isSelected
                        ? 'bg-blue-800 border-blue-500 text-white'
                        : canSelect
                          ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-300'
                          : 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                  title={isBackgroundSkill ? 'Already granted by background' : ''}
                >
                  {skill}
                  {isBackgroundSkill && <span className="ml-1 text-xs">(BG)</span>}
                </button>
              );
            })}
          </div>

          {data.selectedSkills.length < (selectedClass.num_skill_choices || 0) && (
            <div className="text-xs text-yellow-400 mt-2">
              ⚠️ Please select {((selectedClass.num_skill_choices || 0) - data.selectedSkills.length)} more skill{((selectedClass.num_skill_choices || 0) - data.selectedSkills.length) !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}

      {/* Subclass Selection */}
      {selectedClass && (() => {
        const availableSubclasses = getSubclassesByClass(data.classSlug);

        if (availableSubclasses.length === 0) return null;

        return (
          <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 space-y-3">
            <div>
              <h4 className="text-lg font-bold text-yellow-300">
                Choose {selectedClass.name} Subclass {data.level >= 3 ? '(Required)' : '(Level 3 Feature)'}
              </h4>
              <p className="text-xs text-gray-400 mt-1">
                {data.level >= 3
                  ? `Select your ${selectedClass.name} specialization`
                  : `Subclasses are chosen at level 3. This character will need to select one when they reach level 3.`
                }
              </p>
            </div>

             {data.level >= 3 ? (
               <>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   {availableSubclasses.map(subclass => (
                     <button
                       key={subclass.slug}
                       onClick={() => updateData({ subclassSlug: subclass.slug })}
                       className={`p-3 rounded-lg text-left border-2 transition-all ${
                         data.subclassSlug === subclass.slug
                           ? 'bg-purple-800 border-purple-500 shadow-md'
                           : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                       }`}
                     >
                       <p className="text-sm font-bold text-yellow-300">{subclass.name}</p>
                       <p className="text-xs text-gray-400 mt-1">{subclass.subclassFlavor}</p>
                       {subclass.desc && subclass.desc.length > 0 && (
                         <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                           {subclass.desc[0]}
                         </p>
                       )}
                     </button>
                   ))}
                 </div>

                 {!data.subclassSlug && (
                   <div className="text-xs text-yellow-400 mt-2">
                     ⚠️ Please select a subclass
                   </div>
                 )}
               </>
             ) : (
               <div className="text-sm text-gray-400 p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                 <div className="flex items-center gap-2 mb-2">
                   <span className="text-yellow-300">🔒</span>
                   <p className="font-semibold text-yellow-300">Subclass Selection Unlocked at Level 3</p>
                 </div>
                 <p className="mb-3">Characters choose their subclass specialization at level 3. This character will need to select a subclass when they reach level 3.</p>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                   {availableSubclasses.map(subclass => (
                     <div key={subclass.slug} className="p-2 bg-gray-800/50 rounded border border-gray-700">
                       <p className="text-xs font-semibold text-gray-300">{subclass.name}</p>
                       <p className="text-xs text-gray-500 mt-1">{subclass.subclassFlavor}</p>
                     </div>
                   ))}
                 </div>
               </div>
             )}
            </div>
          );
        })()}

       <div className='flex justify-between'>
        <button onClick={prevStep} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white flex items-center">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </button>
        <button
          onClick={nextStep}
           disabled={
             !data.classSlug ||
             !selectedClass ||
             data.selectedSkills.length < (selectedClass.num_skill_choices || 0) ||
             (getSubclassesByClass(data.classSlug).length > 0 && data.level >= 3 && !data.subclassSlug)
           }
          className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white flex items-center disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          Next: {getNextStepLabel?.() || 'Continue'} <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
};
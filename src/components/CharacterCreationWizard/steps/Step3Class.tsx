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
    className="p-2 bg-accent-yellow-dark hover:bg-accent-yellow rounded-lg text-white transition-colors"
  >
    <Shuffle className="w-4 h-4" />
  </button>
);

export const Step3Class: React.FC<StepProps> = ({ data, updateData, nextStep, prevStep, getNextStepLabel }) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Core Classes']));
  const [showClassInfo, setShowClassInfo] = useState(true);

  const allClasses = loadClasses(data.edition);
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

            {/* Category Classes */}
            {expandedCategories.has(category.name) && (
              <div className='p-4 bg-theme-secondary/50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
                {category.classes.map(_class => (
                  <button
                    key={_class.slug}
                     onClick={() => updateData({ classSlug: _class.slug, selectedSkills: [], subclassSlug: null })}
                    className={`p-3 rounded-lg text-left border-2 transition-all ${
                      data.classSlug === _class.slug
                        ? 'bg-accent-red-darker border-red-500 shadow-md'
                        : 'bg-theme-tertiary border-theme-primary hover:bg-theme-quaternary'
                    }`}
                  >
                    <p className='text-sm font-bold text-accent-yellow-light'>{_class.name}</p>
                    <p className='text-xs text-theme-disabled mt-1'>Hit Die: d{_class.hit_die}</p>
                    <p className='text-xs text-theme-disabled'>{_class.primary_stat}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Selected Class Details */}
      {selectedClass && showClassInfo && (
        <div className="bg-theme-tertiary/50 border border-theme-primary rounded-lg p-4 space-y-3 relative">
          <button
            onClick={() => setShowClassInfo(false)}
            className="absolute top-2 right-2 text-theme-muted hover:text-white transition-colors"
            title="Close"
          >
            <XCircle className="w-5 h-5" />
          </button>

          <div className="flex items-start justify-between pr-8">
            <div>
              <h4 className="text-lg font-bold text-accent-yellow-light">{selectedClass.name}</h4>
              <p className="text-xs text-theme-disabled">{selectedClass.source}</p>
            </div>
          </div>

          <p className="text-sm text-theme-tertiary">{selectedClass.description}</p>

          <div className="space-y-2 text-sm">
            <div>
              <span className="font-semibold text-accent-red-light">Hit Die: </span>
              <span className="text-theme-tertiary">d{selectedClass.hit_die}</span>
            </div>

            <div>
              <span className="font-semibold text-accent-red-light">Primary Ability: </span>
              <span className="text-theme-tertiary">{selectedClass.primary_stat}</span>
            </div>

            <div>
              <span className="font-semibold text-accent-red-light">Saving Throws: </span>
              <span className="text-theme-tertiary">{selectedClass.save_throws.join(', ')}</span>
            </div>

            <div>
              <span className="font-semibold text-accent-red-light">Key Features: </span>
              <ul className="list-disc list-inside text-theme-tertiary ml-4">
                {selectedClass.class_features.slice(0, 4).map((feature, idx) => (
                  <li key={idx} className="text-xs">{feature}</li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t border-theme-primary">
              <div className="font-semibold text-accent-yellow-light mb-1">Key Role:</div>
              <p className="text-xs text-theme-muted">{selectedClass.keyRole}</p>
            </div>
          </div>
        </div>
      )}

      {/* Skill Selection */}
      {selectedClass && (
        <div className="bg-theme-tertiary/50 border border-theme-primary rounded-lg p-4 space-y-3">
          <h4 className="text-lg font-bold text-accent-yellow-light">
            Choose Skills ({data.selectedSkills.length} / {(selectedClass.num_skill_choices || 0)} selected)
          </h4>
          <p className="text-xs text-theme-muted">
            Select {(selectedClass.num_skill_choices || 0)} skill{(selectedClass.num_skill_choices || 0) !== 1 ? 's' : ''} from your class options.
            Skills from your background are automatically granted.
          </p>

          {/* Background Skills (Auto-granted) */}
          {(() => {
            const backgroundData = BACKGROUNDS.find(bg => bg.name === data.background);
            const backgroundSkills = backgroundData?.skill_proficiencies || [];

            if (backgroundSkills.length > 0) {
              return (
                <div className="p-3 bg-accent-green-darker/20 border border-accent-green-dark rounded-lg">
                  <div className="text-xs font-semibold text-accent-green-light mb-2">
                    Background Skills (Auto-granted from {data.background}):
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {backgroundSkills.map(skill => (
                      <span key={skill} className="px-2 py-1 bg-accent-green-dark text-white text-xs rounded">
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
                      ? 'bg-accent-green-darker/20 border-accent-green-dark text-accent-green-light cursor-not-allowed opacity-60'
                      : isSelected
                        ? 'bg-accent-blue-darker border-blue-500 text-white'
                        : canSelect
                          ? 'bg-theme-tertiary border-theme-primary hover:bg-theme-quaternary text-theme-tertiary'
                          : 'bg-theme-secondary border-theme-secondary text-theme-disabled cursor-not-allowed'
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
            <div className="text-xs text-accent-yellow-light mt-2">
              ⚠️ Please select {((selectedClass.num_skill_choices || 0) - data.selectedSkills.length)} more skill{((selectedClass.num_skill_choices || 0) - data.selectedSkills.length) !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}

      {/* Divine Order Selection (2024 Cleric Level 1 Feature) */}
      {selectedClass && data.classSlug === 'cleric' && data.edition === '2024' && (
        <div className="bg-theme-tertiary/50 border border-theme-primary rounded-lg p-4 space-y-3">
          <div>
            <h4 className="text-lg font-bold text-accent-yellow-light">
              Choose Divine Order (Level 1 Feature)
            </h4>
            <p className="text-xs text-theme-muted mt-1">
              As a 2024 Cleric, you must choose your Divine Order at level 1
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={() => updateData({ divineOrder: 'protector' })}
              className={`p-4 rounded-lg text-left border-2 transition-all ${
                data.divineOrder === 'protector'
                  ? 'bg-accent-blue-darker border-blue-500 shadow-md'
                  : 'bg-theme-tertiary border-theme-primary hover:bg-theme-quaternary'
              }`}
            >
              <p className="text-lg font-bold text-accent-yellow-light mb-2">🛡️ Protector</p>
              <p className="text-sm text-theme-tertiary mb-2">
                Trained for battle, you protect the faithful
              </p>
              <div className="text-xs text-theme-disabled space-y-1">
                <p><strong className="text-accent-green-light">Proficiencies:</strong></p>
                <ul className="list-disc list-inside ml-2">
                  <li>Heavy Armor</li>
                  <li>Martial Weapons</li>
                </ul>
              </div>
            </button>

            <button
              onClick={() => updateData({ divineOrder: 'thaumaturge' })}
              className={`p-4 rounded-lg text-left border-2 transition-all ${
                data.divineOrder === 'thaumaturge'
                  ? 'bg-accent-blue-darker border-blue-500 shadow-md'
                  : 'bg-theme-tertiary border-theme-primary hover:bg-theme-quaternary'
              }`}
            >
              <p className="text-lg font-bold text-accent-yellow-light mb-2">✨ Thaumaturge</p>
              <p className="text-sm text-theme-tertiary mb-2">
                Focused on divine magic and knowledge
              </p>
              <div className="text-xs text-theme-disabled space-y-1">
                <p><strong className="text-accent-green-light">Benefits:</strong></p>
                <ul className="list-disc list-inside ml-2">
                  <li>+1 Cantrip known</li>
                  <li>Add WIS modifier to Arcana checks</li>
                  <li>Add WIS modifier to Religion checks</li>
                </ul>
              </div>
            </button>
          </div>

          {!data.divineOrder && (
            <div className="text-xs text-accent-yellow-light mt-2">
              ⚠️ Please choose a Divine Order
            </div>
          )}
        </div>
      )}

      {/* Subclass Selection */}
      {selectedClass && (() => {
        const availableSubclasses = getSubclassesByClass(data.classSlug);

        if (availableSubclasses.length === 0) return null;

        // Determine subclass level requirement based on class and edition
        // 2014 Cleric gets Divine Domain at Level 1, 2024 Cleric at Level 3
        const subclassLevel = (data.classSlug === 'cleric' && data.edition === '2014') ? 1 : 3;
        const hasSubclassUnlocked = data.level >= subclassLevel;

        return (
          <div className="bg-theme-tertiary/50 border border-theme-primary rounded-lg p-4 space-y-3">
            <div>
              <h4 className="text-lg font-bold text-accent-yellow-light">
                Choose {selectedClass.name} Subclass {hasSubclassUnlocked ? '(Required)' : `(Level ${subclassLevel} Feature)`}
              </h4>
              <p className="text-xs text-theme-muted mt-1">
                {hasSubclassUnlocked
                  ? `Select your ${selectedClass.name} specialization`
                  : `Subclasses are chosen at level ${subclassLevel}. This character will need to select one when they reach level ${subclassLevel}.`
                }
              </p>
            </div>

             {hasSubclassUnlocked ? (
               <>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   {availableSubclasses.map(subclass => (
                     <button
                       key={subclass.slug}
                       onClick={() => updateData({ subclassSlug: subclass.slug })}
                       className={`p-3 rounded-lg text-left border-2 transition-all ${
                         data.subclassSlug === subclass.slug
                           ? 'bg-accent-purple-darker border-accent-purple shadow-md'
                           : 'bg-theme-tertiary border-theme-primary hover:bg-theme-quaternary'
                       }`}
                     >
                       <p className="text-sm font-bold text-accent-yellow-light">{subclass.name}</p>
                       <p className="text-xs text-theme-muted mt-1">{subclass.subclassFlavor}</p>
                       {subclass.desc && subclass.desc.length > 0 && (
                         <p className="text-xs text-theme-disabled mt-2 line-clamp-2">
                           {subclass.desc[0]}
                         </p>
                       )}
                     </button>
                   ))}
                 </div>

                 {!data.subclassSlug && (
                   <div className="text-xs text-accent-yellow-light mt-2">
                     ⚠️ Please select a subclass
                   </div>
                 )}
               </>
             ) : (
               <div className="text-sm text-theme-muted p-4 bg-theme-secondary/50 rounded-lg border border-theme-primary">
                 <div className="flex items-center gap-2 mb-2">
                   <span className="text-accent-yellow-light">🔒</span>
                   <p className="font-semibold text-accent-yellow-light">Subclass Selection Unlocked at Level 3</p>
                 </div>
                 <p className="mb-3">Characters choose their subclass specialization at level 3. This character will need to select a subclass when they reach level 3.</p>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                   {availableSubclasses.map(subclass => (
                     <div key={subclass.slug} className="p-2 bg-theme-secondary/50 rounded border border-theme-secondary">
                       <p className="text-xs font-semibold text-theme-tertiary">{subclass.name}</p>
                       <p className="text-xs text-theme-disabled mt-1">{subclass.subclassFlavor}</p>
                     </div>
                   ))}
                 </div>
               </div>
             )}
            </div>
          );
        })()}

       <div className='flex justify-between'>
        <button onClick={prevStep} className="px-4 py-2 bg-theme-quaternary hover:bg-theme-hover rounded-lg text-white flex items-center">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </button>
        <button
          onClick={nextStep}
           disabled={
             !data.classSlug ||
             !selectedClass ||
             data.selectedSkills.length < (selectedClass.num_skill_choices || 0) ||
             (getSubclassesByClass(data.classSlug).length > 0 && data.level >= 3 && !data.subclassSlug) ||
             (data.classSlug === 'cleric' && data.edition === '2024' && !data.divineOrder)
           }
          className="px-4 py-2 bg-accent-red hover:bg-accent-red-light rounded-lg text-white flex items-center disabled:bg-theme-quaternary disabled:cursor-not-allowed"
        >
          Next: {getNextStepLabel?.() || 'Continue'} <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { ChevronUp, ChevronDown, XCircle, Shuffle, ArrowLeft, ArrowRight } from 'lucide-react';
import { StepProps } from '../types/wizard.types';
import { loadClasses, getClassCategories, BACKGROUNDS, getSubclassesByClass, randomizeClassAndSkills } from '../../../services/dataService';
import { SkillName } from '../../../types/dnd';
import { SelectionPoolWidget, BranchChoiceWidget, AutomaticWidget, ListSelectionWidget } from '../widgets';
import { Level1Feature } from '../../../types/widgets';
import { AnySkillPickerModal } from '../AnySkillPickerModal';

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

  // Duplicate skill modal state
  const [showDuplicateSkillModal, setShowDuplicateSkillModal] = useState(false);
  const [duplicateSkill, setDuplicateSkill] = useState<string | null>(null);

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
        {getClassCategories(data.edition).map(category => (
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
                    // 2024 Rule: If skill is already granted by background, trigger "Any Skill" replacement
                    if (isBackgroundSkill && data.edition === '2024') {
                      setDuplicateSkill(skill);
                      setShowDuplicateSkillModal(true);
                      return;
                    }

                    // 2014 Rule: Can't select background skills at all
                    if (isBackgroundSkill && data.edition === '2014') {
                      return;
                    }

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
                  disabled={isBackgroundSkill && data.edition === '2014'}
                  className={`p-2 rounded-lg text-sm border-2 transition-all ${
                    isBackgroundSkill && data.edition === '2014'
                      ? 'bg-accent-green-darker/20 border-accent-green-dark text-accent-green-light cursor-not-allowed opacity-60'
                      : isBackgroundSkill && data.edition === '2024'
                        ? 'bg-amber-900/30 border-amber-500/50 hover:border-amber-400 text-amber-300 cursor-pointer'
                        : isSelected
                          ? 'bg-accent-blue-darker border-blue-500 text-white'
                          : canSelect
                            ? 'bg-theme-tertiary border-theme-primary hover:bg-theme-quaternary text-theme-tertiary'
                            : 'bg-theme-secondary border-theme-secondary text-theme-disabled cursor-not-allowed'
                  }`}
                  title={
                    isBackgroundSkill && data.edition === '2014'
                      ? 'Already granted by background'
                      : isBackgroundSkill && data.edition === '2024'
                        ? 'Click to replace with any skill (2024 rule)'
                        : ''
                  }
                >
                  {skill}
                  {isBackgroundSkill && data.edition === '2014' && <span className="ml-1 text-xs">(BG)</span>}
                  {isBackgroundSkill && data.edition === '2024' && <span className="ml-1 text-xs">⚠️</span>}
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

      {/* Level 1 Features (Widget System) */}
      {selectedClass && selectedClass.level_1_features && selectedClass.level_1_features.length > 0 && (
        <div className="space-y-4">
          {selectedClass.level_1_features.map((feature: Level1Feature) => {
            // Render appropriate widget based on widget_type
            switch (feature.widget_type) {
              case 'selection_pool':
                return (
                  <SelectionPoolWidget
                    key={feature.id}
                    feature={feature}
                    data={data}
                    currentSelection={
                      feature.id === 'expertise'
                        ? data.expertiseSkills || []
                        : feature.id === 'weapon_mastery'
                          ? data.weaponMastery || []
                          : []
                    }
                    onSelectionChange={(selections) => {
                      if (feature.id === 'expertise') {
                        updateData({ expertiseSkills: selections });
                      } else if (feature.id === 'weapon_mastery') {
                        updateData({ weaponMastery: selections });
                      }
                    }}
                  />
                );

              case 'branch_choice':
                return (
                  <BranchChoiceWidget
                    key={feature.id}
                    feature={feature}
                    currentChoice={
                      feature.id === 'divine_order'
                        ? data.divineOrder || null
                        : feature.id === 'primal_order'
                          ? data.primalOrder || null
                          : feature.id === 'pact_boon'
                            ? data.pactBoon || null
                            : null
                    }
                    onChoiceChange={(choice) => {
                      if (feature.id === 'divine_order') {
                        updateData({ divineOrder: choice as 'protector' | 'thaumaturge' });
                      } else if (feature.id === 'primal_order') {
                        updateData({ primalOrder: choice as 'magician' | 'warden' });
                      } else if (feature.id === 'pact_boon') {
                        updateData({ pactBoon: choice as 'blade' | 'chain' | 'tome' });
                      }
                    }}
                  />
                );

              case 'list_selection':
                return (
                  <ListSelectionWidget
                    key={feature.id}
                    feature={feature}
                    currentSelection={
                      feature.id === 'fighting_style'
                        ? data.fightingStyle ? [data.fightingStyle] : []
                        : feature.id === 'eldritch_invocations'
                          ? data.eldritchInvocations || []
                          : []
                    }
                    onSelectionChange={(selections) => {
                      if (feature.id === 'fighting_style') {
                        updateData({ fightingStyle: selections[0] || null });
                      } else if (feature.id === 'eldritch_invocations') {
                        updateData({ eldritchInvocations: selections });
                      }
                    }}
                  />
                );

              case 'automatic':
                return <AutomaticWidget key={feature.id} feature={feature} />;

              default:
                console.warn(`Unknown widget type: ${feature.widget_type}`);
                return null;
            }
          })}
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
             // Check Level 1 feature completion (widget system)
             (selectedClass.level_1_features?.some((feature: Level1Feature) => {
               switch (feature.widget_type) {
                 case 'selection_pool':
                   if (feature.id === 'expertise') {
                     return (data.expertiseSkills?.length || 0) < (feature.widget_config as any).count;
                   }
                   if (feature.id === 'weapon_mastery') {
                     return (data.weaponMastery?.length || 0) < (feature.widget_config as any).count;
                   }
                   return false;
                 case 'branch_choice':
                   if (feature.id === 'divine_order') {
                     return !data.divineOrder;
                   }
                   if (feature.id === 'primal_order') {
                     return !data.primalOrder;
                   }
                   if (feature.id === 'pact_boon') {
                     return !data.pactBoon;
                   }
                   return false;
                 case 'list_selection':
                   if (feature.id === 'fighting_style') {
                     return !data.fightingStyle;
                   }
                   if (feature.id === 'eldritch_invocations') {
                     return (data.eldritchInvocations?.length || 0) < (feature.widget_config as any).count;
                   }
                   return false;
                 case 'automatic':
                   return false; // Automatic features don't require validation
                 default:
                   return false;
               }
             }) ?? false)
           }
          className="px-4 py-2 bg-accent-red hover:bg-accent-red-light rounded-lg text-white flex items-center disabled:bg-theme-quaternary disabled:cursor-not-allowed"
        >
          Next: {getNextStepLabel?.() || 'Continue'} <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>

      {/* Duplicate Skill Modal (2024 Rule) */}
      {duplicateSkill && (
        <AnySkillPickerModal
          isOpen={showDuplicateSkillModal}
          onClose={() => {
            setShowDuplicateSkillModal(false);
            setDuplicateSkill(null);
          }}
          duplicateSkill={duplicateSkill}
          alreadySelectedSkills={[
            ...(data.selectedSkills || []),
            ...(BACKGROUNDS.find(bg => bg.name === data.background)?.skill_proficiencies || []),
            ...(data.overflowSkills || [])
          ]}
          onSelectReplacement={(replacementSkill) => {
            // Add replacement skill to overflow skills array
            updateData({
              overflowSkills: [...(data.overflowSkills || []), replacementSkill],
              selectedSkills: [...data.selectedSkills, duplicateSkill as SkillName] // Keep duplicate in class skills for tracking
            });
            setShowDuplicateSkillModal(false);
            setDuplicateSkill(null);
          }}
        />
      )}
    </div>
  );
};
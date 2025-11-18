import React, { useState } from 'react';
import { X, Star, ChevronDown, ChevronUp, Edit2, Trash2 } from 'lucide-react';
import { Monster, UserMonster } from '../../types/dnd';
import { useMonsterContext } from '../../hooks';

interface MonsterStatBlockProps {
  monster: Monster | UserMonster;
  onClose: () => void;
  onEdit?: () => void;
}

const getModifier = (score: number): string => {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
};

const CollapsibleSection: React.FC<{
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-700 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 hover:bg-gray-700/30 transition-colors"
      >
        <h3 className="text-lg font-bold text-red-400">{title}</h3>
        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
      {isOpen && <div className="p-4 pt-0">{children}</div>}
    </div>
  );
};

export const MonsterStatBlock: React.FC<MonsterStatBlockProps> = ({ monster, onClose, onEdit }) => {
  const { isFavorited, toggleFavorite, deleteCustomMonster } = useMonsterContext();
  const isFav = isFavorited(monster.index);
  const isCustom = 'isCustom' in monster && monster.isCustom;

  const handleFavoriteClick = async () => {
    await toggleFavorite(monster.index);
  };

  const handleDelete = async () => {
    if (!isCustom) return;

    if (window.confirm(`Delete "${monster.name}"? This action cannot be undone.`)) {
      await deleteCustomMonster((monster as UserMonster).id);
      onClose();
    }
  };

  const getACText = (): string => {
    if (Array.isArray(monster.armor_class) && monster.armor_class.length > 0) {
      const ac = monster.armor_class[0];
      let text = ac.value.toString();
      if (ac.armor && ac.armor.length > 0) {
        text += ` (${ac.armor.map((a) => a.name).join(', ')})`;
      } else if (ac.type !== 'dex') {
        text += ` (${ac.type})`;
      }
      return text;
    }
    return '10';
  };

  const getSpeedText = (): string => {
    const speeds: string[] = [];
    if (monster.speed.walk) speeds.push(monster.speed.walk);
    if (monster.speed.fly) speeds.push(`fly ${monster.speed.fly}${monster.speed.hover ? ' (hover)' : ''}`);
    if (monster.speed.swim) speeds.push(`swim ${monster.speed.swim}`);
    if (monster.speed.burrow) speeds.push(`burrow ${monster.speed.burrow}`);
    if (monster.speed.climb) speeds.push(`climb ${monster.speed.climb}`);
    return speeds.join(', ') || '0 ft.';
  };

  const getSavingThrows = (): string => {
    const saves = monster.proficiencies.filter((p) => p.proficiency.name.startsWith('Saving Throw:'));
    if (saves.length === 0) return '';
    return saves.map((s) => `${s.proficiency.name.replace('Saving Throw: ', '')} +${s.value}`).join(', ');
  };

  const getSkills = (): string => {
    const skills = monster.proficiencies.filter((p) => p.proficiency.name.startsWith('Skill:'));
    if (skills.length === 0) return '';
    return skills.map((s) => `${s.proficiency.name.replace('Skill: ', '')} +${s.value}`).join(', ');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 overflow-y-auto">
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto bg-gray-900 rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-900 to-red-900 p-6">
            <div className="flex justify-between items-start">
              <div className="flex-grow">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold text-white">{monster.name}</h1>
                  {isCustom && (
                    <span className="px-3 py-1 bg-green-600 text-white text-sm rounded-full">
                      Custom
                    </span>
                  )}
                </div>
                <p className="text-xl text-gray-300 italic">
                  {monster.size} {monster.type}
                  {monster.subtype && ` (${monster.subtype})`}, {monster.alignment}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleFavoriteClick}
                  className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                  title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star
                    className={`w-6 h-6 ${
                      isFav ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'
                    }`}
                  />
                </button>
                {isCustom && onEdit && (
                  <>
                    <button
                      onClick={onEdit}
                      className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      title="Edit monster"
                    >
                      <Edit2 className="w-6 h-6 text-white" />
                    </button>
                    <button
                      onClick={handleDelete}
                      className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                      title="Delete monster"
                    >
                      <Trash2 className="w-6 h-6 text-white" />
                    </button>
                  </>
                )}
                <button
                  onClick={onClose}
                  className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Stat Block Content */}
          <div className="p-6 space-y-4">
            {/* Basic Stats */}
            <div className="space-y-2 pb-4 border-b-2 border-red-700">
              <div className="flex gap-2">
                <span className="font-bold text-red-400">Armor Class</span>
                <span className="text-gray-300">{getACText()}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-red-400">Hit Points</span>
                <span className="text-gray-300">
                  {monster.hit_points} ({monster.hit_points_roll})
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-red-400">Speed</span>
                <span className="text-gray-300">{getSpeedText()}</span>
              </div>
            </div>

            {/* Ability Scores */}
            <div className="grid grid-cols-6 gap-3 pb-4 border-b-2 border-red-700">
              {[
                { name: 'STR', score: monster.strength },
                { name: 'DEX', score: monster.dexterity },
                { name: 'CON', score: monster.constitution },
                { name: 'INT', score: monster.intelligence },
                { name: 'WIS', score: monster.wisdom },
                { name: 'CHA', score: monster.charisma },
              ].map((ability) => (
                <div key={ability.name} className="text-center">
                  <div className="font-bold text-red-400 text-sm">{ability.name}</div>
                  <div className="text-2xl font-bold text-white">{ability.score}</div>
                  <div className="text-sm text-gray-400">({getModifier(ability.score)})</div>
                </div>
              ))}
            </div>

            {/* Additional Stats */}
            <div className="space-y-2 pb-4 border-b-2 border-red-700 text-sm">
              {getSavingThrows() && (
                <div className="flex gap-2">
                  <span className="font-bold text-red-400">Saving Throws</span>
                  <span className="text-gray-300">{getSavingThrows()}</span>
                </div>
              )}
              {getSkills() && (
                <div className="flex gap-2">
                  <span className="font-bold text-red-400">Skills</span>
                  <span className="text-gray-300">{getSkills()}</span>
                </div>
              )}
              {monster.damage_vulnerabilities.length > 0 && (
                <div className="flex gap-2">
                  <span className="font-bold text-red-400">Damage Vulnerabilities</span>
                  <span className="text-gray-300">{monster.damage_vulnerabilities.join(', ')}</span>
                </div>
              )}
              {monster.damage_resistances.length > 0 && (
                <div className="flex gap-2">
                  <span className="font-bold text-red-400">Damage Resistances</span>
                  <span className="text-gray-300">{monster.damage_resistances.join(', ')}</span>
                </div>
              )}
              {monster.damage_immunities.length > 0 && (
                <div className="flex gap-2">
                  <span className="font-bold text-red-400">Damage Immunities</span>
                  <span className="text-gray-300">{monster.damage_immunities.join(', ')}</span>
                </div>
              )}
              {monster.condition_immunities.length > 0 && (
                <div className="flex gap-2">
                  <span className="font-bold text-red-400">Condition Immunities</span>
                  <span className="text-gray-300">
                    {monster.condition_immunities.map((c) => c.name).join(', ')}
                  </span>
                </div>
              )}
              <div className="flex gap-2">
                <span className="font-bold text-red-400">Senses</span>
                <span className="text-gray-300">
                  {Object.entries(monster.senses)
                    .map(([key, value]) => `${key} ${value}`)
                    .join(', ')}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-red-400">Languages</span>
                <span className="text-gray-300">{monster.languages || '—'}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-red-400">Challenge</span>
                <span className="text-gray-300">
                  {monster.challenge_rating} ({monster.xp.toLocaleString()} XP)
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-red-400">Proficiency Bonus</span>
                <span className="text-gray-300">+{monster.proficiency_bonus}</span>
              </div>
            </div>

            {/* Special Abilities */}
            {monster.special_abilities && monster.special_abilities.length > 0 && (
              <CollapsibleSection title="Special Abilities">
                <div className="space-y-3">
                  {monster.special_abilities.map((ability, idx) => (
                    <div key={idx} className="text-sm">
                      <p className="font-bold text-purple-400 italic">{ability.name}.</p>
                      <p className="text-gray-300 mt-1">{ability.desc}</p>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Actions */}
            {monster.actions && monster.actions.length > 0 && (
              <CollapsibleSection title="Actions">
                <div className="space-y-3">
                  {monster.actions.map((action, idx) => (
                    <div key={idx} className="text-sm">
                      <p className="font-bold text-red-400 italic">{action.name}.</p>
                      <p className="text-gray-300 mt-1">{action.desc}</p>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Legendary Actions */}
            {monster.legendary_actions && monster.legendary_actions.length > 0 && (
              <CollapsibleSection title="Legendary Actions">
                <div className="space-y-3">
                  <p className="text-sm text-gray-300 italic mb-3">
                    The {monster.name} can take 3 legendary actions, choosing from the options
                    below. Only one legendary action option can be used at a time and only at the
                    end of another creature's turn. The {monster.name} regains spent legendary
                    actions at the start of its turn.
                  </p>
                  {monster.legendary_actions.map((action, idx) => (
                    <div key={idx} className="text-sm">
                      <p className="font-bold text-yellow-400 italic">{action.name}.</p>
                      <p className="text-gray-300 mt-1">{action.desc}</p>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Reactions */}
            {monster.reactions && monster.reactions.length > 0 && (
              <CollapsibleSection title="Reactions">
                <div className="space-y-3">
                  {monster.reactions.map((reaction, idx) => (
                    <div key={idx} className="text-sm">
                      <p className="font-bold text-blue-400 italic">{reaction.name}.</p>
                      <p className="text-gray-300 mt-1">{reaction.desc}</p>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-800 p-4 flex justify-center">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
            >
              Close Stat Block
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { ArrowLeft, ArrowRight, Shuffle } from 'lucide-react';
import { EquipmentBrowserProps } from '../types/wizard.types';
import { loadEquipment } from '../../../services/dataService';
import { randomizeAdditionalEquipment, filterEquipment, getEquipmentCategories, isInInventory, addToInventory, removeFromInventory, getEquipmentDisplayInfo } from '../../../utils/equipmentBrowserUtils';

const RandomizeButton: React.FC<{ onClick: () => void; title?: string; className?: string }> = ({
  onClick,
  title = "Randomize this section",
  className = ""
}) => {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-2 ${className}`}
      title={title}
    >
      <Shuffle className="w-4 h-4" />
      Randomize
    </button>
  );
};

export const Step7EquipmentBrowser: React.FC<EquipmentBrowserProps> = ({
  data,
  updateData,
  prevStep,
  skipToStep,
  getNextStepLabel
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [yearFilter, setYearFilter] = useState<number | 'all'>('all');

  // Load equipment database
  const equipmentDatabase = useMemo(() => loadEquipment(), []);

  // Get all equipment categories
  const categories = getEquipmentCategories(equipmentDatabase);

  // Filter equipment
  const filteredEquipment = filterEquipment(equipmentDatabase, {
    searchQuery,
    category: categoryFilter,
    year: yearFilter
  });

  // Check if item is already in starting inventory
  const checkIsInInventory = (equipmentSlug: string): number => {
    return isInInventory(equipmentSlug, data.startingInventory || []);
  };

  // Add item to starting inventory
  const handleAddToInventory = (equipmentSlug: string) => {
    const newInventory = addToInventory(equipmentSlug, data.startingInventory || []);
    updateData({ startingInventory: newInventory });
  };

  // Remove item from starting inventory
  const handleRemoveFromInventory = (equipmentSlug: string) => {
    const newInventory = removeFromInventory(equipmentSlug, data.startingInventory || []);
    updateData({ startingInventory: newInventory });
  };

  return (
    <div className="space-y-4">
      <div className='flex justify-between items-start'>
        <div className='flex-1'>
          <h3 className="text-xl font-bold text-yellow-300 mb-2">Customize Starting Equipment</h3>
          <p className="text-sm text-gray-400">
            Browse and add additional equipment to your starting inventory. You already have your class equipment package.
          </p>
        </div>
        <RandomizeButton
          onClick={() => {
            const additionalEquipment = randomizeAdditionalEquipment();
            updateData({ startingInventory: additionalEquipment });
          }}
          title="Randomize additional equipment"
        />
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Search equipment..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-yellow-500 focus:outline-none"
        />

        <div className="flex gap-2 flex-wrap">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-yellow-500 focus:outline-none"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-yellow-500 focus:outline-none"
          >
            <option value="all">All Editions</option>
            <option value="2014">2014 SRD</option>
            <option value="2024">2024 SRD</option>
          </select>
        </div>
      </div>

      {/* Equipment List */}
      <div className="bg-gray-700/30 rounded-lg p-4 max-h-[400px] overflow-y-auto">
        <div className="grid grid-cols-1 gap-2">
          {filteredEquipment.slice(0, 50).map(eq => {
            const inInventory = checkIsInInventory(eq.slug);
            const displayInfo = getEquipmentDisplayInfo(eq);

            return (
              <div
                key={`${eq.slug}-${eq.year}`}
                className="bg-gray-700/50 p-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-grow min-w-0">
                    <div className="text-left">
                      <div className="font-semibold text-white">{displayInfo.name}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-2 flex-wrap">
                        <span>{displayInfo.category}</span>
                        <span>•</span>
                        <span>{displayInfo.cost}</span>
                        <span>•</span>
                        <span>{displayInfo.weight}</span>
                        <span className="bg-gray-600 px-2 py-0.5 rounded">{displayInfo.year}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {inInventory > 0 && (
                      <span className="text-sm font-mono text-yellow-300">×{inInventory}</span>
                    )}
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleAddToInventory(eq.slug)}
                        className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-sm"
                      >
                        +
                      </button>
                      {inInventory > 0 && (
                        <button
                          onClick={() => handleRemoveFromInventory(eq.slug)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-sm"
                        >
                          −
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {filteredEquipment.length > 50 && (
          <p className="text-center text-xs text-gray-400 mt-3">
            Showing first 50 results. Refine your search to see more.
          </p>
        )}
        {filteredEquipment.length === 0 && (
          <p className="text-center text-gray-400 py-8">No equipment found matching your filters.</p>
        )}
      </div>

      {/* Current Custom Additions */}
      {data.startingInventory && data.startingInventory.length > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-yellow-400 mb-2">
            Custom Equipment Added ({data.startingInventory.length} items)
          </h4>
          <div className="text-xs text-gray-400">
            These items will be added to your starting inventory along with your class equipment package.
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button
          onClick={prevStep}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </button>
        <button
          onClick={() => skipToStep?.(11)}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white flex items-center"
        >
          Next: {getNextStepLabel?.() || 'Continue'} <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>

      {/* Equipment Detail Modal would go here if needed */}
    </div>
  );
};
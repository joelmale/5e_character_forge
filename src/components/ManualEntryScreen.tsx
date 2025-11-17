import React from 'react';
import { ArrowLeft, FileText, Clock } from 'lucide-react';

interface ManualEntryScreenProps {
  onBack: () => void;
}

const ManualEntryScreen: React.FC<ManualEntryScreenProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Options</span>
          </button>
          <h1 className="text-3xl font-bold text-red-400">Manual Character Entry</h1>
        </div>

        {/* Coming Soon Content */}
        <div className="bg-gray-800 rounded-xl shadow-xl p-8 md:p-12 text-center">
          <div className="max-w-2xl mx-auto">
            {/* Icon */}
            <div className="mb-6">
              <FileText className="w-16 h-16 text-blue-400 mx-auto" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-yellow-300 mb-4">
              Coming Soon!
            </h2>

            {/* Description */}
            <p className="text-gray-300 text-lg mb-6 leading-relaxed">
              The manual character entry feature is currently under development. This will allow you to:
            </p>

            {/* Feature List */}
            <div className="text-left max-w-md mx-auto mb-8">
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  Transfer pen & paper characters
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  Fill out complete character sheets
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  Import from external sources
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  Full manual control over all stats
                </li>
              </ul>
            </div>

            {/* Timeline */}
            <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center space-x-2 text-gray-400">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Expected completion: Future update</span>
              </div>
            </div>

            {/* Call to Action */}
            <div className="space-y-4">
              <p className="text-gray-400">
                In the meantime, try our guided character creation wizards!
              </p>
              <button
                onClick={onBack}
                className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg text-white font-semibold transition-colors"
              >
                Try Character Wizards
              </button>
            </div>
          </div>
        </div>

        {/* TODO Comments for Future Implementation */}
        {/*
        TODO: Implement Manual Character Entry
        - Full character sheet form
        - Validation for all stats
        - Import/export functionality
        - Pen & paper character transfer
        - Custom item/feat/spell management
        - Advanced character building tools
        */}
      </div>
    </div>
  );
};

export default ManualEntryScreen;
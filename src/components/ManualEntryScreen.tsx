import React from 'react';
import { ArrowLeft, FileText, Clock } from 'lucide-react';

interface ManualEntryScreenProps {
  onBack: () => void;
}

const ManualEntryScreen: React.FC<ManualEntryScreenProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-theme-primary text-white font-sans">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-4 py-2 bg-theme-tertiary hover:bg-theme-quaternary rounded-lg text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Options</span>
          </button>
          <h1 className="text-3xl font-bold text-accent-red-light">Manual Character Entry</h1>
        </div>

        {/* Coming Soon Content */}
        <div className="bg-theme-secondary rounded-xl shadow-xl p-8 md:p-12 text-center">
          <div className="max-w-2xl mx-auto">
            {/* Icon */}
            <div className="mb-6">
              <FileText className="w-16 h-16 text-accent-blue-light mx-auto" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-accent-yellow-light mb-4">
              Coming Soon!
            </h2>

            {/* Description */}
            <p className="text-theme-tertiary text-lg mb-6 leading-relaxed">
              The manual character entry feature is currently under development. This will allow you to:
            </p>

            {/* Feature List */}
            <div className="text-left max-w-md mx-auto mb-8">
              <ul className="space-y-3 text-theme-tertiary">
                <li className="flex items-start">
                  <span className="text-accent-green-light mr-2">✓</span>
                  Transfer pen & paper characters
                </li>
                <li className="flex items-start">
                  <span className="text-accent-green-light mr-2">✓</span>
                  Fill out complete character sheets
                </li>
                <li className="flex items-start">
                  <span className="text-accent-green-light mr-2">✓</span>
                  Import from external sources
                </li>
                <li className="flex items-start">
                  <span className="text-accent-green-light mr-2">✓</span>
                  Full manual control over all stats
                </li>
              </ul>
            </div>

            {/* Timeline */}
            <div className="bg-theme-tertiary/50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center space-x-2 text-theme-muted">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Expected completion: Future update</span>
              </div>
            </div>

            {/* Call to Action */}
            <div className="space-y-4">
              <p className="text-theme-muted">
                In the meantime, try our guided character creation wizards!
              </p>
              <button
                onClick={onBack}
                className="px-6 py-3 bg-accent-red hover:bg-accent-red-light rounded-lg text-white font-semibold transition-colors"
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
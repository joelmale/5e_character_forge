import React from 'react';
import { X } from 'lucide-react';

interface FeatureModalProps {
  feature: {
    name: string;
    description: string;
    source?: string;
  } | null;
  onClose: () => void;
}

export const FeatureModal: React.FC<FeatureModalProps> = ({ feature, onClose }) => {
  if (!feature) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-red-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-red-800 flex justify-between items-center">
          <h3 className="text-2xl font-bold text-red-400">{feature.name}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-gray-300 leading-relaxed">{feature.description}</p>
          {feature.source && (
            <p className="text-xs text-gray-500 italic text-right">Source: {feature.source}</p>
          )}
        </div>
      </div>
    </div>
  );
};

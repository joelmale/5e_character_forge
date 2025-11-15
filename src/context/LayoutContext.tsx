import React, { createContext, useContext, useState, ReactNode } from 'react';

export type LayoutType = 'modern-stacked' | 'classic-dnd';

interface LayoutContextType {
  layout: LayoutType;
  setLayout: (layout: LayoutType) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [layout, setLayoutState] = useState<LayoutType>(() => {
    // Load from localStorage or default to modern-stacked
    const saved = localStorage.getItem('character-sheet-layout');
    return (saved as LayoutType) || 'modern-stacked';
  });

  const setLayout = (newLayout: LayoutType) => {
    setLayoutState(newLayout);
    localStorage.setItem('character-sheet-layout', newLayout);
  };

  return (
    <LayoutContext.Provider value={{ layout, setLayout }}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};

import { useState, useMemo } from 'react';
import { FramePreset, CornerStyle, EdgeStyle, OrnamentStyle } from './BorderElements';

// ============================================
// THEME CONFIGURATIONS
// ============================================

export interface BorderTheme {
  name: string;
  cornerStyle: CornerStyle;
  edgeStyle: EdgeStyle;
  color: string;
  backgroundColor: string;
  strokeWidth: number;
  cornerSize: number;
  edgeWidth: number;
  shadow?: string;
  glow?: string;
}

export const BorderThemes: Record<string, BorderTheme> = {
  // Fantasy RPG Themes
  medieval: {
    name: 'Medieval',
    cornerStyle: 'ornate',
    edgeStyle: 'double',
    color: '#2c2416',
    backgroundColor: 'rgba(245, 245, 220, 0.1)',
    strokeWidth: 2,
    cornerSize: 50,
    edgeWidth: 10,
    shadow: '2px 2px 8px rgba(0, 0, 0, 0.3)'
  },
  
  elven: {
    name: 'Elven',
    cornerStyle: 'ornate',
    edgeStyle: 'decorative',
    color: '#2a5434',
    backgroundColor: 'rgba(42, 84, 52, 0.05)',
    strokeWidth: 1.5,
    cornerSize: 60,
    edgeWidth: 12,
    glow: '0 0 10px rgba(42, 84, 52, 0.3)'
  },
  
  dwarven: {
    name: 'Dwarven',
    cornerStyle: 'cut',
    edgeStyle: 'double',
    color: '#4a4a4a',
    backgroundColor: 'rgba(74, 74, 74, 0.1)',
    strokeWidth: 3,
    cornerSize: 40,
    edgeWidth: 10,
    shadow: '3px 3px 10px rgba(0, 0, 0, 0.4)'
  },
  
  arcane: {
    name: 'Arcane',
    cornerStyle: 'ornate',
    edgeStyle: 'decorative',
    color: '#4b0082',
    backgroundColor: 'rgba(75, 0, 130, 0.05)',
    strokeWidth: 2,
    cornerSize: 55,
    edgeWidth: 15,
    glow: '0 0 15px rgba(138, 43, 226, 0.4)'
  },
  
  demonic: {
    name: 'Demonic',
    cornerStyle: 'cut',
    edgeStyle: 'straight',
    color: '#8B0000',
    backgroundColor: 'rgba(139, 0, 0, 0.1)',
    strokeWidth: 2.5,
    cornerSize: 45,
    edgeWidth: 10,
    glow: '0 0 20px rgba(255, 0, 0, 0.3)'
  },
  
  celestial: {
    name: 'Celestial',
    cornerStyle: 'rounded',
    edgeStyle: 'decorative',
    color: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    strokeWidth: 2,
    cornerSize: 50,
    edgeWidth: 12,
    glow: '0 0 20px rgba(255, 215, 0, 0.4)'
  },
  
  // Minimalist Themes
  minimal: {
    name: 'Minimal',
    cornerStyle: 'rounded',
    edgeStyle: 'straight',
    color: '#333333',
    backgroundColor: 'transparent',
    strokeWidth: 1,
    cornerSize: 20,
    edgeWidth: 8
  },
  
  tech: {
    name: 'Tech',
    cornerStyle: 'cut',
    edgeStyle: 'straight',
    color: '#00CED1',
    backgroundColor: 'rgba(0, 206, 209, 0.05)',
    strokeWidth: 1,
    cornerSize: 30,
    edgeWidth: 8,
    glow: '0 0 10px rgba(0, 206, 209, 0.5)'
  }
};

// ============================================
// CUSTOM HOOK FOR BORDER THEMING
// ============================================

interface UseBorderThemeOptions {
  initialTheme?: keyof typeof BorderThemes;
  customTheme?: Partial<BorderTheme>;
  responsive?: boolean;
}

export const useBorderTheme = (options: UseBorderThemeOptions = {}) => {
  const {
    initialTheme = 'medieval',
    customTheme,
    responsive = true
  } = options;

  const [currentTheme, setCurrentTheme] = useState<string>(initialTheme);
  const [customizations, setCustomizations] = useState<Partial<BorderTheme>>(customTheme || {});

  const theme = useMemo(() => {
    const baseTheme = BorderThemes[currentTheme] || BorderThemes.medieval;
    const merged = { ...baseTheme, ...customizations };

    // Apply responsive adjustments
    if (responsive && typeof window !== 'undefined' && window.innerWidth < 768) {
      merged.cornerSize = Math.max(20, merged.cornerSize * 0.7);
      merged.edgeWidth = Math.max(6, merged.edgeWidth * 0.7);
    }

    return merged;
  }, [currentTheme, customizations, responsive]);

  const applyTheme = (themeName: keyof typeof BorderThemes) => {
    setCurrentTheme(themeName);
    setCustomizations({});
  };

  const customize = (updates: Partial<BorderTheme>) => {
    setCustomizations(prev => ({ ...prev, ...updates }));
  };

  const reset = () => {
    setCurrentTheme(initialTheme);
    setCustomizations(customTheme || {});
  };

  return {
    theme,
    currentTheme,
    applyTheme,
    customize,
    reset,
    themes: Object.keys(BorderThemes)
  };
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Generate CSS variables from a BorderTheme
 */
export const generateCSSVariables = (theme: BorderTheme): Record<string, string> => {
  return {
    '--border-color': theme.color,
    '--border-bg-color': theme.backgroundColor,
    '--border-stroke-width': `${theme.strokeWidth}px`,
    '--border-corner-size': `${theme.cornerSize}px`,
    '--border-edge-width': `${theme.edgeWidth}px`,
    ...(theme.shadow && { '--border-shadow': theme.shadow }),
    ...(theme.glow && { '--border-glow': theme.glow })
  };
};

/**
 * Create a composite border style string
 */
export const createBorderStyle = (
  width: number = 2,
  style: 'solid' | 'double' | 'dashed' | 'dotted' = 'solid',
  color: string = '#000000'
): string => {
  return `${width}px ${style} ${color}`;
};

/**
 * Calculate stat modifier for D&D 5e
 */
export const calculateModifier = (statValue: number): string => {
  const modifier = Math.floor((statValue - 10) / 2);
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
};

/**
 * Generate a random theme
 */
export const getRandomTheme = (): keyof typeof BorderThemes => {
  const themes = Object.keys(BorderThemes) as Array<keyof typeof BorderThemes>;
  return themes[Math.floor(Math.random() * themes.length)];
};

// ============================================
// THEME PROVIDER COMPONENT
// ============================================

import React, { createContext, useContext } from 'react';

interface BorderThemeContextType {
  theme: BorderTheme;
  applyTheme: (themeName: keyof typeof BorderThemes) => void;
  customize: (updates: Partial<BorderTheme>) => void;
  reset: () => void;
}

const BorderThemeContext = createContext<BorderThemeContextType | null>(null);

export const useBorderThemeContext = () => {
  const context = useContext(BorderThemeContext);
  if (!context) {
    throw new Error('useBorderThemeContext must be used within BorderThemeProvider');
  }
  return context;
};

interface BorderThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: keyof typeof BorderThemes;
  customTheme?: Partial<BorderTheme>;
}

export const BorderThemeProvider: React.FC<BorderThemeProviderProps> = ({
  children,
  initialTheme = 'medieval',
  customTheme
}) => {
  const themeHook = useBorderTheme({ initialTheme, customTheme });

  return (
    <BorderThemeContext.Provider value={themeHook}>
      <div style={generateCSSVariables(themeHook.theme) as React.CSSProperties}>
        {children}
      </div>
    </BorderThemeContext.Provider>
  );
};

// ============================================
// ANIMATION UTILITIES
// ============================================

export const BorderAnimations = {
  // Fade in animation
  fadeIn: {
    initial: { opacity: 0, transform: 'scale(0.95)' },
    animate: { opacity: 1, transform: 'scale(1)' },
    transition: { duration: 0.3 }
  },
  
  // Slide in from top
  slideInTop: {
    initial: { opacity: 0, transform: 'translateY(-20px)' },
    animate: { opacity: 1, transform: 'translateY(0)' },
    transition: { duration: 0.4 }
  },
  
  // Expand from center
  expandFromCenter: {
    initial: { opacity: 0, transform: 'scale(0)' },
    animate: { opacity: 1, transform: 'scale(1)' },
    transition: { duration: 0.5, ease: 'easeOut' }
  },
  
  // Glow pulse
  glowPulse: {
    animate: {
      filter: [
        'drop-shadow(0 0 5px currentColor)',
        'drop-shadow(0 0 20px currentColor)',
        'drop-shadow(0 0 5px currentColor)'
      ]
    },
    transition: { duration: 2, repeat: Infinity }
  }
};

// ============================================
// PRESET CONFIGURATIONS
// ============================================

export const CharacterSheetPresets = {
  statsPanel: {
    variant: 'simple' as FramePreset,
    padding: '10px',
    className: 'stat-block'
  },
  
  inventoryPanel: {
    variant: 'ornate' as FramePreset,
    padding: '20px',
    showOrnament: true,
    ornamentPosition: 'top' as const,
    ornamentStyle: 'flourish' as OrnamentStyle
  },
  
  spellsPanel: {
    variant: 'decorative' as FramePreset,
    padding: '15px',
    backgroundColor: 'rgba(138, 43, 226, 0.02)'
  },
  
  notesPanel: {
    variant: 'rounded' as FramePreset,
    padding: '20px',
    backgroundColor: 'rgba(245, 245, 220, 0.8)'
  }
};

// ============================================
// HELPER COMPONENTS
// ============================================

interface AnimatedBorderPanelProps {
  children: React.ReactNode;
  animation?: keyof typeof BorderAnimations;
  [key: string]: any;
}

export const AnimatedBorderPanel: React.FC<AnimatedBorderPanelProps> = ({
  children,
  animation = 'fadeIn',
  ...props
}) => {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    setIsVisible(true);
  }, []);

  const animationStyle = isVisible ? BorderAnimations[animation].animate : BorderAnimations[animation].initial;

  return (
    <div
      style={{
        ...animationStyle,
        transition: 'all 0.3s ease-out'
      }}
    >
      {children}
    </div>
  );
};

// Theme selector component
export const ThemeSelector: React.FC = () => {
  const { currentTheme, applyTheme, themes } = useBorderThemeContext();

  return (
    <select
      value={currentTheme}
      onChange={(e) => applyTheme(e.target.value as keyof typeof BorderThemes)}
      style={{
        padding: '8px 12px',
        borderRadius: '4px',
        border: '2px solid var(--border-color)',
        backgroundColor: 'var(--border-bg-color)',
        fontSize: '14px',
        fontFamily: 'inherit'
      }}
    >
      {themes.map(theme => (
        <option key={theme} value={theme}>
          {BorderThemes[theme]?.name || theme}
        </option>
      ))}
    </select>
  );
};

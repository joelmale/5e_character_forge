import React, { useState, useEffect } from 'react';
import { CharacterSheetProps } from '../../types/components';
import { useLayout } from '../../context';
import { ModernStackedLayout, ClassicDndLayout, MobileLayout, PaperSheetLayout } from './layouts';

/**
 * CharacterSheet Wrapper
 *
 * This component selects the appropriate layout based on:
 * - Screen size (mobile always uses ModernStackedLayout)
 * - User preference (desktop can choose between layouts)
 */
export const CharacterSheet: React.FC<CharacterSheetProps> = (props) => {
  console.log('📄 [CHARACTER SHEET] CharacterSheet component rendered for:', props.character.name);

  const { layoutMode } = useLayout();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mobile always uses ModernStackedLayout
  if (isMobile) {
    return <ModernStackedLayout {...props} />;
  }

  // Desktop uses selected layout
  switch (layoutMode) {
    case 'classic-dnd':
      return <ClassicDndLayout {...props} />;

    case 'paper-sheet':
      return <PaperSheetLayout {...props} />;

    case 'mobile':
      return <MobileLayout {...props} />;

    case 'modern-stacked':
    default:
      return <ModernStackedLayout {...props} />;
  }
};

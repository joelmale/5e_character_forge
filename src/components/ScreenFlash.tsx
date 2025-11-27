import React, { useEffect, useState } from 'react';

interface ScreenFlashProps {
  type: 'success' | 'failure' | null;
  onComplete?: () => void;
}

export const ScreenFlash: React.FC<ScreenFlashProps> = ({ type, onComplete }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (type) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 600); // Flash duration
      return () => clearTimeout(timer);
    }
  }, [type, onComplete]);

  if (!isVisible || !type) return null;

  const bgColor = type === 'success'
    ? 'bg-gradient-to-br from-yellow-300/40 via-yellow-400/30 to-yellow-500/40'
    : 'bg-gradient-to-br from-red-400/30 via-red-500/25 to-red-600/30';

  const animationClass = type === 'success'
    ? 'animate-screen-flash-success'
    : 'animate-screen-flash-failure';

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-[100] ${bgColor} ${animationClass}`}
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

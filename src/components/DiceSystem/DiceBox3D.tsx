/* eslint-disable no-empty */
import React, { useEffect, useRef, useState } from 'react';
import type { DiceRoll } from '../../services/diceService';
import DiceBox from '@3d-dice/dice-box';

interface DiceBox3DProps {
  latestRoll: DiceRoll | null;
  onRollComplete?: () => void;
}

export const DiceBox3D: React.FC<DiceBox3DProps> = ({
  latestRoll,
  onRollComplete,
}) => {
  const diceBoxRef = useRef<DiceBox | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastRollIdRef = useRef<string | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diceVisible, setDiceVisible] = useState(false);

  // Function to ensure canvas is visible and properly sized
  const ensureCanvasVisible = () => {
    const container = document.getElementById('dice-box');
    if (container) {
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      if (canvas) {
        // Calculate 50% of viewport size
        const width = Math.floor(window.innerWidth * 0.5);
        const height = Math.floor(window.innerHeight * 0.5);

        canvas.style.display = 'block';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.width = width;
        canvas.height = height;

        console.log('🎲 [DiceBox3D] Canvas sized to:', canvas.width, 'x', canvas.height);
      }
    }
  };

  // Initialize DiceBox lazily on first roll
  const initDiceBoxIfNeeded = async () => {
    if (isInitialized || diceBoxRef.current) {
      return;
    }

    try {
      console.log('🎲 [DiceBox3D] Initializing DiceBox with v1.1.0+ API...');
      const diceBox = new DiceBox({
        container: '#dice-box',  // v1.1.x API uses 'container' property
        assetPath: '/assets/dice-box/',
        offscreen: false,
        gravity: 1,
        friction: 0.8,
        restitution: 0.6,
        linearDamping: 0.4,
        angularDamping: 0.4,
        spinForce: 3,
        throwForce: 4,
        startingHeight: 8,
        settleTimeout: 5000,
        enableShadows: true,
        scale: 6
      });

      await diceBox.init();
      console.log('🎲 [DiceBox3D] DiceBox initialized successfully');

      // Ensure canvas is visible and sized properly
      setTimeout(() => {
        ensureCanvasVisible();
      }, 100);

      diceBoxRef.current = diceBox;
      setIsInitialized(true);

      diceBox.onRollComplete = (results) => {
        console.log('Roll completed:', results);
        if (onRollComplete) {
          onRollComplete();
        }
      };

    } catch (err) {
      console.error('Failed to initialize 3D dice:', err);
      setError('Failed to initialize 3D dice');
    }
  };

  // Handle dice rolls
  useEffect(() => {
    if (!latestRoll || lastRollIdRef.current === latestRoll.id) {
      return;
    }

    const performRoll = async () => {
      // Initialize DiceBox if needed
      await initDiceBoxIfNeeded();

      if (!diceBoxRef.current) {
        console.error('DiceBox not available after initialization');
        return;
      }

      lastRollIdRef.current = latestRoll.id;

      // Extract just the dice notation (remove modifiers)
      const diceNotation = latestRoll.notation.replace(/[+-]\d+$/, '').trim();
      console.log('🎲 [DiceBox3D] Original notation:', latestRoll.notation, 'Parsed notation:', diceNotation);

      // Clear previous dice first
      await diceBoxRef.current.clear();

      // Show dice and ensure canvas is visible
      setDiceVisible(true);
      ensureCanvasVisible();

      console.log('🎲 [DiceBox3D] Rolling dice with notation:', diceNotation);
      diceBoxRef.current.roll(diceNotation)
        .then(results => {
          console.log('🎲 [DiceBox3D] Dice roll succeeded with results:', results);
        })
        .catch(err => {
          console.error('❌ [DiceBox3D] Dice roll failed:', err);
        });

      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        if (diceBoxRef.current) {
          diceBoxRef.current.clear();
          setDiceVisible(false);
        }
      }, 5000);

      return () => clearTimeout(timer);
    };

    performRoll();
  }, [latestRoll]);

  if (error) {
    return (
      <div className="fixed top-4 right-4 p-4 bg-red-900/90 text-white rounded-lg shadow-xl z-50 max-w-sm">
        <p className="font-bold">Dice Error</p>
        <p className="text-sm mt-1">{error}</p>
        <button
          onClick={() => setError(null)}
          className="mt-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        pointerEvents: diceVisible ? 'auto' : 'none',
        opacity: diceVisible ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
      }}
      onClick={() => {
        if (diceBoxRef.current) {
          diceBoxRef.current.clear();
          setDiceVisible(false);
        }
      }}
    >
      {/* Dice box container - 50% size, centered with white border */}
      <div
        id="dice-box"
        ref={containerRef}
        className={diceVisible ? 'cursor-pointer' : ''}
        style={{
          width: '50vw',
          height: '50vh',
          border: '2px solid rgba(255, 255, 255, 0.5)',
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          position: 'relative',
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {/* Force canvas to be positioned inside this container */}
        <style>{`
          #dice-box canvas {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
          }
        `}</style>
        {/* Placeholder content to ensure container is not empty */}
        <div style={{ display: 'none' }}>Dice Box Container</div>
      </div>
    </div>
  );
};

export default DiceBox3D;
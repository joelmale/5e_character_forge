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
  console.error('🎲 [STEP 1] DiceBox3D component rendered, latestRoll:', latestRoll?.notation);

  const diceBoxRef = useRef<DiceBox | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRollIdRef = useRef<string | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [webGLSupported, setWebGLSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [diceVisible, setDiceVisible] = useState(false);

  // Check WebGL support and initialize DiceBox
  useEffect(() => {
    console.log('🎲 [STEP 2] useEffect for initialization triggered');
    let mounted = true;

    const initDiceSystem = async () => {
      console.log('🎲 [STEP 3] initDiceSystem function called');

      // Check WebGL support
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      console.log('🎲 [STEP 4] WebGL check result:', !!gl);

      if (!gl) {
        console.log('🎲 [STEP 5] WebGL not supported, exiting');
        if (mounted) {
          setWebGLSupported(false);
          setError('WebGL is not supported in your browser');
        }
        return;
      }

      console.log('🎲 [STEP 6] WebGL supported, proceeding with DiceBox setup');

      try {
        // Check if container exists
        const containerElement = document.getElementById('dice-box');
        console.log('🎲 [STEP 7] Container element exists:', !!containerElement);

        // Create DiceBox instance with minimal config first
        const config = {
          id: 'dice-canvas',
          assetPath: '/assets/dice-box/',
          container: '#dice-box',
          theme: 'default',
          offscreen: false,
        };
        console.log('🎲 [STEP 8] Using minimal DiceBox config:', config);

        console.log('🎲 DiceBox config:', config);

        console.log('🎲 Initializing DiceBox...');
        console.log('🎲 Creating DiceBox with config:', config);

        let diceBox;
        try {
          console.log('🎲 [STEP 9] Calling DiceBox constructor...');
          diceBox = new DiceBox(config);
          console.log('🎲 [STEP 10] DiceBox constructor succeeded');
        } catch (constructorError) {
          console.error('🎲 [STEP 10-FAILED] DiceBox constructor failed:', constructorError);
          throw constructorError;
        }

        console.log('🎲 [STEP 11] DiceBox created, calling init()...');

        // Wait for initialization to complete
        await diceBox.init();
        console.log('🎲 [STEP 12] DiceBox.init() completed successfully');

        if (!mounted) {
          console.log('🎲 Component unmounted during init');
          return;
        }

        // Store the diceBox instance in ref
        diceBoxRef.current = diceBox;
        console.log('🎲 [STEP 13] DiceBox stored in ref, methods:', Object.getOwnPropertyNames(diceBox));

        // Mark as initialized
        setIsInitialized(true);
        console.log('🎲 [STEP 14] DiceBox marked as initialized, isInitialized should be true now');

        // Simple roll complete handler
        diceBox.onRollComplete = (_results) => {
          if (onRollComplete) {
            onRollComplete();
          }
        };

      } catch (err) {
        console.error('🎲 DiceBox initialization failed:', err);
        if (!mounted) return;

        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.log('🎲 Error message:', errorMessage);

        if (errorMessage.includes('WebAssembly') || errorMessage.includes('wasm')) {
          setError('3D dice physics not available. WebAssembly support required.');
        } else if (errorMessage.includes('theme config')) {
          setError('Dice theme configuration not found. Check theme files.');
        } else {
          setError('Failed to initialize 3D dice. Check console for details.');
        }
      }
    };

    initDiceSystem();

const diceBox = diceBoxRef.current;
    // Cleanup function
    return () => {
      mounted = false;
      // Only clear if the diceBox is fully initialized and has the clear method
      if (diceBox && typeof diceBox.clear === 'function') {
        try {
          diceBox.clear();
      } catch {}
      }
    };
  }, [onRollComplete]);

  // Handle dice rolls
  useEffect(() => {
    console.error('🎲 [STEP 15] Dice roll useEffect triggered:', {
      isInitialized,
      hasDiceBox: !!diceBoxRef.current,
      hasLatestRoll: !!latestRoll,
      rollId: latestRoll?.id,
      lastRollId: lastRollIdRef.current
    });

    if (
      !isInitialized ||
      !diceBoxRef.current ||
      !latestRoll ||
      lastRollIdRef.current === latestRoll.id
    ) {
      console.log('🎲 [STEP 16] Skipping dice roll due to conditions:', {
        isInitialized,
        hasDiceBox: !!diceBoxRef.current,
        hasLatestRoll: !!latestRoll,
        isDuplicate: lastRollIdRef.current === latestRoll?.id
      });
      return;
    }

    console.log('🎲 [STEP 17] All conditions met, proceeding with dice roll');

    lastRollIdRef.current = latestRoll.id;

    // Clear any existing timeout
    if (clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current);
    }

    // Roll the dice
    const rollDice = async () => {
      console.error('🎲 [STEP 18] rollDice function called');

      try {
        // Extract just the dice notation (remove modifiers)
        // The 3D dice library only handles dice, not modifiers
        const diceNotation = latestRoll.notation.replace(/[+-]\d+/, '');
        console.log('🎲 [STEP 19] Original notation:', latestRoll.notation, 'Cleaned notation:', diceNotation);

        console.log('🎲 Rolling dice with notation:', diceNotation, 'from original:', latestRoll.notation);

        // Show the dice box first
        if (diceBoxRef.current) {
          console.log('🎲 DiceBox methods available:', typeof diceBoxRef.current.roll, typeof diceBoxRef.current.show);

          // Try to roll the dice directly
          console.log('🎲 Rolling dice with notation:', diceNotation);
          console.log('🎲 [STEP 20] DiceBox instance details:', {
            exists: !!diceBoxRef.current,
            type: typeof diceBoxRef.current,
            methods: diceBoxRef.current ? Object.getOwnPropertyNames(diceBoxRef.current) : 'N/A',
            allMethods: diceBoxRef.current ? Object.getOwnPropertyNames(Object.getPrototypeOf(diceBoxRef.current)) : 'N/A',
            hasRoll: diceBoxRef.current ? typeof diceBoxRef.current.roll === 'function' : false,
            hasShow: diceBoxRef.current ? typeof diceBoxRef.current.show === 'function' : false,
            hasAdd: diceBoxRef.current ? typeof (diceBoxRef.current as any).add === 'function' : false,
            hasThrow: diceBoxRef.current ? typeof (diceBoxRef.current as any).throw === 'function' : false
          });

          if (!diceBoxRef.current) {
            console.error('❌ DiceBox ref is null');
            setError('3D dice system not ready.');
            return;
          }

          try {
            // Check DiceBox properties
            console.log('🎲 DiceBox properties:', Object.keys(diceBoxRef.current));
            console.log('🎲 DiceBox prototype:', Object.getPrototypeOf(diceBoxRef.current));

            // Make sure the dice box is visible first
            console.log('🎲 [STEP 21] Checking show method availability');
            if (typeof diceBoxRef.current.show === 'function') {
              console.log('🎲 [STEP 22] Calling show() method');
              diceBoxRef.current.show();
              console.log('🎲 [STEP 23] Called show() method successfully');
            } else {
              console.warn('⚠️ [STEP 22] show() method not available');
            }

            // Try the roll method with different approaches
            console.log('🎲 [STEP 24] Checking roll method availability');
            if (typeof diceBoxRef.current.roll === 'function') {
              console.log('🎲 [STEP 25] Calling roll() method with:', diceNotation);

              // Try different roll method signatures
              try {
                console.log('🎲 [STEP 26] Trying string notation');
                // Method 1: String notation
                const rollResult = diceBoxRef.current.roll(diceNotation);
                console.log('🎲 [STEP 27] roll() with string returned:', rollResult);

                if (rollResult && typeof rollResult.then === 'function') {
                  console.log('🎲 [STEP 28] Awaiting string notation promise');
                  await rollResult;
                  console.log('🎲 [STEP 29] roll() string promise resolved');
                } else {
                  console.log('🎲 [STEP 28] String notation did not return a promise');
                }
              } catch (stringError) {
                console.warn('🎲 [STEP 26-FAILED] String notation failed, trying alternatives:', stringError);

                try {
                  console.log('🎲 [STEP 30] Trying array notation');
                  // Method 2: Array notation (some libraries expect this)
                  const rollResult2 = diceBoxRef.current.roll([diceNotation]);
                  console.log('🎲 [STEP 31] roll() with array returned:', rollResult2);

                  if (rollResult2 && typeof rollResult2.then === 'function') {
                    console.log('🎲 [STEP 32] Awaiting array notation promise');
                    await rollResult2;
                    console.log('🎲 [STEP 33] roll() array promise resolved');
                  } else {
                    console.log('🎲 [STEP 32] Array notation did not return a promise');
                  }
                } catch (arrayError) {
                  console.warn('🎲 [STEP 30-FAILED] Array notation also failed:', arrayError);

                  // Method 3: Try with empty array
                  try {
                    console.log('🎲 [STEP 34] Trying empty array notation');
                    const rollResult3 = diceBoxRef.current.roll([]);
                    console.log('🎲 [STEP 35] roll() with empty array returned:', rollResult3);

                    if (rollResult3 && typeof rollResult3.then === 'function') {
                      console.log('🎲 [STEP 36] Awaiting empty array promise');
                      await rollResult3;
                      console.log('🎲 [STEP 37] roll() empty array promise resolved');
                    } else {
                      console.log('🎲 [STEP 36] Empty array did not return a promise');
                    }
                  } catch (emptyArrayError) {
                    console.error('🎲 [STEP 34-FAILED] All roll methods failed');
                    throw emptyArrayError;
                  }
                }
              }
            } else {
              console.error('❌ roll method not found on DiceBox instance');
              setError('3D dice roll method not available.');
              return;
            }

            console.log('🎲 [STEP 38] Setting diceVisible to true');
            setDiceVisible(true);
            console.log('🎲 [STEP 39] Dice roll process completed successfully');
          } catch (rollError) {
            console.error('❌ [STEP ROLL-FAILED] Roll failed with error:', rollError);
            console.error('❌ [STEP ROLL-FAILED] Error stack:', rollError instanceof Error ? rollError.stack : 'No stack trace');
            // Don't throw here, just log the error and continue
            setError('Failed to roll dice. Check console for details.');
            return;
          }
        } else {
          console.error('❌ DiceBox not initialized');
          setError('3D dice system not ready. Please refresh the page.');
          return;
        }

        // Auto-clear after settle time + 10 seconds (give user time to see results)
        const totalTime = 2000 + 10000; // settleTimeout + 10s
        clearTimeoutRef.current = setTimeout(() => {
          if (diceBoxRef.current) {
            diceBoxRef.current.hide();
            diceBoxRef.current.clear();
            setDiceVisible(false);
          }
        }, totalTime);

      } catch (err) {
        console.error('❌ Dice roll failed:', err);
        setError('Failed to roll dice. Check notation format.');
      }
    };

    rollDice();
  }, [latestRoll, isInitialized]);

  // Debug: Log when component re-renders
  console.log('🎲 DiceBox3D render:', {
    isInitialized,
    diceVisible,
    latestRoll: latestRoll?.notation,
    canvasExists: !!document.getElementById('dice-canvas'),
    containerExists: !!document.getElementById('dice-box')
  });

  if (!webGLSupported) {
    return (
      <div className="fixed top-4 right-4 p-4 bg-red-900/90 text-white rounded-lg shadow-xl z-50 max-w-sm">
        <p className="font-bold">WebGL Not Supported</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

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

  // Handle click to dismiss dice
  const handleContainerClick = () => {
    if (diceBoxRef.current && clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current);
      diceBoxRef.current.hide();
      diceBoxRef.current.clear();
      setDiceVisible(false);
    }
  };

  return (
    <div
      id="dice-box"
      ref={containerRef}
      className={`fixed inset-0 ${diceVisible ? 'cursor-pointer' : 'pointer-events-none'}`}
      style={{
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        top: 0,
        left: 0,
        backgroundColor: diceVisible ? 'rgba(0, 0, 0, 0.7)' : 'transparent',
        backdropFilter: diceVisible ? 'blur(2px)' : 'none',
      }}
      onClick={handleContainerClick}
    >
      <canvas
        id="dice-canvas"
        style={{
          display: diceVisible ? 'block' : 'none',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '400px',
          zIndex: 10001,
          backgroundColor: 'rgba(0, 0, 0, 0.9)', // Dark background to see dice
          border: diceVisible ? '4px solid lime' : 'none', // Bright border
          borderRadius: '12px',
          boxShadow: diceVisible ? '0 0 20px rgba(0, 255, 0, 0.5)' : 'none',
        }}
      />
      {diceVisible && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="text-white text-center mb-4 bg-black bg-opacity-75 p-4 rounded-lg">
            <div className="text-2xl font-bold mb-2 text-green-400">🎲 3D DICE ACTIVE</div>
            <div className="text-sm opacity-75 mb-2">Rolling: {latestRoll?.notation || 'Unknown'}</div>
            <div className="text-xs opacity-50">If you see this, 3D dice UI is working</div>
            <div className="text-sm opacity-75 mt-2">Click anywhere to dismiss</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiceBox3D;
import { useEffect, useCallback, useRef } from 'react';

// Konami Code: ↑ ↑ ↓ ↓ ← → ← → B A
const KONAMI_CODE_QWERTY = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
  'KeyB', 'KeyA'
];

// Konami Code for AZERTY: ↑ ↑ ↓ ↓ ← → ← → B Q (Q = A on AZERTY)
const KONAMI_CODE_AZERTY = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
  'KeyB', 'KeyQ'  // Q key is where A is on AZERTY
];

export const useKonamiCode = (onActivate: () => void) => {
  const sequenceRef = useRef<string[]>([]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Add the key to the sequence
    sequenceRef.current.push(event.code);

    // Debug: Log the current key and sequence
    console.log(`🎮 Key pressed: ${event.code}`);
    console.log(`🎮 Current sequence: [${sequenceRef.current.join(', ')}]`);

    // UNIVERSAL TEST: Activate with "GOAL" on any keyboard layout
    const simpleTest = sequenceRef.current.slice(-4).join(',');

    // Support both AZERTY (Q=A) and QWERTY (A=A) keyboards
    if (simpleTest === 'KeyG,KeyO,KeyQ,KeyL' || simpleTest === 'KeyG,KeyO,KeyA,KeyL') {
      console.log('🎉 GOAL ACTIVATED! (Universal Keyboard Support) ⚽');
      onActivate();
      sequenceRef.current = []; // Reset sequence
      return;
    }

    // Keep only the last 10 keys (length of Konami code)
    if (sequenceRef.current.length > KONAMI_CODE_QWERTY.length) {
      sequenceRef.current = sequenceRef.current.slice(-KONAMI_CODE_QWERTY.length);
    }

    // Check if the sequence matches the Konami code (universal support)
    if (sequenceRef.current.length === KONAMI_CODE_QWERTY.length) {
      const matchesQWERTY = sequenceRef.current.every((key, index) => key === KONAMI_CODE_QWERTY[index]);
      const matchesAZERTY = sequenceRef.current.every((key, index) => key === KONAMI_CODE_AZERTY[index]);

      if (matchesQWERTY) {
        console.log('🎉 KONAMI CODE ACTIVATED! (QWERTY Layout) ⚽');
        onActivate();
        sequenceRef.current = []; // Reset sequence
      } else if (matchesAZERTY) {
        console.log('🎉 KONAMI CODE ACTIVATED! (AZERTY Layout) ⚽');
        onActivate();
        sequenceRef.current = []; // Reset sequence
      } else {
        // More flexible matching - check if it's close to either pattern
        const currentSequence = sequenceRef.current.join(',');
        console.log(`🎮 Sequence complete but no match:`);
        console.log(`🎮 Your sequence: [${sequenceRef.current.join(', ')}]`);
        console.log(`🎮 QWERTY pattern: [${KONAMI_CODE_QWERTY.join(', ')}]`);
        console.log(`🎮 AZERTY pattern: [${KONAMI_CODE_AZERTY.join(', ')}]`);
        console.log(`🎮 Try again! Remember: ↑↑↓↓←→←→B+A (or B+Q on AZERTY)`);
      }
    }
  }, [onActivate]);

  useEffect(() => {
    console.log('🎮 Universal Konami Code activated!');
    console.log('🎯 QWERTY: ↑ ↑ ↓ ↓ ← → ← → B A');
    console.log('🎯 AZERTY: ↑ ↑ ↓ ↓ ← → ← → B Q');
    console.log('🎁 Or just type "GOAL" for quick access!');
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};
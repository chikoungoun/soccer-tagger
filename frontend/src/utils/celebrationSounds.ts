// Celebration sound utilities for easter eggs
export class CelebrationSounds {
  private static audioContext: AudioContext | null = null;

  // Initialize audio context
  private static getAudioContext(): AudioContext | null {
    if (!CelebrationSounds.audioContext) {
      try {
        CelebrationSounds.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.warn('Web Audio API not supported');
        return null;
      }
    }
    return CelebrationSounds.audioContext;
  }

  // Create and play a tone
  private static playTone(frequency: number, duration: number, volume: number = 0.1): void {
    const audioContext = CelebrationSounds.getAudioContext();
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  }

  // Play goal celebration sound
  public static playGoalCelebration(): void {
    // Classic goal horn melody
    const notes = [
      { freq: 523.25, duration: 0.2 }, // C5
      { freq: 659.25, duration: 0.2 }, // E5
      { freq: 783.99, duration: 0.3 }, // G5
      { freq: 1046.5, duration: 0.5 }, // C6 (sustained)
    ];

    notes.forEach((note, index) => {
      setTimeout(() => {
        CelebrationSounds.playTone(note.freq, note.duration, 0.15);
      }, index * 100);
    });
  }

  // Play crowd cheer sound (using multiple oscillators)
  public static playCrowdCheer(): void {
    // Create crowd noise with multiple frequencies
    const frequencies = [150, 200, 250, 300, 350, 400];

    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        CelebrationSounds.playTone(freq + Math.random() * 50, 2, 0.05);
      }, index * 50);
    });
  }

  // Play whistle sound
  public static playWhistle(): void {
    CelebrationSounds.playTone(800, 0.3, 0.2);
    setTimeout(() => {
      CelebrationSounds.playTone(1200, 0.2, 0.15);
    }, 400);
  }

  // Play victory fanfare
  public static playVictoryFanfare(): void {
    const fanfare = [
      { freq: 523.25, duration: 0.15 }, // C5
      { freq: 659.25, duration: 0.15 }, // E5
      { freq: 783.99, duration: 0.15 }, // G5
      { freq: 1046.5, duration: 0.3 },  // C6
      { freq: 987.77, duration: 0.15 }, // B5
      { freq: 1046.5, duration: 0.4 },  // C6 (final)
    ];

    fanfare.forEach((note, index) => {
      setTimeout(() => {
        CelebrationSounds.playTone(note.freq, note.duration, 0.12);
      }, index * 150);
    });
  }
}

// Alternative: Use emoji "sounds" as visual feedback if audio fails
export const showEmojiCelebration = () => {
  const emojis = ['⚽', '🎉', '🏆', '🎊', '✨', '🎯', '💫'];

  // Create floating emojis
  emojis.forEach((emoji, index) => {
    setTimeout(() => {
      const element = document.createElement('div');
      element.innerText = emoji;
      element.style.cssText = `
        position: fixed;
        top: 20%;
        left: ${20 + index * 10}%;
        font-size: 2rem;
        pointer-events: none;
        z-index: 1000;
        animation: float-up 2s ease-out forwards;
      `;

      // Add CSS animation
      if (!document.getElementById('emoji-animation-styles')) {
        const style = document.createElement('style');
        style.id = 'emoji-animation-styles';
        style.textContent = `
          @keyframes float-up {
            0% { opacity: 1; transform: translateY(0) scale(1); }
            50% { opacity: 1; transform: translateY(-50px) scale(1.2); }
            100% { opacity: 0; transform: translateY(-100px) scale(0.8); }
          }
        `;
        document.head.appendChild(style);
      }

      document.body.appendChild(element);

      setTimeout(() => {
        element.remove();
      }, 2000);
    }, index * 200);
  });
};
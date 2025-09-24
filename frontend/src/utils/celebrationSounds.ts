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

  private static currentBgMusic: AudioContext | null = null;
  private static musicGainNode: GainNode | null = null;

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

  // Play background celebration music (triumphant theme)
  public static playBackgroundMusic(duration: number = 15000): void {
    const audioContext = CelebrationSounds.getAudioContext();
    if (!audioContext) return;

    // Stop any existing background music
    CelebrationSounds.stopBackgroundMusic();

    // Create gain node for volume control
    CelebrationSounds.musicGainNode = audioContext.createGain();
    CelebrationSounds.musicGainNode.connect(audioContext.destination);
    CelebrationSounds.musicGainNode.gain.setValueAtTime(0.05, audioContext.currentTime);

    // FF Victory-inspired melody (triumphant ascending fanfare)
    const melody = [
      // Main fanfare phrase (ascending victory theme)
      523.25, 523.25, 523.25, 659.25, // C-C-C-E (opening call)
      783.99, 880.00, 1046.5, 1174.7, // G-A-C-D (ascending triumph)
      1318.5, 1046.5, 880.00, 783.99, // E-C-A-G (heroic peak and descent)
      659.25, 783.99, 1046.5, 1318.5, // E-G-C-E (final ascending victory)

      // Repeat with variation (classic FF loop style)
      1046.5, 1046.5, 1046.5, 1318.5, // C-C-C-E (higher octave)
      1567.9, 1760.0, 2093.0, 2349.3, // G-A-C-D (soaring higher)
      2637.0, 2093.0, 1760.0, 1567.9, // E-C-A-G (epic peak)
      1318.5, 1567.9, 2093.0, 2637.0  // E-G-C-E (triumphant finale)
    ];

    let noteIndex = 0;
    const playNextNote = () => {
      if (!CelebrationSounds.musicGainNode) return; // Stop if music was stopped

      const frequency = melody[noteIndex % melody.length];
      const oscillator = audioContext.createOscillator();

      oscillator.connect(CelebrationSounds.musicGainNode);
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'triangle'; // Warmer sound for background music

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);

      noteIndex++;
    };

    // Play notes in FF victory fanfare rhythm
    const musicInterval = setInterval(playNextNote, 350); // Faster, more triumphant pace

    // Stop music after duration
    setTimeout(() => {
      clearInterval(musicInterval);
      CelebrationSounds.stopBackgroundMusic();
    }, duration);
  }

  // Stop background music
  public static stopBackgroundMusic(): void {
    if (CelebrationSounds.musicGainNode) {
      CelebrationSounds.musicGainNode.gain.exponentialRampToValueAtTime(0.001,
        CelebrationSounds.audioContext!.currentTime + 0.5);
      setTimeout(() => {
        CelebrationSounds.musicGainNode = null;
      }, 500);
    }
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
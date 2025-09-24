import { useState, useCallback } from 'react';
import BouncingPicture from '../components/BouncingPicture';

interface BouncingPictureConfig {
  imageUrl: string;
  duration?: number;
  size?: number;
}

export const useBouncingPicture = () => {
  const [activeEasterEgg, setActiveEasterEgg] = useState<BouncingPictureConfig | null>(null);

  const triggerBouncingPicture = useCallback((config: BouncingPictureConfig) => {
    setActiveEasterEgg(config);
  }, []);

  const handleComplete = useCallback(() => {
    console.log('useBouncingPicture: Cleaning up easter egg');
    setActiveEasterEgg(null);
  }, []);

  const BouncingPictureComponent = activeEasterEgg ? (
    <BouncingPicture
      imageUrl={activeEasterEgg.imageUrl}
      duration={activeEasterEgg.duration}
      size={activeEasterEgg.size}
      onComplete={handleComplete}
    />
  ) : null;

  return {
    triggerBouncingPicture,
    BouncingPictureComponent,
    isActive: !!activeEasterEgg
  };
};

// Predefined easter egg configurations
export const EASTER_EGG_CONFIGS = {
  football: {
    imageUrl: 'https://cdn.pixabay.com/photo/2013/07/12/18/20/football-153438_960_720.png',
    duration: 5000,
    size: 60
  },
  trophy: {
    imageUrl: 'https://cdn.pixabay.com/photo/2017/01/31/13/14/trophy-2023127_960_720.png',
    duration: 5000,
    size: 70
  },
  whistle: {
    imageUrl: 'https://cdn.pixabay.com/photo/2016/03/31/20/51/whistle-1295776_960_720.png',
    duration: 5000,
    size: 50
  }
};
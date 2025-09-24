import React, { useEffect, useState, useRef } from 'react';

interface BouncingPictureProps {
  imageUrl: string;
  duration?: number; // Duration in milliseconds
  size?: number; // Size in pixels
  onComplete?: () => void;
}

const BouncingPicture: React.FC<BouncingPictureProps> = ({
  imageUrl,
  duration = 5000,
  size = 60,
  onComplete
}) => {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isVisible, setIsVisible] = useState(true);
  const velocityRef = useRef({ x: 8, y: 6 });

  useEffect(() => {
    // Hide the bouncing picture after duration
    console.log(`BouncingPicture: Starting timer for ${duration}ms`);
    const hideTimer = setTimeout(() => {
      console.log('BouncingPicture: Timer expired, hiding logo');
      setIsVisible(false);
      onComplete?.();
    }, duration);

    // Animation loop for bouncing
    const animationInterval = setInterval(() => {
      setPosition(prev => {
        const velocity = velocityRef.current;
        let newX = prev.x + velocity.x;
        let newY = prev.y + velocity.y;

        // Bounce off left or right edge
        if (newX <= 0) {
          newX = 0;
          velocityRef.current.x = Math.abs(velocity.x); // Ensure positive velocity (moving right)
        } else if (newX >= window.innerWidth - size) {
          newX = window.innerWidth - size;
          velocityRef.current.x = -Math.abs(velocity.x); // Ensure negative velocity (moving left)
        }

        // Bounce off top or bottom edge
        if (newY <= 0) {
          newY = 0;
          velocityRef.current.y = Math.abs(velocity.y); // Ensure positive velocity (moving down)
        } else if (newY >= window.innerHeight - size) {
          newY = window.innerHeight - size;
          velocityRef.current.y = -Math.abs(velocity.y); // Ensure negative velocity (moving up)
        }

        return { x: newX, y: newY };
      });
    }, 16); // ~60fps

    return () => {
      clearTimeout(hideTimer);
      clearInterval(animationInterval);
    };
  }, [duration, size, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed z-[9999] pointer-events-none transition-transform duration-75 ease-linear"
      style={{
        left: position.x,
        top: position.y,
        width: size,
        height: size,
      }}
    >
      <img
        src={imageUrl}
        alt="Bouncing easter egg"
        className="w-full h-full object-contain rounded-full shadow-lg animate-pulse"
        draggable={false}
      />
    </div>
  );
};

export default BouncingPicture;
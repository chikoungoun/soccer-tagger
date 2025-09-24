import React, { useEffect, useState } from 'react';

interface SoccerBall {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  velocity: {
    x: number;
    y: number;
  };
  rotationSpeed: number;
  color: string;
}

interface SoccerConfettiProps {
  isActive: boolean;
  onComplete?: () => void;
}

const SoccerConfetti: React.FC<SoccerConfettiProps> = ({ isActive, onComplete }) => {
  const [balls, setBalls] = useState<SoccerBall[]>([]);

  const soccerColors = [
    '#000000', // Classic black
    '#FFFFFF', // Classic white
    '#FF6B35', // Orange
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#96CEB4', // Green
    '#FFEAA7', // Yellow
    '#DDA0DD', // Plum
  ];

  useEffect(() => {
    if (!isActive) return;

    // Create initial soccer balls
    const initialBalls: SoccerBall[] = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: -50, // Start above the screen
      rotation: 0,
      scale: 0.5 + Math.random() * 0.8, // Random size
      velocity: {
        x: (Math.random() - 0.5) * 8, // Random horizontal movement
        y: Math.random() * 3 + 2, // Falling speed
      },
      rotationSpeed: (Math.random() - 0.5) * 10, // Random rotation
      color: soccerColors[Math.floor(Math.random() * soccerColors.length)],
    }));

    setBalls(initialBalls);

    // Animation loop
    const animationId = setInterval(() => {
      setBalls(prevBalls =>
        prevBalls
          .map(ball => ({
            ...ball,
            x: ball.x + ball.velocity.x,
            y: ball.y + ball.velocity.y,
            rotation: ball.rotation + ball.rotationSpeed,
            velocity: {
              ...ball.velocity,
              y: ball.velocity.y + 0.2, // Gravity
            },
          }))
          .filter(ball => ball.y < window.innerHeight + 100) // Remove balls that fell off screen
      );
    }, 16); // ~60fps

    // Clean up and call onComplete after 5 seconds
    const timeoutId = setTimeout(() => {
      clearInterval(animationId);
      setBalls([]);
      onComplete?.();
    }, 5000);

    return () => {
      clearInterval(animationId);
      clearTimeout(timeoutId);
    };
  }, [isActive, onComplete]);

  if (!isActive || balls.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {balls.map(ball => (
        <div
          key={ball.id}
          className="absolute transition-none"
          style={{
            left: `${ball.x}px`,
            top: `${ball.y}px`,
            transform: `rotate(${ball.rotation}deg) scale(${ball.scale})`,
          }}
        >
          {/* Soccer Ball SVG */}
          <svg width="40" height="40" viewBox="0 0 40 40" className="drop-shadow-lg">
            {/* Ball base */}
            <circle
              cx="20"
              cy="20"
              r="18"
              fill={ball.color === '#FFFFFF' ? '#F8F8F8' : ball.color}
              stroke="#000"
              strokeWidth="1"
            />

            {/* Soccer ball pattern */}
            <g fill={ball.color === '#FFFFFF' ? '#000' : '#FFF'} opacity="0.8">
              {/* Pentagon in center */}
              <path d="M20 8 L26 12 L24 20 L16 20 L14 12 Z" />

              {/* Hexagonal pattern pieces */}
              <path d="M20 8 L14 12 L12 6 L20 4 Z" opacity="0.6" />
              <path d="M26 12 L32 8 L34 16 L24 20 Z" opacity="0.6" />
              <path d="M16 20 L8 24 L6 16 L14 12 Z" opacity="0.6" />
              <path d="M24 20 L30 28 L22 32 L16 20 Z" opacity="0.6" />
            </g>

            {/* Highlight for 3D effect */}
            <ellipse
              cx="16"
              cy="14"
              rx="6"
              ry="4"
              fill="rgba(255,255,255,0.3)"
              transform="rotate(-20 16 14)"
            />
          </svg>
        </div>
      ))}
    </div>
  );
};

export default SoccerConfetti;
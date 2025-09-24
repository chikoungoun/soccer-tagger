import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Teams from './pages/Teams';
import TeamDetail from './pages/TeamDetail';
import Players from './pages/Players';
import Fixtures from './pages/Fixtures';
import Gameweeks from './pages/Gameweeks';
import MatchCenter from './pages/MatchCenter';
import Events from './pages/Events';
import Analytics from './pages/Analytics';
import Users from './pages/Users';
import Login from './pages/Login';
import SoccerConfetti from './components/SoccerConfetti';
import { useKonamiCode } from './hooks/useKonamiCode';
import { CelebrationSounds, showEmojiCelebration } from './utils/celebrationSounds';
import { useBouncingPicture, EASTER_EGG_CONFIGS } from './hooks/useBouncingPicture';

function App() {
  const [showConfetti, setShowConfetti] = useState(false);
  const { triggerBouncingPicture, BouncingPictureComponent } = useBouncingPicture();

  // Force cleanup bouncing picture after 16 seconds (failsafe)
  React.useEffect(() => {
    let forceCleanupTimer: NodeJS.Timeout;

    // Set a failsafe timer when confetti is activated
    if (showConfetti) {
      console.log('Setting failsafe cleanup timer for bouncing logo');
      forceCleanupTimer = setTimeout(() => {
        console.log('Failsafe: Force stopping bouncing logo');
        window.location.reload(); // Nuclear option - refresh page
      }, 16000);
    }

    return () => {
      if (forceCleanupTimer) {
        clearTimeout(forceCleanupTimer);
      }
    };
  }, [showConfetti]);

  // 🎮 KONAMI CODE EASTER EGG: ↑↑↓↓←→←→BA
  const activateKonamiCode = () => {
    console.log('🎉 SUPER TAGGER MODE ACTIVATED! ⚽');

    // Show confetti
    setShowConfetti(true);

    // Trigger bouncing soccer-tagger logo
    triggerBouncingPicture({
      imageUrl: '/soccer_tagger.png',
      duration: 15000,
      size: 240
    });

    // Play celebration sounds and background music
    try {
      CelebrationSounds.playVictoryFanfare();
      setTimeout(() => CelebrationSounds.playCrowdCheer(), 800);
      // Start background music for 15 seconds (matches bouncing logo duration)
      setTimeout(() => CelebrationSounds.playBackgroundMusic(15000), 1000);
    } catch (error) {
      // Fallback to emoji celebration if audio fails
      showEmojiCelebration();
    }

    // Show console message
    console.log('%c🏆 GOAL! You found the secret! 🏆', 'color: #4CAF50; font-size: 20px; font-weight: bold;');
    console.log('%c⚽ You are now in SUPER TAGGER MODE! ⚽', 'color: #2196F3; font-size: 16px;');

    // Add visual alert for testing
    alert('🎉 KONAMI CODE ACTIVATED! ⚽ Check for falling soccer balls and bouncing Soccer Tagger logo!');
  };

  useKonamiCode(activateKonamiCode);

  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <AnalyticsProvider>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Navigation>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route
                      path="/teams"
                      element={
                        <ProtectedRoute requiredRole="super_admin">
                          <Teams />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/teams/:id"
                      element={
                        <ProtectedRoute requiredRole="super_admin">
                          <TeamDetail />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/players"
                      element={
                        <ProtectedRoute requiredRole="super_admin">
                          <Players />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/fixtures" element={<Fixtures />} />
                    <Route
                      path="/gameweeks"
                      element={
                        <ProtectedRoute requiredRole="super_admin">
                          <Gameweeks />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/events"
                      element={
                        <ProtectedRoute requiredRole="super_admin">
                          <Events />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/analytics"
                      element={
                        <ProtectedRoute requiredRole="super_admin">
                          <Analytics />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/users"
                      element={
                        <ProtectedRoute requiredRole="super_admin">
                          <Users />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/match/:id" element={<MatchCenter />} />
                  </Routes>
                </Navigation>
              </ProtectedRoute>
            }
          />
          </Routes>

          {/* 🎊 Soccer Ball Confetti Easter Egg */}
          <SoccerConfetti
            isActive={showConfetti}
            onComplete={() => setShowConfetti(false)}
          />

          {/* ⚽ Bouncing Picture Easter Egg */}
          {BouncingPictureComponent}

          </AnalyticsProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
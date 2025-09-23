import React from 'react';
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

function App() {
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
          </AnalyticsProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
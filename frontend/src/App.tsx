import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Teams from './pages/Teams';
import TeamDetail from './pages/TeamDetail';
import Players from './pages/Players';
import Fixtures from './pages/Fixtures';
import Gameweeks from './pages/Gameweeks';
import MatchCenter from './pages/MatchCenter';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/teams/:id" element={<TeamDetail />} />
          <Route path="/players" element={<Players />} />
          <Route path="/gameweeks" element={<Gameweeks />} />
          <Route path="/fixtures" element={<Fixtures />} />
          <Route path="/match/:id" element={<MatchCenter />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
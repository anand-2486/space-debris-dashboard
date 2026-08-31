import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SpaceJourney from './pages/SpaceJourney';
import Dashboard from './pages/Dashboard';
import Satellites from './pages/Satellites';
import Conjunctions from './pages/Conjunctions';
import ConjunctionDetail from './pages/ConjunctionDetail';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SpaceJourney />} />
        <Route path="/journey" element={<SpaceJourney />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/satellites" element={<Satellites />} />
        <Route path="/conjunctions" element={<Conjunctions />} />
        <Route path="/conjunctions/:id" element={<ConjunctionDetail />} />
        <Route path="/conjunction/:id" element={<ConjunctionDetail />} />
        <Route path="*" element={<SpaceJourney />} />
      </Routes>
    </BrowserRouter>
  );
}

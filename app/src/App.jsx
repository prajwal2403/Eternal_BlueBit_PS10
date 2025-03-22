import './index.css';
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HeroSection from './components/HeroSection';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import Generate from './components/Generate';
import GoogleCallback from './components/GoogleCallback';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HeroSection />} />
        <Route path="/auth" element={<AuthPage onLogin={handleLogin} />} />
        <Route path="/auth/google/callback" element={<GoogleCallback onLogin={handleLogin} />} />
        <Route
          path="/dashboard"
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/auth" />}
        />
        <Route
          path="/generate"
          element={isAuthenticated ? <Generate /> : <Navigate to="/auth" />}
        />
      </Routes>
    </Router>
  );
}

export default App;

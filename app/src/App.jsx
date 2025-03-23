import './index.css';
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HeroSection from './components/HeroSection';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import Generate from './components/Generate';
import GoogleCallback from './components/GoogleCallback';
import AddStory from './components/AddStory';  // Ensure this is the ContinueStory component
import Story from './components/Story';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import ContinueStory from './components/ContinueStory';

const AppRoutes = () => {
  const handleLogin = () => {
    // Handle login logic
  };

  return (
    <Routes>
      <Route path="/" element={<HeroSection />} />
      <Route path="/auth" element={<AuthPage onLogin={handleLogin} />} />
      <Route path="/auth/google/callback" element={<GoogleCallback onLogin={handleLogin} />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/generate"
        element={
          <ProtectedRoute>
            <Generate />
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-story"
        element={
          <ProtectedRoute>
            <AddStory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/story/:id"
        element={
          <ProtectedRoute>
            <Story />
          </ProtectedRoute>
        }
      />
      {/* ✅ Updated route for ContinueStory (no :id parameter) */}
      <Route
        path="/continue-story"
        element={
          <ProtectedRoute>
            <ContinueStory />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AppRoutes />
      </Router>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </ErrorBoundary>
  );
}

export default App;
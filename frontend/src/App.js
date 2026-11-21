import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import { getHomePath, getSession } from './utils/session';

function RoleRoute({ role, children }) {
  const { token, user } = getSession();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={getHomePath(user)} replace />;
  return children;
}

function NotFound() {
  const { token, user } = getSession();
  return <Navigate to={token && user ? getHomePath(user) : '/'} replace />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<RoleRoute role="citizen"><Dashboard /></RoleRoute>} />
        <Route path="/admin" element={<RoleRoute role="admin"><AdminPanel /></RoleRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
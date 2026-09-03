import React, { useContext, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Invoices from './pages/Invoices';
import Expenses from './pages/Expenses';
import Dashboard from './pages/Dashboard';
import MonthEnd from './pages/MonthEnd';
import Banking from './pages/Banking';
import OwnerDrawings from './pages/OwnerDrawings';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Users from './pages/Users';
import Quotations from './pages/Quotations';
import { AuthProvider, AuthContext } from './context/AuthContext';
import SplashScreen from './components/SplashScreen';
import './index.css';

const MainApp = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;

  return (
    <Router>
      {!user ? (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      ) : (
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/banking" element={<Banking />} />
            <Route path="/owner-drawings" element={<OwnerDrawings />} />
            <Route path="/month-end" element={<MonthEnd />} />
            <Route path="/quotations" element={<Quotations />} />
            <Route path="/users" element={<Users />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      )}
    </Router>
  );
};

import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          {showSplash ? (
            <SplashScreen onComplete={() => setShowSplash(false)} />
          ) : (
            <MainApp />
          )}
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;

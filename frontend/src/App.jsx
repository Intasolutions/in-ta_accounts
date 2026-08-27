import React, { useContext } from 'react';
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
import UserManagement from './pages/UserManagement';
import { AuthProvider, AuthContext } from './context/AuthContext';
import './index.css';

const MainApp = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;

  if (!user) {
    return <Login />;
  }

  return (
    <Router>
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
          <Route path="/users" element={user.role === 'ACCOUNTANT' ? <UserManagement /> : <Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;

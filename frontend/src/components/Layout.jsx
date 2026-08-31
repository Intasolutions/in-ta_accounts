import React, { useState, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Briefcase, FileText, Wallet, Menu, X, Landmark, Receipt, Archive, Users, LogOut, Gem } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user } = useContext(AuthContext);

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src="/logo.png" alt="INTA Logo" style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '4px', background: '#fff', padding: '2px' }} />
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#fff' }}>IntaBooks</h2>
        </div>
        <ul className="nav-links">
          <li>
            <NavLink to="/" onClick={toggleSidebar} className={({ isActive }) => isActive ? "nav-item active" : "nav-item"} end>
              <LayoutDashboard size={20} /> Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/projects" onClick={toggleSidebar} className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <Briefcase size={20} /> Projects & Clients
            </NavLink>
          </li>
          <li>
            <NavLink to="/invoices" onClick={toggleSidebar} className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <FileText size={20} /> Invoices
            </NavLink>
          </li>
          <li>
            <NavLink to="/expenses" onClick={toggleSidebar} className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <Receipt size={20} /> Expenses
            </NavLink>
          </li>
          <li>
            <NavLink to="/banking" onClick={toggleSidebar} className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <Landmark size={20} /> Banking & Cash
            </NavLink>
          </li>
          <li>
            <NavLink to="/owner-drawings" onClick={toggleSidebar} className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <Gem size={20} /> Owner Drawings
            </NavLink>
          </li>
          {(user?.role === 'ACCOUNTANT' || user?.role === 'OWNER') && (
            <li>
              <NavLink to="/month-end" onClick={toggleSidebar} className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <Archive size={20} /> Month-End
              </NavLink>
            </li>
          )}
          {user?.role === 'ACCOUNTANT' && (
            <li>
              <NavLink to="/users" onClick={toggleSidebar} className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <Users size={20} /> Team / Users
              </NavLink>
            </li>
          )}
        </ul>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={toggleSidebar}
          className="mobile-overlay"
        />
      )}
    </>
  );
};

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />

      <main className="main-content">
        <header className="layout-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'nowrap' }}>
          <button className="mobile-toggle" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
            <span className="user-info-text" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Logged in as: <strong>{user?.username}</strong> <span className="hide-mobile">({user?.role})</span>
            </span>
          </div>
          <button
            onClick={logout}
            className="btn"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}
            title="Sign Out"
          >
            <LogOut size={18} />
          </button>
          <div style={{ background: 'var(--primary-color)', padding: '0.5rem', borderRadius: '50%', border: '1px solid var(--surface-border)', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white' }}>
            {user && user.username ? user.username[0].toUpperCase() : 'U'}
          </div>
        </header>

        {children}
      </main>
    </div>
  );
};

export default Layout;

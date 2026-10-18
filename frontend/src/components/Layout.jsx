import React, { useState, useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, FileText, Wallet, Menu, X, Landmark, Receipt, Archive, Users, LogOut, Gem, Calculator, MoreHorizontal } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import PushNotificationSetup from './PushNotificationSetup';

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
            <NavLink to="/quotations" onClick={toggleSidebar} className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <Calculator size={20} /> Quotations
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
  const [moreOpen, setMoreOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  const isMoreActive = ['/quotations', '/banking', '/owner-drawings', '/month-end', '/users'].some(path => location.pathname.startsWith(path));

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />

      <main className="main-content">
        <header className="layout-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'nowrap' }}>
          {/* Mobile brand badge (replaces top hamburger menu) */}
          <div className="mobile-header-brand" style={{ display: 'none', alignItems: 'center', gap: '0.6rem' }}>
            <img src="/logo.png" alt="INTA Logo" style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '6px', background: '#fff', padding: '2px' }} />
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff', letterSpacing: '-0.3px' }}>IntaBooks</span>
          </div>

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
        {user && <PushNotificationSetup />}

        {/* Mobile Quick Bottom Navigation with More button */}
        <nav className="mobile-bottom-nav">
          <NavLink to="/" className={({ isActive }) => isActive ? "mobile-bottom-nav-item active" : "mobile-bottom-nav-item"} end onClick={() => setMoreOpen(false)}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/projects" className={({ isActive }) => isActive ? "mobile-bottom-nav-item active" : "mobile-bottom-nav-item"} onClick={() => setMoreOpen(false)}>
            <Briefcase size={20} />
            <span>Projects</span>
          </NavLink>
          <NavLink to="/invoices" className={({ isActive }) => isActive ? "mobile-bottom-nav-item active" : "mobile-bottom-nav-item"} onClick={() => setMoreOpen(false)}>
            <FileText size={20} />
            <span>Invoices</span>
          </NavLink>
          <NavLink to="/expenses" className={({ isActive }) => isActive ? "mobile-bottom-nav-item active" : "mobile-bottom-nav-item"} onClick={() => setMoreOpen(false)}>
            <Receipt size={20} />
            <span>Expenses</span>
          </NavLink>
          <button
            type="button"
            className={`mobile-bottom-nav-item ${isMoreActive || moreOpen ? "active" : ""}`}
            onClick={() => setMoreOpen(!moreOpen)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <MoreHorizontal size={20} />
            <span>More</span>
          </button>
        </nav>

        {/* Mobile More Sheet */}
        {moreOpen && (
          <div className="mobile-more-overlay" onClick={() => setMoreOpen(false)}>
            <div className="mobile-more-sheet" onClick={e => e.stopPropagation()}>
              <div className="mobile-more-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ background: 'var(--primary-color)', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff' }}>
                    {user && user.username ? user.username[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>{user?.username}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{user?.role}</div>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setMoreOpen(false)}
                  className="btn"
                  style={{ background: 'rgba(255, 255, 255, 0.06)', border: 'none', padding: '0.4rem', borderRadius: '50%', color: 'var(--text-muted)' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mobile-more-grid">
                <NavLink to="/quotations" className={({ isActive }) => isActive ? "mobile-more-link active" : "mobile-more-link"} onClick={() => setMoreOpen(false)}>
                  <div className="mobile-more-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}><Calculator size={22} /></div>
                  <span>Quotations</span>
                </NavLink>
                <NavLink to="/banking" className={({ isActive }) => isActive ? "mobile-more-link active" : "mobile-more-link"} onClick={() => setMoreOpen(false)}>
                  <div className="mobile-more-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}><Landmark size={22} /></div>
                  <span>Banking & Cash</span>
                </NavLink>
                <NavLink to="/owner-drawings" className={({ isActive }) => isActive ? "mobile-more-link active" : "mobile-more-link"} onClick={() => setMoreOpen(false)}>
                  <div className="mobile-more-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}><Gem size={22} /></div>
                  <span>Drawings</span>
                </NavLink>
                {(user?.role === 'ACCOUNTANT' || user?.role === 'OWNER') && (
                  <NavLink to="/month-end" className={({ isActive }) => isActive ? "mobile-more-link active" : "mobile-more-link"} onClick={() => setMoreOpen(false)}>
                    <div className="mobile-more-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}><Archive size={22} /></div>
                    <span>Month-End</span>
                  </NavLink>
                )}
                {user?.role === 'ACCOUNTANT' && (
                  <NavLink to="/users" className={({ isActive }) => isActive ? "mobile-more-link active" : "mobile-more-link"} onClick={() => setMoreOpen(false)}>
                    <div className="mobile-more-icon" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6' }}><Users size={22} /></div>
                    <span>Team / Users</span>
                  </NavLink>
                )}
                <button
                  type="button"
                  onClick={() => { setMoreOpen(false); logout(); }}
                  className="mobile-more-link"
                  style={{ background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer', textAlign: 'center' }}
                >
                  <div className="mobile-more-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}><LogOut size={22} /></div>
                  <span style={{ color: 'var(--danger)' }}>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Layout;

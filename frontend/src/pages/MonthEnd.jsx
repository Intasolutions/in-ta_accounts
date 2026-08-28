import React, { useState, useEffect, useContext } from 'react';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { Lock, Unlock, FileText, X, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const MonthEnd = () => {
  const toast = useToast();
  const confirm = useConfirm();

  const { user } = useContext(AuthContext);
  const [months, setMonths] = useState([]);
  const [locks, setLocks] = useState({});
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    generateMonths();
    fetchLocks();
  }, []);

  const generateMonths = () => {
    const generated = [];
    const date = new Date();
    // Go back 12 months
    for (let i = 0; i < 12; i++) {
      const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
      generated.push({ month_year: `${year}-${month}`, label });
    }
    setMonths(generated);
  };

  const fetchLocks = async () => {
    setLoading(true);
    try {
      const res = await api.get('month-locks/');
      const locksMap = {};
      res.data.forEach(lock => {
        locksMap[lock.month_year] = lock;
      });
      setLocks(locksMap);
    } catch (err) {
      console.error("Failed to fetch month locks", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleLock = async (month_year, currentLock) => {
    const isCurrentlyLocked = currentLock?.is_locked || false;
    const newLockState = !isCurrentlyLocked;

    try {
      if (currentLock) {
        // Update existing lock
        await api.patch(`month-locks/${month_year}/`, { is_locked: newLockState });
      } else {
        // Create new lock
        await api.post('month-locks/', { month_year, is_locked: newLockState });
      }
      // Re-fetch to get updated user and timestamp
      fetchLocks();
    } catch (err) {
      console.error("Failed to toggle lock", err);
      toast.error("Error toggling month lock.");
    }
  };

  const viewReport = async (month_year, label) => {
    setLoadingSummary(true);
    setShowModal(true);
    try {
      const res = await api.get(`month-locks/${month_year}/summary/`);
      setSelectedSummary({ ...res.data, label });
    } catch (err) {
      console.error("Failed to fetch summary", err);
      toast.error("Error fetching monthly summary.");
      setShowModal(false);
    } finally {
      setLoadingSummary(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(parseFloat(val) || 0);
  };

  if (!user || (user.role !== 'ACCOUNTANT' && user.role !== 'OWNER')) {
    return <div style={{ padding: '2rem' }}>You do not have permission to view this page.</div>;
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title gradient-text">Month-End Processing</h1>
          <p className="text-muted" style={{ margin: '0.5rem 0 0 0' }}>Manage closures, finalize periods, and generate reports.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading periods...</div>
        ) : (
          months.map(m => {
            const lockInfo = locks[m.month_year];
            const isLocked = lockInfo?.is_locked || false;
            
            return (
              <div key={m.month_year} className="month-card">
                <div className="month-card-info">
                  <div style={{ width: '180px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-main)' }}>{m.label}</h3>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Period ending {m.month_year}</span>
                  </div>
                  
                  <div style={{ width: '150px' }}>
                    <span className={`badge ${isLocked ? 'badge-danger' : 'badge-success'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem', borderRadius: '2rem' }}>
                      {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                      {isLocked ? 'LOCKED' : 'OPEN'}
                    </span>
                  </div>

                  <div style={{ width: '250px' }}>
                    {isLocked ? (
                      <div style={{ fontSize: '0.85rem' }}>
                        <div style={{ color: 'var(--text-main)', fontWeight: '500' }}>Locked by {lockInfo.locked_by_name || 'System'}</div>
                        <div style={{ color: 'var(--text-muted)' }}>{new Date(lockInfo.locked_at).toLocaleString()}</div>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Pending Closure</span>
                    )}
                  </div>
                </div>

                <div className="month-card-actions">
                  <button 
                    className="btn" 
                    style={{ 
                      padding: '0.75rem 1.5rem', 
                      background: isLocked ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: isLocked ? 'var(--danger)' : 'var(--success)',
                      border: isLocked ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)',
                      borderRadius: '0.5rem',
                      fontWeight: '600',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onClick={() => toggleLock(m.month_year, lockInfo)}
                  >
                    {isLocked ? 'Unlock Period' : 'Lock Period'}
                  </button>
                  
                  <button 
                    className="btn btn-primary"
                    style={{ 
                      padding: '0.75rem 1.5rem', 
                      borderRadius: '0.5rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      fontWeight: '600',
                      boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)'
                    }}
                    onClick={() => viewReport(m.month_year, m.label)}
                  >
                    <FileText size={18} /> View Report
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            {loadingSummary ? (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}>Loading Report...</div>
            ) : selectedSummary ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '1rem' }}>
                  <h2 style={{ margin: 0 }} className="gradient-text">{selectedSummary.label} Summary</h2>
                  <button onClick={() => setShowModal(false)} className="btn" style={{ background: 'transparent', padding: '0.5rem' }}>
                    <X size={24} color="var(--text-muted)" />
                  </button>
                </div>
                
                <div className="premium-form-grid" style={{ marginBottom: '2rem' }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', marginBottom: '0.5rem' }}>
                      <TrendingUp size={20} />
                      <span style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.85rem' }}>Total Income</span>
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.75rem', color: 'var(--text-main)' }}>{formatCurrency(selectedSummary.total_income)}</h3>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>From Paid Invoices</p>
                  </div>
                  
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', marginBottom: '0.5rem' }}>
                      <TrendingDown size={20} />
                      <span style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.85rem' }}>Total Expenses</span>
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.75rem', color: 'var(--text-main)' }}>{formatCurrency(selectedSummary.total_expenses)}</h3>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Company Expenses</p>
                  </div>
                </div>

                <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(245, 158, 11, 0.2)', marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)', marginBottom: '0.5rem' }}>
                    <DollarSign size={20} />
                    <span style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.85rem' }}>Owner Drawings</span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.75rem', color: 'var(--text-main)' }}>{formatCurrency(selectedSummary.total_drawings)}</h3>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Personal Withdrawals (Does not affect P&L)</p>
                </div>

                <div style={{ background: 'var(--surface-color)', border: '1px solid var(--surface-border)', padding: '1.5rem', borderRadius: '1rem', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>Net Cash Flow</p>
                  <h2 style={{ margin: 0, fontSize: '2.5rem', color: parseFloat(selectedSummary.net_cash_flow) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {parseFloat(selectedSummary.net_cash_flow) >= 0 ? '+' : ''}{formatCurrency(selectedSummary.net_cash_flow)}
                  </h2>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthEnd;

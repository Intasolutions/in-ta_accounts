import React, { useState, useEffect, useContext } from 'react';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { Gem, Plus, CheckCircle, XCircle, X } from 'lucide-react';
import usePagination from '../hooks/usePagination';
import Pagination from '../components/Pagination';
import SearchBar from '../components/SearchBar';
import CustomSelect from '../components/CustomSelect';

const OwnerDrawings = () => {
  const toast = useToast();
  const confirm = useConfirm();

  const { user } = useContext(AuthContext);
  const [drawings, setDrawings] = useState([]);
  const [repayments, setRepayments] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [newDraw, setNewDraw] = useState({
    amount: '',
    purpose: '',
    owner: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [showRepaymentForm, setShowRepaymentForm] = useState(false);
  const [newRepayment, setNewRepayment] = useState({
    amount: '',
    purpose: '',
    owner: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [owners, setOwners] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');

  const [approvingId, setApprovingId] = useState(null);
  const [approvalBank, setApprovalBank] = useState('');

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [drawRes, repRes, bankRes, usersRes] = await Promise.all([
        api.get('owner-draws/'),
        api.get('owner-repayments/'),
        api.get('bank-accounts/'),
        api.get('users/')
      ]);
      setDrawings(drawRes.data);
      setRepayments(repRes.data);
      setBankAccounts(bankRes.data);
      setOwners(usersRes.data.filter(u => u.role === 'OWNER' || u.role === 'ACCOUNTANT'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDraw = async (e) => {
    e.preventDefault();
    if (user.role === 'ACCOUNTANT' && !newDraw.owner) {
      toast.error('Please select an owner.');
      return;
    }
    
    try {
      await api.post('owner-draws/', {
        ...newDraw,
        owner: user.role === 'ACCOUNTANT' ? newDraw.owner : user.id
      });
      setShowForm(false);
      setNewDraw({ amount: '', purpose: '', owner: '', date: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit drawing request');
    }
  };

  const handleLogRepayment = async (e) => {
    e.preventDefault();
    if (!newRepayment.owner) {
      toast.error('Please select an owner.');
      return;
    }
    
    try {
      await api.post('owner-repayments/', newRepayment);
      setShowRepaymentForm(false);
      setNewRepayment({ amount: '', purpose: '', owner: '', date: new Date().toISOString().split('T')[0] });
      fetchData();
      toast.success('Commission offset logged successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to log commission offset');
    }
  };

  const handleApprove = async (id) => {
    if (!approvalBank) {
      toast.error("Please select a source bank account to fund this draw from.");
      return;
    }
    try {
      await api.post(`owner-draws/${id}/approve/`, { source_bank_id: approvalBank });
      setApprovingId(null);
      setApprovalBank('');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to approve request');
    }
  };

  const handleReject = async (id) => {
    if (await confirm("Reject this request?")) {
      try {
        await api.post(`owner-draws/${id}/reject/`);
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
  };

  const allLedgerItems = [
    ...drawings.map(d => ({ ...d, type: 'DRAWING' })),
    ...repayments.map(r => ({ ...r, type: 'REPAYMENT' }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const filteredItems = allLedgerItems.filter(item => 
    item.purpose.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.owner_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ledgerPagination = usePagination(filteredItems, 25);

  if (!user) return <div style={{padding: '2rem'}}>Please log in to continue.</div>;
  if (loading) return <div style={{padding: '2rem'}}>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title gradient-text">Owner's Equity & Drawings</h1>
      </div>

      <div className="glass-panel" style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.25rem' }}>Member Credit Accounts</h3>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {user.role === 'ACCOUNTANT' && (
              <button 
                className="btn btn-primary" 
                style={{ background: 'var(--success)', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontSize: '1rem' }}
                onClick={() => { setShowRepaymentForm(!showRepaymentForm); setShowForm(false); }}
              >
                {showRepaymentForm ? <><X size={18} /> Cancel</> : <><Plus size={18} /> Log Commission Offset</>}
              </button>
            )}
            <button 
              className="btn btn-primary" 
              style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontSize: '1rem' }}
              onClick={() => { setShowForm(!showForm); setShowRepaymentForm(false); }}
            >
              {showForm ? <><X size={18} /> Cancel</> : <><Plus size={18} /> Request Funds</>}
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
          {owners.map(owner => {
            const drawn = drawings
              .filter(d => d.owner === owner.id && d.status === 'APPROVED')
              .reduce((sum, d) => sum + parseFloat(d.amount), 0);
            
            const repaid = repayments
              .filter(r => r.owner === owner.id)
              .reduce((sum, r) => sum + parseFloat(r.amount), 0);
              
            const memberTotal = drawn - repaid;
            return (
              <div key={owner.id} style={{ flex: '1 1 250px', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))', padding: '1rem', borderRadius: '1rem', color: '#a78bfa' }}>
                  <Gem size={24} />
                </div>
                <div>
                  <p style={{ margin: 0, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem', fontWeight: 'bold' }}>{owner.username} Credit</p>
                  <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>{formatCurrency(memberTotal)}</h2>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '2rem', animation: 'fadeIn 0.3s ease' }}>
          <form onSubmit={handleRequestDraw} style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            {user.role === 'ACCOUNTANT' && (
              <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
                <label>Select Owner</label>
                <CustomSelect 
                  required
                  value={newDraw.owner} 
                  onChange={val => setNewDraw({...newDraw, owner: val})} 
                  options={owners.map(o => ({ value: o.id, label: o.username }))}
                />
              </div>
            )}
            <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
              <label>Amount Requested (₹)</label>
              <input type="number" step="0.01" required value={newDraw.amount} onChange={e => setNewDraw({...newDraw, amount: e.target.value})} placeholder="0.00" style={{ fontSize: '1.25rem', padding: '1rem' }} />
            </div>
            <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
              <label>Date</label>
              <input type="date" required value={newDraw.date} onChange={e => setNewDraw({...newDraw, date: e.target.value})} max={new Date().toISOString().split('T')[0]} style={{ fontSize: '1.25rem', padding: '1rem' }} />
            </div>
            <div className="form-group" style={{ flex: '2 1 300px', marginBottom: 0 }}>
              <label>Purpose / Note</label>
              <input type="text" required value={newDraw.purpose} onChange={e => setNewDraw({...newDraw, purpose: e.target.value})} placeholder="e.g. Personal Expenses" style={{ fontSize: '1.25rem', padding: '1rem' }} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem', background: 'var(--success)' }}>Submit Request</button>
          </form>
        </div>
      )}

      {showRepaymentForm && (
        <div className="card" style={{ marginBottom: '2rem', animation: 'fadeIn 0.3s ease', border: '1px solid var(--success)' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: 'var(--success)' }}>Log Commission Offset</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>This reduces the owner's credit balance without affecting the company bank account.</p>
          </div>
          <form onSubmit={handleLogRepayment} style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
              <label>Select Owner</label>
              <CustomSelect 
                required
                value={newRepayment.owner} 
                onChange={val => setNewRepayment({...newRepayment, owner: val})} 
                options={owners.map(o => ({ value: o.id, label: o.username }))}
              />
            </div>
            <div className="form-group" style={{ flex: '1 1 150px', marginBottom: 0 }}>
              <label>Amount (₹)</label>
              <input type="number" step="0.01" required value={newRepayment.amount} onChange={e => setNewRepayment({...newRepayment, amount: e.target.value})} placeholder="0.00" style={{ fontSize: '1.25rem', padding: '1rem' }} />
            </div>
            <div className="form-group" style={{ flex: '1 1 150px', marginBottom: 0 }}>
              <label>Date</label>
              <input type="date" required value={newRepayment.date} onChange={e => setNewRepayment({...newRepayment, date: e.target.value})} max={new Date().toISOString().split('T')[0]} style={{ fontSize: '1.25rem', padding: '1rem' }} />
            </div>
            <div className="form-group" style={{ flex: '2 1 250px', marginBottom: 0 }}>
              <label>Purpose / Note</label>
              <input type="text" required value={newRepayment.purpose} onChange={e => setNewRepayment({...newRepayment, purpose: e.target.value})} placeholder="e.g. September Commission" style={{ fontSize: '1.25rem', padding: '1rem' }} />
            </div>
            <button type="submit" className="btn btn-success" style={{ padding: '1rem 2rem', fontSize: '1.1rem', background: 'var(--success)' }}>Log Offset</button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="action-bar" style={{ background: 'transparent', border: 'none', padding: 0, marginBottom: '1rem' }}>
          <div className="action-bar-left">
            <h3 className="card-title" style={{ margin: 0 }}>Drawings Ledger</h3>
          </div>
          <div className="action-bar-right">
            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by note or owner name..." />
          </div>
        </div>

        <div className="table-container">
          <table className="responsive-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Owner</th>
                <th>Note</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Funded From</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ledgerPagination.currentData.map(item => (
                <tr key={`${item.type}-${item.id}`}>
                  <td data-label="Date">{new Date(item.date).toLocaleDateString()}</td>
                  <td className="strong" data-label="Owner">{item.owner_name}</td>
                  <td data-label="Note">
                    {item.purpose}
                    {item.type === 'REPAYMENT' && <span style={{ fontSize: '0.75rem', color: 'var(--success)', marginLeft: '0.5rem' }}>(Commission Offset)</span>}
                  </td>
                  <td className="strong" data-label="Amount" style={{ color: item.type === 'REPAYMENT' ? 'var(--success)' : 'var(--danger)' }}>
                    {item.type === 'REPAYMENT' ? '-' : ''}{formatCurrency(item.amount)}
                  </td>
                  <td data-label="Status">
                    {item.type === 'DRAWING' ? (
                      <span className={`badge ${item.status === 'APPROVED' ? 'badge-success' : item.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>
                        {item.status}
                      </span>
                    ) : (
                      <span className="badge badge-success">APPLIED</span>
                    )}
                  </td>
                  <td data-label="Funded From">{item.type === 'DRAWING' ? (item.source_bank_name || '-') : 'Ledger Offset'}</td>
                  <td data-label="Actions">
                    {item.type === 'DRAWING' && item.status === 'PENDING' && user.role === 'ACCOUNTANT' && (
                      approvingId === item.id ? (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                          <CustomSelect 
                            value={approvalBank} 
                            onChange={setApprovalBank} 
                            placeholder="Select Bank..."
                            options={bankAccounts.map(b => ({ value: b.id, label: b.name }))}
                          />
                          <button onClick={() => handleApprove(item.id)} className="btn btn-success" style={{ padding: '0.25rem', background: 'var(--success)', border: 'none', color: '#fff' }}><CheckCircle size={16}/></button>
                          <button onClick={() => setApprovingId(null)} className="btn" style={{ padding: '0.25rem', background: 'transparent' }}><X size={16}/></button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button onClick={() => setApprovingId(item.id)} className="btn btn-success" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'var(--success)', color: '#fff' }}>Approve</button>
                          <button onClick={() => handleReject(item.id)} className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'var(--danger)', color: '#fff' }}>Reject</button>
                        </div>
                      )
                    )}
                  </td>
                </tr>
              ))}
              {ledgerPagination.currentData.length === 0 && <tr><td colSpan="7" style={{textAlign: 'center', padding: '2rem'}}>No ledger items found.</td></tr>}
            </tbody>
          </table>
          <Pagination {...ledgerPagination} />
        </div>
      </div>
    </div>
  );
};

export default OwnerDrawings;

import React, { useState, useEffect, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { Gem, Plus, CheckCircle, XCircle, X } from 'lucide-react';
import usePagination from '../hooks/usePagination';
import Pagination from '../components/Pagination';
import SearchBar from '../components/SearchBar';
import CustomSelect from '../components/CustomSelect';

const OwnerDrawings = () => {
  const { user } = useContext(AuthContext);
  const [drawings, setDrawings] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [newDraw, setNewDraw] = useState({
    amount: '',
    purpose: ''
  });

  const [searchQuery, setSearchQuery] = useState('');

  const [approvingId, setApprovingId] = useState(null);
  const [approvalBank, setApprovalBank] = useState('');

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const drawRes = await api.get('owner-draws/');
      setDrawings(drawRes.data);
      const bankRes = await api.get('bank-accounts/');
      setBankAccounts(bankRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDraw = async (e) => {
    e.preventDefault();
    try {
      await api.post('owner-draws/', {
        ...newDraw,
        owner: user.id
      });
      setShowForm(false);
      setNewDraw({ amount: '', purpose: '' });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to submit drawing request');
    }
  };

  const handleApprove = async (id) => {
    if (!approvalBank) {
      alert("Please select a source bank account to fund this draw from.");
      return;
    }
    try {
      await api.post(`owner-draws/${id}/approve/`, { source_bank_id: approvalBank });
      setApprovingId(null);
      setApprovalBank('');
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to approve request');
    }
  };

  const handleReject = async (id) => {
    if (window.confirm("Reject this request?")) {
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

  const totalWithdrawn = drawings
    .filter(d => d.status === 'APPROVED')
    .reduce((sum, d) => sum + parseFloat(d.amount), 0);

  const filteredDrawings = drawings.filter(d => 
    d.purpose.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.owner_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const drawingsPagination = usePagination(filteredDrawings, 25);

  if (!user) return <div style={{padding: '2rem'}}>Please log in to continue.</div>;
  if (loading) return <div style={{padding: '2rem'}}>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title gradient-text">Owner's Equity & Drawings</h1>
      </div>

      <div className="glass-panel" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))', padding: '1rem', borderRadius: '1rem', color: '#a78bfa' }}>
            <Gem size={32} />
          </div>
          <div>
            <p style={{ margin: 0, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>Total Personal Withdrawals</p>
            <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '700' }}>{formatCurrency(totalWithdrawn)}</h2>
          </div>
        </div>
        <button 
          className="btn btn-primary" 
          style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', padding: '1rem 2rem', borderRadius: '0.75rem', fontSize: '1.1rem' }}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? <><X size={20} /> Cancel</> : <><Plus size={20} /> Request Funds</>}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '2rem', animation: 'fadeIn 0.3s ease' }}>
          <form onSubmit={handleRequestDraw} style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
              <label>Amount Requested (₹)</label>
              <input type="number" step="0.01" required value={newDraw.amount} onChange={e => setNewDraw({...newDraw, amount: e.target.value})} placeholder="0.00" style={{ fontSize: '1.25rem', padding: '1rem' }} />
            </div>
            <div className="form-group" style={{ flex: '2 1 300px', marginBottom: 0 }}>
              <label>Purpose / Note</label>
              <input type="text" required value={newDraw.purpose} onChange={e => setNewDraw({...newDraw, purpose: e.target.value})} placeholder="e.g. Personal Expenses" style={{ fontSize: '1.25rem', padding: '1rem' }} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem', background: 'var(--success)' }}>Submit Request</button>
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
              {drawingsPagination.currentData.map(draw => (
                <tr key={draw.id}>
                  <td data-label="Date">{new Date(draw.date).toLocaleDateString()}</td>
                  <td className="strong" data-label="Owner">{draw.owner_name}</td>
                  <td data-label="Note">{draw.purpose}</td>
                  <td className="strong" data-label="Amount">{formatCurrency(draw.amount)}</td>
                  <td data-label="Status">
                    <span className={`badge ${draw.status === 'APPROVED' ? 'badge-success' : draw.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>
                      {draw.status}
                    </span>
                  </td>
                  <td data-label="Funded From">{draw.source_bank_name || '-'}</td>
                  <td data-label="Actions">
                    {draw.status === 'PENDING' && (user.role === 'OWNER' || user.role === 'ACCOUNTANT') && (
                      approvingId === draw.id ? (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                          <CustomSelect 
                            value={approvalBank} 
                            onChange={setApprovalBank} 
                            placeholder="Select Bank..."
                            options={bankAccounts.map(b => ({ value: b.id, label: b.name }))}
                          />
                          <button onClick={() => handleApprove(draw.id)} className="btn btn-success" style={{ padding: '0.25rem', background: 'var(--success)', border: 'none', color: '#fff' }}><CheckCircle size={16}/></button>
                          <button onClick={() => setApprovingId(null)} className="btn" style={{ padding: '0.25rem', background: 'transparent' }}><X size={16}/></button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button onClick={() => setApprovingId(draw.id)} className="btn btn-success" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'var(--success)', color: '#fff' }}>Approve</button>
                          <button onClick={() => handleReject(draw.id)} className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'var(--danger)', color: '#fff' }}>Reject</button>
                        </div>
                      )
                    )}
                  </td>
                </tr>
              ))}
              {drawingsPagination.currentData.length === 0 && <tr><td colSpan="7" style={{textAlign: 'center', padding: '2rem'}}>No drawings found.</td></tr>}
            </tbody>
          </table>
          <Pagination {...drawingsPagination} />
        </div>
      </div>
    </div>
  );
};

export default OwnerDrawings;

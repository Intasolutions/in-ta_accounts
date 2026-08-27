import React, { useState, useEffect, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { Wallet, Plus, ArrowDownToLine, Receipt, Edit2, Trash2, X, CheckCircle, XCircle, Filter } from 'lucide-react';
import usePagination from '../hooks/usePagination';
import Pagination from '../components/Pagination';
import SearchBar from '../components/SearchBar';

const Expenses = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('register'); // 'register' or 'advances'

  const [expenses, setExpenses] = useState([]);
  const [advanceRequests, setAdvanceRequests] = useState([]);
  const [advanceWallet, setAdvanceWallet] = useState(null);

  const [projects, setProjects] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Filters
  const [filterProject, setFilterProject] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Forms
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showAdvanceForm, setShowAdvanceForm] = useState(false);

  const [newExpense, setNewExpense] = useState({
    expense_type: 'DIRECT',
    payee_description: '',
    category: 'OTHER',
    project: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    withdrawal_account: '',
    receipt_file: null
  });

  const [newAdvance, setNewAdvance] = useState({
    amount: '',
    purpose: ''
  });

  // Approval state
  const [approvingId, setApprovingId] = useState(null);
  const [approvalBank, setApprovalBank] = useState('');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const walletsRes = await api.get('advance-wallets/');
      const myWallet = walletsRes.data.find(w => w.user === user.id);
      setAdvanceWallet(myWallet);

      const expRes = await api.get('company-expenses/');
      setExpenses(expRes.data);

      const advRes = await api.get('advance-requests/');
      setAdvanceRequests(advRes.data);

      const projRes = await api.get('projects/');
      setProjects(projRes.data);

      const bankRes = await api.get('bank-accounts/');
      setBankAccounts(bankRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogExpense = async (e) => {
    e.preventDefault();
    try {
      if (newExpense.expense_type === 'DIRECT' && !newExpense.withdrawal_account) {
        alert("Please select a Paid From account for Direct expenses.");
        return;
      }

      const formData = new FormData();
      formData.append('expense_type', newExpense.expense_type);
      formData.append('payee_description', newExpense.payee_description);
      formData.append('category', newExpense.category);
      if (newExpense.project) formData.append('project', newExpense.project);
      formData.append('amount', newExpense.amount);
      formData.append('date', newExpense.date);
      if (newExpense.expense_type === 'DIRECT' && newExpense.withdrawal_account) {
        formData.append('withdrawal_account', newExpense.withdrawal_account);
      }
      formData.append('logged_by', user.id);

      if (newExpense.receipt_file) {
        formData.append('receipt_file', newExpense.receipt_file);
      }

      await api.post('company-expenses/', formData);

      setShowExpenseForm(false);
      setNewExpense({
        expense_type: 'DIRECT',
        payee_description: '',
        category: 'OTHER',
        project: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        withdrawal_account: '',
        receipt_file: null
      });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to save expense');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm("Delete this expense?")) {
      try {
        await api.delete(`company-expenses/${id}/`);
        fetchData();
      } catch (err) {
        console.error(err);
        alert('Failed to delete expense');
      }
    }
  };

  const handleRequestAdvance = async (e) => {
    e.preventDefault();
    try {
      await api.post('advance-requests/', {
        ...newAdvance,
        requested_by: user.id
      });
      setShowAdvanceForm(false);
      setNewAdvance({ amount: '', purpose: '' });
      fetchData();
      alert('Advance request submitted successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to submit request');
    }
  };

  const handleApproveAdvance = async (id) => {
    if (!approvalBank) {
      alert("Please select a bank account to fund this advance from.");
      return;
    }
    try {
      await api.post(`advance-requests/${id}/approve/`, { source_bank_id: approvalBank });
      setApprovingId(null);
      setApprovalBank('');
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to approve request');
    }
  };

  const handleRejectAdvance = async (id) => {
    if (window.confirm("Reject this request?")) {
      try {
        await api.post(`advance-requests/${id}/reject/`);
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
  };

  const filteredExpenses = expenses.filter(e => {
    const matchesFilter = filter === 'ALL' || e.status === filter;
    const matchesProject = !filterProject || e.project === parseInt(filterProject);
    const matchesCategory = !filterCategory || e.category === filterCategory;
    const matchesSearch =
      e.payee_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.logged_by_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.project_name && e.project_name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesProject && matchesCategory && matchesSearch;
  });

  const expensesPagination = usePagination(filteredExpenses, 25);

  if (!user) return <div style={{ padding: '2rem' }}>Please log in to continue.</div>;
  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>;

  return (
    <div>
      <div className="page-header expenses-header">
        <div>
          <h1 className="page-title">Company Expenses</h1>
        </div>

        {/* Wallet Widget + Log Expense */}
        <div className="expenses-header-actions">
          <div style={{
            background: 'var(--surface-color)',
            border: '1px solid var(--surface-border)',
            padding: '0.75rem 1.25rem',
            borderRadius: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '0.5rem', borderRadius: '50%', color: 'var(--primary-color)' }}>
              <Wallet size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>My Advance Wallet</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{formatCurrency(advanceWallet?.current_balance || 0)}</div>
            </div>
          </div>
          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => setShowExpenseForm(!showExpenseForm)}
          >
            {showExpenseForm ? <X size={18} /> : <><Plus size={18} /> Log Expense</>}
          </button>
        </div>
      </div>

      <div className="expenses-tabs">
        <button
          className={`btn ${activeTab === 'register' ? 'btn-primary' : ''}`}
          style={{ background: activeTab === 'register' ? 'var(--primary-color)' : 'transparent' }}
          onClick={() => setActiveTab('register')}
        >
          Expense Register
        </button>
        <button
          className={`btn ${activeTab === 'advances' ? 'btn-primary' : ''}`}
          style={{ background: activeTab === 'advances' ? 'var(--primary-color)' : 'transparent' }}
          onClick={() => setActiveTab('advances')}
        >
          Advance Requests
        </button>
      </div>

      {/* ----------------- EXPENSE REGISTER TAB ----------------- */}
      {activeTab === 'register' && (
        <div className="card">
          <div className="action-bar">
            <div className="action-bar-left">
              <div className="segmented-control">
                <button className={`segmented-btn ${filter === 'ALL' ? 'active' : ''}`} onClick={() => setFilter('ALL')}>All</button>
                <button className={`segmented-btn ${filter === 'PENDING' ? 'active' : ''}`} onClick={() => setFilter('PENDING')}><Filter size={14} /> Pending</button>
                <button className={`segmented-btn ${filter === 'VERIFIED' ? 'active' : ''}`} onClick={() => setFilter('VERIFIED')}><CheckCircle size={14} /> Verified</button>
                <button className={`segmented-btn ${filter === 'REJECTED' ? 'active' : ''}`} onClick={() => setFilter('REJECTED')}><XCircle size={14} /> Rejected</button>
              </div>
            </div>
            <div className="action-bar-right">
              <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search expenses..." />
              <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="sleek-select">
                <option value="">All Projects</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="sleek-select">
                <option value="">All Categories</option>
                <option value="TRAVEL">Travel</option>
                <option value="SERVERS">Servers / Hosting</option>
                <option value="SOFTWARE">Software Licenses</option>
                <option value="MARKETING">Marketing</option>
                <option value="OFFICE">Office Supplies</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          {showExpenseForm && (
            <form onSubmit={handleLogExpense} className="premium-form">
              <div className="premium-form-header">
                <h3 className="premium-form-title">Log New Expense</h3>
              </div>

              <div className="premium-form-grid">
                <div className="form-group">
                  <label>Expense Type</label>
                  <select value={newExpense.expense_type} onChange={e => setNewExpense({ ...newExpense, expense_type: e.target.value })} className="sleek-select">
                    <option value="DIRECT">Direct (Paid from Company Bank)</option>
                    <option value="FROM_WALLET">Indirect (Paid from My Wallet)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Payee / Description</label>
                  <input type="text" required value={newExpense.payee_description} onChange={e => setNewExpense({ ...newExpense, payee_description: e.target.value })} placeholder="e.g. AWS Hosting" />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={newExpense.category} onChange={e => setNewExpense({ ...newExpense, category: e.target.value })} className="sleek-select">
                    <option value="TRAVEL">Travel</option>
                    <option value="SERVERS">Servers / Hosting</option>
                    <option value="SOFTWARE">Software Licenses</option>
                    <option value="MARKETING">Marketing</option>
                    <option value="OFFICE">Office Supplies</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Project (Optional)</label>
                  <select value={newExpense.project} onChange={e => setNewExpense({ ...newExpense, project: e.target.value })} className="sleek-select">
                    <option value="">-- None --</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Amount (₹)</label>
                  <input type="number" step="0.01" required value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} placeholder="0.00" />
                </div>
                {newExpense.expense_type === 'DIRECT' && (
                  <div className="form-group">
                    <label>Paid From Bank Account</label>
                    <select required value={newExpense.withdrawal_account} onChange={e => setNewExpense({ ...newExpense, withdrawal_account: e.target.value })} className="sleek-select">
                      <option value="">Select Account...</option>
                      {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.name} (Balance: {formatCurrency(b.current_balance)})</option>)}
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label>Invoice / Receipt (Optional)</label>
                  <input type="file" onChange={e => setNewExpense({ ...newExpense, receipt_file: e.target.files[0] })} />
                </div>
              </div>

              <div className="premium-form-actions">
                <button type="button" className="btn" onClick={() => setShowExpenseForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Expense</button>
              </div>
            </form>
          )}

          <div className="table-container">
            <table className="responsive-table" style={{ tableLayout: 'auto', minWidth: '100%' }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Project</th>
                  <th>Category</th>
                  <th>Logged By</th>
                  <th>Source</th>
                  <th>Amount</th>
                  <th>Receipt</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expensesPagination.currentData.map(exp => (
                  <tr key={exp.id}>
                    <td data-label="Date">{exp.date}</td>
                    <td className="strong" data-label="Description">{exp.payee_description}</td>
                    <td data-label="Project">{exp.project_name || '-'}</td>
                    <td data-label="Category">{exp.category}</td>
                    <td data-label="Logged By">{exp.logged_by_name}</td>
                    <td data-label="Source">{exp.expense_type === 'DIRECT' ? exp.withdrawal_account_name : 'Wallet'}</td>
                    <td className="strong" data-label="Amount">{formatCurrency(exp.amount)}</td>
                    <td data-label="Receipt">
                      {exp.receipt_drive_link ? (
                        <a href={exp.receipt_drive_link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Receipt size={16} /> View
                        </a>
                      ) : '-'}
                    </td>
                    <td data-label="Actions">
                      <button className="btn" onClick={() => handleDeleteExpense(exp.id)} style={{ padding: '0.25rem', color: 'var(--danger)', background: 'transparent' }}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
                {expensesPagination.currentData.length === 0 && <tr><td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>No expenses found.</td></tr>}
              </tbody>
            </table>
            <Pagination {...expensesPagination} />
          </div>
        </div>
      )}

      {/* ----------------- ADVANCE REQUESTS TAB ----------------- */}
      {activeTab === 'advances' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 className="card-title" style={{ margin: 0 }}>Advance Requests</h2>
            <button className="btn btn-primary" onClick={() => setShowAdvanceForm(!showAdvanceForm)}>
              {showAdvanceForm ? <X size={18} /> : <><Plus size={18} /> Request Funds</>}
            </button>
          </div>

          {showAdvanceForm && (
            <form onSubmit={handleRequestAdvance} style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
                <label>Amount Requested (₹)</label>
                <input type="number" required value={newAdvance.amount} onChange={e => setNewAdvance({ ...newAdvance, amount: e.target.value })} placeholder="0.00" />
              </div>
              <div className="form-group" style={{ flex: '2 1 300px', marginBottom: 0 }}>
                <label>Purpose</label>
                <input type="text" required value={newAdvance.purpose} onChange={e => setNewAdvance({ ...newAdvance, purpose: e.target.value })} placeholder="e.g. Travel to client site" />
              </div>
              <button type="submit" className="btn btn-primary">Submit Request</button>
            </form>
          )}

          <div className="table-container">
            <table className="responsive-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Requested By</th>
                  <th>Purpose</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Source Bank</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {advanceRequests.map(req => (
                  <tr key={req.id}>
                    <td data-label="Date">{new Date(req.date).toLocaleDateString()}</td>
                    <td className="strong" data-label="Requested By">{req.requested_by_name}</td>
                    <td data-label="Purpose">{req.purpose}</td>
                    <td className="strong" data-label="Amount">{formatCurrency(req.amount)}</td>
                    <td data-label="Status">
                      <span className={`badge ${req.status === 'APPROVED' ? 'badge-success' : req.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>
                        {req.status}
                      </span>
                    </td>
                    <td data-label="Source Bank">{req.source_bank_name || '-'}</td>
                    <td data-label="Actions">
                      {req.status === 'PENDING' && user.role === 'ACCOUNTANT' && (
                        approvingId === req.id ? (
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <select value={approvalBank} onChange={e => setApprovalBank(e.target.value)} style={{ padding: '0.25rem', width: '150px' }}>
                              <option value="">Select Bank...</option>
                              {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                            <button onClick={() => handleApproveAdvance(req.id)} className="btn btn-success" style={{ padding: '0.25rem' }}><CheckCircle size={16} /></button>
                            <button onClick={() => setApprovingId(null)} className="btn" style={{ padding: '0.25rem' }}><X size={16} /></button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => setApprovingId(req.id)} className="btn btn-success" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'var(--success)', color: '#fff' }}>Approve</button>
                            <button onClick={() => handleRejectAdvance(req.id)} className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'var(--danger)', color: '#fff' }}>Reject</button>
                          </div>
                        )
                      )}
                    </td>
                  </tr>
                ))}
                {advanceRequests.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No advance requests found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;

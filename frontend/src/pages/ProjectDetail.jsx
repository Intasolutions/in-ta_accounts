import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, Plus, CheckCircle, Clock, Edit2, Trash2, X, FileText, Download, DollarSign } from 'lucide-react';
import usePagination from '../hooks/usePagination';
import Pagination from '../components/Pagination';
import SearchBar from '../components/SearchBar';

const ProjectDetail = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  // Forms
  const [showEnhancementForm, setShowEnhancementForm] = useState(false);
  const [editingEnhancement, setEditingEnhancement] = useState(null);
  const [newEnhancement, setNewEnhancement] = useState({ title: '', cost: '' });

  const [showRenewalForm, setShowRenewalForm] = useState(false);
  const [editingRenewal, setEditingRenewal] = useState(null);
  const [newRenewal, setNewRenewal] = useState({ title: '', cost: '', due_date: '' });

  const [bankAccounts, setBankAccounts] = useState([]);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [newInvoice, setNewInvoice] = useState({ amount: '', date: new Date().toISOString().split('T')[0], status: 'PAID', deposit_account: '', description: '' });

  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [enhancementSearch, setEnhancementSearch] = useState('');
  const [renewalSearch, setRenewalSearch] = useState('');
  const [expenseSearch, setExpenseSearch] = useState('');

  useEffect(() => {
    fetchProject();
    fetchBankAccounts();
  }, [id]);

  const fetchBankAccounts = async () => {
    try {
      const res = await api.get('bank-accounts/');
      setBankAccounts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProject = async () => {
    setLoading(true);
    try {
      const res = await api.get(`projects/${id}/`);
      setProject(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEnhancement = async (e) => {
    e.preventDefault();
    try {
      if (editingEnhancement) {
        await api.put(`enhancements/${editingEnhancement}/`, { ...newEnhancement, project: id });
      } else {
        await api.post('enhancements/', { ...newEnhancement, project: id });
      }
      resetEnhancementForm();
      fetchProject();
    } catch (err) {
      console.error(err);
      alert("Failed to save enhancement");
    }
  };

  const handleEditEnhancement = (enhancement) => {
    setEditingEnhancement(enhancement.id);
    setNewEnhancement({ title: enhancement.title, cost: enhancement.cost });
    setShowEnhancementForm(true);
  };

  const handleDeleteEnhancement = async (enhId) => {
    if (window.confirm("Are you sure you want to delete this enhancement?")) {
      try {
        await api.delete(`enhancements/${enhId}/`);
        fetchProject();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const resetEnhancementForm = () => {
    setNewEnhancement({ title: '', cost: '' });
    setEditingEnhancement(null);
    setShowEnhancementForm(false);
  };

  const handleAddRenewal = async (e) => {
    e.preventDefault();
    try {
      if (editingRenewal) {
        await api.put(`renewals/${editingRenewal}/`, { ...newRenewal, project: id });
      } else {
        await api.post('renewals/', { ...newRenewal, project: id });
      }
      resetRenewalForm();
      fetchProject();
    } catch (err) {
      console.error(err);
      alert("Failed to save renewal");
    }
  };

  const handleEditRenewal = (renewal) => {
    setEditingRenewal(renewal.id);
    setNewRenewal({ title: renewal.title, cost: renewal.cost, due_date: renewal.due_date });
    setShowRenewalForm(true);
  };

  const handleDeleteRenewal = async (renId) => {
    if (window.confirm("Are you sure you want to delete this renewal?")) {
      try {
        await api.delete(`renewals/${renId}/`);
        fetchProject();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const resetRenewalForm = () => {
    setNewRenewal({ title: '', cost: '', due_date: '' });
    setEditingRenewal(null);
    setShowRenewalForm(false);
  };

  const toggleRenewalStatus = async (renewalId, currentStatus) => {
    try {
      await api.patch(`renewals/${renewalId}/`, { is_paid: !currentStatus });
      fetchProject();
    } catch (err) {
      console.error(err);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
  };

  const filteredInvoices = (project?.invoices || []).filter(i => 
    (i.status || '').toLowerCase().includes(invoiceSearch.toLowerCase()) || 
    (i.id || '').toString().includes(invoiceSearch)
  );

  const filteredEnhancements = (project?.enhancements || []).filter(e => 
    (e.title || '').toLowerCase().includes(enhancementSearch.toLowerCase())
  );

  const filteredRenewals = (project?.renewals || []).filter(r => 
    (r.title || '').toLowerCase().includes(renewalSearch.toLowerCase())
  );

  const filteredExpenses = (project?.expenses || []).filter(e => 
    (e.payee_description || '').toLowerCase().includes(expenseSearch.toLowerCase()) ||
    (e.category || '').toLowerCase().includes(expenseSearch.toLowerCase())
  );

  const invoicesPagination = usePagination(filteredInvoices, 25);
  const enhancementsPagination = usePagination(filteredEnhancements, 25);
  const renewalsPagination = usePagination(filteredRenewals, 25);
  const expensesPagination = usePagination(filteredExpenses, 25);

  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>;
  if (!project) return <div style={{ padding: '2rem' }}>Project not found.</div>;

  const resetInvoiceForm = () => {
    setNewInvoice({ amount: '', date: new Date().toISOString().split('T')[0], status: 'PAID', deposit_account: '', description: '' });
    setShowInvoiceForm(false);
  };

  const handleAddInvoice = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...newInvoice, project: id };
      if (payload.status !== 'PAID') {
        payload.deposit_account = null;
      } else if (!payload.deposit_account) {
        alert("Please select a deposit account for PAID invoices.");
        return;
      }
      if (payload.deposit_account === '') payload.deposit_account = null;

      await api.post('invoices/', payload);
      resetInvoiceForm();
      fetchProject();
      alert("Payment logged and Invoice PDF generated successfully!");
    } catch (err) {
      console.error(err);
      alert('Failed to log payment');
    }
  };

  const totalEnhancements = (project.enhancements || []).reduce((acc, curr) => acc + parseFloat(curr.cost || 0), 0);
  const totalExpenses = (project.expenses || []).reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
  const amcEligibleTotal = parseFloat(project.total_value || 0) + totalEnhancements;
  const calculatedAMC = amcEligibleTotal * (parseFloat(project.amc_percentage || 0) / 100);
  
  const totalProjectValue = parseFloat(project.total_project_value || (parseFloat(project.total_value || 0) + totalEnhancements));
  const amountReceived = parseFloat(project.amount_received || 0);
  const balanceDue = parseFloat(project.balance_due || (totalProjectValue - amountReceived));

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/projects" className="btn" style={{ background: 'var(--surface-color)', padding: '0.5rem' }}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="page-title" style={{ marginBottom: 0 }}>{project.name}</h1>
            <div style={{ color: 'var(--text-muted)' }}>Client: {project.client_name}</div>
          </div>
        </div>
      </div>

      {/* Financial Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ marginBottom: 0, padding: '1rem', borderTop: '4px solid var(--primary-color)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Project Value</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{formatCurrency(totalProjectValue)}</div>
        </div>
        <div className="card" style={{ marginBottom: 0, padding: '1rem', borderTop: '4px solid var(--success)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Amount Received</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>{formatCurrency(amountReceived)}</div>
        </div>
        <div className="card" style={{ marginBottom: 0, padding: '1rem', borderTop: '4px solid var(--danger)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Balance Due</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--danger)' }}>{formatCurrency(balanceDue)}</div>
        </div>
        <div className="card" style={{ marginBottom: 0, padding: '1rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Annual AMC ({project.amc_percentage}%)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--info)' }}>{formatCurrency(calculatedAMC)}</div>
          {project.delivery_date && (
            <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: 'var(--text-muted)' }}>
              Kicks in 3 mos post: {project.delivery_date}
            </div>
          )}
        </div>
      </div>

      {/* Payments & Invoices */}
      <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--success)' }}>
        <div className="action-bar" style={{ background: 'transparent', border: 'none', padding: 0, marginBottom: '1rem' }}>
          <div className="action-bar-left">
            <h3 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><DollarSign size={20}/> Payments & Invoices (Ledger)</h3>
          </div>
          <div className="action-bar-right">
            <SearchBar value={invoiceSearch} onChange={setInvoiceSearch} placeholder="Search invoices by status or ID..." />
            <button className="btn btn-primary" onClick={() => { if (showInvoiceForm) { resetInvoiceForm(); } else { resetInvoiceForm(); setShowInvoiceForm(true); } }}>
              {showInvoiceForm ? <X size={18}/> : <><Plus size={18} /> Log Payment / Invoice</>}
            </button>
          </div>
        </div>

        {showInvoiceForm && (
          <form onSubmit={handleAddInvoice} className="premium-form">
            <div className="premium-form-header">
              <h3 className="premium-form-title" style={{ color: 'var(--success)' }}>Log Payment Received / Advance</h3>
            </div>
            <div className="premium-form-grid">
              <div className="form-group">
                <label>Amount Received (₹)</label>
                <input type="number" step="0.01" required value={newInvoice.amount} onChange={e => setNewInvoice({...newInvoice, amount: e.target.value})} placeholder="0.00" />
              </div>
              <div className="form-group">
                <label>Description (Optional)</label>
                <input type="text" value={newInvoice.description} onChange={e => setNewInvoice({...newInvoice, description: e.target.value})} placeholder="Custom text for PDF Invoice..." />
              </div>
              <div className="form-group">
                <label>Date Received</label>
                <input type="date" required value={newInvoice.date} onChange={e => setNewInvoice({...newInvoice, date: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select required value={newInvoice.status} onChange={e => setNewInvoice({...newInvoice, status: e.target.value})} className="sleek-select">
                  <option value="PAID">PAID (Money in Bank)</option>
                  <option value="SENT">SENT (Awaiting Payment)</option>
                </select>
              </div>
              {newInvoice.status === 'PAID' && (
                <div className="form-group">
                  <label>Deposit Bank Account</label>
                  <select required value={newInvoice.deposit_account} onChange={e => setNewInvoice({...newInvoice, deposit_account: e.target.value})} className="sleek-select">
                    <option value="">Select Account...</option>
                    {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="premium-form-actions">
              <button type="button" className="btn" onClick={resetInvoiceForm}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ background: 'var(--success)' }}>
                <Download size={18} /> Save & Generate PDF
              </button>
            </div>
          </form>
        )}
        <div className="table-container">
          <table className="responsive-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Invoice #</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoicesPagination.currentData.map(inv => (
                <tr key={inv.id}>
                  <td data-label="Date">{inv.date}</td>
                  <td className="strong" data-label="Invoice #">INV-{inv.id.toString().padStart(4, '0')}</td>
                  <td className="strong" data-label="Amount">{formatCurrency(inv.amount)}</td>
                  <td data-label="Status">
                    <span className={`badge ${inv.status === 'PAID' ? 'badge-success' : inv.status === 'SENT' ? 'badge-info' : 'badge-warning'}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td data-label="Actions">
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      {inv.pdf_file && (
                        <a href={inv.pdf_file.startsWith('http') ? inv.pdf_file : `http://localhost:8000${inv.pdf_file}`} target="_blank" rel="noopener noreferrer" title="Download PDF" className="btn" style={{ padding: '0.25rem', color: 'var(--success)', background: 'transparent' }}>
                          <FileText size={16}/>
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {invoicesPagination.currentData.length === 0 && <tr><td colSpan="5">No payments or invoices logged for this project yet.</td></tr>}
            </tbody>
          </table>
          <Pagination {...invoicesPagination} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 500px), 1fr))', gap: '1.5rem' }}>
        
        {/* Enhancements */}
        <div className="card">
          <div className="action-bar" style={{ background: 'transparent', border: 'none', padding: 0, marginBottom: '1rem' }}>
            <div className="action-bar-left">
              <h3 className="card-title" style={{ margin: 0 }}>Enhancements</h3>
            </div>
            <div className="action-bar-right">
              <SearchBar value={enhancementSearch} onChange={setEnhancementSearch} placeholder="Search enhancements..." />
              <button className="btn btn-primary" onClick={() => { if (showEnhancementForm) { resetEnhancementForm(); } else { resetEnhancementForm(); setShowEnhancementForm(true); } }}>
                {showEnhancementForm ? <X size={18}/> : <><Plus size={18} /> Add</>}
              </button>
            </div>
          </div>

          {showEnhancementForm && (
            <form onSubmit={handleAddEnhancement} className="premium-form">
              <div className="premium-form-grid">
                <div className="form-group">
                  <label>Description</label>
                  <input type="text" required placeholder="Description" value={newEnhancement.title} onChange={e => setNewEnhancement({...newEnhancement, title: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Cost (₹)</label>
                  <input type="number" required placeholder="Cost (₹)" value={newEnhancement.cost} onChange={e => setNewEnhancement({...newEnhancement, cost: e.target.value})} />
                </div>
              </div>
              <div className="premium-form-actions">
                <button type="button" className="btn" onClick={resetEnhancementForm}>Cancel</button>
                <button type="submit" className="btn btn-success">{editingEnhancement ? 'Update' : 'Save'}</button>
              </div>
            </form>
          )}
          <div className="table-container">
            <table className="responsive-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Date Added</th>
                  <th>Cost</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {enhancementsPagination.currentData.map(e => (
                  <tr key={e.id}>
                    <td data-label="Description">{e.title}</td>
                    <td data-label="Date Added">{e.date_added}</td>
                    <td className="strong" data-label="Cost">{formatCurrency(e.cost)}</td>
                    <td data-label="Actions">
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button className="btn" onClick={() => handleEditEnhancement(e)} style={{ padding: '0.25rem', color: 'var(--primary-color)', background: 'transparent' }}><Edit2 size={16}/></button>
                        <button className="btn" onClick={() => handleDeleteEnhancement(e.id)} style={{ padding: '0.25rem', color: 'var(--danger)', background: 'transparent' }}><Trash2 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {enhancementsPagination.currentData.length === 0 && <tr><td colSpan="4" style={{textAlign:'center'}}>No enhancements logged.</td></tr>}
              </tbody>
            </table>
            <Pagination {...enhancementsPagination} />
          </div>
        </div>

        {/* Yearly Renewals */}
        <div className="card">
          <div className="action-bar" style={{ background: 'transparent', border: 'none', padding: 0, marginBottom: '1rem' }}>
            <div className="action-bar-left">
              <h3 className="card-title" style={{ margin: 0 }}>Yearly Renewals (3rd Party)</h3>
            </div>
            <div className="action-bar-right">
              <SearchBar value={renewalSearch} onChange={setRenewalSearch} placeholder="Search renewals..." />
              <button className="btn btn-primary" onClick={() => { if (showRenewalForm) { resetRenewalForm(); } else { resetRenewalForm(); setShowRenewalForm(true); } }}>
                {showRenewalForm ? <X size={18}/> : <><Plus size={18} /> Add</>}
              </button>
            </div>
          </div>

          {showRenewalForm && (
            <form onSubmit={handleAddRenewal} className="premium-form">
              <div className="premium-form-grid">
                <div className="form-group">
                  <label>Title</label>
                  <input type="text" required placeholder="e.g. Domain 2026" value={newRenewal.title} onChange={e => setNewRenewal({...newRenewal, title: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Cost (₹)</label>
                  <input type="number" required placeholder="Cost (₹)" value={newRenewal.cost} onChange={e => setNewRenewal({...newRenewal, cost: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input type="date" required value={newRenewal.due_date} onChange={e => setNewRenewal({...newRenewal, due_date: e.target.value})} />
                </div>
              </div>
              <div className="premium-form-actions">
                <button type="button" className="btn" onClick={resetRenewalForm}>Cancel</button>
                <button type="submit" className="btn btn-success">{editingRenewal ? 'Update' : 'Save'}</button>
              </div>
            </form>
          )}
          <div className="table-container">
            <table className="responsive-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Due Date</th>
                  <th>Cost</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {renewalsPagination.currentData.map(r => (
                  <tr key={r.id}>
                    <td data-label="Title">{r.title}</td>
                    <td data-label="Due Date">{r.due_date}</td>
                    <td className="strong" data-label="Cost">{formatCurrency(r.cost)}</td>
                    <td data-label="Status">
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => toggleRenewalStatus(r.id, r.is_paid)}
                          className="btn" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: r.is_paid ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: r.is_paid ? 'var(--success)' : 'var(--warning)', border: 'none' }}
                        >
                          {r.is_paid ? <><CheckCircle size={12}/> Paid</> : <><Clock size={12}/> Unpaid</>}
                        </button>
                      </div>
                    </td>
                    <td data-label="Actions">
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button className="btn" onClick={() => handleEditRenewal(r)} style={{ padding: '0.25rem', color: 'var(--primary-color)', background: 'transparent' }}><Edit2 size={16}/></button>
                        <button className="btn" onClick={() => handleDeleteRenewal(r.id)} style={{ padding: '0.25rem', color: 'var(--danger)', background: 'transparent' }}><Trash2 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {renewalsPagination.currentData.length === 0 && <tr><td colSpan="5" style={{textAlign:'center'}}>No renewals logged.</td></tr>}
              </tbody>
            </table>
            <Pagination {...renewalsPagination} />
          </div>
        </div>

        {/* Expenses (Read-only) */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="action-bar" style={{ background: 'transparent', border: 'none', padding: 0, marginBottom: '1rem' }}>
            <div className="action-bar-left">
              <h3 className="card-title" style={{ margin: 0 }}>Project Expenses</h3>
            </div>
            <div className="action-bar-right">
              <SearchBar value={expenseSearch} onChange={setExpenseSearch} placeholder="Search expenses by description or category..." />
            </div>
          </div>

          <div className="table-container">
            <table className="responsive-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Logged By</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {expensesPagination.currentData.map(exp => (
                  <tr key={exp.id}>
                    <td data-label="Date">{exp.date}</td>
                    <td data-label="Type">
                      <span className={`badge ${exp.expense_type === 'DIRECT' ? 'badge-info' : 'badge-warning'}`}>
                        {exp.expense_type === 'DIRECT' ? 'Direct' : 'Indirect'}
                      </span>
                    </td>
                    <td className="strong" data-label="Description">{exp.payee_description}</td>
                    <td data-label="Category">{exp.category}</td>
                    <td data-label="Logged By">{exp.logged_by_name}</td>
                    <td className="strong" data-label="Amount">{formatCurrency(exp.amount)}</td>
                    <td data-label="Status">
                      <span className={`badge ${exp.status === 'VERIFIED' ? 'badge-success' : 'badge-danger'}`}>
                        {exp.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {expensesPagination.currentData.length === 0 && <tr><td colSpan="7" style={{textAlign:'center'}}>No expenses logged for this project.</td></tr>}
              </tbody>
            </table>
            <Pagination {...expensesPagination} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProjectDetail;

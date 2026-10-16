import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, Plus, CheckCircle, Clock, Edit2, Trash2, X, FileText, Download, Share2, DollarSign } from 'lucide-react';
import usePagination from '../hooks/usePagination';
import Pagination from '../components/Pagination';
import SearchBar from '../components/SearchBar';
import CustomSelect from '../components/CustomSelect';
import { downloadInvoicePdf } from '../utils/pdfDownloader';

const ProjectDetail = () => {
  const toast = useToast();
  const confirm = useConfirm();

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

  const [showScopeForm, setShowScopeForm] = useState(false);
  const [editingScope, setEditingScope] = useState(null);
  const [newScope, setNewScope] = useState({ name: '', earning: '' });
  const [selectedScope, setSelectedScope] = useState('');

  const [bankAccounts, setBankAccounts] = useState([]);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [downloadingInvId, setDownloadingInvId] = useState(null);
  const [newInvoice, setNewInvoice] = useState({ 
    amount: '', 
    date: new Date().toISOString().split('T')[0], 
    status: 'PAID', 
    deposit_account: '', 
    description: '',
    payment_type: 'PARTIAL',
    advance_amount: '',
    advance_date: '',
    balance_amount: ''
  });

  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [enhancementSearch, setEnhancementSearch] = useState('');
  const [renewalSearch, setRenewalSearch] = useState('');
  const [expenseSearch, setExpenseSearch] = useState('');

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [activeMobileTab, setActiveMobileTab] = useState('invoices');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [usdRate, setUsdRate] = useState(83.5); // Fallback rate
  const [rsInputUsd, setRsInputUsd] = useState('');
  const [rsSeats, setRsSeats] = useState('');
  
  useEffect(() => {
    // Fetch live USD to INR rate
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(res => res.json())
      .then(data => {
        if (data && data.rates && data.rates.INR) {
          setUsdRate(data.rates.INR);
        }
      })
      .catch(err => console.error('Error fetching exchange rate:', err));
  }, []);

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
      toast.error("Failed to save enhancement");
    }
  };

  const handleEditEnhancement = (enhancement) => {
    setEditingEnhancement(enhancement.id);
    setNewEnhancement({ title: enhancement.title, cost: enhancement.cost });
    setShowEnhancementForm(true);
  };

  const handleDeleteEnhancement = async (enhId) => {
    if (await confirm("Are you sure you want to delete this enhancement?")) {
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
      toast.error("Failed to save renewal");
    }
  };

  const handleEditRenewal = (renewal) => {
    setEditingRenewal(renewal.id);
    setNewRenewal({ title: renewal.title, cost: renewal.cost, due_date: renewal.due_date });
    setShowRenewalForm(true);
  };

  const handleDeleteRenewal = async (renId) => {
    if (await confirm("Are you sure you want to delete this renewal?")) {
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

  const handleAddScope = async (e) => {
    e.preventDefault();
    try {
      if (editingScope) {
        await api.put(`revenue-share-scopes/${editingScope}/`, { ...newScope, project: id });
      } else {
        await api.post('revenue-share-scopes/', { ...newScope, project: id });
      }
      resetScopeForm();
      fetchProject();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save scope");
    }
  };

  const handleEditScope = (scope) => {
    setEditingScope(scope.id);
    setNewScope({ name: scope.name, earning: scope.earning });
    setShowScopeForm(true);
  };

  const handleDeleteScope = async (scopeId) => {
    if (await confirm("Are you sure you want to delete this scope?")) {
      try {
        await api.delete(`revenue-share-scopes/${scopeId}/`);
        fetchProject();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const resetScopeForm = () => {
    setNewScope({ name: '', earning: '' });
    setEditingScope(null);
    setShowScopeForm(false);
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
    setNewInvoice({ 
      amount: '', 
      date: new Date().toISOString().split('T')[0], 
      status: 'PAID', 
      deposit_account: '', 
      description: '', 
      payment_type: 'PARTIAL',
      advance_amount: '',
      advance_date: '',
      balance_amount: ''
    });
    setRsInputUsd('');
    setRsSeats('');
    setSelectedScope('');
    setShowInvoiceForm(false);
  };

  const handleAddInvoice = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...newInvoice, project: id };
      
      if (project.project_type === 'REVENUE_SHARE') {
        const perc = parseFloat(project.revenue_share_percentage || 0);
        
        if (project.revenue_share_type === 'PROFIT_SHARE') {
          const usdProfit = parseFloat(rsInputUsd || 0);
          const inrProfit = usdProfit * usdRate;
          const shareInr = inrProfit * (perc / 100);
          payload.amount = shareInr.toFixed(2);
          payload.revenue_share_base_amount = inrProfit.toFixed(2);
          payload.description = `Monthly Profit Share (USD ${usdProfit} @ ₹${usdRate.toFixed(2)} = ₹${inrProfit.toFixed(2)} x ${perc}%)`;
        } else if (project.revenue_share_type === 'PER_SEAT') {
          if (!selectedScope) {
            toast.error("Please select a scope/course.");
            return;
          }
          const scope = project.revenue_share_scopes.find(s => s.id.toString() === selectedScope.toString());
          if (!scope) return;
          
          const seats = parseInt(rsSeats || 0);
          const earningUsd = parseFloat(scope.earning || 0);
          const shareInr = seats * earningUsd * usdRate;
          payload.amount = shareInr.toFixed(2);
          payload.revenue_share_seats_sold = seats;
          payload.revenue_share_scope = scope.id;
          payload.description = `Admission Share - ${seats} Seats (${scope.name} @ USD ${earningUsd} Earning per seat, Rate: ₹${usdRate.toFixed(2)})`;
        }
        payload.payment_type = 'PARTIAL';
      }

      if (payload.status !== 'PAID') {
        payload.deposit_account = null;
      } else if (!payload.deposit_account) {
        toast.error("Please select a deposit account for PAID invoices.");
        return;
      }
      if (payload.deposit_account === '') payload.deposit_account = null;

      // Sanitize optional advance/balance overrides
      if (payload.advance_amount === '' || !payload.advance_amount) payload.advance_amount = null;
      if (payload.advance_date === '' || !payload.advance_date) payload.advance_date = null;
      if (payload.balance_amount === '' || !payload.balance_amount) payload.balance_amount = null;

      await api.post('invoices/', payload);
      resetInvoiceForm();
      fetchProject();
      if (project.project_type === 'REVENUE_SHARE') {
        toast.success("Revenue Share ledger logged successfully!");
      } else {
        toast.success("Payment logged and Invoice PDF generated successfully!");
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to log payment');
    }
  };

  const handleDownloadPDF = async (inv, isShare = false) => {
    try {
      setDownloadingInvId(inv.id);
      await downloadInvoicePdf(inv.id, { client_name: project?.client_name, project_name: project?.name }, { share: isShare });
      if (!isShare) toast.success("Invoice PDF downloaded successfully!");
    } catch (error) {
      console.error('Error downloading PDF', error);
      toast.error('Failed to get PDF. Please try again.');
    } finally {
      setDownloadingInvId(null);
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 className="page-title" style={{ marginBottom: 0 }}>{project.name}</h1>
            </div>
            <div style={{ color: 'var(--text-muted)' }}>Client: {project.client_name}</div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Tabs */}
      {isMobile && (
        <div className="filter-chips-scroll" style={{ marginBottom: '1.25rem' }}>
          <button className={`chip ${activeMobileTab === 'invoices' ? 'active' : ''}`} onClick={() => setActiveMobileTab('invoices')}>
            Invoices ({filteredInvoices.length})
          </button>
          <button className={`chip ${activeMobileTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveMobileTab('overview')}>
            Overview
          </button>
          <button className={`chip ${activeMobileTab === 'renewals' ? 'active' : ''}`} onClick={() => setActiveMobileTab('renewals')}>
            {project.project_type === 'REVENUE_SHARE' ? 'Scopes & Renewals' : 'Enhancements & Renewals'}
          </button>
          <button className={`chip ${activeMobileTab === 'expenses' ? 'active' : ''}`} onClick={() => setActiveMobileTab('expenses')}>
            Expenses ({filteredExpenses.length})
          </button>
        </div>
      )}

      {/* Financial Overview */}
      {(!isMobile || activeMobileTab === 'overview') && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(180px, 1fr))', gap: isMobile ? '0.6rem' : '1rem', marginBottom: '2rem' }}>
          <div className="card" style={{ marginBottom: 0, padding: isMobile ? '0.75rem' : '1rem', borderTop: '4px solid var(--primary-color)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Total Project Value</div>
            <div style={{ fontSize: isMobile ? '1.15rem' : '1.5rem', fontWeight: 'bold' }}>{formatCurrency(totalProjectValue)}</div>
          </div>
          <div className="card" style={{ marginBottom: 0, padding: isMobile ? '0.75rem' : '1rem', borderTop: '4px solid var(--success)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{project.project_type === 'REVENUE_SHARE' ? 'Total Earned' : 'Received'}</div>
            <div style={{ fontSize: isMobile ? '1.15rem' : '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>{formatCurrency(amountReceived)}</div>
          </div>
          <div className="card" style={{ marginBottom: 0, padding: isMobile ? '0.75rem' : '1rem', borderTop: '4px solid var(--danger)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Balance Due</div>
            <div style={{ fontSize: isMobile ? '1.15rem' : '1.5rem', fontWeight: 'bold', color: 'var(--danger)' }}>{formatCurrency(balanceDue)}</div>
          </div>
          {project.project_type !== 'REVENUE_SHARE' && (
            <div className="card" style={{ marginBottom: 0, padding: isMobile ? '0.75rem' : '1rem' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Annual AMC ({project.amc_percentage}%)</div>
              <div style={{ fontSize: isMobile ? '1.15rem' : '1.5rem', fontWeight: 'bold', color: 'var(--info)' }}>{formatCurrency(calculatedAMC)}</div>
              {project.delivery_date && (
                <div style={{ fontSize: '0.7rem', marginTop: '0.2rem', color: 'var(--text-muted)' }}>
                  Delivery: {project.delivery_date}
                </div>
              )}
            </div>
          )}
          <div className="card" style={{ marginBottom: 0, padding: isMobile ? '0.75rem' : '1rem', borderTop: '4px solid var(--danger)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Total Expenses</div>
            <div style={{ fontSize: isMobile ? '1.15rem' : '1.5rem', fontWeight: 'bold', color: 'var(--danger)' }}>{formatCurrency(totalExpenses)}</div>
          </div>
          <div className="card" style={{ marginBottom: 0, padding: isMobile ? '0.75rem' : '1rem', borderTop: '4px solid var(--primary-color)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Net Profit</div>
            <div style={{ fontSize: isMobile ? '1.15rem' : '1.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{formatCurrency(amountReceived - totalExpenses)}</div>
          </div>
        </div>
      )}

      {/* Payments & Invoices */}
      {(!isMobile || activeMobileTab === 'invoices') && (
        <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--success)' }}>
          <div className="action-bar" style={{ background: 'transparent', border: 'none', padding: 0, marginBottom: '1rem', flexDirection: isMobile ? 'column' : 'row', gap: '0.75rem' }}>
            <div className="action-bar-left">
              <h3 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
                <DollarSign size={20}/> Payments & Invoices
              </h3>
            </div>
            <div className="action-bar-right" style={{ width: isMobile ? '100%' : 'auto', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <SearchBar value={invoiceSearch} onChange={setInvoiceSearch} placeholder="Search invoices..." />
              <button className="btn btn-primary" onClick={() => { if (showInvoiceForm) { resetInvoiceForm(); } else { resetInvoiceForm(); setShowInvoiceForm(true); } }} style={{ whiteSpace: 'nowrap' }}>
                {showInvoiceForm ? <X size={18}/> : <><Plus size={18} /> Log Payment</>}
              </button>
            </div>
          </div>

          {showInvoiceForm && (
            isMobile ? (
              <div className="modal-overlay" onClick={resetInvoiceForm}>
                <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--success)' }}>
                      {project.project_type === 'REVENUE_SHARE' ? 'Log Revenue Share Payment' : 'Log Payment Received / Advance'}
                    </h3>
                    <button type="button" className="btn" onClick={resetInvoiceForm} style={{ padding: '0.25rem 0.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
                      <X size={20} />
                    </button>
                  </div>
                  <form onSubmit={handleAddInvoice} className="premium-form">
                    {project.project_type === 'REVENUE_SHARE' && (
                      <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>
                            {project.revenue_share_type === 'PROFIT_SHARE' ? 'Monthly Profit Share' : 'Per Seat / Admission Share'}
                          </div>
                          <div style={{ fontSize: '0.85rem' }}>Live Rate: 1 USD = <span className="strong">₹{usdRate.toFixed(2)}</span></div>
                        </div>
                        {project.revenue_share_type === 'PROFIT_SHARE' && (
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            Share Percentage: <span className="strong">{project.revenue_share_percentage}%</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="premium-form-grid">
                      {project.project_type === 'REVENUE_SHARE' ? (
                        project.revenue_share_type === 'PROFIT_SHARE' ? (
                          <div className="form-group">
                            <label>Total Profit This Month (USD)</label>
                            <input type="number" step="0.01" required value={rsInputUsd} onChange={e => setRsInputUsd(e.target.value)} placeholder="0.00" />
                          </div>
                        ) : (
                          <>
                            <div className="form-group">
                              <label>Scope / Course</label>
                              <CustomSelect 
                                required
                                value={selectedScope} 
                                onChange={val => setSelectedScope(val)} 
                                placeholder="Select Scope..."
                                options={(project.revenue_share_scopes || []).map(s => ({ value: s.id, label: s.name }))}
                              />
                            </div>
                            <div className="form-group">
                              <label>Number of Seats</label>
                              <input type="number" required value={rsSeats} onChange={e => setRsSeats(e.target.value)} placeholder="e.g. 5" />
                            </div>
                          </>
                        )
                      ) : (
                        <>
                          <div className="form-group">
                            <label>Amount Received (₹)</label>
                            <input type="number" step="0.01" required value={newInvoice.amount} onChange={e => setNewInvoice({...newInvoice, amount: e.target.value})} placeholder="0.00" />
                          </div>
                          <div className="form-group">
                            <label>Description (Optional)</label>
                            <input type="text" value={newInvoice.description} onChange={e => setNewInvoice({...newInvoice, description: e.target.value})} placeholder="Custom text for PDF Invoice..." />
                          </div>
                        </>
                      )}

                      <div className="form-group">
                        <label>Date Received</label>
                        <input type="date" required value={newInvoice.date} onChange={e => setNewInvoice({...newInvoice, date: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label>Status</label>
                        <CustomSelect 
                          required
                          value={newInvoice.status} 
                          onChange={val => setNewInvoice({...newInvoice, status: val})} 
                          options={[
                            { value: 'PAID', label: 'PAID (Money in Bank)' },
                            { value: 'SENT', label: 'SENT (Awaiting Payment)' }
                          ]}
                        />
                      </div>
                      {project.project_type !== 'REVENUE_SHARE' && (
                        <div className="form-group">
                          <label>Payment Type</label>
                          <CustomSelect 
                            required
                            value={newInvoice.payment_type} 
                            onChange={val => setNewInvoice({...newInvoice, payment_type: val})} 
                            options={[
                              { value: 'ADVANCE', label: 'Advance Payment' },
                              { value: 'PARTIAL', label: 'Partial Payment' },
                              { value: 'FULL', label: 'Full Payment' },
                              { value: 'RENEWAL', label: 'Renewal / AMC' }
                            ]}
                          />
                        </div>
                      )}
                      {project.project_type !== 'REVENUE_SHARE' && newInvoice.payment_type === 'PARTIAL' && (
                        <>
                          <div className="form-group">
                            <label>Advance Paid Amount (₹)</label>
                            <input 
                              type="number" 
                              step="0.01" 
                              value={newInvoice.advance_amount} 
                              onChange={e => setNewInvoice({...newInvoice, advance_amount: e.target.value})} 
                              placeholder="Auto-detected if left empty" 
                            />
                            <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem', display: 'block' }}>
                              Auto-detected from project advance if blank
                            </small>
                          </div>
                          <div className="form-group">
                            <label>Advance Paid Date</label>
                            <input 
                              type="date" 
                              value={newInvoice.advance_date} 
                              onChange={e => setNewInvoice({...newInvoice, advance_date: e.target.value})} 
                            />
                            <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem', display: 'block' }}>
                              Date advance was received
                            </small>
                          </div>
                          <div className="form-group">
                            <label>Remaining Balance Override (₹)</label>
                            <input 
                              type="number" 
                              step="0.01" 
                              value={newInvoice.balance_amount} 
                              onChange={e => setNewInvoice({...newInvoice, balance_amount: e.target.value})} 
                              placeholder="Auto-calculated if left empty" 
                            />
                            <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem', display: 'block' }}>
                              Auto: Project Total minus Payments
                            </small>
                          </div>
                        </>
                      )}
                      {project.project_type !== 'REVENUE_SHARE' && newInvoice.payment_type === 'ADVANCE' && (
                        <div className="form-group">
                          <label>Remaining Balance Override (₹)</label>
                          <input 
                            type="number" 
                            step="0.01" 
                            value={newInvoice.balance_amount} 
                            onChange={e => setNewInvoice({...newInvoice, balance_amount: e.target.value})} 
                            placeholder="Auto: Project Total - Advance" 
                          />
                          <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem', display: 'block' }}>
                            Auto-calculated from project total if blank
                          </small>
                        </div>
                      )}
                      {newInvoice.status === 'PAID' && (
                        <div className="form-group">
                          <label>Deposit Bank Account</label>
                          <CustomSelect 
                            required
                            value={newInvoice.deposit_account} 
                            onChange={val => setNewInvoice({...newInvoice, deposit_account: val})} 
                            placeholder="Select Account..."
                            options={bankAccounts.map(b => ({ value: b.id, label: b.name }))}
                          />
                        </div>
                      )}
                    </div>
                    
                    {project.project_type === 'REVENUE_SHARE' && (
                      <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Calculated Total Earning (INR):</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--success)' }}>
                              {project.revenue_share_type === 'PROFIT_SHARE' 
                                ? formatCurrency((parseFloat(rsInputUsd || 0) * usdRate) * (parseFloat(project.revenue_share_percentage || 0) / 100))
                                : formatCurrency((parseInt(rsSeats || 0) * parseFloat((project.revenue_share_scopes?.find(s => s.id.toString() === selectedScope?.toString())?.earning) || 0) * usdRate))}
                            </div>
                          </div>
                          {project.revenue_share_type === 'PER_SEAT' && selectedScope && rsSeats > 0 && (
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Project Expenses (INR):</div>
                              <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--danger)' }}>
                                {formatCurrency(totalExpenses)}
                              </div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Net Profit (Earning - Expenses):</div>
                              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                                {formatCurrency((parseInt(rsSeats || 0) * parseFloat((project.revenue_share_scopes?.find(s => s.id.toString() === selectedScope?.toString())?.earning) || 0) * usdRate) - totalExpenses)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="premium-form-actions">
                      <button type="button" className="btn" onClick={resetInvoiceForm}>Cancel</button>
                      <button type="submit" className="btn btn-primary" style={{ background: 'var(--success)' }}>
                        {project.project_type === 'REVENUE_SHARE' ? (
                          <><CheckCircle size={18} /> Save Ledger Entry</>
                        ) : (
                          <><Download size={18} /> Save & Generate PDF</>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAddInvoice} className="premium-form">
                <div className="premium-form-header">
                  <h3 className="premium-form-title" style={{ color: 'var(--success)' }}>
                    {project.project_type === 'REVENUE_SHARE' ? 'Log Revenue Share Payment' : 'Log Payment Received / Advance'}
                  </h3>
                </div>
                
                {project.project_type === 'REVENUE_SHARE' && (
                  <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>
                        {project.revenue_share_type === 'PROFIT_SHARE' ? 'Monthly Profit Share' : 'Per Seat / Admission Share'}
                      </div>
                      <div style={{ fontSize: '0.85rem' }}>Live Rate: 1 USD = <span className="strong">₹{usdRate.toFixed(2)}</span></div>
                    </div>
                    {project.revenue_share_type === 'PROFIT_SHARE' && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Share Percentage: <span className="strong">{project.revenue_share_percentage}%</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="premium-form-grid">
                  {project.project_type === 'REVENUE_SHARE' ? (
                    project.revenue_share_type === 'PROFIT_SHARE' ? (
                      <div className="form-group">
                        <label>Total Profit This Month (USD)</label>
                        <input type="number" step="0.01" required value={rsInputUsd} onChange={e => setRsInputUsd(e.target.value)} placeholder="0.00" />
                      </div>
                    ) : (
                      <>
                        <div className="form-group">
                          <label>Scope / Course</label>
                          <CustomSelect 
                            required
                            value={selectedScope} 
                            onChange={val => setSelectedScope(val)} 
                            placeholder="Select Scope..."
                            options={(project.revenue_share_scopes || []).map(s => ({ value: s.id, label: s.name }))}
                          />
                        </div>
                        <div className="form-group">
                          <label>Number of Seats</label>
                          <input type="number" required value={rsSeats} onChange={e => setRsSeats(e.target.value)} placeholder="e.g. 5" />
                        </div>
                      </>
                    )
                  ) : (
                    <>
                      <div className="form-group">
                        <label>Amount Received (₹)</label>
                        <input type="number" step="0.01" required value={newInvoice.amount} onChange={e => setNewInvoice({...newInvoice, amount: e.target.value})} placeholder="0.00" />
                      </div>
                      <div className="form-group">
                        <label>Description (Optional)</label>
                        <input type="text" value={newInvoice.description} onChange={e => setNewInvoice({...newInvoice, description: e.target.value})} placeholder="Custom text for PDF Invoice..." />
                      </div>
                    </>
                  )}

                  <div className="form-group">
                    <label>Date Received</label>
                    <input type="date" required value={newInvoice.date} onChange={e => setNewInvoice({...newInvoice, date: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <CustomSelect 
                      required
                      value={newInvoice.status} 
                      onChange={val => setNewInvoice({...newInvoice, status: val})} 
                      options={[
                        { value: 'PAID', label: 'PAID (Money in Bank)' },
                        { value: 'SENT', label: 'SENT (Awaiting Payment)' }
                      ]}
                    />
                  </div>
                  {project.project_type !== 'REVENUE_SHARE' && (
                    <div className="form-group">
                      <label>Payment Type</label>
                      <CustomSelect 
                        required
                        value={newInvoice.payment_type} 
                        onChange={val => setNewInvoice({...newInvoice, payment_type: val})} 
                        options={[
                          { value: 'ADVANCE', label: 'Advance Payment' },
                          { value: 'PARTIAL', label: 'Partial Payment' },
                          { value: 'FULL', label: 'Full Payment' },
                          { value: 'RENEWAL', label: 'Renewal / AMC' }
                        ]}
                      />
                    </div>
                  )}
                  {project.project_type !== 'REVENUE_SHARE' && newInvoice.payment_type === 'PARTIAL' && (
                    <>
                      <div className="form-group">
                        <label>Advance Paid Amount (₹)</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          value={newInvoice.advance_amount} 
                          onChange={e => setNewInvoice({...newInvoice, advance_amount: e.target.value})} 
                          placeholder="Auto-detected if left empty" 
                        />
                        <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem', display: 'block' }}>
                          Auto-detected from project advance if blank
                        </small>
                      </div>
                      <div className="form-group">
                        <label>Advance Paid Date</label>
                        <input 
                          type="date" 
                          value={newInvoice.advance_date} 
                          onChange={e => setNewInvoice({...newInvoice, advance_date: e.target.value})} 
                        />
                        <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem', display: 'block' }}>
                          Date advance was received
                        </small>
                      </div>
                      <div className="form-group">
                        <label>Remaining Balance Override (₹)</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          value={newInvoice.balance_amount} 
                          onChange={e => setNewInvoice({...newInvoice, balance_amount: e.target.value})} 
                          placeholder="Auto-calculated if left empty" 
                        />
                        <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem', display: 'block' }}>
                          Auto: Project Total minus Payments
                        </small>
                      </div>
                    </>
                  )}
                  {project.project_type !== 'REVENUE_SHARE' && newInvoice.payment_type === 'ADVANCE' && (
                    <div className="form-group">
                      <label>Remaining Balance Override (₹)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        value={newInvoice.balance_amount} 
                        onChange={e => setNewInvoice({...newInvoice, balance_amount: e.target.value})} 
                        placeholder="Auto: Project Total - Advance" 
                      />
                      <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem', display: 'block' }}>
                        Auto-calculated from project total if blank
                      </small>
                    </div>
                  )}
                  {newInvoice.status === 'PAID' && (
                    <div className="form-group">
                      <label>Deposit Bank Account</label>
                      <CustomSelect 
                        required
                        value={newInvoice.deposit_account} 
                        onChange={val => setNewInvoice({...newInvoice, deposit_account: val})} 
                        placeholder="Select Account..."
                        options={bankAccounts.map(b => ({ value: b.id, label: b.name }))}
                      />
                    </div>
                  )}
                </div>
                
                {project.project_type === 'REVENUE_SHARE' && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Calculated Total Earning (INR):</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--success)' }}>
                          {project.revenue_share_type === 'PROFIT_SHARE' 
                            ? formatCurrency((parseFloat(rsInputUsd || 0) * usdRate) * (parseFloat(project.revenue_share_percentage || 0) / 100))
                            : formatCurrency((parseInt(rsSeats || 0) * parseFloat((project.revenue_share_scopes?.find(s => s.id.toString() === selectedScope?.toString())?.earning) || 0) * usdRate))}
                        </div>
                      </div>
                      {project.revenue_share_type === 'PER_SEAT' && selectedScope && rsSeats > 0 && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Project Expenses (INR):</div>
                          <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--danger)' }}>
                            {formatCurrency(totalExpenses)}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Net Profit (Earning - Expenses):</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                            {formatCurrency((parseInt(rsSeats || 0) * parseFloat((project.revenue_share_scopes?.find(s => s.id.toString() === selectedScope?.toString())?.earning) || 0) * usdRate) - totalExpenses)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="premium-form-actions">
                  <button type="button" className="btn" onClick={resetInvoiceForm}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ background: 'var(--success)' }}>
                    {project.project_type === 'REVENUE_SHARE' ? (
                      <><CheckCircle size={18} /> Save Ledger Entry</>
                    ) : (
                      <><Download size={18} /> Save & Generate PDF</>
                    )}
                  </button>
                </div>
              </form>
            )
          )}

          {isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {invoicesPagination.currentData.map(inv => (
                <div key={inv.id} className="card" style={{ padding: '0.85rem', marginBottom: 0, border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-color)' }}>
                        INV-{inv.id.toString().padStart(4, '0')}
                      </span>
                      <span className={`badge ${inv.status === 'PAID' ? 'badge-success' : inv.status === 'SENT' ? 'badge-info' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>
                        {inv.status}
                      </span>
                    </div>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--success)' }}>
                      {formatCurrency(inv.amount)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>{inv.date}</span>
                      <span>•</span>
                      <span className="badge" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}>{inv.payment_type || 'PARTIAL'}</span>
                    </div>
                    {project.project_type !== 'REVENUE_SHARE' && (
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button 
                          onClick={() => handleDownloadPDF(inv, false)} 
                          disabled={downloadingInvId === inv.id}
                          className="btn" 
                          style={{ padding: '0.35rem 0.55rem', color: 'var(--success)', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '6px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Download size={14}/> PDF
                        </button>
                        <button 
                          onClick={() => handleDownloadPDF(inv, true)} 
                          disabled={downloadingInvId === inv.id}
                          className="btn" 
                          style={{ padding: '0.35rem 0.55rem', color: 'var(--primary-color)', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '6px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Share2 size={14}/> Share
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {invoicesPagination.currentData.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No payments or invoices logged for this project yet.
                </div>
              )}
            </div>
          ) : (
            <div className="table-container">
              <table className="responsive-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Invoice #</th>
                    <th>Type</th>
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
                      <td data-label="Type">
                        <span className="badge" style={{ 
                          background: inv.payment_type === 'ADVANCE' ? 'rgba(99, 102, 241, 0.15)' : 
                                      inv.payment_type === 'PARTIAL' ? 'rgba(56, 189, 248, 0.15)' : 
                                      inv.payment_type === 'FULL' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                          color: inv.payment_type === 'ADVANCE' ? '#818cf8' : 
                                 inv.payment_type === 'PARTIAL' ? '#38bdf8' : 
                                 inv.payment_type === 'FULL' ? '#4ade80' : '#facc15',
                          border: '1px solid currentColor',
                          fontSize: '0.7rem'
                        }}>
                          {inv.payment_type || 'PARTIAL'}
                        </span>
                      </td>
                      <td className="strong" data-label="Amount">{formatCurrency(inv.amount)}</td>
                      <td data-label="Status">
                        <span className={`badge ${inv.status === 'PAID' ? 'badge-success' : inv.status === 'SENT' ? 'badge-info' : 'badge-warning'}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td data-label="Actions">
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                          {project.project_type !== 'REVENUE_SHARE' && (
                            <>
                              <button 
                                onClick={() => handleDownloadPDF(inv, false)} 
                                disabled={downloadingInvId === inv.id}
                                title="Download PDF directly to Phone / Computer" 
                                className="btn" 
                                style={{ padding: '0.35rem 0.5rem', color: 'var(--success)', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Download size={15}/>
                              </button>
                              <button 
                                onClick={() => handleDownloadPDF(inv, true)} 
                                disabled={downloadingInvId === inv.id}
                                title="Share on Mobile (WhatsApp, Files, etc.)" 
                                className="btn" 
                                style={{ padding: '0.35rem 0.5rem', color: 'var(--primary-color)', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Share2 size={15}/>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {invoicesPagination.currentData.length === 0 && <tr><td colSpan="6">No payments or invoices logged for this project yet.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
          <Pagination {...invoicesPagination} />
        </div>
      )}

      {/* Revenue Share Scopes */}
      {(!isMobile || activeMobileTab === 'renewals') && project.project_type === 'REVENUE_SHARE' && project.revenue_share_type === 'PER_SEAT' && (
        <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--info)' }}>
          <div className="action-bar" style={{ background: 'transparent', border: 'none', padding: 0, marginBottom: '1rem', flexDirection: isMobile ? 'column' : 'row', gap: '0.5rem' }}>
            <div className="action-bar-left">
              <h3 className="card-title" style={{ margin: 0, fontSize: isMobile ? '1.05rem' : '1.25rem' }}>Revenue Share Scopes</h3>
            </div>
            <div className="action-bar-right" style={{ width: isMobile ? '100%' : 'auto' }}>
              <button className="btn btn-primary" onClick={() => { if (showScopeForm) { resetScopeForm(); } else { resetScopeForm(); setShowScopeForm(true); } }}>
                {showScopeForm ? <X size={18}/> : <><Plus size={18} /> Add Scope</>}
              </button>
            </div>
          </div>

          {showScopeForm && (
            isMobile ? (
              <div className="modal-overlay" onClick={resetScopeForm}>
                <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', width: '92%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{editingScope ? 'Edit Scope' : 'Add Scope'}</h3>
                    <button type="button" className="btn" onClick={resetScopeForm} style={{ padding: '0.25rem 0.5rem', background: 'transparent', border: 'none' }}><X size={20}/></button>
                  </div>
                  <form onSubmit={handleAddScope} className="premium-form">
                    <div className="premium-form-grid">
                      <div className="form-group">
                        <label>Scope / Course Name</label>
                        <input type="text" required placeholder="e.g. MBBS, Nursing" value={newScope.name} onChange={e => setNewScope({...newScope, name: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label>Flat Earning per Seat (USD)</label>
                        <input type="number" step="0.01" required placeholder="e.g. 500.00" value={newScope.earning} onChange={e => setNewScope({...newScope, earning: e.target.value})} />
                      </div>
                    </div>
                    <div className="premium-form-actions">
                      <button type="button" className="btn" onClick={resetScopeForm}>Cancel</button>
                      <button type="submit" className="btn btn-success">{editingScope ? 'Update' : 'Save'}</button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAddScope} className="premium-form">
                <div className="premium-form-grid">
                  <div className="form-group">
                    <label>Scope / Course Name</label>
                    <input type="text" required placeholder="e.g. MBBS, Nursing" value={newScope.name} onChange={e => setNewScope({...newScope, name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Flat Earning per Seat (USD)</label>
                    <input type="number" step="0.01" required placeholder="e.g. 500.00" value={newScope.earning} onChange={e => setNewScope({...newScope, earning: e.target.value})} />
                  </div>
                </div>
                <div className="premium-form-actions">
                  <button type="button" className="btn" onClick={resetScopeForm}>Cancel</button>
                  <button type="submit" className="btn btn-success">{editingScope ? 'Update' : 'Save'}</button>
                </div>
              </form>
            )
          )}

          <div className="table-container">
            <table className="responsive-table">
              <thead>
                <tr>
                  <th>Scope Name</th>
                  <th>Earning per Seat (USD)</th>
                  <th>Real-Time Earning (INR)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(project.revenue_share_scopes || []).map(s => (
                  <tr key={s.id}>
                    <td data-label="Scope Name" className="strong">{s.name}</td>
                    <td data-label="Earning (USD)" style={{ color: 'var(--success)', fontWeight: 'bold' }}>${parseFloat(s.earning).toFixed(2)}</td>
                    <td data-label="Earning (INR)" style={{ color: 'var(--info)', fontWeight: 'bold' }}>{formatCurrency(parseFloat(s.earning) * usdRate)}</td>
                    <td data-label="Actions">
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button className="btn" onClick={() => handleEditScope(s)} style={{ padding: '0.25rem', color: 'var(--primary-color)', background: 'transparent' }}><Edit2 size={16}/></button>
                        <button className="btn" onClick={() => handleDeleteScope(s.id)} style={{ padding: '0.25rem', color: 'var(--danger)', background: 'transparent' }}><Trash2 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!project.revenue_share_scopes || project.revenue_share_scopes.length === 0) && (
                  <tr><td colSpan="4" style={{textAlign:'center'}}>No scopes added. Please add courses like MBBS, Nursing.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Enhancements & Renewals */}
      {(!isMobile || activeMobileTab === 'renewals') && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(min(100%, 500px), 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          
          {/* Enhancements */}
          <div className="card">
            <div className="action-bar" style={{ background: 'transparent', border: 'none', padding: 0, marginBottom: '1rem', flexDirection: isMobile ? 'column' : 'row', gap: '0.5rem' }}>
              <div className="action-bar-left">
                <h3 className="card-title" style={{ margin: 0, fontSize: isMobile ? '1.05rem' : '1.25rem' }}>Enhancements</h3>
              </div>
              <div className="action-bar-right" style={{ width: isMobile ? '100%' : 'auto', display: 'flex', gap: '0.5rem' }}>
                <SearchBar value={enhancementSearch} onChange={setEnhancementSearch} placeholder="Search enhancements..." />
                <button className="btn btn-primary" onClick={() => { if (showEnhancementForm) { resetEnhancementForm(); } else { resetEnhancementForm(); setShowEnhancementForm(true); } }}>
                  {showEnhancementForm ? <X size={18}/> : <><Plus size={18} /> Add</>}
                </button>
              </div>
            </div>

            {showEnhancementForm && (
              isMobile ? (
                <div className="modal-overlay" onClick={resetEnhancementForm}>
                  <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', width: '92%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{editingEnhancement ? 'Edit Enhancement' : 'Add Enhancement'}</h3>
                      <button type="button" className="btn" onClick={resetEnhancementForm} style={{ padding: '0.25rem 0.5rem', background: 'transparent', border: 'none' }}><X size={20}/></button>
                    </div>
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
                  </div>
                </div>
              ) : (
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
              )
            )}

            {isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {enhancementsPagination.currentData.map(e => (
                  <div key={e.id} className="card" style={{ padding: '0.75rem', marginBottom: 0, border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{e.title}</span>
                      <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{formatCurrency(e.cost)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <span>Added: {e.date_added}</span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn" onClick={() => handleEditEnhancement(e)} style={{ padding: '0.25rem', color: 'var(--primary-color)', background: 'transparent' }}><Edit2 size={15}/></button>
                        <button className="btn" onClick={() => handleDeleteEnhancement(e.id)} style={{ padding: '0.25rem', color: 'var(--danger)', background: 'transparent' }}><Trash2 size={15}/></button>
                      </div>
                    </div>
                  </div>
                ))}
                {enhancementsPagination.currentData.length === 0 && (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>No enhancements logged.</div>
                )}
              </div>
            ) : (
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
              </div>
            )}
            <Pagination {...enhancementsPagination} />
          </div>

          {/* Yearly Renewals */}
          <div className="card">
            <div className="action-bar" style={{ background: 'transparent', border: 'none', padding: 0, marginBottom: '1rem', flexDirection: isMobile ? 'column' : 'row', gap: '0.5rem' }}>
              <div className="action-bar-left">
                <h3 className="card-title" style={{ margin: 0, fontSize: isMobile ? '1.05rem' : '1.25rem' }}>Yearly Renewals</h3>
              </div>
              <div className="action-bar-right" style={{ width: isMobile ? '100%' : 'auto', display: 'flex', gap: '0.5rem' }}>
                <SearchBar value={renewalSearch} onChange={setRenewalSearch} placeholder="Search renewals..." />
                <button className="btn btn-primary" onClick={() => { if (showRenewalForm) { resetRenewalForm(); } else { resetRenewalForm(); setShowRenewalForm(true); } }}>
                  {showRenewalForm ? <X size={18}/> : <><Plus size={18} /> Add</>}
                </button>
              </div>
            </div>

            {showRenewalForm && (
              isMobile ? (
                <div className="modal-overlay" onClick={resetRenewalForm}>
                  <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', width: '92%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{editingRenewal ? 'Edit Renewal' : 'Add Renewal'}</h3>
                      <button type="button" className="btn" onClick={resetRenewalForm} style={{ padding: '0.25rem 0.5rem', background: 'transparent', border: 'none' }}><X size={20}/></button>
                    </div>
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
                  </div>
                </div>
              ) : (
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
              )
            )}

            {isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {renewalsPagination.currentData.map(r => (
                  <div key={r.id} className="card" style={{ padding: '0.75rem', marginBottom: 0, border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.title}</span>
                      <span style={{ fontWeight: 700 }}>{formatCurrency(r.cost)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Due: {r.due_date}</span>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button 
                          onClick={() => toggleRenewalStatus(r.id, r.is_paid)}
                          className="btn" 
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', background: r.is_paid ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: r.is_paid ? 'var(--success)' : 'var(--warning)', border: 'none' }}
                        >
                          {r.is_paid ? <><CheckCircle size={12}/> Paid</> : <><Clock size={12}/> Unpaid</>}
                        </button>
                        <button className="btn" onClick={() => handleEditRenewal(r)} style={{ padding: '0.25rem', color: 'var(--primary-color)', background: 'transparent' }}><Edit2 size={15}/></button>
                        <button className="btn" onClick={() => handleDeleteRenewal(r.id)} style={{ padding: '0.25rem', color: 'var(--danger)', background: 'transparent' }}><Trash2 size={15}/></button>
                      </div>
                    </div>
                  </div>
                ))}
                {renewalsPagination.currentData.length === 0 && (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>No renewals logged.</div>
                )}
              </div>
            ) : (
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
              </div>
            )}
            <Pagination {...renewalsPagination} />
          </div>

        </div>
      )}

      {/* Expenses (Read-only) */}
      {(!isMobile || activeMobileTab === 'expenses') && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="action-bar" style={{ background: 'transparent', border: 'none', padding: 0, marginBottom: '1rem', flexDirection: isMobile ? 'column' : 'row', gap: '0.5rem' }}>
            <div className="action-bar-left">
              <h3 className="card-title" style={{ margin: 0, fontSize: isMobile ? '1.1rem' : '1.25rem' }}>Project Expenses</h3>
            </div>
            <div className="action-bar-right" style={{ width: isMobile ? '100%' : 'auto' }}>
              <SearchBar value={expenseSearch} onChange={setExpenseSearch} placeholder="Search expenses..." />
            </div>
          </div>

          {isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {expensesPagination.currentData.map(exp => (
                <div key={exp.id} className="card" style={{ padding: '0.8rem', marginBottom: 0, border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{exp.payee_description}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{exp.category} • {exp.date}</div>
                    </div>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--danger)' }}>
                      {formatCurrency(exp.amount)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>By: {exp.logged_by_name}</span>
                    <span className={`badge ${exp.status === 'VERIFIED' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.7rem' }}>
                      {exp.status}
                    </span>
                  </div>
                </div>
              ))}
              {expensesPagination.currentData.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No expenses logged for this project.</div>
              )}
            </div>
          ) : (
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
            </div>
          )}
          <Pagination {...expensesPagination} />
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;

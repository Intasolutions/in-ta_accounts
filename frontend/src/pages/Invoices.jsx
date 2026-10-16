import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import { FileText, Plus, Edit2, Trash2, Download, Share2, X, Copy, ExternalLink, Calendar, Info } from 'lucide-react';
import usePagination from '../hooks/usePagination';
import Pagination from '../components/Pagination';
import SearchBar from '../components/SearchBar';
import CustomSelect from '../components/CustomSelect';
import { downloadInvoicePdf } from '../utils/pdfDownloader';

const Invoices = () => {
  const toast = useToast();
  const confirm = useConfirm();
  const { user } = React.useContext(AuthContext);

  const [invoices, setInvoices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth <= 768 : false));

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [newInvoice, setNewInvoice] = useState({
    project: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    status: 'DRAFT',
    deposit_account: '',
    payment_type: 'PARTIAL',
    description: '',
    advance_amount: '',
    advance_date: '',
    balance_amount: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, projRes, bankRes] = await Promise.all([
        api.get('invoices/'),
        api.get('projects/'),
        api.get('bank-accounts/')
      ]);
      setInvoices(invRes.data);
      setProjects(projRes.data);
      setBankAccounts(bankRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddInvoice = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...newInvoice };
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

      if (editingInvoice) {
        await api.put(`invoices/${editingInvoice}/`, payload);
      } else {
        await api.post('invoices/', payload);
      }
      resetForm();
      fetchData();
      toast.success(editingInvoice ? "Invoice updated successfully!" : "Invoice generated and saved!");
    } catch (err) {
      console.error(err);
      toast.error('Failed to save invoice');
    }
  };

  const handleEditInvoice = (invoice) => {
    setEditingInvoice(invoice.id);
    setNewInvoice({
      project: invoice.project,
      amount: invoice.amount,
      date: invoice.date,
      status: invoice.status,
      deposit_account: invoice.deposit_account || '',
      payment_type: invoice.payment_type || 'PARTIAL',
      description: invoice.description || '',
      advance_amount: invoice.advance_amount || '',
      advance_date: invoice.advance_date || '',
      balance_amount: invoice.balance_amount || ''
    });
    setShowForm(true);
  };

  const handleDeleteInvoice = async (id) => {
    if (await confirm("Are you sure you want to delete this invoice?")) {
      try {
        await api.delete(`invoices/${id}/`);
        fetchData();
        toast.success("Invoice deleted successfully");
      } catch (err) {
        console.error(err);
        toast.error('Failed to delete invoice');
      }
    }
  };

  const resetForm = () => {
    setNewInvoice({ 
      project: '', 
      amount: '', 
      date: new Date().toISOString().split('T')[0], 
      status: 'DRAFT', 
      deposit_account: '', 
      payment_type: 'PARTIAL', 
      description: '',
      advance_amount: '',
      advance_date: '',
      balance_amount: ''
    });
    setEditingInvoice(null);
    setShowForm(false);
  };

  const handleDownloadPDF = async (inv, isShare = false) => {
    try {
      setDownloadingId(inv.id);
      await downloadInvoicePdf(inv.id, { client_name: inv.client_name, project_name: inv.project_name }, { share: isShare });
      if (!isShare) toast.success("Invoice PDF ready!");
    } catch (error) {
      console.error('Error with invoice PDF', error);
      toast.error('Failed to get PDF. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.client_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    inv.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.id.toString().includes(searchQuery)
  );

  const invoicesPagination = usePagination(filteredInvoices, 25);

  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Invoices</h1>
      </div>

      <div className="card">
        <div className="action-bar" style={{ background: 'transparent', border: 'none', padding: 0, marginBottom: '1rem' }}>
          <div className="action-bar-left">
            <h2 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} /> Invoice Register
            </h2>
          </div>
          <div className="action-bar-right">
            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by client, project or ID..." />
            {user?.role === 'ACCOUNTANT' && (
              <button className="btn btn-primary" onClick={() => { if (showForm) { resetForm(); } else { resetForm(); setShowForm(true); } }}>
                {showForm ? <X size={18} /> : <><Plus size={18} /> Generate Invoice</>}
              </button>
            )}
          </div>
        </div>

        {showForm && (
          <div className={isMobile ? "modal-overlay" : ""} onClick={isMobile ? resetForm : undefined}>
            <div className={isMobile ? "modal-content" : ""} onClick={isMobile ? (e => e.stopPropagation()) : undefined} style={isMobile ? { maxWidth: '600px', width: '92%', maxHeight: '90vh', overflowY: 'auto', padding: '1.25rem' } : {}}>
              <form onSubmit={handleAddInvoice} className="premium-form" style={isMobile ? { padding: 0, background: 'transparent', border: 'none', boxShadow: 'none' } : {}}>
                <div className="premium-form-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="premium-form-title">{editingInvoice ? 'Edit Invoice' : 'Generate New Invoice'}</h3>
                  {isMobile && (
                    <button type="button" className="btn" onClick={resetForm} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '0.25rem' }}><X size={20}/></button>
                  )}
                </div>
            <div className="premium-form-grid">
              <div className="form-group">
                <label>Select Project</label>
                <CustomSelect 
                  required
                  value={newInvoice.project} 
                  onChange={val => setNewInvoice({...newInvoice, project: val})} 
                  placeholder="Select Project..."
                  options={projects.map(p => ({ value: p.id, label: `${p.name} (${p.client_name})` }))}
                />
              </div>
              <div className="form-group">
                <label>Invoice Date</label>
                <input type="date" required value={newInvoice.date} onChange={e => setNewInvoice({...newInvoice, date: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Amount (Flat ₹)</label>
                <input type="number" step="0.01" required value={newInvoice.amount} onChange={e => setNewInvoice({...newInvoice, amount: e.target.value})} placeholder="0.00" />
              </div>
              <div className="form-group">
                <label>Description (Optional)</label>
                <input type="text" value={newInvoice.description} onChange={e => setNewInvoice({...newInvoice, description: e.target.value})} placeholder="Custom text for PDF Invoice..." />
              </div>
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
              {newInvoice.payment_type === 'PARTIAL' && (
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
                      Auto-calculated (Project Value - Paid) if blank
                    </small>
                  </div>
                </>
              )}
              {newInvoice.payment_type === 'ADVANCE' && (
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
              {editingInvoice && (
                <div className="form-group">
                  <label>Status</label>
                  <CustomSelect 
                    value={newInvoice.status} 
                    onChange={val => setNewInvoice({...newInvoice, status: val})} 
                    options={[
                      { value: 'DRAFT', label: 'DRAFT' },
                      { value: 'SENT', label: 'SENT' },
                      { value: 'PAID', label: 'PAID' },
                      { value: 'CANCELLED', label: 'CANCELLED' }
                    ]}
                  />
                </div>
              )}
              {newInvoice.status === 'PAID' && (
                <div className="form-group">
                  <label>Deposit To Account</label>
                  <CustomSelect 
                    required
                    value={newInvoice.deposit_account} 
                    onChange={val => setNewInvoice({...newInvoice, deposit_account: val})} 
                    placeholder="Select Account..."
                    options={bankAccounts.map(b => ({ value: b.id, label: `${b.name} (Balance: ${formatCurrency(b.current_balance)})` }))}
                  />
                </div>
              )}
            </div>
            <div className="premium-form-actions">
              <button type="button" className="btn" onClick={resetForm}>Cancel</button>
              <button type="submit" className="btn btn-success" style={{ background: 'var(--success)' }}>
                {editingInvoice ? 'Update Invoice' : <><Download size={18} /> Generate & Save</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

        <div className="table-container">
          {isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {invoicesPagination.currentData.map(inv => (
                <div key={inv.id} className="card" style={{ padding: '0.75rem', marginBottom: 0, borderRadius: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <div>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>INV-{inv.id.toString().padStart(4, '0')}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{inv.date}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                      <span className="badge" style={{ 
                        background: inv.payment_type === 'ADVANCE' ? 'rgba(99, 102, 241, 0.15)' : 
                                    inv.payment_type === 'PARTIAL' ? 'rgba(56, 189, 248, 0.15)' : 
                                    inv.payment_type === 'FULL' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                        color: inv.payment_type === 'ADVANCE' ? '#818cf8' : 
                               inv.payment_type === 'PARTIAL' ? '#38bdf8' : 
                               inv.payment_type === 'FULL' ? '#4ade80' : '#facc15',
                        fontSize: '0.68rem', padding: '0.15rem 0.4rem'
                      }}>
                        {inv.payment_type || 'PARTIAL'}
                      </span>
                      <span className={`badge ${inv.status === 'PAID' ? 'badge-success' : inv.status === 'SENT' ? 'badge-info' : 'badge-warning'}`} style={{ fontSize: '0.68rem', padding: '0.15rem 0.4rem' }}>
                        {inv.status}
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <strong style={{ color: 'var(--text-main)' }}>{inv.client_name}</strong> • {inv.project_name}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.45rem' }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: 'var(--success)' }}>
                      {formatCurrency(inv.amount)}
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      <button 
                        onClick={() => handleDownloadPDF(inv, false)} 
                        disabled={downloadingId === inv.id}
                        title="Download PDF" 
                        className="btn" 
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: '#fff', background: 'var(--primary-color)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Download size={14}/> PDF
                      </button>
                      <button 
                        onClick={() => handleDownloadPDF(inv, true)} 
                        disabled={downloadingId === inv.id}
                        title="Share PDF" 
                        className="btn" 
                        style={{ padding: '0.3rem 0.5rem', color: '#fff', background: '#25D366', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
                        <Share2 size={14}/>
                      </button>
                      {user?.role === 'ACCOUNTANT' && (
                        <>
                          <button className="btn" onClick={() => handleEditInvoice(inv)} style={{ padding: '0.3rem', color: 'var(--primary-color)', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '6px' }}><Edit2 size={14}/></button>
                          <button className="btn" onClick={() => handleDeleteInvoice(inv.id)} style={{ padding: '0.3rem', color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px' }}><Trash2 size={14}/></button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {invoicesPagination.currentData.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No invoices found.</div>}
            </div>
          ) : (
            <table className="responsive-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Invoice #</th>
                  <th>Client</th>
                  <th>Project</th>
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
                    <td data-label="Client">{inv.client_name}</td>
                    <td data-label="Project">{inv.project_name}</td>
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
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleDownloadPDF(inv, false)} 
                          disabled={downloadingId === inv.id}
                          title="Download PDF directly to Phone / Computer" 
                          className="btn" 
                          style={{ padding: '0.35rem 0.5rem', color: 'var(--success)', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Download size={15}/>
                        </button>
                        <button 
                          onClick={() => handleDownloadPDF(inv, true)} 
                          disabled={downloadingId === inv.id}
                          title="Share / Send directly from Phone (WhatsApp, Files, etc.)" 
                          className="btn" 
                          style={{ padding: '0.35rem 0.5rem', color: 'var(--primary-color)', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Share2 size={15}/>
                        </button>
                        {user?.role === 'ACCOUNTANT' && (
                          <>
                            <button className="btn" onClick={() => handleEditInvoice(inv)} style={{ padding: '0.25rem', color: 'var(--primary-color)', background: 'transparent' }}><Edit2 size={16}/></button>
                            <button className="btn" onClick={() => handleDeleteInvoice(inv.id)} style={{ padding: '0.25rem', color: 'var(--danger)', background: 'transparent' }}><Trash2 size={16}/></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {invoicesPagination.currentData.length === 0 && <tr><td colSpan="8" style={{textAlign: 'center', padding: '2rem'}}>No invoices generated yet.</td></tr>}
              </tbody>
            </table>
          )}
          <Pagination {...invoicesPagination} />
        </div>
      </div>
    </div>
  );
};

export default Invoices;

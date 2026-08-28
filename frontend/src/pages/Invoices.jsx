import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import api from '../api';
import { FileText, Plus, Edit2, Trash2, Download, X, Copy, ExternalLink, Calendar } from 'lucide-react';
import usePagination from '../hooks/usePagination';
import Pagination from '../components/Pagination';
import SearchBar from '../components/SearchBar';
import CustomSelect from '../components/CustomSelect';

const Invoices = () => {
  const toast = useToast();
  const confirm = useConfirm();

  const [invoices, setInvoices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newInvoice, setNewInvoice] = useState({
    project: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    status: 'DRAFT',
    deposit_account: ''
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
        payload.deposit_account = null; // Only link account if PAID
      } else if (!payload.deposit_account) {
        toast.error("Please select a deposit account for PAID invoices.");
        return;
      }
      // If empty string, make it null
      if (payload.deposit_account === '') payload.deposit_account = null;

      if (editingInvoice) {
        await api.put(`invoices/${editingInvoice}/`, payload);
      } else {
        await api.post('invoices/', payload);
      }
      resetForm();
      fetchData();
      if (!editingInvoice) toast.success("Invoice generated and saved as Draft!");
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
      deposit_account: invoice.deposit_account || ''
    });
    setShowForm(true);
  };

  const handleDeleteInvoice = async (id) => {
    if (await confirm("Are you sure you want to delete this invoice?")) {
      try {
        await api.delete(`invoices/${id}/`);
        fetchData();
      } catch (err) {
        console.error(err);
        toast.error('Failed to delete invoice');
      }
    }
  };

  const resetForm = () => {
    setNewInvoice({ project: '', amount: '', date: new Date().toISOString().split('T')[0], status: 'DRAFT', deposit_account: '', payment_type: 'PARTIAL' });
    setEditingInvoice(null);
    setEditingInvoice(null);
    setShowForm(false);
  };

  const handleDownloadPDF = async (invoiceId) => {
    try {
      const response = await api.get(`invoices/${invoiceId}/download_pdf/`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      window.open(url, '_blank');
      // Cleanup slightly delayed to allow browser to open it
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('Error downloading PDF', error);
      toast.error('Failed to generate PDF. Please try again.');
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
            <button className="btn btn-primary" onClick={() => { if (showForm) { resetForm(); } else { resetForm(); setShowForm(true); } }}>
              {showForm ? <X size={18} /> : <><Plus size={18} /> Generate Invoice</>}
            </button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleAddInvoice} className="premium-form">
            <div className="premium-form-header">
              <h3 className="premium-form-title">{editingInvoice ? 'Edit Invoice' : 'Generate New Invoice'}</h3>
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
        )}

        <div className="table-container">
          <table className="responsive-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Invoice #</th>
                <th>Client</th>
                <th>Project</th>
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
                  <td className="strong" data-label="Amount">{formatCurrency(inv.amount)}</td>
                  <td data-label="Status">
                    <span className={`badge ${inv.status === 'PAID' ? 'badge-success' : inv.status === 'SENT' ? 'badge-info' : 'badge-warning'}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td data-label="Actions">
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleDownloadPDF(inv.id)} title="Download PDF" className="btn" style={{ padding: '0.25rem', color: 'var(--success)', background: 'transparent', display: 'flex', alignItems: 'center' }}>
                        <FileText size={16}/>
                      </button>
                      <button className="btn" onClick={() => handleEditInvoice(inv)} style={{ padding: '0.25rem', color: 'var(--primary-color)', background: 'transparent' }}><Edit2 size={16}/></button>
                      <button className="btn" onClick={() => handleDeleteInvoice(inv.id)} style={{ padding: '0.25rem', color: 'var(--danger)', background: 'transparent' }}><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {invoicesPagination.currentData.length === 0 && <tr><td colSpan="7" style={{textAlign: 'center', padding: '2rem'}}>No invoices generated yet.</td></tr>}
            </tbody>
          </table>
          <Pagination {...invoicesPagination} />
        </div>
      </div>
    </div>
  );
};

export default Invoices;

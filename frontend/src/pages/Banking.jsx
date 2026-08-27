import React, { useState, useEffect } from 'react';
import api from '../api';
import { Landmark, Plus, Share2, Wallet, Edit2, Trash2, X, ArrowRightLeft, List } from 'lucide-react';
import usePagination from '../hooks/usePagination';
import Pagination from '../components/Pagination';
import SearchBar from '../components/SearchBar';
import CustomSelect from '../components/CustomSelect';

const Banking = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [newAccount, setNewAccount] = useState({
    name: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    upi_id: '',
    current_balance: '0'
  });

  const [showTransferForm, setShowTransferForm] = useState(false);
  const [transferData, setTransferData] = useState({ from_account: '', to_account_id: '', amount: '' });
  const [viewingLedgerFor, setViewingLedgerFor] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [transactionSearch, setTransactionSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('bank-accounts/');
      setAccounts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    try {
      if (editingAccount) {
        await api.put(`bank-accounts/${editingAccount}/`, newAccount);
      } else {
        await api.post('bank-accounts/', newAccount);
      }
      resetForm();
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to save account');
    }
  };

  const handleEditAccount = (account) => {
    setEditingAccount(account.id);
    setNewAccount({
      name: account.name,
      bank_name: account.bank_name || '',
      account_number: account.account_number || '',
      ifsc_code: account.ifsc_code || '',
      upi_id: account.upi_id || '',
      current_balance: account.current_balance
    });
    setShowForm(true);
  };

  const handleDeleteAccount = async (id) => {
    if (window.confirm("Are you sure you want to delete this account? This will orphan any linked transactions.")) {
      try {
        await api.delete(`bank-accounts/${id}/`);
        fetchData();
      } catch (err) {
        console.error(err);
        alert('Failed to delete account');
      }
    }
  };

  const resetForm = () => {
    setNewAccount({ name: '', bank_name: '', account_number: '', ifsc_code: '', upi_id: '', current_balance: '0' });
    setEditingAccount(null);
    setShowForm(false);
  };

  const handleShare = (account) => {
    const text = `*Bank Details for ${account.name}*\n\nBank: ${account.bank_name || 'N/A'}\nAccount Number: ${account.account_number || 'N/A'}\nIFSC Code: ${account.ifsc_code || 'N/A'}\nUPI ID: ${account.upi_id || 'N/A'}`;
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (transferData.from_account === transferData.to_account_id) {
      alert("Cannot transfer to the same account");
      return;
    }
    try {
      await api.post(`bank-accounts/${transferData.from_account}/transfer/`, {
        to_account_id: transferData.to_account_id,
        amount: transferData.amount
      });
      alert('Transfer successful');
      setShowTransferForm(false);
      setTransferData({from_account: '', to_account_id: '', amount: ''});
      fetchData();
      if (viewingLedgerFor) handleViewLedger(viewingLedgerFor);
    } catch(err) {
      console.error(err);
      alert('Transfer failed');
    }
  };

  const handleViewLedger = async (accountId) => {
    if (viewingLedgerFor === accountId) {
      setViewingLedgerFor(null);
      return;
    }
    setViewingLedgerFor(accountId);
    try {
      const res = await api.get(`transactions/?bank_account=${accountId}`);
      setTransactions(res.data);
    } catch(err) {
      console.error(err);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
  };

  const filteredTransactions = transactions.filter(t => 
    t.description.toLowerCase().includes(transactionSearch.toLowerCase()) || 
    t.transaction_type.toLowerCase().includes(transactionSearch.toLowerCase())
  );

  const transactionsPagination = usePagination(filteredTransactions, 25);

  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Banking & Cash Management</h1>
      </div>

      <div className="action-bar" style={{ background: 'transparent', border: 'none', padding: 0 }}>
        <div className="action-bar-left">
          {/* Optionally empty or title */}
        </div>
        <div className="action-bar-right">
          <button className="btn" onClick={() => {setShowTransferForm(!showTransferForm); setShowForm(false);}} style={{ background: 'var(--info)', color: '#fff' }}>
            <ArrowRightLeft size={18} /> Internal Transfer
          </button>
          <button className="btn btn-primary" onClick={() => {
            const willShow = !showForm;
            resetForm();
            setShowForm(willShow);
            setShowTransferForm(false);
          }}>
            {showForm ? <X size={18} /> : <><Plus size={18} /> Add Account</>}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSaveAccount} className="premium-form">
          <div className="premium-form-header">
            <h3 className="premium-form-title">{editingAccount ? 'Edit Account' : 'Add New Bank Account / Cash Drawer'}</h3>
          </div>
          <div className="premium-form-grid">
            <div className="form-group">
              <label>Alias (e.g. Main Axis, Cash Box)</label>
              <input type="text" required value={newAccount.name} onChange={e => setNewAccount({...newAccount, name: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Bank Name</label>
              <input type="text" value={newAccount.bank_name} onChange={e => setNewAccount({...newAccount, bank_name: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Account Number</label>
              <input type="text" value={newAccount.account_number} onChange={e => setNewAccount({...newAccount, account_number: e.target.value})} />
            </div>
            <div className="form-group">
              <label>IFSC Code</label>
              <input type="text" value={newAccount.ifsc_code} onChange={e => setNewAccount({...newAccount, ifsc_code: e.target.value})} />
            </div>
            <div className="form-group">
              <label>UPI ID</label>
              <input type="text" value={newAccount.upi_id} onChange={e => setNewAccount({...newAccount, upi_id: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Initial/Current Balance (₹)</label>
              <input type="number" step="0.01" required value={newAccount.current_balance} onChange={e => setNewAccount({...newAccount, current_balance: e.target.value})} />
            </div>
          </div>
          <div className="premium-form-actions">
            <button type="button" className="btn" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editingAccount ? 'Update Account' : 'Save Account'}</button>
          </div>
        </form>
      )}

      {showTransferForm && (
        <form onSubmit={handleTransfer} className="premium-form" style={{ borderLeft: '4px solid var(--info)' }}>
          <div className="premium-form-header">
            <h3 className="premium-form-title" style={{ color: 'var(--info)' }}>Internal Transfer</h3>
          </div>
          <div className="premium-form-grid">
            <div className="form-group">
              <label>From Account</label>
              <CustomSelect 
                required
                value={transferData.from_account} 
                onChange={val => setTransferData({...transferData, from_account: val})} 
                placeholder="Select Account..."
                options={accounts.map(b => ({ value: b.id, label: `${b.name} (${formatCurrency(b.current_balance)})` }))}
              />
            </div>
            <div className="form-group">
              <label>To Account</label>
              <CustomSelect 
                required
                value={transferData.to_account_id} 
                onChange={val => setTransferData({...transferData, to_account_id: val})} 
                placeholder="Select Account..."
                options={accounts.map(b => ({ value: b.id, label: `${b.name} (${formatCurrency(b.current_balance)})` }))}
              />
            </div>
            <div className="form-group">
              <label>Amount (₹)</label>
              <input type="number" step="0.01" required value={transferData.amount} onChange={e => setTransferData({...transferData, amount: e.target.value})} placeholder="0.00" />
            </div>
          </div>
          <div className="premium-form-actions">
            <button type="button" className="btn" onClick={() => setShowTransferForm(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ background: 'var(--info)' }}>Transfer Funds</button>
          </div>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {accounts.map(acc => (
          <div key={acc.id} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: 'var(--primary-color)' }}></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem' }}>
                  <Landmark size={20} className="text-primary" /> {acc.name}
                </h3>
                {acc.bank_name && <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>{acc.bank_name}</p>}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn" onClick={() => handleEditAccount(acc)} style={{ padding: '0.25rem', color: 'var(--text-muted)', background: 'transparent' }}><Edit2 size={16}/></button>
                <button className="btn" onClick={() => handleDeleteAccount(acc.id)} style={{ padding: '0.25rem', color: 'var(--danger)', background: 'transparent' }}><Trash2 size={16}/></button>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem', background: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: '0.5rem' }}>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Live Balance</p>
              <h2 style={{ margin: 0, fontSize: '2rem', color: 'var(--text-main)' }}>{formatCurrency(acc.current_balance)}</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
              <div>
                <p style={{ margin: '0 0 0.25rem 0', color: 'var(--text-muted)' }}>Account Number</p>
                <p style={{ margin: 0, fontWeight: '600' }}>{acc.account_number || 'N/A'}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 0.25rem 0', color: 'var(--text-muted)' }}>IFSC</p>
                <p style={{ margin: 0, fontWeight: '600' }}>{acc.ifsc_code || 'N/A'}</p>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <p style={{ margin: '0 0 0.25rem 0', color: 'var(--text-muted)' }}>UPI ID</p>
                <p style={{ margin: 0, fontWeight: '600' }}>{acc.upi_id || 'N/A'}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
              <button onClick={() => handleShare(acc)} className="btn btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '0.5rem', background: '#25D366', color: '#fff', border: 'none' }}>
                <Share2 size={18} /> Share Details
              </button>
              <button onClick={() => handleViewLedger(acc.id)} className="btn" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '0.5rem', background: 'var(--surface-bg)', color: 'var(--text-main)', border: '1px solid var(--surface-border)' }}>
                <List size={18} /> {viewingLedgerFor === acc.id ? 'Hide Ledger' : 'View Ledger'}
              </button>
            </div>

            {viewingLedgerFor === acc.id && (
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--surface-border)', paddingTop: '1rem' }}>
                <div className="action-bar" style={{ background: 'transparent', border: 'none', padding: 0, marginBottom: '1rem' }}>
                  <div className="action-bar-left">
                    <h4 style={{ margin: 0, color: 'var(--text-muted)' }}>Transaction History</h4>
                  </div>
                  <div className="action-bar-right">
                    <SearchBar value={transactionSearch} onChange={setTransactionSearch} placeholder="Search transactions..." />
                  </div>
                </div>

                {transactions.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No transactions found for this account.</p>
                ) : (
                  <>
                    <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {transactionsPagination.currentData.map(t => (
                        <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '0.25rem' }}>
                          <div>
                            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '600' }}>{t.transaction_type.replace('_', ' ')}</p>
                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.description}</p>
                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(t.date).toLocaleString()}</p>
                          </div>
                          <div style={{ fontWeight: 'bold', color: parseFloat(t.amount) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                            {parseFloat(t.amount) >= 0 ? '+' : ''}{formatCurrency(t.amount)}
                          </div>
                        </div>
                      ))}
                    </div>
                    <Pagination {...transactionsPagination} />
                  </>
                )}
            </div>
            )}
          </div>
        ))}
        {accounts.length === 0 && (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
            <Wallet size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0' }}>No Accounts Setup</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>Click 'Add Account' to set up your first bank account or cash drawer.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Banking;

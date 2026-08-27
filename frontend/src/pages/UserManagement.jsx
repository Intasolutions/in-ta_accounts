import React, { useState, useEffect } from 'react';
import api from '../api';
import { Users, Plus, Shield, User as UserIcon } from 'lucide-react';
import usePagination from '../hooks/usePagination';
import Pagination from '../components/Pagination';
import SearchBar from '../components/SearchBar';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'OWNER'
  });
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('users/');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      await api.post('users/', formData);
      setShowForm(false);
      setFormData({ username: '', email: '', password: '', role: 'OWNER' });
      fetchUsers();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to create user. Please ensure the username is unique.');
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const usersPagination = usePagination(filteredUsers, 25);

  if (loading) return <div style={{ padding: '2rem' }}>Loading users...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">User Management</h1>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={18} /> Add New User
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Create User</h3>
            {error && <div style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>{error}</div>}
            
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: '1 1 200px' }}>
                <label>Username</label>
                <input type="text" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
              </div>
              <div className="form-group" style={{ flex: '1 1 200px' }}>
                <label>Email Address</label>
                <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="form-group" style={{ flex: '1 1 200px' }}>
                <label>Password</label>
                <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <div className="form-group" style={{ flex: '1 1 200px' }}>
                <label>Role</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="OWNER">Owner</option>
                  <option value="ACCOUNTANT">Accountant</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="button" className="btn" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create User</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="action-bar" style={{ background: 'transparent', border: 'none', padding: 0, marginBottom: '1rem' }}>
          <div className="action-bar-left">
            <h3 className="card-title" style={{ margin: 0 }}>System Users</h3>
          </div>
          <div className="action-bar-right">
            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search users by name, email or role..." />
          </div>
        </div>

        <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--surface-border)', textAlign: 'left' }}>
              <th style={{ padding: '1rem' }}>User</th>
              <th style={{ padding: '1rem' }}>Email</th>
              <th style={{ padding: '1rem' }}>Role</th>
              <th style={{ padding: '1rem' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {usersPagination.currentData.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }} data-label="User">
                  <div style={{ background: 'var(--surface-border)', padding: '0.5rem', borderRadius: '50%' }}>
                    <UserIcon size={20} className="text-muted" />
                  </div>
                  <div>
                    <div style={{ fontWeight: '600' }}>{u.username}</div>
                  </div>
                </td>
                <td style={{ padding: '1rem' }} data-label="Email">{u.email}</td>
                <td style={{ padding: '1rem' }} data-label="Role">
                  <span style={{ 
                    background: u.role === 'ACCOUNTANT' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    color: u.role === 'ACCOUNTANT' ? '#3b82f6' : '#10b981',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '1rem',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    {u.role === 'ACCOUNTANT' ? <Shield size={12} /> : <UserIcon size={12} />}
                    {u.role}
                  </span>
                </td>
                <td style={{ padding: '1rem' }} data-label="Status">
                  <span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>Active</span>
                </td>
              </tr>
            ))}
            {usersPagination.currentData.length === 0 && <tr><td colSpan="4" style={{textAlign: 'center', padding: '2rem'}}>No users found.</td></tr>}
          </tbody>
        </table>
        <Pagination {...usersPagination} />
      </div>
    </div>
  );
};

export default UserManagement;

import React, { useState, useEffect, useContext } from 'react';
import { Users as UsersIcon, Plus, Edit2, Trash2, X, Shield } from 'lucide-react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import CustomSelect from '../components/CustomSelect';

const Users = () => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'ACCOUNTANT'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('users/');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (usr) => {
    setEditingUser(usr.id);
    setNewUser({
      username: usr.username,
      email: usr.email,
      password: '', // Leave blank unless changing
      first_name: usr.first_name,
      last_name: usr.last_name,
      role: usr.role || 'ACCOUNTANT'
    });
    setShowUserForm(true);
  };

  const handleDeleteUser = async (id) => {
    if (id === user.id) {
      alert("You cannot delete yourself!");
      return;
    }
    if (window.confirm("Are you sure you want to delete this user? They will lose all access.")) {
      try {
        await api.delete(`users/${id}/`);
        fetchUsers();
      } catch (err) {
        console.error(err);
        alert('Failed to delete user');
      }
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...newUser };
      if (editingUser && !payload.password) {
        delete payload.password; // Don't send empty password if not changing
      }
      
      if (editingUser) {
        await api.put(`users/${editingUser}/`, payload);
      } else {
        await api.post('users/', payload);
      }
      
      setShowUserForm(false);
      setEditingUser(null);
      setNewUser({ username: '', email: '', password: '', first_name: '', last_name: '', role: 'ACCOUNTANT' });
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert('Failed to save user. Make sure the username/email is unique.');
    }
  };

  if (!user || user.role !== 'OWNER' && user.role !== 'SUPER_ADMIN') {
    return <div style={{ padding: '2rem' }}>Access Denied. Only Owners can manage users.</div>;
  }

  if (loading) return <div style={{ padding: '2rem' }}>Loading Users...</div>;

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title gradient-text" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <UsersIcon size={28} color="var(--primary-color)" /> User Management
          </h1>
          <p className="text-muted" style={{ margin: 0 }}>Manage team members, roles, and system access.</p>
        </div>
        
        <button 
          className="btn btn-primary" 
          onClick={() => {
            if (showUserForm) {
              setShowUserForm(false);
              setEditingUser(null);
              setNewUser({ username: '', email: '', password: '', first_name: '', last_name: '', role: 'ACCOUNTANT' });
            } else {
              setShowUserForm(true);
            }
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          {showUserForm ? <X size={18} /> : <><Plus size={18} /> {editingUser ? 'Edit User' : 'Add User'}</>}
        </button>
      </div>

      {showUserForm && (
        <div className="card" style={{ borderTop: '4px solid var(--primary-color)', marginBottom: '2rem' }}>
          <h3 className="premium-form-title" style={{ marginBottom: '1.5rem' }}>
            {editingUser ? 'Edit Team Member' : 'Add New Team Member'}
          </h3>
          <form onSubmit={handleSaveUser}>
            <div className="form-grid">
              <div className="form-group">
                <label>Username</label>
                <input type="text" required value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} placeholder="e.g. jdoe" />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="e.g. john@example.com" />
              </div>
              <div className="form-group">
                <label>First Name</label>
                <input type="text" value={newUser.first_name} onChange={e => setNewUser({...newUser, first_name: e.target.value})} placeholder="John" />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input type="text" value={newUser.last_name} onChange={e => setNewUser({...newUser, last_name: e.target.value})} placeholder="Doe" />
              </div>
              <div className="form-group">
                <label>System Role</label>
                <CustomSelect 
                  value={newUser.role} 
                  onChange={val => setNewUser({...newUser, role: val})} 
                  options={[
                    { value: 'ACCOUNTANT', label: 'Accountant' },
                    { value: 'OWNER', label: 'Owner (Full Access)' }
                  ]}
                />
              </div>
              <div className="form-group">
                <label>{editingUser ? 'New Password (leave blank to keep current)' : 'Password'}</label>
                <input type="password" required={!editingUser} value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="Secure password" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => {
                setShowUserForm(false);
                setEditingUser(null);
                setNewUser({ username: '', email: '', password: '', first_name: '', last_name: '', role: 'ACCOUNTANT' });
              }}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save User</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table className="responsive-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td className="strong" data-label="Username">@{u.username}</td>
                  <td data-label="Name">{u.first_name} {u.last_name}</td>
                  <td data-label="Email">{u.email}</td>
                  <td data-label="Role">
                    <span className="badge" style={{ 
                      background: u.role === 'OWNER' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: u.role === 'OWNER' ? 'var(--primary-color)' : 'var(--success)'
                    }}>
                      {u.role === 'OWNER' && <Shield size={12} style={{ marginRight: '4px' }} />}
                      {u.role}
                    </span>
                  </td>
                  <td data-label="Status">
                    <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>Active</span>
                  </td>
                  <td data-label="Actions" style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="btn" onClick={() => handleEditUser(u)} style={{ padding: '0.25rem', color: 'var(--primary-color)', background: 'transparent' }} title="Edit">
                        <Edit2 size={16} />
                      </button>
                      {u.id !== user.id && (
                        <button className="btn" onClick={() => handleDeleteUser(u.id)} style={{ padding: '0.25rem', color: 'var(--danger)', background: 'transparent' }} title="Delete">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Users;

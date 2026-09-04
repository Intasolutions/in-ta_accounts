import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api';
import { Plus, Building2, Briefcase, Edit2, Trash2, X } from 'lucide-react';
import usePagination from '../hooks/usePagination';
import Pagination from '../components/Pagination';
import SearchBar from '../components/SearchBar';
import CustomSelect from '../components/CustomSelect';

const Projects = () => {
  const toast = useToast();
  const confirm = useConfirm();
  const { user } = React.useContext(AuthContext);

  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('projects');

  const [clientSearch, setClientSearch] = useState('');
  const [projectSearch, setProjectSearch] = useState('');

  const [showClientForm, setShowClientForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [newClient, setNewClient] = useState({
    name: '',
    company_name: '',
    phone_number: '',
    address: ''
  });
  
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [newProject, setNewProject] = useState({
    name: '',
    client: '',
    project_type: 'FIXED',
    total_value: '',
    amc_percentage: '15',
    delivery_date: '',
    revenue_share_type: 'PROFIT_SHARE',
    revenue_share_percentage: '',
    per_seat_cost: '',
    status: 'ACTIVE'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [clientsRes, projectsRes] = await Promise.all([
        api.get('clients/'),
        api.get('projects/')
      ]);
      setClients(clientsRes.data);
      setProjects(projectsRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await api.put(`clients/${editingClient}/`, newClient);
      } else {
        await api.post('clients/', newClient);
      }
      resetClientForm();
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save client');
    }
  };

  const handleEditClient = (client) => {
    setEditingClient(client.id);
    setNewClient({
      name: client.name,
      company_name: client.company_name || '',
      phone_number: client.phone_number || '',
      address: client.address || ''
    });
    setShowClientForm(true);
  };

  const handleDeleteClient = async (id) => {
    if (await confirm("Are you sure you want to delete this client?")) {
      try {
        await api.delete(`clients/${id}/`);
        fetchData();
      } catch (err) {
        console.error(err);
        toast.error('Failed to delete client');
      }
    }
  };

  const resetClientForm = () => {
    setNewClient({ name: '', company_name: '', phone_number: '', address: '' });
    setEditingClient(null);
    setShowClientForm(false);
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...newProject };
      if (!payload.delivery_date) delete payload.delivery_date;
      if (payload.amc_percentage === '') payload.amc_percentage = null;
      if (!payload.total_value) payload.total_value = '0.00';
      
      if (payload.project_type !== 'REVENUE_SHARE') {
        delete payload.revenue_share_type;
        delete payload.revenue_share_percentage;
        delete payload.per_seat_cost;
      }
      if (payload.revenue_share_type === 'PROFIT_SHARE') {
        delete payload.per_seat_cost;
      }
      
      if (editingProject) {
        await api.put(`projects/${editingProject}/`, payload);
      } else {
        await api.post('projects/', payload);
      }
      resetProjectForm();
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save project');
    }
  };

  const handleEditProject = (project) => {
    setEditingProject(project.id);
    setNewProject({
      name: project.name,
      client: project.client,
      project_type: project.project_type,
      total_value: project.total_value,
      amc_percentage: project.amc_percentage || '15',
      delivery_date: project.delivery_date || '',
      revenue_share_type: project.revenue_share_type || 'PROFIT_SHARE',
      revenue_share_percentage: project.revenue_share_percentage || '',
      per_seat_cost: project.per_seat_cost || '',
      status: project.status || 'ACTIVE'
    });
    setShowProjectForm(true);
  };

  const handleDeleteProject = async (id) => {
    if (await confirm("Are you sure you want to delete this project?")) {
      try {
        await api.delete(`projects/${id}/`);
        fetchData();
      } catch (err) {
        console.error(err);
        toast.error('Failed to delete project');
      }
    }
  };

  const resetProjectForm = () => {
    setNewProject({ name: '', client: '', project_type: 'FIXED', total_value: '', amc_percentage: '15', delivery_date: '', revenue_share_type: 'PROFIT_SHARE', revenue_share_percentage: '', per_seat_cost: '', status: 'ACTIVE' });
    setEditingProject(null);
    setShowProjectForm(false);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) || 
    (c.company_name && c.company_name.toLowerCase().includes(clientSearch.toLowerCase()))
  );

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(projectSearch.toLowerCase()) || 
    (p.client_name && p.client_name.toLowerCase().includes(projectSearch.toLowerCase()))
  );

  const clientsPagination = usePagination(filteredClients, 25);
  const projectsPagination = usePagination(filteredProjects, 25);

  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>;

  const tabStyle = {
    padding: '0.75rem 1.5rem',
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    outline: 'none'
  };

  const activeTabStyle = {
    ...tabStyle,
    color: 'var(--primary-color)',
    borderBottom: '2px solid var(--primary-color)'
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <h1 className="page-title">Projects & Clients</h1>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)' }}>
        <button 
          onClick={() => setActiveTab('projects')}
          style={activeTab === 'projects' ? activeTabStyle : tabStyle}
        >
          <Briefcase size={18} /> Projects
        </button>
        <button 
          onClick={() => setActiveTab('clients')}
          style={activeTab === 'clients' ? activeTabStyle : tabStyle}
        >
          <Building2 size={18} /> Clients
        </button>
      </div>

      <div style={{ width: '100%' }}>
        
        {/* Clients Tab */}
        {activeTab === 'clients' && (
          <div className="card">
            <div className="action-bar">
              <div className="action-bar-left">
                <h2 className="card-title" style={{ margin: 0 }}>Client Directory</h2>
              </div>
              <div className="action-bar-right">
                <SearchBar value={clientSearch} onChange={setClientSearch} placeholder="Search clients by name or company..." />
                {user?.role === 'ACCOUNTANT' && (
                  <button className="btn btn-primary" onClick={() => { if (showClientForm) { resetClientForm(); } else { resetClientForm(); setShowClientForm(true); } }}>
                    {showClientForm ? <X size={18} /> : <><Plus size={18} /> New Client</>}
                  </button>
                )}
              </div>
            </div>

            {showClientForm && (
              <form onSubmit={handleAddClient} className="premium-form">
                <div className="premium-form-header">
                  <h3 className="premium-form-title">{editingClient ? 'Edit Client Details' : 'Add New Client'}</h3>
                </div>
                <div className="premium-form-grid">
                  <div className="form-group">
                    <label>Contact Name</label>
                    <input type="text" required value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} placeholder="e.g. John Doe" />
                  </div>
                  <div className="form-group">
                    <label>Company Name</label>
                    <input type="text" value={newClient.company_name} onChange={e => setNewClient({...newClient, company_name: e.target.value})} placeholder="e.g. Acme Corp" />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input type="text" value={newClient.phone_number} onChange={e => setNewClient({...newClient, phone_number: e.target.value})} placeholder="e.g. +91 9876543210" />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Address</label>
                    <textarea value={newClient.address} onChange={e => setNewClient({...newClient, address: e.target.value})} placeholder="e.g. 123 Business Rd..." rows="2" />
                  </div>
                </div>
                <div className="premium-form-actions">
                  <button type="button" className="btn" onClick={() => setShowClientForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingClient ? 'Update Client' : 'Save Client'}</button>
                </div>
              </form>
            )}

            <div className="table-container">
              <table className="responsive-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Contact Name</th>
                    <th>Company</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Created</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clientsPagination.currentData.map(c => (
                    <tr key={c.id}>
                      <td className="strong" data-label="Contact Name">{c.name}</td>
                      <td data-label="Company">{c.company_name || '-'}</td>
                      <td data-label="Phone">{c.phone_number || '-'}</td>
                      <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={c.address} data-label="Address">{c.address || '-'}</td>
                      <td data-label="Created">{new Date(c.created_at).toLocaleDateString()}</td>
                      <td data-label="Actions">
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          {user?.role === 'ACCOUNTANT' && (
                            <>
                              <button className="btn" onClick={() => handleEditClient(c)} style={{ padding: '0.5rem', color: 'var(--primary-color)', background: 'rgba(59, 130, 246, 0.1)' }} title="Edit"><Edit2 size={16}/></button>
                              <button className="btn" onClick={() => handleDeleteClient(c.id)} style={{ padding: '0.5rem', color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)' }} title="Delete"><Trash2 size={16}/></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {clientsPagination.currentData.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No clients found.</td></tr>}
                </tbody>
              </table>
              <Pagination {...clientsPagination} />
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="card">
            <div className="action-bar">
              <div className="action-bar-left">
                <h2 className="card-title" style={{ margin: 0 }}>Active Projects</h2>
              </div>
              <div className="action-bar-right">
                <SearchBar value={projectSearch} onChange={setProjectSearch} placeholder="Search projects by name or client..." />
                {user?.role === 'ACCOUNTANT' && (
                  <button className="btn btn-primary" onClick={() => { if (showProjectForm) { resetProjectForm(); } else { resetProjectForm(); setShowProjectForm(true); } }}>
                    {showProjectForm ? <X size={18} /> : <><Plus size={18} /> New Project</>}
                  </button>
                )}
              </div>
            </div>

            {showProjectForm && (
              <form onSubmit={handleAddProject} className="premium-form">
                <div className="premium-form-header">
                  <h3 className="premium-form-title">{editingProject ? 'Edit Project' : 'Add New Project'}</h3>
                </div>
                <div className="premium-form-grid">
                  <div className="form-group">
                    <label>Project Name</label>
                    <input type="text" required value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} placeholder="e.g. Website Redesign" />
                  </div>
                  <div className="form-group">
                    <label>Client</label>
                    <CustomSelect 
                      required
                      value={newProject.client} 
                      onChange={val => setNewProject({...newProject, client: val})} 
                      placeholder="Select Client..."
                      options={clients.map(c => ({ value: c.id, label: c.name }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Revenue Model</label>
                    <CustomSelect 
                      required
                      value={newProject.project_type} 
                      onChange={val => setNewProject({...newProject, project_type: val})} 
                      options={[
                        { value: 'FIXED', label: 'Fixed Price' },
                        { value: 'HOURLY', label: 'Hourly' },
                        { value: 'AMC', label: 'AMC' },
                        { value: 'REVENUE_SHARE', label: 'Revenue Share' }
                      ]}
                    />
                  </div>

                  {newProject.project_type === 'REVENUE_SHARE' && (
                    <>
                      <div className="form-group">
                        <label>Revenue Share Type</label>
                        <CustomSelect 
                          required
                          value={newProject.revenue_share_type} 
                          onChange={val => setNewProject({...newProject, revenue_share_type: val})} 
                          options={[
                            { value: 'PROFIT_SHARE', label: 'Monthly Profit Share' },
                            { value: 'PER_SEAT', label: 'Per Seat / Admission Share' }
                          ]}
                        />
                      </div>
                      {newProject.revenue_share_type === 'PROFIT_SHARE' && (
                        <div className="form-group">
                          <label>Share Percentage (%)</label>
                          <input type="number" step="0.01" required value={newProject.revenue_share_percentage} onChange={e => setNewProject({...newProject, revenue_share_percentage: e.target.value})} placeholder="e.g. 20" />
                        </div>
                      )}
                    </>
                  )}
                  {newProject.project_type !== 'REVENUE_SHARE' && (
                    <>
                      <div className="form-group">
                        <label>Base / Total Value (₹)</label>
                        <input type="number" required value={newProject.total_value} onChange={e => setNewProject({...newProject, total_value: e.target.value})} placeholder="0.00" />
                      </div>
                      <div className="form-group">
                        <label>AMC % (if applicable)</label>
                        <input type="number" step="0.01" value={newProject.amc_percentage} onChange={e => setNewProject({...newProject, amc_percentage: e.target.value})} placeholder="e.g. 15" />
                      </div>
                      <div className="form-group">
                        <label>Delivery Date (Optional)</label>
                        <input type="date" value={newProject.delivery_date} onChange={e => setNewProject({...newProject, delivery_date: e.target.value})} />
                      </div>
                    </>
                  )}
                </div>
                <div className="premium-form-actions">
                  <button type="button" className="btn" onClick={() => setShowProjectForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingProject ? 'Update Project' : 'Save Project'}</button>
                </div>
              </form>
            )}

            <div className="table-container">
              <table className="responsive-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Project Name</th>
                    <th>Client</th>
                    <th>Value / Type</th>

                    <th>Created</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projectsPagination.currentData.map(p => (
                    <tr key={p.id}>
                      <td className="strong" data-label="Project Name">{p.name}</td>
                      <td data-label="Client">{p.client_name}</td>
                      <td className="strong" style={{ color: p.project_type === 'REVENUE_SHARE' ? 'var(--info)' : 'var(--success)' }} data-label="Value / Type">
                        {p.project_type === 'REVENUE_SHARE' ? 'Revenue Share' : formatCurrency(p.total_value)}
                      </td>

                      <td data-label="Created">{new Date(p.created_at).toLocaleDateString()}</td>
                      <td data-label="Actions">
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                          <Link to={`/projects/${p.id}`} className="btn" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', background: 'var(--primary-color)', color: '#fff', borderRadius: '4px', textDecoration: 'none' }}>
                            Manage Details
                          </Link>
                          {user?.role === 'ACCOUNTANT' && (
                            <>
                              <button className="btn" onClick={() => handleEditProject(p)} style={{ padding: '0.4rem', color: 'var(--primary-color)', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '4px' }} title="Edit"><Edit2 size={16}/></button>
                              <button className="btn" onClick={() => handleDeleteProject(p.id)} style={{ padding: '0.4rem', color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px' }} title="Delete"><Trash2 size={16}/></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {projectsPagination.currentData.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No projects found.</td></tr>}
                </tbody>
              </table>
              <Pagination {...projectsPagination} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Projects;

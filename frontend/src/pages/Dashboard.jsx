import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';
import { Activity, TrendingUp, TrendingDown, DollarSign, AlertCircle, Calendar, Download } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Data
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [projects, setProjects] = useState([]);
  const [renewals, setRenewals] = useState([]);
  
  // Derived Stats
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  const [totalAR, setTotalAR] = useState(0);
  const [upcomingLiabilities, setUpcomingLiabilities] = useState(0);

  // Breakdown Modal State
  const [breakdownModal, setBreakdownModal] = useState({ isOpen: false, title: '', type: '' });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, expRes, projRes, renRes] = await Promise.all([
        api.get('invoices/'),
        api.get('company-expenses/'),
        api.get('projects/'),
        api.get('renewals/')
      ]);
      
      const invData = invRes.data;
      const expData = expRes.data;
      const projData = projRes.data;
      const renData = renRes.data;
      
      setInvoices(invData);
      setExpenses(expData);
      setProjects(projData);
      setRenewals(renData);

      // KPI Calculations
      const rev = invData.filter(i => i.status === 'PAID').reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
      const exp = expData.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
      const ar = invData.filter(i => i.status === 'SENT').reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
      
      const today = new Date();
      const liabilities = renData
        .filter(r => !r.is_paid && new Date(r.due_date) >= today)
        .reduce((acc, curr) => acc + parseFloat(curr.cost), 0);
      
      setTotalRevenue(rev);
      setTotalExpenses(exp);
      setNetProfit(rev - exp);
      setTotalAR(ar);
      setUpcomingLiabilities(liabilities);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadCAExport = () => {
    const headers = ["Date", "Expense Type", "Description", "Category", "Logged By", "Project", "Amount", "Receipt Link"];
    const rows = expenses.map(exp => [
      exp.date,
      exp.expense_type === 'DIRECT_CORPORATE' ? 'Direct' : 'Advance',
      `"${exp.payee_description.replace(/"/g, '""')}"`,
      exp.category,
      exp.logged_by_name,
      exp.project_name || 'N/A',
      exp.amount,
      exp.receipt_file ? `http://localhost:8000${exp.receipt_file}` : 'No Receipt'
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `CA_Expense_Register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  };

  // --------------------------------------------------------
  // CHART DATA MEMOIZATION
  // --------------------------------------------------------
  
  const cashFlowData = useMemo(() => {
    const dataMap = {};
    const processDate = (dateStr, amount, type) => {
      const d = new Date(dateStr);
      const monthYear = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (!dataMap[monthYear]) {
        dataMap[monthYear] = { name: monthYear, Income: 0, Expenses: 0, sortVal: d.getTime() };
      }
      dataMap[monthYear][type] += parseFloat(amount);
    };

    invoices.filter(i => i.status === 'PAID').forEach(i => processDate(i.date, i.amount, 'Income'));
    expenses.forEach(e => processDate(e.date, e.amount, 'Expenses'));

    return Object.values(dataMap).sort((a, b) => a.sortVal - b.sortVal).slice(-6); // Last 6 months
  }, [invoices, expenses]);

  const expenseCategoryData = useMemo(() => {
    const dataMap = {};
    expenses.forEach(e => {
      dataMap[e.category] = (dataMap[e.category] || 0) + parseFloat(e.amount);
    });
    return Object.keys(dataMap).map(k => ({ name: k, value: dataMap[k] }));
  }, [expenses]);

  const projectProfitabilityData = useMemo(() => {
    return projects.map(p => {
      const pInvoices = invoices.filter(i => i.project === p.id && i.status === 'PAID');
      const pExpenses = expenses.filter(e => e.project === p.id);
      
      const rev = pInvoices.reduce((sum, curr) => sum + parseFloat(curr.amount), 0);
      const exp = pExpenses.reduce((sum, curr) => sum + parseFloat(curr.amount), 0);
      
      return {
        id: p.id,
        name: p.name,
        Revenue: rev,
        Expenses: exp,
        NetProfit: rev - exp,
        project_type: p.project_type
      };
    }).sort((a, b) => b.NetProfit - a.NetProfit);
  }, [projects, invoices, expenses]);

  const activeAMCs = useMemo(() => {
    const today = new Date();
    return projects.filter(p => {
      if (p.project_type !== 'AMC' && !p.amc_percentage) return false;
      if (!p.delivery_date) return false;
      const amcStartDate = new Date(p.delivery_date);
      amcStartDate.setMonth(amcStartDate.getMonth() + 3); // AMC starts 3 months after delivery
      return today >= amcStartDate;
    });
  }, [projects]);


  if (!user) return <div style={{padding: '2rem'}}>Please select a user to continue.</div>;
  if (loading) return <div style={{padding: '2rem', display: 'flex', justifyContent: 'center'}}>Loading Dashboard...</div>;

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title gradient-text">Command Center</h1>
          <p className="text-muted" style={{ margin: 0 }}>Overview of financial performance and project health.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/expenses')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign size={16} /> Request Advance / Add Expense
          </button>
          {user.role === 'SUPER_ADMIN' && (
            <button className="btn btn-primary" onClick={downloadCAExport} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Download size={16} /> CA Export
            </button>
          )}
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="dashboard-kpi-grid">
        <div className="card" style={{ marginBottom: 0, borderTop: '4px solid var(--success)', cursor: 'pointer', transition: 'transform 0.2s' }} 
             onClick={() => setBreakdownModal({ isOpen: true, title: 'YTD Income Breakdown', type: 'INCOME' })}
             onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
             onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={16} /> YTD Income (Paid)
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{formatCurrency(totalRevenue)}</div>
        </div>
        
        <div className="card" style={{ marginBottom: 0, borderTop: '4px solid var(--danger)', cursor: 'pointer', transition: 'transform 0.2s' }}
             onClick={() => setBreakdownModal({ isOpen: true, title: 'YTD Expenses Breakdown', type: 'EXPENSES' })}
             onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
             onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingDown size={16} /> YTD Expenses
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{formatCurrency(totalExpenses)}</div>
        </div>
        
        <div className="card" style={{ marginBottom: 0, borderTop: '4px solid var(--primary-color)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign size={16} /> Net Profit
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{formatCurrency(netProfit)}</div>
        </div>
        
        <div className="card" style={{ marginBottom: 0, borderTop: '4px solid var(--warning)', cursor: 'pointer', transition: 'transform 0.2s' }}
             onClick={() => setBreakdownModal({ isOpen: true, title: 'A/R (Unpaid) Breakdown', type: 'AR' })}
             onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
             onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} /> A/R (Unpaid)
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{formatCurrency(totalAR)}</div>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="dashboard-content-grid">
        
        {/* Cash Flow Chart */}
        <div className="card" style={{ marginBottom: 0 }}>
          <h3 style={{ margin: '0 0 1.5rem 0' }}>Cash Flow Trend (6 Months)</h3>
          <div style={{ height: 300, width: '100%' }}>
            <ResponsiveContainer>
              <LineChart data={cashFlowData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" tickFormatter={(value) => `₹${value/1000}k`} />
                <RechartsTooltip contentStyle={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--surface-border)', borderRadius: '0.5rem' }} />
                <Legend />
                <Line type="monotone" dataKey="Income" stroke="var(--success)" strokeWidth={3} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="Expenses" stroke="var(--danger)" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Donut Chart */}
        <div className="card" style={{ marginBottom: 0 }}>
          <h3 style={{ margin: '0 0 1.5rem 0' }}>Expense Breakdown</h3>
          <div style={{ height: 300, width: '100%' }}>
            {expenseCategoryData.length > 0 ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={expenseCategoryData} innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                    {expenseCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--surface-border)', borderRadius: '0.5rem' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
               <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No expense data</div>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: PROJECTS & ALERTS */}
      <div className="dashboard-content-grid" style={{ marginBottom: 0 }}>
        
        {/* Project Wise Report */}
        <div className="card" style={{ marginBottom: 0 }}>
          <h3 style={{ margin: '0 0 1.5rem 0' }}>Project-Wise Expense & Profitability Report</h3>
          <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto', overflowX: 'auto' }}>
            <table className="responsive-table">
              <thead style={{ position: 'sticky', top: 0, background: 'var(--surface-color)', zIndex: 1 }}>
                <tr>
                  <th>Project</th>
                  <th>Revenue (Paid)</th>
                  <th>Allocated Expenses</th>
                  <th>Net Profit</th>
                </tr>
              </thead>
              <tbody>
                {projectProfitabilityData.map(p => (
                  <tr key={p.id}>
                    <td className="strong" data-label="Project">{p.name} <span style={{fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block'}}>{p.project_type}</span></td>
                    <td style={{ color: 'var(--success)' }} data-label="Revenue (Paid)">{formatCurrency(p.Revenue)}</td>
                    <td style={{ color: 'var(--danger)' }} data-label="Allocated Expenses">{formatCurrency(p.Expenses)}</td>
                    <td className="strong" style={{ color: p.NetProfit >= 0 ? 'var(--success)' : 'var(--danger)' }} data-label="Net Profit">
                      {formatCurrency(p.NetProfit)}
                    </td>
                  </tr>
                ))}
                {projectProfitabilityData.length === 0 && <tr><td colSpan="4" style={{textAlign:'center', padding:'2rem'}}>No projects found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* AMC & Renewals Center */}
        <div className="card" style={{ marginBottom: 0, background: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={20} color="var(--primary-color)" /> AMCs & Renewals
          </h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Upcoming Domain/Server Renewals</h4>
            {renewals.filter(r => !r.is_paid).length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {renewals.filter(r => !r.is_paid).sort((a,b) => new Date(a.due_date) - new Date(b.due_date)).slice(0,5).map(r => (
                  <li key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <div className="strong" style={{ fontSize: '0.9rem' }}>{r.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Due: {r.due_date}</div>
                    </div>
                    <div style={{ color: 'var(--warning)', fontWeight: 'bold' }}>{formatCurrency(r.cost)}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No pending renewals.</div>
            )}
          </div>

          <div>
            <h4 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Active AMCs (Alerts)</h4>
            {activeAMCs.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {activeAMCs.map(p => (
                  <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <div className="strong" style={{ fontSize: '0.9rem' }}>{p.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AMC Rate: {p.amc_percentage}%</div>
                    </div>
                    <div style={{ color: 'var(--success)', fontWeight: 'bold' }}>Active</div>
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No active AMCs at this time.</div>
            )}
          </div>

        </div>

      </div>

      {/* BREAKDOWN MODAL */}
      {breakdownModal.isOpen && (
        <div className="modal-overlay" onClick={() => setBreakdownModal({ isOpen: false, title: '', type: '' })}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }} className="gradient-text">{breakdownModal.title}</h2>
              <button className="btn" onClick={() => setBreakdownModal({ isOpen: false, title: '', type: '' })} style={{ background: 'transparent', color: 'var(--text-color)', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <div className="table-container" style={{ maxHeight: '60vh', overflowY: 'auto', overflowX: 'auto' }}>
              <table className="responsive-table">
                <thead style={{ position: 'sticky', top: 0, background: 'var(--surface-color)', zIndex: 1 }}>
                  <tr>
                    <th>Date</th>
                    <th>{breakdownModal.type === 'EXPENSES' ? 'Payee / Desc' : 'Project'}</th>
                    <th>{breakdownModal.type === 'EXPENSES' ? 'Category' : 'Status'}</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdownModal.type === 'INCOME' && invoices.filter(i => i.status === 'PAID').map(i => (
                    <tr key={i.id}>
                      <td data-label="Date">{i.date}</td>
                      <td data-label="Project">{i.project_name || `Project ID: ${i.project}`}</td>
                      <td data-label="Status"><span className="badge" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)' }}>{i.status}</span></td>
                      <td data-label="Amount" style={{ color: 'var(--success)', fontWeight: 'bold' }}>{formatCurrency(i.amount)}</td>
                    </tr>
                  ))}
                  
                  {breakdownModal.type === 'AR' && invoices.filter(i => i.status === 'SENT').map(i => (
                    <tr key={i.id}>
                      <td data-label="Date">{i.date}</td>
                      <td data-label="Project">{i.project_name || `Project ID: ${i.project}`}</td>
                      <td data-label="Status"><span className="badge" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--warning)' }}>{i.status}</span></td>
                      <td data-label="Amount" style={{ color: 'var(--warning)', fontWeight: 'bold' }}>{formatCurrency(i.amount)}</td>
                    </tr>
                  ))}

                  {breakdownModal.type === 'EXPENSES' && expenses.map(e => (
                    <tr key={e.id}>
                      <td data-label="Date">{e.date}</td>
                      <td data-label="Payee / Desc">{e.payee_description}</td>
                      <td data-label="Category">{e.category}</td>
                      <td data-label="Amount" style={{ color: 'var(--danger)', fontWeight: 'bold' }}>{formatCurrency(e.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;

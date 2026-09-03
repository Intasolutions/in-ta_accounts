import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import { FileText, Plus, Trash2, Printer, Save, Calculator, ChevronLeft, ChevronRight } from 'lucide-react';
import usePagination from '../hooks/usePagination';
import Pagination from '../components/Pagination';

const Quotations = () => {
  const toast = useToast();
  const confirm = useConfirm();
  const { user } = React.useContext(AuthContext);

  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const generateQuoteNo = (quotesList) => {
    if (!quotesList || quotesList.length === 0) return 'QT-227';
    const nums = quotesList.map(q => {
      const match = q.quote_no.match(/QT-(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    const maxNum = Math.max(...nums, 226);
    return `QT-${maxNum + 1}`;
  };

  const createDefaultQuote = (quotesList = []) => ({
    quote_no: generateQuoteNo(quotesList),
    date: new Date().toISOString().split('T')[0],
    valid_until: '',
    client_name: '',
    client_company: '',
    client_address: '',
    main_heading: 'Scope of Work & Professional Services',
    items: [
      { id: Date.now(), heading: '', description: '', quantity: 1, unit_price: 0 }
    ],
    include_third_party: false,
    third_party_desc: 'Third Party Integration & API Cost',
    third_party_cost: 0,
    third_party_gst: 18,
  };

  const [quote, setQuote] = useState(() => createDefaultQuote());

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const res = await api.get('quotations/');
      setQuotations(res.data);
      if (quote.quote_no.startsWith('QT-') && quote.quote_no.length > 5) {
        // Only update if user hasn't manually started typing a completely custom one
        setQuote(createDefaultQuote(res.data));
      }
    } catch (err) {
      console.error("Error fetching quotations:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setQuote({
      ...quote,
      items: [...quote.items, { id: Date.now(), heading: '', description: '', quantity: 1, unit_price: 0 }]
    });
  };

  const handleRemoveItem = (id) => {
    setQuote({
      ...quote,
      items: quote.items.filter(item => item.id !== id)
    });
  };

  const handleResize = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  const handleItemChange = (id, field, value, e = null) => {
    if (e && (field === 'description' || field === 'heading')) {
      handleResize(e);
    }
    setQuote({
      ...quote,
      items: quote.items.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    });
  };

  const calculateSubtotal = () => {
    return quote.items.reduce((acc, item) => acc + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0), 0);
  };

  const calculateThirdPartyTotal = () => {
    if (!quote.include_third_party) return 0;
    const cost = parseFloat(quote.third_party_cost) || 0;
    const gst = parseFloat(quote.third_party_gst) || 0;
    return cost + (cost * (gst / 100));
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateThirdPartyTotal();
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
  };

  const handleSave = async () => {
    try {
      const payload = {
        quote_no: quote.quote_no,
        date: quote.date,
        valid_until: quote.valid_until || null,
        client_name: quote.client_name,
        raw_data: quote
      };

      await api.post('quotations/', payload);
      toast.success('Quotation saved successfully!');
      fetchQuotations();
      // Don't reset quote after saving, so user can print it easily
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.quote_no ? 'Quote Number must be unique' : 'Failed to save quotation');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePrintQuote = (q) => {
    setQuote(q.raw_data);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleView = (q) => {
    setQuote(q.raw_data);
  };

  const handleDelete = async (id) => {
    if (await confirm("Are you sure you want to delete this quotation?")) {
      try {
        await api.delete(`quotations/${id}/`);
        fetchQuotations();
        if (quote.quote_no === quotations.find(qt => qt.id === id)?.quote_no) {
          setQuote(createDefaultQuote(quotations.filter(qt => qt.id !== id)));
        }
        toast.success("Quotation deleted");
      } catch(err) {
        toast.error("Failed to delete quotation");
      }
    }
  }

  const pagination = usePagination(quotations, 25);

  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>;

  return (
    <div className="quotation-page" style={{ height: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* LEFT SIDEBAR */}
        <div className="no-print" style={{
          width: isSidebarOpen ? '350px' : '0',
          borderRight: isSidebarOpen ? '1px solid var(--border-color)' : 'none',
          background: 'var(--surface-color)',
          transition: 'width 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          flexShrink: 0
        }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
            <h2 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calculator size={18} /> Saved Quotes
            </h2>
            <button className="btn btn-primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }} onClick={() => setQuote(createDefaultQuote(quotations))}>
              <Plus size={16} /> New
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pagination.currentData.map(q => {
              const raw = q.raw_data || {};
              const subtotal = raw.items?.reduce((acc, item) => acc + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0), 0) || 0;
              const tpCost = raw.include_third_party ? (parseFloat(raw.third_party_cost) || 0) : 0;
              const tpGst = raw.include_third_party ? (parseFloat(raw.third_party_gst) || 0) : 0;
              const total = subtotal + tpCost + (tpCost * (tpGst/100));

              const isSelected = quote.quote_no === q.quote_no;

              return (
                <div key={q.id} style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  border: isSelected ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                  background: isSelected ? 'rgba(59, 130, 246, 0.05)' : '#fff',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s'
                }} onClick={() => handleView(q)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <strong style={{ fontSize: '0.95rem' }}>{q.quote_no}</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{q.date}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {q.client_name || 'No Client Name'}
                  </div>
                  <div style={{ fontWeight: 'bold', color: 'var(--success)', marginBottom: '0.75rem' }}>
                    {formatCurrency(total)}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn" onClick={(e) => { e.stopPropagation(); handlePrintQuote(q); }} style={{ flex: 1, padding: '0.25rem', fontSize: '0.75rem', background: '#f1f5f9' }}><Printer size={14} /> Print</button>
                    {user?.role === 'ACCOUNTANT' || user?.role === 'OWNER' ? (
                      <button className="btn" onClick={(e) => { e.stopPropagation(); handleDelete(q.id); }} style={{ padding: '0.25rem', color: 'var(--danger)', background: '#fef2f2' }}><Trash2 size={14}/></button>
                    ): null}
                  </div>
                </div>
              )
            })}
            {pagination.currentData.length === 0 && <div style={{textAlign: 'center', padding: '2rem', color: 'var(--text-muted)'}}>No quotations found.</div>}
          </div>
          <div style={{ borderTop: '1px solid var(--border-color)', padding: '0.5rem', background: '#fff' }}>
             <Pagination {...pagination} />
          </div>
        </div>

        {/* RIGHT SIDEBAR (BUILDER) */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#f1f5f9', position: 'relative' }}>
          
          <button 
            className="no-print btn"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 10, padding: '0.5rem', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderRadius: '50%' }}
            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isSidebarOpen ? <ChevronLeft size={18}/> : <ChevronRight size={18}/>}
          </button>

          <div className="builder-container" style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
            <div className="action-bar no-print" style={{ marginBottom: '1rem', background: '#fff', padding: '1rem', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: '3rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{quote.quote_no ? `Editing ${quote.quote_no}` : 'New Quotation'}</h2>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn btn-primary" onClick={handleSave}><Save size={18} /> Save</button>
                <button className="btn" onClick={handlePrint} style={{ background: 'var(--success)', color: 'white', borderColor: 'var(--success)' }}><Printer size={18} /> Print PDF</button>
              </div>
            </div>

            <div className="print-area">
              <div className="quote-document">
                {/* Header */}
                <div className="quote-header">
                  <div className="quote-company-info">
                    <h1 className="company-name">IN-TA SOLUTIONS PRIVATE LIMITED</h1>
                    <p>Mananthavady, Wayanad - 670645, Kerala</p>
                    <p>+91 9447595381 | info@in-tasolutions.com</p>
                    <p>www.in-tasolutions.com</p>
                  </div>
                  <div className="quote-logo-wrapper">
                    <img src="/logo-new.jpg" alt="INTA Logo" className="quote-logo-img" />
                  </div>
                </div>

                {/* Quote Info Blocks */}
                <div className="quote-meta-blocks">
                  <div className="quote-for-block">
                    <h3>QUOTE FOR</h3>
                    <div className="no-print" style={{ marginBottom: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <input type="text" placeholder="Client Name" value={quote.client_name} onChange={e => setQuote({...quote, client_name: e.target.value})} className="print-input" />
                      <input type="text" placeholder="Company Name" value={quote.client_company} onChange={e => setQuote({...quote, client_company: e.target.value})} className="print-input" />
                      <textarea placeholder="Address / Location" value={quote.client_address} onChange={e => setQuote({...quote, client_address: e.target.value})} rows="2" className="print-input"></textarea>
                    </div>
                    <div className="print-only">
                      <strong>{quote.client_name}</strong><br/>
                      {quote.client_company && <>{quote.client_company}<br/></>}
                      {quote.client_address && <span style={{ whiteSpace: 'pre-wrap' }}>{quote.client_address}</span>}
                    </div>
                  </div>
                  
                  <div className="quote-details-block">
                    <div className="detail-row">
                      <span>QUOTE NO:</span>
                      <strong className="no-print"><input type="text" value={quote.quote_no} onChange={e => setQuote({...quote, quote_no: e.target.value})} className="print-input" style={{ width: '120px' }}/></strong>
                      <strong className="print-only">{quote.quote_no}</strong>
                    </div>
                    <div className="detail-row">
                      <span>DATE:</span>
                      <span className="no-print"><input type="date" value={quote.date} onChange={e => setQuote({...quote, date: e.target.value})} className="print-input" style={{ width: '120px' }}/></span>
                      <span className="print-only">{quote.date}</span>
                    </div>
                    <div className="detail-row" style={{ marginTop: '1rem', borderTop: '1px dashed #e2e8f0', paddingTop: '1rem' }}>
                      <span>VALID UNTIL:</span>
                      <span className="no-print"><input type="date" value={quote.valid_until} onChange={e => setQuote({...quote, valid_until: e.target.value})} className="print-input" style={{ width: '120px' }}/></span>
                      <span className="print-only">{quote.valid_until}</span>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div style={{ marginTop: '2rem' }}>
                  <div className="no-print">
                    <input 
                      type="text" 
                      value={quote.main_heading} 
                      onChange={e => setQuote({...quote, main_heading: e.target.value})} 
                      className="print-input" 
                      style={{ width: '100%', fontWeight: 'bold', marginBottom: '1rem', fontSize: '1rem' }} 
                    />
                  </div>
                  <div className="print-only">
                    <h4 style={{ color: '#0f172a', marginBottom: '1rem', fontSize: '1rem', fontWeight: '800', fontFamily: "'Montserrat', sans-serif", textTransform: 'uppercase' }}>
                      {quote.main_heading}
                    </h4>
                  </div>
                </div>
                <table className="quote-table">
                  <thead>
                    <tr>
                      <th style={{ width: '55%' }}>Description</th>
                      <th style={{ width: '15%', textAlign: 'center' }}>Quantity</th>
                      <th style={{ width: '15%', textAlign: 'right' }}>Unit Price</th>
                      <th style={{ width: '15%', textAlign: 'right' }}>Total</th>
                      <th className="no-print" style={{ width: '5%' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.items.map((item, index) => (
                      <tr key={item.id}>
                        <td>
                          <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <textarea 
                              value={item.heading}
                              onChange={e => handleItemChange(item.id, 'heading', e.target.value, e)}
                              placeholder={`Item ${index + 1} Heading...`}
                              className="print-input"
                              rows="1"
                              style={{ width: '100%', fontWeight: 'bold', resize: 'none', overflow: 'hidden', paddingBottom: '0.25rem' }}
                            />
                            <textarea 
                              value={item.description} 
                              onChange={e => handleItemChange(item.id, 'description', e.target.value, e)}
                              placeholder={`Item ${index + 1} Description...`}
                              rows="1"
                              className="print-input"
                              style={{ width: '100%', resize: 'none', overflow: 'hidden', paddingTop: '0.25rem', color: '#475569' }}
                            />
                          </div>
                          <div className="print-only" style={{ whiteSpace: 'pre-wrap' }}>
                            <strong>{index + 1}. {item.heading}</strong>
                            {item.description && <div>{item.description}</div>}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input className="no-print print-input" type="number" min="1" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', e.target.value)} style={{ width: '60px', textAlign: 'center' }}/>
                          <span className="print-only">{item.quantity}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <input className="no-print print-input" type="number" value={item.unit_price} onChange={e => handleItemChange(item.id, 'unit_price', e.target.value)} style={{ width: '100px', textAlign: 'right' }}/>
                          <span className="print-only">{item.unit_price}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <strong>{formatCurrency((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0))}</strong>
                        </td>
                        <td className="no-print">
                          <button type="button" onClick={() => handleRemoveItem(item.id)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    ))}
                    
                    <tr className="no-print">
                      <td colSpan="5">
                        <button className="btn btn-primary" onClick={handleAddItem} style={{ marginTop: '0.5rem' }}><Plus size={16} /> Add Item</button>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="no-print toggle-container">
                  <div>
                    <div className="toggle-label-text">Third-Party Integrations</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Include additional costs for APIs and external services</div>
                  </div>
                  <label className="toggle-switch" style={{ marginLeft: 'auto' }}>
                    <input type="checkbox" checked={quote.include_third_party} onChange={e => setQuote({...quote, include_third_party: e.target.checked})} />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                {quote.include_third_party && (
                  <div style={{ marginTop: '2rem' }}>
                    <h4 style={{ color: '#0f172a', marginBottom: '1rem', fontSize: '1rem', fontWeight: '800', fontFamily: "'Montserrat', sans-serif", textTransform: 'uppercase' }}>Third-Party Integration & API Costs</h4>
                    <table className="quote-table third-party-table">
                      <thead>
                        <tr>
                          <th style={{ width: '55%' }}>Description</th>
                          <th style={{ width: '15%', textAlign: 'center' }}>GST %</th>
                          <th style={{ width: '15%', textAlign: 'right' }}>Cost</th>
                          <th style={{ width: '15%', textAlign: 'right' }}>Total (Inc. GST)</th>
                          <th className="no-print" style={{ width: '5%' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            <div className="no-print">
                              <input type="text" value={quote.third_party_desc} onChange={e => setQuote({...quote, third_party_desc: e.target.value})} className="print-input" style={{ width: '100%', fontWeight: 'bold' }} />
                            </div>
                            <div className="print-only">
                              <strong>* {quote.third_party_desc}</strong>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                              <input type="number" value={quote.third_party_gst} onChange={e => setQuote({...quote, third_party_gst: e.target.value})} className="print-input" style={{ width: '60px', textAlign: 'center' }}/>
                            </div>
                            <div className="print-only" style={{ color: '#64748b', fontSize: '0.9rem' }}>
                              {quote.third_party_gst}%
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <input className="no-print print-input" type="number" value={quote.third_party_cost} onChange={e => setQuote({...quote, third_party_cost: e.target.value})} style={{ width: '100px', textAlign: 'right' }}/>
                            <span className="print-only">{quote.third_party_cost}</span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <strong>{formatCurrency(calculateThirdPartyTotal())}</strong>
                          </td>
                          <td className="no-print"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Totals */}
                <div className="quote-totals-container">
                    <div className="quote-totals">
                      <div className="totals-row">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(calculateSubtotal())}</span>
                      </div>
                      {quote.include_third_party && (
                        <div className="totals-row">
                          <span>Third-Party Cost (Inc. GST):</span>
                          <span>{formatCurrency(calculateThirdPartyTotal())}</span>
                        </div>
                      )}
                      <div className="totals-row grand-total">
                        <span>Total:</span>
                        <span>{formatCurrency(calculateTotal())}</span>
                      </div>
                    </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quotations;

import React from 'react';
import { Search } from 'lucide-react';

const SearchBar = ({ value, onChange, placeholder = "Search..." }) => {
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
      <div style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
        <Search size={16} />
      </div>
      <input 
        type="text" 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '0.5rem 1rem 0.5rem 2.25rem',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '0.75rem',
          background: 'rgba(255, 255, 255, 0.05)',
          color: 'var(--text-main)',
          fontSize: '0.85rem',
          outline: 'none',
          transition: 'all 0.2s ease'
        }}
        onFocus={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.08)';
          e.target.style.borderColor = 'var(--primary-color)';
        }}
        onBlur={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.05)';
          e.target.style.borderColor = 'rgba(255, 255, 255, 0.05)';
        }}
      />
    </div>
  );
};

export default SearchBar;

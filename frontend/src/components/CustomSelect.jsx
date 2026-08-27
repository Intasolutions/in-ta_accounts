import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const CustomSelect = ({ value, onChange, options, placeholder = "Select...", className = "", required = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => String(opt.value) === String(value));

  return (
    <div className={`custom-select-wrapper ${className}`} ref={dropdownRef} style={{ position: 'relative', width: '100%', minWidth: '160px' }}>
      {required && (
        <input 
          type="text" 
          required={required} 
          value={value || ''} 
          onChange={() => {}} 
          style={{ opacity: 0, position: 'absolute', zIndex: -1, width: '1px', height: '1px', bottom: 0, left: '50%' }} 
        />
      )}
      <div 
        className="custom-select-trigger"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.05)',
          border: isOpen ? '1px solid var(--primary-color)' : '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '0.75rem',
          padding: '0.65rem 1rem',
          cursor: 'pointer',
          color: 'var(--text-main)',
          fontSize: '0.85rem',
          fontWeight: 500,
          transition: 'all 0.2s ease',
          boxShadow: isOpen ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none'
        }}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} style={{ color: 'var(--text-muted)', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
      </div>

      {isOpen && (
        <div 
          className="custom-select-menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.5rem)',
            left: 0,
            right: 0,
            background: 'var(--bg-color)',
            border: '1px solid var(--surface-border)',
            borderRadius: '0.75rem',
            padding: '0.5rem',
            zIndex: 1000,
            maxHeight: '250px',
            overflowY: 'auto',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)'
          }}
        >
          {options.map((opt, index) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <div
                key={index}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  color: isSelected ? 'var(--primary-color)' : 'var(--text-main)',
                  fontSize: '0.85rem',
                  transition: 'background 0.15s ease'
                }}
                onMouseOver={(e) => { if(!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                onMouseOut={(e) => { if(!isSelected) e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{opt.label}</span>
                {isSelected && <Check size={14} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;

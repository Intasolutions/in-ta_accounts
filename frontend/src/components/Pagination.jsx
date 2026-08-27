import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  goToPage, 
  nextPage, 
  prevPage, 
  startIndex, 
  endIndex, 
  totalItems 
}) => {
  if (totalItems === 0) return null;

  const pages = [];
  // Calculate which page numbers to show (max 5 buttons usually)
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  
  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem',
      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    }}>
      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        Showing <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{startIndex}</span> to <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{endIndex}</span> of <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{totalItems}</span> results
      </div>

      <div style={{ display: 'flex', gap: '0.25rem' }}>
        <button 
          onClick={prevPage}
          disabled={currentPage === 1}
          style={{
            padding: '0.5rem',
            background: 'var(--surface-color)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-main)',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <ChevronLeft size={16} />
        </button>

        {pages.map(p => (
          <button 
            key={p}
            onClick={() => goToPage(p)}
            style={{
              padding: '0.25rem 0.75rem',
              background: p === currentPage ? 'var(--primary-color)' : 'var(--surface-color)',
              border: p === currentPage ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
              borderRadius: '4px',
              color: p === currentPage ? '#fff' : 'var(--text-main)',
              cursor: 'pointer',
              fontWeight: p === currentPage ? '600' : '400'
            }}
          >
            {p}
          </button>
        ))}

        <button 
          onClick={nextPage}
          disabled={currentPage === totalPages}
          style={{
            padding: '0.5rem',
            background: 'var(--surface-color)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-main)',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;

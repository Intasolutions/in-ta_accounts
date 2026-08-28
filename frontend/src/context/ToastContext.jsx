import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const idCounter = useRef(0);

  const addToast = useCallback((message, type = 'success') => {
    const id = ++idCounter.current;
    setToasts(prev => [...prev, { id, message, type, isClosing: false }]);
    
    // Auto remove after 3 seconds
    setTimeout(() => removeToast(id), 3000);
  }, []);

  const removeToast = useCallback((id) => {
    // First trigger closing animation
    setToasts(prev => prev.map(t => t.id === id ? { ...t, isClosing: true } : t));
    
    // Then actually remove it from DOM
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300); // Matches CSS animation duration
  }, []);

  const success = useCallback((msg) => addToast(msg, 'success'), [addToast]);
  const error = useCallback((msg) => addToast(msg, 'error'), [addToast]);

  return (
    <ToastContext.Provider value={{ success, error }}>
      {children}
      {typeof document !== 'undefined' && createPortal(
        <div className="toast-container">
          {toasts.map(toast => (
            <div 
              key={toast.id} 
              className={`toast toast-${toast.type} ${toast.isClosing ? 'toast-closing' : ''}`}
            >
              <div className="toast-icon">
                {toast.type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
              </div>
              <div>{toast.message}</div>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogIn, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const loginStyles = `
  .login-container {
    display: flex;
    min-height: 100vh;
    background-color: #ffffff;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  .login-left {
    flex: 1;
    background: linear-gradient(135deg, #6366f1 0%, #312e81 100%);
    display: none;
    flex-direction: column;
    justify-content: space-between;
    padding: 4rem;
    color: white;
    position: relative;
    overflow: hidden;
  }
  @media (min-width: 1024px) {
    .login-left {
      display: flex;
    }
  }
  .glass-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 1rem;
    padding: 2rem;
    max-width: 450px;
    margin-top: auto;
  }
  .login-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 2rem;
    background-color: #ffffff;
    position: relative;
  }
  .login-form-container {
    width: 100%;
    max-width: 420px;
    animation: fadeIn 0.5s ease-out;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .login-input {
    width: 100%;
    padding: 0.875rem 1rem;
    border: 1px solid #cbd5e1;
    border-radius: 0.5rem;
    background-color: #ffffff;
    font-size: 1rem;
    color: #0f172a;
    transition: all 0.2s;
  }
  .login-input:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
  }
  .login-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: #334155;
    margin-bottom: 0.5rem;
  }
  .login-btn {
    width: 100%;
    padding: 0.875rem;
    background-color: #6366f1;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    margin-top: 2rem;
  }
  .login-btn:hover:not(:disabled) {
    background-color: #4f46e5;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
  }
  .login-btn:active:not(:disabled) {
    transform: translateY(0);
  }
  .login-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  .bg-pattern {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0.05;
    pointer-events: none;
    background-image: radial-gradient(#ffffff 1px, transparent 1px);
    background-size: 30px 30px;
  }
`;

const Login = () => {
  const { login } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await login(username, password);
    } catch (err) {
      console.error(err);
      setError('Invalid username or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{loginStyles}</style>
      <div className="login-container">
        
        {/* Left Panel - Branding (Hidden on Mobile) */}
        <div className="login-left">
          <div className="bg-pattern"></div>
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0 0 1rem 0' }}>
              Financial Clarity,<br/>Made Simple.
            </h1>
            <p style={{ fontSize: '1.125rem', opacity: 0.9, maxWidth: '400px' }}>
              Professional accounting, invoicing, and project management designed for modern businesses.
            </p>
          </div>

          <div className="glass-card" style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <CheckCircle size={24} color="#a5b4fc" />
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>Enterprise Grade</h3>
            </div>
            <p style={{ margin: 0, opacity: 0.8, lineHeight: 1.5 }}>
              "This platform has completely transformed how we handle our project billing and financial tracking."
            </p>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="login-right">
          <div className="login-form-container">
            
            {/* Logo & Header */}
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <img 
                src="/logo-new.jpg" 
                alt="IN-TA Solutions" 
                style={{ 
                  height: '64px', 
                  width: 'auto', 
                  marginBottom: '1.5rem',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                }} 
              />
              <h2 style={{ margin: 0, fontSize: '1.875rem', fontWeight: '700', color: '#0f172a' }}>
                Welcome back
              </h2>
              <p style={{ color: '#64748b', margin: '0.5rem 0 0 0' }}>
                Please enter your details to sign in.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fca5a5',
                color: '#ef4444',
                padding: '1rem',
                borderRadius: '0.5rem',
                marginBottom: '1.5rem',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="login-label">Username</label>
                <input 
                  type="text" 
                  className="login-input"
                  required 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                  placeholder="Enter your username"
                />
              </div>

              <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="login-label" style={{ margin: 0 }}>Password</label>
                  <Link to="/forgot-password" style={{ fontSize: '0.875rem', color: '#6366f1', fontWeight: '500', textDecoration: 'none' }}>
                    Forgot Password?
                  </Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className="login-input"
                    required 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="••••••••"
                    style={{ paddingRight: '3rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '0.25rem',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                className="login-btn"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
            
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;

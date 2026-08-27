import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, CheckCircle2 } from 'lucide-react';
import api from '../api';

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleNext = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    try {
      await api.post('/finance/check-email/', { email });
      setStep(2);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'No account found with this email address.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    
    try {
      await api.post('/finance/direct-password-reset/', {
        email,
        new_password: newPassword
      });
      setStep(3); // Success step
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to reset password. Please check if the email is correct.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--bg-main) 0%, #1a1a2e 100%)',
      padding: '2rem'
    }}>
      <div className="card" style={{
        maxWidth: '400px',
        width: '100%',
        padding: '2.5rem',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        borderTop: '4px solid var(--primary-color)'
      }}>
        
        {step !== 3 && (
          <Link to="/login" style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            color: 'var(--text-muted)', 
            textDecoration: 'none',
            marginBottom: '2rem',
            fontSize: '0.875rem'
          }}>
            <ArrowLeft size={16} /> Back to Login
          </Link>
        )}

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            background: 'rgba(99, 102, 241, 0.1)', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
            color: 'var(--primary-color)'
          }}>
            {step === 3 ? <CheckCircle2 size={32} /> : <ShieldAlert size={32} />}
          </div>
          <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 'bold' }}>
            {step === 1 && "Reset Password"}
            {step === 2 && "New Password"}
            {step === 3 && "Password Reset!"}
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>
            {step === 1 && "Enter your email to reset your password"}
            {step === 2 && "Enter your new password below"}
            {step === 3 && "Your password has been changed successfully."}
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--danger)',
            color: 'var(--danger)',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleNext}>
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                required 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="Enter your account email"
                style={{ background: 'rgba(0,0,0,0.2)' }}
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', marginTop: '1rem' }}
              disabled={isLoading}
            >
              {isLoading ? 'Checking...' : 'Continue'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleReset}>
            <div className="form-group">
              <label>New Password</label>
              <input 
                type="password" 
                required 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                placeholder="••••••••"
                style={{ background: 'rgba(0,0,0,0.2)' }}
              />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input 
                type="password" 
                required 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                placeholder="••••••••"
                style={{ background: 'rgba(0,0,0,0.2)' }}
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', marginTop: '1rem' }}
              disabled={isLoading}
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        {step === 3 && (
          <button 
            onClick={() => navigate('/login')}
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
          >
            Return to Login
          </button>
        )}

      </div>
    </div>
  );
};

export default ForgotPassword;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API from '../config/api';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '', village: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post(`${API}/api/auth/register`, formData);
      setSuccess('Your account is ready. Taking you to sign in…');
      window.setTimeout(() => navigate('/login', { replace: true }), 1400);
    } catch (requestError) {
      const message = requestError.response?.data?.message;
      setError(message || (requestError.request ? 'The service is unreachable. Please try again.' : 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { label: 'Full name', name: 'name', type: 'text', placeholder: 'Your name', required: true, autocomplete: 'name' },
    { label: 'Email address', name: 'email', type: 'email', placeholder: 'you@example.com', required: true, autocomplete: 'email' },
    { label: 'Password', name: 'password', type: 'password', placeholder: 'At least 6 characters', required: true, autocomplete: 'new-password' },
    { label: 'Phone number', name: 'phone', type: 'tel', placeholder: 'Optional phone number', required: false, autocomplete: 'tel' },
    { label: 'Village', name: 'village', type: 'text', placeholder: 'Your village', required: false, autocomplete: 'address-level2' }
  ];

  return (
    <main className="auth-page">
      <aside className="auth-side">
        <div>
          <div className="brand-mark" aria-hidden="true">🏛️</div>
          <p className="eyebrow" style={{ color: '#b9dfc4' }}>Join your community</p>
          <h1>Small reports can lead to meaningful change.</h1>
          <p>Create an account to report local issues and follow the response from your Panchayat.</p>
        </div>
        <span className="auth-side-note">Smart Panchayat · Digital Village Service</span>
      </aside>
      <section className="auth-main">
        <div className="auth-card">
          <p className="eyebrow">Citizen registration</p>
          <h2>Create your account</h2>
          <p>Set up your profile to submit and track complaints.</p>
          {error && <div className="error-banner" role="alert">{error}</div>}
          {success && <div className="success-banner" role="status">{success}</div>}
          <form className="auth-form" onSubmit={handleSubmit}>
            {fields.map((field) => (
              <label htmlFor={`register-${field.name}`} key={field.name}>
                {field.label}{field.required ? ' *' : ''}
                <input id={`register-${field.name}`} type={field.type} name={field.name}
                  value={formData[field.name]} required={field.required} autoComplete={field.autocomplete}
                  minLength={field.name === 'password' ? 6 : undefined}
                  onChange={(event) => setFormData({ ...formData, [field.name]: event.target.value })}
                  placeholder={field.placeholder} />
              </label>
            ))}
            <button type="submit" className="button button-primary" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
          <p className="auth-bottom">Already have an account? <button type="button" onClick={() => navigate('/login')}>Sign in</button></p>
        </div>
      </section>
    </main>
  );
}

export default Register;

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API from '../config/api';
import { getHomePath } from '../utils/session';
import { loadGoogleIdentity } from '../utils/googleIdentity';
import { offerPasswordSave } from '../utils/browserCredentials';

const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

function Login() {
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleCredential = useCallback(async (credentialResponse) => {
    if (!credentialResponse.credential) {
      setError('Google sign-in did not return a credential. Please try again.');
      return;
    }

    setGoogleLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API}/api/auth/google`, { idToken: credentialResponse.credential });
      if (!response.data?.token || response.data?.user?.role !== 'citizen') {
        throw new Error('Google sign-in is only available to citizen accounts.');
      }
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      offerPasswordSave(document.getElementById('login-form'));
      navigate(getHomePath(response.data.user), { replace: true });
    } catch (requestError) {
      const message = requestError.response?.data?.message;
      setError(message || (requestError.request ? 'The service is unreachable. Please try again.' : requestError.message || 'Google sign-in failed. Please try again.'));
    } finally {
      setGoogleLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!googleClientId) return undefined;
    let active = true;

    loadGoogleIdentity()
      .then((google) => {
        if (!active || !googleButtonRef.current) return;
        google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredential
        });
        google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: Math.min(360, googleButtonRef.current.clientWidth)
        });
      })
      .catch(() => {
        if (active) setError('Google sign-in could not be loaded. You can still sign in with email and password.');
      });

    return () => { active = false; };
  }, [handleGoogleCredential]);

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading || googleLoading) return;
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API}/api/auth/login`, formData);
      if (!response.data?.token || !response.data?.user?.role) {
        throw new Error('The server returned an incomplete login response.');
      }
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate(getHomePath(response.data.user), { replace: true });
    } catch (requestError) {
      const message = requestError.response?.data?.message;
      setError(message || (requestError.request ? 'The service is unreachable. Please try again.' : 'Login failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page auth-login">
      <aside className="auth-side">
        <div className="auth-login-brand">
          <span className="auth-login-brand-icon" aria-hidden="true">🏛️</span>
          <span><strong>Smart Panchayat</strong><small>Community services portal</small></span>
        </div>
        <div className="auth-login-copy">
          <p className="eyebrow">YOUR VOICE. YOUR VILLAGE.</p>
          <h1>Better local services start with being heard.</h1>
          <p>Report an issue, follow its progress, and stay connected with your Panchayat in one place.</p>
        </div>
        <div className="auth-login-preview" aria-hidden="true">
          <div className="auth-preview-top">
            <span className="auth-preview-icon">✓</span>
            <span><strong>Complaint progress</strong><small>Updates in one place</small></span>
            <span className="auth-preview-status">In progress</span>
          </div>
          <div className="auth-preview-track"><span /></div>
          <div className="auth-preview-steps"><span>Submitted</span><span>Under review</span><span>Resolved</span></div>
        </div>
        <span className="auth-side-note">A clearer way to make your village heard.</span>
      </aside>
      <section className="auth-main">
        <div className="auth-card auth-login-card">
          <div className="auth-login-mobile-brand">
            <span aria-hidden="true">🏛️</span>
            <strong>Smart Panchayat</strong>
          </div>
          <div className="auth-login-heading">
            <p className="eyebrow">SECURE PORTAL ACCESS</p>
            <h2>Welcome back</h2>
            <p>Sign in to continue to your Smart Panchayat workspace.</p>
          </div>
          {error && <div className="error-banner" role="alert">{error}</div>}
          <form id="login-form" className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="login-email">Email address
              <input id="login-email" type="email" name="email" value={formData.email} required autoComplete="username"
                onChange={handleChange} placeholder="you@example.com" />
            </label>
            <div className="auth-password-field">
              <label htmlFor="login-password">Password</label>
              <span className="password-input-wrap">
                <input id="login-password" type={showPassword ? 'text' : 'password'} name="password" value={formData.password}
                  required autoComplete="current-password" onChange={handleChange} placeholder="Enter your password" />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    {showPassword ? (
                      <>
                        <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8" />
                        <path d="M9.9 5.2A10.7 10.7 0 0112 5c6.4 0 10 7 10 7a15.4 15.4 0 01-4.1 4.7M6.2 6.2A16.3 16.3 0 002 12s3.6 7 10 7c1.3 0 2.5-.3 3.6-.8" />
                      </>
                    ) : (
                      <>
                        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                </button>
              </span>
            </div>
            <button type="submit" className="button button-primary" disabled={loading || googleLoading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <div className="auth-divider"><span>OR</span></div>
          {googleClientId ? (
            <div className="google-login">
              <div ref={googleButtonRef} className="google-login-button" />
              {googleLoading && <span className="google-login-status" role="status">Signing in with Google…</span>}
            </div>
          ) : (
            <div className="google-login">
              <button type="button" className="google-login-unconfigured" disabled>
                <span className="google-login-g" aria-hidden="true">G</span>
                Continue with Google
              </button>
              <span className="google-login-status">Google sign-in needs setup. Admins continue with email and password.</span>
            </div>
          )}
          <p className="auth-login-role-note">Your account role opens the right workspace automatically.</p>
          <p className="auth-bottom">New to Smart Panchayat? <button type="button" onClick={() => navigate('/register')}>Create an account</button></p>
        </div>
      </section>
    </main>
  );
}

export default Login;

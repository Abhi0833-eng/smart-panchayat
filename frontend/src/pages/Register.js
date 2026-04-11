import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '', village: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post('http://localhost:5000/api/auth/register', formData);
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a6b3c, #2d9e5f)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ fontSize: '40px' }}>🏛️</div>
          <h2 style={{ color: '#1a6b3c', margin: '10px 0' }}>Register</h2>
          <p style={{ color: '#666', margin: '0' }}>Create your account</p>
        </div>

        {error && (
          <div style={{
            background: '#ffe0e0', color: '#cc0000',
            padding: '10px', borderRadius: '8px',
            marginBottom: '20px', fontSize: '14px'
          }}>{error}</div>
        )}

        {success && (
          <div style={{
            background: '#e0ffe0', color: '#006600',
            padding: '10px', borderRadius: '8px',
            marginBottom: '20px', fontSize: '14px'
          }}>{success}</div>
        )}

        <form onSubmit={handleSubmit}>
          {[
            { label: 'Full Name', name: 'name', type: 'text', placeholder: 'Enter your full name' },
            { label: 'Email', name: 'email', type: 'email', placeholder: 'Enter your email' },
            { label: 'Password', name: 'password', type: 'password', placeholder: 'Create a password' },
            { label: 'Phone Number', name: 'phone', type: 'text', placeholder: 'Enter phone number' },
            { label: 'Village', name: 'village', type: 'text', placeholder: 'Enter your village name' }
          ].map((field) => (
            <div key={field.name} style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: '#333', fontWeight: 'bold', fontSize: '14px' }}>
                {field.label}
              </label>
              <input
                type={field.type}
                name={field.name}
                value={formData[field.name]}
                onChange={handleChange}
                placeholder={field.placeholder}
                required
                style={{
                  width: '100%', padding: '12px',
                  border: '1px solid #ddd', borderRadius: '8px',
                  fontSize: '14px', boxSizing: 'border-box'
                }}
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '14px',
              background: '#1a6b3c', color: 'white',
              border: 'none', borderRadius: '8px',
              fontSize: '16px', fontWeight: 'bold',
              cursor: 'pointer', marginTop: '8px'
            }}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
          Already have an account?{' '}
          <span
            onClick={() => navigate('/login')}
            style={{ color: '#1a6b3c', cursor: 'pointer', fontWeight: 'bold' }}>
            Login here
          </span>
        </p>
      </div>
    </div>
  );
}

export default Register;
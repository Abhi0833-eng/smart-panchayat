import React from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a6b3c, #2d9e5f)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif',
      color: 'white'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ fontSize: '60px', marginBottom: '10px' }}>🏛️</div>
        <h1 style={{ fontSize: '36px', margin: '0', fontWeight: 'bold' }}>
          Smart Panchayat
        </h1>
        <p style={{ fontSize: '18px', margin: '10px 0', opacity: '0.9' }}>
          डिजिटल ग्राम सेवा | Digital Village Service
        </p>
        <p style={{ fontSize: '14px', opacity: '0.8' }}>
          File complaints, track status, access government schemes
        </p>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
        <button
          onClick={() => navigate('/login')}
          style={{
            padding: '14px 40px',
            fontSize: '16px',
            backgroundColor: 'white',
            color: '#1a6b3c',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}>
          Login
        </button>
        <button
          onClick={() => navigate('/register')}
          style={{
            padding: '14px 40px',
            fontSize: '16px',
            backgroundColor: 'transparent',
            color: 'white',
            border: '2px solid white',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}>
          Register
        </button>
      </div>

      {/* Features */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { icon: '📝', title: 'File Complaints', desc: 'Submit issues easily' },
          { icon: '🔍', title: 'Track Status', desc: 'Real time updates' },
          { icon: '📋', title: 'Schemes', desc: 'Government benefits' },
          { icon: '🔔', title: 'Notifications', desc: 'Stay informed' }
        ].map((feature, index) => (
          <div key={index} style={{
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center',
            width: '140px'
          }}>
            <div style={{ fontSize: '30px' }}>{feature.icon}</div>
            <div style={{ fontWeight: 'bold', marginTop: '8px' }}>{feature.title}</div>
            <div style={{ fontSize: '12px', opacity: '0.8' }}>{feature.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;
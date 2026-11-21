import React from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();
  const features = [
    { icon: '📝', title: 'Report an issue', desc: 'Tell your Panchayat what needs attention.' },
    { icon: '🧭', title: 'Follow progress', desc: 'See status changes and the responsible department.' },
    { icon: '🤝', title: 'Close the loop', desc: 'Share feedback or reopen an issue that remains.' }
  ];

  return (
    <main className="landing-page">
      <nav className="landing-nav">
        <div className="portal-brand">
          <span className="brand-mark" aria-hidden="true">🏛️</span>
          <span><strong>Smart Panchayat</strong><small>Digital Village Service</small></span>
        </div>
        <div className="heading-actions">
          <button type="button" className="button button-quiet" style={{ color: 'var(--green-800)' }} onClick={() => navigate('/login')}>Sign in</button>
          <button type="button" className="button button-primary" onClick={() => navigate('/register')}>Create account</button>
        </div>
      </nav>
      <section className="landing-hero">
        <div className="landing-copy">
          <p className="eyebrow">Your voice. Your village.</p>
          <h1>Better local services start with being heard.</h1>
          <p>Report everyday issues, follow their progress and stay connected with your Panchayat in one place.</p>
          <div className="heading-actions">
            <button type="button" className="button button-primary" onClick={() => navigate('/register')}>Get started <span aria-hidden="true">→</span></button>
            <button type="button" className="button button-light" onClick={() => navigate('/login')}>I already have an account</button>
          </div>
        </div>
        <div className="landing-illustration" aria-hidden="true">
          <span className="illustration-sun" />
          <span className="illustration-building">🏛️</span>
          <span className="illustration-leaf">🌿</span>
          <div className="illustration-card"><span className="illustration-check">✓</span><span><strong>Issue tracked</strong><small>Updates in one place</small></span></div>
        </div>
      </section>
      <section className="landing-features">
        <p className="eyebrow">From report to resolution</p>
        <h2>A simple, transparent process.</h2>
        <div className="feature-grid">
          {features.map((feature) => (
            <article className="feature-card" key={feature.title}>
              <span className="feature-icon">{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </article>
          ))}
        </div>
      </section>
      <footer className="landing-footer">Smart Panchayat · Digital ग्राम सेवा</footer>
    </main>
  );
}

export default Home;

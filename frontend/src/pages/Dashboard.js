import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'https://smart-panchayat-r33v.onrender.com';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', category: 'water', village: ''
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!userData || !token) { navigate('/login'); return; }
    setUser(JSON.parse(userData));
    fetchComplaints(token);
  }, [navigate]);

  const fetchComplaints = async (token) => {
    try {
      const res = await axios.get(`${API}/api/complaints/my`, {
        headers: { Authorization: token }
      });
      setComplaints(res.data.complaints);
    } catch (err) {
      console.log('Error fetching complaints');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${API}/api/complaints`, formData, {
        headers: { Authorization: token }
      });
      setMessage('Complaint submitted successfully!');
      setShowForm(false);
      setFormData({ title: '', description: '', category: 'water', village: '' });
      fetchComplaints(token);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Error submitting complaint');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const getStatusColor = (status) => {
    if (status === 'pending') return '#ff9800';
    if (status === 'in-progress') return '#2196f3';
    if (status === 'resolved') return '#4caf50';
    return '#666';
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Arial, sans-serif' }}>
      <div style={{
        background: '#1a6b3c', color: 'white',
        padding: '16px 24px', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🏛️</span>
          <span style={{ fontWeight: 'bold', fontSize: '18px' }}>Smart Panchayat</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>👤 {user?.name}</span>
          <button onClick={handleLogout} style={{
            background: 'rgba(255,255,255,0.2)', color: 'white',
            border: '1px solid white', padding: '8px 16px',
            borderRadius: '6px', cursor: 'pointer'
          }}>Logout</button>
        </div>
      </div>

      <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{
          background: 'white', borderRadius: '12px',
          padding: '24px', marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 8px', color: '#1a6b3c' }}>Welcome, {user?.name}! 👋</h2>
          <p style={{ margin: '0', color: '#666' }}>Manage your complaints and track their status here.</p>
        </div>

        {message && (
          <div style={{
            background: '#e0ffe0', color: '#006600',
            padding: '12px', borderRadius: '8px', marginBottom: '20px'
          }}>{message}</div>
        )}

        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {[
            { label: 'Total Complaints', value: complaints.length, color: '#1a6b3c' },
            { label: 'Pending', value: complaints.filter(c => c.status === 'pending').length, color: '#ff9800' },
            { label: 'In Progress', value: complaints.filter(c => c.status === 'in-progress').length, color: '#2196f3' },
            { label: 'Resolved', value: complaints.filter(c => c.status === 'resolved').length, color: '#4caf50' }
          ].map((stat, i) => (
            <div key={i} style={{
              background: 'white', borderRadius: '12px',
              padding: '20px', flex: '1', minWidth: '150px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textAlign: 'center'
            }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
              <div style={{ color: '#666', fontSize: '14px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <button onClick={() => setShowForm(!showForm)} style={{
          background: '#1a6b3c', color: 'white', border: 'none',
          padding: '12px 24px', borderRadius: '8px', fontSize: '16px',
          cursor: 'pointer', marginBottom: '24px', fontWeight: 'bold'
        }}>
          {showForm ? '✕ Cancel' : '+ New Complaint'}
        </button>

        {showForm && (
          <div style={{
            background: 'white', borderRadius: '12px',
            padding: '24px', marginBottom: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 20px', color: '#1a6b3c' }}>Submit New Complaint</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#333' }}>Title</label>
                <input type="text" value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Brief title of your complaint" required
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#333' }}>Category</label>
                <select value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}>
                  <option value="water">Water</option>
                  <option value="road">Road</option>
                  <option value="electricity">Electricity</option>
                  <option value="sanitation">Sanitation</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#333' }}>Village</label>
                <input type="text" value={formData.village}
                  onChange={e => setFormData({ ...formData, village: e.target.value })}
                  placeholder="Your village name" required
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#333' }}>Description</label>
                <textarea value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your complaint in detail" required rows={4}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', boxSizing: 'border-box' }} />
              </div>
              <button type="submit" style={{
                background: '#1a6b3c', color: 'white', border: 'none',
                padding: '12px 32px', borderRadius: '8px', fontSize: '16px',
                cursor: 'pointer', fontWeight: 'bold'
              }}>Submit Complaint</button>
            </form>
          </div>
        )}

        <div>
          <h3 style={{ color: '#333', marginBottom: '16px' }}>My Complaints</h3>
          {complaints.length === 0 ? (
            <div style={{
              background: 'white', borderRadius: '12px', padding: '40px',
              textAlign: 'center', color: '#666', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              No complaints yet. Click "New Complaint" to submit one!
            </div>
          ) : (
            complaints.map((complaint) => (
              <div key={complaint._id} style={{
                background: 'white', borderRadius: '12px',
                padding: '20px', marginBottom: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h4 style={{ margin: '0 0 8px', color: '#333' }}>{complaint.title}</h4>
                    <p style={{ margin: '0 0 8px', color: '#666', fontSize: '14px' }}>{complaint.description}</p>
                    <span style={{ fontSize: '12px', color: '#999' }}>
                      📍 {complaint.village} | 🏷️ {complaint.category}
                    </span>
                  </div>
                  <span style={{
                    background: getStatusColor(complaint.status), color: 'white',
                    padding: '4px 12px', borderRadius: '20px',
                    fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap'
                  }}>{complaint.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
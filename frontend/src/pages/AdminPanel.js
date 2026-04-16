import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'https://smart-panchayat-r33v.onrender.com';

function AdminPanel() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    if (!user || !token) { navigate('/login'); return; }
    if (user.role !== 'admin') { navigate('/dashboard'); return; }
    fetchAllComplaints(token);
  }, [navigate]);

  const fetchAllComplaints = async (token) => {
    try {
      const res = await axios.get(`${API}/api/complaints`, {
        headers: { Authorization: token }
      });
      const data = res.data.complaints;
      setComplaints(data);
      setStats({
        total: data.length,
        pending: data.filter(c => c.status === 'pending').length,
        inProgress: data.filter(c => c.status === 'in-progress').length,
        resolved: data.filter(c => c.status === 'resolved').length
      });
      setLoading(false);
    } catch (err) {
      console.log('Error fetching complaints');
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`${API}/api/complaints/${id}/status`,
        { status },
        { headers: { Authorization: token } }
      );
      setMessage(`Status updated to "${status}" successfully!`);
      fetchAllComplaints(token);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Error updating status');
    }
  };

  const getStatusColor = (status) => {
    if (status === 'pending') return '#ff9800';
    if (status === 'in-progress') return '#2196f3';
    if (status === 'resolved') return '#4caf50';
    return '#666';
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Arial, sans-serif' }}>
      <div style={{
        background: '#1a3a6b', color: 'white',
        padding: '16px 24px', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>⚙️</span>
          <span style={{ fontWeight: 'bold', fontSize: '18px' }}>Admin Panel — Smart Panchayat</span>
        </div>
        <button onClick={handleLogout} style={{
          background: 'rgba(255,255,255,0.2)', color: 'white',
          border: '1px solid white', padding: '8px 16px',
          borderRadius: '6px', cursor: 'pointer'
        }}>Logout</button>
      </div>

      <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {[
            { label: 'Total Complaints', value: stats.total, color: '#1a3a6b' },
            { label: 'Pending', value: stats.pending, color: '#ff9800' },
            { label: 'In Progress', value: stats.inProgress, color: '#2196f3' },
            { label: 'Resolved', value: stats.resolved, color: '#4caf50' }
          ].map((stat, i) => (
            <div key={i} style={{
              background: 'white', borderRadius: '12px',
              padding: '20px', flex: '1', minWidth: '150px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textAlign: 'center'
            }}>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
              <div style={{ color: '#666', fontSize: '14px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {message && (
          <div style={{
            background: '#e0ffe0', color: '#006600',
            padding: '12px', borderRadius: '8px', marginBottom: '20px'
          }}>{message}</div>
        )}

        <div style={{
          background: 'white', borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden'
        }}>
          <div style={{
            padding: '20px 24px', borderBottom: '1px solid #eee',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <h3 style={{ margin: 0, color: '#1a3a6b' }}>All Complaints</h3>
            <span style={{ color: '#666', fontSize: '14px' }}>{complaints.length} total</span>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Loading complaints...</div>
          ) : complaints.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>No complaints yet.</div>
          ) : (
            complaints.map((complaint) => (
              <div key={complaint._id} style={{
                padding: '20px 24px', borderBottom: '1px solid #f0f0f0',
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'flex-start', gap: '16px'
              }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 6px', color: '#333' }}>{complaint.title}</h4>
                  <p style={{ margin: '0 0 8px', color: '#666', fontSize: '14px' }}>{complaint.description}</p>
                  <div style={{ fontSize: '12px', color: '#999', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <span>📍 {complaint.village}</span>
                    <span>🏷️ {complaint.category}</span>
                    <span>👤 {complaint.citizen?.name || 'Unknown'}</span>
                    <span>📧 {complaint.citizen?.email || ''}</span>
                    <span>📅 {new Date(complaint.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                  <span style={{
                    background: getStatusColor(complaint.status),
                    color: 'white', padding: '4px 12px',
                    borderRadius: '20px', fontSize: '12px', fontWeight: 'bold'
                  }}>{complaint.status}</span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {complaint.status !== 'in-progress' && (
                      <button onClick={() => updateStatus(complaint._id, 'in-progress')}
                        style={{ background: '#2196f3', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                        In Progress
                      </button>
                    )}
                    {complaint.status !== 'resolved' && (
                      <button onClick={() => updateStatus(complaint._id, 'resolved')}
                        style={{ background: '#4caf50', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                        Resolve
                      </button>
                    )}
                    {complaint.status !== 'pending' && (
                      <button onClick={() => updateStatus(complaint._id, 'pending')}
                        style={{ background: '#ff9800', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                        Pending
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
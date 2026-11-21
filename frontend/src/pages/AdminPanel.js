import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API from '../config/api';
import PortalHeader from '../components/PortalHeader';
import { filterComplaints } from '../utils/complaints';
import { clearSession, getSession } from '../utils/session';

const departments = ['Public Works', 'Water & Sanitation', 'Electricity', 'Health Services', 'General Administration'];
const priorities = ['low', 'medium', 'high', 'urgent'];
const statuses = ['all', 'pending', 'in-progress', 'resolved'];
const statusNames = { pending: 'Pending', 'in-progress': 'In progress', resolved: 'Resolved' };

function formatDate(value) {
  if (!value) return 'Not set';
  return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function dateInputValue(value) {
  if (!value) return '';
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function AdminComplaintCard({ complaint, onStatusUpdate, onAssignmentSave, busy }) {
  const [note, setNote] = useState('');
  const [assignedDepartment, setAssignedDepartment] = useState(complaint.assignedDepartment || '');
  const [priority, setPriority] = useState(complaint.priority || 'medium');
  const [dueAt, setDueAt] = useState(dateInputValue(complaint.dueAt));
  const isOverdue = complaint.status !== 'resolved' && complaint.dueAt && new Date(complaint.dueAt) < new Date();

  useEffect(() => {
    setAssignedDepartment(complaint.assignedDepartment || '');
    setPriority(complaint.priority || 'medium');
    setDueAt(dateInputValue(complaint.dueAt));
  }, [complaint.assignedDepartment, complaint.priority, complaint.dueAt]);

  return (
    <article className="complaint-card" id={`complaint-${complaint._id}`}>
      <div className="complaint-main">
        <div className="complaint-topline">
          <div>
            <h3 className="complaint-title">{complaint.title}</h3>
            <p className="complaint-description">{complaint.description}</p>
          </div>
          <div className="complaint-badges">
            <span className={`priority-pill priority-${complaint.priority || 'medium'}`}>{complaint.priority || 'medium'} priority</span>
            <span className={`status-pill status-${complaint.status}`}>{statusNames[complaint.status] || complaint.status}</span>
          </div>
        </div>
        <div className="meta-list">
          <span>📍 {complaint.village}</span>
          <span>🏷️ {complaint.category}</span>
          <span>📅 Submitted {new Date(complaint.createdAt).toLocaleDateString('en-IN')}</span>
          <span className={isOverdue ? 'overdue' : ''}>⏱ Target: {formatDate(complaint.dueAt)}{isOverdue ? ' · Overdue' : ''}</span>
        </div>
        <div className="admin-citizen" style={{ marginTop: 10 }}>
          Reported by <strong>{complaint.citizen?.name || 'Unknown citizen'}</strong>
          {complaint.citizen?.email ? ` · ${complaint.citizen.email}` : ''}
          {complaint.citizen?.phone ? ` · ${complaint.citizen.phone}` : ''}
        </div>
        {complaint.photo?.data && (
          <img className="photo-preview" alt={`Evidence for ${complaint.title}`} src={`data:${complaint.photo.mimeType};base64,${complaint.photo.data}`} />
        )}
        {complaint.location && (
          <a className="map-link" href={`https://www.openstreetmap.org/?mlat=${complaint.location.latitude}&mlon=${complaint.location.longitude}#map=16/${complaint.location.latitude}/${complaint.location.longitude}`} target="_blank" rel="noreferrer">
            View reported location ↗
          </a>
        )}
        <div className="timeline" aria-label="Complaint status history">
          {(complaint.statusHistory?.length ? complaint.statusHistory : [{ status: complaint.status, note: 'Current status', changedAt: complaint.updatedAt }])
            .slice().reverse().map((entry, index) => (
              <div className="timeline-item" key={`${entry.status}-${entry.changedAt}-${index}`}>
                <span className="timeline-dot" />
                <div className="timeline-content">
                  <strong>{statusNames[entry.status] || entry.status}</strong>
                  {entry.note && <p>{entry.note}</p>}
                  <small>{entry.changedBy?.name ? `Updated by ${entry.changedBy.name} · ` : ''}{formatDate(entry.changedAt)}</small>
                </div>
              </div>
            ))}
        </div>
        {complaint.feedbackHistory?.length > 0 && (
          <div className="feedback-panel">
            <h4>Citizen feedback</h4>
            {complaint.feedbackHistory.map((feedback, index) => (
              <div className="feedback-display" key={`${feedback.submittedAt}-${index}`}>
                <strong aria-label={`${feedback.rating} out of 5 stars`}>{'★'.repeat(feedback.rating)}{'☆'.repeat(5 - feedback.rating)}</strong>
                {feedback.comment && <div>{feedback.comment}</div>}
                <small>{formatDate(feedback.submittedAt)}</small>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="card-footer">
        <form onSubmit={(event) => {
          event.preventDefault();
          onAssignmentSave(complaint._id, { assignedDepartment, priority, dueAt });
        }}>
          <div className="admin-controls">
            <div className="form-field">
              <label htmlFor={`department-${complaint._id}`}>Responsible department</label>
              <select id={`department-${complaint._id}`} value={assignedDepartment} onChange={(event) => setAssignedDepartment(event.target.value)}>
                <option value="">Not assigned</option>
                {departments.map((department) => <option key={department} value={department}>{department}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor={`priority-${complaint._id}`}>Priority</label>
              <select id={`priority-${complaint._id}`} value={priority} onChange={(event) => setPriority(event.target.value)}>
                {priorities.map((value) => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor={`due-${complaint._id}`}>Target resolution date</label>
              <input id={`due-${complaint._id}`} type="date" value={dueAt} onChange={(event) => setDueAt(event.target.value)} />
            </div>
            <div className="admin-control-actions">
              <button className="button button-dark button-small" type="submit" disabled={busy}>
                {busy ? 'Saving…' : 'Save assignment'}
              </button>
            </div>
          </div>
        </form>
        <div className="divider" />
        <div className="form-field">
          <label htmlFor={`note-${complaint._id}`}>Update note (shown to citizen)</label>
          <input id={`note-${complaint._id}`} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)}
            placeholder="Optional: explain what is happening next" />
        </div>
        <div className="status-action-row" aria-label="Update complaint status">
          {['pending', 'in-progress', 'resolved'].filter((status) => status !== complaint.status).map((status) => (
            <button type="button" className="button button-status button-small" key={status} disabled={busy}
              onClick={() => onStatusUpdate(complaint._id, status, note)}>
              Mark {statusNames[status]}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}

function Breakdown({ title, entries, total }) {
  return (
    <section className="analytics-card">
      <h3>{title}</h3>
      {entries.length === 0 ? <p className="metric-caption">No data to show yet.</p> : entries.map(([name, count]) => (
        <div className="breakdown-row" key={name}>
          <span title={name}>{name}</span>
          <span
            className="bar-track"
            role="progressbar"
            aria-label={`${name} complaints`}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={count}
          >
            <span className="bar-fill" style={{ width: `${Math.max((count / total) * 100, 3)}%` }} />
          </span>
          <strong>{count}</strong>
        </div>
      ))}
    </section>
  );
}

function AdminPanel() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { token, user: sessionUser } = useMemo(() => getSession(), []);

  const fetchComplaints = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/api/complaints`, {
        headers: { Authorization: token }
      });
      setComplaints(response.data.complaints);
      setError('');
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        clearSession();
        navigate('/login', { replace: true });
        return;
      }
      setError(requestError.response?.data?.message || 'Could not load complaints.');
    } finally {
      setLoading(false);
    }
  }, [navigate, token]);

  useEffect(() => {
    if (!token || !sessionUser) {
      navigate('/login', { replace: true });
      return;
    }
    setUser(sessionUser);
    fetchComplaints();
    const timer = window.setInterval(fetchComplaints, 30000);
    return () => window.clearInterval(timer);
  }, [fetchComplaints, navigate, sessionUser, token]);

  const stats = useMemo(() => {
    const now = new Date();
    const resolved = complaints.filter((item) => item.resolvedAt);
    const avgDays = resolved.length
      ? resolved.reduce((total, item) => total + ((new Date(item.resolvedAt) - new Date(item.createdAt)) / 86400000), 0) / resolved.length
      : null;
    return {
      all: complaints.length,
      pending: complaints.filter((item) => item.status === 'pending').length,
      'in-progress': complaints.filter((item) => item.status === 'in-progress').length,
      resolved: complaints.filter((item) => item.status === 'resolved').length,
      overdue: complaints.filter((item) => item.status !== 'resolved' && item.dueAt && new Date(item.dueAt) < now).length,
      avgDays
    };
  }, [complaints]);

  const visibleComplaints = useMemo(() => filterComplaints(
    complaints,
    activeFilter,
    search,
    ['title', 'description', 'category', 'village', 'assignedDepartment', 'citizen.name', 'citizen.email']
  ), [activeFilter, complaints, search]);

  const categoryBreakdown = useMemo(() => {
    const counts = complaints.reduce((result, complaint) => {
      result[complaint.category] = (result[complaint.category] || 0) + 1;
      return result;
    }, {});
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [complaints]);

  const villageBreakdown = useMemo(() => {
    const counts = complaints.reduce((result, complaint) => {
      result[complaint.village] = (result[complaint.village] || 0) + 1;
      return result;
    }, {});
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [complaints]);

  const handleStatusUpdate = async (id, status, note) => {
    setBusyId(id);
    setError('');
    setSuccess('');
    try {
      await axios.put(`${API}/api/complaints/${id}/status`, { status, note }, {
        headers: { Authorization: token }
      });
      setSuccess(`Complaint status updated to ${statusNames[status].toLowerCase()}. A notification was saved for the citizen.`);
      await fetchComplaints();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Status update failed. Please try again.');
    } finally {
      setBusyId('');
    }
  };

  const handleAssignmentSave = async (id, assignment) => {
    setBusyId(id);
    setError('');
    setSuccess('');
    try {
      await axios.put(`${API}/api/complaints/${id}/assignment`, {
        ...assignment,
        dueAt: assignment.dueAt ? new Date(`${assignment.dueAt}T23:59:59`).toISOString() : null
      }, { headers: { Authorization: token } });
      setSuccess('Department, priority and target date saved. A notification was saved for the citizen.');
      await fetchComplaints();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Assignment could not be saved.');
    } finally {
      setBusyId('');
    }
  };

  const statCards = [
    { key: 'all', label: 'All complaints', icon: '▦', tone: 'blue', value: stats.all },
    { key: 'pending', label: 'Awaiting action', icon: '◷', tone: 'orange', value: stats.pending },
    { key: 'in-progress', label: 'Being handled', icon: '↗', tone: 'blue', value: stats['in-progress'] },
    { key: 'resolved', label: 'Resolved', icon: '✓', tone: 'green', value: stats.resolved }
  ];

  return (
    <div className="portal-shell">
      <PortalHeader user={user} isAdmin />
      <main className="page-content">
        <section className="welcome-panel admin-welcome">
          <div className="welcome-copy">
            <p className="eyebrow">Panchayat operations</p>
            <h1>Good morning, {user?.name || 'Admin'}.</h1>
            <p>Review incoming issues, coordinate departments and keep residents informed.</p>
          </div>
          <div className="welcome-icon" aria-hidden="true">🧭</div>
        </section>

        {error && <div className="error-banner" role="alert">{error}</div>}
        {success && <div className="success-banner" role="status">{success}</div>}

        <section className="stats-grid" aria-label="Complaint status summary">
          {statCards.map((stat) => (
            <button type="button" key={stat.key} data-tone={stat.tone}
              className={`stat-card${activeFilter === stat.key ? ' is-active' : ''}`}
              aria-pressed={activeFilter === stat.key}
              onClick={() => setActiveFilter(stat.key)}>
              <span className="stat-icon" aria-hidden="true">{stat.icon}</span>
              <span><strong className="stat-number">{stat.value}</strong><small className="stat-label">{stat.label}</small></span>
            </button>
          ))}
        </section>

        <section className="analytics-grid" aria-label="Complaint analytics">
          <div className="analytics-card">
            <h3>Resolution performance</h3>
            <div className="metric-large">{stats.avgDays === null ? '—' : `${stats.avgDays.toFixed(1)} days`}</div>
            <div className="metric-caption">Average time to resolve complaints with a recorded resolution date.</div>
            <div className="divider" />
            <div className="metric-large" style={{ fontSize: 22 }}>{stats.overdue}</div>
            <div className="metric-caption">Open complaints past their target date.</div>
          </div>
          <Breakdown title="Issues by category" entries={categoryBreakdown} total={Math.max(stats.all, 1)} />
          <Breakdown title="Top villages by reports" entries={villageBreakdown} total={Math.max(stats.all, 1)} />
        </section>

        <section aria-labelledby="admin-complaints-heading">
          <div className="section-heading">
            <div><h2 id="admin-complaints-heading">Complaint queue</h2><p>Assign a department, set urgency and share progress with the citizen.</p></div>
            <span className="filter-label">{visibleComplaints.length} shown · {complaints.length} total</span>
          </div>
          <div className="filter-row">
            <div className="filter-chips" role="group" aria-label="Filter complaint status">
              {statuses.map((status) => (
                <button type="button" key={status} className={`filter-chip${activeFilter === status ? ' active' : ''}`}
                  aria-pressed={activeFilter === status} onClick={() => setActiveFilter(status)}>
                  {status === 'all' ? 'All' : statusNames[status]}
                  {' '}({status === 'all' ? stats.all : stats[status]})
                </button>
              ))}
            </div>
            <input className="search-field" type="search" value={search} onChange={(event) => setSearch(event.target.value)}
              placeholder="Search complaints, citizen or village" aria-label="Search all complaints" />
          </div>

          {loading ? (
            <div className="empty-state"><span>⏳</span><strong>Loading the complaint queue</strong><p>Fetching the latest reports.</p></div>
          ) : visibleComplaints.length === 0 ? (
            <div className="empty-state"><span>{complaints.length ? '🔎' : '✅'}</span><strong>{complaints.length ? 'No complaints match these filters' : 'No complaints have been submitted yet'}</strong><p>{complaints.length ? 'Try another status or search term.' : 'New citizen reports will appear here.'}</p></div>
          ) : (
            <div className="complaint-list">
              {visibleComplaints.map((complaint) => (
                <AdminComplaintCard key={complaint._id} complaint={complaint}
                  onStatusUpdate={handleStatusUpdate} onAssignmentSave={handleAssignmentSave} busy={busyId === complaint._id} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminPanel;

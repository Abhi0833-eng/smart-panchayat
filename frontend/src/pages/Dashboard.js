import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API from '../config/api';
import PortalHeader from '../components/PortalHeader';
import { filterComplaints } from '../utils/complaints';
import { clearSession, getSession } from '../utils/session';

const statusNames = {
  pending: 'Pending',
  'in-progress': 'In progress',
  resolved: 'Resolved'
};

const emptyForm = { title: '', description: '', category: 'water', village: '' };

function formatDate(value) {
  if (!value) return 'Not set';
  return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function ComplaintTimeline({ complaint }) {
  const history = complaint.statusHistory?.length
    ? complaint.statusHistory
    : [{ status: complaint.status, note: 'Current status', changedAt: complaint.updatedAt }];

  return (
    <div className="timeline" aria-label="Complaint status history">
      {history.slice().reverse().map((entry, index) => (
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
  );
}

function FeedbackForm({ complaint, token, onSaved, onError }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const feedbackHistory = complaint.feedbackHistory || [];
  const latestFeedback = feedbackHistory[feedbackHistory.length - 1];
  const alreadyRated = latestFeedback && (
    !complaint.resolvedAt || new Date(latestFeedback.submittedAt) >= new Date(complaint.resolvedAt)
  );

  const submitFeedback = async (event) => {
    event.preventDefault();
    setSaving(true);
    onError('');
    try {
      const response =       await axios.post(`${API}/api/complaints/${complaint._id}/feedback`, { rating, comment }, {
        headers: { Authorization: token }
      });
      await onSaved();
    } catch (error) {
      onError(error.response?.data?.message || 'Feedback could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  if (alreadyRated) {
    return (
      <div className="feedback-panel">
        <h4>Your feedback</h4>
        <div className="feedback-display">
          <strong aria-label={`${latestFeedback.rating} out of 5 stars`}>{'★'.repeat(latestFeedback.rating)}{'☆'.repeat(5 - latestFeedback.rating)}</strong>
          {latestFeedback.comment && <div>{latestFeedback.comment}</div>}
          <small>{formatDate(latestFeedback.submittedAt)}</small>
        </div>
      </div>
    );
  }

  return (
    <form className="feedback-panel" onSubmit={submitFeedback}>
      <h4>Was this issue resolved to your satisfaction?</h4>
      <div className="star-rating" role="group" aria-label="Rate this resolution">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            type="button"
            className={value <= rating ? 'selected' : ''}
            key={value}
            aria-label={`${value} star${value === 1 ? '' : 's'}`}
            aria-pressed={rating === value}
            onClick={() => setRating(value)}
          >★</button>
        ))}
      </div>
      <div className="form-field" style={{ marginTop: 8 }}>
        <label htmlFor={`feedback-${complaint._id}`}>Optional comment</label>
        <textarea id={`feedback-${complaint._id}`} value={comment} maxLength={1000}
          onChange={(event) => setComment(event.target.value)} placeholder="Tell us what went well or what could improve." />
      </div>
      <div className="form-actions">
        <button className="button button-primary button-small" disabled={saving || !rating} type="submit">
          {saving ? 'Saving…' : 'Send feedback'}
        </button>
        <span className="form-help">Your rating is saved with this complaint.</span>
      </div>
    </form>
  );
}

function ComplaintCard({ complaint, token, refresh, setError, setSuccess }) {
  const [showReopen, setShowReopen] = useState(false);
  const [reason, setReason] = useState('');
  const [reopening, setReopening] = useState(false);

  const reopenComplaint = async (event) => {
    event.preventDefault();
    setReopening(true);
    setError('');
    try {
      await axios.post(`${API}/api/complaints/${complaint._id}/reopen`, { reason }, {
        headers: { Authorization: token }
      });
      setShowReopen(false);
      setReason('');
      setSuccess('Complaint reopened and the administration team has been notified.');
      await refresh();
    } catch (error) {
      setError(error.response?.data?.message || 'The complaint could not be reopened.');
    } finally {
      setReopening(false);
    }
  };

  const coordinates = complaint.location;
  return (
    <article className="complaint-card" id={`complaint-${complaint._id}`}>
      <div className="complaint-main">
        <div className="complaint-topline">
          <div>
            <h3 className="complaint-title">{complaint.title}</h3>
            <p className="complaint-description">{complaint.description}</p>
          </div>
          <div className="complaint-badges">
            <span className={`status-pill status-${complaint.status}`}>{statusNames[complaint.status] || complaint.status}</span>
          </div>
        </div>
        <div className="meta-list">
          <span>📍 {complaint.village}</span>
          <span>🏷️ {complaint.category}</span>
          <span>📅 Submitted {new Date(complaint.createdAt).toLocaleDateString('en-IN')}</span>
          {complaint.assignedDepartment && <span>🏢 {complaint.assignedDepartment}</span>}
        </div>
        {complaint.photo?.data && (
          <img className="photo-preview" alt={`Evidence for ${complaint.title}`} src={`data:${complaint.photo.mimeType};base64,${complaint.photo.data}`} />
        )}
        {coordinates && (
          <a className="map-link" href={`https://www.openstreetmap.org/?mlat=${coordinates.latitude}&mlon=${coordinates.longitude}#map=16/${coordinates.latitude}/${coordinates.longitude}`} target="_blank" rel="noreferrer">
            View reported location ↗
          </a>
        )}
        <ComplaintTimeline complaint={complaint} />
        {complaint.status === 'resolved' && (
          <>
            <FeedbackForm
              complaint={complaint}
              token={token}
              onSaved={async () => {
                setSuccess('Thank you for your feedback. It has been saved.');
                await refresh();
              }}
              onError={setError}
            />
            <button type="button" className="subtle-link" onClick={() => setShowReopen((visible) => !visible)}>
              The issue is still not fixed? Reopen this complaint
            </button>
            {showReopen && (
              <form className="feedback-panel" onSubmit={reopenComplaint}>
                <div className="form-field">
                  <label htmlFor={`reopen-${complaint._id}`}>Why does it need more attention?</label>
                  <textarea id={`reopen-${complaint._id}`} value={reason} onChange={(event) => setReason(event.target.value)}
                    required maxLength={500} placeholder="Describe what remains unresolved." />
                </div>
                <div className="form-actions">
                  <button className="button button-primary button-small" type="submit" disabled={reopening || !reason.trim()}>
                    {reopening ? 'Reopening…' : 'Reopen complaint'}
                  </button>
                  <button className="button button-light button-small" type="button" onClick={() => setShowReopen(false)}>Cancel</button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </article>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [photo, setPhoto] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { token, user: sessionUser } = useMemo(() => getSession(), []);

  const fetchComplaints = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/api/complaints/my`, {
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
      setError(requestError.response?.data?.message || 'Could not load your complaints. Please try again.');
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

  const counts = useMemo(() => ({
    all: complaints.length,
    pending: complaints.filter((item) => item.status === 'pending').length,
    'in-progress': complaints.filter((item) => item.status === 'in-progress').length,
    resolved: complaints.filter((item) => item.status === 'resolved').length
  }), [complaints]);

  const visibleComplaints = useMemo(() => filterComplaints(
    complaints,
    activeFilter,
    search,
    ['title', 'description', 'category', 'village']
  ), [activeFilter, complaints, search]);

  const submitComplaint = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await axios.post(`${API}/api/complaints`, {
        ...formData,
        ...(photo ? { photo } : {}),
        ...(location ? { location } : {})
      }, { headers: { Authorization: token } });
      setSuccess('Your complaint is in. You’ll see updates here as it moves forward.');
      setShowForm(false);
      setFormData(emptyForm);
      setPhoto(null);
      setLocation(null);
      await fetchComplaints();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Complaint could not be submitted. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setError('Choose a JPEG, PNG or WebP photo under 2 MB.');
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto({ mimeType: file.type, data: reader.result });
    reader.onerror = () => setError('The selected photo could not be read.');
    reader.readAsDataURL(file);
    setError('');
  };

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setError('Location sharing is not available in this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setError('');
      },
      () => setError('Location could not be accessed. You can still submit without it.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const stats = [
    { key: 'all', label: 'Total complaints', icon: '▦', tone: 'green', value: counts.all },
    { key: 'pending', label: 'Awaiting action', icon: '◷', tone: 'orange', value: counts.pending },
    { key: 'in-progress', label: 'In progress', icon: '↗', tone: 'blue', value: counts['in-progress'] },
    { key: 'resolved', label: 'Resolved', icon: '✓', tone: 'green', value: counts.resolved }
  ];

  return (
    <div className="portal-shell">
      <PortalHeader user={user} />
      <main className="page-content">
        <section className="welcome-panel">
          <div className="welcome-copy">
            <p className="eyebrow">Your village, heard</p>
            <h1>Good to see you, {user?.name || 'there'}.</h1>
            <p>Raise an issue and follow every update until it’s resolved.</p>
          </div>
          <div className="welcome-icon" aria-hidden="true">🌱</div>
        </section>

        {error && <div className="error-banner" role="alert">{error}</div>}
        {success && <div className="success-banner" role="status">{success}</div>}

        <section className="stats-grid" aria-label="Complaint status summary">
          {stats.map((stat) => (
            <button type="button" key={stat.key} data-tone={stat.tone}
              className={`stat-card${activeFilter === stat.key ? ' is-active' : ''}`}
              aria-pressed={activeFilter === stat.key}
              onClick={() => setActiveFilter(stat.key)}>
              <span className="stat-icon" aria-hidden="true">{stat.icon}</span>
              <span><strong className="stat-number">{stat.value}</strong><small className="stat-label">{stat.label}</small></span>
            </button>
          ))}
        </section>

        <section aria-labelledby="complaints-heading">
          <div className="section-heading">
            <div>
              <h2 id="complaints-heading">Your complaints</h2>
              <p>Updates and feedback stay connected to each issue.</p>
            </div>
            <button type="button" className="button button-primary" onClick={() => {
              setShowForm((visible) => !visible);
              setError('');
            }}>
              {showForm ? 'Close form' : '+ Raise an issue'}
            </button>
          </div>

          {showForm && (
            <form className="complaint-card complaint-main" onSubmit={submitComplaint}>
              <div className="section-heading" style={{ marginTop: 0 }}>
                <div><h3>Tell us what needs attention</h3><p>Fields marked with * are required.</p></div>
              </div>
              <div className="form-grid">
                <div className="form-field span-two">
                  <label htmlFor="complaint-title">Issue title *</label>
                  <input id="complaint-title" value={formData.title} maxLength={120} required
                    onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                    placeholder="For example: Street light not working" />
                </div>
                <div className="form-field">
                  <label htmlFor="complaint-category">Category *</label>
                  <select id="complaint-category" value={formData.category}
                    onChange={(event) => setFormData({ ...formData, category: event.target.value })}>
                    <option value="water">Water</option><option value="road">Roads</option>
                    <option value="electricity">Electricity</option><option value="sanitation">Sanitation</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="complaint-village">Village *</label>
                  <input id="complaint-village" value={formData.village} maxLength={100} required
                    onChange={(event) => setFormData({ ...formData, village: event.target.value })}
                    placeholder="Your village name" />
                </div>
                <div className="form-field span-two">
                  <label htmlFor="complaint-description">What happened? *</label>
                  <textarea id="complaint-description" value={formData.description} maxLength={3000} required
                    onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                    placeholder="Share where it is and how it affects people." />
                </div>
                <div className="form-field">
                  <label htmlFor="complaint-photo">Add a photo (optional)</label>
                  <input id="complaint-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhoto} />
                  <span className="form-help">JPEG, PNG or WebP · up to 2 MB</span>
                  {photo && <button className="subtle-link" type="button" onClick={() => setPhoto(null)}>Remove selected photo</button>}
                </div>
                <div className="form-field">
                  <label>Pin the issue location (optional)</label>
                  <button type="button" className="button button-light" onClick={captureLocation}>
                    {location ? '✓ Location attached' : 'Use my current location'}
                  </button>
                  <span className="form-help">{location ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` : 'Your browser will ask permission.'}</span>
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="button button-primary" disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit complaint'}
                </button>
                <span className="form-help">You’ll receive an in-app update when the status changes.</span>
              </div>
            </form>
          )}

          <div className="filter-row">
            <span className="filter-label">Showing {visibleComplaints.length} of {complaints.length}</span>
            <input className="search-field" type="search" value={search} onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, village or category" aria-label="Search your complaints" />
          </div>

          {loading ? (
            <div className="empty-state"><span>⏳</span><strong>Loading your updates</strong><p>This should only take a moment.</p></div>
          ) : visibleComplaints.length === 0 ? (
            <div className="empty-state">
              <span>{complaints.length ? '🔎' : '📝'}</span>
              <strong>{complaints.length ? 'No complaints match this view' : 'Nothing reported yet'}</strong>
              <p>{complaints.length ? 'Try a different status or search term.' : 'When something needs attention, report it here and track what happens next.'}</p>
            </div>
          ) : (
            <div className="complaint-list">
              {visibleComplaints.map((complaint) => (
                <ComplaintCard key={complaint._id} complaint={complaint} token={token} refresh={fetchComplaints} setError={setError} setSuccess={setSuccess} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;

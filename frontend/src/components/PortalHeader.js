import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API from '../config/api';
import { clearSession, getSession } from '../utils/session';

function PortalHeader({ user, isAdmin }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const { token } = getSession();

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/api/notifications/my`, {
        headers: { Authorization: token }
      });
      setNotifications(response.data.notifications);
      setError('');
    } catch (requestError) {
      setError('Notifications could not be loaded.');
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
    const timer = window.setInterval(fetchNotifications, 30000);
    return () => window.clearInterval(timer);
  }, [fetchNotifications]);

  const markRead = async (notification) => {
    if (notification.readAt) return;
    try {
      await axios.put(`${API}/api/notifications/${notification._id}/read`, {}, {
        headers: { Authorization: token }
      });
      setNotifications((current) => current.map((item) => (
        item._id === notification._id ? { ...item, readAt: new Date().toISOString() } : item
      )));
    } catch (requestError) {
      setError('Could not mark the notification as read.');
    }
  };

  const markAllRead = async () => {
    try {
      await axios.put(`${API}/api/notifications/read-all`, {}, {
        headers: { Authorization: token }
      });
      setNotifications((current) => current.map((item) => (
        { ...item, readAt: item.readAt || new Date().toISOString() }
      )));
    } catch (requestError) {
      setError('Could not mark notifications as read.');
    }
  };

  const switchAccount = () => {
    clearSession();
    navigate('/login', { replace: true });
  };

  const unreadCount = notifications.filter((notification) => !notification.readAt).length;

  return (
    <header className={`portal-header${isAdmin ? ' portal-header-admin' : ''}`}>
      <div className="portal-brand">
        <span className="brand-mark" aria-hidden="true">🏛️</span>
        <span>
          <strong>Smart Panchayat</strong>
          <small>{isAdmin ? 'Administration portal' : 'Citizen services'}</small>
        </span>
      </div>
      <div className="header-actions">
        <div className="notification-wrap">
          <button
            type="button"
            className="icon-button notification-button"
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
            aria-expanded={open}
            onClick={() => {
              setOpen((current) => !current);
              if (!open) fetchNotifications();
            }}
          >
            <span aria-hidden="true">🔔</span>
            {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
          </button>
          {open && (
            <section className="notification-popover" aria-label="Notifications">
              <div className="notification-heading">
                <strong>Updates</strong>
                {unreadCount > 0 && <button type="button" className="text-button" onClick={markAllRead}>Mark all read</button>}
              </div>
              {error && <p className="inline-error">{error}</p>}
              {notifications.length === 0 ? (
                <p className="notification-empty">You’re all caught up.</p>
              ) : notifications.map((notification) => (
                <button
                  type="button"
                  className={`notification-item${notification.readAt ? '' : ' notification-unread'}`}
                  key={notification._id}
                  onClick={() => {
                    markRead(notification);
                    setOpen(false);
                    const target = notification.complaint?._id;
                    if (target) {
                      navigate(`${isAdmin ? '/admin' : '/dashboard'}#complaint-${target}`);
                      window.setTimeout(() => document.getElementById(`complaint-${target}`)?.scrollIntoView({ behavior: 'smooth' }), 100);
                    }
                  }}
                >
                  <span>{notification.message}</span>
                  <small>{new Date(notification.createdAt).toLocaleString('en-IN')}</small>
                </button>
              ))}
              <p className="notification-footer">Email alerts are planned for a later update. For now, updates appear here.</p>
            </section>
          )}
        </div>
        <span className="header-user"><span aria-hidden="true">👤</span> {user?.name}</span>
        <button type="button" className="button button-quiet" onClick={switchAccount}>Switch account</button>
        <button
          type="button"
          className="button button-outline"
          onClick={() => {
            clearSession();
            navigate('/', { replace: true });
          }}
        >
          Log out
        </button>
      </div>
    </header>
  );
}

export default PortalHeader;

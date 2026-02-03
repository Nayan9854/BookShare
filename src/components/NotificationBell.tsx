// src/components/NotificationBell.tsx - ENHANCED WITH FASTER POLLING
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import api from '../utils/api';
import { Notification } from '../types';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    loadNotifications();
    
    // ✅ POLL EVERY 5 SECONDS FOR REAL-TIME UPDATES (AGENTS)
    const interval = setInterval(loadNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await api.get('/notifications?limit=10');
      setNotifications(res.data.data);
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.type === 'DELIVERY_ASSIGNED' && notification.relatedId) {
      setIsOpen(false);
      router.push('/agent/dashboard');
    } else if (notification.type === 'DELIVERY_PICKED_UP' && notification.relatedId) {
      setIsOpen(false);
      router.push(`/delivery/track/${notification.relatedId}`);
    } else if (notification.type === 'BORROW_REQUEST' && notification.relatedId) {
      setIsOpen(false);
      router.push('/requests');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'BORROW_REQUEST': return '📬';
      case 'REQUEST_ACCEPTED': return '✅';
      case 'REQUEST_REJECTED': return '❌';
      case 'BOOK_RETURNED': return '📚';
      case 'DELIVERY_ASSIGNED': return '🚚';
      case 'DELIVERY_PICKED_UP': return '📦';
      case 'DELIVERY_DELIVERED': return '✓';
      case 'NEW_REVIEW': return '⭐';
      default: return '🔔';
    }
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: 'white',
          cursor: 'pointer',
          fontSize: '1.25rem',
          padding: '0.5rem 0.75rem',
          borderRadius: 'var(--radius-md)',
          backdropFilter: 'blur(10px)',
          transition: 'var(--transition)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              borderRadius: '50%',
              width: '22px',
              height: '22px',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              animation: 'pulse 2s infinite'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: '0',
            width: '400px',
            maxHeight: '600px',
            background: 'white',
            border: '1px solid var(--gray-200)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xl)',
            overflowY: 'auto',
            zIndex: 1000
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '1.25rem',
              borderBottom: '1px solid var(--gray-200)',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderTopLeftRadius: 'var(--radius-lg)',
              borderTopRightRadius: 'var(--radius-lg)'
            }}
          >
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: '700', fontSize: '1.125rem' }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span style={{ 
                  fontSize: '0.875rem',
                  background: 'rgba(255,255,255,0.2)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  backdropFilter: 'blur(10px)'
                }}>
                  {unreadCount} new
                </span>
              )}
            </div>
          </div>

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <div style={{ 
              padding: '3rem 2rem', 
              textAlign: 'center', 
              color: 'var(--gray-500)' 
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔔</div>
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                style={{
                  padding: '1rem 1.25rem',
                  borderBottom: '1px solid var(--gray-100)',
                  cursor: 'pointer',
                  background: notification.isRead ? 'white' : 'var(--gray-50)',
                  transition: 'var(--transition)',
                  position: 'relative'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-100)'}
                onMouseLeave={(e) => e.currentTarget.style.background = notification.isRead ? 'white' : 'var(--gray-50)'}
              >
                {!notification.isRead && (
                  <div style={{
                    position: 'absolute',
                    left: '0.5rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--primary)'
                  }} />
                )}
                
                <div style={{ 
                  display: 'flex', 
                  gap: '1rem',
                  paddingLeft: notification.isRead ? '0' : '1rem'
                }}>
                  <div style={{ 
                    fontSize: '1.75rem',
                    flexShrink: 0
                  }}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: notification.isRead ? '500' : '700',
                        color: 'var(--gray-900)',
                        marginBottom: '0.25rem',
                        fontSize: '0.9375rem'
                      }}
                    >
                      {notification.title}
                    </div>
                    <div style={{ 
                      color: 'var(--gray-600)', 
                      fontSize: '0.875rem',
                      marginBottom: '0.5rem',
                      lineHeight: 1.4
                    }}>
                      {notification.message}
                    </div>
                    <div style={{ 
                      color: 'var(--gray-500)', 
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <span>🕐</span>
                      <span>{getTimeAgo(notification.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Footer */}
          {notifications.length > 0 && (
            <div
              style={{
                padding: '1rem',
                textAlign: 'center',
                borderTop: '1px solid var(--gray-200)',
                background: 'var(--gray-50)'
              }}
            >
              <a
                href="/notifications"
                style={{
                  color: 'var(--primary)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}
                onClick={() => setIsOpen(false)}
              >
                View all notifications →
              </a>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
}
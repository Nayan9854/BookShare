// src/components/Sidebar.tsx
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

interface SidebarProps {
  children: React.ReactNode;
}

export default function Sidebar({ children }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();

  const isActive = (path: string) => {
    return router.pathname === path;
  };

  const isActivePath = (paths: string[]) => {
    return paths.some(path => router.pathname.startsWith(path));
  };

  // Navigation items based on role
  const getNavItems = () => {
    if (!isAuthenticated) {
      return [
        { icon: '🏠', label: 'Home', path: '/', show: true },
        { icon: '📚', label: 'Browse Books', path: '/', show: true },
      ];
    }

    if (user?.role === 'DELIVERY_AGENT') {
      return [
        { icon: '🚚', label: 'My Deliveries', path: '/agent/dashboard', show: true },
        { icon: '💰', label: 'Earnings', path: '/agent/earnings', show: true },
        { icon: '📊', label: 'Statistics', path: '/agent/stats', show: true },
      ];
    }

    if (user?.role === 'ADMIN') {
      return [
        { icon: '⚙️', label: 'Admin Panel', path: '/admin/dashboard', show: true },
        { icon: '🚚', label: 'Deliveries', path: '/agent/dashboard', show: true },
        { icon: '📚', label: 'All Books', path: '/', show: true },
        { icon: '📖', label: 'My Shelf', path: '/my-shelf', show: true },
        { icon: '📊', label: 'Dashboard', path: '/dashboard', show: true },
      ];
    }

    // Regular USER
    return [
      { icon: '🏠', label: 'Home', path: '/', show: true },
      { icon: '📖', label: 'My Shelf', path: '/my-shelf', show: true },
      { icon: '📋', label: 'Requests', path: '/requests', show: true },
      { icon: '➕', label: 'Add Book', path: '/add-book', show: true },
      { icon: '📦', label: 'Request Delivery', path: '/delivery/request', show: true },
      { icon: '🔄', label: 'Return Book', path: '/delivery/return', show: true },
      { icon: '📊', label: 'Dashboard', path: '/dashboard', show: true },
    ];
  };

  const navItems = getNavItems();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0a' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: isCollapsed ? '80px' : '260px',
          background: 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          transition: 'width 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          height: '100vh',
          overflow: 'hidden',
          zIndex: 100
        }}
      >
        {/* Logo & Toggle */}
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}
            >
              📚
            </div>
            {!isCollapsed && (
              <span
                style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                BookShare
              </span>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              fontSize: '20px',
              padding: '4px',
              display: isCollapsed ? 'none' : 'block'
            }}
          >
            ☰
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 0', overflowY: 'auto' }}>
          {isAuthenticated && (
            <div style={{ padding: '0 16px', marginBottom: '16px' }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '8px',
                  display: isCollapsed ? 'none' : 'block'
                }}
              >
                Navigation
              </div>
            </div>
          )}

          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: isCollapsed ? '14px 16px' : '14px 24px',
                margin: '0 12px 4px 12px',
                borderRadius: '12px',
                textDecoration: 'none',
                color: isActive(item.path)
                  ? '#fff'
                  : 'rgba(255, 255, 255, 0.6)',
                background: isActive(item.path)
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'transparent',
                transition: 'all 0.2s ease',
                fontSize: '15px',
                fontWeight: isActive(item.path) ? '600' : '400',
                cursor: 'pointer',
                justifyContent: isCollapsed ? 'center' : 'flex-start'
              }}
              onMouseEnter={(e) => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = '#fff';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                }
              }}
            >
              <span style={{ fontSize: '20px' }}>{item.icon}</span>
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* User Section */}
        {isAuthenticated ? (
          <div
            style={{
              padding: '16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                marginBottom: '8px'
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: 'white',
                  flexShrink: 0
                }}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              {!isCollapsed && (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#fff',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {user?.name}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'rgba(255, 255, 255, 0.5)',
                      marginTop: '2px'
                    }}
                  >
                    {user?.role === 'ADMIN'
                      ? 'Admin'
                      : user?.role === 'DELIVERY_AGENT'
                      ? 'Agent'
                      : 'Member'}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={logout}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(231, 76, 60, 0.1)',
                border: '1px solid rgba(231, 76, 60, 0.3)',
                borderRadius: '12px',
                color: '#e74c3c',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(231, 76, 60, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(231, 76, 60, 0.1)';
              }}
            >
              <span>🚪</span>
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>
        ) : (
          <div style={{ padding: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Link
              href="/login"
              style={{
                display: 'block',
                padding: '12px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                textDecoration: 'none',
                textAlign: 'center',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px'
              }}
            >
              {isCollapsed ? '🔑' : 'Login'}
            </Link>
            {!isCollapsed && (
              <Link
                href="/register"
                style={{
                  display: 'block',
                  padding: '12px',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  textDecoration: 'none',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Register
              </Link>
            )}
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          marginLeft: isCollapsed ? '80px' : '260px',
          transition: 'margin-left 0.3s ease',
          minHeight: '100vh',
          background: '#0a0a0a'
        }}
      >
        {/* Top Bar */}
        <div
          style={{
            height: '70px',
            background: 'rgba(26, 26, 26, 0.8)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 32px',
            position: 'sticky',
            top: 0,
            zIndex: 50
          }}
        >
          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#fff',
                margin: 0,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              {router.pathname === '/' && 'Browse Books'}
              {router.pathname === '/my-shelf' && 'My Shelf'}
              {router.pathname === '/requests' && 'Borrow Requests'}
              {router.pathname === '/add-book' && 'Add New Book'}
              {router.pathname === '/dashboard' && 'Dashboard'}
              {router.pathname.startsWith('/delivery') && 'Delivery Service'}
              {router.pathname.startsWith('/agent') && 'Agent Portal'}
              {router.pathname.startsWith('/admin') && 'Admin Panel'}
              {router.pathname.startsWith('/books/') && 'Book Details'}
            </h1>
          </div>
          {isAuthenticated && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}
            >
              <div
                style={{
                  padding: '8px 16px',
                  background: 'rgba(102, 126, 234, 0.1)',
                  border: '1px solid rgba(102, 126, 234, 0.3)',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#667eea'
                }}
              >
                {user?.role === 'ADMIN'
                  ? '👑 Admin'
                  : user?.role === 'DELIVERY_AGENT'
                  ? '🚚 Agent'
                  : '👤 User'}
              </div>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div style={{ padding: '32px' }}>{children}</div>
      </main>
    </div>
  );
}
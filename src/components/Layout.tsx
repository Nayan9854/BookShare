// src/components/Layout.tsx - COMPLETELY FIXED: Clickable Profile Links
import Link from "next/link";
import { ReactNode, useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";
import PointsWidget from "./PointsWidget";
import { useRouter } from "next/router";

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (user?.role === 'DELIVERY_AGENT') {
      router.push('/agent/dashboard');
    } else if (user?.role === 'ADMIN') {
      router.push('/admin/dashboard');
    } else {
      router.push('/');
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  // Handle navigation from dropdown
  const handleNavigation = (path: string) => {
    setUserMenuOpen(false);
    router.push(path);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'var(--gray-50)'
      }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Modern Navigation */}
      <nav style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        boxShadow: 'var(--shadow-lg)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div className="container">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '1rem 0'
          }}>
            {/* Logo */}
            <a 
              href="#" 
              onClick={handleLogoClick}
              style={{ 
                color: 'white', 
                textDecoration: 'none', 
                fontSize: '1.5rem', 
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'var(--transition)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <span style={{ fontSize: '2rem' }}>📚</span>
              <span>BookShare</span>
            </a>
            
            {/* Desktop Navigation */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '2rem'
            }}>
              {isAuthenticated && (
                <>
                  {user?.role === 'USER' && (
                    <>
                      <NavLink href="/">Browse Books</NavLink>
                      <NavLink href="/my-shelf">My Shelf</NavLink>
                      <NavLink href="/requests">Requests</NavLink>
                      <NavLink href="/add-book">Add Book</NavLink>
                      <NavLink href="/dashboard">Dashboard</NavLink>
                    </>
                  )}

                  {user?.role === 'DELIVERY_AGENT' && (
                    <>
                      <NavLink href="/agent/dashboard">My Deliveries</NavLink>
                      <NavLink href="/agent/earnings">Earnings</NavLink>
                    </>
                  )}

                  {user?.role === 'ADMIN' && (
                    <>
                      <NavLink href="/admin/dashboard">Admin Panel</NavLink>
                      <NavLink href="/agent/dashboard">Deliveries</NavLink>
                      <NavLink href="/dashboard">Dashboard</NavLink>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Right Side */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {isAuthenticated ? (
                <>
                  {/* Points Widget - Only for regular users */}
                  {user?.role === 'USER' && <PointsWidget />}
                  
                  <NotificationBell />
                  
                  {/* User Menu - FIXED WITH REF */}
                  <div style={{ position: 'relative' }} ref={dropdownRef}>
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.75rem',
                        padding: '0.5rem 1rem',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: 'var(--radius-lg)',
                        backdropFilter: 'blur(10px)',
                        cursor: 'pointer',
                        transition: 'var(--transition)',
                        border: 'none'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                    >
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '700',
                        fontSize: '1.125rem'
                      }}>
                        {user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ 
                          color: 'white', 
                          fontWeight: '600',
                          fontSize: '0.875rem'
                        }}>
                          {user?.name}
                        </span>
                        {user?.role !== 'USER' && (
                          <span style={{ 
                            fontSize: '0.625rem',
                            padding: '0.125rem 0.5rem',
                            background: user?.role === 'ADMIN' ? 'var(--error)' : 'var(--success)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'white',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>
                            {user?.role === 'ADMIN' ? 'Admin' : 'Agent'}
                          </span>
                        )}
                      </div>
                    </button>

                    {/* FIXED DROPDOWN MENU */}
                    {userMenuOpen && (
                      <div style={{
                        position: 'absolute',
                        top: 'calc(100% + 10px)',
                        right: 0,
                        width: '220px',
                        background: 'white',
                        border: '1px solid var(--gray-200)',
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                        zIndex: 9999,
                        overflow: 'hidden'
                      }}>
                        {/* My Profile - COMPLETELY FIXED */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleNavigation('/profile');
                          }}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            color: 'var(--gray-900)',
                            background: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'var(--transition)',
                            borderBottom: '1px solid var(--gray-200)',
                            fontSize: '1rem',
                            fontWeight: '500',
                            textAlign: 'left',
                            fontFamily: 'inherit'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--gray-50)';
                            e.currentTarget.style.paddingLeft = '1.25rem';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'white';
                            e.currentTarget.style.paddingLeft = '1rem';
                          }}
                        >
                          <span style={{ fontSize: '1.25rem' }}>👤</span>
                          <span>My Profile</span>
                        </button>
                        
                        {/* My Points - COMPLETELY FIXED */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleNavigation('/points');
                          }}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            color: 'var(--gray-900)',
                            background: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'var(--transition)',
                            borderBottom: '1px solid var(--gray-200)',
                            fontSize: '1rem',
                            fontWeight: '500',
                            textAlign: 'left',
                            fontFamily: 'inherit'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--gray-50)';
                            e.currentTarget.style.paddingLeft = '1.25rem';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'white';
                            e.currentTarget.style.paddingLeft = '1rem';
                          }}
                        >
                          <span style={{ fontSize: '1.25rem' }}>⭐</span>
                          <span>My Points</span>
                        </button>

                        {/* Logout Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setUserMenuOpen(false);
                            logout();
                          }}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            color: 'var(--error)',
                            background: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'var(--transition)',
                            fontSize: '1rem',
                            fontWeight: '500',
                            textAlign: 'left',
                            fontFamily: 'inherit'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--gray-50)';
                            e.currentTarget.style.paddingLeft = '1.25rem';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'white';
                            e.currentTarget.style.paddingLeft = '1rem';
                          }}
                        >
                          <span style={{ fontSize: '1.25rem' }}>🚪</span>
                          <span>Logout</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn btn-sm" style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}>
                    Login
                  </Link>
                  <Link href="/register" className="btn btn-sm btn-secondary">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ 
        flex: 1, 
        padding: '2rem 0',
        background: 'var(--gray-50)'
      }}>
        <div className="container fade-in">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ 
        background: 'var(--gray-900)',
        color: 'var(--gray-400)',
        padding: '3rem 0',
        marginTop: 'auto'
      }}>
        <div className="container">
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem',
            marginBottom: '2rem'
          }}>
            <div>
              <h3 style={{ 
                color: 'white', 
                marginBottom: '1rem',
                fontSize: '1.25rem'
              }}>
                📚 BookShare
              </h3>
              <p style={{ color: 'var(--gray-400)', fontSize: '0.875rem' }}>
                Share books, spread knowledge. A community-driven platform for book lovers.
              </p>
            </div>
            <div>
              <h4 style={{ color: 'white', marginBottom: '1rem' }}>Quick Links</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <FooterLink href="/">Browse Books</FooterLink>
                <FooterLink href="/add-book">Add Book</FooterLink>
                <FooterLink href="/register-agent">Become Agent</FooterLink>
              </ul>
            </div>
            <div>
              <h4 style={{ color: 'white', marginBottom: '1rem' }}>Support</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <FooterLink href="#">Help Center</FooterLink>
                <FooterLink href="#">Contact Us</FooterLink>
                <FooterLink href="#">Terms of Service</FooterLink>
              </ul>
            </div>
          </div>
          <div style={{ 
            borderTop: '1px solid var(--gray-800)',
            paddingTop: '2rem',
            textAlign: 'center',
            fontSize: '0.875rem'
          }}>
            <p>© 2025 BookShare. All rights reserved. Made with ❤️ for book lovers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const router = useRouter();
  const isActive = router.pathname === href;
  
  return (
    <Link 
      href={href}
      style={{ 
        color: 'white',
        textDecoration: 'none',
        fontSize: '0.875rem',
        fontWeight: '600',
        padding: '0.5rem 1rem',
        borderRadius: 'var(--radius-md)',
        background: isActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
        transition: 'var(--transition)',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'transparent';
        }
      }}
    >
      {children}
    </Link>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li style={{ marginBottom: '0.5rem' }}>
      <a 
        href={href}
        style={{
          color: 'var(--gray-400)',
          textDecoration: 'none',
          fontSize: '0.875rem',
          transition: 'var(--transition)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--gray-400)'}
      >
        {children}
      </a>
    </li>
  );
}
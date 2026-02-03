// src/pages/dashboard.tsx - Modern Enhanced UI
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import api from '../utils/api';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

interface Analytics {
  stats: {
    ownedBooks: number;
    borrowedBooks: number;
    incomingRequests: number;
    outgoingRequests: number;
    lentOut: number;
    completedTransactions: number;
  };
  recentBooks: Array<{
    id: number;
    title: string;
    author: string;
    status: string;
    createdAt: string;
  }>;
  recentRequests: Array<{
    id: number;
    status: string;
    createdAt: string;
    book: {
      id: number;
      title: string;
      author: string;
    };
    borrower: {
      id: number;
      name: string;
    };
  }>;
}

export default function Dashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    loadAnalytics();
  }, [isAuthenticated, loading, router]);

  const loadAnalytics = async () => {
    try {
      const res = await api.get('/analytics/user');
      setAnalytics(res.data);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setAnalytics(null);
    } finally {
      setDataLoading(false);
    }
  };

  if (loading || dataLoading) {
    return (
      <Layout>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          minHeight: '400px'
        }}>
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <Layout>
      <div>
        {/* Welcome Banner */}
        <div className="card" style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '2.5rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h1 style={{ 
              color: 'white', 
              fontSize: '2.5rem',
              marginBottom: '0.5rem'
            }}>
              Welcome back, {user?.name}! 👋
            </h1>
            <p style={{ 
              fontSize: '1.125rem',
              color: 'rgba(255,255,255,0.9)',
              margin: 0
            }}>
              Here's what's happening with your books today
            </p>
          </div>
          <div style={{ fontSize: '5rem' }}>📊</div>
        </div>

        {analytics ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-3" style={{ marginBottom: '3rem' }}>
              <StatCard 
                title="My Books" 
                value={analytics.stats.ownedBooks}
                icon="📚"
                gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                description="Books you own"
              />
              <StatCard 
                title="Borrowed" 
                value={analytics.stats.borrowedBooks}
                icon="📖"
                gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                description="Currently reading"
              />
              <StatCard 
                title="Lent Out" 
                value={analytics.stats.lentOut}
                icon="📤"
                gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
                description="Books with others"
              />
              <StatCard 
                title="Incoming Requests" 
                value={analytics.stats.incomingRequests}
                icon="📥"
                gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
                description="Pending for you"
              />
              <StatCard 
                title="My Requests" 
                value={analytics.stats.outgoingRequests}
                icon="📨"
                gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
                description="Waiting approval"
              />
              <StatCard 
                title="Completed" 
                value={analytics.stats.completedTransactions}
                icon="✅"
                gradient="linear-gradient(135deg, #30cfd0 0%, #330867 100%)"
                description="All transactions"
              />
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-2" style={{ marginBottom: '2rem' }}>
              {/* Recent Books */}
              <div className="card">
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem'
                }}>
                  <h2 style={{ margin: 0 }}>📚 Recently Added Books</h2>
                  <a href="/add-book" className="btn btn-sm btn-primary">
                    Add Book
                  </a>
                </div>
                
                {analytics.recentBooks.length === 0 ? (
                  <div style={{ 
                    padding: '3rem',
                    textAlign: 'center',
                    color: 'var(--gray-500)'
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
                    <p>No books added yet</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {analytics.recentBooks.map(book => (
                      <div
                        key={book.id}
                        style={{
                          padding: '1rem',
                          background: 'var(--gray-50)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--gray-200)',
                          transition: 'var(--transition)',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--primary)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--gray-200)';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                          {book.title}
                        </div>
                        <div style={{ 
                          fontSize: '0.875rem',
                          color: 'var(--gray-600)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span>by {book.author}</span>
                          <span className={`badge ${
                            book.status === 'AVAILABLE' ? 'badge-success' : 'badge-warning'
                          }`}>
                            {book.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Requests */}
              <div className="card">
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem'
                }}>
                  <h2 style={{ margin: 0 }}>📋 Recent Requests</h2>
                  <a href="/requests" className="btn btn-sm btn-outline">
                    View All
                  </a>
                </div>
                
                {analytics.recentRequests.length === 0 ? (
                  <div style={{ 
                    padding: '3rem',
                    textAlign: 'center',
                    color: 'var(--gray-500)'
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                    <p>No requests yet</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {analytics.recentRequests.map(request => (
                      <div
                        key={request.id}
                        style={{
                          padding: '1rem',
                          background: 'var(--gray-50)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--gray-200)',
                          transition: 'var(--transition)',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--primary)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--gray-200)';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                          {request.book.title}
                        </div>
                        <div style={{ 
                          fontSize: '0.875rem',
                          color: 'var(--gray-600)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span>{request.borrower.name}</span>
                          <span className={`badge ${
                            request.status === 'PENDING' ? 'badge-warning' :
                            request.status === 'ACCEPTED' ? 'badge-success' :
                            request.status === 'REJECTED' ? 'badge-error' :
                            'badge-info'
                          }`}>
                            {request.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card" style={{ padding: '2rem' }}>
              <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>⚡ Quick Actions</h2>
              <div className="grid grid-cols-4">
                <QuickActionCard 
                  icon="➕"
                  title="Add Book"
                  description="List a new book"
                  href="/add-book"
                  color="var(--primary)"
                />
                <QuickActionCard 
                  icon="🔍"
                  title="Browse"
                  description="Find books to borrow"
                  href="/"
                  color="var(--secondary)"
                />
                <QuickActionCard 
                  icon="📥"
                  title="Requests"
                  description="Manage borrow requests"
                  href="/requests"
                  color="var(--accent)"
                />
                <QuickActionCard 
                  icon="📚"
                  title="My Shelf"
                  description="View your collection"
                  href="/my-shelf"
                  color="var(--warning)"
                />
              </div>
            </div>
          </>
        ) : (
          <div className="card" style={{ 
            padding: '4rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</div>
            <h2 style={{ marginBottom: '1rem' }}>Analytics Unavailable</h2>
            <p style={{ color: 'var(--gray-600)', marginBottom: '2rem' }}>
              Browse your books and requests using the navigation menu.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <a href="/my-shelf" className="btn btn-primary">
                My Shelf
              </a>
              <a href="/requests" className="btn btn-outline">
                Requests
              </a>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function StatCard({ 
  title, 
  value, 
  icon, 
  gradient,
  description 
}: { 
  title: string; 
  value: number; 
  icon: string;
  gradient: string;
  description: string;
}) {
  return (
    <div className="card" style={{
      background: gradient,
      color: 'white',
      textAlign: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ 
        fontSize: '3rem', 
        marginBottom: '0.5rem',
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
      }}>
        {icon}
      </div>
      <div style={{ 
        fontSize: '2.5rem', 
        fontWeight: '700',
        marginBottom: '0.25rem'
      }}>
        {value}
      </div>
      <div style={{ 
        fontSize: '1rem',
        fontWeight: '600',
        marginBottom: '0.25rem',
        opacity: 0.95
      }}>
        {title}
      </div>
      <div style={{ 
        fontSize: '0.75rem',
        opacity: 0.8
      }}>
        {description}
      </div>
    </div>
  );
}

function QuickActionCard({ 
  icon, 
  title, 
  description, 
  href,
  color 
}: { 
  icon: string;
  title: string;
  description: string;
  href: string;
  color: string;
}) {
  return (
    <a
      href={href}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '1.5rem',
        background: 'white',
        border: '2px solid var(--gray-200)',
        borderRadius: 'var(--radius-lg)',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'var(--transition)',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--gray-200)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ 
        fontSize: '2.5rem',
        marginBottom: '0.75rem',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: `${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {icon}
      </div>
      <div style={{ 
        fontWeight: '600',
        marginBottom: '0.25rem',
        color: 'var(--gray-900)'
      }}>
        {title}
      </div>
      <div style={{ 
        fontSize: '0.75rem',
        color: 'var(--gray-600)',
        textAlign: 'center'
      }}>
        {description}
      </div>
    </a>
  );
}
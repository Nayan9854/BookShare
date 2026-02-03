// src/pages/admin/dashboard.tsx - FIXED SESSION PERSISTENCE
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';

interface AdminAnalytics {
  totalUsers: number;
  totalBooks: number;
  activeBorrows: number;
  totalDeliveries: number;
  popularBooks: Array<{
    id: number;
    title: string;
    author: string;
    borrowCount: number;
  }>;
  categoryDistribution: Array<{
    name: string;
    count: number;
  }>;
  recentUsers: Array<{
    id: number;
    name: string;
    email: string;
    role: string;
    createdAt: Date;
  }>;
}

export default function AdminDashboard() {
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (user?.role !== 'ADMIN') {
      router.push('/');
      alert('Access denied. Admin role required.');
      return;
    }
    
    loadAnalytics();
  }, [isAuthenticated, user, loading, router]);

  const loadAnalytics = async () => {
    try {
      const res = await api.get('/analytics/admin');
      setData(res.data);
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setDataLoading(false);
    }
  };

  if (loading) {
    return <Layout><p>Loading...</p></Layout>;
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  if (dataLoading) {
    return <Layout><p>Loading dashboard...</p></Layout>;
  }

  if (!data) {
    return <Layout><p>Failed to load dashboard</p></Layout>;
  }

  return (
    <Layout>
      <div>
        <h1>⚙️ Admin Dashboard</h1>

        {/* Main Stats */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px',
          marginBottom: '40px'
        }}>
          <StatCard 
            icon="👥" 
            title="Total Users" 
            value={data.totalUsers} 
            color="#3498db"
          />
          <StatCard 
            icon="📚" 
            title="Total Books" 
            value={data.totalBooks} 
            color="#27ae60"
          />
          <StatCard 
            icon="📖" 
            title="Active Borrows" 
            value={data.activeBorrows} 
            color="#e67e22"
          />
          <StatCard 
            icon="🚚" 
            title="Total Deliveries" 
            value={data.totalDeliveries} 
            color="#9b59b6"
          />
        </div>

        {/* Two Column Layout */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '30px',
          marginBottom: '30px'
        }}>
          {/* Popular Books */}
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            <h2 style={{ marginTop: 0 }}>📊 Most Popular Books</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.popularBooks.map((book, index) => (
                <div
                  key={book.id}
                  style={{
                    padding: '15px',
                    background: '#f8f9fa',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                      #{index + 1} {book.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '3px' }}>
                      by {book.author}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '5px 12px',
                      background: '#3498db',
                      color: 'white',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  >
                    {book.borrowCount} borrows
                  </div>
                </div>
              ))}
              {data.popularBooks.length === 0 && (
                <p style={{ textAlign: 'center', color: '#95a5a6' }}>
                  No book borrows yet
                </p>
              )}
            </div>
          </div>

          {/* Category Distribution */}
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            <h2 style={{ marginTop: 0 }}>📁 Category Distribution</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.categoryDistribution.slice(0, 10).map((category) => (
                <div
                  key={category.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <div style={{ flex: 1, fontWeight: 'bold', color: '#2c3e50' }}>
                    {category.name}
                  </div>
                  <div style={{ 
                    flex: 2, 
                    height: '20px', 
                    background: '#ecf0f1',
                    borderRadius: '10px',
                    overflow: 'hidden'
                  }}>
                    <div
                      style={{
                        height: '100%',
                        background: '#3498db',
                        width: `${Math.min(100, (category.count / data.totalBooks) * 100)}%`,
                        transition: 'width 0.3s'
                      }}
                    />
                  </div>
                  <div style={{ 
                    minWidth: '40px',
                    textAlign: 'right',
                    fontSize: '14px',
                    color: '#7f8c8d'
                  }}>
                    {category.count}
                  </div>
                </div>
              ))}
              {data.categoryDistribution.length === 0 && (
                <p style={{ textAlign: 'center', color: '#95a5a6' }}>
                  No categories yet
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Users */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #ddd'
        }}>
          <h2 style={{ marginTop: 0 }}>👤 Recent Users</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Role</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {data.recentUsers.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '10px' }}>
                      <strong>{user.name}</strong>
                    </td>
                    <td style={{ padding: '10px', color: '#7f8c8d' }}>
                      {user.email}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          background: getRoleColor(user.role),
                          color: 'white',
                          borderRadius: '3px',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: '10px', color: '#7f8c8d', fontSize: '14px' }}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ icon, title, value, color }: { 
  icon: string; 
  title: string; 
  value: number; 
  color: string;
}) {
  return (
    <div
      style={{
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #ddd',
        textAlign: 'center'
      }}
    >
      <div style={{ fontSize: '36px', marginBottom: '10px' }}>{icon}</div>
      <div style={{ fontSize: '32px', fontWeight: 'bold', color, marginBottom: '5px' }}>
        {value}
      </div>
      <div style={{ color: '#7f8c8d', fontSize: '14px' }}>{title}</div>
    </div>
  );
}

function getRoleColor(role: string) {
  switch (role) {
    case 'ADMIN': return '#e74c3c';
    case 'DELIVERY_AGENT': return '#9b59b6';
    default: return '#3498db';
  }
}
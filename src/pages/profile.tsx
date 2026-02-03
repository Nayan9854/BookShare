// src/pages/profile.tsx - FIXED: Updates AuthContext after profile change
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

type TabType = 'profile' | 'points' | 'password' | 'settings';

interface PointsData {
  currentPoints: number;
  transactions: PointTransaction[];
  statistics: {
    totalEarned: number;
    totalSpent: number;
    totalPurchased: number;
    borrowCount: number;
    lendCount: number;
  };
}

interface PointTransaction {
  id: number;
  amount: number;
  type: string;
  description: string;
  balanceAfter: number;
  createdAt: Date;
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [loading, setLoading] = useState(true);
  const [pointsData, setPointsData] = useState<PointsData | null>(null);
  const { user, isAuthenticated, loading: authLoading, updateUser } = useAuth(); // 🆕 GET updateUser
  const router = useRouter();

  // Profile Form
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    bio: '',
    location: ''
  });
  const [profileUpdating, setProfileUpdating] = useState(false);

  // Password Form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordUpdating, setPasswordUpdating] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadUserData();
  }, [isAuthenticated, authLoading]);

  const loadUserData = async () => {
    try {
      // Load user profile
      if (user) {
        setProfileForm({
          name: user.name || '',
          email: user.email || '',
          bio: user.bio || '',
          location: user.location || ''
        });
      }

      // Load points data
      const pointsRes = await api.get('/points');
      setPointsData(pointsRes.data);
    } catch (err) {
      console.error('Error loading user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileUpdating(true);
    setError('');
    setMessage('');

    try {
      const res = await api.patch('/user/profile', profileForm);
      
      // 🆕 UPDATE AUTH CONTEXT WITH NEW USER DATA
      if (res.data.user) {
        updateUser(res.data.user);
      }
      
      setMessage('✅ Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setProfileUpdating(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordUpdating(true);
    setError('');
    setMessage('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      setPasswordUpdating(false);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setPasswordUpdating(false);
      return;
    }

    try {
      await api.patch('/user/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setMessage('✅ Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPasswordUpdating(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'INITIAL': return '🎁';
      case 'BORROW': return '📖';
      case 'LEND': return '💝';
      case 'PURCHASE': return '💳';
      case 'REFUND': return '↩️';
      default: return '•';
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <Layout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ marginBottom: '0.5rem' }}>👤 My Profile</h1>
          <p style={{ color: 'var(--gray-600)' }}>
            Manage your account settings and preferences
          </p>
        </div>

        {/* User Info Card */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '2rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '2rem'
        }}>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '3rem',
            fontWeight: '700',
            backdropFilter: 'blur(10px)',
            border: '3px solid rgba(255,255,255,0.3)'
          }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ color: 'white', marginBottom: '0.5rem' }}>{user?.name}</h2>
            <p style={{ margin: 0, opacity: 0.9 }}>{user?.email}</p>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '2rem', fontSize: '0.875rem' }}>
              <div>
                <strong>Role:</strong> {user?.role === 'USER' ? '👤 User' : user?.role === 'DELIVERY_AGENT' ? '🚚 Agent' : '👑 Admin'}
              </div>
              <div>
                <strong>Points:</strong> ⭐ {user?.points || 0}
              </div>
              <div>
                <strong>Rating:</strong> {'⭐'.repeat(Math.round(user?.rating || 5))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          borderBottom: '2px solid var(--gray-200)'
        }}>
          <Tab
            active={activeTab === 'profile'}
            onClick={() => setActiveTab('profile')}
            icon="👤"
            label="Profile Info"
          />
          <Tab
            active={activeTab === 'points'}
            onClick={() => setActiveTab('points')}
            icon="⭐"
            label="Points History"
          />
          <Tab
            active={activeTab === 'password'}
            onClick={() => setActiveTab('password')}
            icon="🔐"
            label="Change Password"
          />
          <Tab
            active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
            icon="⚙️"
            label="Settings"
          />
        </div>

        {/* Messages */}
        {message && (
          <div className="alert alert-success mb-3">
            <span>✅</span>
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-error mb-3">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Profile Info Tab */}
        {activeTab === 'profile' && (
          <div className="card">
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Edit Profile Information</h2>
            <form onSubmit={handleProfileUpdate}>
              <div className="grid grid-cols-2">
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="label">Full Name</label>
                  <input
                    type="text"
                    className="input"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="label">Email Address</label>
                  <input
                    type="email"
                    className="input"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    required
                    disabled
                    style={{ background: 'var(--gray-100)', cursor: 'not-allowed' }}
                  />
                  <small style={{ color: 'var(--gray-500)' }}>Email cannot be changed</small>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="label">Location</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Your city, state"
                  value={profileForm.location}
                  onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="label">Bio</label>
                <textarea
                  className="input"
                  placeholder="Tell others about yourself..."
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  rows={4}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <button
                type="submit"
                disabled={profileUpdating}
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
              >
                {profileUpdating ? (
                  <>
                    <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Points History Tab - Keep existing code */}
        {activeTab === 'points' && pointsData && (
          <>
            <div className="grid grid-cols-4" style={{ marginBottom: '2rem' }}>
              <StatCard icon="⭐" label="Current Balance" value={pointsData.currentPoints} color="#667eea" />
              <StatCard icon="📈" label="Total Earned" value={pointsData.statistics.totalEarned} color="#10b981" />
              <StatCard icon="📉" label="Total Spent" value={pointsData.statistics.totalSpent} color="#ef4444" />
              <StatCard icon="💳" label="Total Purchased" value={pointsData.statistics.totalPurchased} color="#8b5cf6" />
            </div>

            <div className="card">
              <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>📜 Transaction History</h3>
              {pointsData.transactions.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray-500)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                  <p>No transactions yet</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--gray-200)', background: 'var(--gray-50)' }}>
                        <th style={{ padding: '1rem', textAlign: 'left' }}>Date</th>
                        <th style={{ padding: '1rem', textAlign: 'left' }}>Type</th>
                        <th style={{ padding: '1rem', textAlign: 'left' }}>Description</th>
                        <th style={{ padding: '1rem', textAlign: 'right' }}>Points</th>
                        <th style={{ padding: '1rem', textAlign: 'right' }}>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pointsData.transactions.map((txn) => (
                        <tr key={txn.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                              {new Date(txn.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '1.5rem' }}>{getTransactionIcon(txn.type)}</span>
                              <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{txn.type}</span>
                            </div>
                          </td>
                          <td style={{ padding: '1rem', maxWidth: '300px', fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                            {txn.description}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '700', fontSize: '1.125rem', color: txn.amount > 0 ? 'var(--success)' : 'var(--error)' }}>
                            {txn.amount > 0 ? '+' : ''}{txn.amount}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: 'var(--gray-700)' }}>
                            {txn.balanceAfter}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Password Tab - Keep existing code */}
        {activeTab === 'password' && (
          <div className="card">
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>🔐 Change Password</h2>
            <div className="alert alert-info mb-3">
              <span>ℹ️</span>
              <div>
                <strong>Password Requirements:</strong>
                <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
                  <li>At least 6 characters long</li>
                  <li>Use a strong, unique password</li>
                </ul>
              </div>
            </div>
            <form onSubmit={handlePasswordChange}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="label">Current Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Enter your current password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  required
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="label">New Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Enter your new password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="label">Confirm New Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Confirm your new password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <button type="submit" disabled={passwordUpdating} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                {passwordUpdating ? (
                  <>
                    <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                    <span>Changing Password...</span>
                  </>
                ) : (
                  <>
                    <span>🔐</span>
                    <span>Change Password</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Settings Tab - Keep existing code */}
        {activeTab === 'settings' && (
          <div className="card">
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>⚙️ Account Settings</h2>
            <div style={{ marginBottom: '2rem' }}>
              <h3>Account Statistics</h3>
              <div className="grid grid-cols-3">
                <div style={{ padding: '1rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📚</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)' }}>
                    {user?.totalBorrows || 0}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Total Borrows</div>
                </div>
                <div style={{ padding: '1rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💝</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--secondary)' }}>
                    {user?.totalLends || 0}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Total Lends</div>
                </div>
                <div style={{ padding: '1rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⭐</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent)' }}>
                    {user?.rating?.toFixed(1) || '5.0'}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>User Rating</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function Tab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '1rem 1.5rem',
        background: active ? 'var(--primary)' : 'transparent',
        color: active ? 'white' : 'var(--gray-600)',
        border: 'none',
        borderBottom: active ? '3px solid var(--primary-dark)' : 'none',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: active ? '600' : '500',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        transition: 'var(--transition)'
      }}
    >
      <span style={{ fontSize: '1.25rem' }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{icon}</div>
      <div style={{ fontSize: '2rem', fontWeight: '700', color, marginBottom: '0.25rem' }}>{value}</div>
      <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', fontWeight: '600' }}>{label}</div>
    </div>
  );
}
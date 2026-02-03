// src/pages/agent/earnings.tsx - COMPREHENSIVE EARNINGS PAGE
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

interface EarningsData {
  totalEarnings: number;
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
  completedDeliveries: number;
  averagePerDelivery: number;
  pendingEarnings: number;
  transactions: Transaction[];
  withdrawalHistory: Withdrawal[];
  last30Days: DailyEarning[];
}

interface Transaction {
  id: number;
  deliveryId: number;
  amount: number;
  date: Date;
  bookTitle: string;
  status: string;
}

interface Withdrawal {
  id: number;
  amount: number;
  date: Date;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  bankDetails?: string;
}

interface DailyEarning {
  date: string;
  amount: number;
  deliveries: number;
}

export default function AgentEarnings() {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [processingWithdrawal, setProcessingWithdrawal] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (user?.role !== 'DELIVERY_AGENT' && user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    
    loadEarnings();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadEarnings, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  const loadEarnings = async () => {
    try {
      const res = await api.get('/agent/earnings');
      setData(res.data);
    } catch (err) {
      console.error('Error loading earnings:', err);
      
      // Fallback: Calculate from deliveries
      try {
        const deliveriesRes = await api.get('/delivery/my-deliveries');
        const deliveries = deliveriesRes.data;
        
        const completed = deliveries.filter((d: any) => 
          d.status === 'COMPLETED' || d.status === 'DELIVERED'
        );
        
        const totalEarnings = completed.reduce((sum: number, d: any) => 
          sum + (d.paymentAmount || 50), 0
        );
        
        const now = new Date();
        const todayStart = new Date(now.setHours(0, 0, 0, 0));
        const weekStart = new Date(now.setDate(now.getDate() - 7));
        const monthStart = new Date(now.setDate(1));
        
        const todayEarnings = completed
          .filter((d: any) => new Date(d.deliveryCompleted || d.updatedAt) >= todayStart)
          .reduce((sum: number, d: any) => sum + (d.paymentAmount || 50), 0);
        
        const weekEarnings = completed
          .filter((d: any) => new Date(d.deliveryCompleted || d.updatedAt) >= weekStart)
          .reduce((sum: number, d: any) => sum + (d.paymentAmount || 50), 0);
        
        const monthEarnings = completed
          .filter((d: any) => new Date(d.deliveryCompleted || d.updatedAt) >= monthStart)
          .reduce((sum: number, d: any) => sum + (d.paymentAmount || 50), 0);
        
        setData({
          totalEarnings,
          todayEarnings,
          weekEarnings,
          monthEarnings,
          completedDeliveries: completed.length,
          averagePerDelivery: completed.length > 0 ? totalEarnings / completed.length : 0,
          pendingEarnings: 0,
          transactions: completed.map((d: any) => ({
            id: d.id,
            deliveryId: d.id,
            amount: d.paymentAmount || 50,
            date: d.deliveryCompleted || d.updatedAt,
            bookTitle: d.borrowRequest?.book?.title || 'Unknown',
            status: 'COMPLETED'
          })),
          withdrawalHistory: [],
          last30Days: []
        });
      } catch (fallbackErr) {
        console.error('Fallback error:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawal = async () => {
    const amount = parseFloat(withdrawalAmount);
    
    if (!amount || amount < 100) {
      alert('Minimum withdrawal amount is ₹100');
      return;
    }
    
    if (!data || amount > data.totalEarnings) {
      alert('Insufficient balance');
      return;
    }
    
    setProcessingWithdrawal(true);
    
    try {
      // Simulate withdrawal (in production, call real API)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert(`✅ Withdrawal request of ₹${amount} submitted successfully! Funds will be transferred within 2-3 business days.`);
      setShowWithdrawalModal(false);
      setWithdrawalAmount('');
      loadEarnings();
    } catch (err) {
      alert('Failed to process withdrawal. Please try again.');
    } finally {
      setProcessingWithdrawal(false);
    }
  };

  if (!isAuthenticated || (user?.role !== 'DELIVERY_AGENT' && user?.role !== 'ADMIN')) {
    return null;
  }

  if (loading) {
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

  if (!data) {
    return (
      <Layout>
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💰</div>
          <h2>No earnings data available</h2>
          <p style={{ color: 'var(--gray-600)' }}>Complete deliveries to start earning!</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ marginBottom: '0.5rem' }}>💰 My Earnings</h1>
          <p style={{ color: 'var(--gray-600)' }}>
            Track your delivery earnings and withdrawal history
          </p>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-4" style={{ marginBottom: '2rem' }}>
          <StatCard
            icon="💵"
            label="Total Earnings"
            value={`₹${data.totalEarnings.toFixed(2)}`}
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            subtitle={`${data.completedDeliveries} deliveries`}
          />
          <StatCard
            icon="📅"
            label="Today"
            value={`₹${data.todayEarnings.toFixed(2)}`}
            gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
          />
          <StatCard
            icon="📊"
            label="This Week"
            value={`₹${data.weekEarnings.toFixed(2)}`}
            gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
          />
          <StatCard
            icon="📈"
            label="This Month"
            value={`₹${data.monthEarnings.toFixed(2)}`}
            gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
          />
        </div>

        {/* Charts & Withdrawal */}
        <div className="grid grid-cols-2" style={{ marginBottom: '2rem' }}>
          {/* Earnings Chart */}
          <div className="card">
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>
              📊 Last 30 Days Earnings
            </h3>
            
            {data.last30Days && data.last30Days.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {data.last30Days.slice(-10).map((day, index) => {
                  const maxAmount = Math.max(...data.last30Days.map(d => d.amount));
                  const percentage = maxAmount > 0 ? (day.amount / maxAmount) * 100 : 0;
                  
                  return (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ 
                        minWidth: '80px',
                        fontSize: '0.75rem',
                        color: 'var(--gray-600)'
                      }}>
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <div style={{
                          height: '30px',
                          background: 'var(--gray-100)',
                          borderRadius: 'var(--radius)',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${percentage}%`,
                            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            paddingLeft: '0.75rem',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            transition: 'width 0.5s ease'
                          }}>
                            {day.amount > 0 && `₹${day.amount}`}
                          </div>
                        </div>
                      </div>
                      <div style={{ 
                        minWidth: '60px',
                        textAlign: 'right',
                        fontSize: '0.75rem',
                        color: 'var(--gray-500)'
                      }}>
                        {day.deliveries} delivery{day.deliveries !== 1 ? 'ies' : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ 
                padding: '2rem',
                textAlign: 'center',
                color: 'var(--gray-500)'
              }}>
                <p>No earnings data available yet. Complete deliveries to see your earnings chart!</p>
              </div>
            )}
          </div>

          {/* Withdrawal Card */}
          <div className="card" style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}>
            <h3 style={{ color: 'white', marginTop: 0, marginBottom: '1.5rem' }}>
              💳 Withdraw Earnings
            </h3>
            
            <div style={{ 
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem', opacity: 0.9 }}>
                Available Balance
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: '700' }}>
                ₹{data.totalEarnings.toFixed(2)}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ 
                fontSize: '0.75rem',
                marginBottom: '0.5rem',
                opacity: 0.9
              }}>
                Performance Metrics
              </div>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.875rem'
              }}>
                <div>
                  <div style={{ opacity: 0.8 }}>Avg per Delivery</div>
                  <div style={{ fontWeight: '600' }}>₹{data.averagePerDelivery.toFixed(2)}</div>
                </div>
                <div>
                  <div style={{ opacity: 0.8 }}>Completion Rate</div>
                  <div style={{ fontWeight: '600' }}>
                    {data.completedDeliveries > 0 ? '100%' : '0%'}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowWithdrawalModal(true)}
              disabled={data.totalEarnings < 100}
              style={{
                width: '100%',
                padding: '1rem',
                background: 'white',
                color: '#667eea',
                border: 'none',
                borderRadius: 'var(--radius-lg)',
                fontSize: '1rem',
                fontWeight: '700',
                cursor: data.totalEarnings >= 100 ? 'pointer' : 'not-allowed',
                opacity: data.totalEarnings >= 100 ? 1 : 0.5,
                transition: 'var(--transition)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <span>💳</span>
              <span>Withdraw Money</span>
            </button>

            {data.totalEarnings < 100 && (
              <div style={{ 
                marginTop: '0.75rem',
                fontSize: '0.75rem',
                textAlign: 'center',
                opacity: 0.8
              }}>
                Minimum withdrawal: ₹100
              </div>
            )}
          </div>
        </div>

        {/* Transaction History */}
        <div className="card">
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>
            📜 Transaction History
          </h3>
          
          {data.transactions.length === 0 ? (
            <div style={{ 
              padding: '3rem',
              textAlign: 'center',
              color: 'var(--gray-500)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
              <p>No transactions yet. Complete deliveries to see your earnings!</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{ 
                    borderBottom: '2px solid var(--gray-200)',
                    background: 'var(--gray-50)'
                  }}>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Delivery ID</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Book</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.transactions.map((txn) => (
                    <tr 
                      key={txn.id}
                      style={{ 
                        borderBottom: '1px solid var(--gray-100)',
                        transition: 'var(--transition)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-50)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                          {new Date(txn.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                          {new Date(txn.date).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          fontFamily: 'monospace',
                          color: 'var(--primary)',
                          fontWeight: '600'
                        }}>
                          #{txn.deliveryId}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ 
                          maxWidth: '200px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {txn.bookTitle}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span className="badge badge-success">
                          ✓ Completed
                        </span>
                      </td>
                      <td style={{ 
                        padding: '1rem',
                        textAlign: 'right',
                        fontWeight: '700',
                        color: 'var(--success)',
                        fontSize: '1.125rem'
                      }}>
                        +₹{txn.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Withdrawal Modal */}
        {showWithdrawalModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
          }}>
            <div className="card" style={{ 
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <h2 style={{ margin: 0 }}>💳 Withdraw Earnings</h2>
                <button
                  onClick={() => setShowWithdrawalModal(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: 'var(--gray-500)'
                  }}
                >
                  ×
                </button>
              </div>

              <div className="alert alert-info mb-3">
                <span>ℹ️</span>
                <div>
                  <strong>Available Balance:</strong> ₹{data.totalEarnings.toFixed(2)}
                  <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    Minimum withdrawal: ₹100 • Processing time: 2-3 business days
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="label">Withdrawal Amount</label>
                <input
                  type="number"
                  className="input"
                  placeholder="Enter amount (min ₹100)"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  min="100"
                  max={data.totalEarnings}
                  step="50"
                />
              </div>

              <div className="alert alert-warning mb-3">
                <span>⚠️</span>
                <div>
                  <strong>Demo Mode:</strong> This is a simulated withdrawal. In production, 
                  funds would be transferred to your registered bank account.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => setShowWithdrawalModal(false)}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                  disabled={processingWithdrawal}
                >
                  Cancel
                </button>
                <button
                  onClick={handleWithdrawal}
                  className="btn btn-primary"
                  style={{ flex: 2 }}
                  disabled={processingWithdrawal}
                >
                  {processingWithdrawal ? (
                    <>
                      <div className="spinner" style={{ 
                        width: '20px', 
                        height: '20px',
                        borderWidth: '2px'
                      }}></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>💰</span>
                      <span>Withdraw</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <p style={{ 
          textAlign: 'center',
          marginTop: '2rem',
          fontSize: '0.875rem',
          color: 'var(--gray-500)'
        }}>
          ⏰ Auto-refreshes every 30 seconds
        </p>
      </div>
    </Layout>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  gradient,
  subtitle 
}: {
  icon: string;
  label: string;
  value: string;
  gradient: string;
  subtitle?: string;
}) {
  return (
    <div className="card" style={{
      background: gradient,
      color: 'white',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>
        {icon}
      </div>
      <div style={{ 
        fontSize: '2rem',
        fontWeight: '700',
        marginBottom: '0.25rem'
      }}>
        {value}
      </div>
      <div style={{ 
        fontSize: '0.875rem',
        opacity: 0.9,
        fontWeight: '600'
      }}>
        {label}
      </div>
      {subtitle && (
        <div style={{ 
          fontSize: '0.75rem',
          opacity: 0.8,
          marginTop: '0.5rem'
        }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
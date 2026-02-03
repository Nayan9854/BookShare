// src/pages/points.tsx - FIXED RAZORPAY LOADING ISSUE
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Script from 'next/script';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

declare global {
  interface Window {
    Razorpay: any;
  }
}

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

const POINT_PACKAGES = [
  { points: 100, price: 49, popular: false },
  { points: 250, price: 99, popular: true, bonus: 25 },
  { points: 500, price: 179, popular: false, bonus: 75 },
  { points: 1000, price: 299, popular: false, bonus: 200 },
];

export default function PointsPage() {
  const [data, setData] = useState<PointsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [purchasingPackage, setPurchasingPackage] = useState<number | null>(null);
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  // ✅ FIX: Check if Razorpay is already loaded on mount (from cache)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      console.log('Razorpay already loaded from cache');
      setRazorpayLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadPoints();
  }, [isAuthenticated]);

  const loadPoints = async () => {
    try {
      const res = await api.get('/points');
      setData(res.data);
    } catch (err) {
      console.error('Error loading points:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg: typeof POINT_PACKAGES[0]) => {
    if (!razorpayLoaded || !window.Razorpay) {
      alert('Payment system is loading. Please wait...');
      return;
    }

    setPurchasingPackage(pkg.points);

    try {
      // Create order
      const orderRes = await api.post('/points/create-order', {
        points: pkg.points + (pkg.bonus || 0),
        amount: pkg.price
      });

      const { orderId, amount, currency, keyId, purchaseId } = orderRes.data;

      // Razorpay options
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'BookShare Points',
        description: `Purchase ${pkg.points}${pkg.bonus ? ` + ${pkg.bonus} Bonus` : ''} Points`,
        order_id: orderId,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyRes = await api.post('/points/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              purchaseId: purchaseId
            });

            alert(`✅ ${verifyRes.data.message}\n\nYour new balance: ${verifyRes.data.newBalance} points`);
            loadPoints(); // Refresh data
          } catch (err: any) {
            alert('❌ Payment verification failed. Please contact support.');
            console.error('Verification error:', err);
          } finally {
            setPurchasingPackage(null);
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: {
          color: '#667eea'
        },
        modal: {
          ondismiss: function() {
            setPurchasingPackage(null);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', function (response: any) {
        alert(`❌ Payment failed: ${response.error.description}`);
        console.error('Payment error:', response.error);
        setPurchasingPackage(null);
      });

      rzp.open();

    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to initiate payment');
      setPurchasingPackage(null);
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

  if (!isAuthenticated) return null;

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

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('Razorpay script loaded');
          setRazorpayLoaded(true);
        }}
        onError={() => console.error('Failed to load Razorpay')}
      />

      <Layout>
        <div>
          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ marginBottom: '0.5rem' }}>⭐ My Points</h1>
            <p style={{ color: 'var(--gray-600)' }}>
              Earn points by lending books, spend points to borrow books
            </p>
          </div>

          {/* Current Balance Card */}
          <div className="card" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '3rem',
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <div style={{ fontSize: '1rem', marginBottom: '1rem', opacity: 0.9 }}>
              Available Points
            </div>
            <div style={{ 
              fontSize: '5rem', 
              fontWeight: '700',
              marginBottom: '1rem',
              textShadow: '0 4px 8px rgba(0,0,0,0.2)'
            }}>
              {data?.currentPoints || 0}
            </div>
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              gap: '2rem',
              fontSize: '0.875rem',
              opacity: 0.9
            }}>
              <div>
                <div>📖 Borrow: 20 points</div>
              </div>
              <div>
                <div>💝 Lend: +20 points</div>
              </div>
            </div>

            {data && data.currentPoints < 20 && (
              <div className="alert alert-warning" style={{ marginTop: '2rem' }}>
                <span>⚠️</span>
                <div>
                  <strong>Low Balance!</strong> You need at least 20 points to borrow a book.
                  Purchase more points below.
                </div>
              </div>
            )}
          </div>

          {/* Statistics */}
          {data && (
            <div className="grid grid-cols-4" style={{ marginBottom: '3rem' }}>
              <StatCard
                icon="📈"
                label="Total Earned"
                value={data.statistics.totalEarned}
                color="#10b981"
              />
              <StatCard
                icon="📉"
                label="Total Spent"
                value={data.statistics.totalSpent}
                color="#ef4444"
              />
              <StatCard
                icon="💳"
                label="Total Purchased"
                value={data.statistics.totalPurchased}
                color="#8b5cf6"
              />
              <StatCard
                icon="🔄"
                label="Net Transactions"
                value={data.transactions.length}
                color="#3b82f6"
              />
            </div>
          )}

          {/* Point Packages */}
          <div className="card" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
            <h2 style={{ marginTop: 0, marginBottom: '0.5rem' }}>
              💎 Buy Points
            </h2>
            <p style={{ color: 'var(--gray-600)', marginBottom: '2rem' }}>
              Choose a package and get instant points in your account
            </p>

            <div className="grid grid-cols-4">
              {POINT_PACKAGES.map((pkg) => (
                <div
                  key={pkg.points}
                  className="card"
                  style={{
                    border: pkg.popular ? '3px solid var(--primary)' : '2px solid var(--gray-200)',
                    position: 'relative',
                    overflow: 'visible',
                    padding: '2rem',
                    textAlign: 'center'
                  }}
                >
                  {pkg.popular && (
                    <div style={{
                      position: 'absolute',
                      top: '-12px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      padding: '0.25rem 1rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      boxShadow: 'var(--shadow-lg)'
                    }}>
                      ⭐ Best Value
                    </div>
                  )}

                  <div style={{ 
                    fontSize: '3rem',
                    marginBottom: '1rem'
                  }}>
                    💎
                  </div>

                  <div style={{ 
                    fontSize: '2.5rem',
                    fontWeight: '700',
                    color: 'var(--gray-900)',
                    marginBottom: '0.5rem'
                  }}>
                    {pkg.points}
                  </div>

                  {pkg.bonus && (
                    <div style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      background: '#d1fae5',
                      color: '#065f46',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      marginBottom: '1rem'
                    }}>
                      +{pkg.bonus} BONUS
                    </div>
                  )}

                  <div style={{ 
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: 'var(--primary)',
                    marginBottom: '1.5rem'
                  }}>
                    ₹{pkg.price}
                  </div>

                  <button
                    onClick={() => handlePurchase(pkg)}
                    disabled={purchasingPackage !== null || !razorpayLoaded}
                    className={pkg.popular ? 'btn btn-primary' : 'btn btn-outline'}
                    style={{ width: '100%' }}
                  >
                    {purchasingPackage === pkg.points ? (
                      <>
                        <div className="spinner" style={{ 
                          width: '16px', 
                          height: '16px',
                          borderWidth: '2px'
                        }}></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>💳</span>
                        <span>Buy Now</span>
                      </>
                    )}
                  </button>

                  <div style={{ 
                    marginTop: '1rem',
                    fontSize: '0.75rem',
                    color: 'var(--gray-500)'
                  }}>
                    ₹{(pkg.price / (pkg.points + (pkg.bonus || 0))).toFixed(2)}/point
                  </div>
                </div>
              ))}
            </div>

            <div className="alert alert-info" style={{ marginTop: '2rem' }}>
              <span>ℹ️</span>
              <div>
                <strong>How it works:</strong>
                <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
                  <li>Select a package and complete payment via Razorpay</li>
                  <li>Points are added instantly to your account</li>
                  <li>Use points to borrow books from the community</li>
                  <li>Earn points back by lending your books to others</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="card">
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>
              📜 Transaction History
            </h3>

            {data && data.transactions.length === 0 ? (
              <div style={{ 
                padding: '3rem',
                textAlign: 'center',
                color: 'var(--gray-500)'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                <p>No transactions yet. Start borrowing and lending books!</p>
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
                      <th style={{ padding: '1rem', textAlign: 'left' }}>Type</th>
                      <th style={{ padding: '1rem', textAlign: 'left' }}>Description</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Points</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.transactions.map((txn) => (
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
                            {new Date(txn.createdAt).toLocaleDateString()}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                            {new Date(txn.createdAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            <span style={{ fontSize: '1.5rem' }}>
                              {getTransactionIcon(txn.type)}
                            </span>
                            <span style={{ 
                              fontSize: '0.875rem',
                              fontWeight: '600'
                            }}>
                              {txn.type}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ 
                            maxWidth: '300px',
                            fontSize: '0.875rem',
                            color: 'var(--gray-600)'
                          }}>
                            {txn.description}
                          </div>
                        </td>
                        <td style={{ 
                          padding: '1rem',
                          textAlign: 'right',
                          fontWeight: '700',
                          fontSize: '1.125rem',
                          color: txn.amount > 0 ? 'var(--success)' : 'var(--error)'
                        }}>
                          {txn.amount > 0 ? '+' : ''}{txn.amount}
                        </td>
                        <td style={{ 
                          padding: '1rem',
                          textAlign: 'right',
                          fontWeight: '600',
                          color: 'var(--gray-700)'
                        }}>
                          {txn.balanceAfter}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="alert alert-info" style={{ marginTop: '2rem' }}>
            <span style={{ fontSize: '1.5rem' }}>💡</span>
            <div>
              <strong>Pro Tips:</strong>
              <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
                <li>New users start with 100 free points!</li>
                <li>Lend books to earn points without spending money</li>
                <li>Larger packages offer better value per point</li>
                <li>Points never expire - use them anytime</li>
              </ul>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}

function StatCard({ 
  icon, 
  label, 
  value,
  color 
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>
        {icon}
      </div>
      <div style={{ 
        fontSize: '2rem',
        fontWeight: '700',
        color,
        marginBottom: '0.25rem'
      }}>
        {value}
      </div>
      <div style={{ 
        fontSize: '0.875rem',
        color: 'var(--gray-600)',
        fontWeight: '600'
      }}>
        {label}
      </div>
    </div>
  );
}
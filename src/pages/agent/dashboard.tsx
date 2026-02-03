// src/pages/agent/dashboard.tsx - ENHANCED WITH REAL-TIME UPDATES
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { Delivery } from '../../types';

export default function AgentDashboard() {
  const [availableDeliveries, setAvailableDeliveries] = useState<Delivery[]>([]);
  const [myDeliveries, setMyDeliveries] = useState<Delivery[]>([]);
  const [activeTab, setActiveTab] = useState<'available' | 'my'>('available');
  const [dataLoading, setDataLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (user?.role !== 'DELIVERY_AGENT' && user?.role !== 'ADMIN') {
      router.push('/');
      alert('Access denied. Delivery agent role required.');
      return;
    }
    
    loadDeliveries();
    
    // ✅ AUTO-REFRESH EVERY 10 SECONDS FOR REAL-TIME UPDATES
    const interval = setInterval(loadDeliveries, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user, loading, router]);

  const loadDeliveries = async () => {
    try {
      const [availableRes, myRes] = await Promise.all([
        api.get('/delivery/available'),
        api.get('/delivery/my-deliveries')
      ]);
      setAvailableDeliveries(availableRes.data);
      setMyDeliveries(myRes.data);
    } catch (err) {
      console.error('Error loading deliveries:', err);
    } finally {
      setDataLoading(false);
    }
  };

  const handleAssign = async (deliveryId: number) => {
    if (processing) return;
    
    setProcessing(deliveryId);
    try {
      const res = await api.patch(`/delivery/${deliveryId}/assign`);
      
      if (res.data.success) {
        alert('✅ ' + res.data.message);
        await loadDeliveries();
        setActiveTab('my'); // Switch to My Deliveries tab
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to assign delivery';
      alert('❌ ' + errorMsg);
      await loadDeliveries(); // Refresh to show updated status
    } finally {
      setProcessing(null);
    }
  };

  const handleVerify = async (deliveryId: number) => {
    if (processing) return;

    const code = prompt('🔐 Enter the 6-digit verification code from the borrower:');
    
    if (!code) return;

    if (code.length !== 6 || !/^\d+$/.test(code)) {
      alert('❌ Invalid code format. Code must be 6 digits.');
      return;
    }

    setProcessing(deliveryId);
    try {
      const res = await api.post(`/delivery/${deliveryId}/verify`, {
        verificationCode: code
      });
      alert('✅ ' + res.data.message);
      await loadDeliveries();
    } catch (err: any) {
      alert('❌ ' + (err.response?.data?.error || 'Invalid verification code'));
    } finally {
      setProcessing(null);
    }
  };

  const handleUpdateStatus = async (deliveryId: number, newStatus: string) => {
    if (processing) return;

    const notes = prompt('📝 Add tracking notes (optional):');
    
    setProcessing(deliveryId);
    try {
      const res = await api.patch(`/delivery/${deliveryId}/status`, {
        status: newStatus,
        trackingNotes: notes || undefined
      });
      alert('✅ Status updated successfully!');
      await loadDeliveries();
    } catch (err: any) {
      alert('❌ ' + (err.response?.data?.error || 'Failed to update status'));
    } finally {
      setProcessing(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'PENDING': '#f59e0b',
      'ASSIGNED': '#3b82f6',
      'PICKED_UP': '#8b5cf6',
      'IN_TRANSIT': '#06b6d4',
      'DELIVERED': '#10b981',
      'COMPLETED': '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  const getPaymentStatusBadge = (delivery: Delivery) => {
    if (delivery.paymentStatus === 'COMPLETED') {
      return <span className="badge badge-success">✓ Paid</span>;
    } else if (delivery.paymentStatus === 'PENDING') {
      return <span className="badge badge-warning">⏳ Payment Pending</span>;
    } else if (delivery.paymentStatus === 'FAILED') {
      return <span className="badge badge-error">✗ Payment Failed</span>;
    }
    return null;
  };

  const getNextActions = (delivery: Delivery) => {
    // Can't do anything until payment is completed
    if (delivery.paymentStatus !== 'COMPLETED') {
      return [];
    }

    // If assigned but not verified, show verify button
    if (delivery.status === 'ASSIGNED' && !delivery.codeVerifiedAt) {
      return [{ label: '🔐 Verify Code', value: 'VERIFY', type: 'verify' }];
    }
    
    // After verification, allow status updates
    if (delivery.codeVerifiedAt) {
      switch (delivery.status) {
        case 'ASSIGNED':
          return [{ label: '📦 Mark as Picked Up', value: 'PICKED_UP', type: 'status' }];
        case 'PICKED_UP':
          return [{ label: '🚚 Mark In Transit', value: 'IN_TRANSIT', type: 'status' }];
        case 'IN_TRANSIT':
          return [{ label: '✅ Mark as Delivered', value: 'DELIVERED', type: 'status' }];
        case 'DELIVERED':
          return [{ label: '✓ Complete Delivery', value: 'COMPLETED', type: 'status' }];
      }
    }
    
    return [];
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

  if (!isAuthenticated || (user?.role !== 'DELIVERY_AGENT' && user?.role !== 'ADMIN')) {
    return null;
  }

  return (
    <Layout>
      <div>
        {/* Header */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <h1 style={{ color: 'white', margin: '0 0 0.5rem 0' }}>
            🚚 Delivery Agent Dashboard
          </h1>
          <p style={{ margin: 0, fontSize: '1.125rem', opacity: 0.9 }}>
            Accept deliveries, verify codes, and earn money
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3" style={{ marginBottom: '2rem' }}>
          <div className="card" style={{ 
            textAlign: 'center',
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📦</div>
            <div style={{ fontSize: '2rem', fontWeight: '700' }}>
              {availableDeliveries.length}
            </div>
            <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
              Available Deliveries
            </div>
          </div>
          <div className="card" style={{ 
            textAlign: 'center',
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🚚</div>
            <div style={{ fontSize: '2rem', fontWeight: '700' }}>
              {myDeliveries.length}
            </div>
            <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
              My Deliveries
            </div>
          </div>
          <div className="card" style={{ 
            textAlign: 'center',
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            color: 'white'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💰</div>
            <div style={{ fontSize: '2rem', fontWeight: '700' }}>
              ₹{myDeliveries.reduce((sum, d) => sum + (d.paymentAmount || 0), 0)}
            </div>
            <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
              Total Earnings
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
          <button
            onClick={() => setActiveTab('available')}
            className={`btn ${activeTab === 'available' ? 'btn-primary' : 'btn-outline'}`}
            style={{ borderRadius: '0', borderBottom: 'none' }}
          >
            🔔 Available ({availableDeliveries.length})
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`btn ${activeTab === 'my' ? 'btn-primary' : 'btn-outline'}`}
            style={{ borderRadius: '0', borderBottom: 'none' }}
          >
            🚚 My Deliveries ({myDeliveries.length})
          </button>
        </div>

        {/* Available Deliveries Tab */}
        {activeTab === 'available' && (
          <div>
            {availableDeliveries.length === 0 ? (
              <div className="card" style={{ 
                padding: '4rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📭</div>
                <h2>No Available Deliveries</h2>
                <p style={{ color: 'var(--gray-600)' }}>
                  New delivery requests will appear here. Auto-refreshes every 10 seconds.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1" style={{ gap: '1.5rem' }}>
                {availableDeliveries.map((delivery) => (
                  <div key={delivery.id} className="card">
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      marginBottom: '1rem'
                    }}>
                      <div>
                        <h3 style={{ margin: '0 0 0.5rem 0' }}>
                          📦 Delivery Request #{delivery.id}
                        </h3>
                        <p style={{ margin: 0, color: 'var(--gray-600)' }}>
                          <strong>Book:</strong> {delivery.borrowRequest?.book?.title || 'N/A'}
                        </p>
                        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--gray-600)' }}>
                          <strong>Fee:</strong> ₹{delivery.paymentAmount || 50}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className="badge" style={{ 
                          background: getStatusColor(delivery.status),
                          color: 'white'
                        }}>
                          {delivery.status}
                        </span>
                        <div style={{ marginTop: '0.5rem' }}>
                          {getPaymentStatusBadge(delivery)}
                        </div>
                      </div>
                    </div>

                    <div style={{ 
                      padding: '1rem',
                      background: 'var(--gray-50)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong>📍 Pickup:</strong> {delivery.pickupAddress}
                      </div>
                      <div>
                        <strong>📍 Delivery:</strong> {delivery.deliveryAddress}
                      </div>
                    </div>

                    {delivery.paymentStatus === 'PENDING' && (
                      <div className="alert alert-warning">
                        <span>⏳</span>
                        <span>Waiting for borrower to complete payment...</span>
                      </div>
                    )}

                    {delivery.paymentStatus === 'COMPLETED' && (
                      <button
                        onClick={() => handleAssign(delivery.id)}
                        disabled={processing === delivery.id}
                        className="btn btn-secondary"
                        style={{ width: '100%' }}
                      >
                        {processing === delivery.id ? (
                          <>
                            <div className="spinner" style={{ 
                              width: '20px', 
                              height: '20px',
                              borderWidth: '2px'
                            }}></div>
                            <span>Accepting...</span>
                          </>
                        ) : (
                          <>
                            <span>✓</span>
                            <span>Accept This Delivery</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Deliveries Tab */}
        {activeTab === 'my' && (
          <div>
            {myDeliveries.length === 0 ? (
              <div className="card" style={{ 
                padding: '4rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚚</div>
                <h2>No Assigned Deliveries</h2>
                <p style={{ color: 'var(--gray-600)' }}>
                  Accept available deliveries to see them here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1" style={{ gap: '1.5rem' }}>
                {myDeliveries.map((delivery) => (
                  <div key={delivery.id} className="card">
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      marginBottom: '1rem'
                    }}>
                      <div>
                        <h3 style={{ margin: '0 0 0.5rem 0' }}>
                          Delivery #{delivery.id}
                        </h3>
                        <p style={{ margin: 0, color: 'var(--gray-600)' }}>
                          <strong>Book:</strong> {delivery.borrowRequest?.book?.title || 'N/A'}
                        </p>
                        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--gray-600)' }}>
                          <strong>Fee:</strong> ₹{delivery.paymentAmount || 50}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className="badge" style={{ 
                          background: getStatusColor(delivery.status),
                          color: 'white',
                          marginBottom: '0.5rem'
                        }}>
                          {delivery.status}
                        </span>
                        <div>{getPaymentStatusBadge(delivery)}</div>
                        {delivery.codeVerifiedAt && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <span className="badge badge-success">✓ Verified</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ 
                      padding: '1rem',
                      background: 'var(--gray-50)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong>📍 Pickup:</strong> {delivery.pickupAddress}
                      </div>
                      <div>
                        <strong>📍 Delivery:</strong> {delivery.deliveryAddress}
                      </div>
                    </div>

                    {delivery.trackingNotes && (
                      <div className="alert alert-info">
                        <span>📝</span>
                        <div>
                          <strong>Notes:</strong>
                          <p style={{ margin: '0.5rem 0 0 0' }}>{delivery.trackingNotes}</p>
                        </div>
                      </div>
                    )}

                    {delivery.paymentStatus !== 'COMPLETED' && (
                      <div className="alert alert-error">
                        <span>⚠️</span>
                        <span><strong>Payment not completed.</strong> Wait for borrower to pay.</span>
                      </div>
                    )}

                    {!delivery.codeVerifiedAt && delivery.status === 'ASSIGNED' && delivery.paymentStatus === 'COMPLETED' && (
                      <div className="alert alert-warning">
                        <span>🔐</span>
                        <div>
                          <strong>Action Required:</strong>
                          <p style={{ margin: '0.5rem 0 0 0' }}>
                            Ask the borrower for their 6-digit verification code before pickup.
                          </p>
                        </div>
                      </div>
                    )}

                    {getNextActions(delivery).length > 0 && (
                      <div style={{ 
                        display: 'flex', 
                        gap: '1rem',
                        paddingTop: '1rem',
                        borderTop: '1px solid var(--gray-200)'
                      }}>
                        {getNextActions(delivery).map((action) => (
                          <button
                            key={action.value}
                            onClick={() => 
                              action.type === 'verify' 
                                ? handleVerify(delivery.id)
                                : handleUpdateStatus(delivery.id, action.value)
                            }
                            disabled={processing === delivery.id}
                            className={`btn ${action.type === 'verify' ? 'btn-secondary' : 'btn-primary'}`}
                            style={{ flex: 1 }}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Auto-refresh indicator */}
        <p style={{ 
          textAlign: 'center',
          marginTop: '2rem',
          color: 'var(--gray-500)',
          fontSize: '0.875rem'
        }}>
          ⏰ Auto-refreshing every 10 seconds
        </p>
      </div>
    </Layout>
  );
}

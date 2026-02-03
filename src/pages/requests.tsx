// src/pages/requests.tsx - UPDATED WITH RETURN DELIVERY
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../utils/api';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { RequestsResponse, BorrowRequest } from '../types';

export default function Requests() {
  const [requests, setRequests] = useState<RequestsResponse>({ incoming: [], outgoing: [] });
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [dataLoading, setDataLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [showReturnModal, setShowReturnModal] = useState<number | null>(null);
  const [returnAddresses, setReturnAddresses] = useState({
    pickupAddress: '',
    deliveryAddress: ''
  });
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    loadRequests();
  }, [isAuthenticated, loading, router]);

  const loadRequests = async () => {
    try {
      const res = await api.get('/requests');
      setRequests(res.data);
    } catch (err) {
      console.error('Error loading requests:', err);
    } finally {
      setDataLoading(false);
    }
  };

  const handleRespond = async (requestId: number, action: 'ACCEPT' | 'REJECT') => {
    setProcessing(requestId);
    try {
      await api.patch(`/requests/${requestId}/respond`, { action });
      alert(`Request ${action.toLowerCase()}ed successfully!`);
      await loadRequests();
    } catch (err: any) {
      alert(err.response?.data?.error || `Failed to ${action.toLowerCase()} request`);
    } finally {
      setProcessing(null);
    }
  };

  const handleComplete = async (requestId: number) => {
    setProcessing(requestId);
    try {
      await api.patch(`/requests/${requestId}/complete`);
      alert('Book marked as returned successfully!');
      await loadRequests();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to complete request');
    } finally {
      setProcessing(null);
    }
  };

  const handleReturnDelivery = async (requestId: number) => {
    if (!returnAddresses.pickupAddress || !returnAddresses.deliveryAddress) {
      alert('Please provide both pickup and delivery addresses');
      return;
    }

    setProcessing(requestId);
    try {
      const res = await api.post('/delivery/return/request', {
        borrowRequestId: requestId,
        pickupAddress: returnAddresses.pickupAddress,
        deliveryAddress: returnAddresses.deliveryAddress
      });

      alert(`✅ ${res.data.message}\n\n🔐 Your Verification Code: ${res.data.verificationCode}\n\nShare this code with the delivery agent.`);
      setShowReturnModal(null);
      setReturnAddresses({ pickupAddress: '', deliveryAddress: '' });
      
      // Redirect to track the return delivery
      router.push(`/delivery/track/${res.data.delivery.id}`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create return delivery');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#f39c12';
      case 'ACCEPTED': return '#27ae60';
      case 'REJECTED': return '#e74c3c';
      case 'COMPLETED': return '#95a5a6';
      default: return '#95a5a6';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return '⏳ Pending';
      case 'ACCEPTED': return '✓ Accepted';
      case 'REJECTED': return '✗ Rejected';
      case 'COMPLETED': return '✓ Completed';
      default: return status;
    }
  };

  // Check if request has a return delivery
  const hasReturnDelivery = (request: BorrowRequest) => {
    // This would need to be checked via API - for now we'll check if delivery exists
    // In a real implementation, you'd need to modify the API to include return delivery info
    return false; // Placeholder
  };

  if (loading) {
    return <Layout><p>Loading...</p></Layout>;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (dataLoading) {
    return <Layout><p>Loading requests...</p></Layout>;
  }

  return (
    <Layout>
      <div>
        <h1>📋 Borrow Requests</h1>
        
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '2px solid #ddd' }}>
          <button
            onClick={() => setActiveTab('incoming')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'incoming' ? '#3498db' : 'transparent',
              color: activeTab === 'incoming' ? 'white' : '#333',
              border: 'none',
              borderBottom: activeTab === 'incoming' ? '3px solid #2980b9' : 'none',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: activeTab === 'incoming' ? 'bold' : 'normal'
            }}
          >
            Incoming Requests ({requests.incoming.length})
          </button>
          <button
            onClick={() => setActiveTab('outgoing')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'outgoing' ? '#3498db' : 'transparent',
              color: activeTab === 'outgoing' ? 'white' : '#333',
              border: 'none',
              borderBottom: activeTab === 'outgoing' ? '3px solid #2980b9' : 'none',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: activeTab === 'outgoing' ? 'bold' : 'normal'
            }}
          >
            My Requests ({requests.outgoing.length})
          </button>
        </div>

        {/* Incoming Requests Tab */}
        {activeTab === 'incoming' && (
          <div>
            {requests.incoming.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', background: '#f8f9fa', borderRadius: '8px' }}>
                <p>No incoming requests yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {requests.incoming.map((request) => (
                  <div
                    key={request.id}
                    style={{
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '20px',
                      background: 'white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ marginTop: 0, color: '#2c3e50' }}>{request.book?.title}</h3>
                        <p style={{ color: '#7f8c8d', margin: '5px 0' }}>
                          by {request.book?.author}
                        </p>
                        <p style={{ color: '#95a5a6', fontSize: '14px', margin: '5px 0' }}>
                          Requested by: <strong>{request.borrower?.name}</strong>
                        </p>
                        <p style={{ color: '#95a5a6', fontSize: '12px', margin: '5px 0' }}>
                          {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '150px' }}>
                        <div
                          style={{
                            padding: '8px',
                            background: getStatusColor(request.status),
                            color: 'white',
                            borderRadius: '4px',
                            textAlign: 'center',
                            fontSize: '14px',
                            fontWeight: 'bold'
                          }}
                        >
                          {getStatusLabel(request.status)}
                        </div>
                        
                        {request.status === 'PENDING' && (
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <button
                              onClick={() => handleRespond(request.id, 'ACCEPT')}
                              disabled={processing === request.id}
                              style={{
                                flex: 1,
                                padding: '8px',
                                background: '#27ae60',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: processing === request.id ? 'not-allowed' : 'pointer',
                                fontSize: '14px'
                              }}
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleRespond(request.id, 'REJECT')}
                              disabled={processing === request.id}
                              style={{
                                flex: 1,
                                padding: '8px',
                                background: '#e74c3c',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: processing === request.id ? 'not-allowed' : 'pointer',
                                fontSize: '14px'
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        
                        {request.status === 'ACCEPTED' && (
                          <>
                            <button
                              onClick={() => handleComplete(request.id)}
                              disabled={processing === request.id}
                              style={{
                                padding: '8px',
                                background: '#3498db',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: processing === request.id ? 'not-allowed' : 'pointer',
                                fontSize: '14px'
                              }}
                            >
                              Mark as Returned
                            </button>
                            {request.delivery && (
                              <Link 
                                href={`/delivery/track/${request.delivery.id}`}
                                style={{
                                  padding: '8px',
                                  background: '#9b59b6',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  textDecoration: 'none',
                                  display: 'block',
                                  textAlign: 'center',
                                  fontSize: '14px'
                                }}>
                                🚚 Track Delivery
                              </Link>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Outgoing Requests Tab */}
        {activeTab === 'outgoing' && (
          <div>
            {requests.outgoing.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', background: '#f8f9fa', borderRadius: '8px' }}>
                <p>You haven't made any borrow requests yet.</p>
                <Link 
                  href="/"
                  style={{
                    display: 'inline-block',
                    marginTop: '15px',
                    padding: '10px 20px',
                    background: '#3498db',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '4px'
                  }}>
                  Browse Books
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {requests.outgoing.map((request) => (
                  <div
                    key={request.id}
                    style={{
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '20px',
                      background: 'white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ marginTop: 0, color: '#2c3e50' }}>{request.book?.title}</h3>
                        <p style={{ color: '#7f8c8d', margin: '5px 0' }}>
                          by {request.book?.author}
                        </p>
                        <p style={{ color: '#95a5a6', fontSize: '14px', margin: '5px 0' }}>
                          Owner: <strong>{request.book?.owner?.name}</strong>
                        </p>
                        <p style={{ color: '#95a5a6', fontSize: '12px', margin: '5px 0' }}>
                          Requested on: {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div
                          style={{
                            padding: '8px 16px',
                            background: getStatusColor(request.status),
                            color: 'white',
                            borderRadius: '4px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {getStatusLabel(request.status)}
                        </div>
                        {request.status === 'ACCEPTED' && request.delivery && (
                          <Link 
                            href={`/delivery/track/${request.delivery.id}`}
                            style={{
                              padding: '8px 16px',
                              background: '#9b59b6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              textDecoration: 'none',
                              display: 'block',
                              textAlign: 'center',
                              fontSize: '14px',
                              whiteSpace: 'nowrap'
                            }}>
                            🚚 Track Delivery
                          </Link>
                        )}
                      </div>
                    </div>
                    
                    {request.status === 'ACCEPTED' && (
                      <div style={{ 
                        marginTop: '15px', 
                        padding: '12px', 
                        background: '#d4edda', 
                        borderRadius: '4px',
                        color: '#155724'
                      }}>
                        <div style={{ marginBottom: '10px' }}>
                          ✓ Your request was accepted! 
                        </div>
                        {!request.delivery ? (
                          <Link 
                            href="/delivery/request"
                            style={{
                              display: 'inline-block',
                              padding: '8px 16px',
                              background: '#27ae60',
                              color: 'white',
                              textDecoration: 'none',
                              borderRadius: '4px',
                              fontWeight: 'bold',
                              marginRight: '10px'
                            }}>
                            🚚 Request Delivery Service
                          </Link>
                        ) : (
                          <>
                            {/* ✅ NEW: REQUEST RETURN DELIVERY BUTTON */}
                            <button
                              onClick={() => setShowReturnModal(request.id)}
                              style={{
                                padding: '8px 16px',
                                background: '#f39c12',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                fontSize: '14px'
                              }}
                            >
                              🔄 Request Return Delivery (Free)
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ✅ RETURN DELIVERY MODAL */}
        {showReturnModal && (
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
              maxWidth: '600px',
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
                <h2 style={{ margin: 0 }}>🔄 Request Return Delivery</h2>
                <button
                  onClick={() => {
                    setShowReturnModal(null);
                    setReturnAddresses({ pickupAddress: '', deliveryAddress: '' });
                  }}
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

              <div className="alert alert-success mb-3">
                <span>🎉</span>
                <div>
                  <strong>Free Return Service!</strong>
                  <p style={{ margin: '0.5rem 0 0 0' }}>
                    Return delivery is FREE and will be handled by the same delivery agent.
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="label">Pickup Address (Your Location)</label>
                <textarea
                  className="input"
                  placeholder="Enter your full address where the agent will pick up the book"
                  value={returnAddresses.pickupAddress}
                  onChange={(e) => setReturnAddresses({ 
                    ...returnAddresses, 
                    pickupAddress: e.target.value 
                  })}
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="label">Delivery Address (Book Owner's Location)</label>
                <textarea
                  className="input"
                  placeholder="Enter the book owner's full address"
                  value={returnAddresses.deliveryAddress}
                  onChange={(e) => setReturnAddresses({ 
                    ...returnAddresses, 
                    deliveryAddress: e.target.value 
                  })}
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="alert alert-info mb-3">
                <span>ℹ️</span>
                <div>
                  <strong>How it works:</strong>
                  <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
                    <li>Same delivery agent will be automatically assigned</li>
                    <li>No payment required - completely FREE</li>
                    <li>You'll receive a new verification code</li>
                    <li>Agent will pick up from you and deliver to owner</li>
                  </ul>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => {
                    setShowReturnModal(null);
                    setReturnAddresses({ pickupAddress: '', deliveryAddress: '' });
                  }}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                  disabled={processing !== null}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReturnDelivery(showReturnModal)}
                  className="btn btn-secondary"
                  style={{ flex: 2 }}
                  disabled={processing !== null}
                >
                  {processing === showReturnModal ? (
                    <>
                      <div className="spinner" style={{ 
                        width: '20px', 
                        height: '20px',
                        borderWidth: '2px'
                      }}></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <span>🔄</span>
                      <span>Request Return Delivery</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
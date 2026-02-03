// src/pages/delivery/track/[id].tsx - ENHANCED WITH VERIFICATION CODE ACCESS
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import api from '../../../utils/api';
import Layout from '../../../components/Layout';
import { Delivery } from '../../../types';

export default function TrackDelivery() {
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id) {
      loadDelivery();
      const interval = setInterval(loadDelivery, 30000);
      return () => clearInterval(interval);
    }
  }, [id]);

  const loadDelivery = async () => {
    try {
      const res = await api.get(`/delivery/track/${id}`);
      setDelivery(res.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load delivery information');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    if (!delivery?.verificationCode) return;
    
    try {
      await navigator.clipboard.writeText(delivery.verificationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = delivery.verificationCode;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        alert('Failed to copy code. Please copy manually: ' + delivery.verificationCode);
      }
      document.body.removeChild(textArea);
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap: { [key: string]: { icon: string; color: string; label: string; gradient: string } } = {
      PENDING: { icon: '⏳', color: '#f59e0b', label: 'Waiting for Agent', gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' },
      ASSIGNED: { icon: '👤', color: '#3b82f6', label: 'Agent Assigned', gradient: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)' },
      PICKED_UP: { icon: '📦', color: '#8b5cf6', label: 'Picked Up', gradient: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)' },
      IN_TRANSIT: { icon: '🚚', color: '#06b6d4', label: 'In Transit', gradient: 'linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)' },
      DELIVERED: { icon: '✅', color: '#10b981', label: 'Delivered', gradient: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)' },
      COMPLETED: { icon: '✓', color: '#6b7280', label: 'Completed', gradient: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' }
    };
    return statusMap[status] || { icon: '❓', color: '#6b7280', label: status, gradient: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' };
  };

  const getProgressPercentage = (status: string) => {
    const progressMap: { [key: string]: number } = {
      PENDING: 15,
      ASSIGNED: 30,
      PICKED_UP: 50,
      IN_TRANSIT: 75,
      DELIVERED: 90,
      COMPLETED: 100
    };
    return progressMap[status] || 0;
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  if (error || !delivery) {
    return (
      <Layout>
        <div className="card" style={{ maxWidth: '600px', margin: '3rem auto', padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
          <h2 style={{ color: 'var(--error)', marginBottom: '1rem' }}>
            {error || 'Delivery not found'}
          </h2>
          <button onClick={() => router.push('/')} className="btn btn-primary">
            Back to Home
          </button>
        </div>
      </Layout>
    );
  }

  const statusInfo = getStatusInfo(delivery.status);
  const progress = getProgressPercentage(delivery.status);

  return (
    <Layout>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ marginBottom: '0.5rem' }}>📦 Track Your Delivery</h1>
          <p style={{ color: 'var(--gray-600)' }}>
            Delivery ID: #{delivery.id} • Last updated: {new Date(delivery.updatedAt).toLocaleString()}
          </p>
        </div>

        {/* ✅ VERIFICATION CODE CARD - PROMINENTLY DISPLAYED */}
        {delivery.paymentStatus === 'COMPLETED' && delivery.verificationCode && (
          <div className="card" style={{
            background: delivery.codeVerifiedAt 
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white',
            padding: '2.5rem',
            marginBottom: '2rem',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            border: '3px solid rgba(255,255,255,0.3)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            {/* Animated Background Pattern */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.1,
              background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.1) 10px, rgba(255,255,255,.1) 20px)'
            }}></div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              {delivery.codeVerifiedAt ? (
                <>
                  <div style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    ✓ Code Verified Successfully
                  </div>
                  <div className="alert alert-success" style={{ 
                    background: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    marginBottom: '1.5rem',
                    border: '2px solid rgba(255,255,255,0.3)'
                  }}>
                    <span style={{ fontSize: '1.5rem' }}>✅</span>
                    <span>Verified on {new Date(delivery.codeVerifiedAt).toLocaleString()}</span>
                  </div>
                </>
              ) : (
                <div style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  🔐 Your 6-Digit Verification Code
                </div>
              )}

              {/* CODE DISPLAY */}
              <div style={{
                display: 'inline-block',
                padding: '2rem 3.5rem',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 'var(--radius-xl)',
                marginBottom: '1.5rem',
                backdropFilter: 'blur(10px)',
                border: '3px solid rgba(255,255,255,0.4)',
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.2)'
              }}>
                <div style={{
                  fontSize: '4rem',
                  fontWeight: '700',
                  letterSpacing: '0.8rem',
                  fontFamily: 'monospace',
                  textShadow: '0 4px 8px rgba(0,0,0,0.3)',
                  userSelect: 'all',
                  cursor: 'pointer'
                }}
                onClick={copyCode}
                title="Click to copy"
                >
                  {delivery.verificationCode}
                </div>
              </div>

              {/* COPY BUTTON */}
              <div style={{ marginBottom: '1.5rem' }}>
                <button
                  onClick={copyCode}
                  className="btn btn-secondary"
                  style={{
                    background: 'rgba(255,255,255,0.25)',
                    border: '2px solid rgba(255,255,255,0.4)',
                    backdropFilter: 'blur(10px)',
                    fontSize: '1.25rem',
                    padding: '1rem 2.5rem',
                    fontWeight: '700',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.35)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {copied ? (
                    <>
                      <span style={{ fontSize: '1.5rem' }}>✓</span>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: '1.5rem' }}>📋</span>
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              {/* INSTRUCTIONS */}
              {!delivery.codeVerifiedAt && (
                <div style={{ 
                  marginTop: '1.5rem',
                  padding: '1.5rem',
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: 'var(--radius-lg)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255,255,255,0.2)',
                  fontSize: '0.95rem',
                  lineHeight: 1.8,
                  textAlign: 'left'
                }}>
                  <div style={{ fontWeight: '700', marginBottom: '0.75rem', fontSize: '1.1rem' }}>
                    📌 IMPORTANT INSTRUCTIONS:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                    <li style={{ marginBottom: '0.5rem' }}>
                      <strong>Share this code ONLY with the delivery agent</strong> when they arrive for pickup
                    </li>
                    <li style={{ marginBottom: '0.5rem' }}>
                      The agent MUST verify this code before collecting the book
                    </li>
                    <li style={{ marginBottom: '0.5rem' }}>
                      Keep this code safe - you can access it anytime on this page
                    </li>
                    <li>
                      Do NOT share this code with anyone else for security
                    </li>
                  </ul>
                </div>
              )}

              {delivery.codeVerifiedAt && (
                <div style={{ 
                  marginTop: '1rem',
                  fontSize: '0.95rem',
                  opacity: 0.95,
                  fontStyle: 'italic'
                }}>
                  Your code has been verified. The delivery agent can now proceed with pickup.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment Pending Alert */}
        {delivery.paymentStatus === 'PENDING' && (
          <div className="alert alert-warning mb-3">
            <span>⏳</span>
            <div>
              <strong>Payment Pending</strong>
              <p style={{ margin: '0.5rem 0 0 0' }}>
                Please complete the payment to receive your verification code.
                <a href={`/delivery/payment/${delivery.id}`} style={{ marginLeft: '0.5rem', fontWeight: 'bold' }}>
                  Pay Now →
                </a>
              </p>
            </div>
          </div>
        )}

        {/* No Code Available (not authorized) */}
        {delivery.paymentStatus === 'COMPLETED' && !delivery.verificationCode && (
          <div className="alert alert-info mb-3">
            <span>ℹ️</span>
            <div>
              <strong>Verification Code</strong>
              <p style={{ margin: '0.5rem 0 0 0' }}>
                Only the borrower, book owner, or assigned delivery agent can view the verification code for security reasons.
              </p>
            </div>
          </div>
        )}

        {/* Current Status Card */}
        <div className="card" style={{
          background: statusInfo.gradient,
          color: 'white',
          padding: '3rem',
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>
            {statusInfo.icon}
          </div>
          <h2 style={{ color: 'white', fontSize: '2rem', marginBottom: '0.5rem' }}>
            {statusInfo.label}
          </h2>
          <p style={{ fontSize: '1.125rem', color: 'rgba(255,255,255,0.9)' }}>
            {delivery.borrowRequest?.book?.title ?? 'Unknown Title'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Delivery Progress</h3>
          <div style={{
            width: '100%',
            height: '12px',
            background: 'var(--gray-200)',
            borderRadius: '9999px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: statusInfo.gradient,
              transition: 'width 0.5s ease',
              borderRadius: '9999px'
            }}>
              <div style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: progress > 50 ? 'white' : 'var(--gray-700)',
                fontWeight: '700',
                fontSize: '0.75rem'
              }}>
                {progress}%
              </div>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2" style={{ marginBottom: '2rem' }}>
          <div className="card">
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📍</span> Addresses
            </h3>
            <div style={{ marginBottom: '1.5rem' }}>
              <div className="label">Pickup Location</div>
              <p style={{ margin: 0 }}>{delivery.pickupAddress}</p>
            </div>
            <div>
              <div className="label">Delivery Location</div>
              <p style={{ margin: 0 }}>{delivery.deliveryAddress}</p>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>👥</span> People Involved
            </h3>
            <div style={{ marginBottom: '1rem' }}>
              <div className="label">Book Owner</div>
              <p style={{ margin: 0 }}>{delivery.borrowRequest?.book.owner?.name ?? 'Unknown Owner'}</p>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <div className="label">Borrower</div>
              <p style={{ margin: 0 }}>{delivery.borrowRequest?.borrower?.name}</p>
            </div>
            {delivery.agent && (
              <div>
                <div className="label">Delivery Agent</div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  background: 'var(--gray-50)',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '700'
                  }}>
                    {delivery.agent.name.charAt(0)}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: '600' }}>{delivery.agent.name}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tracking Notes */}
        {delivery.trackingNotes && (
          <div className="alert alert-info mb-3">
            <span style={{ fontSize: '1.5rem' }}>📝</span>
            <div>
              <strong>Tracking Notes</strong>
              <p style={{ margin: '0.5rem 0 0 0' }}>{delivery.trackingNotes}</p>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="card" style={{ padding: '2rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '2rem' }}>⏱️ Delivery Timeline</h3>
          <div style={{ position: 'relative' }}>
            <TimelineItem
              date={delivery.createdAt}
              title="Delivery Requested"
              icon="📋"
              completed={true}
              isLast={false}
            />
            {delivery.pickupScheduled && (
              <TimelineItem
                date={delivery.pickupScheduled}
                title="Pickup Scheduled"
                icon="📅"
                completed={true}
                isLast={false}
              />
            )}
            {delivery.pickupCompleted && (
              <TimelineItem
                date={delivery.pickupCompleted}
                title="Pickup Completed"
                icon="📦"
                completed={true}
                isLast={false}
              />
            )}
            {delivery.deliveryCompleted && (
              <TimelineItem
                date={delivery.deliveryCompleted}
                title="Delivery Completed"
                icon="✅"
                completed={true}
                isLast={true}
              />
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button onClick={loadDelivery} className="btn btn-primary">
            <span>🔄</span>
            <span>Refresh Status</span>
          </button>
          <button onClick={() => router.push('/requests')} className="btn btn-outline">
            <span>←</span>
            <span>Back to Requests</span>
          </button>
        </div>

        <p style={{
          textAlign: 'center',
          marginTop: '1rem',
          fontSize: '0.875rem',
          color: 'var(--gray-500)'
        }}>
          ⏰ Auto-refreshes every 30 seconds
        </p>
      </div>
    </Layout>
  );
}

function TimelineItem({
  date,
  title,
  icon,
  completed,
  isLast
}: {
  date: Date;
  title: string;
  icon: string;
  completed: boolean;
  isLast: boolean;
}) {
  return (
    <div style={{
      display: 'flex',
      gap: '1.5rem',
      marginBottom: isLast ? 0 : '2rem',
      position: 'relative'
    }}>
      {!isLast && (
        <div style={{
          position: 'absolute',
          left: '20px',
          top: '50px',
          bottom: '-30px',
          width: '2px',
          background: completed ? 'var(--success)' : 'var(--gray-300)'
        }} />
      )}
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: completed
          ? 'linear-gradient(135deg, #34d399 0%, #10b981 100%)'
          : 'var(--gray-200)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.25rem',
        flexShrink: 0,
        boxShadow: completed ? 'var(--shadow-md)' : 'none',
        zIndex: 1
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, paddingTop: '0.25rem' }}>
        <h4 style={{
          margin: 0,
          marginBottom: '0.25rem',
          color: completed ? 'var(--gray-900)' : 'var(--gray-500)',
          fontWeight: completed ? '600' : '500'
        }}>
          {title}
        </h4>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--gray-500)' }}>
          {new Date(date).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
// src/pages/delivery/request.tsx - COMPLETE WORKFLOW WITH PAYMENT & CODE
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';

export default function RequestDelivery() {
  const [borrowRequests, setBorrowRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<number | null>(null);
  const [pickupAddress, setPickupAddress] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [dataLoading, setDataLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Workflow states
  const [currentStep, setCurrentStep] = useState<'form' | 'payment' | 'success'>('form');
  const [deliveryId, setDeliveryId] = useState<number | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(50);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [agentsNotified, setAgentsNotified] = useState(0);
  
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    loadAcceptedRequests();
  }, [isAuthenticated, loading, router]);

  const loadAcceptedRequests = async () => {
    try {
      const res = await api.get('/requests');
      
      const acceptedOutgoing = res.data.outgoing.filter(
        (r: any) => r.status === 'ACCEPTED' && !r.delivery
      );

      setBorrowRequests(acceptedOutgoing);
    } catch (err) {
      console.error('Error loading requests:', err);
      setError('Failed to load borrow requests');
    } finally {
      setDataLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRequest) {
      alert('Please select a borrow request');
      return;
    }

    if (!pickupAddress.trim() || !deliveryAddress.trim()) {
      alert('Please provide both pickup and delivery addresses');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await api.post('/delivery/create', {
        borrowRequestId: selectedRequest,
        pickupAddress: pickupAddress.trim(),
        deliveryAddress: deliveryAddress.trim()
      });

      // ✅ STORE DELIVERY INFO
      setDeliveryId(res.data.delivery.id);
      setVerificationCode(res.data.verificationCode);
      setPaymentAmount(res.data.paymentAmount || 50);
      setAgentsNotified(res.data.agentsNotified || 0);
      
      // ✅ MOVE TO PAYMENT STEP
      setCurrentStep('payment');
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create delivery request');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayment = async () => {
    if (!deliveryId) return;

    setProcessingPayment(true);
    setError('');

    try {
      const res = await api.post(`/delivery/${deliveryId}/payment`, {
        paymentMethod
      });

      // ✅ PAYMENT SUCCESSFUL - MOVE TO SUCCESS STEP
      setCurrentStep('success');
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'Payment failed. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(verificationCode);
    alert('✅ Verification code copied to clipboard!');
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
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Progress Steps */}
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '3rem',
          position: 'relative'
        }}>
          <StepIndicator 
            step={1}
            label="Request Delivery"
            active={currentStep === 'form'}
            completed={currentStep !== 'form'}
          />
          <StepIndicator 
            step={2}
            label="Make Payment"
            active={currentStep === 'payment'}
            completed={currentStep === 'success'}
          />
          <StepIndicator 
            step={3}
            label="Get Code"
            active={currentStep === 'success'}
            completed={false}
          />
          
          {/* Progress Line */}
          <div style={{
            position: 'absolute',
            top: '25px',
            left: '10%',
            right: '10%',
            height: '2px',
            background: 'var(--gray-300)',
            zIndex: -1
          }}>
            <div style={{
              height: '100%',
              background: 'var(--primary)',
              width: currentStep === 'form' ? '0%' : currentStep === 'payment' ? '50%' : '100%',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* STEP 1: DELIVERY REQUEST FORM */}
        {currentStep === 'form' && (
          <div className="card" style={{ padding: '2.5rem' }}>
            <h1 style={{ marginBottom: '0.5rem' }}>🚚 Request Delivery Service</h1>
            <p style={{ color: 'var(--gray-600)', marginBottom: '2rem' }}>
              Fill in the details and we'll notify all available delivery agents.
            </p>

            <div className="alert alert-info mb-3">
              <span style={{ fontSize: '1.5rem' }}>ℹ️</span>
              <div>
                <strong>How it works:</strong>
                <ol style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
                  <li>Select your accepted borrow request</li>
                  <li>Enter pickup & delivery addresses</li>
                  <li>All agents will be notified - first to accept gets it</li>
                  <li>Pay ₹50 delivery fee</li>
                  <li>Get 6-digit code to share with agent</li>
                  <li>Track your delivery in real-time</li>
                </ol>
              </div>
            </div>

            {error && (
              <div className="alert alert-error mb-3">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {borrowRequests.length === 0 ? (
              <div style={{
                padding: '4rem 2rem',
                textAlign: 'center',
                background: 'var(--gray-50)',
                borderRadius: 'var(--radius-lg)'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
                <h2>No Accepted Requests</h2>
                <p style={{ color: 'var(--gray-600)', marginBottom: '2rem' }}>
                  You need an accepted borrow request before requesting delivery.
                </p>
                <a href="/requests" className="btn btn-primary">
                  View Requests
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="label">Select Book to Deliver</label>
                  <select
                    value={selectedRequest || ''}
                    onChange={(e) => setSelectedRequest(Number(e.target.value))}
                    required
                    className="input"
                  >
                    <option value="">-- Choose a book --</option>
                    {borrowRequests.map((request) => (
                      <option key={request.id} value={request.id}>
                        "{request.book.title}" by {request.book.author}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="label">Pickup Address (Book Owner's Location)</label>
                  <textarea
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    placeholder="Enter complete address with landmarks"
                    required
                    rows={3}
                    className="input"
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <label className="label">Delivery Address (Your Location)</label>
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter your complete address with landmarks"
                    required
                    rows={3}
                    className="input"
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={submitting}
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%' }}
                >
                  {submitting ? (
                    <>
                      <div className="spinner" style={{ 
                        width: '20px', 
                        height: '20px',
                        borderWidth: '2px'
                      }}></div>
                      <span>Creating Request...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue to Payment</span>
                      <span>→</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* STEP 2: PAYMENT */}
        {currentStep === 'payment' && (
          <div className="card" style={{ padding: '2.5rem' }}>
            <h1 style={{ marginBottom: '0.5rem' }}>💳 Complete Payment</h1>
            <p style={{ color: 'var(--gray-600)', marginBottom: '2rem' }}>
              {agentsNotified} delivery agents have been notified. Complete payment to proceed.
            </p>

            <div className="alert alert-success mb-3">
              <span>✅</span>
              <div>
                <strong>Delivery Request Created!</strong>
                <p style={{ margin: '0.5rem 0 0 0' }}>
                  All available agents have been notified. First agent to accept will handle your delivery.
                </p>
              </div>
            </div>

            {/* Amount Display */}
            <div style={{
              padding: '2rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 'var(--radius-lg)',
              color: 'white',
              textAlign: 'center',
              marginBottom: '2rem'
            }}>
              <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem', opacity: 0.9 }}>
                Delivery Fee
              </div>
              <div style={{ fontSize: '3rem', fontWeight: '700' }}>
                ₹{paymentAmount}
              </div>
            </div>

            {/* Payment Methods */}
            <div style={{ marginBottom: '2rem' }}>
              <label className="label">Select Payment Method</label>
              
              {['card', 'upi', 'wallet'].map((method) => (
                <label
                  key={method}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '1rem',
                    border: paymentMethod === method ? '2px solid var(--primary)' : '2px solid var(--gray-300)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '0.75rem',
                    cursor: 'pointer',
                    background: paymentMethod === method ? 'var(--gray-50)' : 'white',
                    transition: 'var(--transition)'
                  }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method}
                    checked={paymentMethod === method}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{ marginRight: '1rem' }}
                  />
                  <span style={{ fontSize: '1.5rem', marginRight: '1rem' }}>
                    {method === 'card' ? '💳' : method === 'upi' ? '📱' : '👛'}
                  </span>
                  <div>
                    <div style={{ fontWeight: '600' }}>
                      {method === 'card' ? 'Credit/Debit Card' : 
                       method === 'upi' ? 'UPI' : 'Digital Wallet'}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                      {method === 'card' ? 'Visa, Mastercard, RuPay' : 
                       method === 'upi' ? 'Google Pay, PhonePe, Paytm' : 'Paytm, Amazon Pay'}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="alert alert-warning mb-3">
              <span>⚠️</span>
              <div>
                <strong>Demo Mode:</strong> This is a simulated payment. Click Pay Now to continue.
              </div>
            </div>

            {error && (
              <div className="alert alert-error mb-3">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => {
                  setCurrentStep('form');
                  setError('');
                }}
                className="btn btn-outline"
                style={{ flex: 1 }}
              >
                ← Back
              </button>
              <button
                onClick={handlePayment}
                disabled={processingPayment}
                className="btn btn-secondary btn-lg"
                style={{ flex: 2 }}
              >
                {processingPayment ? (
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
                    <span>Pay ₹{paymentAmount}</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS & CODE DISPLAY */}
        {currentStep === 'success' && (
          <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>✅</div>
            <h1 style={{ color: 'var(--success)', marginBottom: '1rem' }}>
              Payment Successful!
            </h1>
            <p style={{ fontSize: '1.125rem', color: 'var(--gray-600)', marginBottom: '3rem' }}>
              Your delivery has been assigned. An agent will contact you soon.
            </p>
            
            {/* Verification Code Display */}
            <div style={{
              padding: '2.5rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 'var(--radius-xl)',
              marginBottom: '2rem'
            }}>
              <div style={{ 
                fontSize: '1rem', 
                color: 'rgba(255,255,255,0.9)',
                marginBottom: '1rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}>
                Your Verification Code
              </div>
              <div style={{
                fontSize: '3.5rem',
                fontWeight: '700',
                color: 'white',
                letterSpacing: '0.5rem',
                fontFamily: 'monospace',
                marginBottom: '1.5rem',
                textShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
                {verificationCode}
              </div>
              <button
                onClick={copyCode}
                className="btn btn-secondary"
                style={{ 
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <span>📋</span>
                <span>Copy Code</span>
              </button>
            </div>

            {/* Important Instructions */}
            <div className="alert alert-warning" style={{ textAlign: 'left', marginBottom: '2rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🔐</span>
              <div>
                <strong>IMPORTANT - Keep This Code Safe!</strong>
                <ul style={{ margin: '0.75rem 0 0 0', paddingLeft: '1.5rem' }}>
                  <li>Share ONLY with the delivery agent when they arrive</li>
                  <li>Agent must verify this code before pickup</li>
                  <li>Do NOT share with anyone else</li>
                  <li>You can find this code later in your requests</li>
                </ul>
              </div>
            </div>

            {/* Next Steps */}
            <div style={{ 
              padding: '1.5rem',
              background: 'var(--gray-50)',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'left',
              marginBottom: '2rem'
            }}>
              <h3 style={{ marginTop: 0 }}>📋 What Happens Next?</h3>
              <ol style={{ paddingLeft: '1.5rem', margin: 0 }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  An agent will accept your delivery request
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  Agent will contact you to coordinate pickup
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  Share this 6-digit code when agent arrives
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  Track your delivery in real-time
                </li>
                <li>
                  Receive your book at your doorstep!
                </li>
              </ol>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <a 
                href={`/delivery/track/${deliveryId}`}
                className="btn btn-primary btn-lg"
              >
                <span>🚚</span>
                <span>Track Delivery</span>
              </a>
              <a 
                href="/requests"
                className="btn btn-outline btn-lg"
              >
                <span>←</span>
                <span>Back to Requests</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function StepIndicator({ 
  step, 
  label, 
  active, 
  completed 
}: { 
  step: number;
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      zIndex: 1
    }}>
      <div style={{
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        background: completed 
          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
          : active 
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'var(--gray-300)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.5rem',
        fontWeight: '700',
        marginBottom: '0.75rem',
        boxShadow: (active || completed) ? 'var(--shadow-lg)' : 'none',
        transition: 'var(--transition)'
      }}>
        {completed ? '✓' : step}
      </div>
      <div style={{
        fontSize: '0.875rem',
        fontWeight: active ? '600' : '500',
        color: active ? 'var(--gray-900)' : 'var(--gray-600)',
        textAlign: 'center',
        maxWidth: '120px'
      }}>
        {label}
      </div>
    </div>
  );
}
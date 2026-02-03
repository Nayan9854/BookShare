// src/pages/delivery/payment/[id].tsx - FIXED RAZORPAY LOADING ISSUE
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Script from 'next/script';
import api from '../../../utils/api';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../context/AuthContext';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function DeliveryPayment() {
  const [delivery, setDelivery] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [error, setError] = useState('');
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { id } = router.query;

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
    if (id) {
      loadDelivery();
    }
  }, [isAuthenticated, id]);

  const loadDelivery = async () => {
    try {
      const res = await api.get(`/delivery/track/${id}`);
      setDelivery(res.data);
      
      if (res.data.paymentStatus === 'COMPLETED') {
        setError('Payment already completed for this delivery');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load delivery');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!razorpayLoaded || !window.Razorpay) {
      alert('Payment system is loading. Please wait...');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      // Create Razorpay order
      const orderRes = await api.post('/payment/create-order', {
        deliveryId: id,
        amount: delivery.paymentAmount || 50
      });

      const { orderId, amount, currency, keyId, verificationCode } = orderRes.data;

      // Razorpay options
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'BookShare Delivery',
        description: `Delivery Payment for Book: ${delivery.borrowRequest?.book?.title}`,
        order_id: orderId,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyRes = await api.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              deliveryId: id
            });

            alert(`✅ ${verifyRes.data.message}\n\n🔐 Your Verification Code: ${verifyRes.data.verificationCode}\n\nShare this code with the delivery agent when they arrive.`);
            
            // Redirect to tracking page
            router.push(`/delivery/track/${id}`);
          } catch (err: any) {
            alert('❌ Payment verification failed. Please contact support.');
            console.error('Verification error:', err);
          } finally {
            setProcessing(false);
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
            setProcessing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', function (response: any) {
        alert(`❌ Payment failed: ${response.error.description}`);
        console.error('Payment error:', response.error);
        setProcessing(false);
      });

      rzp.open();

    } catch (err: any) {
      setError(err.response?.data?.error || 'Payment failed');
      setProcessing(false);
    }
  };

  if (!isAuthenticated) return null;

  if (loading) {
    return <Layout><div className="spinner"></div></Layout>;
  }

  if (error && !delivery) {
    return (
      <Layout>
        <div className="card" style={{ maxWidth: '600px', margin: '50px auto', padding: '40px', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--error)' }}>❌ {error}</h2>
          <button onClick={() => router.push('/requests')} className="btn btn-primary" style={{ marginTop: '20px' }}>
            Back to Requests
          </button>
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
        <div style={{ maxWidth: '600px', margin: '50px auto' }}>
          <h1>💳 Payment Gateway</h1>
          
          {/* Delivery Summary */}
          <div className="card" style={{ marginBottom: '30px' }}>
            <h2 style={{ marginTop: 0 }}>Delivery Summary</h2>
            <div style={{ marginBottom: '10px' }}>
              <strong>Delivery ID:</strong> #{delivery?.id}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Book:</strong> {delivery?.borrowRequest?.book?.title}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Status:</strong> {delivery?.status}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Pickup:</strong> {delivery?.pickupAddress}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Delivery:</strong> {delivery?.deliveryAddress}
            </div>
          </div>

          {/* Payment Form */}
          <div className="card">
            <h2 style={{ marginTop: 0 }}>Payment Details</h2>

            {/* Amount */}
            <div style={{
              padding: '20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 'var(--radius-lg)',
              color: 'white',
              marginBottom: '25px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '14px', marginBottom: '5px', opacity: 0.9 }}>
                Amount to Pay
              </div>
              <div style={{ fontSize: '48px', fontWeight: 'bold' }}>
                ₹{delivery?.paymentAmount || 50}
              </div>
            </div>

            {delivery?.paymentStatus === 'COMPLETED' && (
              <div className="alert alert-success mb-3">
                <span>✅</span>
                <span>Payment already completed for this delivery.</span>
              </div>
            )}

            {error && (
              <div className="alert alert-error mb-3">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className="alert alert-info mb-3">
              <span>🔐</span>
              <div>
                <strong>Secure Payment:</strong> Your payment is processed securely through Razorpay. 
                After successful payment, you'll receive a 6-digit verification code to share with the delivery agent.
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handlePayment}
              disabled={processing || !razorpayLoaded || delivery?.paymentStatus === 'COMPLETED'}
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
            >
              {processing ? (
                <>
                  <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                  <span>Processing...</span>
                </>
              ) : !razorpayLoaded ? (
                <>
                  <span>⏳</span>
                  <span>Loading Payment Gateway...</span>
                </>
              ) : (
                <>
                  <span>💳</span>
                  <span>Pay ₹{delivery?.paymentAmount || 50} via Razorpay</span>
                </>
              )}
            </button>

            {/* Security Badge */}
            <div style={{
              marginTop: '20px',
              textAlign: 'center',
              fontSize: '12px',
              color: 'var(--gray-500)'
            }}>
              🔒 Secured by Razorpay with 256-bit SSL encryption
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
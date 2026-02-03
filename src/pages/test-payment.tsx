// src/pages/test-payment.tsx - FIXED RAZORPAY LOADING ISSUE
import { useState, useEffect } from 'react';
import Script from 'next/script';
import Layout from '../components/Layout';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function TestPayment() {
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [amount, setAmount] = useState(50);
  const [status, setStatus] = useState('');

  // ✅ FIX: Check if Razorpay is already loaded on mount (from cache)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      console.log('Razorpay already loaded from cache');
      setRazorpayLoaded(true);
      setStatus('✅ Razorpay SDK loaded successfully (from cache)');
    }
  }, []);

  const testPayment = () => {
    if (!razorpayLoaded || !window.Razorpay) {
      alert('Razorpay not loaded yet. Please wait...');
      return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: amount * 100, // Amount in paise
      currency: 'INR',
      name: 'BookShare Test',
      description: 'Test Payment',
      handler: function (response: any) {
        setStatus(`✅ Payment Success!\nPayment ID: ${response.razorpay_payment_id}`);
        console.log('Payment response:', response);
      },
      prefill: {
        name: 'Test User',
        email: 'test@example.com',
      },
      theme: {
        color: '#3498db'
      },
      modal: {
        ondismiss: function() {
          setStatus('❌ Payment cancelled by user');
        }
      }
    };

    const rzp = new window.Razorpay(options);
    
    rzp.on('payment.failed', function (response: any) {
      setStatus(`❌ Payment Failed!\nError: ${response.error.description}`);
      console.error('Payment error:', response.error);
    });

    rzp.open();
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('Razorpay script loaded');
          setRazorpayLoaded(true);
          setStatus('✅ Razorpay SDK loaded successfully');
        }}
        onError={() => {
          setStatus('❌ Failed to load Razorpay SDK');
        }}
      />

      <Layout>
        <div style={{ maxWidth: '600px', margin: '50px auto' }}>
          <h1>🧪 Razorpay Payment Test</h1>
          
          <div style={{
            padding: '20px',
            background: '#fff3cd',
            borderRadius: '8px',
            marginBottom: '30px',
            fontSize: '14px'
          }}>
            <strong>⚠️ Testing Only:</strong> This page is for testing Razorpay integration.
            Delete this file before deploying to production.
          </div>

          {/* Status */}
          {status && (
            <div style={{
              padding: '15px',
              background: status.includes('❌') ? '#ffebee' : '#e8f5e9',
              color: status.includes('❌') ? '#c62828' : '#2e7d32',
              borderRadius: '8px',
              marginBottom: '20px',
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              fontSize: '13px'
            }}>
              {status}
            </div>
          )}

          {/* Configuration Check */}
          <div style={{
            padding: '20px',
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px',
            marginBottom: '30px'
          }}>
            <h3 style={{ marginTop: 0 }}>Configuration Check</h3>
            <div style={{ fontSize: '14px', fontFamily: 'monospace' }}>
              <div style={{ marginBottom: '10px' }}>
                <strong>Razorpay SDK:</strong> {razorpayLoaded ? '✅ Loaded' : '⏳ Loading...'}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Key ID:</strong> {process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ? 
                  `✅ ${process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID}` : 
                  '❌ Not configured'}
              </div>
              <div>
                <strong>Environment:</strong> {
                  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.startsWith('rzp_test_') ? 
                  'Test Mode' : 
                  'Live Mode'
                }
              </div>
            </div>
          </div>

          {/* Test Payment Form */}
          <div style={{
            padding: '30px',
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px'
          }}>
            <h3 style={{ marginTop: 0 }}>Test Payment</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                Amount (₹)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min="1"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
            </div>

            <button
              onClick={testPayment}
              disabled={!razorpayLoaded}
              style={{
                width: '100%',
                padding: '15px',
                background: razorpayLoaded ? '#3498db' : '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: razorpayLoaded ? 'pointer' : 'not-allowed'
              }}
            >
              {razorpayLoaded ? '💳 Open Razorpay Checkout' : '⏳ Loading...'}
            </button>
          </div>

          {/* Test Cards */}
          <div style={{
            padding: '20px',
            background: '#e3f2fd',
            borderRadius: '8px',
            marginTop: '30px'
          }}>
            <h3 style={{ marginTop: 0 }}>Test Card Details</h3>
            <div style={{ fontSize: '14px' }}>
              <div style={{ marginBottom: '15px' }}>
                <strong>Successful Payment:</strong>
                <div style={{ fontFamily: 'monospace', marginTop: '5px' }}>
                  Card: 4111 1111 1111 1111<br/>
                  CVV: 123<br/>
                  Expiry: 12/25
                </div>
              </div>
              <div>
                <strong>Failed Payment:</strong>
                <div style={{ fontFamily: 'monospace', marginTop: '5px' }}>
                  Card: 4000 0000 0000 0002<br/>
                  CVV: 123<br/>
                  Expiry: 12/25
                </div>
              </div>
            </div>
          </div>

          {/* Debug Info */}
          <div style={{
            padding: '20px',
            background: '#f5f5f5',
            borderRadius: '8px',
            marginTop: '30px',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}>
            <strong>Debug Info:</strong><br/>
            Window.Razorpay exists: {typeof window !== 'undefined' && window.Razorpay ? '✅ Yes' : '❌ No'}<br/>
            razorpayLoaded state: {razorpayLoaded ? '✅ True' : '❌ False'}<br/>
            Script strategy: afterInteractive
          </div>
        </div>
      </Layout>
    </>
  );
}
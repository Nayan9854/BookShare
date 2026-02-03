// src/pages/delivery/return.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';

export default function RequestReturnDelivery() {
  const [borrowedBooks, setBorrowedBooks] = useState<any[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [pickupAddress, setPickupAddress] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadBorrowedBooks();
  }, [isAuthenticated]);

  const loadBorrowedBooks = async () => {
    try {
      const res = await api.get('/user/borrowed-books');
      // Filter books without return delivery
      const booksToReturn = res.data.filter((book: any) => 
        book.status === 'BORROWED' && !book.returnDelivery
      );
      setBorrowedBooks(booksToReturn);
    } catch (err) {
      console.error('Error loading borrowed books:', err);
      setError('Failed to load borrowed books');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBookId) {
      alert('Please select a book to return');
      return;
    }

    if (!pickupAddress.trim() || !deliveryAddress.trim()) {
      alert('Please provide both pickup and delivery addresses');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Find the borrow request for this book
      const selectedBook = borrowedBooks.find(b => b.id === selectedBookId);
      if (!selectedBook || !selectedBook.borrowRequests[0]) {
        throw new Error('Borrow request not found');
      }

      await api.post('/delivery/create', {
        borrowRequestId: selectedBook.borrowRequests[0].id,
        pickupAddress: pickupAddress.trim(),
        deliveryAddress: deliveryAddress.trim(),
        isReturn: true // Mark as return delivery
      });

      alert('Return delivery request created successfully! An agent will be assigned soon.');
      router.push('/requests');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create return delivery request');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) return null;

  if (loading) {
    return <Layout><p>Loading...</p></Layout>;
  }

  return (
    <Layout>
      <div style={{ maxWidth: '800px', margin: '50px auto' }}>
        <h1>🔄 Request Return Delivery</h1>
        <p style={{ color: '#7f8c8d', marginBottom: '30px' }}>
          Request a delivery agent to pick up the book from you and return it to the owner.
        </p>

        {error && (
          <div style={{
            padding: '15px',
            background: '#ffebee',
            color: '#c62828',
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        {borrowedBooks.length === 0 ? (
          <div style={{
            padding: '60px 20px',
            textAlign: 'center',
            background: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <p style={{ fontSize: '18px', color: '#7f8c8d' }}>
              You don't have any books to return.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Select Book to Return */}
            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                Select Book to Return
              </label>
              <select
                value={selectedBookId || ''}
                onChange={(e) => setSelectedBookId(Number(e.target.value))}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="">-- Choose a book --</option>
                {borrowedBooks.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.title} by {book.author} - (Owner: {book.owner.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Pickup Address (Your Location) */}
            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                Pickup Address (Your Location)
              </label>
              <textarea
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="Enter your full address where the agent will pick up the book"
                required
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Delivery Address (Owner's Location) */}
            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                Delivery Address (Book Owner's Location)
              </label>
              <textarea
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Enter the book owner's full address"
                required
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Info Box */}
            <div style={{
              padding: '15px',
              background: '#fff3cd',
              borderLeft: '4px solid #ffc107',
              borderRadius: '4px',
              marginBottom: '25px'
            }}>
              <strong>⚠️ Important:</strong>
              <ul style={{ marginTop: '10px', marginBottom: 0, paddingLeft: '20px' }}>
                <li>Make sure the book is in good condition before returning</li>
                <li>Package the book securely if needed</li>
                <li>Be available at the pickup time</li>
                <li>You can track the return delivery status</li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '15px',
                background: submitting ? '#95a5a6' : '#e67e22',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'background 0.2s'
              }}
            >
              {submitting ? 'Creating Request...' : '🔄 Request Return Delivery'}
            </button>
          </form>
        )}
      </div>
    </Layout>
  );
}
// src/pages/books/[id].tsx - FIXED VERSION
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { Book } from '../../types';

export default function BookDetails() {
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { id } = router.query;
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (id) {
      loadBook();
    }
  }, [id]);

  const loadBook = async () => {
    try {
      // Use the public search API to get book details
      const res = await api.get(`/books/search?page=1&limit=100`);
      const foundBook = res.data.data.find((b: Book) => b.id === Number(id));
      
      if (foundBook) {
        setBook(foundBook);
      } else {
        setError('Book not found');
      }
    } catch (err) {
      console.error('Error loading book:', err);
      setError('Failed to load book');
    } finally {
      setLoading(false);
    }
  };

  const handleBorrowRequest = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    setRequesting(true);
    setError('');

    try {
      await api.post('/borrow/request', { bookId: book?.id });
      alert('Borrow request sent successfully!');
      router.push('/requests');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send borrow request');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return <Layout><p>Loading book details...</p></Layout>;
  }

  if (error || !book) {
    return (
      <Layout>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: '#e74c3c' }}>{error || 'Book not found'}</p>
          <a 
            href="/"
            style={{
              display: 'inline-block',
              marginTop: '15px',
              padding: '10px 20px',
              background: '#3498db',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px'
            }}
          >
            Back to Home
          </a>
        </div>
      </Layout>
    );
  }

  const isOwner = user?.id === book.ownerId;
  const averageRating = (book as any).averageRating || 0;

  return (
    <Layout>
      <div style={{ maxWidth: '800px', margin: '50px auto' }}>
        <div style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '30px',
          background: 'white',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        }}>
          <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
            {/* Book Cover */}
            {book.coverImage && (
              <div style={{ flexShrink: 0 }}>
                <img
                  src={book.coverImage}
                  alt={book.title}
                  style={{
                    width: '200px',
                    height: '300px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>
            )}

            {/* Book Details */}
            <div style={{ flex: 1, minWidth: '300px' }}>
              <h1 style={{ marginTop: 0, color: '#2c3e50' }}>{book.title}</h1>
              <p style={{ fontSize: '18px', color: '#7f8c8d', marginBottom: '20px' }}>
                by {book.author}
              </p>

              {/* Rating */}
              {averageRating > 0 && (
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ fontSize: '20px' }}>
                    {'⭐'.repeat(Math.round(averageRating))}
                    <span style={{ marginLeft: '10px', color: '#7f8c8d', fontSize: '16px' }}>
                      ({averageRating.toFixed(1)})
                    </span>
                  </div>
                </div>
              )}

              {/* Categories */}
              {book.categories && book.categories.length > 0 && (
                <div style={{ marginBottom: '15px' }}>
                  {book.categories.map((bc) => (
                    <span
                      key={bc.categoryId}
                      style={{
                        display: 'inline-block',
                        padding: '5px 10px',
                        background: '#e3f2fd',
                        color: '#1976d2',
                        fontSize: '12px',
                        borderRadius: '4px',
                        marginRight: '5px',
                        marginBottom: '5px'
                      }}
                    >
                      {bc.category?.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Book Info */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Owner:</strong> {book.owner?.name}
                </div>
                {book.isbn && (
                  <div style={{ marginBottom: '10px' }}>
                    <strong>ISBN:</strong> {book.isbn}
                  </div>
                )}
                {book.publishYear && (
                  <div style={{ marginBottom: '10px' }}>
                    <strong>Published:</strong> {book.publishYear}
                  </div>
                )}
                {book.pageCount && (
                  <div style={{ marginBottom: '10px' }}>
                    <strong>Pages:</strong> {book.pageCount}
                  </div>
                )}
                <div style={{ marginBottom: '10px' }}>
                  <strong>Language:</strong> {book.language}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Status:</strong>{' '}
                  <span style={{ 
                    color: book.status === 'AVAILABLE' ? '#27ae60' : '#f39c12',
                    fontWeight: 'bold'
                  }}>
                    {book.status === 'AVAILABLE' ? 'Available' : 'Borrowed'}
                  </span>
                </div>
              </div>

              {/* Description */}
              {book.description && (
                <div style={{ 
                  padding: '15px',
                  background: '#f8f9fa',
                  borderRadius: '4px',
                  marginBottom: '20px'
                }}>
                  <strong>Description:</strong>
                  <p style={{ marginTop: '10px', marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                    {book.description}
                  </p>
                </div>
              )}

              {/* Stats */}
              <div style={{ 
                display: 'flex', 
                gap: '20px',
                padding: '10px 0',
                borderTop: '1px solid #ddd',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
                  👁️ {book.viewCount} views
                </div>
                <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
                  📖 {book.borrowCount} borrows
                </div>
              </div>

              {book.status === 'BORROWED' && book.holder && (
                <div style={{ marginBottom: '20px' }}>
                  <strong>Currently held by:</strong> {book.holder.name}
                </div>
              )}

              {error && (
                <div style={{ 
                  padding: '10px', 
                  background: '#ffebee', 
                  color: '#c62828', 
                  borderRadius: '4px',
                  marginBottom: '20px'
                }}>
                  {error}
                </div>
              )}

              {/* Action Button */}
              {!isOwner && book.status === 'AVAILABLE' && (
                <button
                  onClick={handleBorrowRequest}
                  disabled={requesting}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: requesting ? '#95a5a6' : '#2ecc71',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: requesting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {requesting ? 'Sending Request...' : '📖 Request to Borrow'}
                </button>
              )}

              {isOwner && (
                <div style={{ 
                  padding: '15px', 
                  background: '#e8f5e9', 
                  borderRadius: '4px',
                  textAlign: 'center'
                }}>
                  This is your book
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
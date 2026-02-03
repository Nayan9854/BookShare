// src/pages/my-shelf.tsx - FIXED SESSION PERSISTENCE
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import api from '../utils/api';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { Book } from '../types';

type TabType = 'owned' | 'borrowed';

export default function MyShelf() {
  const [ownedBooks, setOwnedBooks] = useState<Book[]>([]);
  const [borrowedBooks, setBorrowedBooks] = useState<Book[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('owned');
  const [dataLoading, setDataLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    loadBooks();
  }, [isAuthenticated, loading, router]);

  const loadBooks = async () => {
    setDataLoading(true);
    try {
      const res = await api.get('/user/my-books');
      setOwnedBooks(res.data.owned || []);
      setBorrowedBooks(res.data.borrowed || []);
    } catch (err) {
      console.error('Error loading books:', err);
    } finally {
      setDataLoading(false);
    }
  };

  const handleToggleVisibility = async (bookId: number) => {
    if (processing) return;
    
    setProcessing(bookId);
    try {
      await api.patch(`/books/${bookId}/toggle-visibility`);
      await loadBooks();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to toggle visibility');
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (bookId: number) => {
    if (processing) return;

    const confirmed = confirm('Are you sure you want to delete this book? This action cannot be undone.');
    if (!confirmed) return;

    setProcessing(bookId);
    try {
      await api.delete(`/books/${bookId}/delete`);
      alert('Book deleted successfully!');
      await loadBooks();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete book');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return <Layout><p>Loading...</p></Layout>;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (dataLoading) {
    return <Layout><p>Loading your books...</p></Layout>;
  }

  const currentBooks = activeTab === 'owned' ? ownedBooks : borrowedBooks;

  return (
    <Layout>
      <div>
        <h1>📚 My Shelf</h1>

        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          marginBottom: '30px', 
          borderBottom: '2px solid #ddd' 
        }}>
          <button
            onClick={() => setActiveTab('owned')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'owned' ? '#3498db' : 'transparent',
              color: activeTab === 'owned' ? 'white' : '#333',
              border: 'none',
              borderBottom: activeTab === 'owned' ? '3px solid #2980b9' : 'none',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: activeTab === 'owned' ? 'bold' : 'normal'
            }}
          >
            My Books ({ownedBooks.length})
          </button>
          <button
            onClick={() => setActiveTab('borrowed')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'borrowed' ? '#3498db' : 'transparent',
              color: activeTab === 'borrowed' ? 'white' : '#333',
              border: 'none',
              borderBottom: activeTab === 'borrowed' ? '3px solid #2980b9' : 'none',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: activeTab === 'borrowed' ? 'bold' : 'normal'
            }}
          >
            Borrowed Books ({borrowedBooks.length})
          </button>
        </div>

        {/* Books Grid */}
        {currentBooks.length === 0 ? (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            background: '#f8f9fa', 
            borderRadius: '8px' 
          }}>
            <p>
              {activeTab === 'owned' 
                ? "You haven't added any books yet." 
                : "You're not currently borrowing any books."}
            </p>
            {activeTab === 'owned' && (
              <a 
                href="/add-book"
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
                Add Your First Book
              </a>
            )}
            {activeTab === 'borrowed' && (
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
                Browse Books
              </a>
            )}
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: '20px' 
          }}>
            {currentBooks.map((book) => (
              <div
                key={book.id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '20px',
                  background: book.isVisible ? 'white' : '#f8f9fa',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  opacity: book.isVisible ? 1 : 0.7
                }}
              >
                <h3 style={{ marginTop: 0, color: '#2c3e50' }}>
                  {book.title}
                  {!book.isVisible && activeTab === 'owned' && (
                    <span style={{ 
                      marginLeft: '10px', 
                      fontSize: '12px', 
                      color: '#e74c3c' 
                    }}>
                      (Hidden)
                    </span>
                  )}
                </h3>
                <p style={{ color: '#7f8c8d', fontSize: '14px' }}>
                  by {book.author}
                </p>

                {activeTab === 'borrowed' && book.owner && (
                  <p style={{ fontSize: '12px', color: '#95a5a6', marginBottom: '10px' }}>
                    Owner: {book.owner.name}
                  </p>
                )}

                <div style={{ 
                  marginTop: '15px', 
                  padding: '8px', 
                  background: book.status === 'AVAILABLE' ? '#d4edda' : '#fff3cd',
                  color: book.status === 'AVAILABLE' ? '#155724' : '#856404',
                  borderRadius: '4px',
                  fontSize: '14px',
                  textAlign: 'center'
                }}>
                  {book.status === 'AVAILABLE' ? '✓ Available' : '📤 Borrowed'}
                </div>

                {book.status === 'BORROWED' && book.holder && activeTab === 'owned' && (
                  <p style={{ 
                    marginTop: '10px', 
                    fontSize: '12px', 
                    color: '#95a5a6' 
                  }}>
                    Currently held by: {book.holder.name}
                  </p>
                )}

                {activeTab === 'owned' && (
                  <div style={{ 
                    marginTop: '15px', 
                    display: 'flex', 
                    gap: '5px' 
                  }}>
                    <button
                      onClick={() => handleToggleVisibility(book.id)}
                      disabled={processing === book.id || book.status === 'BORROWED'}
                      style={{
                        flex: 1,
                        padding: '8px',
                        background: book.isVisible ? '#f39c12' : '#27ae60',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: (processing === book.id || book.status === 'BORROWED') 
                          ? 'not-allowed' 
                          : 'pointer',
                        opacity: (processing === book.id || book.status === 'BORROWED') 
                          ? 0.5 
                          : 1,
                        fontSize: '12px'
                      }}
                      title={book.status === 'BORROWED' 
                        ? 'Cannot modify borrowed books' 
                        : book.isVisible ? 'Hide from public' : 'Show to public'}
                    >
                      {book.isVisible ? '👁️ Hide' : '👁️ Show'}
                    </button>
                    <button
                      onClick={() => handleDelete(book.id)}
                      disabled={processing === book.id || book.status === 'BORROWED'}
                      style={{
                        flex: 1,
                        padding: '8px',
                        background: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: (processing === book.id || book.status === 'BORROWED') 
                          ? 'not-allowed' 
                          : 'pointer',
                        opacity: (processing === book.id || book.status === 'BORROWED') 
                          ? 0.5 
                          : 1,
                        fontSize: '12px'
                      }}
                      title={book.status === 'BORROWED' 
                        ? 'Cannot delete borrowed books' 
                        : 'Delete book'}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
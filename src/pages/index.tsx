// src/pages/index.tsx - Modern Enhanced UI
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import SearchBar from "../components/SearchBar";
import api from "../utils/api";
import Link from "next/link";
import { Book, Category } from "../types";

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadBooks();
  }, [router.query, selectedCategory, sortBy, page]);

  const loadCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadBooks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (router.query.q) params.append('q', router.query.q as string);
      if (selectedCategory) params.append('category', selectedCategory);
      params.append('sortBy', sortBy);
      params.append('page', page.toString());
      params.append('limit', '12');

      const res = await api.get(`/books/search?${params.toString()}`);
      setBooks(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error("Error loading books:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    router.push(`/?q=${encodeURIComponent(query)}`);
    setPage(1);
  };

  return (
    <Layout>
      <div>
        {/* Hero Section */}
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '3rem 2rem',
          marginBottom: '3rem',
          color: 'white',
          textAlign: 'center',
          boxShadow: 'var(--shadow-xl)'
        }}>
          <h1 style={{ 
            color: 'white', 
            fontSize: '3rem', 
            marginBottom: '1rem',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            📖 Discover Amazing Books
          </h1>
          <p style={{ 
            fontSize: '1.25rem', 
            color: 'rgba(255,255,255,0.9)',
            maxWidth: '600px',
            margin: '0 auto 2rem'
          }}>
            Borrow, lend, and share books with our community
          </p>
          <SearchBar onSearch={handleSearch} />
        </div>

        {/* Filters */}
        <div style={{ 
          background: 'white',
          padding: '1.5rem',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '2rem',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          boxShadow: 'var(--shadow)'
        }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label className="label">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="input"
              style={{ padding: '0.625rem 1rem' }}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: '1', minWidth: '200px' }}>
            <label className="label">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="input"
              style={{ padding: '0.625rem 1rem' }}
            >
              <option value="recent">Most Recent</option>
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>

          {(router.query.q || selectedCategory) && (
            <button
              onClick={() => {
                router.push('/');
                setSelectedCategory('');
                setPage(1);
              }}
              className="btn btn-outline"
              style={{ alignSelf: 'flex-end' }}
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Results Count */}
        {router.query.q && (
          <div className="alert alert-info mb-3">
            Search results for "<strong>{router.query.q}</strong>"
          </div>
        )}

        {/* Books Grid */}
        {loading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            minHeight: '400px'
          }}>
            <div className="spinner"></div>
          </div>
        ) : books.length === 0 ? (
          <div className="card" style={{ 
            padding: '4rem 2rem', 
            textAlign: 'center' 
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
            <h2 style={{ marginBottom: '1rem' }}>No books found</h2>
            <p style={{ color: 'var(--gray-600)', marginBottom: '2rem' }}>
              {router.query.q ? 'Try a different search term.' : 'Be the first to add one!'}
            </p>
            <Link href="/add-book" className="btn btn-primary btn-lg">
              <span>➕</span> Add a Book
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4" style={{ marginBottom: '3rem' }}>
              {books.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '0.5rem',
                alignItems: 'center'
              }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn btn-outline"
                >
                  ← Previous
                </button>

                <div style={{ 
                  padding: '0.75rem 1.5rem',
                  background: 'white',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: '600',
                  boxShadow: 'var(--shadow)'
                }}>
                  Page {page} of {totalPages}
                </div>

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn btn-outline"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

function BookCard({ book }: { book: Book & { averageRating?: number } }) {
  return (
    <Link 
      href={`/books/${book.id}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div className="card" style={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        overflow: 'hidden',
        padding: 0
      }}>
        {/* Book Cover */}
        <div style={{
          width: '100%',
          height: '250px',
          background: book.coverImage 
            ? `url(${book.coverImage}) center/cover`
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '4rem',
          position: 'relative'
        }}>
          {!book.coverImage && '📖'}
          
          {/* Status Badge */}
          <div style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem'
          }}>
            <span className={book.status === 'AVAILABLE' ? 'badge badge-success' : 'badge badge-warning'}>
              {book.status === 'AVAILABLE' ? '✓ Available' : '📤 Borrowed'}
            </span>
          </div>
        </div>

        {/* Card Content */}
        <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ 
            marginTop: 0,
            marginBottom: '0.5rem',
            fontSize: '1.125rem',
            color: 'var(--gray-900)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}>
            {book.title}
          </h3>
          
          <p style={{ 
            color: 'var(--gray-600)',
            fontSize: '0.875rem',
            marginBottom: '1rem'
          }}>
            by {book.author}
          </p>

          {/* Categories */}
          {book.categories && book.categories.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              {book.categories.slice(0, 2).map((bc) => (
                <span
                  key={bc.categoryId}
                  style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.625rem',
                    background: 'var(--gray-100)',
                    color: 'var(--gray-700)',
                    fontSize: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    marginRight: '0.5rem',
                    marginBottom: '0.5rem',
                    fontWeight: '500'
                  }}
                >
                  {bc.category?.name}
                </span>
              ))}
            </div>
          )}

          {/* Rating */}
          {book.averageRating && book.averageRating > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.25rem' }}>
                {'⭐'.repeat(Math.round(book.averageRating))}
              </span>
              <span style={{ 
                marginLeft: '0.5rem',
                color: 'var(--gray-600)',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                {book.averageRating.toFixed(1)}
              </span>
            </div>
          )}

          <div style={{ 
            marginTop: 'auto',
            paddingTop: '1rem',
            borderTop: '1px solid var(--gray-200)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.75rem',
            color: 'var(--gray-500)'
          }}>
            <span>👁️ {book.viewCount} views</span>
            <span>📖 {book.borrowCount} borrows</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
// src/pages/add-book.tsx - FIXED SESSION PERSISTENCE
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../utils/api';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { Category } from '../types';

export default function AddBook() {
  const [form, setForm] = useState({
    title: '',
    author: '',
    isbn: '',
    description: '',
    publishYear: '',
    pageCount: '',
    language: 'English'
  });
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    
    if (!isAuthenticated && router.isReady) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('Only image files are allowed');
        return;
      }
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const toggleCategory = (categoryId: number) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Step 1: Create the book
      const bookData = {
        ...form,
        publishYear: form.publishYear ? parseInt(form.publishYear) : undefined,
        pageCount: form.pageCount ? parseInt(form.pageCount) : undefined
      };

      const bookRes = await api.post('/books', bookData);
      const createdBook = bookRes.data;

      // Step 2: Upload cover if provided
      if (coverFile) {
        const formData = new FormData();
        formData.append('cover', coverFile);

        await api.post(`/books/${createdBook.id}/upload-cover`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      // Step 3: Assign categories if selected
      if (selectedCategories.length > 0) {
        await Promise.all(
          selectedCategories.map(categoryId =>
            api.post(`/books/${createdBook.id}/categories`, { categoryId })
          )
        );
      }

      alert('Book added successfully!');
      router.push('/my-shelf');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add book');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Layout><div>Loading...</div></Layout>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <div style={{ maxWidth: '800px', margin: '50px auto' }}>
        <h1>➕ Add a New Book</h1>
        
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

        <form onSubmit={handleSubmit}>
          {/* Cover Image Upload */}
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
              Book Cover (Optional)
            </label>
            {coverPreview && (
              <div style={{ marginBottom: '15px' }}>
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  style={{
                    maxWidth: '200px',
                    maxHeight: '300px',
                    borderRadius: '8px',
                    border: '2px solid #ddd'
                  }}
                />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
            <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '5px' }}>
              Max 5MB, JPG/PNG format
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            {/* Title */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Title *
              </label>
              <input
                placeholder="Enter book title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            {/* Author */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Author *
              </label>
              <input
                placeholder="Author name"
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            {/* ISBN */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                ISBN
              </label>
              <input
                placeholder="ISBN-10 or ISBN-13"
                value={form.isbn}
                onChange={(e) => setForm({ ...form, isbn: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            {/* Publish Year */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Publish Year
              </label>
              <input
                type="number"
                placeholder="e.g., 2023"
                value={form.publishYear}
                onChange={(e) => setForm({ ...form, publishYear: e.target.value })}
                min="1000"
                max={new Date().getFullYear()}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            {/* Page Count */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Page Count
              </label>
              <input
                type="number"
                placeholder="Number of pages"
                value={form.pageCount}
                onChange={(e) => setForm({ ...form, pageCount: e.target.value })}
                min="1"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            {/* Language */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Language
              </label>
              <select
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Chinese">Chinese</option>
                <option value="Japanese">Japanese</option>
                <option value="Hindi">Hindi</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Description */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Description
              </label>
              <textarea
                placeholder="Brief description of the book..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>

          {/* Categories */}
          <div style={{ marginTop: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
              Categories (Select all that apply)
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '10px'
            }}>
              {categories.map((category) => (
                <label
                  key={category.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px',
                    border: '2px solid',
                    borderColor: selectedCategories.includes(category.id) ? '#3498db' : '#ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: selectedCategories.includes(category.id) ? '#e3f2fd' : 'white',
                    transition: 'all 0.2s'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => toggleCategory(category.id)}
                    style={{ marginRight: '8px' }}
                  />
                  <span>{category.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              marginTop: '30px',
              padding: '15px',
              background: submitting ? '#95a5a6' : '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'background 0.2s'
            }}
          >
            {submitting ? 'Adding Book...' : '📚 Add Book'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
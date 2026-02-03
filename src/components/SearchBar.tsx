// src/components/SearchBar.tsx - ENHANCED VERSION
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface SearchBarProps {
  onSearch?: (query: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (router.query.q) {
      setQuery(router.query.q as string);
    }
  }, [router.query.q]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(query);
    } else {
      router.push(`/?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <div style={{
        display: 'flex',
        gap: '12px',
        width: '100%'
      }}>
        <div style={{
          flex: 1,
          position: 'relative'
        }}>
          <input
            type="text"
            placeholder="Search by title, author, or ISBN..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={{
              width: '100%',
              padding: '14px 20px 14px 48px',
              background: isFocused
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(255, 255, 255, 0.05)',
              border: isFocused
                ? '2px solid rgba(102, 126, 234, 0.5)'
                : '2px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              fontSize: '15px',
              color: '#fff',
              outline: 'none',
              transition: 'all 0.2s ease',
              boxShadow: isFocused
                ? '0 0 0 4px rgba(102, 126, 234, 0.1)'
                : 'none'
            }}
          />
          <div style={{
            position: 'absolute',
            left: '18px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '18px',
            pointerEvents: 'none',
            opacity: isFocused ? 1 : 0.5,
            transition: 'opacity 0.2s ease'
          }}>
            🔍
          </div>
        </div>

        <button
          type="submit"
          style={{
            padding: '14px 28px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
          }}
        >
          Search
        </button>
      </div>
    </form>
  );
}
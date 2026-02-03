// src/components/BookCard.tsx - Fixed version
import Link from 'next/link';
import { Book } from '../types';

interface BookCardProps {
  book: Book;
  onBorrow?: (book: Book) => void;
  showOwner?: boolean;
}

export default function BookCard({ book, onBorrow, showOwner = false }: BookCardProps) {
  return (
    <div className="book-card">
      <Link href={`/books/${book.id}`}>
        <div className="book-cover">
          {book.coverImage ? (
            <img src={book.coverImage} alt={book.title} />
          ) : (
            <div className="book-cover-placeholder">
              <span>📚</span>
            </div>
          )}
        </div>
      </Link>

      <div className="book-info">
        <Link href={`/books/${book.id}`}>
          <h3 className="book-title">{book.title}</h3>
        </Link>
        
        <p className="book-author">by {book.author}</p>

        {book.description && (
          <p className="book-description">
            {book.description.substring(0, 100)}
            {book.description.length > 100 ? '...' : ''}
          </p>
        )}

        {showOwner && book.owner && (
          <p className="book-owner">
            <span>Owner:</span> {book.owner.name}
          </p>
        )}

        <div className="book-meta">
          {book.genre && (
            <span className="badge badge-secondary">{book.genre}</span>
          )}
          {book.condition && (
            <span className="badge badge-info">{book.condition}</span>
          )}
        </div>

        <div className="book-status">
          {book.isAvailable ? (
            <span className="badge badge-success">Available</span>
          ) : (
            <span className="badge badge-danger">Not Available</span>
          )}
        </div>

        {onBorrow && book.isAvailable && (
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => onBorrow(book)}
          >
            Borrow
          </button>
        )}
      </div>
    </div>
  );
}
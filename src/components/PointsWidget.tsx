// src/components/PointsWidget.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function PointsWidget() {
  const [points, setPoints] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || user?.role === 'DELIVERY_AGENT') {
      setLoading(false);
      return;
    }
    
    loadPoints();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadPoints, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  const loadPoints = async () => {
    try {
      const res = await api.get('/points');
      setPoints(res.data.currentPoints);
    } catch (err) {
      console.error('Error loading points:', err);
    } finally {
      setLoading(false);
    }
  };

  // Don't show for delivery agents
  if (!isAuthenticated || user?.role === 'DELIVERY_AGENT') {
    return null;
  }

  const isLowBalance = points !== null && points < 20;

  return (
    <div
      onClick={() => router.push('/points')}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.5rem 1rem',
        background: isLowBalance 
          ? 'rgba(239, 68, 68, 0.1)' 
          : 'rgba(255, 255, 255, 0.1)',
        borderRadius: 'var(--radius-lg)',
        backdropFilter: 'blur(10px)',
        cursor: 'pointer',
        transition: 'var(--transition)',
        border: isLowBalance 
          ? '1px solid rgba(239, 68, 68, 0.3)' 
          : '1px solid rgba(255, 255, 255, 0.2)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = isLowBalance 
          ? 'rgba(239, 68, 68, 0.2)' 
          : 'rgba(255, 255, 255, 0.2)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = isLowBalance 
          ? 'rgba(239, 68, 68, 0.1)' 
          : 'rgba(255, 255, 255, 0.1)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
      title={isLowBalance ? 'Low balance! Click to buy points' : 'Click to view points dashboard'}
    >
      <div style={{ 
        fontSize: '1.5rem',
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
      }}>
        ⭐
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <div style={{ 
            width: '40px',
            height: '20px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 'var(--radius)',
            animation: 'pulse 1.5s infinite'
          }}></div>
        ) : (
          <>
            <div style={{ 
              fontSize: '1.125rem',
              fontWeight: '700',
              color: 'white',
              lineHeight: 1
            }}>
              {points}
            </div>
            <div style={{ 
              fontSize: '0.625rem',
              color: 'rgba(255,255,255,0.8)',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Points
            </div>
          </>
        )}
      </div>
      {isLowBalance && (
        <div style={{
          fontSize: '1.25rem',
          animation: 'bounce 2s infinite'
        }}>
          ⚠️
        </div>
      )}
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
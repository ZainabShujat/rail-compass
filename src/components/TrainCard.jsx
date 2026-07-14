import { useNavigate } from 'react-router-dom';
import { Clock, IndianRupee, Zap, Info, Award } from 'lucide-react';
import './TrainCard.css';

export default function TrainCard({ train, rank, preferredClass }) {
  const navigate = useNavigate();

  const getScoreColorClass = (score) => {
    if (score >= 85) return 'score-excellent';
    if (score >= 65) return 'score-good';
    return 'score-average';
  };

  return (
    <div className={`train-card glass-panel animate-fade-in ${rank === 1 ? 'top-recommendation' : ''}`} onClick={() => navigate(`/train/${train._id}`)}>
      {rank === 1 && (
        <div className="top-badge">
          BEST OVERALL MATCH
        </div>
      )}
      
      <div className="train-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3>{train.trainName}</h3>
            {train.isDedicatedRoute && (
              <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'color-mix(in srgb, var(--accent-fill) 15%, transparent)', color: 'var(--accent-text)', border: '1px solid var(--border-color)', borderRadius: '12px', fontWeight: 'bold', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Direct Origin
              </span>
            )}
          </div>
          <span className="train-number mono-text">#{train.trainNumber}</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <div className={`ai-score-badge ${getScoreColorClass(train.aiScore)}`}>
            <span className="score-value mono-text">{train.aiScore}</span>
          </div>
          <span className="score-label text-muted">Match score</span>
        </div>
      </div>

      <div className="train-body">
        <div className="journey-info">
          <div className="time-station">
            <span className="time mono-text">{train.departureTime}</span>
            <span className="station">{train.departureStation}</span>
          </div>
          <div className="duration-line" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, padding: '0 1rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{train.duration}</span>
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '8px' }}>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', border: '1px solid var(--text-muted)', background: 'transparent' }}></div>
              <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, var(--text-muted) 0%, transparent 100%)', position: 'relative' }}>
                <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', fontSize: '1rem' }}>🚂</span>
              </div>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-muted)' }}></div>
            </div>
          </div>
          <div className="time-station text-right">
            <span className="time mono-text">{train.arrivalTime}</span>
            <span className="station">{train.arrivalStation}</span>
          </div>
        </div>

        <div className="class-fares">
          <div className="chips-container">
            {train.prices && Object.entries(train.prices).map(([cls, fare]) => (
              <div key={cls} className={`class-chip ${preferredClass === cls ? 'preferred' : ''}`}>
                <span className="class-name">{cls}</span>
                <span className="class-fare mono-text">₹{fare}</span>
              </div>
            ))}
          </div>
          <div className="seats mt-2 text-right">
            {train.availableSeats > 50 ? (
              <span style={{ color: 'var(--success-text)', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></div>
                Available ({train.availableSeats})
              </span>
            ) : train.availableSeats > 0 ? (
              <span style={{ color: 'var(--warning-text)', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--warning)' }}></div>
                RAC ({train.availableSeats})
              </span>
            ) : (
              <span style={{ color: 'var(--error-text)', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--error)' }}></div>
                Waitlisted (WL{Math.floor(Math.random() * 50) + 1})
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="train-footer" style={{ flexWrap: 'wrap', gap: '8px' }}>
        <div className="match-reason">
          <Zap size={16} className="text-secondary" />
          <span>{train.matchReason}</span>
        </div>
        
        {train.isUnorthodox && (
          <div className="warning-badge" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '0.75rem', background: 'rgba(239,68,68,0.1)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(239,68,68,0.2)' }}>
            <Info size={14} />
            <span>Unorthodox Arrival (No Cabs)</span>
          </div>
        )}
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="metrics-preview" style={{ display: 'flex', gap: '8px' }}>
            <div className="metric metric-reliability" title="Reliability">Rel <span>{train.metrics?.reliabilityRating}</span></div>
            <div className="metric metric-comfort" title="Comfort">Comf <span>{train.metrics?.comfortRating}</span></div>
            <div className="metric metric-food" title="Food">Food <span>{train.hasPantry === false ? 'N/A' : train.metrics?.foodRating}</span></div>
          </div>
          
          <button 
            className="irctc-book-btn"
            onClick={(e) => {
              e.stopPropagation(); // Prevents the card's overall click event
              window.open('https://www.irctc.co.in/nget/train-search', '_blank', 'noopener,noreferrer');
            }}
          >
            Book on IRCTC ↗
          </button>
        </div>
      </div>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { Clock, IndianRupee, Zap, Info, Award } from 'lucide-react';
import './TrainCard.css';

export default function TrainCard({ train, rank, preferredClass, searchOrigin, searchDestination }) {
  const navigate = useNavigate();

  const getScoreColorClass = (score) => {
    if (score >= 85) return 'score-excellent';
    if (score >= 65) return 'score-good';
    return 'score-average';
  };

  const getReasonColor = (reason) => {
    if (!reason) return 'var(--text-main)';
    const text = reason.toLowerCase();
    if (text.includes('fast') || text.includes('time') || text.includes('hour') || text.includes('duration')) return '#10b981';
    if (text.includes('budget') || text.includes('cheap') || text.includes('value') || text.includes('money')) return '#f59e0b';
    if (text.includes('comfort') || text.includes('relax') || text.includes('premium') || text.includes('recommendation')) return '#3b82f6';
    if (text.includes('night') || text.includes('daytime') || text.includes('custom')) return '#8b5cf6';
    if (text.includes('solid') || text.includes('all-around') || text.includes('all round')) return '#06b6d4'; // Cyan
    return 'var(--text-main)';
  };

  const reasonColor = getReasonColor(train.matchReason);

  return (
    <div className={`train-card glass-panel animate-fade-in ${rank === 1 ? 'top-recommendation' : ''}`}>
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

        </div>
      </div>

      <div className="train-footer" style={{ flexWrap: 'wrap', gap: '8px' }}>
        <div className="match-reason" style={{ color: reasonColor }}>
          <Zap size={16} style={{ color: reasonColor }} />
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
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="irctc-book-btn"
              style={{ borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/train/${train._id}`, { state: { searchData: { ...train, searchOrigin, searchDestination } } });
              }}
            >
              View Details
            </button>
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
    </div>
  );
}

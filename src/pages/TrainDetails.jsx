import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapPin, Clock, Activity, Zap, RefreshCw, ChevronDown, ChevronUp, ArrowLeft, ArrowRight, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './StandardPage.css';

const ZONE_MAP = {
  'WR': 'Western Railway', 'NR': 'Northern Railway', 'CR': 'Central Railway',
  'SR': 'Southern Railway', 'ER': 'Eastern Railway', 'SER': 'South Eastern Railway',
  'ECR': 'East Central Railway', 'SECR': 'South East Central Railway', 'NWR': 'North Western Railway',
  'SWR': 'South Western Railway', 'WCR': 'West Central Railway', 'NCR': 'North Central Railway',
  'NER': 'North Eastern Railway', 'NFR': 'Northeast Frontier Railway', 'ECoR': 'East Coast Railway',
  'KR': 'Konkan Railway'
};

const TRAIN_TYPE_MAP = {
  'Raj': 'Rajdhani Express',
  'Sht': 'Shatabdi Express',
  'Drnt': 'Duronto Express',
  'Sup': 'Superfast Express',
  'Exp': 'Express',
  'Pass': 'Passenger',
  'Vb': 'Vande Bharat',
  'GR': 'Garib Rath',
  'JSht': 'Jan Shatabdi'
};

const getClassStyle = (c) => {
  switch (c) {
    case '1A': 
      return { background: 'color-mix(in srgb, #D4AF37 10%, transparent)', color: '#D4AF37', border: '1px solid color-mix(in srgb, #D4AF37 30%, transparent)', fontWeight: '600' };
    case '2A': 
      return { background: 'color-mix(in srgb, #94A3B8 10%, transparent)', color: '#94A3B8', border: '1px solid color-mix(in srgb, #94A3B8 30%, transparent)', fontWeight: '600' };
    case '3A': 
      return { background: 'color-mix(in srgb, #CD7F32 10%, transparent)', color: '#CD7F32', border: '1px solid color-mix(in srgb, #CD7F32 30%, transparent)', fontWeight: '600' };
    case 'CC': 
    case 'EC':
      return { background: 'color-mix(in srgb, #8B5CF6 10%, transparent)', color: '#8B5CF6', border: '1px solid color-mix(in srgb, #8B5CF6 30%, transparent)', fontWeight: '600' };
    case 'SL': 
      return { background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontWeight: '500' };
    default: 
      return { background: 'var(--bg-input)', border: '1px dashed var(--border-color)', color: 'var(--text-secondary)' };
  }
};

const getDiffMins = (arr, dep) => {
  if (!arr || !dep || arr === 'None' || dep === 'None') return 0;
  const [ah, am] = arr.split(':').map(Number);
  const [dh, dm] = dep.split(':').map(Number);
  let diff = (dh * 60 + dm) - (ah * 60 + am);
  if (diff < 0) diff += 24 * 60; // crossed midnight
  return diff;
};

export default function TrainDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [train, setTrain] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [returnTrainDetails, setReturnTrainDetails] = useState(null);
  const [loadingReturn, setLoadingReturn] = useState(false);
  const [expandedSegments, setExpandedSegments] = useState({});

  const searchData = location.state?.searchData || null;
  const historyStack = location.state?.historyStack || [];

  useEffect(() => {
    const fetchTrainDetails = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`http://localhost:5000/api/trains/${id}`);
        setTrain(res.data);
      } catch (err) {
        console.error("Error fetching train details:", err);
        setError("Could not load train details. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchTrainDetails();
  }, [id]);

  useEffect(() => {
    // If the train has a return train and we have a search context, fetch the return train's match score!
    const fetchReturnScore = async () => {
      if (!train || !train.return_train || !searchData || !searchData.arrivalStation || !searchData.departureStation) return;
      try {
        setLoadingReturn(true);
        // Reverse origin and destination
        const preferredClass = user?.preferences?.preferredClass || 'All';
        const res = await axios.get(`http://localhost:5000/api/trains`, {
          params: {
            origin: searchData.searchDestination || searchData.arrivalStation,
            destination: searchData.searchOrigin || searchData.departureStation,
            date: new Date().toISOString(),
            preferredClass
          }
        });
        
        // Find the return train in the results to grab its AI score and match reason
        const returnT = res.data.find(t => t.trainNumber === train.return_train);
        if (returnT) {
          setReturnTrainDetails({
            ...returnT,
            searchOrigin: searchData.searchDestination,
            searchDestination: searchData.searchOrigin
          });
        }
      } catch (err) {
        console.error("Error fetching return train score:", err);
      } finally {
        setLoadingReturn(false);
      }
    };
    fetchReturnScore();
  }, [train, searchData, user]);

  useEffect(() => {
    // If schedule is loaded, auto scroll to boarding station
    if (train?.schedule && train.schedule.length > 0) {
      setTimeout(() => {
        const el = document.getElementById('boarding-station');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500); // small delay to ensure rendering
    }
  }, [train]);

  if (loading) return <div className="page-container" style={{ textAlign: 'center', paddingTop: '100px' }}>Loading Train Details...</div>;
  if (error) return <div className="page-container" style={{ textAlign: 'center', paddingTop: '100px', color: '#ef4444' }}>{error}</div>;
  if (!train) return <div className="page-container" style={{ textAlign: 'center', paddingTop: '100px' }}>Train not found.</div>;

  const classes = [];
  if (Number(train.first_ac) > 0) classes.push('1A');
  if (Number(train.second_ac) > 0) classes.push('2A');
  if (Number(train.third_ac) > 0) classes.push('3A');
  if (Number(train.chair_car) > 0) classes.push('CC');
  if (Number(train.first_class) > 0) classes.push('FC');
  if (Number(train.sleeper) > 0) classes.push('SL');

  const getReasonColor = (reason) => {
    if (!reason) return 'var(--text-main)';
    const text = reason.toLowerCase();
    if (text.includes('fast') || text.includes('time') || text.includes('hour') || text.includes('duration')) return '#10b981';
    if (text.includes('budget') || text.includes('cheap') || text.includes('value') || text.includes('money')) return '#f59e0b';
    if (text.includes('comfort') || text.includes('relax') || text.includes('premium') || text.includes('recommendation')) return '#3b82f6';
    if (text.includes('night') || text.includes('daytime') || text.includes('custom')) return '#8b5cf6';
    if (text.includes('solid') || text.includes('all-around') || text.includes('all round')) return '#06b6d4';
    return 'var(--primary-color)';
  };

  const reasonColor = searchData ? getReasonColor(searchData.matchReason) : 'var(--primary-color)';

  const handleReturnNavigation = () => {
    if (train.return_train) {
      // Add current train to history stack so we can go back
      const newStack = [...historyStack, { id: train.number, searchData }];
      // When navigating to return train, reverse the searchData so the return train's page works properly
      const reversedSearchData = returnTrainDetails || null;
      navigate(`/train/${train.return_train}`, { state: { searchData: reversedSearchData, historyStack: newStack } });
    }
  };

  const handleBackToOriginal = () => {
    navigate(-1);
  };

  const toggleSegment = (idx) => {
    setExpandedSegments(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Build Timeline Segments
  const timelineSegments = [];
  if (train.schedule && train.schedule.length > 0) {
    let currentHidden = [];
    
    const boardingCode = searchData?.departureStation;
    const destinationCode = searchData?.arrivalStation;
    
    const boardingIdx = train.schedule.findIndex(s => s.station_code === boardingCode);
    const destinationIdx = train.schedule.findIndex(s => s.station_code === destinationCode);

    train.schedule.forEach((stop, idx) => {
      const isTrainFirst = idx === 0;
      const isTrainLast = idx === train.schedule.length - 1;
      const isUserBoarding = idx === boardingIdx;
      const isUserDestination = idx === destinationIdx;
      const diff = getDiffMins(stop.arrival, stop.departure);
      
      const isMajorHalt = isTrainFirst || isTrainLast || isUserBoarding || isUserDestination || diff >= 1;

      if (isMajorHalt) {
        if (currentHidden.length > 0) {
          timelineSegments.push({ type: 'hidden', stations: currentHidden });
          currentHidden = [];
        }
        timelineSegments.push({ type: 'halt', stop, haltDuration: diff, isTrainFirst, isTrainLast, isUserBoarding, isUserDestination, globalIdx: idx, boardingIdx, destinationIdx });
      } else {
        currentHidden.push(stop);
      }
    });
  }

  // Ring color based on score
  const score = searchData?.aiScore || 0;
  let ringColor = '#ef4444';
  if (score >= 85) ringColor = '#10b981';
  else if (score >= 65) ringColor = '#f59e0b';
  else if (score >= 40) ringColor = '#3b82f6';

  let currentDay = 0;

  return (
    <div className="page-container animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Back Navigation */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {historyStack.length > 0 ? (
          <button onClick={handleBackToOriginal} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.95rem', padding: '0', transition: 'color 0.2s ease' }} onMouseOver={(e) => e.target.style.color = 'var(--text-main)'} onMouseOut={(e) => e.target.style.color = 'var(--text-muted)'}>
            <ArrowLeft size={16} /> Back to original train
          </button>
        ) : (
          <button onClick={() => navigate(-1)} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.95rem', padding: '0', transition: 'color 0.2s ease' }} onMouseOver={(e) => e.target.style.color = 'var(--text-main)'} onMouseOut={(e) => e.target.style.color = 'var(--text-muted)'}>
            <ArrowLeft size={16} /> Back to Results
          </button>
        )}
      </div>

      {/* MATCH SCORE HERO */}
      {searchData && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '40px 20px', background: 'var(--bg-secondary)', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, transparent, ${ringColor}, transparent)` }}></div>
          
          {(searchData.searchOrigin || searchData.departureStation) && (searchData.searchDestination || searchData.arrivalStation) && (
            <div style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)', fontSize: '1.1rem', fontWeight: '600', letterSpacing: '0.5px' }}>
              <span>{searchData.searchOrigin || searchData.departureStation}</span>
              <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
              <span>{searchData.searchDestination || searchData.arrivalStation}</span>
            </div>
          )}

          <div style={{ position: 'relative', width: '120px', height: '120px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', background: `color-mix(in srgb, ${ringColor} 10%, transparent)`, border: `2px solid ${ringColor}`, boxShadow: `0 0 30px color-mix(in srgb, ${ringColor} 40%, transparent)` }} className="score-ring-pulse">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span className="mono-text" style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)', lineHeight: '1' }}>{score}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>Match</span>
            </div>
          </div>

          <h2 style={{ fontSize: '1.4rem', margin: '0 0 10px 0', color: 'var(--text-main)' }}>The perfect match for your DNA</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', maxWidth: '600px', lineHeight: '1.6', fontSize: '1rem' }}>
            <span style={{ color: reasonColor, fontWeight: '600' }}>{searchData.matchReason}</span>
          </p>
        </div>
      )}

      {/* CORE INFO CARD */}
      <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '24px', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-color)', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.2)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '1.6rem', color: 'var(--text-main)', fontWeight: '700' }}>{train.name}</h1>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <span className="info-badge hover-lift" title={`Train Type: ${TRAIN_TYPE_MAP[train.type] || train.type}`} style={{ padding: '4px 12px', background: 'color-mix(in srgb, #f59e0b 10%, transparent)', border: '1px solid #f59e0b', color: 'var(--text-main)', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'default' }}>
                  <Star size={14} style={{ color: '#f59e0b', fill: '#f59e0b' }} /> {TRAIN_TYPE_MAP[train.type] || train.type}
                </span>
                <span className="info-badge hover-lift" title={ZONE_MAP[train.zone] || `${train.zone} Zone`} style={{ padding: '4px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600', cursor: 'default' }}>
                  {ZONE_MAP[train.zone] || train.zone}
                </span>
              </div>
            </div>
            <p className="mono-text" style={{ margin: 0, fontSize: '1.1rem', color: 'var(--accent-text)' }}>#{train.number}</p>
          </div>
          
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={24} style={{ color: 'var(--text-muted)' }} />
              {train.duration_h}h {train.duration_m}m
            </div>
            <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1.1rem' }}>
              <Activity size={18} /> {train.distance} km total
            </div>
          </div>
        </div>

        {/* Classes Available and Book Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
          {classes.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: '500' }}>Available Classes</span>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {classes.map(c => (
                  <span key={c} className="hover-lift" style={{ ...getClassStyle(c), padding: '6px 18px', borderRadius: '8px', fontSize: '0.95rem', transition: 'all 0.2s ease', cursor: 'default' }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
          ) : <div />}
          
          <a href="https://www.irctc.co.in/nget/" target="_blank" rel="noopener noreferrer" className="btn-primary hover-lift" style={{ textDecoration: 'none', padding: '10px 24px', display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '8px', fontWeight: '600' }}>
            Book on IRCTC <ArrowRight size={18} />
          </a>
        </div>
      </div>

      {/* RETURN TRAIN SECTION */}
      {train.return_train && (
        <div className="glass-panel hover-lift" style={{ padding: '24px', background: 'linear-gradient(135deg, var(--bg-secondary) 0%, rgba(59, 130, 246, 0.08) 100%)', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.3rem', color: 'var(--text-main)' }}>
              <RefreshCw size={20} style={{ color: 'var(--primary-color)' }} /> Planning a Round Trip?
            </h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.5' }}>
              View the reverse journey on Train #{train.return_train}.
              {loadingReturn && <span style={{ marginLeft: '8px', fontStyle: 'italic', color: 'var(--text-secondary)' }}>Calculating Match Score...</span>}
              {!loadingReturn && returnTrainDetails && (
                <span style={{ marginLeft: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'color-mix(in srgb, var(--primary-color) 15%, transparent)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: '600' }}>
                  <Zap size={12} /> DNA Match: {returnTrainDetails.aiScore}/100
                </span>
              )}
            </p>
          </div>
          <button onClick={handleReturnNavigation} className="btn-primary" style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', whiteSpace: 'nowrap' }}>
            View Return Train <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* SMART ROUTE TIMELINE - MAPPISH DESIGN */}
      <div>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)' }}>
          <MapPin size={22} style={{ color: 'var(--accent-text)' }} /> Journey Map
        </h2>
        
        <div className="glass-panel" style={{ padding: '30px 20px', borderRadius: '16px' }}>
          <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontSize: '1.2rem' }}>
            <MapPin size={20} className="text-muted" /> Route Timeline
          </h3>
        
          <div style={{ maxHeight: '450px', overflowY: 'auto', paddingRight: '16px', margin: '0 -8px', paddingLeft: '8px' }} className="route-scroll-container custom-scrollbar">
            <div className="journey-path" style={{ position: 'relative' }}>
              {/* Dashed background track */}
              <div style={{ position: 'absolute', left: '120px', top: '20px', bottom: '20px', width: '4px', background: 'repeating-linear-gradient(to bottom, var(--text-muted) 0, var(--text-muted) 10px, transparent 10px, transparent 20px)', opacity: 0.4, zIndex: 0 }}></div>
              
              {timelineSegments.length > 0 ? (
                timelineSegments.map((segment, idx) => {
                  if (segment.type === 'hidden') {
                    const isExpanded = expandedSegments[idx];
                    return (
                      <div key={idx} style={{ padding: '20px 0 20px 145px', position: 'relative', zIndex: 1 }}>
                        <button 
                          onClick={() => toggleSegment(idx)}
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '6px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s ease' }}
                          onMouseOver={e => { e.currentTarget.style.color = 'var(--text-main)'; e.currentTarget.style.borderColor = 'var(--text-muted)'; }}
                          onMouseOut={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          {isExpanded ? 'Hide' : 'Show'} {segment.stations.length} non-stopping stations
                        </button>
                        
                        {isExpanded && (
                          <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '12px', animation: 'fadeIn 0.3s ease' }}>
                            {segment.stations.map((s, sIdx) => (
                              <div key={sIdx} style={{ display: 'flex', gap: '15px', alignItems: 'center', opacity: 0.5 }}>
                                <span className="mono-text" style={{ fontSize: '0.85rem' }}>{s.arrival.substring(0, 5)}</span>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)' }}></div>
                                <span style={{ fontSize: '0.95rem' }}>{s.station_name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Halt Segment
                  const { stop, haltDuration, isTrainFirst, isTrainLast, isUserBoarding, isUserDestination, globalIdx, boardingIdx, destinationIdx } = segment;
                  const dayChanged = currentDay !== stop.day;
                  if (dayChanged) currentDay = stop.day;
                  
                  // Determine if the user is on the train at this station
                  let isUserOnboard = true;
                  if (boardingIdx !== -1 && destinationIdx !== -1) {
                    isUserOnboard = globalIdx >= boardingIdx && globalIdx <= destinationIdx;
                  }
                  
                  // Mute the nodes where user is not on board
                  const opacity = isUserOnboard ? 1 : 0.35;
                  
                  // Is this the first/last node in the user's specific journey?
                  const isNodeFirst = isUserBoarding || (boardingIdx === -1 && isTrainFirst);
                  const isNodeLast = isUserDestination || (destinationIdx === -1 && isTrainLast);

                  return (
                    <div key={idx} style={{ position: 'relative', zIndex: 1, padding: '25px 0' }} className="timeline-node">
                      
                      {/* Day Divider */}
                      {dayChanged && !isTrainFirst && (
                        <div style={{ position: 'absolute', top: '-15px', left: '0', right: 0, display: 'flex', alignItems: 'center', zIndex: 2 }}>
                          <div style={{ flex: 1, height: '1px', borderTop: '2px dashed var(--border-color)', opacity: 0.6 }}></div>
                          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '6px 20px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                            Start of Day {stop.day}
                          </div>
                          <div style={{ flex: 1, height: '1px', borderTop: '2px dashed var(--border-color)', opacity: 0.6 }}></div>
                        </div>
                      )}

                      <div id={isUserBoarding ? 'boarding-station' : ''} style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', transition: 'transform 0.2s ease', opacity }} onMouseOver={e => e.currentTarget.style.transform = 'translateX(5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateX(0)'}>
                        
                        {/* Time Column */}
                        <div style={{ width: '90px', textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '2px' }}>
                          {!isTrainFirst && stop.arrival !== 'None' && (
                            <span className="mono-text" style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                              Arr: {stop.arrival.substring(0, 5)}
                            </span>
                          )}
                          {!isTrainLast && stop.departure !== 'None' && (
                            <span className="mono-text" style={{ color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: '700' }}>
                              Dep: {stop.departure.substring(0, 5)}
                            </span>
                          )}
                        </div>
                        
                        {/* Node Icon - Map style */}
                        <div style={{ width: '24px', height: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2, background: 'var(--bg-secondary)', marginTop: '2px' }}>
                          {isNodeFirst ? (
                            <MapPin size={24} style={{ color: '#ef4444', fill: 'rgba(239, 68, 68, 0.2)' }} />
                          ) : isNodeLast ? (
                            <MapPin size={24} style={{ color: '#10b981', fill: 'rgba(16, 185, 129, 0.2)' }} />
                          ) : (
                            <div style={{ width: '12px', height: '12px', background: 'var(--primary-color)', transform: 'rotate(45deg)', border: '2px solid var(--bg-color)', boxShadow: '0 0 0 2px var(--primary-color)' }}></div>
                          )}
                        </div>
                        
                        {/* Station Info */}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '1.1rem', fontWeight: isNodeFirst || isNodeLast ? '700' : '600', color: 'var(--text-main)', marginBottom: '6px', letterSpacing: '0.3px' }}>
                            {stop.station_name}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <span className="mono-text" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '2px 8px', background: 'var(--bg-input)', borderRadius: '6px' }}>
                              {stop.station_code}
                            </span>
                            {!isTrainFirst && !isTrainLast && haltDuration > 0 && (
                              <span style={{ color: 'var(--accent-text)', fontSize: '0.85rem', fontWeight: '600', padding: '2px 10px', background: 'color-mix(in srgb, var(--accent-fill) 10%, transparent)', borderRadius: '12px' }}>
                                Halt: {haltDuration} min{haltDuration > 1 ? 's' : ''}
                              </span>
                            )}
                            {isTrainFirst && !isUserBoarding && (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '500', padding: '2px 10px', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                                Train Origin
                              </span>
                            )}
                            {isTrainLast && !isUserDestination && (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '500', padding: '2px 10px', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                                Train Destination
                              </span>
                            )}
                            {isUserBoarding && (
                              <span style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: '600', padding: '2px 10px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px' }}>
                                Your Boarding
                              </span>
                            )}
                            {isUserDestination && (
                              <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: '600', padding: '2px 10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px' }}>
                                Your Destination
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>
                  No detailed schedule available for this train.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to Top */}
      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
          className="btn-secondary hover-lift" 
          style={{ padding: '10px 24px', borderRadius: '30px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <ChevronUp size={18} /> Back to Top
        </button>
      </div>

    </div>
  );
}

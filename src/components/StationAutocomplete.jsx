import { useState, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import './SearchWidget.css'; // Reusing for autocomplete styles

export default function StationAutocomplete({ value, onChange, placeholder, iconColor = "var(--text-secondary)", label, widgetMode = false }) {
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef(null);

  const API_URL = import.meta.env.PROD ? '' : 'http://localhost:5000';

  // Handle clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced Search
  useEffect(() => {
    if (value.length < 1) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/api/stations/search?q=${value}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error("Failed to fetch stations");
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [value, API_URL]);

  return (
    <div className={widgetMode ? "input-group" : ""} ref={containerRef} style={{ position: 'relative', width: '100%', marginBottom: 0 }}>
      {widgetMode ? (
        <>
          <MapPin className="input-icon" size={20} color={iconColor} />
          <div className="input-field" style={{ width: '100%' }}>
            <label>{label}</label>
            <input 
              type="text" 
              value={value} 
              onChange={(e) => { 
                onChange(e.target.value); 
                setShowDropdown(true);
              }} 
              onFocus={() => {
                if (value.length > 0) setShowDropdown(true);
              }}
              placeholder={placeholder}
              required
              autoComplete="off"
            />
          </div>
        </>
      ) : (
        <>
          {label && <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>{label}</label>}
          <div className="input-field" style={{ width: '100%', flexDirection: 'row', alignItems: 'center', background: 'var(--bg-input)', padding: '0', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <MapPin className="input-icon" size={20} color={iconColor} style={{ marginLeft: '12px' }} />
            <input 
              type="text" 
              value={value} 
              onChange={(e) => { 
                onChange(e.target.value); 
                setShowDropdown(true);
              }} 
              onFocus={() => {
                if (value.length > 0) setShowDropdown(true);
              }}
              placeholder={placeholder}
              autoComplete="off"
              style={{ width: '100%', padding: '12px', background: 'transparent', border: 'none', color: 'white', outline: 'none' }}
            />
          </div>
        </>
      )}
      
      {showDropdown && results.length > 0 && (
        <div className="autocomplete-dropdown" style={{ top: '100%', marginTop: '5px' }}>
          {results.map((station, idx) => (
            <div 
              key={idx} 
              className="autocomplete-item"
              onMouseDown={(e) => {
                e.preventDefault(); 
                onChange(station.stationName);
                setShowDropdown(false);
              }}
            >
              <span className="station-name">{station.stationName} ({station.stationCode})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

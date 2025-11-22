import { useState, useEffect } from 'react';
import api from '../../lib/api/client';
import { CreateIcon, LoadingIcon, EditIcon, DeleteIcon, SearchIcon, FilterIcon } from './HoloIcons';
import EventForm from './forms/EventForm';
import '../../styles/AdminGlass.css';

export default function EventEditor() {
  const [events, setEvents] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    loadEvents();
    loadConfig();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await api.events.getAll();
      setEvents(response.events || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const loadConfig = async () => {
    try {
      const response = await api.config.get();
      setConfig(response.config || response);
    } catch (err) {
      console.error('Failed to load config:', err);
    }
  };

  const handleCreate = () => {
    setEditingEvent(null);
    setShowForm(true);
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleDelete = async (eventId) => {
    try {
      await api.events.delete(eventId);
      await loadEvents();
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.message || 'Failed to delete event');
    }
  };

  const handleToggleEnabled = async (event) => {
    try {
      const updated = { ...event, metadata: { ...event.metadata, enabled: !event.metadata?.enabled } };
      await api.events.update(event.id, updated);
      await loadEvents();
    } catch (err) {
      setError(err.message || 'Failed to update event');
    }
  };

  const handleSave = async () => {
    await loadEvents();
    setShowForm(false);
    setEditingEvent(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingEvent(null);
  };

  // Filter events
  const filteredEvents = events.filter(event => {
    const matchesSearch = !searchTerm || 
      event.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.scenario?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
      event.trigger?.type === filterType ||
      event.metadata?.tags?.includes(filterType);
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <LoadingIcon size={60} />
        <div className="loading-text" style={{ marginTop: '1.5rem' }}>Loading events...</div>
      </div>
    );
  }

  if (showForm) {
    return (
      <EventForm 
        event={editingEvent}
        config={config}
        onSave={handleSave} 
        onCancel={handleCancel} 
      />
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--neon-cyan)', margin: 0, fontSize: '1.8rem', textShadow: 'var(--glow-cyan)' }}>
          Event Editor
        </h2>
        <button 
          className="btn-neon btn-neon-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          onClick={handleCreate}
        >
          <CreateIcon size={20} />
          CREATE NEW EVENT
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="glass-card" style={{
          padding: '1rem',
          marginBottom: '1.5rem',
          borderColor: 'rgba(255, 107, 107, 0.5)',
          background: 'rgba(255, 0, 0, 0.1)'
        }}>
          <span style={{ color: '#ff6b6b', fontSize: '0.9rem' }}>{error}</span>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <SearchIcon size={20} />
            <input
              type="text"
              placeholder="Search events by ID or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-neon"
              style={{ paddingLeft: '2.5rem' }}
            />
            <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <SearchIcon size={18} />
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FilterIcon size={20} />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input-neon"
              style={{ width: '200px' }}
            >
              <option value="all">All Types</option>
              <option value="poi_action">POI Action</option>
              <option value="dynamic">Dynamic</option>
              <option value="mission">Mission</option>
              <option value="mining">Mining</option>
              <option value="hazard">Hazard</option>
              <option value="combat">Combat</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {filteredEvents.map(event => (
          <div key={event.id} className="glass-card" style={{ padding: '1.5rem', position: 'relative' }}>
            {/* Enabled Status Indicator */}
            <div style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: event.metadata?.enabled === false ? '#ff6b6b' : '#00ff88',
              boxShadow: `0 0 10px ${event.metadata?.enabled === false ? '#ff6b6b' : '#00ff88'}`
            }} />

            {/* Event Header */}
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ 
                color: 'var(--neon-cyan)', 
                fontSize: '1.1rem', 
                margin: '0 0 0.5rem 0',
                fontFamily: 'monospace'
              }}>
                {event.id}
              </h3>
              <p style={{ color: '#fff', fontSize: '0.95rem', margin: '0 0 0.75rem 0' }}>
                {event.scenario?.title || 'Untitled Event'}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {event.metadata?.tags?.map(tag => (
                  <span key={tag} className="status-badge status-info" style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem' }}>
                    {tag}
                  </span>
                ))}
                <span className="status-badge" style={{ 
                  fontSize: '0.7rem', 
                  padding: '0.2rem 0.6rem',
                  background: 'rgba(0, 204, 255, 0.1)',
                  borderColor: 'rgba(0, 204, 255, 0.3)',
                  color: '#00ccff'
                }}>
                  {event.trigger?.type || 'unknown'}
                </span>
              </div>
            </div>

            {/* Event Description */}
            <p style={{ 
              color: '#888', 
              fontSize: '0.85rem', 
              margin: '0 0 1rem 0',
              lineHeight: '1.5',
              minHeight: '3rem'
            }}>
              {event.scenario?.description || 'No description available.'}
            </p>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button
                className="btn-neon"
                style={{ 
                  flex: 1, 
                  padding: '0.6rem', 
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
                onClick={() => handleEdit(event)}
              >
                <EditIcon size={16} />
                EDIT
              </button>
              
              <button
                className={event.metadata?.enabled === false ? 'btn-neon' : 'btn-neon'}
                style={{ 
                  flex: 1, 
                  padding: '0.6rem', 
                  fontSize: '0.75rem',
                  borderColor: event.metadata?.enabled === false ? '#00ff88' : '#ffaa00',
                  color: event.metadata?.enabled === false ? '#00ff88' : '#ffaa00'
                }}
                onClick={() => handleToggleEnabled(event)}
              >
                {event.metadata?.enabled === false ? 'ENABLE' : 'DISABLE'}
              </button>
              
              <button
                className="btn-neon btn-neon-danger"
                style={{ 
                  padding: '0.6rem 0.8rem', 
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
                onClick={() => setDeleteConfirm(event.id)}
              >
                <DeleteIcon size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredEvents.length === 0 && (
        <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
          <p style={{ color: '#888', fontSize: '1.1rem' }}>
            {searchTerm || filterType !== 'all' 
              ? 'No events match your search criteria.' 
              : 'No events found. Create your first event!'}
          </p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: 'var(--neon-cyan)', marginBottom: '1rem' }}>Confirm Deletion</h3>
            <p style={{ color: '#888', marginBottom: '2rem' }}>
              Are you sure you want to delete event <strong style={{ color: '#fff' }}>{deleteConfirm}</strong>? 
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn-neon" onClick={() => setDeleteConfirm(null)}>
                CANCEL
              </button>
              <button 
                className="btn-neon btn-neon-danger" 
                onClick={() => handleDelete(deleteConfirm)}
              >
                DELETE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

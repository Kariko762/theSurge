import { useState, useEffect } from 'react';
import api from '../../lib/api/client';
import { CreateIcon, LoadingIcon, EditIcon, DeleteIcon, SearchIcon, FilterIcon } from './HoloIcons';
import EventForm from './forms/EventForm';
import '../../styles/AdminGlass.css';
import '../../styles/AdminCompact.css';

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h2 style={{ color: 'var(--terminal-cyan)', margin: 0, fontSize: 'var(--compact-h2)', textShadow: '0 0 8px var(--terminal-cyan)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
          Event Editor
        </h2>
        <button 
          className="btn-compact primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          onClick={handleCreate}
        >
          <CreateIcon size={14} />
          CREATE NEW
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="glass-card-compact" style={{
          marginBottom: '0.75rem',
          borderColor: 'var(--terminal-red)',
          background: 'rgba(255, 107, 107, 0.1)'
        }}>
          <span style={{ color: 'var(--terminal-red)', fontSize: 'var(--compact-small)' }}>{error}</span>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="glass-card-compact" style={{ marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              placeholder="Search events by ID or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-compact"
              style={{ width: '100%', paddingLeft: '2rem' }}
            />
            <div style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--terminal-cyan)' }}>
              <SearchIcon size={14} />
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FilterIcon size={14} />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="select-compact"
              style={{ width: '150px' }}
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

      {/* Events Table - Compact View */}
      {filteredEvents.length > 0 ? (
        <table className="data-table-compact">
          <thead>
            <tr>
              <th style={{ width: '30px' }}>●</th>
              <th style={{ width: '180px' }}>EVENT ID</th>
              <th>TITLE</th>
              <th style={{ width: '200px' }}>TAGS</th>
              <th style={{ width: '100px' }}>TRIGGER</th>
              <th style={{ width: '120px' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.map(event => (
              <tr key={event.id} onClick={() => handleEdit(event)}>
                <td style={{ textAlign: 'center' }}>
                  <span 
                    className={`status-dot ${event.metadata?.enabled === false ? 'disabled' : 'enabled'}`}
                    title={event.metadata?.enabled === false ? 'Disabled' : 'Enabled'}
                  />
                </td>
                <td className="mono-id">{event.id}</td>
                <td style={{ fontWeight: '500', color: '#fff' }}>
                  {event.scenario?.title || 'Untitled Event'}
                </td>
                <td>
                  <div className="tag-list">
                    {event.metadata?.tags?.slice(0, 3).map(tag => (
                      <span key={tag} className="tag-chip">
                        {tag}
                      </span>
                    ))}
                    {event.metadata?.tags?.length > 3 && (
                      <span className="tag-chip" style={{ opacity: 0.6 }}>
                        +{event.metadata.tags.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <span className="badge-compact primary">
                    {event.trigger?.type || 'unknown'}
                  </span>
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    <button
                      className="btn-icon"
                      onClick={(e) => { e.stopPropagation(); handleEdit(event); }}
                      title="Edit Event"
                    >
                      <EditIcon size={12} />
                    </button>
                    <button
                      className="btn-icon"
                      onClick={(e) => { e.stopPropagation(); handleToggleEnabled(event); }}
                      title={event.metadata?.enabled === false ? 'Enable' : 'Disable'}
                      style={{
                        color: event.metadata?.enabled === false ? 'var(--terminal-green)' : 'var(--terminal-amber)',
                        borderColor: event.metadata?.enabled === false ? 'var(--terminal-green)' : 'var(--terminal-amber)'
                      }}
                    >
                      {event.metadata?.enabled === false ? '✓' : '○'}
                    </button>
                    <button
                      className="btn-icon"
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm(event.id); }}
                      title="Delete Event"
                      style={{ color: 'var(--terminal-red)', borderColor: 'var(--terminal-red)' }}
                    >
                      <DeleteIcon size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="glass-card-compact" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: '#888', fontSize: '0.9rem' }}>
            {searchTerm || filterType !== 'all' 
              ? 'No events match your search criteria.' 
              : 'No events found. Create your first event!'}
          </p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-compact" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Deletion</h3>
              <button className="btn-icon" onClick={() => setDeleteConfirm(null)} title="Close">
                ×
              </button>
            </div>
            <p style={{ color: '#888', marginBottom: '0.75rem', fontSize: 'var(--compact-body)' }}>
              Are you sure you want to delete event <strong style={{ color: 'var(--terminal-cyan)' }}>{deleteConfirm}</strong>? 
              This action cannot be undone.
            </p>
            <div className="modal-footer">
              <button className="btn-compact" onClick={() => setDeleteConfirm(null)}>
                CANCEL
              </button>
              <button 
                className="btn-compact danger" 
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

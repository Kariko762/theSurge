import { useState, useEffect } from 'react';
import { LoadingIcon, WarningIcon, SuccessIcon, InfoIcon } from './HoloIcons';
import '../../styles/AdminGlass.css';

export default function TelemetryDashboard() {
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');

  useEffect(() => {
    loadTelemetry();
  }, [timeRange]);

  const loadTelemetry = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/telemetry?timeRange=${timeRange}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch telemetry data');
      }
      
      const data = await response.json();
      
      // Transform backend data to match UI expectations
      const transformedData = {
        overview: {
          totalEvents: data.overview.totalEvents,
          uniqueScenarios: data.overview.uniqueScenarios,
          avgEventsPerHour: data.overview.avgEventsPerHour,
          playerSuccessRate: data.overview.playerSuccessRate / 100
        },
        eventFrequency: data.eventFrequency.map(ef => ({
          id: ef.eventId,
          triggers: ef.triggers,
          lastTriggered: formatTimeAgo(ef.lastTriggered),
          avgDuration: formatDuration(ef.avgDuration)
        })),
        playerChoices: data.playerChoices.flatMap(pc => 
          pc.choices.map(c => ({
            scenario: pc.scenarioId,
            choice: c.choice,
            count: c.count,
            percentage: Math.round(c.percentage)
          }))
        ),
        deadScenarios: data.deadScenarios.map(ds => ({
          id: ds.scenarioId,
          lastTriggered: ds.lastSeen ? formatTimeAgo(ds.lastSeen) : 'Never',
          weight: 0.05, // TODO: Get from event data
          tags: [] // TODO: Get from event data
        })),
        outcomeDistribution: data.outcomeDistribution,
        rewardStats: {
          avgCreditsPerEvent: data.rewardStats.avgCredits,
          avgItemsPerEvent: data.rewardStats.avgItems,
          avgXPPerEvent: data.rewardStats.avgXP,
          topRewards: data.rewardStats.topRewards.map(r => ({ name: r.item, count: r.count }))
        }
      };
      
      setTelemetry(transformedData);
    } catch (error) {
      console.error('Error fetching telemetry:', error);
      // Keep existing data or show empty state
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Never';
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <LoadingIcon size={60} />
        <div className="loading-text" style={{ marginTop: '1.5rem' }}>Loading telemetry data...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--neon-cyan)', margin: 0, fontSize: '1.8rem', textShadow: 'var(--glow-cyan)' }}>
          Event Telemetry Dashboard
        </h2>
        <select
          className="input-neon"
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          style={{ width: '200px' }}
        >
          <option value="1h">Last Hour</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Overview Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ color: '#888', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Total Events
          </div>
          <div style={{ color: 'var(--neon-cyan)', fontSize: '2.5rem', fontWeight: 'bold', textShadow: 'var(--glow-cyan)' }}>
            {telemetry.overview.totalEvents}
          </div>
          <div style={{ color: '#666', fontSize: '0.8rem', marginTop: '0.5rem' }}>
            {telemetry.overview.avgEventsPerHour.toFixed(1)} per hour
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ color: '#888', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Unique Scenarios
          </div>
          <div style={{ color: '#ffaa00', fontSize: '2.5rem', fontWeight: 'bold', textShadow: '0 0 20px rgba(255, 170, 0, 0.5)' }}>
            {telemetry.overview.uniqueScenarios}
          </div>
          <div style={{ color: '#666', fontSize: '0.8rem', marginTop: '0.5rem' }}>
            {telemetry.deadScenarios.length} never triggered
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ color: '#888', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Success Rate
          </div>
          <div style={{ color: '#00ff88', fontSize: '2.5rem', fontWeight: 'bold', textShadow: '0 0 20px rgba(0, 255, 136, 0.5)' }}>
            {(telemetry.overview.playerSuccessRate * 100).toFixed(0)}%
          </div>
          <div style={{ color: '#666', fontSize: '0.8rem', marginTop: '0.5rem' }}>
            Player win rate
          </div>
        </div>
      </div>

      {/* Event Frequency Table */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h3 style={{ color: 'var(--neon-cyan)', marginBottom: '1.5rem', fontSize: '1.2rem' }}>
          Event Trigger Frequency
        </h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>EVENT ID</th>
              <th>TRIGGERS</th>
              <th>LAST SEEN</th>
              <th>AVG DURATION</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {telemetry.eventFrequency.map(event => (
              <tr key={event.id}>
                <td style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{event.id}</td>
                <td>
                  <span className="status-badge status-info">
                    {event.triggers}x
                  </span>
                </td>
                <td style={{ color: '#888', fontSize: '0.85rem' }}>{event.lastTriggered}</td>
                <td style={{ color: '#aaa', fontSize: '0.85rem' }}>{event.avgDuration}</td>
                <td>
                  <span className="status-badge status-success">
                    ACTIVE
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Player Choices & Dead Scenarios */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        {/* Player Choice Distribution */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ color: 'var(--neon-cyan)', marginBottom: '1.5rem', fontSize: '1.2rem' }}>
            Player Choice Distribution
          </h3>
          {telemetry.playerChoices.map((choice, idx) => (
            <div key={idx} style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#aaa', fontSize: '0.9rem' }}>
                  {choice.scenario} - <strong style={{ color: '#fff' }}>{choice.choice}</strong>
                </span>
                <span style={{ color: 'var(--neon-cyan)', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  {choice.percentage}%
                </span>
              </div>
              <div style={{ 
                background: 'rgba(0, 20, 40, 0.5)', 
                height: '8px', 
                borderRadius: '4px',
                overflow: 'hidden',
                border: '1px solid rgba(0, 255, 255, 0.2)'
              }}>
                <div style={{ 
                  background: 'linear-gradient(90deg, var(--neon-cyan), #00ccff)',
                  height: '100%',
                  width: `${choice.percentage}%`,
                  boxShadow: '0 0 10px rgba(0, 255, 255, 0.5)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {choice.count} players
              </div>
            </div>
          ))}
        </div>

        {/* Dead/Rare Scenarios */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <WarningIcon size={24} />
            <h3 style={{ color: '#ffaa00', margin: 0, fontSize: '1.2rem' }}>
              Dead Scenarios
            </h3>
          </div>
          {telemetry.deadScenarios.map(scenario => (
            <div 
              key={scenario.id} 
              className="glass-card" 
              style={{ 
                padding: '1rem', 
                marginBottom: '1rem',
                background: 'rgba(255, 170, 0, 0.05)',
                borderColor: 'rgba(255, 170, 0, 0.3)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ color: '#fff', fontSize: '0.9rem', fontFamily: 'monospace' }}>
                  {scenario.id}
                </span>
                <span className="status-badge status-danger">
                  {scenario.lastTriggered}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                {scenario.tags.map(tag => (
                  <span key={tag} className="status-badge" style={{ 
                    fontSize: '0.7rem',
                    background: 'rgba(255, 170, 0, 0.1)',
                    borderColor: 'rgba(255, 170, 0, 0.3)',
                    color: '#ffaa00'
                  }}>
                    {tag}
                  </span>
                ))}
                <span style={{ color: '#666', fontSize: '0.7rem', marginLeft: 'auto' }}>
                  Weight: {scenario.weight}
                </span>
              </div>
            </div>
          ))}
          <div style={{ 
            marginTop: '1rem', 
            padding: '0.75rem', 
            background: 'rgba(255, 170, 0, 0.05)', 
            borderRadius: '8px',
            border: '1px solid rgba(255, 170, 0, 0.2)'
          }}>
            <InfoIcon size={16} />
            <span style={{ color: '#888', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
              Consider increasing weights or reviewing trigger conditions
            </span>
          </div>
        </div>
      </div>

      {/* Outcome Distribution & Rewards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Outcome Distribution */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ color: 'var(--neon-cyan)', marginBottom: '1.5rem', fontSize: '1.2rem' }}>
            Outcome Distribution
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ color: '#00ff88', fontSize: '2rem', fontWeight: 'bold' }}>
                {telemetry.outcomeDistribution.success}
              </div>
              <div style={{ color: '#888', fontSize: '0.8rem', marginTop: '0.5rem' }}>SUCCESS</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ color: '#ff6b6b', fontSize: '2rem', fontWeight: 'bold' }}>
                {telemetry.outcomeDistribution.failure}
              </div>
              <div style={{ color: '#888', fontSize: '0.8rem', marginTop: '0.5rem' }}>FAILURE</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ color: 'var(--neon-cyan)', fontSize: '2rem', fontWeight: 'bold' }}>
                {telemetry.outcomeDistribution.critical_success}
              </div>
              <div style={{ color: '#888', fontSize: '0.8rem', marginTop: '0.5rem' }}>CRITICAL SUCCESS</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ color: '#ff00ff', fontSize: '2rem', fontWeight: 'bold' }}>
                {telemetry.outcomeDistribution.critical_failure}
              </div>
              <div style={{ color: '#888', fontSize: '0.8rem', marginTop: '0.5rem' }}>CRITICAL FAILURE</div>
            </div>
          </div>
        </div>

        {/* Reward Stats */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ color: 'var(--neon-cyan)', marginBottom: '1.5rem', fontSize: '1.2rem' }}>
            Reward Statistics
          </h3>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              Avg Credits: <strong style={{ color: '#00ff88' }}>{telemetry.rewardStats.avgCreditsPerEvent}</strong>
            </div>
            <div style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              Avg Items: <strong style={{ color: '#ffaa00' }}>{telemetry.rewardStats.avgItemsPerEvent}</strong>
            </div>
            <div style={{ color: '#aaa', fontSize: '0.85rem' }}>
              Avg XP: <strong style={{ color: 'var(--neon-cyan)' }}>{telemetry.rewardStats.avgXPPerEvent}</strong>
            </div>
          </div>
          <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '1rem', marginTop: '1.5rem' }}>
            Top Rewards
          </h4>
          {telemetry.rewardStats.topRewards.map((reward, idx) => (
            <div key={idx} style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              padding: '0.75rem',
              marginBottom: '0.5rem',
              background: 'rgba(0, 20, 40, 0.3)',
              borderRadius: '6px',
              border: '1px solid rgba(0, 255, 255, 0.1)'
            }}>
              <span style={{ color: '#aaa' }}>{reward.name}</span>
              <span className="status-badge status-info">{reward.count}x</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

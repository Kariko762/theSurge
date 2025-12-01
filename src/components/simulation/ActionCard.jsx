import React from 'react';

const ActionCard = ({ card, selected, disabled, onClick }) => {
  const getCardTypeColor = () => {
    switch (card.type) {
      case 'Movement':
        return '#3498db';
      case 'Action':
        return '#e74c3c';
      case 'Instant':
        return '#f39c12';
      case 'Repair':
        return '#2ecc71';
      case 'Special':
        return '#9b59b6';
      default:
        return '#34e0ff';
    }
  };

  return (
    <div
      className={`action-card ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={disabled ? null : onClick}
      style={{
        borderColor: selected ? getCardTypeColor() : 'rgba(52, 224, 255, 0.3)',
        boxShadow: selected ? `0 0 20px ${getCardTypeColor()}` : 'none'
      }}
    >
      <div className="card-header">
        <span className="card-name">{card.name}</span>
        <span 
          className="card-type"
          style={{ 
            background: `${getCardTypeColor()}20`,
            color: getCardTypeColor(),
            border: `1px solid ${getCardTypeColor()}`
          }}
        >
          {card.type}
        </span>
      </div>

      <div className="card-icon">
        {card.icon}
      </div>

      <div className="card-description">
        {card.description}
      </div>

      {card.damage && (
        <div className="card-stat">
          <span className="stat-label">Damage:</span>
          <span className="stat-value">{card.damage}</span>
        </div>
      )}

      {card.range && (
        <div className="card-stat">
          <span className="stat-label">Range:</span>
          <span className="stat-value">{card.range} hexes</span>
        </div>
      )}

      <div className="card-footer">
        <span className="card-ap-cost">
          AP: <strong>{card.apCost}</strong>
        </span>
        {card.cooldown && (
          <span className="card-cooldown">
            CD: {card.cooldown}
          </span>
        )}
      </div>
    </div>
  );
};

export default ActionCard;

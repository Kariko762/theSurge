import React from 'react';

// Neon holographic star rating (1-5)
// tier: 0-4 maps to 1-5 stars
// Uses consistent cyan palette with intensity variation

const BASE_COLOR = '#00ffff';

function starColor(index, total) {
  // Later stars slightly dimmer for subtle depth
  const intensity = 1 - (index / (total * 1.8));
  const channel = Math.floor(255 * intensity);
  // Return rgba string for glow layering
  return `rgba(0, ${channel}, ${255}, 1)`;
}

export default function HoloStars({ tier = 0, size = 10, gap = 3 }) {
  const count = Math.min(5, (tier || 0) + 1);
  return (
    <div
      className="holo-stars"
      aria-label={`${count} star quality`}
      style={{ display: 'flex', alignItems: 'center', gap: `${gap}px` }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          style={{
            filter: `drop-shadow(0 0 4px ${BASE_COLOR}) drop-shadow(0 0 2px ${starColor(i, count)})`
          }}
        >
          <path
            d="M12 3.5L14.9 9.1L21 10.05L16.5 14.4L17.6 20.5L12 17.6L6.4 20.5L7.5 14.4L3 10.05L9.1 9.1L12 3.5Z"
            stroke={starColor(i, count)}
            strokeWidth="1.4"
            fill="rgba(0,255,255,0.08)"
          />
        </svg>
      ))}
    </div>
  );
}

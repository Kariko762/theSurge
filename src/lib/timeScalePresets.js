// Time Scale Presets
// Defines standard time progression rates for gameplay

export const TIME_SCALES = {
  PAUSED: 0,
  SLOW: 0.5,
  NORMAL: 1,
  FAST: 5,
  VERY_FAST: 10,
  ULTRA_FAST: 50,
  LUDICROUS: 100
};

export const TIME_SCALE_OPTIONS = [
  { value: TIME_SCALES.SLOW, label: '0.5x', emoji: '🐌' },
  { value: TIME_SCALES.NORMAL, label: '1x', emoji: '▶' },
  { value: TIME_SCALES.FAST, label: '5x', emoji: '⏩' },
  { value: TIME_SCALES.VERY_FAST, label: '10x', emoji: '⏭' },
  { value: TIME_SCALES.ULTRA_FAST, label: '50x', emoji: '⚡' },
  { value: TIME_SCALES.LUDICROUS, label: '100x', emoji: '🚀' }
];

export const DEFAULT_TIME_SCALE = TIME_SCALES.FAST; // 5x recommended for gameplay

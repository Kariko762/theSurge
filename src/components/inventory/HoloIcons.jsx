import React from 'react';

// Base holographic glow color
const GLOW = '#00ffff';

// Icon mapping by item type/category
export const ICON_MAP = {
  // Raw materials
  iron: 'IronOre',
  steel: 'SteelIngot',
  titanium: 'TitaniumOre',
  silicon: 'Silicon',
  copper: 'Copper',
  scrapMetal: 'ScrapMetal',
  
  // Electronics
  circuit: 'Circuit',
  microchip: 'Microchip',
  processor: 'Processor',
  electronicBoard: 'ElectronicBoard',
  
  // Weapons
  weapon: 'Weapon',
  railgun: 'Railgun',
  laser: 'Laser',
  missile: 'Missile',
  
  // Components
  engine: 'Engine',
  reactor: 'Reactor',
  shield: 'Shield',
  sensor: 'Sensor',
  thruster: 'Thruster',
  
  // Tools & Misc
  tool: 'Tool',
  battery: 'Battery',
  fuel: 'Fuel',
  consumable: 'Consumable',
  aiCore: 'AICore',
  
  // Default
  default: 'GenericBox'
};

// SVG Icons - all using holographic wireframe style
export const IronOre = ({ size = 32, color = GLOW }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 4L28 10V22L16 28L4 22V10L16 4Z" stroke={color} strokeWidth="1.5" opacity="0.9"/>
    <path d="M16 4V16M16 16L4 10M16 16L28 10M16 16V28M16 16L4 22M16 16L28 22" stroke={color} strokeWidth="1" opacity="0.5"/>
    <circle cx="16" cy="16" r="3" stroke={color} strokeWidth="1" opacity="0.7"/>
  </svg>
);

export const SteelIngot = ({ size = 32, color = GLOW }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="12" width="20" height="8" stroke={color} strokeWidth="1.5" opacity="0.9"/>
    <path d="M6 12L8 8H24L26 12M6 20L8 24H24L26 20" stroke={color} strokeWidth="1.5" opacity="0.9"/>
    <line x1="12" y1="14" x2="12" y2="18" stroke={color} strokeWidth="1" opacity="0.5"/>
    <line x1="16" y1="14" x2="16" y2="18" stroke={color} strokeWidth="1" opacity="0.5"/>
    <line x1="20" y1="14" x2="20" y2="18" stroke={color} strokeWidth="1" opacity="0.5"/>
  </svg>
);

export const TitaniumOre = ({ size = 32, color = GLOW }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 3L26 9L26 23L16 29L6 23L6 9L16 3Z" stroke={color} strokeWidth="1.5" opacity="0.9"/>
    <path d="M11 11L16 8L21 11L21 21L16 24L11 21L11 11Z" stroke={color} strokeWidth="1.5" opacity="0.7"/>
    <circle cx="16" cy="16" r="2" stroke={color} strokeWidth="1" opacity="0.6"/>
    <path d="M16 3L16 8M16 24L16 29M6 9L11 11M26 9L21 11M6 23L11 21M26 23L21 21" stroke={color} strokeWidth="1" opacity="0.4"/>
  </svg>
);

export const ScrapMetal = ({ size = 32, color = GLOW }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 6L12 4L18 8L24 6L28 10L26 16L28 22L24 26L18 24L12 28L6 24L4 18L8 12L4 8L8 6Z" stroke={color} strokeWidth="1.5" opacity="0.8"/>
    <line x1="12" y1="8" x2="20" y2="24" stroke={color} strokeWidth="1" opacity="0.4"/>
    <line x1="8" y1="16" x2="24" y2="16" stroke={color} strokeWidth="1" opacity="0.4"/>
    <circle cx="16" cy="16" r="3" stroke={color} strokeWidth="1" opacity="0.5"/>
  </svg>
);

export const Circuit = ({ size = 32, color = GLOW }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="24" height="24" stroke={color} strokeWidth="1.5" opacity="0.9"/>
    <circle cx="10" cy="10" r="2" stroke={color} strokeWidth="1.5" fill={color} opacity="0.3"/>
    <circle cx="22" cy="10" r="2" stroke={color} strokeWidth="1.5" fill={color} opacity="0.3"/>
    <circle cx="10" cy="22" r="2" stroke={color} strokeWidth="1.5" fill={color} opacity="0.3"/>
    <circle cx="22" cy="22" r="2" stroke={color} strokeWidth="1.5" fill={color} opacity="0.3"/>
    <path d="M10 10H16M16 10V22M16 22H22M16 10H22M10 22H16" stroke={color} strokeWidth="1" opacity="0.6"/>
  </svg>
);

export const ElectronicBoard = ({ size = 32, color = GLOW }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="6" width="26" height="20" stroke={color} strokeWidth="1.5" opacity="0.9"/>
    <rect x="6" y="10" width="4" height="4" stroke={color} strokeWidth="1" fill={color} opacity="0.2"/>
    <rect x="14" y="10" width="4" height="4" stroke={color} strokeWidth="1" fill={color} opacity="0.2"/>
    <rect x="22" y="10" width="4" height="4" stroke={color} strokeWidth="1" fill={color} opacity="0.2"/>
    <rect x="6" y="18" width="4" height="4" stroke={color} strokeWidth="1" fill={color} opacity="0.2"/>
    <rect x="14" y="18" width="4" height="4" stroke={color} strokeWidth="1" fill={color} opacity="0.2"/>
    <rect x="22" y="18" width="4" height="4" stroke={color} strokeWidth="1" fill={color} opacity="0.2"/>
    <path d="M8 14V18M16 14V18M24 14V18" stroke={color} strokeWidth="0.8" opacity="0.5"/>
  </svg>
);

export const Weapon = ({ size = 32, color = GLOW }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 16H12L14 12L18 16L22 12L24 16H28" stroke={color} strokeWidth="1.5" opacity="0.9"/>
    <circle cx="16" cy="16" r="4" stroke={color} strokeWidth="1.5" opacity="0.7"/>
    <line x1="16" y1="4" x2="16" y2="28" stroke={color} strokeWidth="1" opacity="0.5"/>
    <line x1="4" y1="16" x2="28" y2="16" stroke={color} strokeWidth="1" opacity="0.5"/>
  </svg>
);

export const Railgun = ({ size = 32, color = GLOW }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 14H28M4 18H28" stroke={color} strokeWidth="1.5" opacity="0.9"/>
    <rect x="6" y="12" width="4" height="8" stroke={color} strokeWidth="1" opacity="0.7"/>
    <path d="M26 10L30 16L26 22" stroke={color} strokeWidth="1.5" opacity="0.9"/>
    <line x1="14" y1="14" x2="14" y2="18" stroke={color} strokeWidth="1" opacity="0.5"/>
    <line x1="18" y1="14" x2="18" y2="18" stroke={color} strokeWidth="1" opacity="0.5"/>
    <line x1="22" y1="14" x2="22" y2="18" stroke={color} strokeWidth="1" opacity="0.5"/>
  </svg>
);

export const Engine = ({ size = 32, color = GLOW }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="6" width="16" height="20" stroke={color} strokeWidth="1.5" opacity="0.9"/>
    <path d="M12 26L10 30M20 26L22 30M16 26L16 30" stroke={color} strokeWidth="1.5" opacity="0.9"/>
    <circle cx="16" cy="14" r="4" stroke={color} strokeWidth="1.5" opacity="0.7"/>
    <line x1="12" y1="6" x2="12" y2="2" stroke={color} strokeWidth="1" opacity="0.6"/>
    <line x1="20" y1="6" x2="20" y2="2" stroke={color} strokeWidth="1" opacity="0.6"/>
  </svg>
);

export const Reactor = ({ size = 32, color = GLOW }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="10" stroke={color} strokeWidth="1.5" opacity="0.9"/>
    <circle cx="16" cy="16" r="6" stroke={color} strokeWidth="1.5" opacity="0.7"/>
    <circle cx="16" cy="16" r="2" stroke={color} strokeWidth="1.5" fill={color} opacity="0.3"/>
    <line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="1.5" opacity="0.9"/>
    <line x1="16" y1="26" x2="16" y2="30" stroke={color} strokeWidth="1.5" opacity="0.9"/>
    <line x1="2" y1="16" x2="6" y2="16" stroke={color} strokeWidth="1.5" opacity="0.9"/>
    <line x1="26" y1="16" x2="30" y2="16" stroke={color} strokeWidth="1.5" opacity="0.9"/>
  </svg>
);

export const Shield = ({ size = 32, color = GLOW }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 4L26 8V14C26 20 22 26 16 28C10 26 6 20 6 14V8L16 4Z" stroke={color} strokeWidth="1.5" opacity="0.9"/>
    <path d="M16 10L21 12V16C21 19 19 22 16 24C13 22 11 19 11 16V12L16 10Z" stroke={color} strokeWidth="1.5" opacity="0.6"/>
    <line x1="16" y1="4" x2="16" y2="28" stroke={color} strokeWidth="1" opacity="0.4"/>
  </svg>
);

export const Sensor = ({ size = 32, color = GLOW }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="12" stroke={color} strokeWidth="1.5" opacity="0.9"/>
    <circle cx="16" cy="16" r="8" stroke={color} strokeWidth="1" opacity="0.6"/>
    <circle cx="16" cy="16" r="4" stroke={color} strokeWidth="1" opacity="0.6"/>
    <circle cx="16" cy="16" r="1.5" stroke={color} strokeWidth="1" fill={color} opacity="0.9"/>
    <line x1="16" y1="4" x2="16" y2="8" stroke={color} strokeWidth="1" opacity="0.5"/>
    <line x1="16" y1="24" x2="16" y2="28" stroke={color} strokeWidth="1" opacity="0.5"/>
    <line x1="4" y1="16" x2="8" y2="16" stroke={color} strokeWidth="1" opacity="0.5"/>
    <line x1="24" y1="16" x2="28" y2="16" stroke={color} strokeWidth="1" opacity="0.5"/>
  </svg>
);

export const AICore = ({ size = 32, color = GLOW }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="24" height="24" stroke={color} strokeWidth="1.5" opacity="0.9"/>
    <circle cx="12" cy="12" r="2" stroke={color} strokeWidth="1" fill={color} opacity="0.5"/>
    <circle cx="20" cy="12" r="2" stroke={color} strokeWidth="1" fill={color} opacity="0.5"/>
    <path d="M10 22Q16 20 22 22" stroke={color} strokeWidth="1.5" opacity="0.7"/>
    <path d="M8 16H24" stroke={color} strokeWidth="1" opacity="0.5"/>
  </svg>
);

export const Battery = ({ size = 32, color = GLOW }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="10" width="20" height="14" stroke={color} strokeWidth="1.5" opacity="0.9"/>
    <rect x="26" y="14" width="2" height="6" stroke={color} strokeWidth="1" fill={color} opacity="0.5"/>
    <line x1="10" y1="14" x2="10" y2="20" stroke={color} strokeWidth="2" opacity="0.7"/>
    <line x1="14" y1="14" x2="14" y2="20" stroke={color} strokeWidth="2" opacity="0.7"/>
    <line x1="18" y1="14" x2="18" y2="20" stroke={color} strokeWidth="2" opacity="0.7"/>
    <line x1="22" y1="14" x2="22" y2="20" stroke={color} strokeWidth="2" opacity="0.7"/>
  </svg>
);

export const Fuel = ({ size = 32, color = GLOW }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="6" width="12" height="20" stroke={color} strokeWidth="1.5" opacity="0.9"/>
    <path d="M20 12H24L26 16V22H20" stroke={color} strokeWidth="1.5" opacity="0.9"/>
    <rect x="10" y="16" width="8" height="8" stroke={color} strokeWidth="1" fill={color} opacity="0.2"/>
    <circle cx="23" cy="18" r="1" stroke={color} strokeWidth="1" fill={color} opacity="0.7"/>
  </svg>
);

export const Tool = ({ size = 32, color = GLOW }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 4L12 2L20 10L18 12L10 4Z" stroke={color} strokeWidth="1.5" opacity="0.9"/>
    <path d="M18 12L28 22L26 24L20 30L18 28L14 24L18 12Z" stroke={color} strokeWidth="1.5" opacity="0.9"/>
    <circle cx="22" cy="26" r="2" stroke={color} strokeWidth="1" opacity="0.6"/>
    <line x1="4" y1="10" x2="10" y2="4" stroke={color} strokeWidth="1" opacity="0.5"/>
  </svg>
);

export const Consumable = ({ size = 32, color = GLOW }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="8" width="12" height="18" rx="2" stroke={color} strokeWidth="1.5" opacity="0.9"/>
    <rect x="12" y="4" width="8" height="4" stroke={color} strokeWidth="1" opacity="0.7"/>
    <line x1="14" y1="12" x2="18" y2="12" stroke={color} strokeWidth="1.5" opacity="0.6"/>
    <line x1="14" y1="16" x2="18" y2="16" stroke={color} strokeWidth="1.5" opacity="0.6"/>
    <line x1="14" y1="20" x2="18" y2="20" stroke={color} strokeWidth="1.5" opacity="0.6"/>
  </svg>
);

export const GenericBox = ({ size = 32, color = GLOW }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="6" width="20" height="20" stroke={color} strokeWidth="1.5" opacity="0.9"/>
    <line x1="6" y1="6" x2="26" y2="26" stroke={color} strokeWidth="1" opacity="0.4"/>
    <line x1="26" y1="6" x2="6" y2="26" stroke={color} strokeWidth="1" opacity="0.4"/>
    <circle cx="16" cy="16" r="3" stroke={color} strokeWidth="1" opacity="0.6"/>
  </svg>
);

// Icon component that selects the right icon based on item
export default function HoloIcon({ item, size = 32 }) {
  const iconName = item.id || item.category || 'default';
  const IconComponent = {
    IronOre, SteelIngot, TitaniumOre, ScrapMetal,
    Circuit, ElectronicBoard,
    Weapon, Railgun,
    Engine, Reactor, Shield, Sensor,
    AICore, Battery, Fuel, Tool, Consumable,
    GenericBox
  }[ICON_MAP[iconName] || 'GenericBox'];

  // Color based on tier
  const tierColors = {
    0: '#888888',
    1: '#00ff00',
    2: '#0099ff',
    3: '#cc00ff',
    4: '#ffaa00'
  };
  const color = tierColors[item.tier] || GLOW;

  return <IconComponent size={size} color={color} />;
}

/**
 * Holographic Neon Icons for The Surge Admin Panel
 * SVG-based icons with cyan glow effects
 */

export const HoloIcon = ({ children, size = 24, glow = true }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{
      filter: glow ? 'drop-shadow(0 0 4px rgba(0, 255, 255, 0.6))' : 'none',
      transition: 'all 0.3s ease'
    }}
  >
    {children}
  </svg>
);

// Events Icon - Lightning Bolt with Hexagon
export const EventsIcon = ({ size = 24 }) => (
  <HoloIcon size={size}>
    <path
      d="M12 2L2 12h8l-2 10 10-10h-8l2-10z"
      stroke="#00ffff"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 2L16 6M12 22L8 18M2 12L6 8M22 12L18 16"
      stroke="#00ffff"
      strokeWidth="0.8"
      opacity="0.5"
    />
  </HoloIcon>
);

// Missions Icon - Target Crosshair
export const MissionsIcon = ({ size = 24 }) => (
  <HoloIcon size={size}>
    <circle cx="12" cy="12" r="9" stroke="#00ffff" strokeWidth="1.5" fill="none" />
    <circle cx="12" cy="12" r="6" stroke="#00ffff" strokeWidth="1.2" fill="none" opacity="0.7" />
    <circle cx="12" cy="12" r="3" stroke="#00ffff" strokeWidth="1.5" fill="none" />
    <line x1="12" y1="1" x2="12" y2="5" stroke="#00ffff" strokeWidth="1.5" />
    <line x1="12" y1="19" x2="12" y2="23" stroke="#00ffff" strokeWidth="1.5" />
    <line x1="1" y1="12" x2="5" y2="12" stroke="#00ffff" strokeWidth="1.5" />
    <line x1="19" y1="12" x2="23" y2="12" stroke="#00ffff" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="1" fill="#00ffff" />
  </HoloIcon>
);

// Config Icon - Hexagonal Gear
export const ConfigIcon = ({ size = 24 }) => (
  <HoloIcon size={size}>
    <path
      d="M12 3L14.5 5.5L17.5 5L19 7.5L21.5 9L21 12L21.5 15L19 16.5L17.5 19L14.5 18.5L12 21L9.5 18.5L6.5 19L5 16.5L2.5 15L3 12L2.5 9L5 7.5L6.5 5L9.5 5.5L12 3Z"
      stroke="#00ffff"
      strokeWidth="1.5"
      fill="none"
    />
    <circle cx="12" cy="12" r="4" stroke="#00ffff" strokeWidth="1.5" fill="none" />
    <path
      d="M12 8V10M12 14V16M8 12H10M14 12H16"
      stroke="#00ffff"
      strokeWidth="1.2"
      opacity="0.7"
    />
  </HoloIcon>
);

// Users Icon - Hexagonal User Profile
export const UsersIcon = ({ size = 24 }) => (
  <HoloIcon size={size}>
    <path
      d="M12 2L18 6V12L12 16L6 12V6L12 2Z"
      stroke="#00ffff"
      strokeWidth="1.5"
      fill="none"
    />
    <circle cx="12" cy="10" r="3" stroke="#00ffff" strokeWidth="1.5" fill="none" />
    <path
      d="M8 18C8 16 9.5 15 12 15C14.5 15 16 16 16 18"
      stroke="#00ffff"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <line x1="12" y1="2" x2="12" y2="4" stroke="#00ffff" strokeWidth="0.8" opacity="0.5" />
    <line x1="18" y1="6" x2="17" y2="7" stroke="#00ffff" strokeWidth="0.8" opacity="0.5" />
  </HoloIcon>
);

// API Docs Icon - Data Stream
export const APIIcon = ({ size = 24 }) => (
  <HoloIcon size={size}>
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="#00ffff" strokeWidth="1.5" fill="none" />
    <path
      d="M3 8H21M3 13H21M3 18H21"
      stroke="#00ffff"
      strokeWidth="0.8"
      opacity="0.4"
    />
    <circle cx="7" cy="8" r="1" fill="#00ffff" />
    <circle cx="10" cy="8" r="1" fill="#00ffff" opacity="0.6" />
    <circle cx="7" cy="13" r="1" fill="#00ffff" opacity="0.8" />
    <circle cx="13" cy="13" r="1" fill="#00ffff" opacity="0.4" />
    <circle cx="17" cy="8" r="1" fill="#00ffff" opacity="0.5" />
    <circle cx="15" cy="18" r="1" fill="#00ffff" opacity="0.7" />
  </HoloIcon>
);

// Create Button Icon - Plus with Corners
export const CreateIcon = ({ size = 20 }) => (
  <HoloIcon size={size} glow={false}>
    <path d="M2 2V6M2 2H6M18 2H22M22 2V6M2 18V22M2 22H6M22 18V22M22 22H18" stroke="#00ffff" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="12" y1="7" x2="12" y2="17" stroke="#00ffff" strokeWidth="2" strokeLinecap="round" />
    <line x1="7" y1="12" x2="17" y2="12" stroke="#00ffff" strokeWidth="2" strokeLinecap="round" />
  </HoloIcon>
);

// Edit Icon - Pen with Scan Lines
export const EditIcon = ({ size = 18 }) => (
  <HoloIcon size={size} glow={false}>
    <path d="M14 4L18 8L8 18H4V14L14 4Z" stroke="#00ffff" strokeWidth="1.5" fill="none" />
    <line x1="13" y1="5" x2="17" y2="9" stroke="#00ffff" strokeWidth="1" opacity="0.5" />
  </HoloIcon>
);

// Delete Icon - Hexagonal X
export const DeleteIcon = ({ size = 18 }) => (
  <HoloIcon size={size} glow={false}>
    <path d="M12 2L18 6V14L12 18L6 14V6L12 2Z" stroke="#ff6b6b" strokeWidth="1.5" fill="none" />
    <line x1="9" y1="9" x2="15" y2="15" stroke="#ff6b6b" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="15" y1="9" x2="9" y2="15" stroke="#ff6b6b" strokeWidth="1.5" strokeLinecap="round" />
  </HoloIcon>
);

// Save Icon - Disk with Corners
export const SaveIcon = ({ size = 20 }) => (
  <HoloIcon size={size} glow={false}>
    <path d="M4 4H16L20 8V20H4V4Z" stroke="#00ffff" strokeWidth="1.5" fill="none" />
    <rect x="8" y="2" width="8" height="6" stroke="#00ffff" strokeWidth="1.5" fill="none" />
    <rect x="6" y="13" width="12" height="7" stroke="#00ffff" strokeWidth="1" opacity="0.6" fill="none" />
    <line x1="2" y1="2" x2="2" y2="6" stroke="#00ffff" strokeWidth="1" opacity="0.4" />
    <line x1="2" y1="2" x2="6" y2="2" stroke="#00ffff" strokeWidth="1" opacity="0.4" />
  </HoloIcon>
);

// Search Icon - Magnifying Glass with Grid
export const SearchIcon = ({ size = 20 }) => (
  <HoloIcon size={size} glow={false}>
    <circle cx="10" cy="10" r="7" stroke="#00ffff" strokeWidth="1.5" fill="none" />
    <line x1="15" y1="15" x2="20" y2="20" stroke="#00ffff" strokeWidth="2" strokeLinecap="round" />
    <path d="M7 10H13M10 7V13" stroke="#00ffff" strokeWidth="1" opacity="0.5" />
  </HoloIcon>
);

// Filter Icon - Funnel with Data Points
export const FilterIcon = ({ size = 20 }) => (
  <HoloIcon size={size} glow={false}>
    <path d="M4 4L10 12V20L14 22V12L20 4H4Z" stroke="#00ffff" strokeWidth="1.5" fill="none" />
    <circle cx="7" cy="6" r="1" fill="#00ffff" opacity="0.6" />
    <circle cx="12" cy="6" r="1" fill="#00ffff" opacity="0.8" />
    <circle cx="17" cy="6" r="1" fill="#00ffff" opacity="0.6" />
  </HoloIcon>
);

// Upload Icon - Arrow with Brackets
export const UploadIcon = ({ size = 20 }) => (
  <HoloIcon size={size} glow={false}>
    <path d="M12 2V14M12 2L8 6M12 2L16 6" stroke="#00ffff" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M4 16V20H20V16" stroke="#00ffff" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M2 14H6M18 14H22" stroke="#00ffff" strokeWidth="1" opacity="0.5" />
  </HoloIcon>
);

// Download Icon - Arrow with Brackets
export const DownloadIcon = ({ size = 20 }) => (
  <HoloIcon size={size} glow={false}>
    <path d="M12 2V14M12 14L8 10M12 14L16 10" stroke="#00ffff" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M4 16V20H20V16" stroke="#00ffff" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M2 18H6M18 18H22" stroke="#00ffff" strokeWidth="1" opacity="0.5" />
  </HoloIcon>
);

// Warning Icon - Triangle with Exclamation
export const WarningIcon = ({ size = 20 }) => (
  <HoloIcon size={size}>
    <path d="M12 2L22 20H2L12 2Z" stroke="#ffaa00" strokeWidth="1.5" fill="none" />
    <line x1="12" y1="9" x2="12" y2="14" stroke="#ffaa00" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="17" r="1" fill="#ffaa00" />
  </HoloIcon>
);

// Success Icon - Checkmark in Hexagon
export const SuccessIcon = ({ size = 20 }) => (
  <HoloIcon size={size}>
    <path d="M12 2L18 6V14L12 18L6 14V6L12 2Z" stroke="#00ff88" strokeWidth="1.5" fill="none" />
    <path d="M8 12L11 15L16 9" stroke="#00ff88" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </HoloIcon>
);

// Error Icon - X in Circle
export const ErrorIcon = ({ size = 20 }) => (
  <HoloIcon size={size}>
    <circle cx="12" cy="12" r="9" stroke="#ff6b6b" strokeWidth="1.5" fill="none" />
    <line x1="8" y1="8" x2="16" y2="16" stroke="#ff6b6b" strokeWidth="2" strokeLinecap="round" />
    <line x1="16" y1="8" x2="8" y2="16" stroke="#ff6b6b" strokeWidth="2" strokeLinecap="round" />
  </HoloIcon>
);

// Info Icon - i in Hexagon
export const InfoIcon = ({ size = 20 }) => (
  <HoloIcon size={size}>
    <path d="M12 2L18 6V14L12 18L6 14V6L12 2Z" stroke="#00ccff" strokeWidth="1.5" fill="none" />
    <circle cx="12" cy="8" r="1" fill="#00ccff" />
    <line x1="12" y1="11" x2="12" y2="16" stroke="#00ccff" strokeWidth="2" strokeLinecap="round" />
  </HoloIcon>
);

// Test Icon - Beaker with Stars
export const TestIcon = ({ size = 20 }) => (
  <HoloIcon size={size}>
    <path d="M8 2H16M10 2V8L6 18C6 19 6.5 20 8 20H16C17.5 20 18 19 18 18L14 8V2" stroke="#ff00ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <circle cx="10" cy="14" r="0.5" fill="#ff00ff" />
    <circle cx="14" cy="16" r="0.5" fill="#ff00ff" />
    <circle cx="12" cy="12" r="0.5" fill="#ff00ff" />
    <path d="M4 4L6 6M18 4L20 6M4 8L6 10" stroke="#ff00ff" strokeWidth="0.8" opacity="0.6" />
  </HoloIcon>
);

// Logout Icon - Door with Arrow
export const LogoutIcon = ({ size = 20 }) => (
  <HoloIcon size={size} glow={false}>
    <path d="M14 4H20V20H14" stroke="#ff6b6b" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M10 12H18M18 12L15 9M18 12L15 15" stroke="#ff6b6b" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="4" y1="4" x2="4" y2="20" stroke="#ff6b6b" strokeWidth="1.5" strokeLinecap="round" />
  </HoloIcon>
);

// Loading Spinner - Hexagonal with Rotation
export const LoadingIcon = ({ size = 40 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    style={{
      animation: 'spin 1s linear infinite',
      filter: 'drop-shadow(0 0 6px rgba(0, 255, 255, 0.8))'
    }}
  >
    <path
      d="M12 2L18 6V14L12 18L6 14V6L12 2Z"
      stroke="#00ffff"
      strokeWidth="2"
      fill="none"
      strokeDasharray="40"
      strokeDashoffset="10"
    />
    <circle cx="12" cy="12" r="4" stroke="#00ffff" strokeWidth="1.5" fill="none" opacity="0.5" />
  </svg>
);

// Close/Cancel Icon - X Mark
export const CloseIcon = ({ size = 20 }) => (
  <HoloIcon size={size}>
    <line x1="6" y1="6" x2="18" y2="18" stroke="#00ffff" strokeWidth="2" strokeLinecap="round" />
    <line x1="18" y1="6" x2="6" y2="18" stroke="#00ffff" strokeWidth="2" strokeLinecap="round" />
  </HoloIcon>
);

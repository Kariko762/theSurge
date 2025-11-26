# Admin Portal Design Guide
## POI Library - Complete Design System

This guide extracts the visual design, spacing, typography, and interaction patterns from the POI Library component to ensure consistency across the entire Admin Portal.

---

## 🎨 **COLOR PALETTE**

### Primary Colors
```css
--primary-cyan: #34e0ff        /* Primary actions, headers, key text */
--secondary-cyan: #00ccff      /* Secondary actions, IDs, links */
--terminal-cyan: #00ffff       /* Borders, accents, highlights */
```

### Status Colors
```css
--success-green: #00ff88       /* Success states, confirmations */
--warning-amber: #ffaa00       /* Warnings, cautions */
--danger-red: #ff5050          /* Delete actions, errors */
--disabled-gray: #444444       /* Disabled states */
```

### Text Colors
```css
--text-primary: #cfd8df        /* Main body text */
--text-secondary: #aaa         /* Secondary text, descriptions */
--text-muted: #666             /* Placeholder text, empty states */
```

### Background Colors
```css
--bg-page: transparent                     /* Page background - transparent to show app grid */
--bg-modal: rgba(0, 15, 25, 0.95)         /* Modal background */
--bg-modal-overlay: rgba(0, 0, 0, 0.85)   /* Modal overlay */
--bg-input: rgba(0, 10, 20, 0.8)          /* Input fields */
--bg-filter-panel: rgba(0, 255, 255, 0.1)  /* Filter/header sections (enhanced) */
--bg-table-container: rgba(0, 255, 255, 0.05) /* Table container (subtle) */
--bg-table-header: rgba(0, 255, 255, 0.08) /* Table headers */
--bg-table-hover: rgba(0, 255, 255, 0.05)  /* Table row hover */
```

### Border Colors
```css
--border-default: rgba(52, 224, 255, 0.3)  /* Standard borders */
--border-subtle: rgba(0, 255, 255, 0.1)    /* Subtle borders, containers */
--border-row: rgba(0, 255, 255, 0.05)      /* Table row borders */
--border-modal: rgba(52, 224, 255, 0.6)    /* Modal borders (stronger) */
```

### App Background Pattern
```css
/* Applied to main app container via .digital-grid-bg::before */
--grid-size: 40px
--grid-opacity: 0.03
background-image: 
  linear-gradient(rgba(52, 224, 255, 0.03) 1px, transparent 1px),
  linear-gradient(90deg, rgba(52, 224, 255, 0.03) 1px, transparent 1px);
background-size: 40px 40px;
```

---

## 📏 **SPACING SYSTEM**

### Base Units
```css
--space-xs: 0.3rem     /* 4.8px - Tight spacing */
--space-sm: 0.5rem     /* 8px - Small gaps */
--space-md: 0.75rem    /* 12px - Default spacing */
--space-lg: 1rem       /* 16px - Large spacing */
--space-xl: 1.5rem     /* 24px - Extra large spacing */
--space-2xl: 2rem      /* 32px - Section spacing */
```

### Component Padding
```css
--padding-page: 1rem                    /* Page container */
--padding-card: 0.75rem                 /* Card/section padding */
--padding-button: 0.3rem 0.8rem         /* Button padding */
--padding-input: 0.4rem 0.6rem          /* Input field padding */
--padding-table-cell: 0.5rem 0.6rem     /* Table cell padding */
--padding-table-header: 0.4rem 0.6rem   /* Table header padding */
--padding-modal: 1.5rem                 /* Modal padding */
--padding-tag: 0.15rem 0.5rem           /* Tag/badge padding */
```

### Margins & Gaps
```css
--gap-elements: 0.5rem     /* Gap between buttons, inputs */
--gap-sections: 1rem       /* Gap between major sections */
--gap-form-fields: 0.75rem /* Gap between form fields */
--gap-grid: 0.5rem         /* Grid gap */
--margin-section: 1rem     /* Section bottom margin */
```

---

## 🔤 **TYPOGRAPHY**

### Font Sizes
```css
--font-h2: 1.1rem       /* Page titles */
--font-h3: 0.95rem      /* Section titles */
--font-h4: 0.85rem      /* Sub-section titles */
--font-body: 0.75rem    /* Body text, table cells */
--font-small: 0.7rem    /* Small text, labels */
--font-tiny: 0.65rem    /* Tiny text, table headers */
```

### Font Weights
```css
--weight-normal: 400    /* Default text */
--weight-semibold: 600  /* Emphasis, table names */
--weight-bold: 700      /* Headers, buttons, labels */
```

### Font Styles
```css
/* Headers */
font-size: 1.1rem
color: #34e0ff
font-weight: 700
text-transform: uppercase
letter-spacing: 1px
margin: 0

/* Section Headers */
font-size: 0.95rem
color: #34e0ff
font-weight: 700
text-transform: uppercase
letter-spacing: 1px
border-bottom: 1px solid rgba(52, 224, 255, 0.3)
padding-bottom: 0.5rem
margin-bottom: 1rem

/* Labels */
font-size: 0.65rem (or 0.75rem for inline forms)
color: #34e0ff
text-transform: uppercase
letter-spacing: 0.5px
font-weight: 600
display: block
margin-bottom: 0.3rem

/* Table Headers */
font-size: 0.65rem
color: #34e0ff
font-weight: 700
text-transform: uppercase
letter-spacing: 1px

/* Body Text */
font-size: 0.75rem
color: #cfd8df
font-weight: 400

/* Monospace Text (IDs) */
font-family: 'Consolas', 'Monaco', monospace
font-size: 0.7rem
color: #00ccff
letter-spacing: 0.5px
```

---

## 🔘 **BUTTONS**

### Primary Button (Create, Save)
```css
background: rgba(52, 224, 255, 0.15)
border: 1px solid rgba(52, 224, 255, 0.4)
color: #34e0ff
padding: 0.3rem 0.8rem
border-radius: 4px
font-size: 0.7rem
font-weight: 700
letter-spacing: 1px
text-transform: uppercase
cursor: pointer
transition: all 0.2s

/* Hover */
background: rgba(52, 224, 255, 0.25)
border-color: #34e0ff
box-shadow: 0 0 12px rgba(52, 224, 255, 0.4)
```

### Secondary Button (Export, Import)
```css
background: rgba(0, 204, 255, 0.1)
border: 1px solid rgba(0, 204, 255, 0.3)
color: #00ccff
padding: 0.3rem 0.8rem
border-radius: 4px
font-size: 0.7rem
cursor: pointer
```

### Icon Button (Edit, Duplicate, Delete)
```css
width: 26px
height: 26px
padding: 0
border-radius: 4px
font-size: 0.85rem
cursor: pointer
display: inline-flex
align-items: center
justify-content: center
transition: all 0.2s

/* Edit - Cyan */
background: rgba(52, 224, 255, 0.1)
border: 1px solid rgba(52, 224, 255, 0.3)
color: #34e0ff

/* Duplicate - Light Cyan */
background: rgba(0, 204, 255, 0.1)
border: 1px solid rgba(0, 204, 255, 0.3)
color: #00ccff

/* Delete - Red */
background: rgba(255, 80, 80, 0.1)
border: 1px solid rgba(255, 80, 80, 0.3)
color: #ff5050

/* Hover */
background: rgba(COLOR, 0.2)
border-color: COLOR (full opacity)
box-shadow: 0 0 8px rgba(COLOR, 0.4)
```

### Disabled Button
```css
opacity: 0.4
cursor: not-allowed
pointer-events: none
```

---

## 📝 **FORM INPUTS**

### Text Input / Select
```css
width: 100%
padding: 0.4rem 0.6rem
background: rgba(0, 10, 20, 0.8)
border: 1px solid rgba(52, 224, 255, 0.3)
border-radius: 4px
color: #cfd8df
font-size: 0.75rem
transition: all 0.2s

/* Focus */
border-color: #34e0ff
box-shadow: 0 0 8px rgba(52, 224, 255, 0.3)
background: rgba(0, 0, 0, 0.5)
outline: none
```

### Inline Form Layout
```css
/* Container */
display: grid
grid-template-columns: 100px 1fr
gap: 0.75rem
align-items: center
margin-bottom: 0.65rem

/* Label */
font-size: 0.75rem
text-align: right
color: #34e0ff (or #cfd8df for subtle labels)
text-transform: uppercase (optional)
letter-spacing: 0.5px
margin: 0
```

### Range Slider
```css
/* Container */
display: flex
align-items: center
gap: 0.75rem

/* Slider */
width: 100%
height: 4px
background: rgba(0, 255, 255, 0.2)
border-radius: 2px

/* Thumb */
width: 16px
height: 16px
background: #34e0ff
border-radius: 50%
box-shadow: 0 0 8px #34e0ff
cursor: pointer

/* Value Display */
font-size: 0.75rem
color: #34e0ff
font-family: 'Consolas', 'Monaco', monospace
font-weight: 700
min-width: 40px
text-align: right
```

---

## 📊 **TABLES**

### Table Container Structure
```jsx
{/* Wrapper with background */}
<div style={{
  background: 'rgba(0, 255, 255, 0.05)',
  borderRadius: '4px',
  border: '1px solid rgba(0, 255, 255, 0.1)',
  overflow: 'hidden'
}}>
  <table style={{
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: 0,
    background: 'transparent',
    border: 'none'
  }}>
    {/* ... */}
  </table>
</div>
```

### Table Header
```css
/* Header Row */
background: rgba(0, 255, 255, 0.08)

/* Header Cells */
padding: 0.4rem 0.6rem
font-size: 0.65rem
color: #34e0ff
font-weight: 700
text-transform: uppercase
letter-spacing: 1px
text-align: left
white-space: nowrap
border-top: none                                /* No top border */
border-bottom: 1px solid rgba(0, 255, 255, 0.1) /* Only bottom border */
```

### Table Body
```css
/* Rows */
border-bottom: 1px solid rgba(0, 255, 255, 0.05)
transition: background 0.2s

/* Row Hover */
background: rgba(0, 255, 255, 0.05)
cursor: pointer

/* Cells */
padding: 0.5rem 0.6rem
font-size: 0.75rem
color: #ccc
vertical-align: middle

/* Last Row */
border-bottom: none
```

### Special Cell Types
```css
/* Icon Cell */
font-size: 0.75rem
text-align: center

/* ID Cell (Monospace) */
font-family: 'Consolas', 'Monaco', monospace
font-size: 0.7rem
color: #00ccff
letter-spacing: 0.5px

/* Name Cell (Bold) */
font-size: 0.75rem
font-weight: 600
color: #cfd8df

/* Description Cell (Truncated) */
font-size: 0.7rem
color: #aaa
max-width: 300px
white-space: nowrap
overflow: hidden
text-overflow: ellipsis

/* Empty Cell */
color: #666
```

---

## 🏷️ **TAGS & BADGES**

### Tag/Badge Style
```css
display: inline-block
background: rgba(0, 204, 255, 0.15)
border: 1px solid rgba(0, 204, 255, 0.3)
border-radius: 10px
padding: 0.15rem 0.5rem
font-size: 0.65rem
font-weight: 600
color: #00ccff (or context color)
letter-spacing: 0.5px
text-transform: uppercase (optional)
```

### Badge Variants
```css
/* Info/Default */
background: rgba(0, 204, 255, 0.15)
border: 1px solid rgba(0, 204, 255, 0.3)
color: #00ccff

/* Success */
background: rgba(0, 255, 136, 0.15)
border: 1px solid rgba(0, 255, 136, 0.3)
color: #00ff88

/* Warning */
background: rgba(255, 170, 0, 0.15)
border: 1px solid rgba(255, 170, 0, 0.3)
color: #ffaa00

/* Danger */
background: rgba(255, 80, 80, 0.15)
border: 1px solid rgba(255, 80, 80, 0.3)
color: #ff5050
```

---

## 🎭 **MODALS**

### Modal Overlay
```css
position: fixed
top: 0
left: 0
right: 0
bottom: 0
background: rgba(0, 0, 0, 0.85)
display: flex
align-items: center
justify-content: center
z-index: 10000
```

### Modal Container
```css
background: rgba(0, 15, 25, 0.95)
border: 2px solid rgba(52, 224, 255, 0.6)
border-radius: 8px
padding: 1.5rem
max-width: 1000px (or appropriate size)
width: 95%
max-height: 85vh
overflow: auto
box-shadow: 0 0 30px rgba(52, 224, 255, 0.3)
```

### Modal Header
```css
font-size: 0.95rem
color: #34e0ff
margin-top: 0
margin-bottom: 1.5rem
text-transform: uppercase
letter-spacing: 1px
text-align: center
font-weight: 700
```

### Modal Two-Column Layout
```css
display: grid
grid-template-columns: 1fr 1fr
gap: 2rem
margin-bottom: 1.5rem
```

### Modal Section Header
```css
font-size: 0.8rem
font-weight: 700
color: #34e0ff
text-transform: uppercase
letter-spacing: 1px
margin-bottom: 1rem
padding-bottom: 0.5rem
border-bottom: 1px solid rgba(52, 224, 255, 0.3)
```

### Modal Actions (Footer)
```css
display: flex
gap: 0.5rem
margin-top: 1.5rem
justify-content: flex-end (or space-between)
padding-top: 0.5rem (optional)
border-top: 1px solid rgba(52, 224, 255, 0.3) (optional)
```

---

## 📦 **FILTER PANELS**

### Compact Filter/Action Bar (Recommended)
```css
/* Single row with filters and actions */
display: grid
grid-template-columns: 150px 150px 200px auto  /* Type, Parent, Search, Actions */
gap: 0.5rem
margin-bottom: 1rem
padding: 0.75rem
background: rgba(0, 255, 255, 0.1)  /* Enhanced visibility */
border-radius: 4px
border: 1px solid rgba(0, 255, 255, 0.1)
align-items: center
```

### Filter Field
```css
/* Label */
font-size: 0.65rem
color: #34e0ff
text-transform: uppercase
letter-spacing: 0.5px
display: block
margin-bottom: 0.3rem

/* Input/Select */
width: 100%
padding: 0.4rem 0.6rem
background: rgba(0, 10, 20, 0.8)
border: 1px solid rgba(52, 224, 255, 0.3)
border-radius: 4px
color: #cfd8df
font-size: 0.75rem
```

### Action Buttons in Filter Bar
```css
/* Container (right column) */
display: flex
gap: 0.5rem
justify-content: flex-end

/* Buttons */
white-space: nowrap  /* Prevents button text wrapping */
padding: 0.3rem 0.8rem
font-size: 0.7rem
```

---

## 🎯 **PAGE LAYOUTS**

### Modern Compact Layout (No Page Title)
```jsx
{/* Transparent page container - shows app grid background */}
<div style={{
  padding: '1rem',
  minHeight: '100vh',
  color: '#cfd8df',
  background: 'transparent'
}}>
  
  {/* Compact filter/action bar - NO separate header */}
  <div style={{
    display: 'grid',
    gridTemplateColumns: '150px 150px 200px auto',
    gap: '0.5rem',
    marginBottom: '1rem',
    padding: '0.75rem',
    background: 'rgba(0, 255, 255, 0.1)',
    borderRadius: '4px',
    border: '1px solid rgba(0, 255, 255, 0.1)',
    alignItems: 'center'
  }}>
    {/* Filters on left, actions on right */}
  </div>

  {/* Content with subtle background */}
  <div style={{
    background: 'rgba(0, 255, 255, 0.05)',
    borderRadius: '4px',
    border: '1px solid rgba(0, 255, 255, 0.1)',
    overflow: 'hidden'
  }}>
    {/* Table or content */}
  </div>
</div>
```

### Legacy Header Layout (Optional)
```css
### Legacy Header Layout (Optional)
```css
/* Use compact layout instead - this is outdated */
display: flex
justify-content: space-between
align-items: center
margin-bottom: 1rem
padding-bottom: 0.75rem
border-bottom: 1px solid rgba(52, 224, 255, 0.3)
```

---

## 🎨 **DESIGN PRINCIPLES**

### 1. Transparent Layers
- **Page containers**: `background: transparent` to show the app-level grid
- **Filter bars**: `rgba(0, 255, 255, 0.1)` for enhanced visibility
- **Content containers**: `rgba(0, 255, 255, 0.05)` for subtle definition
- **Table headers**: `rgba(0, 255, 255, 0.08)` for hierarchy

### 2. Border Strategy
- **Container borders**: Subtle `rgba(0, 255, 255, 0.1)` with 4px border-radius
- **Table header borders**: Only bottom border, no top/sides to avoid visual conflicts
- **Row borders**: Very subtle `rgba(0, 255, 255, 0.05)` between rows

### 3. Compact Information Density
- Remove unnecessary page titles (use tab navigation instead)
- Combine filters and actions into single compact row
- Use grid layouts for efficient space usage
- Minimize vertical spacing while maintaining readability

### 4. Visual Hierarchy
```
App Background (grid) → Transparent page → Filter bar (0.1) → Content container (0.05) → Table header (0.08)
```

---

## 📋 **IMPLEMENTATION CHECKLIST**

### For Any New Admin Page:

✅ **Container Setup**
- [ ] Page container with `background: transparent`
- [ ] Import and apply `digital-grid-bg` class to app container
- [ ] Use `padding: 1rem` for page content

✅ **Filter/Action Bar**
- [ ] Use grid layout: `150px 150px 200px auto`
- [ ] Background: `rgba(0, 255, 255, 0.1)`
- [ ] Border: `1px solid rgba(0, 255, 255, 0.1)`
- [ ] Border-radius: `4px`
- [ ] Actions aligned right with `justify-content: flex-end`

✅ **Tables**
- [ ] Wrap table in container with `background: rgba(0, 255, 255, 0.05)`
- [ ] Table itself has `background: transparent`, `border: none`
- [ ] Header cells: `borderTop: 'none'`, `borderBottom: '1px solid rgba(0, 255, 255, 0.1)'`
- [ ] Header background: `rgba(0, 255, 255, 0.08)`

✅ **Typography**
- [ ] Labels: `0.65rem`, uppercase, `#34e0ff`
- [ ] Body text: `0.75rem`, `#cfd8df`
- [ ] IDs: Monospace, `0.7rem`, `#00ccff`

✅ **Buttons**
- [ ] Primary: `rgba(52, 224, 255, 0.15)` background
- [ ] Icon buttons: `26px × 26px`
- [ ] Hover effects with glow

---

## 🔄 **MIGRATION FROM OLD DESIGN**

### Changes to Make:

1. **Remove page title sections** - Use tab navigation
2. **Combine header and filters** - Single compact row
3. **Change page backgrounds** - From solid to transparent
4. **Update filter bar opacity** - From 0.03 to 0.1
5. **Add table container wrapper** - For proper background layering
6. **Fix table header borders** - Remove top, keep only bottom

### Before/After Example:

**Before:**
```jsx
<div style={{ background: 'rgba(0, 10, 20, 0.6)' }}>
  <h2>Page Title</h2>
  <div>{/* Actions */}</div>
  <div>{/* Filters */}</div>
  <table>{/* Content */}</table>
</div>
```

**After:**
```jsx
<div style={{ background: 'transparent' }}>
  <div style={{ /* Compact filter/action bar */ }}>
    {/* Filters */}
    {/* Actions */}
  </div>
  <div style={{ /* Table container */ }}>
    <table>{/* Content */}</table>
  </div>
</div>
```
display: flex
gap: 0.5rem
align-items: center
```

---

## 🎬 **ANIMATIONS & TRANSITIONS**

### Hover Transitions
```css
transition: all 0.2s ease
transition: background 0.2s ease
```

### Button Hover Effects
```css
/* Subtle glow */
box-shadow: 0 0 12px rgba(COLOR, 0.4)

/* Background brighten */
background: rgba(COLOR, 0.25) /* from 0.15 */
```

### Row Hover Effects
```css
background: rgba(0, 255, 255, 0.05)
box-shadow: inset 0 0 20px rgba(0, 255, 255, 0.1)
```

---

## 📱 **BORDER RADIUS**

```css
--radius-card: 6px       /* Cards, tables, large components */
--radius-sm: 4px         /* Buttons, inputs, small components */
--radius-tag: 10px       /* Tags, badges (pill shape) */
--radius-modal: 8px      /* Modals */
```

---

## 🎨 **LAYOUT PATTERNS**

### Page Container
```css
padding: 1rem
background: rgba(0, 10, 20, 0.6)
min-height: 100vh
color: #cfd8df
```

### Loading State
```css
padding: 1rem
background: rgba(0, 10, 20, 0.6)
min-height: 100vh
color: #cfd8df
display: flex
align-items: center
justify-content: center

/* Text */
color: #34e0ff
font-size: 0.9rem
```

### Empty State
```css
text-align: center
padding: 2rem
color: #666
font-size: 0.85rem
```

---

## 🔧 **COMPONENT SIZING**

### Fixed Sizes
```css
--icon-button-size: 26px
--input-height: 30px (with padding 0.4rem)
--button-height: 28px (with padding 0.3rem)
--table-row-height: ~32px (auto with padding)
```

---

## 🎯 **INTERACTIONS**

### Cursor States
```css
cursor: pointer     /* Buttons, clickable rows */
cursor: not-allowed /* Disabled elements */
cursor: default     /* Static text */
```

### Focus States
```css
outline: none
border-color: #34e0ff
box-shadow: 0 0 8px rgba(52, 224, 255, 0.3)
background: rgba(0, 0, 0, 0.5)
```

### Active States
```css
transform: translateY(1px) /* Button press */
```

---

## 📋 **IMPLEMENTATION CHECKLIST**

When creating new admin pages, ensure:

- [ ] Page uses `padding: 1rem` and `background: rgba(0, 10, 20, 0.6)`
- [ ] Page header has title (1.1rem, cyan, uppercase, 1px spacing) and action buttons
- [ ] Border separator under header: `border-bottom: 1px solid rgba(52, 224, 255, 0.3)`
- [ ] Filter panels use grid layout with cyan background `rgba(0, 255, 255, 0.03)`
- [ ] Labels are 0.65rem or 0.75rem, cyan, uppercase, 0.5px spacing
- [ ] Inputs/selects have padding `0.4rem 0.6rem`, dark background, cyan border
- [ ] Tables use `.data-table-compact` class or inline styles from this guide
- [ ] Table headers are 0.65rem, uppercase, 1px spacing, cyan
- [ ] Table cells are 0.75rem, with 0.5rem 0.6rem padding
- [ ] Buttons follow primary/secondary/icon patterns with proper padding and sizing
- [ ] Icon buttons are exactly 26px × 26px
- [ ] Tags/badges use 10px border-radius (pill shape)
- [ ] Modals use dark background with cyan border and 30px glow shadow
- [ ] All transitions are 0.2s ease
- [ ] Monospace text (IDs) uses Consolas/Monaco, 0.7rem, cyan
- [ ] Empty states use centered text, #666 color, 0.85rem
- [ ] All colors match the palette exactly
- [ ] Border radius is 4px (small) or 6px (large)

---

## 🎨 **CSS CLASS REFERENCE**

Use these existing classes from `AdminCompact.css`:

```css
.data-table-compact       /* Full table styling */
.btn-compact             /* Compact button */
.btn-icon                /* Icon button (26px) */
.form-inline             /* Inline form layout */
.glass-card-compact      /* Card container */
.tag-chip                /* Tag/badge */
.badge-compact           /* Status badge */
.mono-id                 /* Monospace ID */
```

---

**Last Updated:** November 25, 2025  
**Source:** POI Library Component  
**Version:** 1.0

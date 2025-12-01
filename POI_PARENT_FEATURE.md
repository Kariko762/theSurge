# POI Parent Feature Implementation

## Overview
Added an `isParent` boolean field to the POI Library system that allows designers to mark POIs as "Parent" POIs. When a POI is marked as a parent, it becomes available in the Parent dropdown when creating or editing other POIs.

## Changes Made

### 1. Frontend Component (`src/components/admin/POILibrary.jsx`)

#### Updated Parent POI Filter
- **Before**: Used `canHaveChildren` property from hardcoded POI_TYPES array
- **After**: Filters based on `isParent: true` in the actual POI data
```javascript
const parentPOIs = pois.filter(p => p.isParent === true);
```

#### Added `isParent` Field to Form Data
- Added `isParent: false` to default form state
- Field is preserved when editing existing POIs

#### New UI Elements

**Form Checkbox (Edit POI Section)**
- Added checkbox control after Description field
- Label: "Allow other POIs to orbit this one"
- Users can toggle whether a POI can be a parent

**Table Column**
- Added "Is Parent" column to POI table
- Shows green checkmark (✓) for POIs marked as parents
- Shows dash (—) for non-parent POIs
- Tooltip: "Can be a parent for other POIs"

### 2. Backend Route (`backend/routes/poi-library.js`)

Updated all default POI definitions to include `isParent` field:

| POI Type | isParent | Rationale |
|----------|----------|-----------|
| PLANET | `true` | Planets can have moons, stations orbiting them |
| MOON | `false` | Moons typically don't have sub-orbitals |
| BELT | `true` | Belts can have mining stations, facilities |
| STATION | `false` | Stations are endpoints, not parents |
| HABITAT | `true` | Habitats can have support structures |
| ANOMALY | `false` | Anomalies are singular phenomena |
| CONFLICT | `false` | Conflict zones are events, not structures |
| DISTRESS | `false` | Distress signals are temporary |
| FACILITY | `false` | Facilities are endpoints |
| NEBULA | `false` | Nebulae are environmental effects |
| WAKE | `false` | Wakes are ephemeral signatures |

### 3. Data File (`backend/data/poi_library.json`)

Updated all 11 existing POI entries to include the `isParent` field with appropriate values matching the backend defaults.

## Usage

### Marking a POI as Parent

1. Open Admin Panel → POI Library
2. Click "Edit" (✎) on any POI or create new POI
3. In the "Edit POI" section, check the "Is Parent" checkbox
4. Save the POI

### Assigning a Parent to a POI

1. Open Admin Panel → POI Library
2. Edit or create a POI
3. In the "Parent POI" dropdown, you'll now see only POIs where `isParent === true`
4. Select a parent from the list
5. Save the POI

## Benefits

### Designer Control
- Designers can now dynamically mark any POI as a parent without code changes
- No longer limited by hardcoded type restrictions
- Can create custom parent/child relationships based on game design needs

### Flexibility
- A STATION could be marked as `isParent: true` to allow support craft to orbit it
- A FACILITY could have sub-facilities or defensive platforms
- Any POI type can be a parent if the designer chooses

### Visual Clarity
- Table clearly shows which POIs can be parents (✓ indicator)
- Easy to see at a glance which POIs are available as parents

## Technical Details

### Data Schema Addition
```json
{
  "id": "POI_EXAMPLE",
  "name": "Example POI",
  "type": "PLANET",
  "isParent": true,  // NEW FIELD
  "parentId": null,
  "description": "...",
  // ... other fields
}
```

### Filter Logic
The parent dropdown is now populated using:
```javascript
const parentPOIs = pois.filter(p => p.isParent === true);
```

This replaces the old logic:
```javascript
const parentPOIs = pois.filter(p => 
  POI_TYPES.find(t => t.id === p.type)?.canHaveChildren
);
```

## Testing Checklist

- [x] Added `isParent` field to all default POI types
- [x] Updated POI Library component to display `isParent` checkbox
- [x] Updated parent filter to use `isParent` flag
- [x] Added visual indicator in table for parent POIs
- [x] Updated existing poi_library.json data
- [ ] Test creating new POI with `isParent: true`
- [ ] Test creating child POI and verify parent dropdown shows only parent POIs
- [ ] Test toggling `isParent` on existing POI
- [ ] Test that changing `isParent` to `false` updates parent dropdown

## Future Enhancements

1. **Validation**: Prevent circular parent relationships (A → B → A)
2. **Cascading Display**: Show parent/child relationships in a tree view
3. **Bulk Operations**: Mark multiple POIs as parents simultaneously
4. **Parent Count**: Show how many children each parent POI has
5. **Inheritance**: Allow child POIs to inherit properties from parents

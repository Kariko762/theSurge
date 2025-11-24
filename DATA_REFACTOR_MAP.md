# Data Refactoring Map

## Current State
All game data stored in single monolithic `backend/data/config.json` file.

## New Structure
Data split into separate files:
- `ships.json`
- `ship_tiers.json`
- `factions.json`
- `narratives.json`
- `events_core.json`
- `items/items_core.json`
- `items/items_weapons.json`
- `items/items_subsystems.json`
- `items/items_resources.json`
- `items/items_consumables.json`
- `items/items_equipment.json`
- `items/items_artifacts.json`
- `missions/missions_core.json`

---

## 🔧 BACKEND REFACTORING

### 1. File Handlers (`backend/utils/fileHandler.js`)
**Current:** Only handles single config.json
**Needed:** Add specialized handlers for each data type

```javascript
// New functions needed:
- readShips() -> ships.json
- writeShips(data) -> ships.json
- readShipTiers() -> ship_tiers.json
- writeShipTiers(data) -> ship_tiers.json
- readFactions() -> factions.json
- writeFactions(data) -> factions.json
- readNarratives() -> narratives.json
- writeNarratives(data) -> narratives.json
- readEventsCore() -> events_core.json
- writeEventsCore(data) -> events_core.json
- readItems(category?) -> Aggregates all items/* files or specific category
- writeItems(category, data) -> items/items_{category}.json
- readMissions() -> missions/*.json
- writeMission(id, data) -> missions/[msXXXXXX]_{name}.json
```

### 2. API Routes - NEW ROUTES NEEDED

#### `/api/ships`
```
GET    /api/ships          -> Read ships.json
POST   /api/ships          -> Add new ship
PUT    /api/ships/:id      -> Update ship by ID
DELETE /api/ships/:id      -> Delete ship by ID
```

#### `/api/ship-tiers`
```
GET    /api/ship-tiers          -> Read ship_tiers.json
POST   /api/ship-tiers          -> Add new tier bonus
PUT    /api/ship-tiers/:id      -> Update tier bonus by ID
DELETE /api/ship-tiers/:id      -> Delete tier bonus by ID
```

#### `/api/factions`
```
GET    /api/factions          -> Read factions.json
POST   /api/factions          -> Add new faction
PUT    /api/factions/:id      -> Update faction by ID
DELETE /api/factions/:id      -> Delete faction by ID
```

#### `/api/items`
```
GET    /api/items                    -> Get all items (aggregated)
GET    /api/items/:category          -> Get items by category (weapons, subsystems, etc)
POST   /api/items/:category          -> Add item to category
PUT    /api/items/:category/:id      -> Update item by ID
DELETE /api/items/:category/:id      -> Delete item by ID
```

#### `/api/narratives`
```
GET    /api/narratives          -> Read narratives.json
PUT    /api/narratives          -> Update entire narratives structure
```

#### `/api/events/core`
```
GET    /api/events/core         -> Read events_core.json
PUT    /api/events/core         -> Update events core settings
```

#### `/api/missions`
```
GET    /api/missions               -> List all missions
GET    /api/missions/:id           -> Get specific mission
POST   /api/missions               -> Create new mission file
PUT    /api/missions/:id           -> Update mission file
DELETE /api/missions/:id           -> Delete mission file
```

### 3. Backwards Compatibility
**Keep `/api/config` for now:**
- Aggregate data from all new files
- Return in old format
- Phase out over time

---

## 🎨 FRONTEND REFACTORING

### 1. API Client (`src/lib/api/client.js`)

**Current structure:**
```javascript
config: {
  get: () => axios.get('/api/config'),
  update: (data) => axios.put('/api/config', data)
}
```

**New structure needed:**
```javascript
ships: {
  getAll: () => axios.get('/api/ships'),
  getById: (id) => axios.get(`/api/ships/${id}`),
  create: (data) => axios.post('/api/ships', data),
  update: (id, data) => axios.put(`/api/ships/${id}`, data),
  delete: (id) => axios.delete(`/api/ships/${id}`)
},
shipTiers: {
  getAll: () => axios.get('/api/ship-tiers'),
  create: (data) => axios.post('/api/ship-tiers', data),
  update: (id, data) => axios.put(`/api/ship-tiers/${id}`, data),
  delete: (id) => axios.delete(`/api/ship-tiers/${id}`)
},
factions: {
  getAll: () => axios.get('/api/factions'),
  create: (data) => axios.post('/api/factions', data),
  update: (id, data) => axios.put(`/api/factions/${id}`, data),
  delete: (id) => axios.delete(`/api/factions/${id}`)
},
items: {
  getAll: () => axios.get('/api/items'),
  getByCategory: (category) => axios.get(`/api/items/${category}`),
  create: (category, data) => axios.post(`/api/items/${category}`, data),
  update: (category, id, data) => axios.put(`/api/items/${category}/${id}`, data),
  delete: (category, id) => axios.delete(`/api/items/${category}/${id}`)
},
narratives: {
  get: () => axios.get('/api/narratives'),
  update: (data) => axios.put('/api/narratives', data)
},
events: {
  getCore: () => axios.get('/api/events/core'),
  updateCore: (data) => axios.put('/api/events/core', data)
},
missions: {
  getAll: () => axios.get('/api/missions'),
  getById: (id) => axios.get(`/api/missions/${id}`),
  create: (data) => axios.post('/api/missions', data),
  update: (id, data) => axios.put(`/api/missions/${id}`, data),
  delete: (id) => axios.delete(`/api/missions/${id}`)
}
```

### 2. Admin Components - FORMS & DROPDOWNS

#### **ShipsManager.jsx**
**Current:**
- `loadLootItems()` → `api.config.get()` → `response.config.lootTables.items`
- `loadAICrew()` → `api.config.get()` → `response.config.aiCrew`
- `loadShipTierBonuses()` → `api.config.get()` → `response.config.shipTierBonuses`
- `loadFactions()` → `api.config.get()` → `response.config.factions`
- `handleSave()` → Saves entire config with ships array

**Needs to change to:**
- `loadLootItems()` → `api.items.getAll()`
- `loadAICrew()` → `api.aiCores.getAll()` (NEW endpoint needed)
- `loadShipTierBonuses()` → `api.shipTiers.getAll()`
- `loadFactions()` → `api.factions.getAll()`
- `handleSave()` → Loop through ships, call `api.ships.update(ship.id, ship)` for each

**Dropdowns affected:**
- Engine dropdown → populated from items (category: equipment, subcategory: engine)
- Weapon slots → populated from items (category: weapon)
- Subsystem slots → populated from items (category: subsystem)
- AI Core slots → populated from aiCores
- Tier Bonuses → populated from shipTiers
- Faction → populated from factions

#### **ShipTiersManager.jsx**
**Current:**
- `loadTierBonuses()` → `api.config.get()` → `response.config.shipTierBonuses`
- `handleSave()` → Updates entire config with shipTierBonuses array

**Needs to change to:**
- `loadTierBonuses()` → `api.shipTiers.getAll()`
- `saveBonus()` → `api.shipTiers.create()` or `api.shipTiers.update(id)`
- `deleteBonus(id)` → `api.shipTiers.delete(id)`

#### **FactionsManager.jsx**
**Current:**
- `loadFactions()` → `api.config.get()` → `response.config.factions`
- `handleSave()` → Updates entire config with factions array

**Needs to change to:**
- `loadFactions()` → `api.factions.getAll()`
- `saveFaction()` → `api.factions.create()` or `api.factions.update(id)`
- `deleteFaction(id)` → `api.factions.delete(id)`

**Dropdowns affected:**
- Faction relationships dropdown → populated from factions list

#### **AICrewManager.jsx**
**Current:**
- `loadAICores()` → `api.config.get()` → `response.config.aiCores`
- `handleSave()` → `api.config.update({ aiCores })`

**Needs to change to:**
- `loadAICores()` → `api.aiCores.getAll()` (NEW endpoint needed)
- `saveCrew()` → `api.aiCores.create()` or `api.aiCores.update(id)`
- `deleteCrew(id)` → `api.aiCores.delete(id)`

#### **EventEditor.jsx**
**Current:**
- `loadConfig()` → `api.config.get()`
- Uses: `cfg.lootTables.items`, `cfg.aiCrew`, `cfg.factions`, `cfg.narrativeLibrary.pools`

**Needs to change to:**
- Load items → `api.items.getAll()`
- Load AI → `api.aiCores.getAll()`
- Load factions → `api.factions.getAll()`
- Load narratives → `api.narratives.get()`

**Dropdowns affected:**
- Faction dropdown for events
- Items for rewards
- Narratives for event text

#### **NarrativeLibrary.jsx**
**Current:**
- Receives config as prop
- Updates via `updateConfig()` callback

**Needs to change to:**
- `loadNarratives()` → `api.narratives.get()`
- `saveNarratives()` → `api.narratives.update(narratives)`

#### **BuildSimulator.jsx**
**Current:**
- `loadConfig()` → `api.config.get()`
- Uses: `cfg.ships`, `cfg.aiCores`

**Needs to change to:**
- Load ships → `api.ships.getAll()`
- Load AI → `api.aiCores.getAll()`

**Dropdowns affected:**
- Ship selection dropdown
- AI core assignment dropdowns

---

## 🎮 GAME SYSTEMS REFACTORING

### 1. Loot System (`src/lib/lootEngine.js` or similar)
**Current:** Reads from `config.lootTables.items`
**Change to:** Call `api.items.getAll()` or cache items in state/context

### 2. Combat System (`src/lib/combatEngine.js`)
**Current:** References weapons arrays
**Change to:** Load weapons from `api.items.getByCategory('weapon')`

### 3. Event System (`src/lib/eventEngine.js`)
**Current:** Uses `config.narrativeLibrary`, `config.encounterRates`
**Change to:**
- Narratives → `api.narratives.get()`
- Encounter rates → `api.events.getCore()`

### 4. Inventory/Item References
**Any system that displays items:**
- Change from config.lootTables.items
- To `api.items.getAll()` or category-specific calls

---

## 📋 IMPLEMENTATION PRIORITY

### Phase 1: Backend Foundation
1. ✅ Create new file structure (DONE)
2. ✅ Migrate data to new files (DONE)
3. ⏳ Create new file handler utilities
4. ⏳ Create new API routes
5. ⏳ Keep /api/config as aggregator for backwards compatibility

### Phase 2: Frontend API Client
1. ⏳ Update `src/lib/api/client.js` with new endpoints
2. ⏳ Keep old config.get() as fallback

### Phase 3: Admin Portal (Critical Path)
1. ⏳ Update ShipsManager
2. ⏳ Update ShipTiersManager
3. ⏳ Update FactionsManager
4. ⏳ Update AICrewManager
5. ⏳ Update EventEditor
6. ⏳ Update NarrativeLibrary
7. ⏳ Update BuildSimulator

### Phase 4: Game Systems
1. ⏳ Update loot rolling
2. ⏳ Update combat weapon loading
3. ⏳ Update event narrative selection
4. ⏳ Update any inventory displays

### Phase 5: Testing & Cleanup
1. ⏳ Full system test
2. ⏳ Remove old /api/config endpoint
3. ⏳ Delete old config.json

---

## 🚨 CRITICAL DEPENDENCIES

### Components that MUST be updated together:
1. **Ships ecosystem:**
   - ShipsManager.jsx
   - BuildSimulator.jsx
   - backend/routes/ships.js (NEW)
   - src/lib/api/client.js ships section

2. **Items ecosystem:**
   - ShipsManager.jsx (weapon/subsystem/engine dropdowns)
   - EventEditor.jsx (reward items)
   - Loot engine
   - Combat engine
   - backend/routes/items.js (NEW)
   - src/lib/api/client.js items section

3. **Factions ecosystem:**
   - FactionsManager.jsx
   - EventEditor.jsx (faction selection)
   - backend/routes/factions.js (NEW)
   - src/lib/api/client.js factions section

---

## 🔍 FILES TO UPDATE - COMPLETE LIST

### Backend
- `backend/utils/fileHandler.js` - Add new read/write functions
- `backend/routes/ships.js` - NEW FILE
- `backend/routes/ship-tiers.js` - NEW FILE
- `backend/routes/factions.js` - NEW FILE
- `backend/routes/items.js` - NEW FILE
- `backend/routes/ai-cores.js` - NEW FILE
- `backend/routes/narratives.js` - NEW FILE
- `backend/routes/events.js` - UPDATE to use events_core.json
- `backend/routes/missions.js` - UPDATE to use missions/ folder
- `backend/routes/config.js` - UPDATE to aggregate from all sources

### Frontend API
- `src/lib/api/client.js` - Add all new endpoint groups

### Admin Components
- `src/components/admin/ShipsManager.jsx`
- `src/components/admin/ShipTiersManager.jsx`
- `src/components/admin/FactionsManager.jsx`
- `src/components/admin/AICrewManager.jsx`
- `src/components/admin/EventEditor.jsx`
- `src/components/admin/NarrativeLibrary.jsx`
- `src/components/admin/BuildSimulator.jsx`
- `src/components/admin/ConfigEditor.jsx` - Update to use new endpoints

### Game Systems
- Any file that references loot items
- Any file that references weapons
- Any file that references narratives
- Any file that references encounter rates

---

## ✅ VALIDATION CHECKLIST

After refactor, verify:
- [ ] Can create new ship in Admin Portal
- [ ] Ship dropdowns populate correctly (engines, weapons, subsystems)
- [ ] Can create new faction
- [ ] Can create new ship tier bonus
- [ ] Can create new AI core
- [ ] Events system still loads narratives
- [ ] Loot drops still work
- [ ] Combat loads weapons correctly
- [ ] All Admin Portal saves work
- [ ] No console errors
- [ ] Backend logs show correct file reads/writes

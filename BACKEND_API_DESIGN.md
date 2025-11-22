# Backend API Design - Event Engine Admin System

## 🎯 Overview

Full-stack CRUD system for managing events, configurations, missions, and users. Node.js/Express backend with JWT authentication and JSON file storage.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     SYSTEM ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  FRONTEND (React)                                            │
│  ├─ Login Page                                               │
│  ├─ Admin Panel (Protected)                                  │
│  │   ├─ Event Editor                                         │
│  │   ├─ Config Editor                                        │
│  │   ├─ Mission Editor                                       │
│  │   ├─ User Management                                      │
│  │   └─ API Documentation                                    │
│  └─ API Testing Interface                                    │
│                                                              │
│  ↕ HTTP/JSON (Port 3001)                                     │
│                                                              │
│  BACKEND (Express.js)                                        │
│  ├─ Authentication Middleware (JWT)                          │
│  ├─ API Routes                                               │
│  │   ├─ /api/auth (login, logout, session)                  │
│  │   ├─ /api/users (CRUD)                                    │
│  │   ├─ /api/events (CRUD)                                   │
│  │   ├─ /api/config (CRUD)                                   │
│  │   └─ /api/missions (CRUD)                                 │
│  └─ File System I/O                                          │
│                                                              │
│  ↕ JSON Files                                                │
│                                                              │
│  DATA STORAGE (JSON Files)                                   │
│  ├─ backend/data/users.json                                  │
│  ├─ backend/data/config.json                                 │
│  ├─ backend/data/events_poi.json                             │
│  ├─ backend/data/events_dynamic.json                         │
│  └─ backend/data/missions.json                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
space-game/
├── backend/
│   ├── package.json
│   ├── server.js                    # Main Express server
│   ├── .env                         # Environment variables (JWT secret)
│   ├── data/                        # JSON storage
│   │   ├── users.json
│   │   ├── config.json
│   │   ├── events_poi.json
│   │   ├── events_dynamic.json
│   │   ├── events_mission.json
│   │   └── missions.json
│   ├── middleware/
│   │   └── auth.js                  # JWT authentication
│   ├── routes/
│   │   ├── auth.js                  # Auth endpoints
│   │   ├── users.js                 # User CRUD
│   │   ├── events.js                # Event CRUD
│   │   ├── config.js                # Config CRUD
│   │   └── missions.js              # Mission CRUD
│   └── utils/
│       ├── fileHandler.js           # JSON file I/O
│       └── validation.js            # Input validation
│
├── src/
│   ├── components/
│   │   └── admin/
│   │       ├── AdminPanel.jsx       # Main admin layout
│   │       ├── Login.jsx            # Login page
│   │       ├── EventEditor.jsx      # Event CRUD UI
│   │       ├── ConfigEditor.jsx     # Config editor UI
│   │       ├── MissionEditor.jsx    # Mission editor UI
│   │       ├── UserManagement.jsx   # User CRUD UI
│   │       └── APIDocumentation.jsx # API docs + testing
│   └── lib/
│       └── api/
│           └── client.js            # API client wrapper
```

---

## 🔐 Authentication System

### **User Model** (`backend/data/users.json`)
```json
[
  {
    "id": "user_1",
    "username": "admin",
    "email": "admin@surge.game",
    "passwordHash": "$2b$10$...",
    "role": "admin",
    "createdAt": "2025-11-21T10:00:00Z",
    "lastLogin": "2025-11-21T12:30:00Z",
    "active": true
  },
  {
    "id": "user_2",
    "username": "editor",
    "email": "editor@surge.game",
    "passwordHash": "$2b$10$...",
    "role": "editor",
    "createdAt": "2025-11-21T11:00:00Z",
    "lastLogin": null,
    "active": true
  }
]
```

### **Roles**
- **admin**: Full access (create/edit/delete all resources, manage users)
- **editor**: Can edit events/config/missions, cannot manage users
- **viewer**: Read-only access

### **JWT Token Payload**
```json
{
  "userId": "user_1",
  "username": "admin",
  "role": "admin",
  "iat": 1732233456,
  "exp": 1732319856
}
```

---

## 📡 API Endpoints

### **Authentication** (`/api/auth`)

#### **POST /api/auth/login**
Login user and receive JWT token.

**Request:**
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_1",
    "username": "admin",
    "role": "admin",
    "email": "admin@surge.game"
  }
}
```

**Response (401):**
```json
{
  "success": false,
  "error": "Invalid username or password"
}
```

#### **POST /api/auth/logout**
Invalidate current session (client-side token removal).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### **GET /api/auth/session**
Verify current session and get user info.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "user_1",
    "username": "admin",
    "role": "admin"
  }
}
```

---

### **Users** (`/api/users`) - ADMIN ONLY

#### **GET /api/users**
Get all users.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "users": [
    {
      "id": "user_1",
      "username": "admin",
      "email": "admin@surge.game",
      "role": "admin",
      "active": true,
      "createdAt": "2025-11-21T10:00:00Z",
      "lastLogin": "2025-11-21T12:30:00Z"
    }
  ]
}
```

#### **GET /api/users/:id**
Get single user by ID.

**Response (200):**
```json
{
  "success": true,
  "user": { /* user object */ }
}
```

#### **POST /api/users**
Create new user.

**Request:**
```json
{
  "username": "newuser",
  "email": "newuser@surge.game",
  "password": "password123",
  "role": "editor"
}
```

**Response (201):**
```json
{
  "success": true,
  "user": {
    "id": "user_3",
    "username": "newuser",
    "email": "newuser@surge.game",
    "role": "editor",
    "active": true,
    "createdAt": "2025-11-21T14:00:00Z"
  }
}
```

#### **PUT /api/users/:id**
Update user.

**Request:**
```json
{
  "email": "updated@surge.game",
  "role": "admin",
  "active": false
}
```

**Response (200):**
```json
{
  "success": true,
  "user": { /* updated user */ }
}
```

#### **DELETE /api/users/:id**
Delete user.

**Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

### **Events** (`/api/events`)

#### **GET /api/events**
Get all events.

**Query Params:**
- `type` - Filter by type (poi, dynamic, mission)
- `tags` - Filter by tags (comma-separated)

**Response (200):**
```json
{
  "success": true,
  "events": [
    {
      "id": "asteroid_mining_unstable",
      "version": "1.0",
      "metadata": {
        "author": "System",
        "tags": ["mining", "hazard", "asteroid"]
      },
      "trigger": { /* ... */ },
      "scenario": { /* ... */ },
      "challenge": { /* ... */ },
      "resolutions": [ /* ... */ ]
    }
  ],
  "count": 15
}
```

#### **GET /api/events/:id**
Get single event by ID.

**Response (200):**
```json
{
  "success": true,
  "event": { /* event object */ }
}
```

**Response (404):**
```json
{
  "success": false,
  "error": "Event not found"
}
```

#### **POST /api/events**
Create new event.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "id": "new_event_id",
  "version": "1.0",
  "metadata": {
    "author": "admin",
    "created": "2025-11-21T14:00:00Z",
    "tags": ["custom", "test"]
  },
  "trigger": { /* ... */ },
  "scenario": { /* ... */ },
  "challenge": { /* ... */ },
  "resolutions": [ /* ... */ ]
}
```

**Response (201):**
```json
{
  "success": true,
  "event": { /* created event */ },
  "message": "Event created successfully"
}
```

**Response (400):**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    "Missing required field: trigger.type",
    "Invalid range in resolution 0"
  ]
}
```

#### **PUT /api/events/:id**
Update existing event.

**Headers:** `Authorization: Bearer <token>`

**Request:** (same as POST, all fields)

**Response (200):**
```json
{
  "success": true,
  "event": { /* updated event */ },
  "message": "Event updated successfully"
}
```

#### **DELETE /api/events/:id**
Delete event.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Event deleted successfully"
}
```

---

### **Config** (`/api/config`)

#### **GET /api/config**
Get all configuration.

**Response (200):**
```json
{
  "success": true,
  "config": {
    "difficultyCurve": {
      "easy": { "min": 3, "max": 5 },
      "normal": { "min": 8, "max": 10 },
      "hard": { "min": 12, "max": 14 }
    },
    "lootMultipliers": {
      "criticalSuccess": { "min": 2.0, "max": 3.0 },
      "success": { "min": 1.0, "max": 1.5 },
      "partialSuccess": { "min": 0.5, "max": 0.8 }
    },
    "encounterRates": {
      "trader": { "weight": 20, "cooldown": 300 },
      "pirate": { "weight": 15, "cooldown": 600 },
      "derelict": { "weight": 10, "cooldown": 900 }
    },
    "riskCalculation": {
      "wakeWeight": 40,
      "locationWeight": 30,
      "timeWeight": 15,
      "eventWeight": 10,
      "missionWeight": 5
    },
    "dynamicScheduler": {
      "lowRisk": { "threshold": 20, "interval": 60 },
      "moderateRisk": { "threshold": 40, "interval": 30 },
      "highRisk": { "threshold": 60, "interval": 15 },
      "criticalRisk": { "threshold": 80, "interval": 5 },
      "extremeRisk": { "threshold": 100, "interval": 2 }
    }
  }
}
```

#### **PUT /api/config**
Update configuration.

**Headers:** `Authorization: Bearer <token>`

**Request:** (partial or full config object)

**Response (200):**
```json
{
  "success": true,
  "config": { /* updated config */ },
  "message": "Configuration updated successfully"
}
```

---

### **Missions** (`/api/missions`)

#### **GET /api/missions**
Get all missions.

**Query Params:**
- `type` - Filter by type (salvage, exploration, combat)
- `tier` - Filter by tier (lowRisk, mediumRisk, highRisk, deadly)

**Response (200):**
```json
{
  "success": true,
  "missions": [
    {
      "id": "mission_salvage_derelict",
      "type": "salvage",
      "tier": "highRisk",
      "name": "Derelict Platform Recovery",
      "description": "Investigate abandoned orbital platform",
      "location": { /* ... */ },
      "steps": [ /* ... */ ],
      "rewards": { /* ... */ }
    }
  ],
  "count": 8
}
```

#### **GET /api/missions/:id**
Get single mission.

#### **POST /api/missions**
Create new mission.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "id": "mission_custom",
  "type": "exploration",
  "tier": "mediumRisk",
  "name": "Custom Mission",
  "description": "Description here",
  "steps": [
    {
      "id": "step1",
      "objective": "Do something",
      "triggerEvent": "event_id",
      "onComplete": "step2"
    }
  ],
  "rewards": {
    "baseline": [{"itemId": "scrap", "quantity": 10}],
    "credits": [100, 500],
    "science": [25, 100]
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "mission": { /* created mission */ }
}
```

#### **PUT /api/missions/:id**
Update mission.

#### **DELETE /api/missions/:id**
Delete mission.

---

## 🔧 Backend Implementation

### **server.js**
```javascript
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/events', require('./routes/events'));
app.use('/api/config', require('./routes/config'));
app.use('/api/missions', require('./routes/missions'));

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});
```

### **middleware/auth.js**
```javascript
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access denied - no token provided'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    req.user = user;
    next();
  });
}

// Check if user has required role
function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole,
  JWT_SECRET
};
```

### **utils/fileHandler.js**
```javascript
const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

// Read JSON file
async function readJSON(filename) {
  const filepath = path.join(DATA_DIR, filename);
  const data = await fs.readFile(filepath, 'utf-8');
  return JSON.parse(data);
}

// Write JSON file
async function writeJSON(filename, data) {
  const filepath = path.join(DATA_DIR, filename);
  await fs.writeFile(filepath, JSON.stringify(data, null, 2));
}

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

module.exports = {
  readJSON,
  writeJSON,
  ensureDataDir
};
```

### **routes/events.js**
```javascript
const express = require('express');
const router = express.Router();
const { readJSON, writeJSON } = require('../utils/fileHandler');
const { authenticateToken } = require('../middleware/auth');
const { validateEvent } = require('../utils/validation');

// GET all events
router.get('/', async (req, res) => {
  try {
    const poi = await readJSON('events_poi.json');
    const dynamic = await readJSON('events_dynamic.json');
    const mission = await readJSON('events_mission.json');

    let events = [...poi, ...dynamic, ...mission];

    // Filter by type
    if (req.query.type) {
      events = events.filter(e => e.metadata?.tags?.includes(req.query.type));
    }

    // Filter by tags
    if (req.query.tags) {
      const tags = req.query.tags.split(',');
      events = events.filter(e =>
        tags.some(tag => e.metadata?.tags?.includes(tag))
      );
    }

    res.json({
      success: true,
      events,
      count: events.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET event by ID
router.get('/:id', async (req, res) => {
  try {
    const poi = await readJSON('events_poi.json');
    const dynamic = await readJSON('events_dynamic.json');
    const mission = await readJSON('events_mission.json');

    const events = [...poi, ...dynamic, ...mission];
    const event = events.find(e => e.id === req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    res.json({
      success: true,
      event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST create event
router.post('/', authenticateToken, async (req, res) => {
  try {
    const newEvent = req.body;

    // Validate event structure
    const validation = validateEvent(newEvent);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors
      });
    }

    // Determine which file to save to based on tags
    let filename = 'events_dynamic.json';
    if (newEvent.metadata?.tags?.includes('poi')) {
      filename = 'events_poi.json';
    } else if (newEvent.metadata?.tags?.includes('mission')) {
      filename = 'events_mission.json';
    }

    const events = await readJSON(filename);

    // Check for duplicate ID
    if (events.find(e => e.id === newEvent.id)) {
      return res.status(400).json({
        success: false,
        error: 'Event with this ID already exists'
      });
    }

    events.push(newEvent);
    await writeJSON(filename, events);

    res.status(201).json({
      success: true,
      event: newEvent,
      message: 'Event created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT update event
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const updatedEvent = req.body;

    // Validate
    const validation = validateEvent(updatedEvent);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors
      });
    }

    // Find event in all files
    const files = ['events_poi.json', 'events_dynamic.json', 'events_mission.json'];
    let found = false;

    for (const filename of files) {
      const events = await readJSON(filename);
      const index = events.findIndex(e => e.id === req.params.id);

      if (index !== -1) {
        events[index] = updatedEvent;
        await writeJSON(filename, events);
        found = true;
        break;
      }
    }

    if (!found) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    res.json({
      success: true,
      event: updatedEvent,
      message: 'Event updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE event
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const files = ['events_poi.json', 'events_dynamic.json', 'events_mission.json'];
    let found = false;

    for (const filename of files) {
      const events = await readJSON(filename);
      const index = events.findIndex(e => e.id === req.params.id);

      if (index !== -1) {
        events.splice(index, 1);
        await writeJSON(filename, events);
        found = true;
        break;
      }
    }

    if (!found) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
```

---

## 🎨 Frontend Implementation

### **API Client** (`src/lib/api/client.js`)
```javascript
const API_BASE = 'http://localhost:3001/api';

function getAuthToken() {
  return localStorage.getItem('surge_auth_token');
}

function authHeaders() {
  const token = getAuthToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...options.headers
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

// Auth
export const auth = {
  login: (username, password) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),

  logout: () =>
    apiRequest('/auth/logout', { method: 'POST' }),

  getSession: () =>
    apiRequest('/auth/session')
};

// Events
export const events = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return apiRequest(`/events?${params}`);
  },

  getById: (id) =>
    apiRequest(`/events/${id}`),

  create: (event) =>
    apiRequest('/events', {
      method: 'POST',
      body: JSON.stringify(event)
    }),

  update: (id, event) =>
    apiRequest(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(event)
    }),

  delete: (id) =>
    apiRequest(`/events/${id}`, { method: 'DELETE' })
};

// Config
export const config = {
  get: () => apiRequest('/config'),

  update: (config) =>
    apiRequest('/config', {
      method: 'PUT',
      body: JSON.stringify(config)
    })
};

// Missions
export const missions = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return apiRequest(`/missions?${params}`);
  },

  getById: (id) =>
    apiRequest(`/missions/${id}`),

  create: (mission) =>
    apiRequest('/missions', {
      method: 'POST',
      body: JSON.stringify(mission)
    }),

  update: (id, mission) =>
    apiRequest(`/missions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(mission)
    }),

  delete: (id) =>
    apiRequest(`/missions/${id}`, { method: 'DELETE' })
};

// Users
export const users = {
  getAll: () => apiRequest('/users'),

  getById: (id) => apiRequest(`/users/${id}`),

  create: (user) =>
    apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(user)
    }),

  update: (id, user) =>
    apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user)
    }),

  delete: (id) =>
    apiRequest(`/users/${id}`, { method: 'DELETE' })
};
```

---

## 📋 Next Steps

1. ✅ Review API design
2. ✅ Create backend folder structure
3. ✅ Implement authentication system
4. ✅ Build CRUD endpoints
5. ✅ Create admin UI components
6. ✅ Build API documentation page
7. ✅ Test all endpoints
8. ✅ Deploy backend server

**Ready to start implementation?** 🚀

# The Surge - Backend API Server

REST API server for managing events, configurations, missions, and users in The Surge game.

## 🚀 Quick Start

### Installation

```powershell
cd backend
npm install
```

### Initialize Data

Create default data files and admin user:

```powershell
npm run init
```

This creates:
- **Default admin user**: `admin` / `admin123` ⚠️ **Change this password!**
- Empty event files (poi, dynamic, mission)
- Empty missions file
- Default configuration

### Start Server

```powershell
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

Server runs on **http://localhost:3001**

---

## 📡 API Endpoints

### Health Check
```
GET /api/health
```

### Authentication
```
POST /api/auth/login          # Login and get JWT token
POST /api/auth/logout         # Logout (requires auth)
GET  /api/auth/session        # Verify session (requires auth)
```

### Users (Admin Only)
```
GET    /api/users             # Get all users
GET    /api/users/:id         # Get user by ID
POST   /api/users             # Create user
PUT    /api/users/:id         # Update user
DELETE /api/users/:id         # Delete user
```

### Events (Editor/Admin)
```
GET    /api/events            # Get all events (public)
GET    /api/events/:id        # Get event by ID (public)
POST   /api/events            # Create event (requires auth)
PUT    /api/events/:id        # Update event (requires auth)
DELETE /api/events/:id        # Delete event (requires auth)
```

**Query Parameters:**
- `type` - Filter by type (comma-separated tags)
- `tags` - Filter by tags (comma-separated)
- `triggerType` - Filter by trigger type (poi_action, dynamic, etc.)

### Config (Editor/Admin)
```
GET  /api/config              # Get configuration (public)
PUT  /api/config              # Update config (requires auth)
POST /api/config/reset        # Reset to defaults (admin only)
```

### Missions (Editor/Admin)
```
GET    /api/missions          # Get all missions (public)
GET    /api/missions/:id      # Get mission by ID (public)
POST   /api/missions          # Create mission (requires auth)
PUT    /api/missions/:id      # Update mission (requires auth)
DELETE /api/missions/:id      # Delete mission (requires auth)
```

**Query Parameters:**
- `type` - Filter by type (salvage, exploration, combat)
- `tier` - Filter by tier (lowRisk, mediumRisk, highRisk, deadly)

---

## 🔐 Authentication

The API uses **JWT (JSON Web Tokens)** for authentication.

### Login Flow

1. **POST /api/auth/login** with username and password
2. Receive JWT token in response
3. Include token in `Authorization` header for protected routes:
   ```
   Authorization: Bearer <your-token-here>
   ```

### User Roles

- **admin** - Full access (manage users, events, config, missions)
- **editor** - Can create/edit events, config, missions (cannot manage users)
- **viewer** - Read-only access

---

## 📁 Data Storage

All data is stored in JSON files in `backend/data/`:

```
backend/data/
├── users.json              # User accounts
├── config.json             # System configuration
├── events_poi.json         # POI-based events
├── events_dynamic.json     # Dynamic/random events
├── events_mission.json     # Mission-specific events
└── missions.json           # Mission definitions
```

**Backups:** Before any modification, files are backed up to `*.json.backup`

---

## 🔧 Configuration

### Environment Variables (`.env`)

```env
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

⚠️ **IMPORTANT:** Change `JWT_SECRET` before deploying to production!

---

## 📝 Example API Usage

### Login
```javascript
const response = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'admin',
    password: 'admin123'
  })
});

const { token, user } = await response.json();
localStorage.setItem('token', token);
```

### Get Events
```javascript
const response = await fetch('http://localhost:3001/api/events?type=mining,hazard');
const { events } = await response.json();
```

### Create Event (Authenticated)
```javascript
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:3001/api/events', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    id: 'my_custom_event',
    version: '1.0',
    metadata: { tags: ['custom'] },
    trigger: { type: 'dynamic', weight: 20 },
    scenario: { /* ... */ },
    challenge: { /* ... */ },
    resolutions: [ /* ... */ ]
  })
});

const { event } = await response.json();
```

---

## 🛡️ Security Notes

1. **Change default admin password immediately**
2. **Use strong JWT_SECRET in production**
3. **Enable HTTPS in production**
4. **Implement rate limiting for production**
5. **Regularly backup data files**

---

## 🐛 Troubleshooting

### Port 3001 already in use
```powershell
# Find process using port 3001
netstat -ano | findstr :3001

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Data files not found
```powershell
# Re-initialize data files
npm run init
```

### JWT errors
- Ensure `.env` file exists with `JWT_SECRET`
- Check token is not expired (default 24h)
- Verify `Authorization: Bearer <token>` header format

---

## 📊 Project Structure

```
backend/
├── data/               # JSON data storage
├── middleware/
│   └── auth.js        # JWT authentication
├── routes/
│   ├── auth.js        # Authentication endpoints
│   ├── users.js       # User CRUD
│   ├── events.js      # Event CRUD
│   ├── config.js      # Config management
│   └── missions.js    # Mission CRUD
├── scripts/
│   └── initData.js    # Data initialization
├── utils/
│   ├── fileHandler.js # JSON file I/O
│   └── validation.js  # Input validation
├── .env               # Environment variables
├── .gitignore
├── package.json
├── README.md
└── server.js          # Main server file
```

---

## 🚀 Next Steps

1. ✅ Backend server running
2. Build frontend admin panel
3. Create API documentation page
4. Implement event/config/mission editors
5. Add user management UI
6. Deploy to production

---

**Documentation:** See `BACKEND_API_DESIGN.md` for complete API specification

**Support:** Report issues to the dev team 🚀

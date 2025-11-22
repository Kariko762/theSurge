# Admin Panel Quick Start Guide

## 🎯 What's Working Now

Your admin panel is **functional** with basic infrastructure in place!

### ✅ Completed Components

1. **Backend API Server** (Port 3001)
   - Full REST API with JWT authentication
   - User management (admin/editor/viewer roles)
   - CRUD endpoints for events, missions, config
   - Running at: http://localhost:3001

2. **Frontend API Client** (`src/lib/api/client.js`)
   - Methods for all backend endpoints
   - JWT token management (localStorage)
   - Automatic authentication handling
   - Error handling with auto-redirect on 401

3. **Login Page** (http://localhost:5173/login)
   - Username/password form
   - JWT token storage
   - Beautiful terminal-themed UI
   - Default credentials: `admin` / `admin123`

4. **Admin Panel** (http://localhost:5173/admin)
   - Protected route (requires login)
   - Tab navigation (Events, Missions, Config, Users, API Docs)
   - Role-based UI (admin sees Users tab, editors don't)
   - Session verification on load

5. **Placeholder Editors**
   - EventEditor - Shows event count, loads from API
   - ConfigEditor - Loads config from API
   - MissionEditor - Shows mission count, loads from API
   - UserManagement - Shows user list with roles
   - APIDocumentation - Full endpoint reference

---

## 🚀 How to Use

### 1. Start Backend (Keep Running)
```powershell
cd backend
npm start
```

Backend runs on **http://localhost:3001**

### 2. Start Frontend (Separate Terminal)
```powershell
# From project root
npm run dev
```

Frontend runs on **http://localhost:5173**

### 3. Access Admin Panel

**Option A: Direct URL**
- Navigate to: http://localhost:5173/login
- Login with: `admin` / `admin123`
- You'll be redirected to: http://localhost:5173/admin

**Option B: From Game**
- Game still works at: http://localhost:5173
- Admin panel is separate (won't interfere with game)

### 4. Test Authentication

1. **Login**: http://localhost:5173/login
2. **Admin Panel**: http://localhost:5173/admin (auto-redirects to login if not authenticated)
3. **Logout**: Click "LOGOUT" button in admin panel header
4. **Auto-Redirect**: If JWT expires or is invalid, auto-redirect to /login

---

## 🔍 What Each Tab Shows (Currently)

### Events Tab
- Loads all events from backend
- Shows event count
- **Coming Soon**: Full visual editor with form inputs, JSON preview

### Missions Tab
- Loads all missions from backend
- Shows mission count
- **Coming Soon**: Visual flowchart editor for mission steps

### Config Tab
- Loads current configuration
- Shows if config is loaded
- **Coming Soon**: Sliders/inputs for difficulty, loot rates, risk weights

### Users Tab (Admin Only)
- Lists all users with their roles
- Highlights current user
- **Coming Soon**: Create/edit/delete users, change passwords/roles

### API Docs Tab
- Complete endpoint reference
- Shows all methods, paths, descriptions
- Auth requirements highlighted
- **Coming Soon**: Interactive testing (Swagger-style)

---

## 🎨 UI Features

### Design System
- Terminal/cyberpunk aesthetic matching the game
- Cyan (#00ffff) primary color with glow effects
- Dark background with transparency layers
- Consistent with existing game UI

### Authentication Flow
1. User visits `/admin` without token → redirect to `/login`
2. User logs in → JWT saved to localStorage
3. User accesses `/admin` → token verified with backend
4. Token expires/invalid → auto-logout and redirect to `/login`

### Role-Based Access
- **Admin**: Sees all tabs (Events, Missions, Config, Users, API Docs)
- **Editor**: Sees Events, Missions, Config, API Docs (no Users tab)
- **Viewer**: Read-only access to all data

---

## 📁 File Structure

```
src/
├── lib/
│   └── api/
│       └── client.js              ← API client with all endpoints
├── components/
│   └── admin/
│       ├── Login.jsx              ← Login page
│       ├── AdminPanel.jsx         ← Main admin layout
│       ├── EventEditor.jsx        ← Event management (placeholder)
│       ├── ConfigEditor.jsx       ← Config management (placeholder)
│       ├── MissionEditor.jsx      ← Mission management (placeholder)
│       ├── UserManagement.jsx     ← User CRUD (placeholder)
│       └── APIDocumentation.jsx   ← API reference (functional)
└── App.jsx                        ← Routes (/login, /admin, /)
```

---

## 🔐 Security Notes

### Current Setup
- JWT tokens stored in **localStorage** (key: `surge_auth_token`)
- User data stored in **localStorage** (key: `surge_user`)
- Token expiration: **24 hours**
- Auto-logout on 401 responses

### Default Credentials
⚠️ **IMPORTANT**: Change the default admin password!

```javascript
// Default user created by npm run init:
username: "admin"
password: "admin123"
```

**To Change Password:**
1. Login as admin
2. Go to Users tab (when implemented)
3. Edit admin user → change password
4. Or manually edit `backend/data/users.json` (password must be bcrypt hashed)

---

## 🛠️ Next Steps to Build

### Priority 1: Event Editor (Full CRUD)
- **Create Events**: Form with all fields (id, metadata, trigger, scenario, challenge, resolutions)
- **Edit Events**: Load event, modify, save
- **Delete Events**: Confirm + delete
- **JSON Preview**: Live JSON view of event being edited
- **Validation**: Real-time validation feedback

### Priority 2: Config Editor (Visual Controls)
- **Difficulty Sliders**: Adjust difficulty curves for different game phases
- **Loot Tables**: Edit drop rates, rarity weights
- **Risk Weights**: Adjust event probability based on risk level
- **Scheduler Settings**: Configure event check intervals (2s-60s)
- **Reset Button**: Reset to defaults with confirmation

### Priority 3: Mission Editor (Visual Flowchart)
- **Mission Steps**: Visual flowchart of step chains
- **Outcomes**: Define success/failure paths
- **Rewards**: Configure loot, reputation, unlocks
- **Validation**: Ensure no broken chains or dead ends

### Priority 4: User Management (Full CRUD)
- **Create User**: Form with username, password, role
- **Edit User**: Change password, update role
- **Delete User**: Confirm + delete (prevent self-deletion)
- **Password Security**: bcrypt hashing, strength requirements

### Priority 5: API Testing Interface
- **Interactive Docs**: Try-it-out functionality like Swagger
- **Request Builder**: Build requests with params/body
- **Response Viewer**: Pretty-print JSON responses
- **Auth Testing**: Test with/without tokens

---

## 🧪 Testing Checklist

### Authentication
- [ ] Login with correct credentials → success
- [ ] Login with wrong credentials → error message
- [ ] Access /admin without token → redirect to /login
- [ ] Access /admin with valid token → show admin panel
- [ ] Logout → clear token, redirect to /login
- [ ] Token expiration → auto-logout

### API Calls
- [ ] Load events → shows count
- [ ] Load missions → shows count
- [ ] Load config → shows loaded status
- [ ] Load users (admin only) → shows user list

### Role-Based Access
- [ ] Admin user → sees Users tab
- [ ] Editor user → no Users tab
- [ ] Viewer user → read-only (no create/edit/delete buttons when implemented)

---

## 💡 Tips

### Development Workflow
1. Keep backend running in one terminal: `cd backend && npm start`
2. Keep frontend running in another: `npm run dev`
3. Changes to frontend → hot-reload (instant)
4. Changes to backend → restart backend server

### Debugging
- **Network Tab**: Check API calls in browser DevTools
- **Console**: API client logs errors
- **Backend Logs**: Server logs all requests in terminal
- **localStorage**: Check `surge_auth_token` and `surge_user` keys

### Common Issues
- **CORS Error**: Make sure backend is running on port 3001
- **401 Unauthorized**: Token expired, logout and login again
- **Network Error**: Backend not running or wrong port
- **Redirect Loop**: Clear localStorage and try again

---

## 🎮 Game vs Admin Panel

### Game (http://localhost:5173)
- Main game interface (unchanged)
- LoginFrame → HomebaseTerminal → ShipCommandConsole
- No impact from admin panel

### Admin Panel (http://localhost:5173/admin)
- Separate React Router routes
- Only accessible via direct URL or navigation
- Doesn't interfere with game state

**Both work simultaneously!** You can:
1. Play the game in one browser tab
2. Edit events in another tab
3. Changes to events/config will affect game on next load/reload

---

## 📚 Documentation

- **Backend API**: `backend/README.md`
- **Event Engine**: `EVENT_ENGINE_DESIGN.md`
- **Backend Design**: `BACKEND_API_DESIGN.md`

---

**Status**: Basic infrastructure complete! Ready to build full editors. 🚀

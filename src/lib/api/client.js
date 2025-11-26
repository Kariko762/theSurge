/**
 * API Client for The Surge Backend
 * Handles all HTTP requests to the backend API server
 */

const API_BASE_URL = 'http://localhost:3002/api';

// ============================================
// Token Management
// ============================================

export const getToken = () => {
  return localStorage.getItem('surge_auth_token');
};

export const setToken = (token) => {
  localStorage.setItem('surge_auth_token', token);
};

export const removeToken = () => {
  localStorage.removeItem('surge_auth_token');
};

export const getUser = () => {
  const userStr = localStorage.getItem('surge_user');
  return userStr ? JSON.parse(userStr) : null;
};

export const setUser = (user) => {
  localStorage.setItem('surge_user', JSON.stringify(user));
};

export const removeUser = () => {
  localStorage.removeItem('surge_user');
};

// ============================================
// HTTP Request Helper
// ============================================

const request = async (endpoint, options = {}) => {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token && !options.skipAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Handle non-JSON responses (like 204 No Content)
    const contentType = response.headers.get('content-type');
    const data = contentType && contentType.includes('application/json')
      ? await response.json()
      : null;

    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401) {
        removeToken();
        removeUser();
        window.location.href = '/login';
      }
      
      throw {
        status: response.status,
        message: data?.error || data?.message || 'Request failed',
        data
      };
    }

    return data;
  } catch (error) {
    // Network errors or JSON parsing errors
    if (error.status) {
      throw error;
    }
    throw {
      status: 0,
      message: 'Network error - unable to reach server',
      data: null
    };
  }
};

// ============================================
// Authentication API
// ============================================

export const auth = {
  login: async (username, password) => {
    const data = await request('/auth/login', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ username, password })
    });
    
    if (data.token) {
      setToken(data.token);
      setUser(data.user);
    }
    
    return data;
  },

  logout: async () => {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      removeToken();
      removeUser();
    }
  },

  session: async () => {
    const data = await request('/auth/session');
    if (data.user) {
      setUser(data.user);
    }
    return data;
  },

  isAuthenticated: () => {
    return !!getToken();
  },

  hasRole: (role) => {
    const user = getUser();
    if (!user) return false;
    
    const roles = {
      viewer: 1,
      editor: 2,
      admin: 3
    };
    
    return roles[user.role] >= roles[role];
  }
};

// ============================================
// Users API (Admin Only)
// ============================================

export const users = {
  getAll: async () => {
    return await request('/users');
  },

  getById: async (id) => {
    return await request(`/users/${id}`);
  },

  create: async (userData) => {
    return await request('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  update: async (id, userData) => {
    return await request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  },

  delete: async (id) => {
    return await request(`/users/${id}`, {
      method: 'DELETE'
    });
  }
};

// ============================================
// Events API
// ============================================

export const events = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.tags) params.append('tags', filters.tags);
    if (filters.triggerType) params.append('triggerType', filters.triggerType);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return await request(`/events${query}`);
  },

  getById: async (id) => {
    return await request(`/events/${id}`);
  },

  create: async (eventData) => {
    return await request('/events', {
      method: 'POST',
      body: JSON.stringify(eventData)
    });
  },

  update: async (id, eventData) => {
    return await request(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(eventData)
    });
  },

  delete: async (id) => {
    return await request(`/events/${id}`, {
      method: 'DELETE'
    });
  }
};

// ============================================
// Config API
// ============================================

export const config = {
  get: async () => {
    return await request('/config');
  },

  update: async (configData) => {
    return await request('/config', {
      method: 'PUT',
      body: JSON.stringify(configData)
    });
  },

  reset: async () => {
    return await request('/config/reset', {
      method: 'POST'
    });
  },

  getEventScheduler: async () => {
    return await request('/config/event-scheduler');
  },

  updateEventScheduler: async (schedulerConfig) => {
    return await request('/config/event-scheduler', {
      method: 'PUT',
      body: JSON.stringify(schedulerConfig)
    });
  }
};

// ============================================
// Missions API
// ============================================

export const missions = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.tier) params.append('tier', filters.tier);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return await request(`/missions${query}`);
  },

  getById: async (id) => {
    return await request(`/missions/${id}`);
  },

  create: async (missionData) => {
    return await request('/missions', {
      method: 'POST',
      body: JSON.stringify(missionData)
    });
  },

  update: async (id, missionData) => {
    return await request(`/missions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(missionData)
    });
  },

  delete: async (id) => {
    return await request(`/missions/${id}`, {
      method: 'DELETE'
    });
  }
};

// ============================================
// Ships API
// ============================================

export const ships = {
  getAll: async () => {
    return await request('/ships');
  },

  getById: async (id) => {
    return await request(`/ships/${id}`);
  },

  create: async (shipData) => {
    return await request('/ships', {
      method: 'POST',
      body: JSON.stringify(shipData)
    });
  },

  update: async (id, shipData) => {
    return await request(`/ships/${id}`, {
      method: 'PUT',
      body: JSON.stringify(shipData)
    });
  },

  delete: async (id) => {
    return await request(`/ships/${id}`, {
      method: 'DELETE'
    });
  }
};

// ============================================
// Ship Tiers API
// ============================================

export const shipTiers = {
  getAll: async () => {
    return await request('/ship-tiers');
  },

  getById: async (id) => {
    return await request(`/ship-tiers/${id}`);
  },

  create: async (tierData) => {
    return await request('/ship-tiers', {
      method: 'POST',
      body: JSON.stringify(tierData)
    });
  },

  update: async (id, tierData) => {
    return await request(`/ship-tiers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tierData)
    });
  },

  delete: async (id) => {
    return await request(`/ship-tiers/${id}`, {
      method: 'DELETE'
    });
  }
};

// ============================================
// Factions API
// ============================================

export const factions = {
  getAll: async () => {
    return await request('/factions');
  },

  getById: async (id) => {
    return await request(`/factions/${id}`);
  },

  create: async (factionData) => {
    return await request('/factions', {
      method: 'POST',
      body: JSON.stringify(factionData)
    });
  },

  update: async (id, factionData) => {
    return await request(`/factions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(factionData)
    });
  },

  delete: async (id) => {
    return await request(`/factions/${id}`, {
      method: 'DELETE'
    });
  }
};

// ============================================
// Items API
// ============================================

export const items = {
  getAll: async (category = null) => {
    const query = category ? `?category=${category}` : '';
    return await request(`/items${query}`);
  },

  getCore: async () => {
    return await request('/items/core');
  },

  updateCore: async (coreData) => {
    return await request('/items/core', {
      method: 'PUT',
      body: JSON.stringify(coreData)
    });
  },

  getById: async (category, id) => {
    return await request(`/items/${category}/${id}`);
  },

  create: async (category, itemData) => {
    return await request(`/items/${category}`, {
      method: 'POST',
      body: JSON.stringify(itemData)
    });
  },

  update: async (category, id, itemData) => {
    return await request(`/items/${category}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(itemData)
    });
  },

  delete: async (category, id) => {
    return await request(`/items/${category}/${id}`, {
      method: 'DELETE'
    });
  }
};

// ============================================
// Narratives API
// ============================================

export const narratives = {
  getAll: async () => {
    return await request('/narratives');
  },

  getById: async (poolId) => {
    return await request(`/narratives/${poolId}`);
  },

  create: async (poolData) => {
    return await request('/narratives', {
      method: 'POST',
      body: JSON.stringify(poolData)
    });
  },

  update: async (poolId, poolData) => {
    return await request(`/narratives/${poolId}`, {
      method: 'PUT',
      body: JSON.stringify(poolData)
    });
  },

  delete: async (poolId) => {
    return await request(`/narratives/${poolId}`, {
      method: 'DELETE'
    });
  }
};

// ============================================
// AI Cores API
// ============================================

export const aiCores = {
  getAll: async () => {
    return await request('/ai-cores');
  },

  getById: async (id) => {
    return await request(`/ai-cores/${id}`);
  },

  create: async (aiCoreData) => {
    return await request('/ai-cores', {
      method: 'POST',
      body: JSON.stringify(aiCoreData)
    });
  },

  update: async (id, aiCoreData) => {
    return await request(`/ai-cores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(aiCoreData)
    });
  },

  delete: async (id) => {
    return await request(`/ai-cores/${id}`, {
      method: 'DELETE'
    });
  }
};

// ============================================
// Health Check
// ============================================

export const health = {
  check: async () => {
    return await request('/health', { skipAuth: true });
  }
};

// Default export with all API modules
export default {
  auth,
  users,
  events,
  config,
  missions,
  ships,
  shipTiers,
  factions,
  items,
  narratives,
  aiCores,
  health,
  getToken,
  setToken,
  removeToken,
  getUser,
  setUser,
  removeUser
};

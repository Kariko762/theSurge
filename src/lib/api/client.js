/**
 * API Client for The Surge Backend
 * Handles all HTTP requests to the backend API server
 */

const API_BASE_URL = 'http://localhost:3001/api';

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
  health,
  getToken,
  setToken,
  removeToken,
  getUser,
  setUser,
  removeUser
};

/**
 * Validate event structure
 */
function validateEvent(event) {
  const errors = [];

  // Required fields
  if (!event.id) errors.push('Missing required field: id');
  if (!event.version) errors.push('Missing required field: version');
  if (!event.metadata) errors.push('Missing required field: metadata');
  if (!event.trigger) errors.push('Missing required field: trigger');
  if (!event.scenario) errors.push('Missing required field: scenario');
  if (!event.challenge) errors.push('Missing required field: challenge');
  if (!event.resolutions || !Array.isArray(event.resolutions)) {
    errors.push('Missing or invalid field: resolutions (must be array)');
  }

  // Validate trigger
  if (event.trigger) {
    if (!event.trigger.type) errors.push('Missing trigger.type');
    if (typeof event.trigger.weight !== 'number') {
      errors.push('Missing or invalid trigger.weight (must be number)');
    }
  }

  // Validate scenario
  if (event.scenario) {
    if (!event.scenario.name) errors.push('Missing scenario.name');
    if (!event.scenario.terminal) {
      errors.push('Missing scenario.terminal (required for terminal output)');
    }
  }

  // Validate challenge
  if (event.challenge) {
    if (!event.challenge.type) errors.push('Missing challenge.type');
    const validTypes = ['dre_roll', 'player_choice', 'automatic', 'hybrid'];
    if (!validTypes.includes(event.challenge.type)) {
      errors.push(`Invalid challenge.type: ${event.challenge.type}`);
    }
  }

  // Validate resolutions
  if (event.resolutions && Array.isArray(event.resolutions)) {
    event.resolutions.forEach((res, idx) => {
      if (!res.range || !Array.isArray(res.range) || res.range.length !== 2) {
        errors.push(`Resolution ${idx}: invalid range (must be [min, max])`);
      }
      if (!res.severity) {
        errors.push(`Resolution ${idx}: missing severity`);
      }
      if (!res.outcomes) {
        errors.push(`Resolution ${idx}: missing outcomes`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate mission structure
 */
function validateMission(mission) {
  const errors = [];

  if (!mission.id) errors.push('Missing required field: id');
  if (!mission.type) errors.push('Missing required field: type');
  if (!mission.tier) errors.push('Missing required field: tier');
  if (!mission.name) errors.push('Missing required field: name');
  if (!mission.steps || !Array.isArray(mission.steps)) {
    errors.push('Missing or invalid field: steps (must be array)');
  }

  // Validate steps
  if (mission.steps && Array.isArray(mission.steps)) {
    mission.steps.forEach((step, idx) => {
      if (!step.id) errors.push(`Step ${idx}: missing id`);
      if (!step.objective) errors.push(`Step ${idx}: missing objective`);
      if (!step.triggerEvent) errors.push(`Step ${idx}: missing triggerEvent`);
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate user structure
 */
function validateUser(user, isUpdate = false) {
  const errors = [];

  if (!isUpdate) {
    if (!user.username) errors.push('Missing required field: username');
    if (!user.password) errors.push('Missing required field: password');
  }

  if (user.username && !/^[a-zA-Z0-9_-]{3,20}$/.test(user.username)) {
    errors.push('Invalid username (3-20 chars, alphanumeric, _, -)');
  }

  if (user.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
    errors.push('Invalid email format');
  }

  if (user.password && user.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  if (user.role && !['admin', 'editor', 'viewer'].includes(user.role)) {
    errors.push('Invalid role (must be: admin, editor, or viewer)');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate config structure
 */
function validateConfig(config) {
  const errors = [];

  // Basic structure check
  if (!config || typeof config !== 'object') {
    errors.push('Config must be an object');
    return { valid: false, errors };
  }

  // All values should be numbers or objects containing numbers
  const validateNumbers = (obj, path = '') => {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (typeof value === 'object' && value !== null) {
        validateNumbers(value, currentPath);
      } else if (typeof value !== 'number') {
        errors.push(`${currentPath} must be a number, got ${typeof value}`);
      }
    }
  };

  validateNumbers(config);

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateEvent,
  validateMission,
  validateUser,
  validateConfig
};

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { readJSON, writeJSON } = require('../utils/fileHandler');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateUser } = require('../utils/validation');
const { v4: uuidv4 } = require('crypto');

// All user routes require admin role
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * GET /api/users
 * Get all users
 */
router.get('/', async (req, res) => {
  try {
    const users = await readJSON('users.json');

    // Remove password hashes from response
    const usersWithoutPasswords = users.map(({ passwordHash, ...user }) => user);

    res.json({
      success: true,
      users: usersWithoutPasswords,
      count: users.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/users/:id
 * Get single user by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const users = await readJSON('users.json');
    const user = users.find(u => u.id === req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const { passwordHash, ...userWithoutPassword } = user;

    res.json({
      success: true,
      user: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/users
 * Create new user
 */
router.post('/', async (req, res) => {
  try {
    const newUser = req.body;

    // Validate
    const validation = validateUser(newUser);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors
      });
    }

    // Load users
    const users = await readJSON('users.json');

    // Check for duplicate username
    if (users.find(u => u.username === newUser.username)) {
      return res.status(400).json({
        success: false,
        error: 'Username already exists'
      });
    }

    // Check for duplicate email
    if (newUser.email && users.find(u => u.email === newUser.email)) {
      return res.status(400).json({
        success: false,
        error: 'Email already exists'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(newUser.password, 10);

    // Create user object
    const user = {
      id: `user_${Date.now()}`,
      username: newUser.username,
      email: newUser.email || null,
      passwordHash,
      role: newUser.role || 'viewer',
      active: true,
      createdAt: new Date().toISOString(),
      lastLogin: null
    };

    users.push(user);
    await writeJSON('users.json', users);

    const { passwordHash: _, ...userWithoutPassword } = user;

    res.status(201).json({
      success: true,
      user: userWithoutPassword,
      message: 'User created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/users/:id
 * Update user
 */
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body;

    // Validate
    const validation = validateUser(updates, true);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors
      });
    }

    // Load users
    const users = await readJSON('users.json');
    const userIndex = users.findIndex(u => u.id === req.params.id);

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Prevent self-demotion/deactivation
    if (req.params.id === req.user.userId) {
      if (updates.role && updates.role !== 'admin') {
        return res.status(400).json({
          success: false,
          error: 'Cannot change your own admin role'
        });
      }
      if (updates.active === false) {
        return res.status(400).json({
          success: false,
          error: 'Cannot deactivate your own account'
        });
      }
    }

    // Update fields
    const user = users[userIndex];
    
    if (updates.email) user.email = updates.email;
    if (updates.role) user.role = updates.role;
    if (typeof updates.active === 'boolean') user.active = updates.active;
    
    // Update password if provided
    if (updates.password) {
      user.passwordHash = await bcrypt.hash(updates.password, 10);
    }

    await writeJSON('users.json', users);

    const { passwordHash, ...userWithoutPassword } = user;

    res.json({
      success: true,
      user: userWithoutPassword,
      message: 'User updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/users/:id
 * Delete user
 */
router.delete('/:id', async (req, res) => {
  try {
    // Prevent self-deletion
    if (req.params.id === req.user.userId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account'
      });
    }

    const users = await readJSON('users.json');
    const userIndex = users.findIndex(u => u.id === req.params.id);

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    users.splice(userIndex, 1);
    await writeJSON('users.json', users);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

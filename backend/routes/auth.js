const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { readJSON, writeJSON } = require('../utils/fileHandler');
const { generateToken, authenticateToken } = require('../middleware/auth');

/**
 * POST /api/auth/login
 * Login user and receive JWT token
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    // Load users
    const users = await readJSON('users.json');
    const user = users.find(u => u.username === username);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    // Check if user is active
    if (!user.active) {
      return res.status(403).json({
        success: false,
        error: 'Account is disabled'
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    // Update last login
    user.lastLogin = new Date().toISOString();
    await writeJSON('users.json', users);

    // Generate token
    const token = generateToken(user);

    // Return success with token and user info (without password hash)
    const { passwordHash, ...userWithoutPassword } = user;

    res.json({
      success: true,
      token,
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
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 */
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * GET /api/auth/session
 * Verify current session and get user info
 */
router.get('/session', authenticateToken, async (req, res) => {
  try {
    // Load fresh user data
    const users = await readJSON('users.json');
    const user = users.find(u => u.id === req.user.userId);

    if (!user || !user.active) {
      return res.status(403).json({
        success: false,
        error: 'Session invalid or account disabled'
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

module.exports = router;

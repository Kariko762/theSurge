const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');

const DATA_DIR = path.join(__dirname, '../data');
const IMAGES_DIR = path.join(__dirname, '../public/images');
const IMAGE_POOLS_FILE = path.join(DATA_DIR, 'image_pools.json');

// Ensure directories exist
async function ensureDirs() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(IMAGES_DIR, { recursive: true });
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureDirs();
    cb(null, IMAGES_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `img-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  }
});

// Get all image pools
router.get('/', async (req, res) => {
  try {
    await ensureDirs();
    
    let pools = [];
    try {
      const data = await fs.readFile(IMAGE_POOLS_FILE, 'utf8');
      pools = JSON.parse(data);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
      // File doesn't exist yet, return empty array
    }
    
    res.json({ success: true, pools });
  } catch (error) {
    console.error('Error reading image pools:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new pool
router.post('/', async (req, res) => {
  try {
    await ensureDirs();
    
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: 'Pool name is required' });
    }
    
    let pools = [];
    try {
      const data = await fs.readFile(IMAGE_POOLS_FILE, 'utf8');
      pools = JSON.parse(data);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
    
    const newPool = {
      id: name.toLowerCase().replace(/\s+/g, '_'),
      name,
      description: description || '',
      images: [],
      created: new Date().toISOString()
    };
    
    pools.push(newPool);
    await fs.writeFile(IMAGE_POOLS_FILE, JSON.stringify(pools, null, 2));
    
    res.json({ success: true, pool: newPool });
  } catch (error) {
    console.error('Error creating pool:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Upload image to pool
router.post('/:poolId/upload', upload.single('image'), async (req, res) => {
  try {
    const { poolId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }
    
    const data = await fs.readFile(IMAGE_POOLS_FILE, 'utf8');
    const pools = JSON.parse(data);
    
    const poolIndex = pools.findIndex(p => p.id === poolId);
    if (poolIndex === -1) {
      // Delete uploaded file if pool not found
      await fs.unlink(req.file.path);
      return res.status(404).json({ success: false, message: 'Pool not found' });
    }
    
    const imageData = {
      id: `img_${Date.now()}`,
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: `/images/${req.file.filename}`,
      size: req.file.size,
      type: req.file.mimetype,
      uploaded: new Date().toISOString()
    };
    
    pools[poolIndex].images.push(imageData);
    await fs.writeFile(IMAGE_POOLS_FILE, JSON.stringify(pools, null, 2));
    
    res.json({ success: true, image: imageData });
  } catch (error) {
    console.error('Error uploading image:', error);
    // Try to clean up uploaded file
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkErr) {
        console.error('Error deleting uploaded file:', unlinkErr);
      }
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete image from pool
router.delete('/:poolId/images/:imageId', async (req, res) => {
  try {
    const { poolId, imageId } = req.params;
    
    const data = await fs.readFile(IMAGE_POOLS_FILE, 'utf8');
    const pools = JSON.parse(data);
    
    const poolIndex = pools.findIndex(p => p.id === poolId);
    if (poolIndex === -1) {
      return res.status(404).json({ success: false, message: 'Pool not found' });
    }
    
    const imageIndex = pools[poolIndex].images.findIndex(img => img.id === imageId);
    if (imageIndex === -1) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }
    
    const image = pools[poolIndex].images[imageIndex];
    
    // Delete physical file
    try {
      await fs.unlink(path.join(IMAGES_DIR, image.filename));
    } catch (err) {
      console.error('Error deleting image file:', err);
      // Continue anyway - remove from pool even if file deletion fails
    }
    
    pools[poolIndex].images.splice(imageIndex, 1);
    await fs.writeFile(IMAGE_POOLS_FILE, JSON.stringify(pools, null, 2));
    
    res.json({ success: true, message: 'Image deleted' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete pool
router.delete('/:poolId', async (req, res) => {
  try {
    const { poolId } = req.params;
    
    const data = await fs.readFile(IMAGE_POOLS_FILE, 'utf8');
    const pools = JSON.parse(data);
    
    const poolIndex = pools.findIndex(p => p.id === poolId);
    if (poolIndex === -1) {
      return res.status(404).json({ success: false, message: 'Pool not found' });
    }
    
    const pool = pools[poolIndex];
    
    // Delete all images in pool
    for (const image of pool.images) {
      try {
        await fs.unlink(path.join(IMAGES_DIR, image.filename));
      } catch (err) {
        console.error(`Error deleting image ${image.filename}:`, err);
      }
    }
    
    pools.splice(poolIndex, 1);
    await fs.writeFile(IMAGE_POOLS_FILE, JSON.stringify(pools, null, 2));
    
    res.json({ success: true, message: 'Pool deleted' });
  } catch (error) {
    console.error('Error deleting pool:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

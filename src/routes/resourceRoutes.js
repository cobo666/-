const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const { protect, authorize } = require('../middleware/authMiddleware'); // Import auth middleware

// POST /resources/upload - Protected route, only for 'uploader' or 'admin'
router.post('/upload', protect, authorize('uploader', 'admin'), resourceController.uploadResource);

// GET /resources/download/:id - Publicly accessible
router.get('/download/:id', resourceController.downloadResource);

// GET /resources - Get resources, can be filtered by category query param
// e.g., /resources?category=直播素材
router.get('/', resourceController.getResourcesByCategory); // Specific route first
router.get('/all', resourceController.getAllResources); // Route to get all resources

module.exports = router;

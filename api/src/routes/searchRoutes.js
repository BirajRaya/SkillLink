const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

router.get('/search', searchController.searchServices);
router.get('/service/:id', searchController.getServiceDetails);
router.get('/categories/recommend', searchController.getCategoryRecommendations);

module.exports = router;
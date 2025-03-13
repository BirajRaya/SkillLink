const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/reviews', authenticateToken, reviewController.createReview);
router.get('/service/:serviceId/reviews', reviewController.getServiceReviews);
router.get('/services/:serviceId/reviews/check', authenticateToken, reviewController.checkUserReview);
router.put('/reviews/:id', authenticateToken, reviewController.updateReview);
router.delete('/reviews/:id', authenticateToken, reviewController.deleteReview);

module.exports = router;
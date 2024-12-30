const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { seatSelectHandler, seatBookHandler, seatDashboardHandler, resetBookingHandler, } = require('../controllers/authController');
const router = express.Router();

router.post('/select', protect, seatSelectHandler);
router.post('/book', protect, seatBookHandler);
router.post('/dashboard', protect, seatDashboardHandler);
router.post('/reset-booking', protect, resetBookingHandler);

module.exports = router;

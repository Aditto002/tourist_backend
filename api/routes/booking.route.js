import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import { 
    createBooking,
    getUserBookings,
    cancelBooking
} from '../controllers/booking.controller.js';

const router = express.Router();

router.post('/create', verifyToken, createBooking);
router.get('/user-bookings', verifyToken, getUserBookings);
router.put('/cancel/:id', verifyToken, cancelBooking);

export default router;
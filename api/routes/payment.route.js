import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import { 
    initiatePayment,
    successPayment,
    failedPayment,
    cancelledPayment,
    ipnListener,
    getPaymentStatus,
    getBookingDetails
} from '../controllers/payment.controller.js';

const router = express.Router();

// Initiate payment for a booking
router.post('/initiate/:id', verifyToken, initiatePayment);

// Payment callback routes (from SSL Commerz)
router.post('/success', successPayment);
router.post('/fail', failedPayment);
router.post('/cancel', cancelledPayment);
router.post('/ipn', ipnListener);
router.get('/booking/:id', verifyToken, getBookingDetails);
// Get payment status
router.get('/status/:id', verifyToken, getPaymentStatus);

export default router;
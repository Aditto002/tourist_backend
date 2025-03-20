import express from 'express';
import { 
    adminSignin, 
    createPlace, 
    updatePlace, 
    deletePlace,
    updateBookingStatus,
    getAllBookings,
    getAllUsers,
    updateUser,
    deleteUser,
    getDashboardStats,
    Adminsignout
} from '../controllers/admin.controllers.js';
import { verifyAdmin } from '../utils/verifyAdmin.js';

const router = express.Router();

// Admin Auth
router.post('/signin', adminSignin);
router.get('/adminsignout', Adminsignout);

// Place Management Routes
router.post('/place/create', verifyAdmin, createPlace);
router.put('/place/update/:id', verifyAdmin, updatePlace);
router.delete('/place/delete/:id', verifyAdmin, deletePlace);
router.get('/dashboard-stats', verifyAdmin, getDashboardStats);

// Booking Management Routes
// router.get('/bookings', verifyAdmin, getAllBookings);
// router.put('/booking/status/:id', verifyAdmin, updateBookingStatus);
router.get('/bookings', verifyAdmin, getAllBookings);
router.put('/booking/status/:id', verifyAdmin, updateBookingStatus);

// User Management Routes
router.get('/users', verifyAdmin, getAllUsers);
router.put('/user/update/:id', verifyAdmin, updateUser);
router.delete('/user/delete/:id', verifyAdmin, deleteUser);

export default router;

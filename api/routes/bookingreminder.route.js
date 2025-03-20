import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import {
    createReminder,
    getUserReminders,
    deleteReminder,
    updateReminder
} from '../controllers/bookingreminder.controller.js';

const router = express.Router();

router.post('/create', verifyToken, createReminder);
router.get('/user-reminders', verifyToken, getUserReminders);
router.delete('/delete/:id', verifyToken, deleteReminder);
router.put('/update/:id', verifyToken, updateReminder);

export default router;
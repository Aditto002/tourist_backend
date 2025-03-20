import { SendEmailUtils } from '../utils/sendEmail.js';
import Reminder from '../models/bokingreminder.model.js';
import User from '../models/usermodel.js';

export const createReminder = async (req, res) => {
    try {
        const { userId, reminderDate, message, email } = req.body;

        if (!reminderDate || !message || !email) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide all required fields'
            });
        }

        const scheduledDate = new Date(reminderDate);
        if (scheduledDate < new Date()) {
            return res.status(400).json({
                status: 'error',
                message: 'Reminder date must be in the future'
            });
        }

        const reminder = await Reminder.create({
            userId,
            email,
            reminderDate: scheduledDate,
            message,
            status: 'pending'
        });

        // Calculate delay until the reminder time
        const now = new Date();
        const delay = scheduledDate.getTime() - now.getTime();

        // Schedule the reminder
        setTimeout(async () => {
            try {
                await SendEmailUtils(
                    email,
                    message,
                    'Scheduled Reminder'
                );

                // Update reminder status
                await Reminder.findByIdAndUpdate(reminder._id, {
                    status: 'sent',
                    sentAt: new Date()
                });
            } catch (error) {
                console.error('Error sending reminder:', error);
                await Reminder.findByIdAndUpdate(reminder._id, {
                    status: 'failed',
                    error: error.message
                });
            }
        }, delay);

        res.status(201).json({
            status: 'success',
            message: 'Reminder scheduled successfully',
            data: reminder
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 'error',
            message: 'Error creating reminder'
        });
    }
};

export const getUserReminders = async (req, res) => {
    try {
        const reminders = await Reminder.find({ userId: req.user.id })
            .sort('-reminderDate');

        res.status(200).json({
            status: 'success',
            data: reminders
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 'error',
            message: 'Error fetching reminders'
        });
    }
};
export const updateReminder = async (req, res) => {
    try {
        const { message, reminderDate } = req.body;
        const reminder = await Reminder.findById(req.params.id);
        
        if (!reminder) {
            return res.status(404).json({
                status: 'error',
                message: 'Reminder not found'
            });
        }

        if (reminder.userId.toString() !== req.user.id) {
            return res.status(403).json({
                status: 'error',
                message: 'You can only update your own reminders'
            });
        }

        const scheduledDate = new Date(reminderDate);
        if (scheduledDate < new Date()) {
            return res.status(400).json({
                status: 'error',
                message: 'Reminder date must be in the future'
            });
        }

        const updatedReminder = await Reminder.findByIdAndUpdate(
            req.params.id,
            {
                message,
                reminderDate: scheduledDate,
                status: 'pending' // Reset status since it's a new reminder time
            },
            { new: true }
        );

        res.status(200).json({
            status: 'success',
            data: updatedReminder
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 'error',
            message: 'Error updating reminder'
        });
    }
};

export const deleteReminder = async (req, res) => {
    try {
        const reminder = await Reminder.findById(req.params.id);
        
        if (!reminder) {
            return res.status(404).json({
                status: 'error',
                message: 'Reminder not found'
            });
        }

        if (reminder.userId.toString() !== req.user.id) {
            return res.status(403).json({
                status: 'error',
                message: 'You can only delete your own reminders'
            });
        }

        await Reminder.findByIdAndDelete(req.params.id);

        res.status(200).json({
            status: 'success',
            message: 'Reminder deleted successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 'error',
            message: 'Error deleting reminder'
        });
    }
};
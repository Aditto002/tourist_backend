import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    email: {
        type: String,
        required: true
    },
    reminderDate: {
        type: Date,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'sent', 'failed'],
        default: 'pending'
    },
    sentAt: {
        type: Date
    },
    error: {
        type: String
    }
}, { timestamps: true, versionKey: false });


const Reminder = mongoose.model('Reminder', reminderSchema);
export default Reminder;

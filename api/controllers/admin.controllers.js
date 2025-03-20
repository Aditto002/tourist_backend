// adminController.js
import { Admin } from '../models/admin.model.js';
import User from "../models/usermodel.js"
import Gallery from "../models/gallery.model.js";
// import { Place } from '../models/placeModel.js';
import { Booking } from '../models/bookingModel.js';
// import { User } from './models/userModel.js';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { errorHandler } from '../utils/error.js';

// Admin Authentication
export const adminSignin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const admin = await Admin.findOne({ email });
        if (!admin) return console.log(errorHandler(404, 'Admin not found'));

        const validPassword = bcryptjs.compareSync(password, admin.password);
        if (!validPassword) return console.log(errorHandler(401, 'Wrong credentials'));

        const token = jwt.sign({ id: admin._id, isAdmin: true }, process.env.JWT_SECRET);
        admin.password = undefined;

        res.status(200).json({
            status: "success",
            data: {
                token,
                admin
            }
        });
    } catch (error) {
        console.log(error);
    }
};

// Place Management
export const createPlace = async (req, res) => {
    try {
        const newPlace = await Gallery.create(req.body);
        res.status(201).json({
            status: "success",
            data: newPlace
        });
    } catch (error) {
        console.log(error);
    }
};

export const updatePlace = async (req, res) => {
    try {
        const updatedPlace = await Gallery.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updatedPlace) return console.log(errorHandler(404, 'Place not found'));

        res.status(200).json({
            status: "success",
            data: updatedPlace
        });
    } catch (error) {
        console.log(error);
    }
};

export const deletePlace = async (req, res) => {
    try {
        await Gallery.findByIdAndDelete(req.params.id);
        res.status(200).json({
            status: "success",
            message: "Place deleted successfully"
        });
    } catch (error) {
        console.log(error);
    }
};
export const getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('user', 'username email profilePicture')
            .populate('place', 'title location price')
            .sort('-createdAt');
        
        res.status(200).json({
            status: "success",
            results: bookings.length,
            data: bookings
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: "error",
            message: "Error fetching bookings"
        });
    }
};

export const updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!['confirmed', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid status. Must be 'confirmed', 'rejected', or 'pending'"
            });
        }

        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { 
                status,
                // If status is confirmed, update payment status to completed
                ...(status === 'confirmed' && { paymentStatus: 'completed' })
            },
            { new: true }
        )
        .populate('user', 'username email')
        .populate('place', 'title location');

        if (!booking) {
            return res.status(404).json({
                status: "error",
                message: "Booking not found"
            });
        }

        // Here you could add email notification to user about booking status change
        // await SendEmailUtils(booking.user.email, 
        //     `Your booking for ${booking.place.title} has been ${status}`,
        //     "Booking Status Update"
        // );

        res.status(200).json({
            status: "success",
            message: `Booking ${status} successfully`,
            data: booking
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: "error",
            message: "Error updating booking status"
        });
    }
};

// Booking Management
// export const getAllBookings = async (req, res) => {
//     try {
//         const bookings = await Booking.find()
//             .populate('user', 'username email')
//             .populate('place', 'name location');
        
//         res.status(200).json({
//             status: "success",
//             data: bookings
//         });
//     } catch (error) {
//         console.log(error);
//     }
// };

// export const updateBookingStatus = async (req, res) => {
//     try {
//         const { status } = req.body;
//         const booking = await Booking.findByIdAndUpdate(
//             req.params.id,
//             { status },
//             { new: true }
//         );
        
//         if (!booking) return console.log(errorHandler(404, 'Booking not found'));

//         res.status(200).json({
//             status: "success",
//             data: booking
//         });
//     } catch (error) {
//         console.log(error);
//     }
// };

// User Management
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json({
            status: "success",
            data: users
        });
    } catch (error) {
        console.log(error);
    }
};

export const updateUser = async (req, res) => {
    try {
        if (req.body.password) {
            req.body.password = bcryptjs.hashSync(req.body.password, 10);
        }
        
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        ).select('-password');

        if (!updatedUser) return console.log(errorHandler(404, 'User not found'));

        res.status(200).json({
            status: "success",
            data: updatedUser
        });
    } catch (error) {
        console.log(error);
    }
};

export const deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({
            status: "success",
            message: "User deleted successfully"
        });
    } catch (error) {
        console.log(error);
    }
};

export const getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalPlaces = await Gallery.countDocuments();
        const totalBookings = await Booking.countDocuments();

        // Get booking stats by status
        const bookingStats = await Booking.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        res.status(200).json({
            status: "success",
            data: {
                totalUsers,
                totalPlaces,
                totalBookings,
                bookingsByStatus: bookingStats
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: "error",
            message: "Error fetching dashboard stats"
        });
    }
};

export const Adminsignout = (req,res) =>{
    res.clearCookie('access_token').status(200).json("SignOut successfully")
}
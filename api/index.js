import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Userrouter from './routes/user.route.js';
import Authrouter from './routes/auth.route.js';
import Galleryrout from './routes/gallery.route.js'
import cookieParser from 'cookie-parser';
import adminRoouts from './routes/adminRoute.js'
import bookingRoutes from './routes/booking.route.js'
import paymentRoutes from './routes/payment.route.js';
import reminderRoutes from './routes/bookingreminder.route.js';
// import { initializeReminders } from './controllers/bookingreminder.controller.js';
dotenv.config();

mongoose.connect(process.env.MONGO).then(()=>{
    console.log("connected to MongoDB");
})
.catch((err)=>{
    console.log(err);
})

const app = express();
app.use(cookieParser());
// app.use(cors());
app.use(cors({
    origin: ['http://localhost:5173','https://sandbox.sslcommerz.com' ], // Your frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }));
app.use(express.json());
app.options('*', cors());

app.listen(5000,()=>{
    console.log("server is runing on port 5000");
});


app.use('/api/image/',Galleryrout)
app.use('/api/user/',Userrouter)
app.use('/api/auth/', Authrouter)
app.use('/api/admin/' , adminRoouts)
app.use('/api/bookings/', bookingRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/payment', paymentRoutes);



app.use((err,req,res,next)=>{
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    return res.status(statusCode).json({
        success: false,
        message,
        statusCode
    })
})
import { Booking } from '../models/bookingModel.js';
import Gallery from '../models/gallery.model.js';
import { errorHandler } from '../utils/error.js';
import { SendEmailUtils } from '../utils/sendEmail.js';

export const createBooking = async (req, res, next) => {
    try {
      const { place, checkIn, checkOut, totalPrice } = req.body;
      
      // Log received data
      console.log("Received booking data:", {
        place,
        checkIn,
        checkOut,
        totalPrice,
        userId: req.user?.id
      });
  
      // Validate required fields
      if (!place) {
        return res.status(400).json({ 
          success: false, 
          message: "Place ID is required" 
        });
      }
  
      if (!checkIn || !checkOut) {
        return res.status(400).json({ 
          success: false, 
          message: "Check-in and check-out dates are required" 
        });
      }
  
      if (!totalPrice) {
        return res.status(400).json({ 
          success: false, 
          message: "Total price is required" 
        });
      }
  
      // Create the booking
      const booking = new Booking({
        user: req.user.id,
        place,
        checkIn,
        checkOut,
        totalPrice,
        status: 'pending',
        paymentStatus: 'pending'
      });
  
      // Save and populate the booking
      await booking.save();
      const populatedBooking = await Booking.findById(booking._id)
        .populate('user', 'name email')
        .populate('place', 'title');
////////////////////////////////////////////////////////////////////////////////////////
        const emailSubject = 'Trip Booking Confirmation';
        const emailText = `
            Dear ${populatedBooking.user.username},

            Your trip to ${populatedBooking.place.title} has been booked!

            Check-in: ${new Date(checkIn).toLocaleString()}
            Check-out: ${new Date(checkOut).toLocaleString()}
            Location: ${populatedBooking.place.location.city}, ${populatedBooking.place.location.country}
            Total Price: $${totalPrice}

            We'll send you a reminder 24 hours before your trip.

            Thank you for choosing our service!
        `;

        await SendEmailUtils(populatedBooking.user.email, emailText, emailSubject);

        // Schedule reminder email
        const reminderTime = new Date(checkIn);
        reminderTime.setHours(reminderTime.getHours() - 24);
        
        // Only schedule if reminder time is in the future
        if (reminderTime > new Date()) {
            setTimeout(async () => {
                const reminderSubject = 'Trip Reminder';
                const reminderText = `
                    Dear ${populatedBooking.user.username},

                    This is a reminder that your trip to ${populatedBooking.place.title} starts tomorrow at ${new Date(checkIn).toLocaleString()}.

                    Location: ${populatedBooking.place.location.city}, ${populatedBooking.place.location.country}

                    Have a great trip!
                `;

                await SendEmailUtils(populatedBooking.user.email, reminderText, reminderSubject);
            }, reminderTime.getTime() - Date.now());
        }
  ///////////////////////////////
      res.status(200).json({ 
        success: true, 
        message: "Booking created successfully",
        data: populatedBooking 
      });
  
    } catch (error) {
      console.error("Booking creation error:", error);
      
      // Send more specific error message
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: "Validation Error",
          errors: Object.values(error.errors).map(err => err.message)
        });
      }
  
      next(error);
    }
  };
// export const getUserBookings = async (req, res, next) => {
//     try {
//         const bookings = await Booking.find({ user: req.user.id })
//             .populate('place')
//             .sort('-createdAt');
            
//         res.status(200).json({
//             status: 'success',
//             data: bookings
//         });
//     } catch (error) {
//         next(error);
//     }
// };
export const getUserBookings = async (req, res, next) => {
  try {
      const bookings = await Booking.find({ user: req.user.id })
          .populate('place')
          .sort('-createdAt');
          
      // Filter out bookings with null places if needed
      const validBookings = bookings.filter(booking => booking.place);
          
      res.status(200).json({
          status: 'success',
          data: validBookings
      });
  } catch (error) {
      next(error);
  }
};
export const cancelBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id);
        
        if (!booking) {
            return next(errorHandler(404, 'Booking not found'));
        }
        
        if (booking.user.toString() !== req.user.id) {
            return next(errorHandler(403, 'You can only cancel your own bookings'));
        }
        
        if (booking.status === 'cancelled') {
            return next(errorHandler(400, 'Booking is already cancelled'));
        }
        
        const checkInDate = new Date(booking.checkIn);
        const today = new Date();
        const daysUntilCheckIn = Math.ceil((checkInDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntilCheckIn < 2) {
            return next(errorHandler(400, 'Bookings can only be cancelled at least 2 days before check-in'));
        }
        
        booking.status = 'cancelled';
        await booking.save();
        
        res.status(200).json({
            status: 'success',
            message: 'Booking cancelled successfully'
        });
    } catch (error) {
        next(error);
    }
};
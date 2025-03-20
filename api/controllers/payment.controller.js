import { Booking } from '../models/bookingModel.js';
import User from '../models/usermodel.js';
import SSLCommerzPayment from 'sslcommerz-lts';
import { ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import { SendEmailUtils } from '../utils/sendEmail.js';

dotenv.config();

const store_id = process.env.STORE_ID || 'jobne66e9a41435c9c';
const store_passwd = process.env.STORE_PASSWORD || 'jobne66e9a41435c9c@ssl';
const is_live = false;

export const initiatePayment = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;

    console.log('Initiating payment for booking:', bookingId);
    console.log('User ID:', userId);

    // Find the booking
    const booking = await Booking.findById(bookingId)
      .populate('user', 'email username phone')
      .populate('place', 'title price');

    if (!booking) {
      console.log('Booking not found:', bookingId);
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    console.log('Booking found:', booking);

    if (booking.user._id.toString() !== userId) {
      console.log('User mismatch. Booking user:', booking.user._id, 'Request user:', userId);
      return res.status(403).json({
        success: false,
        message: 'You can only pay for your own bookings'
      });
    }

    if (booking.paymentStatus === 'completed') {
      console.log('Payment already completed for booking:', bookingId);
      return res.status(400).json({
        success: false,
        message: 'Payment already completed for this booking'
      });
    }

    const trans_id = new ObjectId().toString();
    console.log('Generated transaction ID:', trans_id);

    // Construct the URLs using environment variables
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    
    const data = {
      total_amount: booking.totalPrice,
      currency: 'BDT',
      tran_id: trans_id,
      success_url: `${baseUrl}/api/payment/success?bookingId=${bookingId}`,
      fail_url: `${baseUrl}/api/payment/fail?bookingId=${bookingId}`,
      cancel_url: `${baseUrl}/api/payment/cancel?bookingId=${bookingId}`,
      ipn_url: `${baseUrl}/api/payment/ipn`,
      shipping_method: 'No',
      product_name: booking.place.title,
      product_category: 'Travel',
      product_profile: 'service',
      cus_name: booking.user.username,
      cus_email: booking.user.email,
      cus_add1: 'Customer Address',
      cus_city: 'City',
      cus_postcode: '1000',
      cus_country: 'Bangladesh',
      cus_phone: booking.user.phone || '01700000000',
    };

    console.log('SSLCommerz initialization data:', data);
    console.log('Using store ID:', store_id);

    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    
    try {
      const apiResponse = await sslcz.init(data);
      console.log('SSLCommerz API Response:', apiResponse);

      if (!apiResponse?.GatewayPageURL) {
        console.error('No gateway URL received from SSLCommerz');
        return res.status(400).json({
          success: false,
          message: 'Failed to initialize payment gateway'
        });
      }

      // Update booking with transaction ID
      booking.transactionId = trans_id;
      booking.paymentStatus = 'pending';
      await booking.save();
      
      console.log('Redirecting to gateway URL:', apiResponse.GatewayPageURL);
      
      res.status(200).json({
        success: true,
        url: apiResponse.GatewayPageURL
      });
    } catch (sslError) {
      console.error('SSLCommerz initialization error:', sslError);
      return res.status(500).json({
        success: false,
        message: 'Payment gateway initialization failed'
      });
    }

  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error initiating payment'
    });
  }
};

export const successPayment = async (req, res, next) => {
  try {
    const bookingId = req.query.bookingId;
    const { tran_id, status, val_id } = req.body;

    // Find the booking by ID
    const booking = await Booking.findById(bookingId)
      .populate('user', 'email username')
      .populate('place', 'title');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.transactionId !== tran_id) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID mismatch'
      });
    }

    // Update the booking status
    booking.paymentStatus = 'completed';
    // booking.status = 'confirmed';
    booking.paymentDetails = {
      transactionId: tran_id,
      validationId: val_id,
      paymentDate: new Date()
    };

    await booking.save();

    // Send confirmation email
    const emailSubject = 'Payment Confirmation';
    const emailText = `
      Dear ${booking.user.username},

      Your payment for the trip to ${booking.place.title} has been successfully completed.
      Booking Details:
      - Check-in: ${new Date(booking.checkIn).toLocaleDateString()}
      - Check-out: ${new Date(booking.checkOut).toLocaleDateString()}
      - Total Amount: $${booking.totalPrice}
      - Transaction ID: ${tran_id}

      Thank you for choosing our service!
    `;

    await SendEmailUtils(booking.user.email, emailText, emailSubject);

    // Redirect to frontend success page
    res.redirect(`http://localhost:5173/userbooking`);



  } catch (error) {
    console.error('Payment success processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing successful payment'
    });
    next(error);
  }
};

export const failedPayment = async (req, res, next) => {
  try {
    const bookingId = req.query.bookingId;
    const { tran_id } = req.body;

    // Update booking status to failed payment
    await Booking.findByIdAndUpdate(bookingId, {
      paymentStatus: 'failed'
    });

    res.redirect(`${process.env.FRONTEND_URL}/payment-failed?bookingId=${bookingId}`);
  } catch (error) {
    console.error('Payment failure processing error:', error);
    next(error);
  }
};

export const cancelledPayment = async (req, res, next) => {
  try {
    const bookingId = req.query.bookingId;

    // No need to update anything as the user cancelled
    res.redirect(`${process.env.FRONTEND_URL}/payment-cancelled?bookingId=${bookingId}`);
  } catch (error) {
    console.error('Payment cancellation processing error:', error);
    next(error);
  }
};

export const ipnListener = async (req, res, next) => {
  try {
    const { tran_id, status, val_id } = req.body;

    // Find booking by transaction ID
    const booking = await Booking.findOne({ transactionId: tran_id });

    if (!booking) {
      return res.status(404).end();
    }

    if (status === 'VALID') {
      booking.paymentStatus = 'completed';
      booking.status = 'confirmed';
      booking.paymentDetails = {
        transactionId: tran_id,
        validationId: val_id,
        paymentDate: new Date()
      };
      await booking.save();
    } else if (status === 'FAILED') {
      booking.paymentStatus = 'failed';
      await booking.save();
    }

    res.status(200).end();
  } catch (error) {
    console.error('IPN processing error:', error);
    res.status(500).end();
  }
};

export const getPaymentStatus = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    res.status(200).json({
      success: true,
      paymentStatus: booking.paymentStatus,
      bookingStatus: booking.status
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    next(error);
  }
};
export const getBookingDetails = async (req, res, next) => {
    try {
        const bookingId = req.params.id;
        const userId = req.user.id;

        const booking = await Booking.findById(bookingId)
            .populate('place', 'title')
            .populate('user', 'email username');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Verify the booking belongs to the user
        if (booking.user._id.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized access to booking'
            });
        }

        res.status(200).json({
            success: true,
            booking
        });

    } catch (error) {
        console.error('Get booking details error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching booking details'
        });
    }
};

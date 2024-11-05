const Razorpay = require("razorpay");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { User } = require("../models/user.model");
const { RAZORPAY_KEY_ID, RAZORPAY_SECRET_KEY } = process.env;

const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_SECRET_KEY,
});

const createOrder = asyncHandler(async (req, res) => {
  try {
    const order = await razorpayInstance.orders.create({
      amount: req.body.amount * 100,
      currency: "INR",
      receipt: "receipt#1",
    });
    res.json(new ApiResponse(200, order, "order created successfully"));
  } catch (error) {
    throw new ApiError(501, error.message);
  }
});

const confirmPayment = asyncHandler(async (req, res) => {
  const { paymentId, orderId, userId } = req.body;
  
  try {
    // verify the payment with Razorpay to confirm it’s successful
    const payment = await razorpayInstance.payments.fetch(paymentId);

    if (payment.status === "captured" && payment.order_id === orderId) {
      // update user's status in the database
      await User.findByIdAndUpdate(
        userId,
        { isPremium: true }
      );
      
      res.json(new ApiResponse(200, { userId }, "User upgraded to premium"));
    } else {
      throw new ApiError(400, "Payment not yet verified. Please try again");
    }
  } catch (error) {
    console.error("Payment verification failed:", error);
    throw new ApiError(500, `Server error ${error.message}`);
  }
});

module.exports = { createOrder, confirmPayment };

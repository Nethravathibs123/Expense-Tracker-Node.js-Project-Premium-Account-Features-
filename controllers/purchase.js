
const Razorpay = require('razorpay');
const Order = require('../models/order');
const User = require('../models/user');

// Controller for purchasing premium membership
const purchasePremium = async (req, res) => {
  try {
    const rzp = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const amount = 1000; 

    const order = await new Promise((resolve, reject) => {
      rzp.orders.create({ amount, currency: 'INR' }, (err, order) => {
        if (err) {
          return reject(new Error(JSON.stringify(err)));
        }
        resolve(order);
      });
    });

    console.log('Razorpay Order:', order); // Check if order.id exists
    await req.user.createOrder({ orderId: order.id, status: 'PENDING' });
    
    return res.status(201).json({ order, key_id: rzp.key_id });
  } catch (err) {
    console.error('Error creating Razorpay order:', err);
    res.status(403).json({ message: 'Something went wrong while creating the order', error: err.message });
  }
};

// Controller for updating transaction status (payment success/failure)
const updateTransactionStatus = async (req, res) => {
  const { orderId, paymentId, msg } = req.body;
  const userId = req.user.id;
console.log(orderId);
console.log(paymentId)
  try {
    // Find the order for the current user
    const order = await Order.findOne({ where: { orderid: orderId, userId } });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Determine payment status (success or failure)
    const isSuccess = msg === 'successful';

    // Update the order status and payment ID
    const orderUpdatePromise = order.update({
      status: isSuccess ? 'SUCCESSFUL' : 'FAILED',
      paymentid: isSuccess ? paymentId : null,
    });

    // Update the user's premium status if payment was successful
    const userUpdatePromise = isSuccess ? req.user.update({ ispremium: true }) : Promise.resolve();

    // Wait for both order and user updates to complete
    await Promise.all([orderUpdatePromise, userUpdatePromise]);

    // Send appropriate response
    if (isSuccess) {
      return res.status(200).json({ message: 'Payment successful', premium: true });
    } else {
      return res.status(200).json({ message: 'Payment failed', premium: false });
    }
  } catch (err) {
    console.error('Error updating transaction status:', err);
    res.status(500).json({ message: 'An error occurred while updating transaction status', error: err.message });
  }
};

module.exports = { purchasePremium, updateTransactionStatus };

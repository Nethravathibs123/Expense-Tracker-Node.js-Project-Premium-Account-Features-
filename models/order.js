
const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const Order = sequelize.define('order', {
  orderId: {
    type: Sequelize.STRING,
    allowNull: false,  // This requires `orderId` to be non-null
  },
  status: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  paymentId: {
    type: Sequelize.STRING,
    allowNull: true,   // This can be null before payment completion
  },
  status: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
        isIn: [['created', 'completed', 'failed', 'pending','CREATED', 'COMPLETED', 'FAILED', 'PENDING']] // Optional: restrict to specific values
    }
}
});


module.exports = Order;

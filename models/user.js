


const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const Users = sequelize.define('user-detail', {
  id : {
    type : Sequelize.INTEGER,
    autoIncrement : true,
    allowNull : false,
    primaryKey : true
  },
  username: {
    type: Sequelize.STRING,
    allowNull: false
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false
  },

  ispremium: {
    type: Sequelize.BOOLEAN,
    defaultValue: false, 
    allowNull: false,
  },
});

module.exports = Users;

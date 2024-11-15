

const path = require('path');
const express = require('express');
const app = express();
require('dotenv').config();

const cors = require("cors");
const sequelize = require ('./util/database');


const Users = require ('./models/user');
const Expense = require('./models/expense');
const Order=require('./models/order')

app.use(express.static(path.join(__dirname, 'public')));
const userRoutes = require('./routes/user');
const expenseRoutes = require('./routes/expense'); 
const premiumRoutes = require('./routes/purchase');



app.use(express.json());
app.use(cors());

app.use('/user', userRoutes);
app.use('/expenses', expenseRoutes); 
app.use('/premium', premiumRoutes);

Users.hasMany(Expense, { foreignKey: 'userId' });
Expense.belongsTo(Users, { foreignKey: 'userId' });


Users.hasMany(Order,{foreignKey:'userId'});
Order.belongsTo(Users,{foreignKey:"userId"})

const port = 3000;
sequelize
.sync()
.then((result) => {
    console.log(`server is working on http://localhost:${port}`);
   app.listen(port);
}).catch((err) => {
    console.log(err)
});

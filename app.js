const express = require('express');

const app = express();

const shopRoutes = require('./routes/shop');
const adminRoutes = require('./routes/admin')

const sequelize = require('./util/database');

const Book = require('./models/book');
const User = require('./models/user');
const Cart = require('./models/cart');
const Order = require('./models/order');
const CartItem = require('./models/cart-item');
const OrderItem = require('./models/order-item');

app.use(express.urlencoded({extended: false}));

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use((req, res, next) => {
    User.findByPk(1)
        .then(user => {
            return req.user = user;
        })
        .then(result => {
            next();
        })
        .catch(err => {
            console.log(err);
        });
})


app.use('/admin', adminRoutes);
app.use(shopRoutes);

app.use((req, res, next) => {
    res.status(404).render('404');
});

Book.belongsTo(User, {constraints: true, oneDelete: 'CASCADE'});
User.hasMany(Book);
Cart.belongsTo(User, {constraints: true, oneDelete: 'CASCADE'});
User.hasOne(Cart);
Cart.belongsToMany(Book, {through: CartItem});
Book.belongsToMany(Cart, {through: CartItem});
Order.belongsTo(User);
User.hasMany(Order);
Order.belongsToMany(Book, {through: OrderItem});
Book.belongsToMany(Order, {through: OrderItem});

sequelize
    .sync({force: true})
    //.sync()
    .then(result => {
        return User.findByPk(1);
    })
    .then(user => {
        if (!user) {
            return User.create({
                name: "dum",
                email: "dum@test.com",
                password: "password",

            });
        };
        return user;
    })
    .then(async user => {
        const cart = await user.getCart();
        if (!cart) {
            return user.createCart();
        };
        return cart;
    })
    .then(result => {
        app.listen(8080);
    })
    .catch(err => {
        console.log(err);
    });
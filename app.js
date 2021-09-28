const express = require('express');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

const shopRoutes = require('./routes/shop');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');

const sequelize = require('./util/database');

const Book = require('./models/book');
const User = require('./models/user');
const Cart = require('./models/cart');
const Order = require('./models/order');
const CartItem = require('./models/cart-item');
const OrderItem = require('./models/order-item');

const app = express();

app.use(express.urlencoded({extended: false}));

app.use(
    session({
        secret: 'super secret key',
        store: new SequelizeStore({
            db: sequelize,
        }),
        resave: false,
        saveUninitialized: false,
    }));

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    } else {
        User.findByPk(req.session.user.id)
            .then(user => {
                if (!user) {
                    next();
                }
                req.user = user;
                next();
            })
            .catch(err => {
                console.log(err);
            });
    };
});


app.use('/admin', adminRoutes);
app.use(authRoutes);
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
    //.sync({force: true})
    .sync()
    .then(result => {
        app.listen(8080);
    })
    .catch(err => {
        console.log(err);
    });
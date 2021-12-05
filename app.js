require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const csurf = require('csurf');
const flash = require('connect-flash');

const shopRoutes = require('./routes/shop');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const searchRoutes = require('./routes/search');

const errorController = require('./controllers/error');

const sequelize = require('./util/database');

const Book = require('./models/book');
const User = require('./models/user');
const Cart = require('./models/cart');
const Order = require('./models/order');
const CartItem = require('./models/cart-item');
const OrderItem = require('./models/order-item');
const Author = require('./models/author');
const AuthorItem = require('./models/author-item');
const Publication = require('./models/publication');
const Genre = require('./models/genre');
const PendingBook = require('./models/pending-book');

const locals = require('./middleware/locals');
const GenreItem = require('./models/genre-items');
const Tag = require('./models/tag');
const AddressBook = require('./models/address-book');
const trimmer = require('./middleware/trimmer');
const BookImage = require('./models/book-image');
const PendingBookImage = require('./models/pending-book-image');
const Rating = require('./models/rating');
const RatingItem = require('./models/rating-item');
const Review = require('./models/review');
const compression = require('compression');
const morgan = require('morgan');

const app = express();

const csrfProtection = csurf(); //uncomment for csrf protection, needs csrf token in every view

const accessLogStream = fs.createWriteStream(
	path.join(__dirname, 'access.log'),
	{ flags: 'a' }
);

// app.use(
// 	helmet.contentSecurityPolicy({
// 		useDefaults: true,
// 		directives: {
// 			'img-src': ["'self'", 'https://avatars.dicebear.com'],
// 			defaultSrc: [
// 				"'self'",
// 				"'unsafe-eval'",
// 				'https://code.jquery.com/',
// 				"'unsafe-inline'",
// 				'https://fonts.googleapis.com/',
// 				'https://js.stripe.com',
// 				'https://stripe.com',
// 				'https://edge-js.stripe.com',
// 				'https://pay.google.com',
// 				'checkout.stripe.com',
// 			],
// 			scriptSrc: [
// 				"'self'",
// 				"'unsafe-eval'",
// 				'https://code.jquery.com/',
// 				"'unsafe-inline'",
// 				'https://stripe.com',
// 				'https://js.stripe.com',
// 				'https://edge-js.stripe.com',
// 				'https://pay.google.com',
// 				'checkout.stripe.com',
// 			],
// 			'style-src': null,
// 			'script-src-attr': ['unsafe-hashes', 'unsafe-inline'],
// 		},
// 	})
// );
app.use(compression());
app.use(morgan('combined', { stream: accessLogStream }));

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(
	session({
		secret: process.env.SESSION_SECRET_KEY,
		store: new SequelizeStore({
			db: sequelize,
		}),
		resave: false,
		saveUninitialized: false,
	})
);

app.use(csrfProtection); //uncomment for csrf
app.use(flash());

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use((req, res, next) => {
	if (!req.session.user) {
		return next();
	} else {
		User.findByPk(req.session.user.id)
			.then(async (user) => {
				if (!user) {
					next();
				}
				const cart = await user.getCart();
				req.user = user;
				req.user.totalCartItems = cart.totalItems;
				next();
			})
			.catch((err) => {
				if (!err.statusCode) {
					err.statusCode = 500;
				}
				next(err);
			});
	}
});

//middlewares
app.use(locals);
app.use(trimmer);

//routes
app.use('/admin', adminRoutes);
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/search', searchRoutes);
app.use(shopRoutes);

app.use(errorController.notFound);
app.use(errorController.errorHandler);

AddressBook.belongsTo(User, { constraints: true, onDelete: 'CASCADE' });
User.hasMany(AddressBook);

PendingBook.belongsTo(User, { constraints: true, oneDelete: 'CASCADE' });
User.hasMany(PendingBook);

Book.belongsTo(User, { constraints: true, onDelete: 'CASCADE' });
User.hasMany(Book);

Cart.belongsTo(User, { constraints: true, onDelete: 'CASCADE' });
User.hasOne(Cart);

Cart.belongsToMany(Book, { through: CartItem });
Book.belongsToMany(Cart, { through: CartItem });

Order.belongsTo(User);
User.hasMany(Order);

Order.belongsToMany(Book, { through: OrderItem });
Book.belongsToMany(Order, { through: OrderItem });

Book.belongsToMany(Author, { constraints: true, through: AuthorItem });
Author.belongsToMany(Book, { constraints: true, through: AuthorItem });

Book.belongsTo(Publication, { constraints: true });
Publication.hasMany(Book);

Book.belongsToMany(Genre, { constraints: true, through: GenreItem });
Genre.belongsToMany(Book, { constraints: true, through: GenreItem });

Tag.belongsTo(Book);
Book.hasMany(Tag);

BookImage.belongsTo(Book, { constraints: true, onDelete: 'CASCADE' });
Book.hasMany(BookImage);

PendingBookImage.belongsTo(PendingBook, {
	constraints: true,
	onDelete: 'CASCADE',
});
PendingBook.hasMany(PendingBookImage);

Book.hasOne(Rating);
Rating.belongsTo(Book);

User.belongsToMany(Rating, { through: RatingItem });
Rating.belongsToMany(User, { through: RatingItem });

Book.hasMany(Review);
Review.belongsTo(Book);

User.hasMany(Review);
Review.belongsTo(User);

sequelize
	// .sync({ force: true })
	.sync()
	.then((result) => {
		app.listen(process.env.PORT);
	})
	.catch((err) => {
		console.log(err);
	});

const path = require('path');
const express = require('express');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const csurf = require('csurf');
const flash = require('connect-flash');

const shopRoutes = require('./routes/shop');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

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

const app = express();

// const csrfProtection = csurf(); //uncomment for csrf protection, needs csrf token in every view

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(
	session({
		secret: 'super secret key',
		store: new SequelizeStore({
			db: sequelize,
		}),
		resave: false,
		saveUninitialized: false,
	})
);

// app.use(csrfProtection); //uncomment for csrf
app.use(flash());

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use((req, res, next) => {
	if (!req.session.user) {
		return next();
	} else {
		User.findByPk(req.session.user.id)
			.then((user) => {
				if (!user) {
					next();
				}
				req.user = user;
				next();
			})
			.catch((err) => {
				console.log(err);
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

BookImage.belongsTo(Book);
Book.hasMany(BookImage);

PendingBookImage.belongsTo(PendingBook);
PendingBook.hasMany(PendingBookImage);

sequelize
	// .sync({ force: true })
	.sync()
	.then((result) => {
		app.listen(8080);
	})
	.catch((err) => {
		console.log(err);
	});

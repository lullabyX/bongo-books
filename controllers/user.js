require('dotenv').config();

const path = require('path');
const fs = require('fs');

const { validationResult } = require('express-validator');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/user');
const Book = require('../models/book');
const Order = require('../models/order');
const PendingBook = require('../models/pending-book');
const { deleteFile } = require('../util/filehelper');
const AddressBook = require('../models/address-book');
const OrderItem = require('../models/order-item');
const Rating = require('../models/rating');

const { createInvoice } = require('../util/createInvoice');
const sequelize = require('../util/database');
const RatingItem = require('../models/rating-item');

exports.getBooks = async (req, res, next) => {
	const page = +req.query.page || 1;
	let totalBooks;
	let totalPages;
	try {
		const books = await Book.findAndCountAll({
			offset: (page - 1) * process.env.BOOKS_PER_PAGE,
			limit: process.env.BOOKS_PER_PAGE,
			where: { userId: req.user.id },
		});
		totalBooks = books.count;
		totalPages = Math.ceil(totalBooks / process.env.BOOKS_PER_PAGE);
		res.status(200).render('user/books', {
			books: books,
			pageTitle: 'Your Books',
			path: '/user/books',
			pagination: {
				currentPage: page,
				previousPage: page - 1,
				nextPage: page + 1,
				totalPages: totalPages,
			},
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.getCart = async (req, res, next) => {
	try {
		const cart = await req.user.getCart();
		const books = await cart.getBooks();

		res.status(200).render('user/cart', {
			books: books,
			pageTitle: 'My Cart',
			path: '/user/cart',
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.postCart = async (req, res, next) => {
	const bookId = req.body.bookId;
	let newQty = 1;
	try {
		const cart = await req.user.getCart();
		const books = await cart.getBooks({ where: { id: bookId } });
		let book = books[0];
		if (book) {
			const oldQty = book.cartItem.quantity;
			newQty += oldQty;
		} else {
			book = await Book.findByPk(bookId);
		}
		await cart.addBook(book, {
			through: { quantity: newQty },
		});
		res.status(202).redirect('/user/cart');
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.getShipping = async (req, res, next) => {
	try {
		const addresses = req.user.getAddressBooks();
		const user = User.findByPk(req.user.id);
		res.status(200).render('user/shipping', {
			addresses: addresses,
			user: user,
			pageTitle: 'Shipping',
			path: '/user/checkout/shipping',
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.getCheckout = async (req, res, next) => {
	let total = 0;
	const addressId = req.query.id;
	try {
		const address = await AddressBook.findByPk(addressId);
		if (!address) {
			req.flash('error', 'Address not valid.');
			await req.session.save();
			return res.status(404).redirect('/user/cart');
		}
		const cart = await req.user.getCart();
		const books = await cart.getBooks();
		books.forEach((book) => {
			total += book.price * book.cartItem.quantity;
		});
		let name = req.user.firstName + ' ' + req.user.lastName;
		if (name == 'null null' || name == 'null ' || name == ' null') {
			name = req.user.username;
		}
		const stripeSession = await stripe.checkout.sessions.create({
			payment_method_types: ['card'],
			line_items: books.map((book) => {
				return {
					name: book.title,
					description: book.description,
					amount: book.price * 100,
					quantity: book.cartItem.quantity,
					currency: 'usd',
				};
			}),
			customer_email: req.user.email,
			success_url:
				req.protocol +
				'://' +
				req.get('host') +
				'/user/checkout/success?id=' +
				address.id,
			cancel_url:
				req.protocol +
				'://' +
				req.get('host') +
				'/user/checkout/cancel',
		});
		res.status(200).render('user/checkout', {
			books: books,
			pageTitle: 'checkout',
			path: '/user/checkout',
			totalSum: total,
			sessionId: stripeSession.id,
			publishkey: process.env.STRIPE_PUBLIC_KEY,
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.postOrder = async (req, res, next) => {
	const addressId = req.query.id | 0;
	try {
		const address = await AddressBook.findByPk(addressId);
		if (!address) {
			address.address = 'Address';
			address.region = 'Region';
			address.phoneNumber = '+PhoneNumber';
		}
		const cart = await req.user.getCart();
		const books = await cart.getBooks();
		const order = await req.user.createOrder();
		await order.addBook(
			books.map((book) => {
				book.orderItem = { quantity: book.cartItem.quantity };
				return book;
			})
		);
		order.shippingAddress = address.address;
		order.shippingRegion = address.region;
		order.shippingContact = address.phoneNumber;
		await order.save();
		await cart.setBooks(null);
		books.forEach(async (book) => {
			book.sellCount += book.orderItem.quantity;
			await book.save();
		});
		res.status(201).redirect('/user/orders');
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.postCartDeleteItem = async (req, res, next) => {
	const bookId = req.body.bookId;

	try {
		const cart = await req.user.getCart();
		const books = await cart.getBooks({ where: { id: bookId } });
		let book = books[0];
		await book.cartItem.destroy();
		res.status(202).redirect('user/cart');
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.getOrders = async (req, res, next) => {
	try {
		const orders = await req.user.getOrders({ include: Book });

		res.status(200).render('user/orders', {
			pageTitle: 'Your orders',
			path: '/user/orders',
			orders: orders,
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.getAddBook = async (req, res, next) => {
	try {
		res.status(200).render('user/add-book', {
			pageTitle: 'Add Book',
			path: '/user/add-book',
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.postAddBook = async (req, res, next) => {
	const title = req.body.title;
	const images = req.files;
	const price = req.body.price;
	const ISBN = req.body.ISBN;
	const publicationName = req.body.publicationName;
	const description = req.body.description;

	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		if (images.length > 0) {
			images.forEach((image) => {
				deleteFile(image.path);
			});
		}
		return res.status(422).json({
			message: errors.array(),
		});
	}

	try {
		const pendingBook = await req.user.createPendingBook({
			title: title,
			price: price,
			ISBN: ISBN,
			description: description,
			publicationName: publicationName,
		});
		images.forEach(async (image) => {
			const source = path.join(__dirname, '../', image.path);
			const imagePath = 'images/pending-book/' + pendingBook.id;
			let dest = path.join(__dirname, '../', imagePath);

			if (!fs.existsSync(dest)) {
				fs.mkdirSync(dest);
			}
			dest = dest + '/' + image.filename;
			await pendingBook.createPendingBookImage({
				imageUrl: '/' + imagePath + '/' + image.filename,
			});
			fs.rename(source, dest, (err) => {
				if (err) {
					throw err;
				}
			});
		});
		res.status(202).redirect('/');
	} catch (err) {
		if (images.length > 0) {
			images.forEach((image) => {
				deleteFile(image.path);
			});
		}
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.getEditBook = async (req, res, next) => {
	const editing = req.query.edit;
	const bookId = req.params.bookId;

	if (editing) {
		try {
			const book = await Book.findOne({
				where: {
					id: bookId,
					userId: req.user.id,
				},
			});
			if (book) {
				res.status(200).render('user/edit-book', {
					book: book,
					pageTitle: 'Editing ' + book.title,
					path: '/user/edit-book',
				});
			} else {
				req.flash('error', 'Unauthorized!');
				await req.session.save();
				res.status(404).redirect('/');
			}
		} catch (err) {
			if (!err.statusCode) {
				err.statusCode = 500;
			}
			next(err);
		}
	} else {
		res.redirect('/');
	}
};

exports.postEditBook = async (req, res, next) => {
	const bookId = req.body.id;
	const updatedImages = req.files;
	const updatedPrice = req.body.price;
	const updatedDescription = req.body.description;

	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		if (updatedImages.length > 0) {
			updatedImages.forEach((image) => {
				deleteFile(image.path);
			});
		}
		return res.status(422).json({
			message: errors.array(),
		});
	}

	try {
		const book = await Book.findOne({
			where: {
				id: bookId,
				userId: req.user.id,
			},
		});

		if (book) {
			book.imageUrl = updatedImageUrl;
			book.price = updatedPrice;
			book.description = updatedDescription;

			await book.save();
			if (updatedImages.length > 0) {
				const oldImagesPath = await book.getBookImages();
				oldImagesPath.forEach((path) => {
					deleteFile(path.imageUrl);
				});
				await book.setBookImages(null);
				updatedImages.forEach(async (image) => {
					const source = path.join(__dirname, '../', image.path);
					const imagePath = 'images/book/' + book.id;
					let dest = path.join(__dirname, '../', imagePath);

					if (!fs.existsSync(dest)) {
						fs.mkdirSync(dest);
					}
					dest = dest + '/' + image.filename;
					await book.createBookImage({
						imageUrl: '/' + imagePath + '/' + image.filename,
					});
					fs.rename(source, dest, (err) => {
						if (err) {
							throw err;
						}
					});
				});
			}
			res.status(202).redirect('/admin/books');
		} else {
			req.flash('error', 'Unauthorized!');
			await req.session.save();
			res.status(404).redirect('/admin/books');
		}
	} catch (err) {
		if (updatedImages.length > 0) {
			updatedImages.forEach((image) => {
				deleteFile(image.path);
			});
		}
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.postDeleteBook = async (req, res, next) => {
	const bookId = req.body.bookId;

	try {
		const book = await Book.findOne({
			where: {
				id: bookId,
				userId: req.user.id,
			},
		});
		if (!book) {
			req.flash('error', 'Unauthorized!');
			await req.session.save();
			res.status(404).redirect('/user/books');
		} else {
			const bookImages = await book.getBookImages();
			if (bookImages.length > 0) {
				bookImages.forEach((image) => {
					deleteFile(image.imageUrl);
				});
			}
			await book.removeBookImages();
			await book.destroy();
			res.status(200).redirect('/user/books');
		}
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.getPendingBooks = async (req, res, next) => {
	try {
		const pendingbooks = await PendingBook.findAll({
			where: { userId: req.user.id },
		});
		res.status(200).render('user/pending-books', {
			books: books,
			pageTitle: 'Pending Books',
			path: '/user/pending-books',
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.postDeletePendingBook = async (req, res, next) => {
	const bookId = req.body.pendingBookId;

	try {
		const pendingBook = await PendingBook.findOne({
			where: {
				id: bookId,
				userId: req.user.id,
			},
		});
		if (!pendingBook) {
			req.flash('error', 'Unauthorized!');
			await req.session.save();
			res.status(404).redirect('/user/pending-books');
		} else {
			const pendingBookImages = await pendingBook.getPendingBookImages();
			if (pendingBookImages.length > 0) {
				pendingBookImages.forEach((image) => {
					deleteFile(image.imageUrl);
				});
			}
			await pendingBook.removeBookImages();
			await pendingBook.destroy();
			res.status(200).redirect('/user/pending-books');
		}
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.getProfile = async (req, res, next) => {
	try {
		const user = await User.findByPk(req.user.id);
		if (!user) {
			res.status(422).redirect('/');
		}
		res.status(200).render('user/profile', {
			user: user,
			pageTitle: 'Profile | ' + req.user.username,
			path: '/user/profile',
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.postProfile = async (req, res, next) => {
	const firstName = req.body.firstName;
	const lastName = req.body.lastName;
	const primaryPhone = req.body.primaryPhone;
	const username = req.body.username || req.user.username;
	const image = req.file;
	try {
		if (req.user.username != username) {
			const doExist = await User.findOne({
				where: { username: username.toString() },
			});
			if (doExist) {
				if (image) {
					deleteFile(image.path);
				}
				return res.status(422).json({
					message: 'username already exist',
				});
			}
		}
		const user = await User.findByPk(req.user.id);
		if (!user) {
			const err = new Error('Something Went Wrong');
			err.statusCode = 404;
			throw err;
		}
		user.firstName = firstName;
		user.lastName = lastName;
		user.primaryPhone = primaryPhone;
		user.username = username;
		let avatar = user.avatar;
		if (image) {
			if (!avatar.includes('http')) {
				deleteFile(avatar);
			}
			avatar = '/' + image.path;
		}
		user.avatar = avatar;
		await user.save();
		res.status(200).redirect('/user/profile');
	} catch (err) {
		if (image) {
			deleteFile(image.path);
		}
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.postRandomAvatar = async (req, res, next) => {
	const rand = Math.floor(Math.random() * 999999);
	try {
		const user = await User.findByPk(req.user.id);
		if (!user) {
			const err = new Error('Something went wrong.');
			err.statusCode(404);
			throw err;
		}
		if (!user.avatar.includes('http')) {
			deleteFile(user.avatar);
		}
		user.avatar = `https://avatars.dicebear.com/api/big-smile/:${(
			user.username + rand
		).toString()}.svg`;
		await user.save();
		res.status(200).json({
			message: 'Changed Avatar',
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.resetAvatar = async (req, res, next) => {
	try {
		const user = await User.findByPk(req.user.id);
		if (!user) {
			const err = new Error('Something went wrong.');
			err.statusCode(404);
			throw err;
		}
		if (!user.avatar.includes('http')) {
			deleteFile(user.avatar);
		}
		user.avatar = `https://avatars.dicebear.com/api/big-smile/:${user.username}.svg`;
		await user.save();
		res.status(200).json({
			message: 'Reseted Avatar',
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.postAddAddress = async (req, res, next) => {
	const address = req.body.address;
	const region = req.body.region;
	const phoneNumber = req.body.phoneNumber;
	try {
		const addressBook = await req.user.createAddressBook({
			address: address,
			region: region,
			phoneNumber: phoneNumber,
		});
		res.status(201).json({
			message: 'Successfully created a new address',
			address: address,
			region: region,
			phoneNumber: phoneNumber,
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.postEditAddress = async (req, res, next) => {
	const addressId = req.body.addressId;

	const address = req.body.address;
	const region = req.body.region;
	const phoneNumber = req.body.phoneNumber;

	try {
		const addressBook = await AddressBook.findOne({
			where: {
				id: addressId,
				userId: req.user.id,
			},
		});

		if (!addressBook) {
			return res.status(422).json({
				message: 'Address not found.',
			});
		}
		addressBook.address = address || addressBook.address;
		addressBook.region = region || addressBook.region;
		addressBook.phoneNumber = phoneNumber || addressBook.phoneNumber;

		await addressBook.save();
		res.status(200).json({
			message: 'Address updated!',
			address: address,
			region: region,
			phoneNumber: phoneNumber,
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.postDeleteAddress = async (req, res, next) => {
	const addressId = req.body.addressId;

	try {
		const addressBook = await AddressBook.findOne({
			where: {
				id: addressId,
				userId: req.user.id,
			},
		});

		if (!addressBook) {
			return res.status(422).json({
				message: 'Address not found.',
			});
		}
		await addressBook.destroy();

		res.status(200).json({
			message: 'Address deleted.',
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.getInvoice = async (req, res, next) => {
	const orderId = req.params.orderId;

	try {
		const order = await Order.findByPk(orderId);
		const books = await order.getBooks();

		if (order.userId != req.user.id) {
			req.flash('error', 'Not Authorized!');
			await req.session.save();
			return res.status(404).redirect('/user/orders');
		}

		const invoiceName = 'invoice-' + orderId + '.pdf';
		const invoicePath = path.join('data', 'invoices', invoiceName);

		if (fs.existsSync(invoicePath)) {
			const file = fs.createReadStream(invoicePath);
			res.setHeader('Content-Type', 'application/pdf');
			res.setHeader(
				'Content-Disposition',
				'inline; filename="' + invoiceName + '"'
			);

			file.pipe(res);
		} else {
			let total = 0;
			let item = [];
			books.forEach((book) => {
				total += book.price * book.orderItem.quantity;
				let tmp = {
					item: book.title,
					description: book.description,
					quantity: book.orderItem.quantity,
					amount: book.price * book.orderItem.quantity * 100,
				};
				item.push(tmp);
			});
			const invoice = {
				shipping: {
					name: req.user.username,
					contactNo: order.shippingContact,
					address: order.shippingAddress,
					region: order.shippingRegion,
				},
				items: item,
				subtotal: total * 100,
				paid: total * 100,
				invoice_nr: orderId,
			};
			const pdfDoc = createInvoice(invoice, invoicePath);

			pdfDoc.pipe(fs.createWriteStream(invoicePath));
			pdfDoc.pipe(res);
		}
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.postRating = async (req, res, next) => {
	const bookId = req.body.bookId;
	const userRating = req.body.rating;
	try {
		const book = await Book.findByPk(bookId);
		if (!book) {
			const err = new Error('No book found of that id.');
			err.statusCode = 404;
			throw err;
		}
		let rating = await book.getRating();
		if (!rating) {
			rating = await book.createRating();
		}
		const user = await User.findByPk(req.user.id);
		await user.addRating(rating, {
			through: {
				bookId: book.id,
				rating: userRating,
			},
		});

		const avgRating = await RatingItem.findOne({
			where: { bookId: book.id },
			attributes: [
				'bookId',
				[sequelize.fn('avg', sequelize.col('rating')), 'avgRating'],
			],
			group: ['bookId'],
		});
		rating.avgRating = avgRating.dataValues.avgRating;
		await rating.save();
		return res.status(201).json({
			message: `Rating ${userRating} is added to ${book.title}`,
			rating: userRating,
			bookId: bookId,
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.postReview = async (req, res, next) => {
	const bookId = req.body.bookId;
	const review = req.body.review;
	try {
		const book = await Book.findByPk(bookId);
		const userOrder = await book.getOrders({
			where: { userId: req.user.id },
		});
		let isVarified = false;
		if (userOrder.length > 0) {
			isVarified = true;
		}
		await book.createReview({
			userId: req.user.id,
			review: review,
			varifiedPurchase: isVarified,
		});
		res.status(201).json({
			message: 'Review added',
			bookId: bookId,
			review: review,
			varifiedPurchase: isVarified,
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

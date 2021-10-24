const { validationResult } = require('express-validator');

const Book = require('../models/book');
const PendingBook = require('../models/pending-book');
const { deleteFile } = require('../util/filehelper');

exports.getCart = async (req, res, next) => {
	try {
		const cart = await req.user.getCart;
		const books = await cart.getBooks;

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
		res.status(202).redirect('user/cart');
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

exports.postOrder = async (req, res, next) => {
	try {
		const cart = await req.user.getCart();
		const books = await cart.getBooks();
		const order = await req.user.createOrder();
		await order.addBook(
			books.map((book) => {
				book.orderItem = { quantity: book.cartItem.quantity };
				return book;
			})
		);
		await cart.setBooks(null);
		res.status(202).redirect('user/orders');
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
		} else
		{
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

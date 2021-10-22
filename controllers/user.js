const Book = require('../models/book');
const PendingBook = require('../models/pending-book');

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
		console.log(err);
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
		console.log(err);
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
		console.log(err);
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
		console.log(err);
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
		console.log(err);
	}
};

exports.getAddBook = async (req, res, next) => {
	try {
		res.status(200).render('user/add-book', {
			pageTitle: 'Add Book',
			path: '/user/add-book',
		});
	} catch (err) {
		console.log(err);
	}
};

exports.postAddBook = async (req, res, next) => {
	const title = req.body.title;
	const imageUrl = req.body.imageUrl;
	const price = req.body.price;
	const ISBN = req.body.ISBN;
	const publicationName = req.body.publicationName;
	const description = req.body.description;

	try {
		const pendingBook = await req.user.createPendingBook({
			title: title,
			imageUrl: imageUrl,
			price: price,
			ISBN: ISBN,
			description: description,
			publicationName: publicationName,
		});
		res.status(202).redirect('/');
	} catch (err) {
		console.log(err);
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
			console.log(err);
		}
	} else {
		res.redirect('/');
	}
};

exports.postEditBook = async (req, res, next) => {
	const bookId = req.body.id;
	const updatedImageUrl = req.body.imageUrl;
	const updatedPrice = req.body.price;
	const updatedDescription = req.body.description;

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
			res.status(202).redirect('/admin/books');
		} else {
			req.flash('error', 'Unauthorized!');
			await req.session.save();
			res.status(404).redirect('/admin/books');
		}
	} catch (err) {
		console.log(err);
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
			await book.destroy();
			res.status(200).redirect('/user/books');
		}
	} catch (err) {
		console.log(err);
	}
};

exports.getPendingBooks = async (req, res, next) =>
{
    try {
		const pendingbooks = await PendingBook.findAll({ where: { userId: req.user.id } });
		res.status(200).render('user/pending-books', {
			books: books,
			pageTitle: 'Pending Books',
			path: '/user/pending-books',
		});
	} catch (err) {
		console.log(err);
	}
}

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
			await pendingBook.destroy();
			res.status(200).redirect('/user/pending-books');
		}
	} catch (err) {
		console.log(err);
	}
};

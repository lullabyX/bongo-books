const Book = require('../models/book');

exports.getIndex = async (req, res, next) => {
	try {
		const books = await Book.findAll();
		res.render('shop/index', {
			books: books,
			pageTitle: 'BongoBooks',
			path: '/',
		});
	} catch (err) {
		console.log(err);
	}
};

exports.getBooks = async (req, res, next) => {
	try {
		const books = await Book.findAll();
		res.render('shop/books', {
			books: books,
			pageTitle: 'Shop Page',
			path: '/books',
		});
	} catch (err) {
		console.log(err);
	}
};

exports.getBook = async (req, res, next) => {
	const bookId = req.params.bookId;
	try {
		const book = await Book.findByPk(bookId);
		res.status(200).render('shop/book-detail', {
			book: book,
			pageTitle: book.title,
			path: '/books',
		});
	} catch (err) {
		console.log(err);
	}
};

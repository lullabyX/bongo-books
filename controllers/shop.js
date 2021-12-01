const Book = require('../models/book');
const Author = require('../models/author');
const Tag = require('../models/tag');
const Genre = require('../models/genre');
const Publication = require('../models/publication');
const Rating = require('../models/rating');
const Review = require('../models/review');
const BookImage = require('../models/book-image');
const User = require('../models/user');
const { CreateUpdateContactModel } = require('sib-api-v3-sdk');

exports.getIndex = async (req, res, next) => {
	const page = +req.query.page || 1;
	let totalBooks;
	let totalPages;
	try {
		totalBooks = +(await Book.count());
		totalPages = Math.ceil(totalBooks / process.env.BOOKS_PER_PAGE);
		const books = await Book.findAll({
			offset: (page - 1) * process.env.BOOKS_PER_PAGE,
			limit: process.env.BOOKS_PER_PAGE,
			include: [
				{ model: Rating },
				{ model: Author },
				{ model: BookImage },
			],
		});
		res.render('shop/index', {
			books: books,
			pageTitle: 'BongoBooks',
			path: '/',
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

exports.getBooks = async (req, res, next) => {
	const page = +req.query.page || 1;
	let totalBooks;
	let totalPages;
	try {
		totalBooks = +(await Book.count());
		totalPages = Math.ceil(totalBooks / process.env.BOOKS_PER_PAGE);
		const books = await Book.findAll({
			offset: (page - 1) * process.env.BOOKS_PER_PAGE,
			limit: process.env.BOOKS_PER_PAGE,
			include: [
				{ model: Rating },
				{ model: Author },
				{ model: BookImage },
			],
		});
		res.render('shop/books', {
			books: books,
			pageTitle: 'Shop Page',
			path: '/books',
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

exports.getBook = async (req, res, next) => {
	const bookId = req.params.bookId;
	try {
		const book = await Book.findByPk(bookId, {
			include: [
				{
					model: Genre,
				},
				{
					model: Publication,
				},
				{
					model: Author,
				},
				{
					model: Tag,
				},
				{
					model: Rating,
				},
				{
					model: Review,
					include: [
						{
							model: User,
							attributes: ['username', 'avatar'],
						},
					],
					order: ['createdAt', 'DESC'],
				},
				{ model: BookImage },
			],
		});
		res.status(200).render('shop/book-detail', {
			book: book,
			pageTitle: book.title,
			path: '/books',
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.getAuthors = async (req, res, next) => {
	const page = +req.query.page || 1;
	let totalAuthors;
	let totalPages;
	try {
		totalAuthors = await Author.count();
		totalPages = Math.ceil(totalAuthors / process.env.AUTHORS_PER_PAGE);
		const authors = await Author.findAll({
			offset: (page - 1) * process.env.AUTHORS_PER_PAGE,
			limit: process.env.AUTHORS_PER_PAGE,
		});
		res.render('shop/book-attribute', {
			authors: authors,
			pageTitle: 'Authors',
			path: '/authors',
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

exports.getAuthorBooks = async (req, res, next) => {
	const page = +req.query.page || 1;
	let totalBooks;
	let totalPages;
	try {
		const authorId = req.query.id;
		const author = await Author.findByPk(authorId);
		if (!author) {
			req.flash('error', 'Author not found!');
			await req.session.save();
			return res.status(404).redirect('/authors');
		}
		const books = await Book.findAndCountAll({
			offset: (page - 1) * process.env.BOOKS_PER_PAGE,
			limit: process.env.BOOKS_PER_PAGE,
			include: [
				{
					model: Author,
					where: {
						id: authorId,
					},
				},
				{
					model: Rating,
				},
				{ model: BookImage },
			],
		});
		totalBooks = books.count;
		totalPages = Math.ceil(totalBooks / process.env.BOOKS_PER_PAGE);
		res.render('shop/books-of-attribute', {
			books: books,
			author: author,
			pageTitle: 'Books | ' + author.name,
			path: '/books/author',
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

exports.getGenres = async (req, res, next) => {
	const page = +req.query.page || 1;
	let totalGenres;
	let totalPages;
	try {
		totalGenres = await Book.count();
		totalPages = Math.ceil(totalGenres / process.env.GENRES_PER_PAGE);
		const genres = await Genre.findAll({
			offset: (page - 1) * process.env.GENRES_PER_PAGE,
			limit: process.env.GENRES_PER_PAGE,
		});
		res.render('shop/book-attribute', {
			genres: genres,
			pageTitle: 'Genres',
			path: '/genres',
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

exports.getGenreBooks = async (req, res, next) => {
	const page = +req.query.page || 1;
	let totalBooks;
	let totalPages;
	try {
		const genreId = req.query.id;
		const genre = await Genre.findByPk(genreId);
		if (!genre) {
			req.flash('error', 'Genre not found!');
			await req.session.save();
			return res.status(404).redirect('/genres');
		}
		const books = await Book.findAndCountAll({
			offset: (page - 1) * process.env.BOOKS_PER_PAGE,
			limit: process.env.BOOKS_PER_PAGE,
			include: [
				{
					model: Author,
				},
				{
					model: Genre,
					where: {
						id: genreId,
					},
				},
				{
					model: Rating,
				},
				{ model: BookImage },
			],
		});
		totalBooks = books.count;
		totalPages = Math.ceil(totalBooks / process.env.BOOKS_PER_PAGE);
		res.render('shop/books-of-attribute', {
			books: books,
			genre: genre,
			pageTitle: 'Books | ' + genre.name,
			path: '/books/genre',
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

exports.getPublications = async (req, res, next) => {
	const page = +req.query.page || 1;
	let totalPublications;
	let totalPages;
	try {
		totalPublications = await Book.count();
		totalPages = Math.ceil(
			totalPublications / process.env.PUBLICATIONS_PER_PAGE
		);
		const publications = await Publication.findAll({
			offset: (page - 1) * process.env.PUBLICATIONS_PER_PAGE,
			limit: process.env.PUBLICATIONS_PER_PAGE,
		});
		res.render('shop/book-attribute', {
			publications: publications,
			pageTitle: 'Publications',
			path: '/publications',
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

exports.getPublicationBooks = async (req, res, next) => {
	const page = +req.query.page || 1;
	let totalBooks;
	let totalPages;
	try {
		const publicationId = req.query.id;
		const publication = await Publication.findByPk(publicationId);
		if (!publication) {
			req.flash('error', 'Publication not found!');
			await req.session.save();
			return res.status(404).redirect('/publications');
		}
		const books = await Book.findAndCountAll({
			offset: (page - 1) * process.env.BOOKS_PER_PAGE,
			limit: process.env.BOOKS_PER_PAGE,
			include: [
				{
					model: Author,
				},
				{
					model: Publication,
					where: {
						id: publicationId,
					},
				},
				{
					model: Rating,
				},
				{ model: BookImage },
			],
		});
		totalBooks = books.count;
		totalPages = Math.ceil(totalBooks / process.env.BOOKS_PER_PAGE);
		res.render('shop/books-of-attribute', {
			books: books,
			pageTitle: 'Books | ' + publication.name,
			path: '/books/publication',
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

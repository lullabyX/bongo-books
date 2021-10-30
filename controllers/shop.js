const Book = require('../models/book');
const Author = require('../models/author');
const Tag = require('../models/tag');
const Genre = require('../models/genre');
const Publication = require('../models/publication');

exports.getIndex = async (req, res, next) => {
	try {
		const books = await Book.findAll();
		res.render('shop/index', {
			books: books,
			pageTitle: 'BongoBooks',
			path: '/',
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
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
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
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
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.getAuthors = async (req, res, next) => {
	try {
		const authors = await Author.findAll();
		res.render('shop/book-attribute', {
			authors: authors,
			pageTitle: 'Authors',
			path: '/authors',
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.getAuthorBooks = async (req, res, next) => {
	try {
		const authorId = req.query.id;
		const author = await Author.findByPk(authorId);
		if (!author) {
			req.flash('error', 'Author not found!');
			await req.session.save();
			return res.status(404).redirect('/authors');
		}
		const books = await Book.findAll({
			include: [
				{
					model: Author,
					where: {
						id: authorId,
					},
				},
				{
					model: Genre,
				},
				{
					model: Publication,
				},
				{
					model: Tag,
				},
			],
		});
		res.render('shop/books-of-attribute', {
			books: books,
			author: author,
			pageTitle: 'Books | ' + author.name,
			path: '/books/author',
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.getGenres = async (req, res, next) => {
	try {
		const genres = await Genre.findAll();
		res.render('shop/book-attribute', {
			genres: genres,
			pageTitle: 'Genres',
			path: '/genres',
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.getGenreBooks = async (req, res, next) => {
	try {
		const genreId = req.query.id;
		const genre = await Genre.findByPk(genreId);
		if (!genre) {
			req.flash('error', 'Genre not found!');
			await req.session.save();
			return res.status(404).redirect('/genres');
		}
		const books = await Book.findAll({
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
					model: Publication,
				},
				{
					model: Tag,
				},
			],
		});
		res.render('shop/books-of-attribute', {
			books: books,
			genre: genre,
			pageTitle: 'Books | ' + genre.name,
			path: '/books/genre',
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.getPublications = async (req, res, next) => {
	try {
		const publications = await Publication.findAll();
		res.render('shop/book-attribute', {
			publications: publications,
			pageTitle: 'Publications',
			path: '/publications',
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.getPublicationBooks = async (req, res, next) => {
	try {
		const publicationId = req.query.id;
		const publication = await Publication.findByPk(publicationId);
		if (!publication) {
			req.flash('error', 'Publication not found!');
			await req.session.save();
			return res.status(404).redirect('/publications');
		}
		const books = await Book.findAll({
			include: [
				{
					model: Author,
				},
				{
					model: Genre,
				},
				{
					model: Publication,
					where: {
						id: publicationId,
					},
				},
				{
					model: Tag,
				},
			],
		});
		res.render('shop/books-of-attribute', {
			books: books,
			pageTitle: 'Books | '+publication.name,
			path: '/books/publication',
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

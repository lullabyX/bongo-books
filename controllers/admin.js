const { validationResult } = require('express-validator');

const Book = require('../models/book');
const Author = require('../models/author');
const Publication = require('../models/publication');
const Genre = require('../models/genre');
const PendingBook = require('../models/pending-book');
const Tag = require('../models/tag');
const AuthorItem = require('../models/author-item');
const { Op } = require('sequelize');
const GenreItem = require('../models/genre-items');

exports.getBooks = async (req, res, next) => {
	try {
		const books = await Book.findAll({ where: { userId: req.user.id } });
		res.status(200).render('admin/books', {
			books: books,
			pageTitle: 'Admin Books',
			path: '/admin/books',
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
		res.status(200).render('admin/edit-book', {
			pageTitle: 'Add Book',
			path: '/admin/add-book',
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
	const imageUrl = req.body.imageUrl;
	const price = req.body.price;
	const ISBN = req.body.ISBN;
	const authorsString = req.body.authors;
	const publicationName = req.body.publicationName;
	const description = req.body.description;
	const genresString = req.body.genres;
	const tagsString = req.body.tags;
	const publishDate = req.body.publishDate;
	const language = req.body.language;

	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).json({
			message: errors.array(),
		});
	}

	try {
		const authorsArray = await authorsString.split(',').map((author) => {
			return author.trim();
		});

		const tagsArray = await tagsString.split(',').map((tag) => {
			return tag.trim();
		});

		const genresArray = await genresString.split(',').map((genre) => {
			return genre.trim();
		});
		let authors = [];
		let genres = [];
		// add authors
		authorsArray.forEach(async (authorName) => {
			console.log(authorName);
			const author = await Author.findOne({
				where: { name: authorName },
			});
			if (!author) {
				return res.status(404).json({
					message: `Author ${authorName} is not found in our Database. Add author first.`,
				});
			}
			authors.push(author);
		});
		//add genres
		genresArray.forEach(async (genreName) => {
			console.log(genreName);
			const genre = await Genre.findOne({
				where: { name: genreName },
			});
			if (!genre) {
				return res.status(404).json({
					message: `Genre ${genreName} is not found in our Database. Add genre first.`,
				});
			}
			genres.push(genre);
		});

		const publication = await Publication.findOne({
			where: { name: publicationName },
		});
		if (!publication) {
			return res.status(404).json({
				message: `Publication ${publicationName} does not exist in our database. Add publication?`,
			});
		}
		const book = await req.user.createBook({
			title: title,
			imageUrl: imageUrl,
			price: price,
			ISBN: ISBN,
			publicationName: publicationName,
			description: description,
			publishDate: publishDate,
			language: language,
		});
		await publication.addBook(book);
		authors.forEach(async (author) => {
			await author.addBook(book);
		});
		genres.forEach(async (genre) => {
			await genre.addBook(book);
		});
		tagsArray.forEach(async (tag) => {
			await book.createTag({
				name: tag,
			});
		});

		res.status(201).redirect('admin/books');
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.getPendingBooks = async (req, res, next) => {
	try {
		const pendingBooks = await PendingBook.findAll();
		res.status(200).render('admin/pending-books', {
			books: pendingBooks,
			pageTitle: 'Pending Books',
			path: '/admin/pending-books',
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.getPendingBook = async (req, res, next) => {
	const pendingBookId = req.params.pendingBookId;
	try {
		const pendingBook = await PendingBook.findByPk(pendingBookId);
		if (!pendingBook) {
			req.flash('error', 'Book not found in Pending-Book.');
			await req.session.save();
			return res.status(404).redirect('/admin/pending-books');
		}
		res.status(200).render('admin/pending-book', {
			books: pendingBook,
			pageTitle: 'Pending ' + pendingBook.title,
			path: '/admin/pending-book',
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.postVerifyPendingBooks = async (req, res, next) => {
	const pendingBookId = req.body.pendingBookId;

	const ISBN = req.body.ISBN;
	const publicationName = req.body.publicationName;
	const description = req.body.description;
	const publishDate = req.body.publishDate;
	const language = req.body.language;
	const authorsString = req.body.authors;
	const tagsString = req.body.tags;
	const genresString = req.body.genres;

	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).json({
			message: errors.array(),
		});
	}

	try {
		const authorsArray = await authorsString.split(',').map((author) => {
			return author.trim();
		});

		const genresArray = await genresString.split(',').map((genre) => {
			return genre.trim();
		});

		const tagsArray = await tagsString.split(',').map((tag) => {
			return tag.trim();
		});
		let authors = [];
		let genres = [];
		// add authos
		authorsArray.forEach(async (authorName) => {
			console.log(authorName);
			const author = await Author.findOne({
				where: { name: authorName },
			});
			if (!author) {
				return res.status(404).json({
					message: `Author ${authorName} is not found in our Database. Add author first.`,
				});
			}
			authors.push(author);
		});
		//add genres
		genresArray.forEach(async (genreName) => {
			console.log(genreName);
			const genre = await Genre.findOne({
				where: { name: genreName },
			});
			if (!genre) {
				return res.status(404).json({
					message: `Genre ${genreName} is not found in our Database. Add author first.`,
				});
			}
			genres.push(genre);
		});
		const publication = await Publication.findOne({
			where: { name: publicationName },
		});
		if (!publication) {
			return res.status(404).json({
				message: `Publication ${publicationName} does not exist in our database. Add publication?`,
			});
		}
		const pendingBook = await PendingBook.findOne({
			where: { id: pendingBookId },
		});
		if (!pendingBook) {
			const error = new Error('Book not found in Pending-Books.');
			error.statusCode = 404;
			throw error;
		}
		const book = await Book.create({
			title: pendingBook.title,
			imageUrl: pendingBook.imageUrl,
			ISBN: ISBN,
			price: pendingBook.price,
			publicationName: publicationName,
			description: description,
			publishDate: publishDate,
			language: language,
			userId: pendingBook.userId,
			createdAt: pendingBook.createdAt,
		});
		await publication.addBook(book);
		await book.addAuthors(authors);
		await book.addAuthors(genres);
		await pendingBook.destroy();
		tagsArray.forEach(async (tag) => {
			await book.createTag({
				name: tag,
			});
		});
		res.status(202).redirect('/admin/pending-books');
		// res.status(201).json({
		// 	message: 'success',
		// });
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
		const pendingBook = await PendingBook.findByPk(bookId);
		if (!pendingBook) {
			req.flash('error', 'Unauthorized!');
			await req.session.save();
			return res.status(404).redirect('/admin/pending-books');
		} else {
			await pendingBook.destroy();
			res.status(200).redirect('/admin/pending-books');
		}
	} catch (err) {
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
				},
				include: [Tag, Author, Genre, Publication],
			});
			if (book) {
				console.log(book);
				res.status(200).render('admin/edit-book', {
					book: book,
					pageTitle: 'Editing ' + book.title,
					path: '/admin/edit-book',
				});
			} else {
				req.flash('error', 'Unauthorized!');
				await req.session.save();
				res.status(404).redirect('/admin/books');
			}
		} catch (err) {
			if (!err.statusCode) {
				err.statusCode = 500;
			}
			next(err);
		}
	} else {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.postEditBook = async (req, res, next) => {
	const bookId = req.body.id;
	const updatedTitle = req.body.title;
	const updatedImageUrl = req.body.imageUrl;
	const updatedPrice = req.body.price;
	const updatedISBN = req.body.ISBN;
	const updatedAuthorsString = req.body.authors;
	const updatedPublicationName = req.body.publicationName;
	const updatedDescription = req.body.description;
	const updatedGenresString = req.body.genres;
	const updatedTagsString = req.body.tags;
	const updatedPublishDate = req.body.publishDate;
	const updatedLanguage = req.body.language;

	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).json({
			message: errors.array(),
		});
	}

	const authorsArray = await updatedAuthorsString.split(',').map((author) => {
		return author.trim();
	});

	const tagsArray = await updatedTagsString.split(',').map((tag) => {
		return tag.trim();
	});

	const genresArray = await updatedGenresString.split(',').map((genre) => {
		return genre.trim();
	});

	try {
		const book = await Book.findOne({
			where: {
				id: bookId,
			},
		});

		if (book) {
			/////////delete existing publication, tags, genre////////////
			GenreItem.destroy({ where: { bookId: book.id } });
			AuthorItem.destroy({ where: { bookId: book.id } });
			Tag.destroy({ where: { bookId: book.id } });
			////////////////////////////////////////////////////////////
			let authors = [];
			let genres = [];
			// add authors
			authorsArray.forEach(async (authorName) => {
				console.log(authorName);
				const author = await Author.findOne({
					where: { name: authorName },
				});
				if (!author) {
					return res.status(404).json({
						message: `Author ${authorName} is not found in our Database. Add author first.`,
					});
				}
				authors.push(author);
			});
			//add genres
			genresArray.forEach(async (genreName) => {
				console.log(genreName);
				const genre = await Genre.findOne({
					where: { name: genreName },
				});
				if (!genre) {
					return res.status(404).json({
						message: `Genre ${genreName} is not found in our Database. Add author first.`,
					});
				}
				genres.push(genre);
			});

			const publication = await Publication.findOne({
				where: { name: updatedPublicationName },
			});
			if (!publication) {
				return res.status(404).json({
					message: `Publication ${publicationName} does not exist in our database. Add publication?`,
				});
			}
			book.title = updatedTitle;
			book.imageUrl = updatedImageUrl;
			book.price = updatedPrice;
			book.ISBN = updatedISBN;
			book.description = updatedDescription;
			book.language = updatedLanguage;
			book.publishDate = updatedPublishDate;
			book.publicationId = publication.id;

			await book.save();
			// authors.forEach(async (author) => {
			// 	await author.addBook(book);
			// });
			await book.addAuthors(authors);
			// genres.forEach(async (genre) => {
			// 	await genre.addBook(book);
			// });
			await book.addGenres(genres);
			tagsArray.forEach(async (tag) => {
				await book.createTag({
					name: tag,
				});
			});
			res.status(202).redirect('/admin/books');
		} else {
			req.flash('error', 'Unauthorized!');
			await req.session.save();
			res.status(404).redirect('/admin/books');
		}
	} catch (err) {
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
				id: bookId, //can delte any book
			},
		});
		if (!book) {
			req.flash('error', 'Book not found!');
			await req.session.save();
			res.status(404).redirect('/admin/books');
		} else {
			await book.destroy();
			res.status(200).redirect('/admin/books');
		}
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
		res.status(200).render('admin/authors', {
			authors: authors,
			pageTitle: 'Authors',
			path: '/admin/authors',
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.postAuthor = async (req, res, next) => {
	const name = req.body.name;
	const imageUrl = req.body.imageUrl;
	const description = req.body.description;
	console.log(name);
	try {
		const author = await Author.findOne({ where: { name: name } });
		if (author) {
			return res.status(303).json({
				message: 'Author already exist',
				name: name,
				imageUrl: imageUrl,
				description: description,
			});
		}
		await Author.create({
			name: name,
			imageUrl: imageUrl,
			description: description,
		});

		res.status(201).json({
			message: 'Successfully Added Author',
			name: name,
			imageUrl: imageUrl,
			description: description,
		});
	} catch {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.postEditAuthor = async (req, res, next) => {
	const authorId = req.body.id;
	const name = req.body.name;
	const imageUrl = req.body.imageUrl;
	const description = req.body.description;
	console.log(name);
	try {
		const author = await Author.findByPk(authorId);
		if (!author) {
			return res.status(404).json({
				message: 'Author not found. Check author id.',
			});
		}
		author.name = name;
		author.imageUrl = imageUrl;
		author.description = description;

		await author.save();

		res.status(201).json({
			message: 'Successfully Updated Author',
			name: name,
			imageUrl: imageUrl,
			description: description,
		});
	} catch {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.getPublications = async (req, res, next) => {
	try {
		const publications = await Publication.findAll();
		res.status(200).render('admin/publications', {
			authors: publications,
			pageTitle: 'Publications',
			path: '/admin/publication',
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.postPublication = async (req, res, next) => {
	const name = req.body.name;
	const imageUrl = req.body.imageUrl;
	const description = req.body.description;
	try {
		const publication = await Publication.findOne({
			where: { name: name },
		});
		if (publication) {
			return res.status(303).json({
				message: 'Publication already exist',
				name: name,
				imageUrl: imageUrl,
				description: description,
			});
		}
		await Publication.create({
			name: name,
			imageUrl: imageUrl,
			description: description,
		});

		res.status(201).json({
			message: 'Successfully Added Publication',
			name: name,
			imageUrl: imageUrl,
			description: description,
		});
	} catch {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.postEditPublication = async (req, res, next) => {
	const publicationId = req.body.id;
	const name = req.body.name;
	const imageUrl = req.body.imageUrl;
	const description = req.body.description;
	try {
		const publication = await Publication.findByPk(publicationId);

		if (!publication) {
			return res.status(404).json({
				message: 'Publication not found. Check publication id.',
			});
		}

		publication.name = name;
		publication.imageUrl = imageUrl;
		publication.description = description;

		await publication.save();

		res.status(201).json({
			message: 'Successfully Updated Publication',
			name: name,
			imageUrl: imageUrl,
			description: description,
		});
	} catch {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.getGenres = async (req, res, next) => {
	try {
		const genres = await Genre.findAll();
		res.status(200).render('admin/genres', {
			authors: genres,
			pageTitle: 'Genres',
			path: '/admin/genres',
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.postGenre = async (req, res, next) => {
	const name = req.body.name;
	const imageUrl = req.body.imageUrl;
	const description = req.body.description;
	try {
		const genre = await Genre.findOne({ where: { name: name } });
		console.log(genre);
		if (genre) {
			return res.status(303).json({
				message: 'Genre already exist',
				name: name,
				imageUrl: imageUrl,
				description: description,
			});
		}
		await Genre.create({
			name: name,
			imageUrl: imageUrl,
			description: description,
		});
		res.status(201).json({
			message: 'Successfully Added Genre',
			name: name,
			imageUrl: imageUrl,
			description: description,
		});
	} catch {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.postEditGenre = async (req, res, next) => {
	const genreId = req.body.id;
	const name = req.body.name;
	const imageUrl = req.body.imageUrl;
	const description = req.body.description;
	try {
		const genre = await Genre.findByPk(genreId);
		if (!genre) {
			return res.status(404).json({
				message: 'Genre not found. Check genre id.',
			});
		}
		genre.name = name;
		genre.imageUrl = imageUrl;
		genre.description = description;

		await genre.save();

		res.status(201).json({
			message: 'Successfully Updated Genre',
			name: name,
			imageUrl: imageUrl,
			description: description,
		});
	} catch {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

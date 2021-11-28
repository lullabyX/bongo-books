const { validationResult } = require('express-validator');

const Book = require('../models/book');
const Author = require('../models/author');
const Publication = require('../models/publication');
const Genre = require('../models/genre');
const PendingBook = require('../models/pending-book');
const Tag = require('../models/tag');
const AuthorItem = require('../models/author-item');
const GenreItem = require('../models/genre-items');
const { deleteFile } = require('../util/filehelper');
const fs = require('fs');
const path = require('path');

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
		res.status(200).render('admin/books', {
			books: books,
			pageTitle: 'Admin Books',
			path: '/admin/books',
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

exports.getAddBook = async (req, res, next) => {
	try {
		res.status(200).render('admin/edit-book', {
			edit: false,
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
	const images = req.files;
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
			price: price,
			ISBN: ISBN,
			publicationName: publicationName,
			description: description,
			publishDate: publishDate,
			language: language,
		});
		await publication.addBook(book);
		await book.addAuthors(authors);
		await book.addGenres(genres);
		tagsArray.forEach(async (tag) => {
			await book.createTag({
				name: tag,
			});
		});
		images.forEach(async (image) => {
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

		res.status(201).redirect('/admin/books');
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

exports.getPendingBooks = async (req, res, next) => {
	const page = +req.query.page || 1;
	let totalBooks;
	let totalPages;
	try {
		const pendingBooks = await PendingBook.findAndCountAll({
			offset: (page - 1) * process.env.BOOKS_PER_PAGE,
			limit: process.env.BOOKS_PER_PAGE,
		});
		totalBooks = pendingBooks.count;
		totalPages = Math.ceil(totalBooks / process.env.BOOKS_PER_PAGE);
		res.status(200).render('admin/pending-books', {
			books: pendingBooks,
			pageTitle: 'Pending Books',
			path: '/admin/pending-books',
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
		const pendingBookImages = await pendingBook.getPendingBookImages();
		if (pendingBookImages.length > 0) {
			pendingBookImages.forEach(async (image) => {
				const source = path.join(__dirname, '../', image.imageUrl);
				const imagePath = 'images/book/' + book.id;
				let dest = path.join(__dirname, '../', imagePath);

				if (!fs.existsSync(dest)) {
					fs.mkdirSync(dest);
				}
				const filename = path(image.imageUrl).basename;
				dest = dest + '/' + filename;
				await book.createBookImage({
					imageUrl: '/' + imagePath + '/' + filename,
				});
				fs.rename(source, dest, (err) => {
					if (err) {
						throw err;
					}
				});
			});
			await book.createBookImages();
		}
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
			const pendingBookImages = await pendingBook.getPendingBookImages();
			if (pendingBookImages.length > 0) {
				pendingBookImages.forEach((image) => {
					deleteFile(image.imageUrl);
				});
			}
			await pendingBook.removeBookImages();
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
					edit: editing,
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
		req.status(404).redirect('/books');
	}
};

exports.postEditBook = async (req, res, next) => {
	const bookId = req.body.id;
	const updatedTitle = req.body.title;
	const updatedImages = req.files;
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
		if (updatedImages.length > 0) {
			updatedImages.forEach((image) => {
				deleteFile(image.path);
			});
		}
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
			if (updatedImages.length > 0) {
				updatedImages.forEach((image) => {
					deleteFile(image.path);
				});
			}
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
				id: bookId, //can delte any book
			},
		});
		if (!book) {
			req.flash('error', 'Book not found!');
			await req.session.save();
			res.status(404).redirect('/admin/books');
		} else {
			const bookImages = await book.getBookImages();
			if (bookImages.length > 0) {
				bookImages.forEach((image) => {
					deleteFile(image.imageUrl);
				});
			}
			await book.removeBookImages();
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

exports.getAddAuthor = async (req, res, next) => {
	try {
		res.status(200).render('admin/add-author', {
			edit: false,
			pageTitle: 'Add Author',
			path: '/admin/add-author',
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
	const image = req.file;
	const description = req.body.description;
	try {
		const imageUrl = '/' + image ? image.path : '';
		const author = await Author.findOne({ where: { name: name } });
		if (author) {
			if (image) {
				deleteFile(image.path);
			}
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

exports.getEditAuthor = async (req, res, next) => {
	const authorId = req.params.authorId;
	try {
		const author = await Author.findByPk(authorId);
		res.status(200).render('admin/add-author', {
			author: author,
			edit: true,
			pageTitle: 'Edit Author',
			path: '/admin/edit-author',
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.postEditAuthor = async (req, res, next) => {
	const authorId = req.body.id;
	const name = req.body.name;
	const image = req.file;
	const description = req.body.description;
	console.log(name);
	try {
		const author = await Author.findByPk(authorId);
		if (!author) {
			if (image) {
				deleteFile(image.path);
			}
			return res.status(404).json({
				message: 'Author not found. Check author id.',
			});
		}
		let imageUrl = author.imageUrl;
		if (image) {
			if (imageUrl) {
				deleteFile(author.imageUrl);
			}
			imageUrl = '/' + image.path;
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
		if (image) {
			deleteFile(image.path);
		}
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.getAddPublication = async (req, res, next) => {
	try {
		res.status(200).render('admin/add-publication', {
			pageTitle: 'Add Publication',
			path: '/admin/add-publication',
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
	const image = req.file;
	const description = req.body.description;
	try {
		const publication = await Publication.findOne({
			where: { name: name },
		});
		if (publication) {
			if (image) {
				deleteFile(image.path);
			}
			return res.status(303).json({
				message: 'Publication already exist',
				name: name,
				imageUrl: imageUrl,
				description: description,
			});
		}
		let imageUrl;
		if (image) {
			imageUrl = '/' + image.path;
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
		if (image) {
			deleteFile(image.path);
		}
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.getEditPublication = async (req, res, next) => {
	const publicationId = req.params.publicationId;
	try {
		const publication = await Publication.findByPk(publicationId);
		res.status(200).render('admin/add-publication', {
			publication: publication,
			edit: true,
			pageTitle: 'Edit Publication',
			path: '/admin/edit-publication',
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.postEditPublication = async (req, res, next) => {
	const publicationId = req.body.id;
	const name = req.body.name;
	const image = req.file;
	const description = req.body.description;
	try {
		const publication = await Publication.findByPk(publicationId);

		if (!publication) {
			if (image) {
				deleteFile(image.path);
			}
			return res.status(404).json({
				message: 'Publication not found. Check publication id.',
			});
		}
		let imageUrl = publication.imageUrl;
		if (image) {
			if (imageUrl) {
				deleteFile(imageUrl);
			}
			imageUrl = image.path;
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
		if (image) {
			deleteFile(image.path);
		}
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.getAddGenre = async (req, res, next) => {
	try {
		res.status(200).render('admin/add-genre', {
			pageTitle: 'Genres',
			path: '/admin/add-genre',
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
	const image = req.file;
	const description = req.body.description;
	try {
		const genre = await Genre.findOne({ where: { name: name } });
		if (genre) {
			if (image) {
				deleteFile(image.path);
			}
			return res.status(303).json({
				message: 'Genre already exist',
				name: name,
				imageUrl: imageUrl,
				description: description,
			});
		}
		let imageUrl;
		if (image) {
			if (imageUrl) {
				deleteFile(imageUrl);
			}
			imageUrl = '/' + image.path;
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
		if (image) {
			deleteFile(image.path);
		}
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.getEditGenre = async (req, res, next) => {
	const genreId = req.params.genreId;
	try {
		const genre = await Genre.findByPk(genreId);
		res.status(200).render('admin/add-genre', {
			genre: genre,
			edit: true,
			pageTitle: 'Edit Genre',
			path: '/admin/edit-genre',
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.postEditGenre = async (req, res, next) => {
	const genreId = req.body.id;
	const name = req.body.name;
	const image = req.file;
	const description = req.body.description;
	try {
		const genre = await Genre.findByPk(genreId);
		if (!genre) {
			if (image) {
				deleteFile(image.path);
			}
			return res.status(404).json({
				message: 'Genre not found. Check genre id.',
			});
		}
		let imageUrl = genre.imageUrl;
		if (image) {
			if (imageUrl) {
				deleteFile(imageUrl);
			}
			imageUrl = '/' + image.path;
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
		if (image) {
			deleteFile(image.path);
		}
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

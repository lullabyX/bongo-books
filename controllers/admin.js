const { validationResult } = require('express-validator');

const Book = require('../models/book');
const Author = require('../models/author');
const Publication = require('../models/publication');
const Genre = require('../models/genre');
const PendingBook = require('../models/pending-book');
const Tag = require('../models/tag');
const AuthorItem = require('../models/author-item');
const GenreItem = require('../models/genre-items');
const { deleteFile, deleteMultipleFiles } = require('../util/filehelper');
const fs = require('fs');
const path = require('path');
const PendingBookImage = require('../models/pending-book-image');

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

	let book;

	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		if (images.length > 0) {
			images.forEach((image) => {
				deleteFile(image.path);
			});
		}
		// return res.status(422).json({
		// 	message: errors.array(),
		// });
		req.flash('error', errors.array());
		await req.session.save();
		return res.status(422).redirect('/admin/add-book');
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
		for (let i = 0; i < authorsArray.length; i++) {
			const authorName = authorsArray[i];
			const author = await Author.findOne({
				where: { name: authorName },
			});
			if (!author) {
				// return res.status(404).json({
				// 	message: `Author ${authorName} is not found in our Database. Add author first.`,
				// });
				req.flash(
					'error',
					`Author ${authorName} is not found in our Database.`
				);
				await req.session.save();
				deleteMultipleFiles(images);
				return res.status(422).redirect('/admin/add-book');
			}
			authors.push(author);
		}
		for (let i = 0; i < genresArray.length; i++) {
			const genreName = genresArray[i];
			const genre = await Genre.findOne({
				where: { name: genreName },
			});
			if (!genre) {
				// return res.status(404).json({
				// 	message: `Author ${authorName} is not found in our Database. Add author first.`,
				// });
				req.flash(
					'error',
					`Genre ${genreName} is not found in our Database.`
				);
				await req.session.save();
				deleteMultipleFiles(images);
				return res.status(422).redirect('/admin/add-book');
			}
			genres.push(genre);
		}

		const publication = await Publication.findOne({
			where: { name: publicationName },
		});
		if (!publication) {
			// return res.status(404).json({
			// 	message: `Publication ${publicationName} does not exist in our database. Add publication?`,
			// });
			req.flash(
				'error',
				`Publication ${publicationName} is not found in our Database.`
			);
			await req.session.save();
			deleteMultipleFiles(images);
			return res.status(422).redirect('/admin/add-book');
		}
		book = await req.user.createBook({
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
		if (images.length > 0) {
			images.forEach(async (image) => {
				const source = path.join(__dirname, '../', image.path);
				const imagePath = 'images/book/' + book.id;
				let dest = path.join(__dirname, '../', imagePath);

				if (!fs.existsSync(dest)) {
					fs.mkdirSync(dest, { recursive: true });
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
		} else {
			await book.createBookImage({
				imageUrl: '/',
			});
		}

		res.status(201).redirect('/user/books');
	} catch (err) {
		if (book) {
			await book.destroy();
		}
		deleteMultipleFiles(images);
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
			include: [PendingBookImage],
		});
		totalBooks = pendingBooks.count;
		totalPages = Math.ceil(totalBooks / process.env.BOOKS_PER_PAGE);
		console.log(pendingBooks);
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
	const editing = req.query.edit;
	const pendingBookId = req.params.pendingBookId;
	try {
		const pendingBook = await PendingBook.findByPk(pendingBookId, {
			include: [PendingBookImage],
		});
		if (!pendingBook) {
			req.flash('error', 'Book not found in Pending-Books.');
			await req.session.save();
			return res.status(404).redirect('/admin/pending-books');
		}
		res.status(200).render('admin/edit-book', {
			edit: editing,
			book: pendingBook,
			pageTitle: 'Verifying ' + pendingBook.title,
			path: '/admin/pending-book',
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.postVerifyPendingBook = async (req, res, next) => {
	const pendingBookId = req.body.pendingBookId;

	const ISBN = req.body.ISBN || '';
	const publicationName = req.body.publicationName || '';
	const description = req.body.description || '';
	const publishDate = req.body.publishDate || '';
	const language = req.body.language || '';
	const authorsString = req.body.authors || '';
	const tagsString = req.body.tags || '';
	const genresString = req.body.genres || '';
	let book;

	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		req.flash('error', errors.array());
		await req.session.save();
		return res.status(422).redirect(`/admin/pending-book/${pendingBookId}`);
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
		// add authors
		for (let i = 0; i < authorsArray.length; i++) {
			const authorName = authorsArray[i];
			const author = await Author.findOne({
				where: { name: authorName },
			});
			if (!author) {
				// return res.status(404).json({
				// 	message: `Author ${authorName} is not found in our Database. Add author first.`,
				// });
				req.flash(
					'error',
					`Author ${authorName} is not found in our Database.`
				);
				await req.session.save();
				return res
					.status(422)
					.redirect(`/admin/pending-book/${pendingBookId}`);
			}
			authors.push(author);
		}
		//add genres
		for (let i = 0; i < genresArray.length; i++) {
			const genreName = genresArray[i];
			const genre = await Genre.findOne({
				where: { name: genreName },
			});
			if (!genre) {
				// return res.status(404).json({
				// 	message: `Author ${authorName} is not found in our Database. Add author first.`,
				// });
				req.flash(
					'error',
					`Genre ${genreName} is not found in our Database.`
				);
				await req.session.save();
				return res
					.status(422)
					.redirect(`/admin/pending-book/${pendingBookId}`);
			}
			genres.push(genre);
		}
		const publication = await Publication.findOne({
			where: { name: publicationName },
		});
		if (!publication) {
			req.flash(
				'error',
				`publication ${publicationName} is not found in our Database.`
			);
			await req.session.save();
			return res
				.status(422)
				.redirect(`/admin/pending-book/${pendingBookId}`);
		}
		const pendingBook = await PendingBook.findByPk(pendingBookId);
		if (!pendingBook) {
			const error = new Error('Book not found in Pending-Books.');
			error.statusCode = 404;
			throw error;
		}
		book = await Book.create({
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
		await book.addGenres(genres);
		const pendingBookImages = await pendingBook.getPendingBookImages();
		tagsArray.forEach(async (tag) => {
			await book.createTag({
				name: tag,
			});
		});
		if (pendingBookImages.length > 0) {
			pendingBookImages.forEach(async (image) => {
				const source = path.join(__dirname, '../', image.imageUrl);
				const imagePath = 'images/book/' + book.id;
				let dest = path.join(__dirname, '../', imagePath);

				if (!fs.existsSync(dest)) {
					fs.mkdirSync(dest, { recursive: true });
				}
				const filename = path.basename(image.imageUrl);
				dest = dest + '/' + filename;
				await book.createBookImage({
					imageUrl: '/' + imagePath + '/' + filename,
				});
				fs.renameSync(source, dest);
			});
		} else {
			await book.createBookImage({
				imageUrl: '/',
			});
		}
		await pendingBook.destroy();
		req.flash('success', `Book ${book.title} is varified and listed.`);
		await req.session.save();
		res.status(202).redirect('/admin/pending-books');
		// res.status(201).json({
		// 	message: 'success',
		// });
	} catch (err) {
		if (book) {
			await book.destroy();
		}
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.postDeletePendingBook = async (req, res, next) => {
	const bookId = req.body.bookId;

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
			await pendingBook.destroy();
			res.status(202).json({
				message: 'Pending book is deleted',
			});
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
				res.status(200).render('admin/edit-book', {
					edit: editing,
					book: book,
					pageTitle: 'Editing ' + book.title,
					path: '/admin/edit-book',
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
		res.status(404).redirect('/books');
	}
};

exports.postEditBook = async (req, res, next) => {
	const bookId = req.body.bookId || 0;
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
		req.flash('error', errors.array());
		await req.session.save();
		res.status(422).redirect(`/admin/edit-book/${bookId}?edit=true`);
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
			let authors = [];
			let genres = [];
			// add authors
			for (let i = 0; i < authorsArray.length; i++) {
				const authorName = authorsArray[i];
				const author = await Author.findOne({
					where: { name: authorName },
				});
				if (!author) {
					// return res.status(404).json({
					// 	message: `Author ${authorName} is not found in our Database. Add author first.`,
					// });
					req.flash(
						'error',
						`Author ${authorName} is not found in our Database.`
					);
					await req.session.save();
					deleteMultipleFiles(updatedImages);
					return res
						.status(422)
						.redirect(`/admin/edit-book/${bookId}?edit=true`);
				}
				authors.push(author);
			}
			//add genres
			for (let i = 0; i < genresArray.length; i++) {
				const genreName = genresArray[i];
				const genre = await Genre.findOne({
					where: { name: genreName },
				});
				if (!genre) {
					// return res.status(404).json({
					// 	message: `Author ${authorName} is not found in our Database. Add author first.`,
					// });
					req.flash(
						'error',
						`Genre ${genreName} is not found in our Database.`
					);
					await req.session.save();
					deleteMultipleFiles(updatedImages);
					return res
						.status(422)
						.redirect(`/admin/edit-book/${bookId}?edit=true`);
				}
				genres.push(genre);
			}

			const publication = await Publication.findOne({
				where: { name: updatedPublicationName },
			});
			if (!publication) {
				req.flash(
					'error',
					`Publication ${updatedPublicationName} is not found in our Database.`
				);
				await req.session.save();
				deleteMultipleFiles(updatedImages);
				return res
					.status(422)
					.redirect(`/admin/edit-book/${bookId}?edit=true`);
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
			/////////delete existing publication, tags, genre////////////
			await GenreItem.destroy({ where: { bookId: book.id } });
			await AuthorItem.destroy({ where: { bookId: book.id } });
			await Tag.destroy({ where: { bookId: book.id } });
			////////////////////////////////////////////////////////////
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
						fs.mkdirSync(dest, { recursive: true });
					}
					dest = dest + '/' + image.filename;
					await book.createBookImage({
						imageUrl: '/' + imagePath + '/' + image.filename,
					});
					fs.rename(source, dest, (err) => {
						if (err) {
							console.log(err);
						}
					});
				});
			}

			res.status(202).redirect('/user/books');
		} else {
			if (updatedImages.length > 0) {
				updatedImages.forEach((image) => {
					deleteFile(image.path);
				});
			}
			req.flash('error', 'Unauthorized!');
			await req.session.save();
			res.status(404).redirect('/user/books');
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
			res.status(404).redirect('/');
		} else {
			const bookImages = await book.getBookImages();
			if (bookImages.length > 0) {
				bookImages.forEach((image) => {
					deleteFile(image.imageUrl);
				});
			}
			await book.destroy();

			res.status(202).json({
				message: 'Book is deleted',
			});
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

exports.postAddAuthor = async (req, res, next) => {
	const name = req.body.name;
	const image = req.file;
	const description = req.body.description;
	try {
		const imageUrl = `/${image ? image.path : ''}`;
		const author = await Author.findOne({ where: { name: name } });
		if (author) {
			if (image) {
				deleteFile(image.path);
			}
			// return res.status(303).json({
			// 	message: 'Author already exist',
			// 	name: name,
			// 	imageUrl: imageUrl,
			// 	description: description,
			// });
			req.flash('error', 'Author already exists!');
			await req.session.save();
			return res.status(404).redirect('/admin/add-author');
		}
		await Author.create({
			name: name,
			imageUrl: imageUrl,
			description: description,
		});

		// res.status(201).json({
		// 	message: 'Successfully Added Author',
		// 	name: name,
		// 	imageUrl: imageUrl,
		// 	description: description,
		// });
		req.flash('success', 'Author Added!');
		await req.session.save();
		res.status(201).redirect('/admin/add-author');
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
	try {
		const author = await Author.findByPk(authorId);
		if (!author) {
			if (image) {
				deleteFile(image.path);
			}
			// return res.status(404).json({
			// 	message: 'Author not found. Check author id.',
			// });
			req.flash('error', 'Author not found!');
			await req.session.save();
			return res.status(404).redirect('/authors');
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

		// res.status(201).json({
		// 	message: 'Successfully Updated Author',
		// 	name: name,
		// 	imageUrl: imageUrl,
		// 	description: description,
		// });
		req.flash('success', 'Author Updated!');
		await req.session.save();
		res.status(201).redirect('/authors');
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
			edit: false,
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

exports.postAddPublication = async (req, res, next) => {
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
			// return res.status(303).json({
			// 	message: 'Publication already exist',
			// 	name: name,
			// 	imageUrl: imageUrl,
			// 	description: description,
			// });
			req.flash('error', 'Publication already exists!');
			await req.session.save();
			return res.status(404).redirect('/admin/add-publication');
		}
		const imageUrl = `/${image ? image.path : ''}`;
		await Publication.create({
			name: name,
			imageUrl: imageUrl,
			description: description,
		});

		// res.status(201).json({
		// 	message: 'Successfully Added Publication',
		// 	name: name,
		// 	imageUrl: imageUrl,
		// 	description: description,
		// });
		req.flash('success', 'Publication Added!');
		await req.session.save();
		res.status(201).redirect('/admin/add-publication');
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
			// return res.status(404).json({
			// 	message: 'Publication not found. Check publication id.',
			// });
			req.flash('error', 'Publication not found!');
			await req.session.save();
			return res.status(404).redirect('/publications');
		}
		let imageUrl = publication.imageUrl;
		if (image) {
			if (imageUrl) {
				deleteFile(imageUrl);
			}
			imageUrl = `/${image.path}`;
		}
		publication.name = name;
		publication.imageUrl = imageUrl;
		publication.description = description;

		await publication.save();

		// res.status(201).json({
		// 	message: 'Successfully Updated Publication',
		// 	name: name,
		// 	imageUrl: imageUrl,
		// 	description: description,
		// });
		req.flash('success', 'Publication Updated!');
		await req.session.save();
		res.status(201).redirect('/publications');
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
			edit: false,
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

exports.postAddGenre = async (req, res, next) => {
	const name = req.body.name;
	const image = req.file;
	const description = req.body.description;
	try {
		const genre = await Genre.findOne({ where: { name: name } });
		if (genre) {
			if (image) {
				deleteFile(image.path);
			}
			// return res.status(303).json({
			// 	message: 'Genre already exist',
			// 	name: name,
			// 	imageUrl: imageUrl,
			// 	description: description,
			// });
			req.flash('error', 'Genre already exists!');
			await req.session.save();
			return res.status(404).redirect('/admin/add-genre');
		}
		const imageUrl = `/${image ? image.path : ''}`;
		await Genre.create({
			name: name,
			imageUrl: imageUrl,
			description: description,
		});
		// res.status(201).json({
		// 	message: 'Successfully Added Genre',
		// 	name: name,
		// 	imageUrl: imageUrl,
		// 	description: description,
		// });
		req.flash('success', 'Genre Added!');
		await req.session.save();
		res.status(201).redirect('/admin/add-genre');
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
			// return res.status(404).json({
			// 	message: 'Genre not found. Check genre id.',
			// });
			req.flash('error', 'Genre not found!');
			await req.session.save();
			return res.status(404).redirect('/genres');
		}
		let imageUrl = genre.imageUrl;
		if (image) {
			if (imageUrl) {
				deleteFile(imageUrl);
			}
			imageUrl = `/${image.path}`;
		}
		genre.name = name;
		genre.imageUrl = imageUrl;
		genre.description = description;

		await genre.save();

		// res.status(201).json({
		// 	message: 'Successfully Updated Genre',
		// 	name: name,
		// 	imageUrl: imageUrl,
		// 	description: description,
		// });
		req.flash('success', 'Genre Updated!');
		await req.session.save();
		res.status(201).redirect('/genres');
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

exports.postDeleteReview = async (req, res, next) => {
	try {
		const reviewId = req.body.reviewId;
		const review = Review.findByPk(reviewId);
		if (!review) {
			return res.status(404).json({
				message: 'Review not found',
			});
		}
		await review.destroy();
		res.status(201).json({
			message: 'Review deleted',
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

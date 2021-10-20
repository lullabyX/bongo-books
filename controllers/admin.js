const User = require('../models/user');
const Book = require('../models/book');
const Author = require('../models/author');
const Publication = require('../models/publication');
const Genre = require('../models/genre');

exports.getBooks = async (req, res, next) => {
	try {
		const books = await Book.findAll({ where: { userId: req.user.id } });
		res.status(200).render('admin/books', {
			books: books,
			pageTitle: 'Admin Books',
			path: '/admin/books',
		});
	} catch (err) {
		console.log(err);
	}
};

exports.getAddBook = async (req, res, next) => {
	try {
		res.status(200).render('admin/edit-book', {
			pageTitle: 'Add Book',
			path: '/admin/add-book',
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
	const genreName = req.body.genreName;
	const description = req.body.description;

	try {
		const publication = await Publication.findOne({
			where: { name: publicationName },
		});
		if (!publication) {
			return res.status(404).json({
				message:
					'Publication does not exist in our database. Add publication?',
			});
		}
		const genre = await Genre.findOne({
			where: { name: genreName },
		});
		if (!genre) {
			return res.status(404).json({
				message: 'Genre does not exist in our database. Add genre?',
			});
		}
		const book = await req.user.createBook({
			title: title,
			imageUrl: imageUrl,
			price: price,
			ISBN: ISBN,
			description: description,
		});
		await publication.addBook(book);
		await genre.addBook(book);
		console.log(book);
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
				res.status(200).render('admin/edit-book', {
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
			console.log(err);
		}
	} else {
		res.redirect('/');
	}
};

exports.postEditBook = async (req, res, next) => {
	const bookId = req.body.id;
	const updatedTitle = req.body.title;
	const updatedImageUrl = req.body.imageUrl;
	const updatedPrice = req.body.price;
	const updatedISBN = req.body.ISBN;
	const updatedDescription = req.body.description;

	try {
		const book = await Book.findOne({
			where: {
				id: bookId,
				userId: req.user.id,
			},
		});

		if (book) {
			book.title = updatedTitle;
			book.imageUrl = updatedImageUrl;
			book.price = updatedPrice;
			book.ISBN = updatedISBN;
			book.authorId = updatedAuthorId;
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
			res.status(404).redirect('/admin/books');
		} else {
			await book.destroy();
			res.status(200).redirect('/admin/books');
		}
	} catch (err) {
		console.log(err);
	}
};

exports.postAuthor = async (req, res, next) => {
	const name = req.body.name;
	const imageUrl = req.body.imageUrl;
	const description = req.body.description;
	console.log(name);
	try {
		const author = await Author.create({
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
		console.log(err);
	}
};

exports.postPublication = async (req, res, next) => {
	const name = req.body.name;
	const imageUrl = req.body.imageUrl;
	const description = req.body.description;
	console.log(name);
	try {
		const publication = await Publication.create({
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
		console.log(err);
	}
};

exports.postGenre = async (req, res, next) => {
	const name = req.body.name;
	const imageUrl = req.body.imageUrl;
	const description = req.body.description;
	try {
		const genre = await Genre.create({
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
		console.log(err);
	}
};

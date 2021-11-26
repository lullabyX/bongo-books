const express = require('express');
const { body } = require('express-validator');

const router = express.Router();

const adminController = require('../controllers/admin');
const uploadController = require('../controllers/upload');
const isAdmin = require('../middleware/isAdmin');

// GET -> /admin/books shows listed items by that user
router.get('/books', isAdmin, adminController.getBooks);

// GET -> /admin/add-book gets the add-book page
router.get(
	'/add-book',
	[body('price').isFloat().withMessage('Price must be floating point')],
	isAdmin,
	adminController.getAddBook
);

// POST -> /admin/add-book posts a book under the user
router.post(
	'/add-book',
	// [body('price').isFloat().withMessage('Price must be floating point')],
	isAdmin,
	uploadController.multiple,
	adminController.postAddBook
);

// GET -> /admin/edit-book gets the edit-book page
router.get('/edit-book/:bookId', isAdmin, adminController.getEditBook);

// POST -> /admin/edit-book posts the edited book NOTE: bookId as "id" should be passed in body
router.post(
	'/edit-book',
	// [body('price').isFloat().withMessage('Price must be floating point')],
	isAdmin,
	uploadController.multiple,
	adminController.postEditBook
);

// POST -> /admin/delete-book deletes a book NOTE: bookId as "id" should be passed in body
router.post('/delete-book', isAdmin, adminController.postDeleteBook);

// GET -> /admin/add-author
router.get('/add-author', isAdmin, adminController.getAddAuthor);

// POST -> /admin/add-author
router.post(
	'/add-author',
	isAdmin,
	uploadController.single,
	adminController.postAuthor
);

// POST -> /admin/edit-genre
router.post(
	'/edit-author',
	isAdmin,
	uploadController.single,
	adminController.postEditAuthor
);

// GET -> /admin/add-publication
router.get('/add-publication', isAdmin, adminController.getAddPublication);

// POST -> /admin/add-publication
router.post(
	'/add-publication',
	isAdmin,
	uploadController.single,
	adminController.postPublication
);

// POST -> /admin/edit-publication
router.post(
	'/edit-publication',
	isAdmin,
	uploadController.single,
	adminController.postEditPublication
);

// GET -> /admin/add-genre
router.get('/add-genre', isAdmin, adminController.getAddGenre);

// POST -> /admin/add-genre
router.post(
	'/add-genre',
	isAdmin,
	uploadController.single,
	adminController.postGenre
);

// POST -> /admin/edit-genre
router.post(
	'/edit-genre',
	isAdmin,
	uploadController.single,
	adminController.postEditGenre
);

// GET -> /admin/pending-books
router.get('/pending-books', isAdmin, adminController.getPendingBooks);

// GET -> /admin/pending-book/:pendingBookId
router.get(
	'/pending-book/:pendingBookId',
	isAdmin,
	adminController.getPendingBook
);

// POST -> /admin/pending-book
router.post('/pending-book', isAdmin, adminController.postVerifyPendingBooks);

// POST -> /admin/delete-pending-books
router.post(
	'/delete-pending-book',
	isAdmin,
	adminController.postDeletePendingBook
);

module.exports = router;

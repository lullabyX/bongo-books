const express = require('express');

const router = express.Router();

const adminController = require('../controllers/admin');
const isAdmin = require('../middleware/isAdmin');

// GET -> /admin/books shows listed items by that user
router.get('/books', isAdmin, adminController.getBooks);

// GET -> /admin/add-book gets the add-book page
router.get('/add-book', isAdmin, adminController.getAddBook);

// POST -> /admin/add-book posts a book under the user
router.post('/add-book', isAdmin, adminController.postAddBook);

// GET -> /admin/edit-book gets the edit-book page
router.get('/edit-book/:bookId', isAdmin, adminController.getEditBook);

// POST -> /admin/edit-book posts the edited book NOTE: bookId as "id" should be passed in body
router.post('/edit-book', isAdmin, adminController.postEditBook);

// POST -> /admin/delete-book deletes a book NOTE: bookId as "id" should be passed in body
router.post('/delete-book', isAdmin, adminController.postDeleteBook);

// GET -> /admin/author
router.get('/authors', isAdmin, adminController.getAuthors);

// POST -> /admin/add-author
router.post('/add-author', isAdmin, adminController.postAuthor);

// POST -> /admin/edit-genre
router.post('/edit-author', isAdmin, adminController.postEditAuthor);

// GET -> /admin/publications
router.get('/publications', isAdmin, adminController.getPublications);

// POST -> /admin/add-publication
router.post('/add-publication', isAdmin, adminController.postPublication);

// POST -> /admin/edit-publication
router.post('/edit-publication', isAdmin, adminController.postEditPublication);

// GET -> /admin/genres
router.get('/genres', isAdmin, adminController.getGenres);

// POST -> /admin/add-genre
router.post('/add-genre', isAdmin, adminController.postGenre);

// POST -> /admin/edit-genre
router.post('/edit-genre', isAdmin, adminController.postEditGenre);

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

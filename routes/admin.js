const express = require('express');

const router = express.Router();

const adminController = require('../controllers/admin')
const isAuth = require('../middleware/isAuth');

//GET -> /admin/books shows listed items by that user
router.get('/books', isAuth, adminController.getBooks);

//GET -> /admin/add-book gets the add-book page
router.get('/add-book', isAuth, adminController.getAddBook);

//POST -> /admin/add-book posts a book under the user
router.post('/add-book', isAuth, adminController.postAddBook);

//GET -> /admin/edit-book gets the edit-book page
router.get('/edit-book/:bookId', isAuth, adminController.getEditBook)

//POST -> /admin/edit-book posts the edited book NOTE: bookId as "id" should be passed in body
router.post('/edit-book', isAuth, adminController.postEditBook)

//POST -> /admin/delete-book deletes a book NOTE: bookId as "id" should be passed in body
router.post('/delete-book', isAuth, adminController.postDeleteBook);

//POST -> /admin/add-author
router.post('/add-author', adminController.postAuthor);

//POST -> /admin/add-publication
router.post('/add-publication', adminController.postPublication);

//POST -> /admin/add-genre
router.post('/add-genre', adminController.postGenre);


module.exports = router;
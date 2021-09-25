const express = require('express');

const router = express.Router();

const adminController = require('../controllers/admin')

//GET -> /admin/books shows listed items by that user
router.get('/books', adminController.getBooks);

//GET -> /admin/add-book gets the add-product page
router.get('/add-book', adminController.getAddBook);

//POST -> /admin/add-book posts a product under the user
router.post('/add-book', adminController.postAddBook);

//GET -> /admin/edit-book gets the edit-book page
router.get('/edit-book/:bookId', adminController.getEditBook)

//POST -> /admin/edit-book posts the edited book NOTE: bookId as "id" should be passed in body
router.post('/edit-book', adminController.postEditBook)

//POST -> /admin/delete-book deletes a book NOTE: bookId as "id" should be passed in body
router.post('/delete-book', adminController.postDeleteBook);

module.exports = router;
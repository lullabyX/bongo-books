const express = require('express');

const router = express.Router();

const adminController = require('../controllers/admin')

//GET -> /admin/books shows listed items by that user
router.get('/books', adminController.getBooks);

//GET -> /admin/add-book gets the add-product page
router.get('/add-book', adminController.getAddBook);

//POST -> /admin/add-book posts a product under the user
router.post('/add-book', adminController.postAddBook);

module.exports = router;
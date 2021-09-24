const express = require('express');

const router = express.Router();

const shopController = require('../controllers/shop');

// GET -> / loads the front/index page
router.get('/', shopController.getIndex);

// GET -> /books lists all the products
router.get('/books', shopController.getBooks);

module.exports = router;
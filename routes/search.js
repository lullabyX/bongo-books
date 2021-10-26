const express = require('express');
const router = express.Router();

const searchController = require('../controllers/search');

router.get('/', searchController.getGeneralSearch);

module.exports = router;
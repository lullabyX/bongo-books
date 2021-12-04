const { query } = require('express-validator');
const express = require('express');

const router = express.Router();

const searchController = require('../controllers/search');

// GET-> /search
// router.get('/', searchController.getGeneralSearch);

// GET /search/filter
router.get('/', searchController.getFilteredSearch);

module.exports = router;

const Sequelize = require('sequelize');
const sequelize = require('../util/database');
const Book = require('./book');

const RatingItem = sequelize.define('ratingItem', {
	id: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		allowNull: false,
		autoIncrement: true,
	},
    bookId: {
        type: Sequelize.INTEGER,
        reference: {model: Book, key: 'id'},
        allowNull: false,
    },
    rating: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 5
        }
    }
});

module.exports = RatingItem;

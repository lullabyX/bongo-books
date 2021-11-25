const Sequelize = require('sequelize');
const sequelize = require('../util/database');
const User = require('./user');

const Review = sequelize.define('review', {
	id: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		allowNull: false,
		autoIncrement: true,
	},
	review: {
		type: Sequelize.TEXT,
		allowNull: false,
	},
	userId: {
		type: Sequelize.INTEGER,
		allowNull: false,
		reference: { model: User, key: 'id' },
	},
	varifiedPurchase: {
		type: Sequelize.BOOLEAN,
		allowNull: false,
		defaultValue: false,
	},
});

module.exports = Review;

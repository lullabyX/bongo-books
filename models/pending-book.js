const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const PendingBook = sequelize.define('pendingBooks', {
	id: {
		type: Sequelize.INTEGER,
		autoIncrement: true,
		primaryKey: true,
		allowNull: false,
	},
	title: {
		type: Sequelize.STRING,
		allowNull: false,
	},
	imageUrl: {
		type: Sequelize.STRING,
		allowNull: false,
	},
	price: {
		type: Sequelize.FLOAT,
		allowNull: false,
	},
	ISBN: {
		type: Sequelize.STRING,
		allowNull: true,
	},
	description: {
		type: Sequelize.TEXT,
		allowNull: false,
	},
	publishDate: Sequelize.STRING,
	language: Sequelize.STRING,
});

module.exports = PendingBook;

const Sequelize = require('sequelize');

const sequelize = require('../util/database');

const Author = sequelize.define('authors', {
	id: {
		type: Sequelize.INTEGER,
		autoIncrement: true,
		primaryKey: true,
		allowNull: false,
	},
	name: {
		type: Sequelize.STRING,
		allowNull: false,
	},
	imageUrl: {
		type: Sequelize.STRING,
		allowNull: true,
	},
	description: {
		type: Sequelize.TEXT,
		allowNull: true,
	},
});

module.exports = Author;

const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const PendingBookImage = sequelize.define('pendingBookImage', {
	id: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true,
		allowNull: false,
	},
	imageUrl: {
		type: Sequelize.STRING,
		allowNull: false,
	},
});

module.exports = PendingBookImage;

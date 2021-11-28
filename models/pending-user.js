const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const PendingUser = sequelize.define('pendingUser', {
	id: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true,
		allowNull: false,
	},
	username: {
		type: Sequelize.STRING,
		allowNull: false,
	},
	email: {
		type: Sequelize.STRING,
		allowNull: false,
	},
	password: {
		type: Sequelize.STRING,
		allowNull: false,
	},
	token: Sequelize.STRING,
	tokenTimeout: Sequelize.DATE,
});

module.exports = PendingUser;

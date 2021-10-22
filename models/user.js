const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const User = sequelize.define('users', {
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
	userType: {
		type: Sequelize.STRING,
		defaultValue: 'regular',
	},
	primaryPhone: Sequelize.STRING,
	avatar: Sequelize.STRING,
	firstName: Sequelize.STRING,
	lastName: Sequelize.STRING,
	employeeId: Sequelize.STRING,
	resetToken: Sequelize.STRING,
	resetTokenTimeout: Sequelize.DATE,
});

module.exports = User;

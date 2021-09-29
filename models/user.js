const Sequelize = require("sequelize");
const sequelize = require("../util/database");

const User = sequelize.define('users', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    contactId: {
        type: Sequelize.INTEGER,
    },
    resetToken: Sequelize.STRING,
    resetTokenTimeout: Sequelize.DATE,
});

module.exports = User;
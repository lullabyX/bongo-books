const Sequelize = require('sequelize');
const sequelize = require("../util/database");

const AuthorItem = sequelize.define("authorItems", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
    }
});

module.exports = AuthorItem;
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Trips = sequelize.define('Trips', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    distance: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    earnings: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    startTime: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    endTime: {
        type: DataTypes.DATE,
        allowNull: false,
    },
});

module.exports = Trips;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConfig');

const AuditLog = sequelize.define('AuditLog', {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    action: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    details: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    ipAddress: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    timestamps: true,
});

module.exports = AuditLog;

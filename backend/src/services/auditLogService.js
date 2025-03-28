const AuditLog = require('../models/auditLogModel');
const logger = require('../utils/logger');

const logAction = async (userId, action, details, ipAddress) => {
    await AuditLog.create({ userId, action, details, ipAddress });

    logger.info(JSON.stringify({ userId, action, details, ipAddress, timestamp: new Date().toISOString() }));
};

module.exports = logAction;

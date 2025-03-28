const Redis = require('ioredis');
const redisClient = new Redis(process.env.REDIS_URL);

const cacheMiddleware = async (req, res, next) => {
    const key = `cache:${req.originalUrl}`;
    const cachedData = await redisClient.get(key);

    if (cachedData) {
        return res.json(JSON.parse(cachedData));
    }

    res.sendResponse = res.json;
    res.json = (body) => {
        redisClient.setex(key, 300, JSON.stringify(body)); // Expira em 5 min
        res.sendResponse(body);
    };

    next();
};

module.exports = cacheMiddleware;

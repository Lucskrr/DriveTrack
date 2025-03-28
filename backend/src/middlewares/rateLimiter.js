const rateLimit = require('express-rate-limit');
const Redis = require('ioredis');

// Configure a conexão com o Redis (certifique-se que o REDIS_URL está definido no .env)
const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Testa a conexão com o Redis
redisClient.ping().then((result) => {
    console.log(`Redis conectado com sucesso: ${result}`); // Deve mostrar: PONG
}).catch((err) => {
    console.error('Erro ao conectar ao Redis:', err);
});

// Limite de 5 tentativas de login em 15 minutos
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, 
    message: { error: 'Muitas tentativas de login. Tente novamente mais tarde.' },
    handler: async (req, res) => {
        const ip = req.ip;
        try {
            await redisClient.setex(`blocked:${ip}`, 900, 'blocked'); // Bloqueia IP por 15 minutos
            return res.status(429).json({ error: 'Muitas tentativas de login. Tente novamente mais tarde.' });
        } catch (error) {
            console.error('Erro ao conectar com Redis para bloquear o IP:', error);
            return res.status(500).json({ error: 'Erro interno do servidor.' });
        }
    },
    keyGenerator: (req) => req.ip,
});

module.exports = { loginLimiter };

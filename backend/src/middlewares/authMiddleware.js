const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const Redis = require('ioredis');

// Carregar a chave pública de forma segura
let publicKey;
try {
    publicKey = fs.readFileSync(path.resolve(process.env.JWT_PUBLIC_KEY), 'utf8');
} catch (err) {
    console.error("Erro ao carregar a chave pública:", err.message);
    process.exit(1); // Caso a chave não seja carregada, parar o processo
}

const redisClient = new Redis(process.env.REDIS_URL);

const authenticateToken = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'Acesso não autorizado. Token ausente.' });
    }

    try {
        // Verificar se o token está na blacklist (logout)
        const isBlacklisted = await redisClient.get(`blacklist:${token}`);
        if (isBlacklisted) {
            return res.status(403).json({ message: 'Token inválido ou expirado (blacklist).' });
        }

        // Validar o token com a chave pública
        const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });

        // Atribuir os dados do usuário ao `req.user` e também o token ao `req.token`
        req.user = decoded;
        req.token = token;  // Isso garante que o token estará disponível para o logoutUser
        next();
    } catch (error) {
        // Diferenciar entre erro de token expirado e erro geral
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: 'Token expirado. Faça login novamente.' });
        }
        
        return res.status(403).json({ message: 'Token inválido ou erro ao verificar o token.' });
    }
};

module.exports = authenticateToken;

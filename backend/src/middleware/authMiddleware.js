const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    // Obtenha o token do cabeçalho da requisição
    const token = req.header('Authorization')?.replace('Bearer ', '');  // Espera que o token seja enviado como 'Bearer <token>'
    
    if (!token) {
        return res.status(401).json({ message: 'Acesso não autorizado. Token de autenticação ausente.' });
    }

    // Verifique o token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token inválido ou expirado.' });
        }
        req.user = user;  // Armazena o usuário no objeto da requisição para uso nas próximas etapas
        next();  // Se o token for válido, passa para a próxima função
    });
};

module.exports = authenticateToken;

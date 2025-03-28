const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateToken = require('../middlewares/authMiddleware');
const { loginLimiter } = require('../middlewares/rateLimiter');
const cacheMiddleware = require('../middlewares/cacheMiddleware');

/**
 * @swagger
 * tags:
 *   name: Usuários
 *   description: Endpoints relacionados aos usuários
 */

// Registrar usuário
router.post('/register', userController.registerUser);

// Login do usuário
router.post('/login', loginLimiter, (req, res, next) => {
    req.ipAddress = req.ip;
    next();
}, userController.loginUser);

// Perfil do usuário
router.get('/profile', authenticateToken, userController.getUserProfile);
router.put('/profile', authenticateToken, userController.updateUser);
router.delete('/profile', authenticateToken, userController.deleteUser);

// Recuperação de senha
router.post('/request-password-reset', userController.requestPasswordReset);
router.post('/reset-password', userController.resetPassword);

// Obter usuário por ID
router.get('/:id', authenticateToken, cacheMiddleware, userController.getUserById);

// Obter todos os usuários
router.get('/', authenticateToken, cacheMiddleware, userController.getUsers);

module.exports = router;

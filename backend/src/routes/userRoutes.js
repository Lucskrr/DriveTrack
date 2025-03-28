const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateToken = require('../middleware/authMiddleware');

// Rota para registrar usuário
router.post('/register', userController.registerUser);

// Rota para login de usuário
router.post('/login', userController.loginUser);

// Rota para obter o perfil do usuário (protegida)
router.get('/profile', authenticateToken, userController.getUserProfile);

// Rota para atualizar dados do usuário (protegida)
router.put('/profile', authenticateToken, userController.updateUser);

// Rota para deletar conta do usuário (protegida)
router.delete('/profile', authenticateToken, userController.deleteUser);

// 🔹 NOVAS ROTAS PARA RECUPERAÇÃO DE SENHA 🔹
// Rota para solicitar recuperação de senha
router.post('/request-password-reset', userController.requestPasswordReset);

// Rota para redefinir a senha com token
router.post('/reset-password', userController.resetPassword);

module.exports = router;

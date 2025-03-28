const userService = require('../services/userService');

// Registrar um novo usuário
const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const newUser = await userService.createUser(name, email, password);
        res.status(201).json({ message: 'Usuário registrado com sucesso.', user: newUser });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Login do usuário
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const { user, token } = await userService.authenticateUser(email, password);
        res.json({ message: 'Login realizado com sucesso.', user, token });
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
};

// Solicitar recuperação de senha
const requestPasswordReset = async (req, res) => {
    const { email } = req.body;

    try {
        await userService.requestPasswordReset(email);
        res.json({ message: 'E-mail de recuperação de senha enviado. Verifique sua caixa de entrada.' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Redefinir senha
const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        await userService.resetPassword(token, newPassword);
        res.json({ message: 'Senha redefinida com sucesso.' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Atualizar usuário
const updateUser = async (req, res) => {
    const { name, email, password } = req.body;
    const userId = req.user.id;

    try {
        const updatedUser = await userService.updateUser(userId, name, email, password);

        if (!updatedUser) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        res.json({ message: 'Usuário atualizado com sucesso.', user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar usuário.', error });
    }
};

// Deletar conta do usuário
const deleteUser = async (req, res) => {
    const userId = req.user.id;

    try {
        await userService.deleteUser(userId);
        res.json({ message: 'Conta deletada com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao deletar conta.', error });
    }
};

const getUserProfile = async (req, res) => {
    try {
        const user = await userService.getUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar perfil do usuário.', error });
    }
};

module.exports = { 
    registerUser, 
    loginUser, 
    requestPasswordReset, 
    resetPassword, 
    updateUser, 
    deleteUser,
    getUserProfile
};

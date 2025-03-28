import React, { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import axios from 'axios';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const loginUser = async () => {
        try {
            const response = await axios.post('http://localhost:5000/api/users/login', { email, password });
            if (response.data.token) {
                // Salve o token e navegue para a tela de home
                navigation.navigate('Home');
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <View>
            <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
            />
            <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            <Button title="Login" onPress={loginUser} />
        </View>
    );
};

export default LoginScreen;

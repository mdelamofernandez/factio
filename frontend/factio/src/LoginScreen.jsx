import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    ImageBackground,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSignUp = () => {
        // Aquí puedes llamar a tu API / base de datos para registrar al usuario
        console.log({ email, username, password });
    };

    return (
        <ImageBackground
            source={require('../assets/background.png')}
            style={styles.background}
            imageStyle={styles.backgroundImage}
        >
            <Text style={styles.title}>Factio</Text>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputWrapper}>
                    <Icon name="envelope" size={18} color="#888" style={styles.icon} />
                    <TextInput
                        style={styles.input}
                        placeholder="yourname@gmail.com"
                        placeholderTextColor="#aaa"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                    />
                </View>

                <Text style={styles.label}>Your Name</Text>
                <View style={styles.inputWrapper}>
                    <Icon name="user" size={18} color="#888" style={styles.icon} />
                    <TextInput
                        style={styles.input}
                        placeholder="@yourname"
                        placeholderTextColor="#aaa"
                        autoCapitalize="none"
                        value={username}
                        onChangeText={setUsername}
                    />
                </View>

                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                    <Icon name="key" size={18} color="#888" style={styles.icon} />
                    <TextInput
                        style={styles.input}
                        placeholder="********"
                        placeholderTextColor="#aaa"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />
                </View>

                <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
                    <Text style={styles.signUpText}>Sign up</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.orText}>Or sign up with</Text>

            <View style={styles.socialContainer}>
                <TouchableOpacity style={styles.socialButton}>
                    <Icon name="google" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                    <Icon name="apple" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                    <Icon name="facebook" size={24} color="#fff" />
                </TouchableOpacity>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        alignItems: 'center',
        paddingTop: height * 0.1,
        backgroundColor: '#000',
    },
    backgroundImage: {
        resizeMode: 'cover',
        opacity: 0.3,
    },
    title: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 40,
    },
    inputContainer: {
        width: '85%',
    },
    label: {
        color: '#fff',
        marginBottom: 6,
        fontSize: 14,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
        marginBottom: 20,
        paddingHorizontal: 12,
    },
    icon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        height: 48,
        color: '#fff',
    },
    signUpButton: {
        backgroundColor: '#C84DF5',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    signUpText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    orText: {
        color: '#aaa',
        marginTop: 30,
        marginBottom: 16,
    },
    socialContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '60%',
    },
    socialButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 12,
        borderRadius: 8,
    },
});

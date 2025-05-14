// app/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';

export default function Layout() {
    return (
        <Stack
            // Elige aquí la pantalla que quieras ver al arrancar la app:
            initialRouteName="signup"
            screenOptions={{
                headerShown: false, // oculta el header nativo
            }}
        />
    );
}

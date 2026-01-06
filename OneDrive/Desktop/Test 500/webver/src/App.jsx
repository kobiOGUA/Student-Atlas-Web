import React, { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './utils/ThemeContext';
import AppRouter from './navigation/AppRouter';

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ThemeProvider>
                    <AppRouter />
                </ThemeProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;

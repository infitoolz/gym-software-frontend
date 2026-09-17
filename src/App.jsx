import { SidebarProvider } from './context/useSidebarContext';
import { AuthProvider } from './context/AuthContext';
import { CallProvider } from './context/CallContext';
import AppRoutes from './routes/AppRoutes';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

function App() {
    return (
        <AuthProvider>
            <SidebarProvider>
                <CallProvider>
                    <BrowserRouter>
                        <AppRoutes />
                    </BrowserRouter>
                </CallProvider>
            </SidebarProvider>
        </AuthProvider>
    );
}

export default App;
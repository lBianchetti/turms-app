import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useJsApiLoader } from '@react-google-maps/api'; // 1. Importar o hook aqui
import { auth } from './config/firebase';

import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import PlanningPage from './pages/PlanningPage';
import AdminPage from './pages/AdminPage';
import DriverSelectionPage from './pages/DriverSelectionPage';
import DriverView from './pages/DriverView';
import ReportsPage from './pages/ReportsPage';
import MainLayout from './layouts/MainLayout';
import { Truck } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;

function App() {
    const [user, setUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [currentView, setCurrentView] = useState({ page: 'dashboard', params: {} }); 

    // 2. Carregar a API do Google Maps a nível global
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: ['places'], // Carregar a biblioteca 'places' necessária para o autocomplete
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser); 
            setLoadingAuth(false);
        });
        return () => unsubscribe();
    }, []);

    const navigateTo = (page, params = {}) => setCurrentView({ page, params });

    const renderOperatorPage = () => {
        // 3. Passar 'isLoaded' para todas as páginas que possam precisar
        const pageProps = { user, navigateTo, isLoaded, loadError };
        switch (currentView.page) {
            case 'planning':
                return <PlanningPage {...pageProps} />;
            case 'admin':
                return <AdminPage {...pageProps} />;
            case 'reports':
                return <ReportsPage {...pageProps} />;
            case 'dashboard':
            default:
                return <Dashboard {...pageProps} />;
        }
    };

    const renderMainView = () => {
        if (loadingAuth) {
            return <div className="flex items-center justify-center min-h-screen"><Truck className="w-16 h-16 text-sky-600 animate-pulse" /></div>;
        }

        if (!user) {
            return <AuthScreen />;
        }

        if (currentView.page === 'driverSelection') {
            return <DriverSelectionPage navigateTo={navigateTo} user={user} />;
        }
        if (currentView.page === 'driverView') {
            return <DriverView driverId={currentView.params.driverId} navigateTo={navigateTo} user={user} />;
        }

        return (
            <MainLayout user={user} currentPage={currentView.page} navigateTo={navigateTo}>
                {renderOperatorPage()}
            </MainLayout>
        );
    };

    return renderMainView();
}

export default App;

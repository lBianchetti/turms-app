import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useJsApiLoader } from '@react-google-maps/api';
import { auth, db } from './config/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import PlanningPage from './pages/PlanningPage';
import AdminPage from './pages/AdminPage';
import RouteSelectionPage from './pages/RouteSelectionPage';
import RouteView from './pages/RouteView';
import ReportsPage from './pages/ReportsPage';
import PendingPaymentsPage from './pages/PendingPaymentsPage';
import ClientsPage from './pages/ClientsPage';
import ClientProfilePage from './pages/ClientProfilePage';
import ReactivationPage from './pages/ReactivationPage';
import AddressAnalyticsPage from './pages/AddressAnalyticsPage'; // Import da nova página
import MainLayout from './layouts/MainLayout';
import { Truck } from 'lucide-react';

const Maps_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const appId = 'turms-local-dev';

function App() {
    const [user, setUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [currentView, setCurrentView] = useState({ page: 'dashboard', params: {} });
    const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
    const [incompleteClientsCount, setIncompleteClientsCount] = useState(0);

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: Maps_API_KEY,
        libraries: ['places', 'visualization'], // Adicionado 'visualization' para o heatmap futuro
    });

    

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoadingAuth(false);
        });
        return () => unsubscribeAuth();
    }, []);

    

    useEffect(() => {
        if (!user) {
            setPendingPaymentsCount(0);
            setIncompleteClientsCount(0);
            return;
        }

        const ordersCollectionPath = `artifacts/${appId}/users/${user.uid}/orders`;
        const paymentsQuery = query(collection(db, ordersCollectionPath), where("paymentStatus", "==", "Pendente"));
        const unsubscribePayments = onSnapshot(paymentsQuery, (snapshot) => {
            setPendingPaymentsCount(snapshot.size);
        });

        const clientsCollectionPath = `artifacts/${appId}/users/${user.uid}/clients`;
        const clientsQuery = collection(db, clientsCollectionPath);
        const unsubscribeClients = onSnapshot(clientsQuery, (snapshot) => {
            const incompleteCount = snapshot.docs.filter(doc => {
                const client = doc.data();
                return !client.contact || !client.address || !client.area;
            }).length;
            setIncompleteClientsCount(incompleteCount);
        });

        

        return () => {
            unsubscribePayments();
            unsubscribeClients();
        };
    }, [user]);

    const navigateTo = (page, params = {}) => setCurrentView({ page, params });

    const renderOperatorPage = () => {
        const pageProps = { user, navigateTo, isLoaded, loadError };
        switch (currentView.page) {
            case 'planning': return <PlanningPage {...pageProps} />;
            case 'clients': return <ClientsPage {...pageProps} />;
            case 'clientProfile': return <ClientProfilePage {...pageProps} {...currentView.params} />;
            case 'reactivation': return <ReactivationPage {...pageProps} />;
            case 'admin': return <AdminPage {...pageProps} />;
            case 'reports': return <ReportsPage {...pageProps} />;
            case 'addressAnalysis': return <AddressAnalyticsPage {...pageProps} />;
            case 'pendingPayments': return <PendingPaymentsPage {...pageProps} />;
            case 'dashboard': default: return <Dashboard {...pageProps} />;
        }
    };

    const renderMainView = () => {
        if (loadingAuth) {
            return <div className="flex items-center justify-center min-h-screen"><Truck className="w-16 h-16 text-sky-600 animate-pulse" /></div>;
        }

        if (!user) {
            return <AuthScreen />;
        }
        
        if (currentView.page === 'routeSelection') return <RouteSelectionPage navigateTo={navigateTo} user={user} />;
        if (currentView.page === 'routeView') return <RouteView {...currentView.params} navigateTo={navigateTo} user={user} />;

        return (
            <MainLayout 
                user={user} 
                currentPage={currentView.page} 
                navigateTo={navigateTo} 
                pendingPaymentsCount={pendingPaymentsCount}
                incompleteClientsCount={incompleteClientsCount}
            >
                {renderOperatorPage()}
            </MainLayout>
        );
    };

    return renderMainView();
}

export default App;
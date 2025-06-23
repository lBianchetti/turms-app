import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ArrowLeft, Truck, MapPin } from 'lucide-react';

const appId = 'turms-local-dev';

const RouteSelectionPage = ({ navigateTo, user }) => {
    const [drivers, setDrivers] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        if (!user) return;
        
        const driversCollectionPath = `artifacts/${appId}/users/${user.uid}/drivers`;
        const unsubscribe = onSnapshot(collection(db, driversCollectionPath), (snapshot) => {
            // Apenas os dois primeiros motoristas são relevantes para as rotas de BH
            setDrivers(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })).slice(0, 2));
        });

        return () => unsubscribe();
    }, [user]);

    const routes = [
        { id: 'entregas_lafa', name: 'Entregas Lafaiete' },
        { id: 'coletas_fora', name: 'Coletas Lafaiete/Congonhas' },
        { id: drivers[0]?.id, name: `Rota BH - ${drivers[0]?.name || 'Motorista 1'}`, disabled: !drivers[0] },
        { id: drivers[1]?.id, name: `Rota BH - ${drivers[1]?.name || 'Motorista 2'}`, disabled: !drivers[1] },
        { id: 'entregas_noturnas', name: 'Entregas Noite (Congonhas)' }
    ];

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 font-sans">
             <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Truck className="w-20 h-20 mx-auto text-sky-600" />
                    <h1 className="mt-4 text-4xl font-bold text-gray-800">Portal de Rotas</h1>
                    <p className="text-gray-500 text-lg">Selecione a rota e o dia</p>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
                    <label htmlFor="route-date" className="block text-lg font-semibold text-gray-700 mb-2">
                        Data da Rota
                    </label>
                    <input 
                        type="date" 
                        id="route-date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full p-3 border rounded-lg text-lg"
                    />
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
                    {routes.map(route => (
                        <button
                            key={route.id}
                            onClick={() => navigateTo('routeView', { routeId: route.id, date: selectedDate, routeName: route.name })}
                            disabled={route.disabled}
                            className="w-full flex items-center gap-4 p-4 bg-gray-50 rounded-lg text-xl font-semibold text-gray-700 hover:bg-sky-100 hover:text-sky-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <MapPin className="w-6 h-6 text-gray-500" />
                            <span>{route.name}</span>
                        </button>
                    ))}
                </div>

                <button 
                    onClick={() => navigateTo('dashboard')} 
                    className="mt-8 flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Voltar para o Painel Principal</span>
                </button>
            </div>
        </div>
    );
};

export default RouteSelectionPage;
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ArrowLeft, User, Truck, Calendar } from 'lucide-react';

const appId = 'turms-local-dev';

const DriverSelectionPage = ({ navigateTo, user }) => {
    const [drivers, setDrivers] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        if (!user) return;
        
        const driversCollectionPath = `artifacts/${appId}/users/${user.uid}/drivers`;
        const unsubscribe = onSnapshot(collection(db, driversCollectionPath), (snapshot) => {
            setDrivers(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
        });

        return () => unsubscribe();
    }, [user]);

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 font-sans">
             <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Truck className="w-20 h-20 mx-auto text-sky-600" />
                    <h1 className="mt-4 text-4xl font-bold text-gray-800">Portal do Motorista</h1>
                    <p className="text-gray-500 text-lg">Selecione o seu nome e a data da rota</p>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
                    <label htmlFor="route-date" className="flex items-center gap-3 text-lg font-semibold text-gray-700 mb-3">
                        <Calendar />
                        <span>Selecione a Data da Rota</span>
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
                    {drivers.map(driver => (
                        <button
                            key={driver.id}
                            onClick={() => navigateTo('driverView', { driverId: driver.id, date: selectedDate })}
                            className="w-full flex items-center gap-4 p-4 bg-gray-50 rounded-lg text-xl font-semibold text-gray-700 hover:bg-sky-100 hover:text-sky-700 transition-all duration-200"
                        >
                            <User className="w-6 h-6" />
                            <span>{driver.name}</span>
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

export default DriverSelectionPage;

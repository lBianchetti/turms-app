import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ArrowUp, ArrowDown, MapPin, Check, Phone, ArrowLeft, Loader } from 'lucide-react';

const appId = 'turms-local-dev';

const DriverView = ({ driverId, date, navigateTo, user }) => {
    const [route, setRoute] = useState([]);
    const [loading, setLoading] = useState(true);
    const [driver, setDriver] = useState(null);

    useEffect(() => {
        if (!user || !driverId || !date) {
            setLoading(false);
            return;
        };

        // Busca os dados do motorista para exibir o nome
        const driverDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/drivers`, driverId);
        const driverUnsubscribe = onSnapshot(driverDocRef, (doc) => {
            if(doc.exists()) {
                setDriver(doc.data());
            }
        });

        // Constrói a consulta para os pedidos do dia
        const selectedDate = new Date(date);
        selectedDate.setMinutes(selectedDate.getMinutes() + selectedDate.getTimezoneOffset());
        
        const startOfDay = Timestamp.fromDate(new Date(selectedDate.setHours(0, 0, 0, 0)));
        const endOfDay = Timestamp.fromDate(new Date(selectedDate.setHours(23, 59, 59, 999)));

        const ordersCollectionPath = `artifacts/${appId}/users/${user.uid}/orders`;
        const q = query(
            collection(db, ordersCollectionPath), 
            where("driverId", "==", driverId),
            where("createdAt", ">=", startOfDay),
            where("createdAt", "<=", endOfDay)
        );

        const ordersUnsubscribe = onSnapshot(q, (snapshot) => {
            const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            ordersData.sort((a, b) => (a.routeOrder || 0) - (b.routeOrder || 0));
            setRoute(ordersData);
            setLoading(false);
        });

        return () => {
            driverUnsubscribe();
            ordersUnsubscribe();
        };
    }, [user, driverId, date]);

    const handleMarkAsDone = async (orderId) => {
        try {
            const orderRef = doc(db, `artifacts/${appId}/users/${user.uid}/orders`, orderId);
            // Ao marcar como feito, o pagamento fica pendente por padrão
            await updateDoc(orderRef, { paymentStatus: 'Pendente' });
        } catch (error) {
            console.error("Erro ao atualizar o estado do pedido:", error);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader className="w-12 h-12 animate-spin text-sky-600"/></div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            <header className="bg-sky-600 text-white shadow-lg p-4 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">Rota de {driver?.name || '...'}</h1>
                        <p className="opacity-90">{route.length} {route.length === 1 ? 'parada' : 'paradas'} hoje</p>
                    </div>
                    <button onClick={() => navigateTo('driverSelection')} className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-lg hover:bg-white/30">
                        <ArrowLeft className="w-4 h-4"/>
                        <span>Trocar</span>
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 space-y-4">
                {route.length === 0 && !loading && (
                    <div className="text-center mt-20">
                        <h2 className="text-2xl font-semibold text-gray-700">Nenhuma rota atribuída para esta data</h2>
                        <p className="text-gray-500">Por favor, verifique com o escritório ou selecione outra data.</p>
                    </div>
                )}
                {route.map(order => (
                    <div key={order.id} className={`bg-white rounded-xl shadow-md overflow-hidden ${order.paymentStatus === 'Pago' ? 'opacity-60' : ''}`}>
                        <div className={`p-4 border-l-8 ${order.serviceType === 'coleta' ? 'border-blue-500' : 'border-red-500'}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        {order.serviceType === 'coleta' ? 
                                            <ArrowDown className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full p-1"/> : 
                                            <ArrowUp className="w-6 h-6 bg-red-100 text-red-600 rounded-full p-1"/>
                                        }
                                        <h2 className="text-xl font-bold text-gray-800 capitalize">{order.serviceType}</h2>
                                    </div>
                                    <p className="font-semibold text-lg text-gray-700">{order.clientName}</p>
                                    <p className="text-gray-600">{order.cargoDesc}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${order.paymentStatus === 'Pago' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {order.paymentStatus || 'Pendente'}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t">
                                <div className="flex items-center text-gray-700">
                                    <MapPin className="w-5 h-5 mr-2 text-gray-400"/>
                                    <a 
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.serviceType === 'coleta' ? order.origin : order.destination)}`}
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="hover:underline"
                                    >
                                        {order.serviceType === 'coleta' ? order.origin : order.destination}
                                    </a>
                                </div>
                            </div>

                            {order.paymentStatus !== 'Pago' && (
                                <div className="mt-4 flex gap-2">
                                    <button 
                                        onClick={() => handleMarkAsDone(order.id)}
                                        className="w-full flex-1 flex items-center justify-center gap-2 p-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-colors"
                                    >
                                        <Check className="w-6 h-6"/>
                                        <span>Concluído</span>
                                    </button>
                                     <a href={`tel:`} className="flex-initial p-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                                        <Phone className="w-6 h-6"/>
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </main>
        </div>
    );
};

export default DriverView;

import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
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
            if(doc.exists()) setDriver(doc.data());
        });

        // CORREÇÃO: A consulta agora busca todos os pedidos e o filtro é feito no lado do cliente.
        // Isto é necessário para encontrar tarefas agendadas em datas diferentes da data de criação do pedido.
        const ordersCollectionPath = `artifacts/${appId}/users/${user.uid}/orders`;
        const q = query(collection(db, ordersCollectionPath));

        const ordersUnsubscribe = onSnapshot(q, (snapshot) => {
            const tasksForDriver = [];
            const selectedDateStart = new Date(date);
            selectedDateStart.setHours(0, 0, 0, 0);
            
            const selectedDateEnd = new Date(date);
            selectedDateEnd.setHours(23, 59, 59, 999);

            snapshot.docs.forEach(doc => {
                const order = { id: doc.id, ...doc.data() };
                
                // Verifica ambas as tarefas (coleta e entrega) de cada pedido
                ['pickupTask', 'deliveryTask'].forEach(taskName => {
                    const task = order[taskName];
                    const taskDate = task?.scheduledDate?.toDate();
                    
                    // A tarefa aparece na rota se:
                    // 1. Está atribuída a este motorista (task.assignedTo === driverId)
                    // 2. A sua data agendada é a data selecionada
                    if(task && task.assignedTo === driverId && taskDate >= selectedDateStart && taskDate <= selectedDateEnd) {
                        tasksForDriver.push({ ...task, order, taskName });
                    }
                });
            });
            
            // Ordena as tarefas encontradas pela ordem definida no planejamento
            tasksForDriver.sort((a, b) => (a.orderInRoute || 0) - (b.orderInRoute || 0));
            setRoute(tasksForDriver);
            setLoading(false);
        });

        return () => {
            driverUnsubscribe();
            ordersUnsubscribe();
        };
    }, [user, driverId, date]);

    const handleMarkAsDone = async (orderId, taskType) => {
        try {
            const orderRef = doc(db, `artifacts/${appId}/users/${user.uid}/orders`, orderId);
            await updateDoc(orderRef, { [`${taskType}.status`]: 'concluída' });
        } catch (error) {
            console.error("Erro ao atualizar o estado da tarefa:", error);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader className="w-12 h-12 animate-spin text-sky-600"/></div>;

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
                {route.map(task => (
                    <div key={`${task.order.id}-${task.type}`} className={`bg-white rounded-xl shadow-md overflow-hidden ${task.status === 'concluída' ? 'opacity-60' : ''}`}>
                        <div className={`p-4 border-l-8 ${task.type === 'coleta' ? 'border-blue-500' : 'border-red-500'}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        {task.type === 'coleta' ? <ArrowDown className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full p-1"/> : <ArrowUp className="w-6 h-6 bg-red-100 text-red-600 rounded-full p-1"/>}
                                        <h2 className="text-xl font-bold text-gray-800 capitalize">{task.type}</h2>
                                    </div>
                                    <p className="font-semibold text-lg text-gray-700">{task.order.clientName}</p>
                                    <p className="text-gray-600">{task.order.cargoDesc}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${task.status === 'concluída' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {task.status}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t">
                                <div className="flex items-center text-gray-700">
                                    <MapPin className="w-5 h-5 mr-2 text-gray-400"/>
                                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.address)}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{task.address}</a>
                                </div>
                            </div>

                            {task.status !== 'concluída' && (
                                <div className="mt-4 flex gap-2">
                                    <button onClick={() => handleMarkAsDone(task.order.id, task.taskName)} className="w-full flex-1 flex items-center justify-center gap-2 p-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-colors"><Check className="w-6 h-6"/><span>Concluído</span></button>
                                     <a href={`tel:`} className="flex-initial p-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"><Phone className="w-6 h-6"/></a>
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

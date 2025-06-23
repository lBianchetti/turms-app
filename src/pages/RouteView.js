import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ArrowUp, ArrowDown, MapPin, Check, ArrowLeft, Loader, Box, RefreshCcw, MessageCircle, XCircle } from 'lucide-react';

const appId = 'turms-local-dev';

const RouteView = ({ routeId, date, routeName, navigateTo, user }) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !routeId || !date) {
            setLoading(false);
            return;
        }

        const ordersCollectionPath = `artifacts/${appId}/users/${user.uid}/orders`;
        
        const unsubscribe = onSnapshot(collection(db, ordersCollectionPath), (snapshot) => {
            const allTasks = [];
            const selectedDateStart = new Date(date);
            selectedDateStart.setUTCHours(0, 0, 0, 0);
            
            const selectedDateEnd = new Date(date);
            selectedDateEnd.setUTCHours(23, 59, 59, 999);

            snapshot.docs.forEach(doc => {
                const order = { ...doc.data(), id: doc.id };
                
                ['pickupTask', 'deliveryTask'].forEach(taskKey => {
                    const task = order[taskKey];
                    if (task && task.assignedTo === routeId && task.status !== 'cancelada') {
                        const taskDate = task.scheduledDate?.toDate();
                        if (taskDate >= selectedDateStart && taskDate <= selectedDateEnd) {
                            allTasks.push({
                                ...task,
                                id: `${order.id}-${taskKey}`,
                                orderData: order
                            });
                        }
                    }
                });
            });

            allTasks.sort((a, b) => (a.orderInRoute || 0) - (b.orderInRoute || 0));
            setTasks(allTasks);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, routeId, date]);
    
    const handleUpdateTaskStatus = async (taskId, newStatus) => {
        const [orderId, taskKey] = taskId.split('-');
        if (!orderId || !taskKey) return;
        const orderRef = doc(db, `artifacts/${appId}/users/${user.uid}/orders`, orderId);
        try {
            await updateDoc(orderRef, { [`${taskKey}.status`]: newStatus });
        } catch (error) {
            console.error("Erro ao atualizar o status da tarefa:", error);
            alert("Não foi possível atualizar a tarefa. Tente novamente.");
        }
    };
    
    const handleTaskFailed = (taskId) => {
        console.log(`Tarefa ${taskId} marcada como falha.`);
        alert("A falha na tarefa foi registrada.");
    };

    if (loading) {
        return <div className="fixed inset-0 bg-gray-100 flex items-center justify-center"><Loader className="w-12 h-12 animate-spin text-sky-600"/></div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            <header className="bg-sky-600 text-white shadow-lg p-4 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">{routeName || 'Rota'}</h1>
                        <p className="opacity-90">{tasks.length} {tasks.length === 1 ? 'parada' : 'paradas'} na rota</p>
                    </div>
                    <button onClick={() => navigateTo('routeSelection')} className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-lg hover:bg-white/30">
                        <ArrowLeft className="w-4 h-4"/>
                        <span>Trocar</span>
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 space-y-4">
                {tasks.length === 0 && !loading && (
                    <div className="text-center mt-20 p-4 bg-white rounded-xl shadow-md">
                        <Box className="mx-auto h-16 w-16 text-gray-300" />
                        <h2 className="mt-4 text-2xl font-semibold text-gray-700">Nenhuma tarefa encontrada</h2>
                        <p className="text-gray-500 mt-1">Não há coletas ou entregas atribuídas a esta rota para o dia selecionado.</p>
                    </div>
                )}
                {tasks.map(task => (
                    <div key={task.id} className={`bg-white rounded-xl shadow-md overflow-hidden transition-opacity ${task.status === 'concluido' ? 'opacity-60' : ''}`}>
                        <div className={`p-5 border-l-8 ${task.status === 'concluido' ? 'border-gray-300' : (task.type === 'coleta' ? 'border-blue-500' : 'border-red-500')}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        {task.type === 'coleta' ? 
                                            <ArrowDown className="w-7 h-7 bg-blue-100 text-blue-600 rounded-full p-1"/> : 
                                            <ArrowUp className="w-7 h-7 bg-red-100 text-red-600 rounded-full p-1"/>
                                        }
                                        <h2 className="text-2xl font-bold text-gray-800 capitalize">{task.type}</h2>
                                    </div>
                                    <p className="font-semibold text-xl text-gray-700">{task.orderData.clientName}</p>
                                    <p className="text-gray-600 mt-1">{task.orderData.cargoDesc}</p>
                                </div>
                                <div className="text-right flex-shrink-0 ml-4">
                                   <span className="text-3xl font-bold text-gray-300">#{task.orderInRoute + 1}</span>
                                </div>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t">
                                <div className="flex items-start text-gray-700">
                                    <MapPin className="w-6 h-6 mr-3 text-gray-400 mt-1 flex-shrink-0"/>
                                    <a 
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.address)}`}
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="hover:underline text-lg"
                                    >
                                        {task.address}
                                    </a>
                                </div>
                            </div>

                            {task.orderData.observations && (
                                <div className="mt-4 pt-4 border-t border-dashed">
                                    <div className="flex items-start text-gray-800">
                                        <MessageCircle className="w-5 h-5 mr-3 text-amber-500 flex-shrink-0 mt-1"/>
                                        <div>
                                            <h4 className="font-bold">Observações:</h4>
                                            <p className="text-gray-700 whitespace-pre-wrap">{task.orderData.observations}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-5 flex gap-3">
                                {task.status === 'concluido' ? (
                                    <div className="w-full flex items-center justify-between gap-3 p-4 bg-green-50 text-green-700 font-bold rounded-lg text-lg">
                                        <div className="flex items-center gap-2">
                                          <Check className="w-6 h-6"/>
                                          <span>Concluído!</span>
                                        </div>
                                        <button 
                                          onClick={() => handleUpdateTaskStatus(task.id, 'pendente')}
                                          className="p-2 rounded-full hover:bg-green-100 text-green-600"
                                          title="Reverter status para pendente"
                                        >
                                          <RefreshCcw className="w-5 h-5" />
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => handleUpdateTaskStatus(task.id, 'concluido')}
                                        className="w-full flex-1 flex items-center justify-center gap-2 p-4 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-colors text-lg"
                                    >
                                        <Check className="w-6 h-6"/>
                                        <span>Concluído</span>
                                    </button>
                                )}
                                 <button 
                                     onClick={() => handleTaskFailed(task.id)}
                                     title="Marcar tarefa como falha"
                                     className="flex-initial p-4 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                                 >
                                    <XCircle className="w-6 h-6"/>
                                 </button>
                            </div>
                        </div>
                    </div>
                ))}
            </main>
        </div>
    );
};

export default RouteView;
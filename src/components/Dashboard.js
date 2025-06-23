import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Plus, Sparkles, Box, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { auth, db } from '../config/firebase';
import { callGeminiAPI } from '../services/geminiAPI';
import OrderModal from './OrderModal';
import PlanModal from './PlanModal';
import FinancialSummary from '../components/FinancialSummary';

const appId = 'turms-local-dev';

const Dashboard = ({ user, navigateTo, isLoaded }) => {
    const [allOrders, setAllOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showModal, setShowModal] = useState(false);
    const [editingOrder, setEditingOrder] = useState(null);
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [dailyPlan, setDailyPlan] = useState('');
    const [planLoading, setPlanLoading] = useState(false);

    useEffect(() => {
        if (!user || !user.uid) return;
        const ordersCollectionPath = `artifacts/${appId}/users/${user.uid}/orders`;
        const q = query(collection(db, ordersCollectionPath));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllOrders(ordersData);
            setLoading(false);
        });
        
        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        const filtered = allOrders.filter(order => {
            const dateToFilter = order.orderDate?.toDate() || order.createdAt?.toDate();
            if (!dateToFilter) return false;
            
            return dateToFilter >= startOfDay && dateToFilter <= endOfDay;
        });
        
        filtered.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
        setFilteredOrders(filtered);

    }, [selectedDate, allOrders]);
    
    const handlePreviousDay = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() - 1);
        setSelectedDate(newDate);
    };

    const handleNextDay = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + 1);
        setSelectedDate(newDate);
    };

    const handleTogglePaymentStatus = async (orderId, currentStatus) => {
        const orderRef = doc(db, `artifacts/${appId}/users/${user.uid}/orders`, orderId);
        const newStatus = currentStatus === 'Pendente' ? 'Pago' : 'Pendente';
        await updateDoc(orderRef, { paymentStatus: newStatus });
    };

    const handleDeleteOrder = async (orderId) => {
        if (window.confirm("Tem certeza que deseja apagar este pedido? Esta ação não pode ser desfeita.")) {
            const orderRef = doc(db, `artifacts/${appId}/users/${user.uid}/orders`, orderId);
            await deleteDoc(orderRef);
        }
    };

    const handleEditOrder = (order) => {
        setEditingOrder(order);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingOrder(null);
    };

    const handleGeneratePlan = async () => {
        if (filteredOrders.length === 0) return;
        setShowPlanModal(true);
        setPlanLoading(true);
        const ordersText = filteredOrders.map(o => `- Cliente: ${o.clientName}, Origem: ${o.origin}, Destino: ${o.destination}, Carga: ${o.cargoDesc}, Tags: [${o.tags?.join(', ') || ''}]`).join('\n');
        const prompt = `Você é um gerente de logística experiente para uma transportadora em Belo Horizonte, Brasil. Analise a lista de pedidos para hoje e crie um plano operacional conciso em formato de tópicos (markdown). Agrupe por similaridade (região, tipo de serviço) e sugira uma ordem lógica de execução. Aponte os principais pontos de atenção (cargas frágeis, urgentes, etc.).\n\nPedidos:\n${ordersText}`;
        try {
            const plan = await callGeminiAPI(prompt);
            setDailyPlan(plan);
        } catch(err) {
            console.error(err);
            setDailyPlan("Desculpe, não foi possível gerar o plano. Tente novamente mais tarde.");
        } finally {
            setPlanLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {showModal && <OrderModal user={user} onClose={handleCloseModal} orderToEdit={editingOrder} selectedDate={selectedDate} isLoaded={isLoaded} />}
            {showPlanModal && <PlanModal setShow={setShowPlanModal} plan={dailyPlan} loading={planLoading} />}
            
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-800">Painel de Trabalho</h1>
                 <div className="flex gap-4">
                    <button onClick={handleGeneratePlan} disabled={filteredOrders.length === 0 || planLoading} className="flex items-center gap-2 px-4 py-2 font-semibold text-white bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg hover:opacity-90 shadow-sm disabled:opacity-50">
                        <Sparkles className="w-5 h-5"/>
                        <span>Gerar Plano</span>
                    </button>
                    <button onClick={() => { setEditingOrder(null); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700 shadow-sm">
                        <Plus className="w-5 h-5"/>
                        <span>Adicionar Pedido</span>
                    </button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-md flex justify-between items-center">
                <button onClick={handlePreviousDay} className="p-2 rounded-full hover:bg-gray-100">
                    <ChevronLeft className="w-6 h-6 text-gray-600"/>
                </button>
                <h2 className="text-xl font-bold text-gray-700">
                    {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h2>
                <button onClick={handleNextDay} className="p-2 rounded-full hover:bg-gray-100">
                    <ChevronRight className="w-6 h-6 text-gray-600"/>
                </button>
            </div>
            
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? ( <p className="p-8 text-center text-gray-500">Carregando pedidos...</p> ) : 
                    filteredOrders.length === 0 ? ( <div className="text-center p-12"><Box className="mx-auto h-12 w-12 text-gray-400" /><h3 className="mt-2 text-xl font-medium text-gray-900">Nenhum pedido para este dia</h3><p className="mt-1 text-sm text-gray-500">Use as setas para navegar ou adicione um novo pedido.</p></div> ) : 
                    (
                        <table className="min-w-full divide-y divide-gray-200">
                           <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Cliente</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Destino</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Valor Frete</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status Pag.</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredOrders.map(order => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4"><div className="text-sm font-medium text-gray-900">{order.clientName}</div><div className="text-xs text-gray-500">{order.cargoDesc}</div></td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{order.destination}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-800">R$ {order.freightValue?.toFixed(2)}</td>
                                        <td className="px-6 py-4">
                                            <button 
                                                onClick={() => handleTogglePaymentStatus(order.id, order.paymentStatus)}
                                                title={order.paymentStatus === 'Pendente' ? 'Marcar como Pago' : 'Marcar como Pendente'}
                                                className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full ${order.paymentStatus === 'Pendente' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}
                                            >
                                                {order.paymentStatus}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <button onClick={() => handleEditOrder(order)} title="Editar Pedido" className="text-gray-400 hover:text-blue-600"><Edit size={18}/></button>
                                                <button onClick={() => handleDeleteOrder(order.id)} title="Apagar Pedido" className="text-gray-400 hover:text-red-600"><Trash2 size={18}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
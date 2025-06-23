import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Loader, Users, Phone, MessageSquareHeart } from 'lucide-react';

const appId = 'turms-local-dev';

const ReactivationPage = ({ user }) => {
    const [clients, setClients] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [inactivityDays, setInactivityDays] = useState(30);

    useEffect(() => {
        if (!user) return;
        const clientsUnsubscribe = onSnapshot(collection(db, `artifacts/${appId}/users/${user.uid}/clients`), 
            (snapshot) => setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        );
        const ordersUnsubscribe = onSnapshot(collection(db, `artifacts/${appId}/users/${user.uid}/orders`), 
            (snapshot) => {
                setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                setLoading(false);
            }
        );
        return () => {
            clientsUnsubscribe();
            ordersUnsubscribe();
        };
    }, [user]);

    const inactiveClients = useMemo(() => {
        if (loading) return [];

        const lastOrderMap = new Map();
        orders.forEach(order => {
            // CORREÇÃO: Usar orderDate, com fallback para createdAt
            const orderDate = order.orderDate?.toDate() || order.createdAt?.toDate();
            if (orderDate) {
                const currentLast = lastOrderMap.get(order.clientName);
                if (!currentLast || orderDate > currentLast) {
                    lastOrderMap.set(order.clientName, orderDate);
                }
            }
        });

        const threshold = inactivityDays * 24 * 60 * 60 * 1000;
        const now = new Date();

        return clients.map(client => {
            const lastOrderDate = lastOrderMap.get(client.name);
            const lastContactedDate = client.lastContactedAt?.toDate();
            
            return { ...client, lastOrderDate, lastContactedDate };
        }).filter(client => {
            const timeSinceLastOrder = client.lastOrderDate ? now - client.lastOrderDate : Infinity;
            const timeSinceLastContact = client.lastContactedDate ? now - client.lastContactedDate : Infinity;
            
            return timeSinceLastOrder > threshold && timeSinceLastContact > threshold;
        }).sort((a, b) => (a.lastOrderDate || 0) - (b.lastOrderDate || 0));

    }, [clients, orders, inactivityDays, loading]);

    const handleMarkAsContacted = async (clientId) => {
        const clientRef = doc(db, `artifacts/${appId}/users/${user.uid}/clients`, clientId);
        try {
            await updateDoc(clientRef, {
                lastContactedAt: Timestamp.now()
            });
        } catch (error) {
            console.error("Erro ao marcar cliente como contatado:", error);
            alert("Ocorreu um erro. Tente novamente.");
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Reativação de Clientes</h1>
            
            <div className="bg-white p-4 rounded-xl shadow-md border flex items-center gap-4">
                <label htmlFor="inactivity-days" className="font-medium text-gray-700">Mostrar clientes sem atividade há mais de:</label>
                <input
                    type="number"
                    id="inactivity-days"
                    value={inactivityDays}
                    onChange={(e) => setInactivityDays(Number(e.target.value))}
                    className="p-2 border rounded-md w-24"
                />
                <span className="text-gray-600">dias</span>
            </div>

            {loading ? (
                <div className="text-center p-12"><Loader className="mx-auto w-12 h-12 animate-spin text-sky-500" /></div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
                    <div className="overflow-x-auto">
                        {inactiveClients.length === 0 ? (
                             <div className="text-center p-12">
                                <Users className="mx-auto h-16 w-16 text-green-400" />
                                <h2 className="mt-4 text-2xl font-semibold text-gray-800">Nenhum cliente inativo!</h2>
                                <p className="mt-1 text-gray-500">Todos os clientes estão dentro do período de atividade definido.</p>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Cliente</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Contato</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Último Pedido</th>
                                        <th className="relative px-6 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {inactiveClients.map(client => (
                                        <tr key={client.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-gray-900">{client.name}</p>
                                                <p className="text-sm text-gray-500">{client.area}</p>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{client.contact}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {client.lastOrderDate ? client.lastOrderDate.toLocaleDateString('pt-BR') : 'Nunca'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => handleMarkAsContacted(client.id)}
                                                    className="inline-flex items-center gap-2 px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700"
                                                >
                                                    <MessageSquareHeart size={16} />
                                                    Marcar como Contatado
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReactivationPage;
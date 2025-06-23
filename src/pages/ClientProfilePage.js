import React, { useState, useEffect, useMemo } from 'react';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ArrowLeft, User, Phone, MapPin, DollarSign, Hash, Calendar, Loader } from 'lucide-react';

const appId = 'turms-local-dev';

const InfoCard = ({ icon, title, value }) => (
    <div className="bg-gray-50 p-4 rounded-lg flex items-center border">
        <div className="p-3 bg-sky-100 rounded-full mr-4">
            {React.cloneElement(icon, { className: 'h-6 w-6 text-sky-600' })}
        </div>
        <div>
            <p className="text-sm text-gray-500 font-medium">{title}</p>
            <p className="text-xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

const ClientProfilePage = ({ user, clientId, navigateTo }) => {
    const [client, setClient] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loadingClient, setLoadingClient] = useState(true);
    const [loadingOrders, setLoadingOrders] = useState(true);

    useEffect(() => {
        if (!user || !clientId) return;
        
        const clientDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/clients`, clientId);
        getDoc(clientDocRef).then(docSnap => {
            if (docSnap.exists()) {
                setClient({ id: docSnap.id, ...docSnap.data() });
            }
            setLoadingClient(false);
        });
    }, [user, clientId]);

    useEffect(() => {
        if (!client) return;

        const ordersCollectionPath = `artifacts/${appId}/users/${user.uid}/orders`;
        const q = query(collection(db, ordersCollectionPath), where("clientName", "==", client.name));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const clientOrders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // CORREÇÃO: Ordenar por orderDate, com fallback para createdAt
            clientOrders.sort((a, b) => {
                const dateA = a.orderDate?.toDate() || a.createdAt?.toDate() || 0;
                const dateB = b.orderDate?.toDate() || b.createdAt?.toDate() || 0;
                return dateB - dateA;
            });
            setOrders(clientOrders);
            setLoadingOrders(false);
        });

        return () => unsubscribe();
    }, [user, client]);

    const clientKPIs = useMemo(() => {
        const totalValue = orders.reduce((sum, order) => sum + (order.freightValue || 0), 0);
        // CORREÇÃO: Usar orderDate para o KPI de "Último Pedido"
        const lastOrderDateObj = orders.length > 0 ? (orders[0].orderDate?.toDate() || orders[0].createdAt?.toDate()) : null;
        const lastOrderDate = lastOrderDateObj ? lastOrderDateObj.toLocaleDateString('pt-BR') : 'Nenhum pedido';
        
        return {
            orderCount: orders.length,
            totalValue: `R$ ${totalValue.toFixed(2)}`,
            lastOrderDate
        };
    }, [orders]);

    if (loadingClient) {
        return <div className="h-full w-full flex items-center justify-center"><Loader className="w-12 h-12 animate-spin text-sky-600" /></div>;
    }

    if (!client) {
        return <p>Cliente não encontrado.</p>;
    }

    return (
        <div className="space-y-6">
            <button onClick={() => navigateTo('clients')} className="flex items-center gap-2 text-gray-600 hover:text-sky-600 font-semibold">
                <ArrowLeft size={20} />
                Voltar para Clientes
            </button>
            
            <div className="p-6 bg-white rounded-xl shadow-sm border space-y-4">
                <h1 className="text-3xl font-bold text-gray-800">{client.name}</h1>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-gray-600">
                    <span className="flex items-center gap-2"><User size={16}/> {client.area || 'Não especificado'}</span>
                    <span className="flex items-center gap-2"><Phone size={16}/> {client.contact || 'Não informado'}</span>
                    <span className="flex items-center gap-2"><MapPin size={16}/> {client.address || 'Não informado'}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InfoCard icon={<Hash />} title="Total de Pedidos" value={clientKPIs.orderCount} />
                <InfoCard icon={<DollarSign />} title="Faturamento Total" value={clientKPIs.totalValue} />
                <InfoCard icon={<Calendar />} title="Último Pedido" value={clientKPIs.lastOrderDate} />
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
                <h2 className="p-4 text-xl font-bold text-gray-700 border-b">Histórico de Pedidos</h2>
                {loadingOrders ? <p className="p-4">Carregando histórico...</p> : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Data do Pedido</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Origem/Destino</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Valor</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Status Pag.</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {orders.map(order => {
                                    const displayDate = order.orderDate?.toDate() || order.createdAt?.toDate();
                                    return (
                                        <tr key={order.id}>
                                            {/* CORREÇÃO: Exibir a data correta */}
                                            <td className="px-6 py-4 text-sm text-gray-800">{displayDate ? displayDate.toLocaleDateString('pt-BR') : 'N/A'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                <p><span className="font-semibold">O:</span> {order.origin}</p>
                                                <p><span className="font-semibold">D:</span> {order.destination}</p>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold text-gray-800">R$ {(order.freightValue || 0).toFixed(2)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${order.paymentStatus === 'Pago' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {order.paymentStatus}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {orders.length === 0 && <p className="text-center text-gray-500 p-6">Nenhum pedido encontrado para este cliente.</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientProfilePage;
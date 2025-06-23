import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Loader, DollarSign, CheckCircle, Search } from 'lucide-react';

const appId = 'turms-local-dev';

const PendingPaymentsPage = ({ user }) => {
    const [pendingOrders, setPendingOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!user) return;
        const ordersCollectionPath = `artifacts/${appId}/users/${user.uid}/orders`;
        const q = query(collection(db, ordersCollectionPath), where("paymentStatus", "==", "Pendente"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const orders = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            orders.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
            setPendingOrders(orders);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleMarkAsPaid = async (orderId) => {
        if (!user || !orderId) return;
        const orderRef = doc(db, `artifacts/${appId}/users/${user.uid}/orders`, orderId);
        try {
            await updateDoc(orderRef, { paymentStatus: 'Pago' });
        } catch (error) {
            console.error("Erro ao marcar como pago:", error);
            alert("Não foi possível atualizar o pedido. Tente novamente.");
        }
    };

    const filteredOrders = pendingOrders.filter(order => 
        order.clientName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="h-full w-full flex items-center justify-center"><Loader className="w-12 h-12 animate-spin text-sky-600" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Pagamentos Pendentes</h1>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border rounded-lg w-full max-w-xs focus:ring-sky-500 focus:border-sky-500"
                    />
                </div>
            </div>

            {filteredOrders.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-xl shadow-sm border">
                    <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                    <h2 className="mt-4 text-2xl font-semibold text-gray-800">Tudo em dia!</h2>
                    <p className="mt-1 text-gray-500">Não há nenhum pagamento pendente no momento.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Cliente</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Data do Pedido</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Valor do Frete</th>
                                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ação</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50 transition-colors duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-gray-900">{order.clientName}</div>
                                            <div className="text-xs text-gray-500">{order.cargoDesc}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{order.createdAt.toDate().toLocaleDateString('pt-BR')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">R$ {(order.freightValue || 0).toFixed(2)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleMarkAsPaid(order.id)}
                                                className="inline-flex items-center gap-2 px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                            >
                                                <DollarSign className="h-5 w-5" />
                                                Marcar como Pago
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PendingPaymentsPage;
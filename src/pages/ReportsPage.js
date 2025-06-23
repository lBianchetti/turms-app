import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Download, PieChart, DollarSign } from 'lucide-react';
import { CSVLink } from 'react-csv';

const appId = 'turms-local-dev';

const SummaryCard = ({ title, value, icon, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-6 border">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-gray-500 text-sm font-medium">{title}</p>
            <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

const ReportsPage = ({ user }) => {
    const [allOrders, setAllOrders] = useState([]);
    const [clients, setClients] = useState([]); // <-- Estado para armazenar clientes
    const [loading, setLoading] = useState(true);

    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    useEffect(() => {
        if (!user || !user.uid) return;
        
        // Listener para Pedidos
        const ordersQuery = query(collection(db, `artifacts/${appId}/users/${user.uid}/orders`));
        const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
            setAllOrders(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
            setLoading(false);
        });

        // Listener para Clientes
        const clientsQuery = query(collection(db, `artifacts/${appId}/users/${user.uid}/clients`));
        const unsubscribeClients = onSnapshot(clientsQuery, (snapshot) => {
            setClients(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
        });
        
        return () => {
            unsubscribeOrders();
            unsubscribeClients();
        };
    }, [user]);

    const filteredOrders = useMemo(() => {
        const start = new Date(startDate);
        start.setUTCHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        return allOrders.filter(order => {
            const orderDate = order.createdAt?.toDate();
            return orderDate >= start && orderDate <= end;
        });
    }, [startDate, endDate, allOrders]);

    // Análise por Cliente
    const clientAnalysisData = useMemo(() => {
        const analysis = {};
        filteredOrders.forEach(order => {
            const clientName = order.clientName;
            if (!analysis[clientName]) {
                analysis[clientName] = { orderCount: 0, totalValue: 0 };
            }
            analysis[clientName].orderCount += 1;
            analysis[clientName].totalValue += order.freightValue || 0;
        });
        return Object.entries(analysis).map(([clientName, data]) => ({ clientName, ...data }))
                     .sort((a, b) => b.totalValue - a.totalValue);
    }, [filteredOrders]);
    
    // Análise por Segmento
    const segmentAnalysisData = useMemo(() => {
        const clientAreaMap = new Map(clients.map(client => [client.name, client.area || 'Não especificado']));
        const analysis = {};
        
        filteredOrders.forEach(order => {
            const segment = clientAreaMap.get(order.clientName) || 'Não especificado';
            if (!analysis[segment]) {
                analysis[segment] = { orderCount: 0, totalValue: 0 };
            }
            analysis[segment].orderCount += 1;
            analysis[segment].totalValue += order.freightValue || 0;
        });

        return Object.entries(analysis).map(([segmentName, data]) => ({ segmentName, ...data }))
                     .sort((a,b) => b.totalValue - a.totalValue);
    }, [filteredOrders, clients]);

    // Dados para os CSVs
    const clientCsvData = [
        ["Cliente", "Total de Pedidos", "Valor Total Faturado (R$)"],
        ...clientAnalysisData.map(item => [ item.clientName, item.orderCount, item.totalValue.toFixed(2) ])
    ];
    const segmentCsvData = [
        ["Segmento", "Total de Pedidos", "Valor Total Faturado (R$)"],
        ...segmentAnalysisData.map(item => [ item.segmentName, item.orderCount, item.totalValue.toFixed(2) ])
    ];

    const totalBilled = filteredOrders.reduce((sum, order) => sum + (order.freightValue || 0), 0);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Relatórios e Análise</h1>
                <p className="text-gray-500">Analise a performance da sua operação por período.</p>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-md flex items-center gap-4 border">
                <div>
                    <label htmlFor="start-date" className="text-sm font-medium text-gray-600">De:</label>
                    <input type="date" id="start-date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="ml-2 p-2 border rounded-md"/>
                </div>
                 <div>
                    <label htmlFor="end-date" className="text-sm font-medium text-gray-600">Até:</label>
                    <input type="date" id="end-date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="ml-2 p-2 border rounded-md"/>
                </div>
            </div>

            {loading ? <p>Carregando dados...</p> : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SummaryCard title="Faturamento no Período" value={`R$ ${totalBilled.toFixed(2)}`} icon={<DollarSign size={32} className="text-green-600"/>} color="bg-green-100" />
                    <SummaryCard title="Total de Pedidos" value={filteredOrders.length} icon={<PieChart size={32} className="text-blue-600"/>} color="bg-blue-100" />
                </div>
            )}
            
            {/* ANÁLISE POR SEGMENTO */}
            <div className="bg-white p-6 rounded-xl shadow-md border">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-700">Análise por Segmento</h2>
                    <CSVLink data={segmentCsvData} filename={`relatorio_segmentos_${startDate}_a_${endDate}.csv`} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 shadow-sm">
                        <Download size={16} /> Exportar CSV
                    </CSVLink>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Segmento</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Total de Pedidos</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Faturamento Total</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {segmentAnalysisData.map((item) => (
                                <tr key={item.segmentName} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{item.segmentName}</td>
                                    <td className="px-6 py-4 text-gray-600">{item.orderCount}</td>
                                    <td className="px-6 py-4 font-bold text-gray-800">R$ {item.totalValue.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* ANÁLISE POR CLIENTE */}
            <div className="bg-white p-6 rounded-xl shadow-md border">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-700">Análise por Cliente</h2>
                    <CSVLink data={clientCsvData} filename={`relatorio_clientes_${startDate}_a_${endDate}.csv`} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 shadow-sm">
                        <Download size={16} /> Exportar CSV
                    </CSVLink>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Cliente</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Total de Pedidos</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Faturamento Total</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {clientAnalysisData.map((item) => (
                                <tr key={item.clientName} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{item.clientName}</td>
                                    <td className="px-6 py-4 text-gray-600">{item.orderCount}</td>
                                    <td className="px-6 py-4 font-bold text-gray-800">R$ {item.totalValue.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;
import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import FinancialSummary from '../components/FinancialSummary';
import { Download } from 'lucide-react';
import { CSVLink } from 'react-csv'; // 1. Importar o componente de exportação

const appId = 'turms-local-dev';

const ReportsPage = ({ user }) => {
    const [allOrders, setAllOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // 2. Estados para o filtro de data
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() - 30); // Padrão: últimos 30 dias
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    useEffect(() => {
        if (!user || !user.uid) return;
        const ordersCollectionPath = `artifacts/${appId}/users/${user.uid}/orders`;
        const q = query(collection(db, ordersCollectionPath));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ordersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setAllOrders(ordersData);
            setLoading(false);
        });
        
        return () => unsubscribe();
    }, [user]);

    // 3. Efeito para filtrar os pedidos sempre que as datas ou a lista de pedidos mudar
    useEffect(() => {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const filtered = allOrders.filter(order => {
            const orderDate = order.createdAt?.toDate();
            return orderDate >= start && orderDate <= end;
        });
        setFilteredOrders(filtered);
    }, [startDate, endDate, allOrders]);

    // 4. Lógica para agrupar e analisar os dados por cliente
    const clientAnalysisData = useMemo(() => {
        const analysis = {};
        
        filteredOrders.forEach(order => {
            const clientName = order.clientName;
            if (!analysis[clientName]) {
                analysis[clientName] = {
                    orderCount: 0,
                    totalValue: 0,
                };
            }
            analysis[clientName].orderCount += 1;
            analysis[clientName].totalValue += order.freightValue || 0;
        });
        
        return Object.entries(analysis).map(([clientName, data]) => ({
            clientName,
            ...data
        })).sort((a, b) => b.totalValue - a.totalValue); // Ordena pelos clientes mais valiosos
    }, [filteredOrders]);

    // 5. Preparar os dados para o CSV
    const csvData = [
        ["Cliente", "Total de Pedidos", "Valor Total Faturado (R$)"],
        ...clientAnalysisData.map(item => [
            item.clientName,
            item.orderCount,
            item.totalValue.toFixed(2)
        ])
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Relatórios e Análise</h1>
                <p className="text-gray-500">Analise a performance da sua operação por período.</p>
            </div>
            
            {/* Filtros de Data */}
            <div className="bg-white p-4 rounded-xl shadow-md flex items-center gap-4">
                <div>
                    <label htmlFor="start-date" className="text-sm font-medium text-gray-600">De:</label>
                    <input 
                        type="date" 
                        id="start-date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="ml-2 p-2 border rounded-md"
                    />
                </div>
                 <div>
                    <label htmlFor="end-date" className="text-sm font-medium text-gray-600">Até:</label>
                    <input 
                        type="date" 
                        id="end-date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="ml-2 p-2 border rounded-md"
                    />
                </div>
            </div>

            {loading ? <p>Carregando dados...</p> : <FinancialSummary orders={filteredOrders} />}

            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-700">Análise por Cliente</h2>
                    <CSVLink 
                        data={csvData}
                        filename={`relatorio_clientes_${startDate}_a_${endDate}.csv`}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 shadow-sm"
                    >
                        <Download size={16} />
                        Exportar CSV
                    </CSVLink>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Cliente</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Total de Pedidos</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Valor Total Faturado</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {clientAnalysisData.map((client) => (
                                <tr key={client.clientName} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{client.clientName}</td>
                                    <td className="px-6 py-4 text-gray-600">{client.orderCount}</td>
                                    <td className="px-6 py-4 font-bold text-gray-800">R$ {client.totalValue.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {clientAnalysisData.length === 0 && !loading && (
                        <p className="text-center text-gray-500 py-8">Nenhum dado encontrado para o período selecionado.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;

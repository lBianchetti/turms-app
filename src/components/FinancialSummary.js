import React from 'react';
import { DollarSign, AlertCircle, TrendingUp } from 'lucide-react';

const SummaryCard = ({ title, value, icon, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-6">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-gray-500 text-sm font-medium">{title}</p>
            <p className="text-3xl font-bold text-gray-800">
                <span className="text-xl">R$</span> {value}
            </p>
        </div>
    </div>
);


const FinancialSummary = ({ orders }) => {
    // Lógica para calcular os valores
    const calculateSummary = () => {
        let billedToday = 0;
        let pendingValue = 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        orders.forEach(order => {
            // Valor em Aberto: Pedidos concluídos mas com pagamento pendente
            if (order.status === 'Concluído' && order.paymentStatus === 'Pendente') {
                pendingValue += order.freightValue || 0;
            }
            
            // Faturado do Dia: Pedidos concluídos hoje (independentemente do pagamento)
            const orderDate = order.createdAt?.toDate();
            if (order.status === 'Concluído' && orderDate >= today) {
                billedToday += order.freightValue || 0;
            }
        });

        return {
            billedToday: billedToday.toFixed(2),
            pendingValue: pendingValue.toFixed(2),
        };
    };

    const { billedToday, pendingValue } = calculateSummary();
    const totalOrdersToday = orders.filter(o => o.createdAt?.toDate() >= new Date().setHours(0,0,0,0)).length;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <SummaryCard 
                title="Concluído Hoje" 
                value={billedToday} 
                icon={<TrendingUp size={32} className="text-green-600"/>} 
                color="bg-green-100"
            />
            <SummaryCard 
                title="Pagamento Pendente" 
                value={pendingValue} 
                icon={<AlertCircle size={32} className="text-yellow-600"/>} 
                color="bg-yellow-100"
            />
             <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-blue-100">
                     <DollarSign size={32} className="text-blue-600"/>
                </div>
                <div>
                    <p className="text-gray-500 text-sm font-medium">Total de Pedidos Hoje</p>
                    <p className="text-3xl font-bold text-gray-800">{totalOrdersToday}</p>
                </div>
            </div>
        </div>
    );
};

export default FinancialSummary;

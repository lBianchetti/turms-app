import React, { useState } from 'react';
import ClientManagement from '../components/ClientManagement';
import DriverManagement from '../components/DriverManagement';
import FreightSettings from '../components/FreightSettings'; // 1. Importar o novo componente

const AdminPage = ({ user }) => {
    const [activeTab, setActiveTab] = useState('clients');

    const renderContent = () => {
        switch (activeTab) {
            case 'clients':
                return <ClientManagement user={user} />;
            case 'drivers':
                return <DriverManagement user={user} />;
            case 'freight': // 2. Adicionar o caso para o novo componente
                return <FreightSettings user={user} />;
            default:
                return null;
        }
    };

    const TabButton = ({ tabName, label }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-2 text-lg font-semibold rounded-t-lg transition-colors ${
                activeTab === tabName 
                    ? 'bg-white text-gray-800 border-b-2 border-sky-500' 
                    : 'text-gray-500 hover:text-gray-800'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Administração</h1>
            <div className="flex border-b border-gray-200 mb-6">
                <TabButton tabName="clients" label="Gerir Clientes" />
                <TabButton tabName="drivers" label="Gerir Motoristas" />
                <TabButton tabName="freight" label="Configurações de Frete" /> 
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md">
                {renderContent()}
            </div>
        </div>
    );
};

export default AdminPage;

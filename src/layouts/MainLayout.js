import React from 'react';
import { signOut } from 'firebase/auth';
// 1. Importar o ícone 'Users' para o portal
import { LayoutDashboard, Map, Settings, LogOut, Truck, BarChart2, Users } from 'lucide-react';
import { auth } from '../config/firebase';

const NavLink = ({ icon, text, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center w-full px-4 py-3 text-left transition-colors duration-200 ${
            isActive 
                ? 'bg-sky-600 text-white' 
                : 'text-gray-300 hover:bg-sky-800 hover:text-white'
        }`}
    >
        {icon}
        <span className="ml-4 font-medium">{text}</span>
    </button>
);

const MainLayout = ({ children, user, currentPage, navigateTo }) => {
    
    const handleLogout = () => {
        signOut(auth).catch(error => console.error("Erro ao fazer logout:", error));
    };

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            <aside className="w-64 flex-shrink-0 bg-gray-800 text-white flex flex-col">
                <div className="h-20 flex items-center justify-center px-4 bg-gray-900">
                    <Truck className="w-10 h-10 text-sky-500 mr-3"/>
                    <h1 className="text-2xl font-bold text-white">Turms</h1>
                </div>
                <nav className="flex-grow mt-5">
                    <NavLink 
                        icon={<LayoutDashboard size={20} />} 
                        text="Painel de Controle" 
                        isActive={currentPage === 'dashboard'}
                        onClick={() => navigateTo('dashboard')}
                    />
                    <NavLink 
                        icon={<Map size={20} />} 
                        text="Planejamento" 
                        isActive={currentPage === 'planning'}
                        onClick={() => navigateTo('planning')}
                    />
                    <NavLink 
                        icon={<BarChart2 size={20} />} 
                        text="Relatórios" 
                        isActive={currentPage === 'reports'}
                        onClick={() => navigateTo('reports')}
                    />
                     {/* 2. Botão para o Portal do Motorista restaurado e no menu principal */}
                    <NavLink 
                        icon={<Users size={20} />} 
                        text="Portal Motorista" 
                        isActive={currentPage === 'driverSelection'}
                        onClick={() => navigateTo('driverSelection')}
                    />
                    <NavLink 
                        icon={<Settings size={20} />} 
                        text="Administração" 
                        isActive={currentPage === 'admin'}
                        onClick={() => navigateTo('admin')}
                    />
                </nav>
                <div className="p-4 border-t border-gray-700">
                    <div className="mb-4">
                        <p className="text-sm text-gray-400">Operador:</p>
                        <p className="font-semibold break-words">{user.email}</p>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-left text-red-300 hover:bg-red-800 hover:text-white transition-colors duration-200 rounded-lg"
                    >
                        <LogOut size={20} />
                        <span className="ml-4 font-medium">Sair</span>
                    </button>
                </div>
            </aside>
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
                    <div className="container mx-auto px-6 py-8 h-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MainLayout;

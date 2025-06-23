import React from 'react';
import { signOut } from 'firebase/auth';
import { LayoutDashboard, Map, Settings, LogOut, Truck, BarChart2, Users, DollarSign, Briefcase, MessageSquareHeart, MapPin } from 'lucide-react';
import { auth } from '../config/firebase';

const NavLink = ({ icon, text, isActive, onClick, count, countColor = 'bg-red-500' }) => (
    <button
        onClick={onClick}
        className={`flex items-center justify-between w-full px-4 py-3 text-left transition-colors duration-200 ${
            isActive 
                ? 'bg-sky-600 text-white' 
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
        }`}
    >
        <div className="flex items-center">
            {icon}
            <span className="ml-4 font-medium">{text}</span>
        </div>
        {count > 0 && (
            <span className={`${countColor} text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center`}>
                {count}
            </span>
        )}
    </button>
);

const MainLayout = ({ children, user, currentPage, navigateTo, pendingPaymentsCount, incompleteClientsCount }) => {
    
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
                    <NavLink icon={<LayoutDashboard size={20} />} text="Painel de Controle" isActive={currentPage === 'dashboard'} onClick={() => navigateTo('dashboard')} />
                    <NavLink icon={<Map size={20} />} text="Planejamento" isActive={currentPage === 'planning'} onClick={() => navigateTo('planning')} />
                    <NavLink 
                        icon={<Briefcase size={20} />} 
                        text="Clientes" 
                        isActive={currentPage === 'clients' || currentPage === 'clientProfile'} 
                        onClick={() => navigateTo('clients')} 
                        count={incompleteClientsCount}
                        countColor="bg-blue-500"
                    />
                    <NavLink icon={<DollarSign size={20} />} text="Pagamentos" isActive={currentPage === 'pendingPayments'} onClick={() => navigateTo('pendingPayments')} count={pendingPaymentsCount} />
                    <NavLink icon={<MessageSquareHeart size={20} />} text="Reativação" isActive={currentPage === 'reactivation'} onClick={() => navigateTo('reactivation')} />
                    
                    <div className="mt-4 pt-4 border-t border-gray-700">
                        <h3 className="px-4 text-xs font-semibold uppercase text-gray-400">Análises</h3>
                        <NavLink icon={<BarChart2 size={20} />} text="Relatórios Gerais" isActive={currentPage === 'reports'} onClick={() => navigateTo('reports')} />
                        <NavLink icon={<MapPin size={20} />} text="Frequência Endereços" isActive={currentPage === 'addressAnalysis'} onClick={() => navigateTo('addressAnalysis')} />
                    </div>

                    <div className="mt-auto">
                        <NavLink icon={<Users size={20} />} text="Portal Motorista" isActive={currentPage === 'routeSelection'} onClick={() => navigateTo('routeSelection')} />
                        <NavLink 
                            icon={<Settings size={20} />} 
                            text="Administração" 
                            isActive={currentPage === 'admin'} 
                            onClick={() => navigateTo('admin')} 
                        />
                    </div>
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
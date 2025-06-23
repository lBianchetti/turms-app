import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, query } from 'firebase/firestore'; // <-- query importado aqui
import { db } from '../config/firebase';
import { UserPlus, Edit, Trash2, X, CheckCircle, Eye, Briefcase, Search } from 'lucide-react';

const appId = 'turms-local-dev';

const clientAreas = [
    'Indústria', 'Refrigeração', 'Lojista', 'Capotaria', 
    'Supermercado', 'Laboratório', 'Informática', 'Outros'
];

const ClientsPage = ({ user, navigateTo }) => {
    const [clients, setClients] = useState([]);
    const [newClientName, setNewClientName] = useState('');
    const [newClientContact, setNewClientContact] = useState('');
    const [newClientAddress, setNewClientAddress] = useState('');
    const [newClientArea, setNewClientArea] = useState(clientAreas[0]);
    const [editingClient, setEditingClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const clientsCollectionPath = `artifacts/${appId}/users/${user.uid}/clients`;

    useEffect(() => {
        const q = query(collection(db, clientsCollectionPath));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const clientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            clientsData.sort((a, b) => a.name.localeCompare(b.name)); // Ordena por nome
            setClients(clientsData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user, clientsCollectionPath]);

    const resetForm = () => {
        setNewClientName('');
        setNewClientContact('');
        setNewClientAddress('');
        setNewClientArea(clientAreas[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newClientName) return;
        
        await addDoc(collection(db, clientsCollectionPath), { 
            name: newClientName, 
            contact: newClientContact,
            address: newClientAddress,
            area: newClientArea 
        });
        resetForm();
    };

    const handleUpdate = async () => {
        if (!editingClient || !editingClient.name) return;
        const clientDoc = doc(db, clientsCollectionPath, editingClient.id);
        
        const dataToUpdate = {
            name: editingClient.name,
            contact: editingClient.contact || '',
            address: editingClient.address || '',
            area: editingClient.area || clientAreas[0]
        };
        
        await updateDoc(clientDoc, dataToUpdate);
        setEditingClient(null);
    };
    
    const handleDelete = async (id) => {
        if (window.confirm("Tem certeza que quer apagar este cliente?")) {
             await deleteDoc(doc(db, clientsCollectionPath, id));
        }
    };

    const startEditing = (client) => {
        setEditingClient({ ...client });
    };
    
    const filteredClients = clients.filter(client => 
        client.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <Briefcase size={32} />
                    Clientes
                </h1>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:ring-sky-500 focus:border-sky-500"
                    />
                </div>
            </div>

             <form onSubmit={handleSubmit} className="p-4 bg-gray-50 rounded-lg space-y-4 border">
                <h3 className="font-bold">Adicionar Novo Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <input type="text" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} placeholder="Nome do Cliente" className="p-2 border rounded-md lg:col-span-2" required />
                    <input type="text" value={newClientContact} onChange={(e) => setNewClientContact(e.target.value)} placeholder="Contato" className="p-2 border rounded-md" />
                    <input type="text" value={newClientAddress} onChange={(e) => setNewClientAddress(e.target.value)} placeholder="Endereço" className="p-2 border rounded-md" />
                    <select value={newClientArea} onChange={(e) => setNewClientArea(e.target.value)} className="p-2 border rounded-md bg-white">
                        {clientAreas.map(area => <option key={area} value={area}>{area}</option>)}
                    </select>
                </div>
                <button type="submit" className="w-full flex items-center justify-center gap-2 p-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-semibold">
                    <UserPlus size={18}/> Adicionar
                </button>
            </form>

            {editingClient && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3 animate-fade-in">
                    <h3 className="font-bold text-lg">Editando: {editingClient.name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         <input value={editingClient.name} onChange={(e) => setEditingClient({...editingClient, name: e.target.value})} className="p-2 border rounded-md" />
                         <input value={editingClient.contact || ''} onChange={(e) => setEditingClient({...editingClient, contact: e.target.value})} className="p-2 border rounded-md" placeholder="Contato"/>
                         <input value={editingClient.address || ''} onChange={(e) => setEditingClient({...editingClient, address: e.target.value})} className="p-2 border rounded-md" placeholder="Endereço"/>
                         <select value={editingClient.area || clientAreas[0]} onChange={(e) => setEditingClient({...editingClient, area: e.target.value})} className="p-2 border rounded-md bg-white">
                            {clientAreas.map(area => <option key={area} value={area}>{area}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingClient(null)} className="px-4 py-2 text-gray-600 font-semibold bg-gray-200 rounded-lg hover:bg-gray-300">Cancelar</button>
                        <button onClick={handleUpdate} className="px-4 py-2 text-white font-semibold bg-green-600 rounded-lg hover:bg-green-700">Salvar Alterações</button>
                    </div>
                </div>
            )}
            
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
                <div className="overflow-x-auto">
                    {loading ? <p className="p-6 text-center">Carregando clientes...</p> : (
                        <table className="min-w-full divide-y divide-gray-200">
                           <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Cliente</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Área</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Contato</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Endereço</th>
                                    <th className="px-6 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredClients.map(client => (
                                    <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">{client.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{client.area}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{client.contact}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{client.address}</td>
                                        <td className="px-6 py-4 flex justify-end gap-2">
                                            <button onClick={() => navigateTo('clientProfile', { clientId: client.id })} title="Ver Perfil" className="p-2 text-green-600 hover:bg-green-100 rounded-full"><Eye size={18} /></button>
                                            <button onClick={() => startEditing(client)} title="Editar" className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"><Edit size={18} /></button>
                                            <button onClick={() => handleDelete(client.id)} title="Apagar" className="p-2 text-red-600 hover:bg-red-100 rounded-full"><Trash2 size={18} /></button>
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

export default ClientsPage;
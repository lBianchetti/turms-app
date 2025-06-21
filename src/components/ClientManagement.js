import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Plus, Trash2, Edit } from 'lucide-react';

const appId = 'turms-local-dev';

const ClientManagement = ({ user }) => {
    const [clients, setClients] = useState([]);
    const [clientName, setClientName] = useState('');
    const [clientContact, setClientContact] = useState('');
    const [editingClient, setEditingClient] = useState(null);
    const [loading, setLoading] = useState(true);

    const clientsCollectionPath = `artifacts/${appId}/users/${user.uid}/clients`;

    useEffect(() => {
        const q = collection(db, clientsCollectionPath);
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const clientsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setClients(clientsData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [clientsCollectionPath]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!clientName) return;

        if (editingClient) {
            // Atualizar cliente
            const clientRef = doc(db, clientsCollectionPath, editingClient.id);
            await updateDoc(clientRef, { name: clientName, contact: clientContact });
        } else {
            // Adicionar novo cliente
            await addDoc(collection(db, clientsCollectionPath), { name: clientName, contact: clientContact });
        }
        
        setClientName('');
        setClientContact('');
        setEditingClient(null);
    };

    const handleEdit = (client) => {
        setEditingClient(client);
        setClientName(client.name);
        setClientContact(client.contact || '');
    };

    const handleDelete = async (id) => {
        if (window.confirm("Tem a certeza que quer apagar este cliente? Todos os pedidos associados perderão a referência.")) {
            const clientRef = doc(db, clientsCollectionPath, id);
            await deleteDoc(clientRef);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Clientes</h2>
            <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg flex items-end gap-4">
                <div className="flex-grow">
                    <label className="block text-sm font-medium text-gray-600">Nome do Cliente</label>
                    <input 
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Nome da empresa ou pessoa"
                        className="w-full mt-1 p-2 border rounded-md"
                    />
                </div>
                <div className="flex-grow">
                    <label className="block text-sm font-medium text-gray-600">Contacto (Telefone/Email)</label>
                    <input 
                        type="text"
                        value={clientContact}
                        onChange={(e) => setClientContact(e.target.value)}
                        placeholder="Contacto principal"
                        className="w-full mt-1 p-2 border rounded-md"
                    />
                </div>
                <button type="submit" className="bg-sky-500 text-white px-4 py-2 rounded-md hover:bg-sky-600 flex items-center gap-2">
                    <Plus size={18} />
                    {editingClient ? 'Atualizar' : 'Adicionar'}
                </button>
                {editingClient && (
                    <button type="button" onClick={() => { setEditingClient(null); setClientName(''); setClientContact(''); }} className="bg-gray-500 text-white px-4 py-2 rounded-md">
                        Cancelar
                    </button>
                )}
            </form>

            <div className="space-y-3">
                {loading ? <p>A carregar clientes...</p> : clients.map(client => (
                    <div key={client.id} className="flex justify-between items-center p-3 bg-white rounded-md shadow-sm border">
                        <div>
                            <p className="font-semibold">{client.name}</p>
                            <p className="text-sm text-gray-500">{client.contact}</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => handleEdit(client)} className="p-2 text-blue-600 hover:text-blue-800"><Edit size={18} /></button>
                            <button onClick={() => handleDelete(client.id)} className="p-2 text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ClientManagement;

import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Plus, Trash2, Edit } from 'lucide-react';

const appId = 'turms-local-dev';

const DriverManagement = ({ user }) => {
    const [drivers, setDrivers] = useState([]);
    const [driverName, setDriverName] = useState('');
    const [driverContact, setDriverContact] = useState('');
    const [editingDriver, setEditingDriver] = useState(null);
    const [loading, setLoading] = useState(true);

    const driversCollectionPath = `artifacts/${appId}/users/${user.uid}/drivers`;

    useEffect(() => {
        const q = collection(db, driversCollectionPath);
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const driversData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setDrivers(driversData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [driversCollectionPath]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!driverName) return;

        if (editingDriver) {
            // Atualizar motorista
            const driverRef = doc(db, driversCollectionPath, editingDriver.id);
            await updateDoc(driverRef, { name: driverName, contact: driverContact });
        } else {
            // Adicionar novo motorista
            await addDoc(collection(db, driversCollectionPath), { name: driverName, contact: driverContact });
        }
        
        setDriverName('');
        setDriverContact('');
        setEditingDriver(null);
    };

    const handleEdit = (driver) => {
        setEditingDriver(driver);
        setDriverName(driver.name);
        setDriverContact(driver.contact || '');
    };

    const handleDelete = async (id) => {
        if (window.confirm("Tem a certeza que quer apagar este motorista?")) {
            const driverRef = doc(db, driversCollectionPath, id);
            await deleteDoc(driverRef);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Motoristas</h2>
            <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg flex items-end gap-4">
                <div className="flex-grow">
                    <label className="block text-sm font-medium text-gray-600">Nome</label>
                    <input 
                        type="text"
                        value={driverName}
                        onChange={(e) => setDriverName(e.target.value)}
                        placeholder="Nome do motorista"
                        className="w-full mt-1 p-2 border rounded-md"
                    />
                </div>
                <div className="flex-grow">
                    <label className="block text-sm font-medium text-gray-600">Contacto (Telefone)</label>
                    <input 
                        type="text"
                        value={driverContact}
                        onChange={(e) => setDriverContact(e.target.value)}
                        placeholder="Ex: 912345678"
                        className="w-full mt-1 p-2 border rounded-md"
                    />
                </div>
                <button type="submit" className="bg-sky-500 text-white px-4 py-2 rounded-md hover:bg-sky-600 flex items-center gap-2">
                    <Plus size={18} />
                    {editingDriver ? 'Atualizar' : 'Adicionar'}
                </button>
                {editingDriver && (
                    <button type="button" onClick={() => { setEditingDriver(null); setDriverName(''); setDriverContact(''); }} className="bg-gray-500 text-white px-4 py-2 rounded-md">
                        Cancelar
                    </button>
                )}
            </form>

            <div className="space-y-3">
                {loading ? <p>A carregar motoristas...</p> : drivers.map(driver => (
                    <div key={driver.id} className="flex justify-between items-center p-3 bg-white rounded-md shadow-sm border">
                        <div>
                            <p className="font-semibold">{driver.name}</p>
                            <p className="text-sm text-gray-500">{driver.contact}</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => handleEdit(driver)} className="p-2 text-blue-600 hover:text-blue-800"><Edit size={18} /></button>
                            <button onClick={() => handleDelete(driver.id)} className="p-2 text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DriverManagement;

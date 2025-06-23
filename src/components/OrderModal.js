import React, { useState, useEffect, useMemo } from 'react';
import { collection, addDoc, onSnapshot, doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import GooglePlacesAutocomplete, { geocodeByPlaceId, getLatLng } from 'react-google-places-autocomplete';
import { X, Plus, Sparkles } from 'lucide-react';
import { db } from '../config/firebase';
import { callGeminiAPI } from '../services/geminiAPI';
import FreightCalculator from './FreightCalculator';

const Maps_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const appId = 'turms-local-dev';

const autocompletionRequest = {
    bounds: [
      { lat: -20.776062384741245, lng: -44.109975037628885 },
      { lat: -19.72030007317641, lng: -43.81497603038532 },
    ],
    strictBounds: false,
};

const operationalFlows = {
    'bh_to_lafa': { label: 'BH → Lafaiete', pickup: 'BH', delivery: 'Lafaiete', deliveryDays: 1 },
    'bh_to_congonhas': { label: 'BH → Congonhas', pickup: 'BH', delivery: 'Congonhas', deliveryDays: 0 },
    'lafa_to_bh': { label: 'Lafaiete → BH', pickup: 'Lafaiete', delivery: 'BH', deliveryDays: 0 },
    'congonhas_to_bh': { label: 'Congonhas → BH', pickup: 'Congonhas', delivery: 'BH', deliveryDays: 0 },
    'local_bh': { label: 'Ponto a Ponto BH', pickup: 'BH', delivery: 'BH', deliveryDays: 0 },
};

const OrderModal = ({ onClose, user, orderToEdit, selectedDate, isLoaded }) => {
    const [flow, setFlow] = useState('bh_to_lafa'); 
    const [clientName, setClientName] = useState('');
    const [orderDate, setOrderDate] = useState('');
    const [origin, setOrigin] = useState(null);
    const [destination, setDestination] = useState(null);
    const [cargoDesc, setCargoDesc] = useState('');
    const [observations, setObservations] = useState(''); // <-- Novo estado para observações
    const [tags, setTags] = useState([]);
    const [weight, setWeight] = useState('');
    const [size, setSize] = useState('small');
    const [freightValue, setFreightValue] = useState(0);
    const [freightSettings, setFreightSettings] = useState(null);
    const [clients, setClients] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [suggestionLoading, setSuggestionLoading] = useState(false);
    const [isAddingClient, setIsAddingClient] = useState(false);

    useEffect(() => {
        if (orderToEdit) {
            setFlow(orderToEdit.flow || 'bh_to_lafa');
            setClientName(orderToEdit.clientName || '');
            const dateToSet = orderToEdit.orderDate || orderToEdit.pickupTask?.scheduledDate;
            if (dateToSet) {
                setOrderDate(dateToSet.toDate().toISOString().split('T')[0]);
            }
            setOrigin(orderToEdit.originData ? { label: orderToEdit.origin, value: { place_id: orderToEdit.originData.place_id } } : null);
            setDestination(orderToEdit.destinationData ? { label: orderToEdit.destination, value: { place_id: orderToEdit.destinationData.place_id } } : null);
            setCargoDesc(orderToEdit.cargoDesc || '');
            setObservations(orderToEdit.observations || ''); // <-- Carrega observações existentes
            setWeight(orderToEdit.weight || '');
            setFreightValue(orderToEdit.freightValue?.toFixed(2) || 0);
            setTags(orderToEdit.tags || []);
            setSize(orderToEdit.size || 'small');
        } else {
            setOrderDate(selectedDate.toISOString().split('T')[0]);
        }
    }, [orderToEdit, selectedDate]);

    useEffect(() => {
        if (!user || !user.uid) return;
        const clientsUnsubscribe = onSnapshot(collection(db, `artifacts/${appId}/users/${user.uid}/clients`), (s) => setClients(s.docs.map(d => ({...d.data(), id: d.id}))));
        const fetchSettings = async () => {
            const docRef = doc(db, `artifacts/${appId}/users/${user.uid}/settings/freightRules`);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) setFreightSettings(docSnap.data());
        };
        fetchSettings();
        return () => clientsUnsubscribe();
    }, [user]);
    
    const handleTagToggle = (tag) => { setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]); };
    
    const handleSuggestTags = async () => {
        if (!cargoDesc) return;
        setSuggestionLoading(true);
        setError('');
        const prompt = `Analise a seguinte descrição de carga: "${cargoDesc}". Quais das seguintes tags são mais relevantes? Responda apenas com os nomes das tags, separados por vírgula. Se nenhuma for relevante, responda "Nenhuma". Tags disponíveis: Frágil, Pesado, Urgente.`;
        try {
            const suggested = await callGeminiAPI(prompt);
            if (suggested && suggested.toLowerCase() !== 'nenhuma') {
                const suggestedArray = suggested.split(',').map(t => t.trim());
                setTags(prev => [...new Set([...prev, ...suggestedArray])]);
            }
        } catch(err) {
            setError("Erro ao obter sugestões de tags.");
        } finally {
            setSuggestionLoading(false);
        }
    };

    const handleAddClient = async () => {
        if (!clientName || isAddingClient) return;
        setIsAddingClient(true);
        try {
            const clientsCollectionPath = `artifacts/${appId}/users/${user.uid}/clients`;
            await addDoc(collection(db, clientsCollectionPath), { name: clientName, contact: '' });
        } catch (error) {
            console.error("Erro ao adicionar cliente:", error);
            setError("Não foi possível adicionar o novo cliente.");
            setIsAddingClient(false);
        }
    };

    const clientExists = useMemo(() => 
        clientName && clients.some(c => c.name.toLowerCase() === clientName.toLowerCase()),
    [clientName, clients]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!clientName || !origin || !destination || !orderDate || freightValue <= 0) {
            setError('Preencha todos os campos e calcule um valor de frete válido.');
            return;
        }
        setLoading(true);
        setError('');

        try {
            const [originGeocode] = await geocodeByPlaceId(origin.value.place_id);
            const originCoords = await getLatLng(originGeocode);
            const [destGeocode] = await geocodeByPlaceId(destination.value.place_id);
            const destCoords = await getLatLng(destGeocode);
            
            const mainOrderDate = new Date(orderDate);
            mainOrderDate.setMinutes(mainOrderDate.getMinutes() + mainOrderDate.getTimezoneOffset());
            
            const deliveryDate = new Date(mainOrderDate);
            deliveryDate.setDate(deliveryDate.getDate() + (operationalFlows[flow].deliveryDays || 0));

            const getTaskAssignment = (taskType, flow) => {
                if (taskType === 'coleta') {
                    if (flow === 'lafa_to_bh' || flow === 'congonhas_to_bh') {
                        return 'coletas_fora';
                    }
                    return null;
                } else {
                    if (flow === 'bh_to_lafa') {
                        return 'entregas_lafa';
                    } else if (flow === 'bh_to_congonhas') {
                        return 'entregas_noturnas';
                    }
                    return null;
                }
            };

            const orderData = {
                flow, clientName, cargoDesc, observations, // <-- Salva observações
                weight: parseFloat(weight), freightValue: parseFloat(freightValue),
                paymentStatus: orderToEdit ? orderToEdit.paymentStatus : 'Pendente', tags, size,
                orderDate: Timestamp.fromDate(mainOrderDate),
                pickupTask: {
                    type: 'coleta', address: origin.label, city: operationalFlows[flow].pickup, geo: originCoords,
                    scheduledDate: Timestamp.fromDate(mainOrderDate), status: 'pendente', assignedTo: getTaskAssignment('coleta', flow)
                },
                deliveryTask: {
                    type: 'entrega', address: destination.label, city: operationalFlows[flow].delivery, geo: destCoords,
                    scheduledDate: Timestamp.fromDate(deliveryDate), status: 'pendente', assignedTo: getTaskAssignment('entrega', flow)
                },
                origin: origin.label, destination: destination.label,
                originData: { address: origin.label, place_id: origin.value.place_id, ...originCoords },
                destinationData: { address: destination.label, place_id: destination.value.place_id, ...destCoords },
            };

            if (orderToEdit) {
                await updateDoc(doc(db, `artifacts/${appId}/users/${user.uid}/orders`, orderToEdit.id), orderData);
            } else {
                await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/orders`), {
                    ...orderData, archived: false, operatorId: user.uid, createdAt: Timestamp.now(),
                });
            }
            onClose();
        } catch (err) {
            console.error("Erro ao salvar pedido:", err);
            setError("Não foi possível salvar o pedido.");
        } finally {
            setLoading(false);
        }
    };

    const availableTags = [{ name: 'Frágil', color: 'bg-red-100 text-red-800' }, { name: 'Pesado', color: 'bg-yellow-100 text-yellow-800' }, { name: 'Urgente', color: 'bg-blue-100 text-blue-800' }];
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-full overflow-y-auto">
                <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-2xl font-bold text-gray-800">{orderToEdit ? 'Editar Pedido' : 'Adicionar Novo Pedido'}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><X className="w-6 h-6 text-gray-600" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Fluxo Operacional</label>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(operationalFlows).map(([key, value]) => (
                                <button key={key} type="button" onClick={() => setFlow(key)} className={`px-4 py-2 text-sm font-semibold rounded-lg border-2 ${flow === key ? 'bg-sky-600 text-white border-sky-700' : 'bg-white text-gray-700 hover:border-sky-500'}`}>{value.label}</button>
                            ))}
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Cliente</label>
                            <div className="flex items-center gap-2">
                                <input type="text" list="clients-list" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Selecione ou digite um novo cliente" className="w-full px-4 py-2 bg-gray-50 border rounded-lg"/>
                                {!clientExists && clientName.length > 2 && (
                                    <button
                                        type="button"
                                        onClick={handleAddClient}
                                        disabled={isAddingClient}
                                        className="flex-shrink-0 px-3 py-2 text-sm font-semibold text-white bg-green-500 rounded-lg hover:bg-green-600 disabled:bg-green-300"
                                    >
                                        {isAddingClient ? 'Adicionando...' : 'Adicionar'}
                                    </button>
                                )}
                            </div>
                            <datalist id="clients-list">{clients.map(c => (<option key={c.id} value={c.name} />))}</datalist>
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Data da Coleta</label>
                           <input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border rounded-lg h-[42px]"/>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Endereço de Coleta (em {operationalFlows[flow].pickup})</label>
                            {isLoaded ? (<GooglePlacesAutocomplete autocompletionRequest={autocompletionRequest} apiKey={Maps_API_KEY} selectProps={{value: origin, onChange: setOrigin, placeholder: 'Digite...', styles: { input: (p) => ({ ...p, height: '42px' }) }}}/>) : (<div className="w-full h-[42px] bg-gray-200 rounded-lg animate-pulse"></div>)}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Endereço de Entrega (em {operationalFlows[flow].delivery})</label>
                            {isLoaded ? (<GooglePlacesAutocomplete autocompletionRequest={autocompletionRequest} apiKey={Maps_API_KEY} selectProps={{value: destination, onChange: setDestination, placeholder: 'Digite...', styles: { input: (p) => ({ ...p, height: '42px' }) }}}/>) : (<div className="w-full h-[42px] bg-gray-200 rounded-lg animate-pulse"></div>)}
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição da Carga</label>
                        <div className="flex items-center gap-2">
                           <input type="text" value={cargoDesc} onChange={(e) => setCargoDesc(e.target.value)} placeholder="Ex: 2 caixas de eletrônicos" className="w-full px-4 py-2 bg-gray-50 border rounded-lg"/>
                           <button type="button" onClick={handleSuggestTags} disabled={suggestionLoading || !cargoDesc} className="p-2 text-yellow-400 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50">
                               {suggestionLoading ? <div className="w-5 h-5 border-2 border-t-transparent border-sky-500 rounded-full animate-spin"></div> : <Sparkles className="w-5 h-5" />}
                           </button>
                        </div>
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Observações (para o motorista)</label>
                        <textarea 
                            value={observations} 
                            onChange={(e) => setObservations(e.target.value)} 
                            rows="2"
                            placeholder="Ex: Deixar na portaria, procurar por João" 
                            className="w-full px-4 py-2 bg-gray-50 border rounded-lg"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tags de Manuseio</label>
                        <div className="flex flex-wrap gap-2">{availableTags.map(t => (<button key={t.name} type="button" onClick={() => handleTagToggle(t.name)} className={`px-3 py-1 text-sm font-semibold rounded-full transition-all ${tags.includes(t.name) ? `${t.color} ring-2 ring-offset-1 ring-sky-500` : 'bg-gray-100 hover:bg-gray-200'}`}>{t.name}</button>))}</div>
                     </div>
                    <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                        <h3 className="font-semibold text-gray-700">Detalhes e Cálculo do Frete</h3>
                        <FreightCalculator 
                            settings={freightSettings}
                            weight={weight}
                            setWeight={setWeight}
                            size={size}
                            setSize={setSize}
                            destination={destination}
                            onValueCalculated={setFreightValue}
                        />
                         <div className="flex items-end gap-3 pt-4">
                           <div className="flex-grow">
                             <label className="block text-sm font-medium text-gray-700 mb-1">Valor Final do Frete (R$)</label>
                             <input type="number" step="0.01" value={freightValue} onChange={(e) => setFreightValue(e.target.value)} className="w-full px-4 py-2 bg-white border rounded-lg text-xl font-bold"/>
                           </div>
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-500 text-center py-2">{error}</p>}
                    <div className="pt-4 flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
                        <button type="submit" disabled={loading} className="px-6 py-2 font-semibold text-white bg-sky-600 rounded-lg flex items-center gap-2">
                            {loading ? 'Salvando...' : (orderToEdit ? 'Salvar Alterações' : 'Adicionar Pedido')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OrderModal;
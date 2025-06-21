import React, { useState, useEffect, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { collection, onSnapshot, query, doc, updateDoc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ChevronLeft, ChevronRight, Loader, Sun, Moon, CloudSun, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import TaskCard from '../components/TaskCard';

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const appId = 'turms-local-dev';

const containerStyle = { width: '100%', height: '100%' };
const center = { lat: -19.916681, lng: -43.934493 };

const RouteColumn = ({ routeId, route, drivers, onAssignTask }) => (
    <div className="bg-gray-200 rounded-xl flex-1 min-w-[350px] flex flex-col h-full">
        <div className="p-4 border-b border-gray-300">
            <h3 className="font-bold text-lg text-gray-800">{route.name}</h3>
            <p className="text-sm text-gray-500">{route.tasks.length} tarefa(s)</p>
        </div>
        <div className="p-4 overflow-y-auto flex-grow">
            {route.tasks.map((task) => (
                <TaskCard
                    key={`${task.order.id}-${task.type}`}
                    task={task}
                    order={task.order}
                    drivers={route.allowedDriverIds ? drivers.filter(d => route.allowedDriverIds.includes(d.id)) : drivers}
                    onAssignTask={onAssignTask}
                />
            ))}
        </div>
    </div>
);

const PlanningPage = ({ user, isLoaded, loadError }) => {
    const [allOrders, setAllOrders] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [routeAssignments, setRouteAssignments] = useState({});
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [collapsedBlocks, setCollapsedBlocks] = useState({});

    useEffect(() => {
        if (!user) return;
        const driversUnsubscribe = onSnapshot(collection(db, `artifacts/${appId}/users/${user.uid}/drivers`), (snap) => setDrivers(snap.docs.map(d => ({...d.data(), id: d.id}))));
        const ordersUnsubscribe = onSnapshot(collection(db, `artifacts/${appId}/users/${user.uid}/orders`), (snap) => setAllOrders(snap.docs.map(o => ({...o.data(), id: o.id}))));
        const assignmentsUnsubscribe = onSnapshot(doc(db, `artifacts/${appId}/users/${user.uid}/settings/routeAssignments`), (doc) => { if (doc.exists()) setRouteAssignments(doc.data()); });
        return () => { driversUnsubscribe(); ordersUnsubscribe(); assignmentsUnsubscribe(); };
    }, [user]);

    const timeBlocks = useMemo(() => {
        const startOfDay = new Date(selectedDate); startOfDay.setHours(0,0,0,0);
        const endOfDay = new Date(selectedDate); endOfDay.setHours(23,59,59,999);

        const allTasksForDay = allOrders.reduce((acc, order) => {
            const pickupDate = order.pickupTask?.scheduledDate?.toDate();
            if (pickupDate >= startOfDay && pickupDate <= endOfDay) acc.push({ ...order.pickupTask, order });
            
            const deliveryDate = order.deliveryTask?.scheduledDate?.toDate();
            if (deliveryDate >= startOfDay && deliveryDate <= endOfDay) acc.push({ ...order.deliveryTask, order });
            
            return acc;
        }, []);

        const getTasksForRoute = (routeId, baseTasks) => baseTasks.filter(t => t.routeId === routeId).sort((a,b) => (a.routeOrder || 0) - (b.routeOrder || 0));

        const coletasFora = allTasksForDay.filter(t => t.type === 'coleta' && (t.city === 'Lafaiete' || t.city === 'Congonhas'));
        const entregasLafa = allTasksForDay.filter(t => t.type === 'entrega' && t.city === 'Lafaiete');
        const entregasCongonhas = allTasksForDay.filter(t => t.type === 'entrega' && t.city === 'Congonhas');
        const bhTasks = allTasksForDay.filter(t => t.city === 'BH');
        
        const bhDrivers = routeAssignments.operacao_bh || [];

        return {
            manha: {
                name: 'Manhã', icon: <Sun />, routes: {
                    'entregas_lafa': { name: 'Entregas Lafaiete', tasks: getTasksForRoute('entregas_lafa', entregasLafa), maxDrivers: 1, assignedDrivers: routeAssignments.entregas_lafa || [], allowedDriverIds: routeAssignments.entregas_lafa || [] },
                    'coletas_fora': { name: 'Coletas Lafaiete/Congonhas', tasks: getTasksForRoute('coletas_fora', coletasFora), maxDrivers: 1, assignedDrivers: routeAssignments.coletas_fora || [], allowedDriverIds: routeAssignments.coletas_fora || [] }
                }
            },
            tarde: {
                name: 'Tarde', icon: <CloudSun />, routes: {
                    ...(bhDrivers[0] && { [bhDrivers[0]]: { name: `Rota BH - ${drivers.find(d=>d.id === bhDrivers[0])?.name || '...'}`, tasks: getTasksForRoute(bhDrivers[0], bhTasks), maxDrivers: 1, assignedDrivers: [bhDrivers[0]], allowedDriverIds: [bhDrivers[0]] } }),
                    ...(bhDrivers[1] && { [bhDrivers[1]]: { name: `Rota BH - ${drivers.find(d=>d.id === bhDrivers[1])?.name || '...'}`, tasks: getTasksForRoute(bhDrivers[1], bhTasks), maxDrivers: 1, assignedDrivers: [bhDrivers[1]], allowedDriverIds: [bhDrivers[1]] } }),
                    'operacao_bh_unassigned': { name: 'Operação BH (Não atribuído)', tasks: bhTasks.filter(t => !t.routeId || !bhDrivers.includes(t.routeId)), maxDrivers: 0, assignedDrivers: [], allowedDriverIds: bhDrivers }
                }
            },
            noite: { name: 'Noite', icon: <Moon />, routes: { 'entregas_noturnas': { name: 'Entregas Congonhas', tasks: getTasksForRoute('entregas_noturnas', entregasCongonhas), maxDrivers: 1, assignedDrivers: routeAssignments.entregas_noturnas || [], allowedDriverIds: routeAssignments.entregas_noturnas || [] } } }
        };
    }, [selectedDate, allOrders, routeAssignments, drivers]);
    
    // CORREÇÃO: Lógica robusta e atômica para atribuir tarefas
    const handleAssignTask = async (orderId, taskType, newRouteId) => {
        const routeIdToSave = newRouteId === "" ? null : newRouteId;
        const orderRef = doc(db, `artifacts/${appId}/users/${user.uid}/orders`, orderId);

        try {
            const batch = writeBatch(db);
            
            // 1. Atualiza a rota da tarefa movida
            batch.update(orderRef, { [`${taskType}.routeId`]: routeIdToSave });

            // 2. Reordena as tarefas na coluna de destino
            const findRouteTasks = (routeId) => {
                for (const block of Object.values(timeBlocks)) {
                    if (block.routes && block.routes[routeId]) {
                        return block.routes[routeId].tasks;
                    }
                }
                return [];
            };

            const destTasks = findRouteTasks(newRouteId);
            const movedTask = { order: { id: orderId }, type: taskType }; // Simula a tarefa movida
            const newOrderedTasks = [...destTasks, movedTask];

            newOrderedTasks.forEach((task, index) => {
                const taskRef = doc(db, `artifacts/${appId}/users/${user.uid}/orders`, task.order.id);
                batch.update(taskRef, { [`${task.type}.routeOrder`]: index });
            });
            
            await batch.commit();

        } catch (error) {
            console.error("Erro ao atribuir tarefa:", error);
            alert("Ocorreu um erro ao atribuir a tarefa.");
        }
    };
    
    const handleAssignDriverToRoute = async (routeId, driverId) => {
        const currentAssignments = routeAssignments[routeId] || [];
        const newAssignments = [...currentAssignments, driverId];
        await setDoc(doc(db, `artifacts/${appId}/users/${user.uid}/settings/routeAssignments`), { ...routeAssignments, [routeId]: newAssignments }, { merge: true });
    };
    
    const handleRemoveDriverFromRoute = async (routeId, driverId) => {
        const currentAssignments = routeAssignments[routeId] || [];
        const newAssignments = currentAssignments.filter(id => id !== driverId);
        await setDoc(doc(db, `artifacts/${appId}/users/${user.uid}/settings/routeAssignments`), { ...routeAssignments, [routeId]: newAssignments }, { merge: true });
    };
    
    const handleDateChange = (days) => setSelectedDate(d => { const newDate = new Date(d); newDate.setDate(d.getDate() + days); return newDate; });
    const handleToggleBlock = (blockName) => setCollapsedBlocks(prev => ({ ...prev, [blockName]: !prev[blockName] }));

    return (
        <div className="h-full w-full flex flex-col font-sans gap-4">
            <div className="bg-white p-2 rounded-xl shadow-md flex justify-between items-center shrink-0">
                <button onClick={() => handleDateChange(-1)} className="p-2 rounded-full hover:bg-gray-100"><ChevronLeft/></button>
                <h2 className="text-xl font-bold text-gray-700">{selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
                <button onClick={() => handleDateChange(1)} className="p-2 rounded-full hover:bg-gray-100"><ChevronRight/></button>
            </div>
            
            <div className="w-full h-[40%] rounded-xl overflow-hidden shadow-lg bg-gray-300 shrink-0">
                {!isLoaded ? <div className="h-full w-full flex items-center justify-center bg-gray-200"><Loader className="w-16 h-16 text-sky-600 animate-spin" /></div> : 
                (<GoogleMap mapContainerStyle={containerStyle} center={center} zoom={12}>{/* Marcadores aqui */}</GoogleMap>)}
            </div>

            <div className="w-full flex-grow overflow-y-auto space-y-4 pb-4">
                 {Object.values(timeBlocks).filter(b => b.routes).map(block => (
                    <div key={block.name} className="bg-gray-100 rounded-xl">
                        <button onClick={() => handleToggleBlock(block.name.toLowerCase())} className="w-full p-4 text-left flex justify-between items-center bg-white rounded-t-xl shadow-sm">
                            <span className="flex items-center gap-3 text-gray-700 font-bold text-xl">{block.icon}{block.name}</span>
                            {collapsedBlocks[block.name.toLowerCase()] ? <ChevronDown/> : <ChevronUp/>}
                        </button>
                        {!collapsedBlocks[block.name.toLowerCase()] && (
                            <div className="p-4 flex overflow-x-auto gap-4">
                                {Object.entries(block.routes).map(([routeId, route]) => (
                                    <RouteColumn 
                                        key={routeId} 
                                        routeId={routeId} 
                                        route={route} 
                                        drivers={drivers} 
                                        onAssignTask={handleAssignTask}
                                        onAssign={handleAssignDriverToRoute}
                                        onRemove={handleRemoveDriverFromRoute}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PlanningPage;

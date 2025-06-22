import React, { useState, useEffect, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { collection, onSnapshot, query, doc, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ChevronLeft, ChevronRight, Loader, Sun, Moon, CloudSun } from 'lucide-react';
import { DragDropContext } from 'react-beautiful-dnd';
import MorningBlock from '../components/planning/MorningBlock';
import AfternoonBlock from '../components/planning/AfternoonBlock';
import NightBlock from '../components/planning/NightBlock';

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const appId = 'turms-local-dev';

const containerStyle = { width: '100%', height: '100%' };
const center = { lat: -19.916681, lng: -43.934493 };

const PlanningPage = ({ user, isLoaded }) => {
    const [allOrders, setAllOrders] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [activeTab, setActiveTab] = useState('tarde'); // Começa na aba da tarde por padrão

    useEffect(() => {
        if (!user) return;
        const driversUnsubscribe = onSnapshot(collection(db, `artifacts/${appId}/users/${user.uid}/drivers`), (snap) => setDrivers(snap.docs.map(d => ({...d.data(), id: d.id}))));
        const ordersUnsubscribe = onSnapshot(collection(db, `artifacts/${appId}/users/${user.uid}/orders`), (snap) => setAllOrders(snap.docs.map(o => ({...o.data(), id: o.id}))));
        return () => { driversUnsubscribe(); ordersUnsubscribe(); };
    }, [user]);

    const tasksForDay = useMemo(() => {
        const startOfDay = new Date(selectedDate); startOfDay.setHours(0,0,0,0);
        const endOfDay = new Date(selectedDate); endOfDay.setHours(23,59,59,999);
        return allOrders.reduce((acc, order) => {
            ['pickupTask', 'deliveryTask'].forEach(taskName => {
                const task = order[taskName];
                if (task && task.scheduledDate?.toDate() >= startOfDay && task.scheduledDate?.toDate() <= endOfDay) {
                    acc.push({
                        ...task,
                        order,
                        taskName // Add the task name (pickupTask/deliveryTask) for reference
                    });
                }
            });
            return acc;
        }, []);
    }, [selectedDate, allOrders]);

    const onDragEnd = async (result) => {
        const { source, destination, draggableId } = result;
        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const [orderId, taskType] = draggableId.split('|');
        const destRouteId = destination.droppableId === 'unassigned_bh' ? null : destination.droppableId;
        
        try {
            const batch = writeBatch(db);
            const ordersCollectionPath = `artifacts/${appId}/users/${user.uid}/orders`;
            
            // Helper function to get tasks for a route without mutating original array
            const getTasksForRoute = (routeId) => {
                if (routeId === 'unassigned_bh') {
                    return tasksForDay.filter(t => t.city === 'BH' && !t.assignedTo);
                }
                return tasksForDay.filter(t => t.assignedTo === routeId);
            };
            
            const sourceTasks = getTasksForRoute(source.droppableId);
            const destTasks = getTasksForRoute(destination.droppableId);

            // Create copies to avoid mutating original arrays
            const sourceTasksCopy = [...sourceTasks];
            const destTasksCopy = source.droppableId === destination.droppableId ? sourceTasksCopy : [...destTasks];

            // Find the moved task
            const movedTask = sourceTasksCopy[source.index];
            if (!movedTask) {
                console.error("Task not found at source index");
                return;
            }

            // Remove from source and add to destination
            sourceTasksCopy.splice(source.index, 1);
            destTasksCopy.splice(destination.index, 0, movedTask);

            // Update the moved task's assignment and order
            const movedOrderRef = doc(db, ordersCollectionPath, orderId);
            batch.update(movedOrderRef, {
                [`${taskType}.assignedTo`]: destRouteId,
                [`${taskType}.orderInRoute`]: destination.index,
            });

            // Reorder tasks in destination column
            destTasksCopy.forEach((task, index) => {
                if (task.order.id !== orderId) {
                    const taskNameForUpdate = task.taskName || taskType;
                    batch.update(doc(db, ordersCollectionPath, task.order.id), {
                        [`${taskNameForUpdate}.orderInRoute`]: index
                    });
                }
            });

            // Reorder tasks in source column if different from destination
            if (source.droppableId !== destination.droppableId) {
                sourceTasksCopy.forEach((task, index) => {
                    const taskNameForUpdate = task.taskName || taskType;
                    batch.update(doc(db, ordersCollectionPath, task.order.id), {
                        [`${taskNameForUpdate}.orderInRoute`]: index
                    });
                });
            }
            
            await batch.commit();
            console.log("Task moved successfully");

        } catch (error) {
            console.error("Erro ao mover tarefa: ", error);
        }
    };
    
    const handleDateChange = (days) => setSelectedDate(d => { const newDate = new Date(d); newDate.setDate(d.getDate() + days); return newDate; });

    const TabButton = ({ tabId, currentTab, setTab, text, icon }) => (
        <button onClick={() => setTab(tabId)} className={`flex items-center gap-2 px-4 py-3 font-bold border-b-4 transition-colors ${currentTab === tabId ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
            {icon}{text}
        </button>
    );

    return (
        <div className="h-full w-full flex flex-col font-sans gap-4">
            <div className="bg-white p-2 rounded-xl shadow-md flex justify-between items-center shrink-0">
                <button onClick={() => handleDateChange(-1)} className="p-2 rounded-full hover:bg-gray-100"><ChevronLeft/></button>
                <h2 className="text-xl font-bold text-gray-700">{selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
                <button onClick={() => handleDateChange(1)} className="p-2 rounded-full hover:bg-gray-100"><ChevronRight/></button>
            </div>
            
            <div className="w-full h-[40%] rounded-xl overflow-hidden shadow-lg bg-gray-300 shrink-0">
                {!isLoaded ? <div className="h-full w-full flex items-center justify-center bg-gray-200"><Loader className="w-16 h-16 text-sky-600 animate-spin" /></div> : 
                (<GoogleMap mapContainerStyle={containerStyle} center={center} zoom={12}>{/* Map markers here */}</GoogleMap>)}
            </div>

            <div className="w-full flex-grow flex flex-col min-h-0">
                <div className="flex shrink-0 border-b border-gray-200 bg-white rounded-t-xl">
                    <TabButton tabId="manha" currentTab={activeTab} setTab={setActiveTab} text="Manhã" icon={<Sun size={20}/>} />
                    <TabButton tabId="tarde" currentTab={activeTab} setTab={setActiveTab} text="Tarde" icon={<CloudSun size={20}/>} />
                    <TabButton tabId="noite" currentTab={activeTab} setTab={setActiveTab} text="Noite" icon={<Moon size={20}/>} />
                </div>
                <div className="flex-grow p-4 bg-white rounded-b-xl shadow-inner overflow-x-auto">
                    <DragDropContext onDragEnd={onDragEnd}>
                        {activeTab === 'manha' && <MorningBlock tasks={tasksForDay} drivers={drivers} />}
                        {activeTab === 'tarde' && <AfternoonBlock tasks={tasksForDay} drivers={drivers.slice(0, 2)} />}
                        {activeTab === 'noite' && <NightBlock tasks={tasksForDay} drivers={drivers} />}
                    </DragDropContext>
                </div>
            </div>
        </div>
    );
};

export default PlanningPage;

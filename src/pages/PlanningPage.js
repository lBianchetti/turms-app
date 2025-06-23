import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleMap, MarkerF } from '@react-google-maps/api';
import { collection, onSnapshot, query, doc, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ChevronLeft, ChevronRight, Loader, Sun, Moon, CloudSun } from 'lucide-react';
import { DragDropContext } from 'react-beautiful-dnd';
import MorningBlock from '../components/planning/MorningBlock';
import AfternoonBlock from '../components/planning/AfternoonBlock';
import NightBlock from '../components/planning/NightBlock';

const appId = 'turms-local-dev';
const GOOGLE_MAP_ID = process.env.REACT_APP_GOOGLE_MAP_ID;

const containerStyle = { width: '100%', height: '100%' };
const center = { lat: -19.916681, lng: -43.934493 };

// Estilo do mapa a partir do JSON fornecido
const mapStyles = [
    { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
    { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
    { featureType: "administrative.land_parcel", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
    { featureType: "poi", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
    { featureType: "poi", elementType: "labels.text", stylers: [{ visibility: "off" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
    { featureType: "poi.business", stylers: [{ visibility: "off" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
    { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
    { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] },
    { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
    { featureType: "road.local", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
    { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
    { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] }
  ];


// Paleta de cores para cada rota
const routeColors = {
  entregas_lafa: '#10b981',      // Emerald 500
  coletas_fora: '#f59e0b',       // Amber 500
  entregas_noturnas: '#6366f1',  // Indigo 500
  unassigned_bh: '#a1a1aa',      // Zinc 400
  driver1: '#3b82f6',            // Blue 500
  driver2: '#ef4444',            // Red 500
  default: '#6b7280',            // Gray 500
};

const PlanningPage = ({ user, isLoaded }) => {
    const [allOrders, setAllOrders] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [activeTab, setActiveTab] = useState('tarde');
    const [hoveredTaskId, setHoveredTaskId] = useState(null);
    const [optimizingRouteId, setOptimizingRouteId] = useState(null);

    const mapRef = useRef(null);
    const directionsServiceRef = useRef(null);

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
                if (task && task.geo && task.scheduledDate?.toDate() >= startOfDay && task.scheduledDate?.toDate() <= endOfDay) {
                    acc.push({ ...task, id: `${order.id}|${taskName}`, order, taskName });
                }
            });
            return acc;
        }, []);
    }, [selectedDate, allOrders]);

    const handleOptimizeRoute = async (routeId, tasksToOptimize) => {
        if (!directionsServiceRef.current || tasksToOptimize.length < 2) {
            alert('São necessárias pelo menos 2 tarefas para otimizar uma rota.');
            return;
        }
        setOptimizingRouteId(routeId);

        const origin = tasksToOptimize[0].geo;
        const destination = tasksToOptimize[tasksToOptimize.length - 1].geo;
        const waypoints = tasksToOptimize.slice(1, -1).map(task => ({
            location: task.geo,
            stopover: true,
        }));

        const request = {
            origin,
            destination,
            waypoints,
            travelMode: window.google.maps.TravelMode.DRIVING,
            optimizeWaypoints: true,
        };

        directionsServiceRef.current.route(request, async (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK) {
                const optimizedOrder = result.routes[0].waypoint_order;
                
                const reorderedTasks = [
                    tasksToOptimize[0],
                    ...optimizedOrder.map(i => tasksToOptimize[i + 1]),
                    tasksToOptimize[tasksToOptimize.length - 1]
                ];

                const batch = writeBatch(db);
                const ordersCollectionPath = `artifacts/${appId}/users/${user.uid}/orders`;
                reorderedTasks.forEach((task, index) => {
                    const orderRef = doc(db, ordersCollectionPath, task.order.id);
                    batch.update(orderRef, { [`${task.taskName}.orderInRoute`]: index });
                });
                await batch.commit();
            } else {
                console.error(`Erro do Google Directions API: ${status}`);
                alert(`Não foi possível otimizar a rota. Motivo: ${status}`);
            }
            setOptimizingRouteId(null);
        });
    };
    
    const onDragEnd = async (result) => {
        const { source, destination, draggableId } = result;
        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;
        
        try {
            const batch = writeBatch(db);
            const ordersCollectionPath = `artifacts/${appId}/users/${user.uid}/orders`;
            
            const getTasksForRoute = (routeId) => {
                if (routeId === 'unassigned_bh') {
                    return tasksForDay.filter(t => t.city === 'BH' && !t.assignedTo);
                }
                return tasksForDay.filter(t => t.assignedTo === routeId);
            };

            const startList = getTasksForRoute(source.droppableId).sort((a,b) => a.orderInRoute - b.orderInRoute);
            const finishList = getTasksForRoute(destination.droppableId).sort((a,b) => a.orderInRoute - b.orderInRoute);
            
            const [movedTask] = startList.splice(source.index, 1);
            const newAssignedTo = destination.droppableId === 'unassigned_bh' ? null : destination.droppableId;
            
            if (source.droppableId === destination.droppableId) {
                startList.splice(destination.index, 0, movedTask);
                startList.forEach((task, index) => {
                    const orderRef = doc(db, ordersCollectionPath, task.order.id);
                    batch.update(orderRef, { [`${task.taskName}.orderInRoute`]: index });
                });
            } else {
                finishList.splice(destination.index, 0, movedTask);
                startList.forEach((task, index) => {
                    const orderRef = doc(db, ordersCollectionPath, task.order.id);
                    batch.update(orderRef, { [`${task.taskName}.orderInRoute`]: index });
                });
                finishList.forEach((task, index) => {
                    const orderRef = doc(db, ordersCollectionPath, task.order.id);
                    const assignment = task.id === movedTask.id ? newAssignedTo : task.assignedTo;
                    batch.update(orderRef, { 
                        [`${task.taskName}.assignedTo`]: assignment,
                        [`${task.taskName}.orderInRoute`]: index 
                    });
                });
            }
            await batch.commit();
        } catch (error) {
            console.error("Erro ao mover tarefa: ", error);
        }
    };
    
    const handleDateChange = (days) => setSelectedDate(d => { const newDate = new Date(d); newDate.setDate(d.getDate() + days); return newDate; });

    const onMapLoad = (map) => {
        mapRef.current = map;
        if (window.google && window.google.maps) {
            directionsServiceRef.current = new window.google.maps.DirectionsService();
        }
    };

    const onMapUnmount = () => { mapRef.current = null; directionsServiceRef.current = null; };
    
    const handleTaskMouseEnter = (taskId) => {
        setHoveredTaskId(taskId);
        const task = tasksForDay.find(t => t.id === taskId);
        if (task && task.geo && mapRef.current) {
            mapRef.current.panTo(task.geo);
        }
    };

    const handleTaskMouseLeave = () => setHoveredTaskId(null);

    const getMarkerOptions = (task) => {
        const routeId = task.assignedTo;
        const isHovered = task.id === hoveredTaskId;

        const iconPath = task.type === 'coleta' 
            ? window.google.maps.SymbolPath.CIRCLE 
            : 'M -1,-1 L 1,-1 L 1,1 L -1,1 Z'; // Quadrado

        let color = routeColors.default;
        if (routeId === drivers[0]?.id) color = routeColors.driver1;
        else if (routeId === drivers[1]?.id) color = routeColors.driver2;
        else if (routeId && routeColors[routeId]) color = routeColors[routeId];
        else if (!routeId) color = routeColors.unassigned_bh;

        return {
            path: iconPath,
            fillColor: color,
            fillOpacity: 0.9,
            strokeColor: 'white',
            strokeWeight: isHovered ? 2 : 1.5,
            scale: isHovered ? 9 : 7,
        };
    };

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
                (<GoogleMap 
                    mapContainerStyle={containerStyle} 
                    center={center} 
                    zoom={12}
                    onLoad={onMapLoad}
                    onUnmount={onMapUnmount}
                    options={{ 
                        gestureHandling: 'greedy',
                        styles: mapStyles, // <-- CORREÇÃO APLICADA AQUI
                        disableDefaultUI: true, // Opcional: remove controles padrão do mapa
                        zoomControl: true,
                    }}
                >
                    {tasksForDay.map(task => (
                        <MarkerF 
                            key={task.id} 
                            position={task.geo}
                            options={{ icon: getMarkerOptions(task) }}
                            onMouseOver={() => handleTaskMouseEnter(task.id)}
                            onMouseOut={handleTaskMouseLeave}
                        />
                    ))}
                </GoogleMap>)}
            </div>

            <div className="w-full flex-grow flex flex-col min-h-0">
                <div className="flex shrink-0 border-b border-gray-200 bg-white rounded-t-xl">
                    <TabButton tabId="manha" currentTab={activeTab} setTab={setActiveTab} text="Manhã" icon={<Sun size={20}/>} />
                    <TabButton tabId="tarde" currentTab={activeTab} setTab={setActiveTab} text="Tarde" icon={<CloudSun size={20}/>} />
                    <TabButton tabId="noite" currentTab={activeTab} setTab={setActiveTab} text="Noite" icon={<Moon size={20}/>} />
                </div>
                <div className="flex-grow p-4 bg-white rounded-b-xl shadow-inner overflow-x-auto">
                    <DragDropContext onDragEnd={onDragEnd}>
                        <div className="flex h-full gap-4">
                           {activeTab === 'manha' && <MorningBlock onOptimize={handleOptimizeRoute} optimizingRouteId={optimizingRouteId} tasks={tasksForDay} drivers={drivers} onTaskMouseEnter={handleTaskMouseEnter} onTaskMouseLeave={handleTaskMouseLeave} />}
                           {activeTab === 'tarde' && <AfternoonBlock onOptimize={handleOptimizeRoute} optimizingRouteId={optimizingRouteId} tasks={tasksForDay} drivers={drivers.slice(0, 2)} onTaskMouseEnter={handleTaskMouseEnter} onTaskMouseLeave={handleTaskMouseLeave} />}
                           {activeTab === 'noite' && <NightBlock onOptimize={handleOptimizeRoute} optimizingRouteId={optimizingRouteId} tasks={tasksForDay} drivers={drivers} onTaskMouseEnter={handleTaskMouseEnter} onTaskMouseLeave={handleTaskMouseLeave} />}
                        </div>
                    </DragDropContext>
                </div>
            </div>
        </div>
    );
};

export default PlanningPage;
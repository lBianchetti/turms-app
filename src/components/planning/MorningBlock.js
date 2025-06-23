import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import TaskCard from '../TaskCard';
import { Zap, Loader } from 'lucide-react';

const RouteColumn = ({ routeId, name, tasks, onOptimize, optimizingRouteId, onTaskMouseEnter, onTaskMouseLeave }) => (
    <div className="bg-gray-200 rounded-xl flex-1 min-w-[350px] flex flex-col h-full">
        <div className="p-4 border-b border-gray-300 flex justify-between items-center">
            <div>
                <h3 className="font-bold text-lg text-gray-800">{name}</h3>
                <p className="text-sm text-gray-500">{tasks.length} tarefa(s)</p>
            </div>
            {tasks.length > 1 && (
                <button onClick={() => onOptimize(routeId, tasks)} disabled={optimizingRouteId === routeId} className="p-2 rounded-lg bg-sky-500 text-white hover:bg-sky-600 disabled:bg-gray-400">
                    {optimizingRouteId === routeId ? <Loader className="w-5 h-5 animate-spin"/> : <Zap className="w-5 h-5"/>}
                </button>
            )}
        </div>
        <Droppable droppableId={routeId}>
            {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="p-4 overflow-y-auto flex-grow">
                    {tasks.map((task, index) => (
                        <TaskCard 
                            key={task.id || `${task.order.id}|${task.taskName}`}
                            task={task} 
                            order={task.order} 
                            index={index}
                            onMouseEnter={onTaskMouseEnter}
                            onMouseLeave={onTaskMouseLeave}
                        />
                    ))}
                    {provided.placeholder}
                </div>
            )}
        </Droppable>
    </div>
);

const MorningBlock = ({ tasks, onOptimize, optimizingRouteId, onTaskMouseEnter, onTaskMouseLeave }) => {
    const entregasLafa = tasks.filter(t => t.assignedTo === 'entregas_lafa').sort((a,b) => a.orderInRoute - b.orderInRoute);
    const coletasFora = tasks.filter(t => t.assignedTo === 'coletas_fora').sort((a,b) => a.orderInRoute - b.orderInRoute);
    
    return (
        <div className="flex h-full gap-4">
            <RouteColumn 
                routeId="entregas_lafa" 
                name="Entregas Lafaiete" 
                tasks={entregasLafa} 
                onOptimize={onOptimize} 
                optimizingRouteId={optimizingRouteId}
                onTaskMouseEnter={onTaskMouseEnter}
                onTaskMouseLeave={onTaskMouseLeave}
            />
            <RouteColumn 
                routeId="coletas_fora" 
                name="Coletas Lafaiete/Congonhas" 
                tasks={coletasFora} 
                onOptimize={onOptimize} 
                optimizingRouteId={optimizingRouteId}
                onTaskMouseEnter={onTaskMouseEnter}
                onTaskMouseLeave={onTaskMouseLeave}
            />
        </div>
    );
};

export default MorningBlock;
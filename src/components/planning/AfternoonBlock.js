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
            {/* Otimização só é permitida para rotas com motoristas, não para "Não Atribuído" */}
            {tasks.length > 1 && routeId !== 'unassigned_bh' && (
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

const AfternoonBlock = ({ tasks, drivers, onOptimize, optimizingRouteId, onTaskMouseEnter, onTaskMouseLeave }) => {
    const bhTasks = tasks.filter(t => t.city === 'BH');
    const unassignedBH = bhTasks.filter(t => !t.assignedTo);
    const driver1Tasks = bhTasks.filter(t => t.assignedTo === drivers[0]?.id).sort((a,b) => a.orderInRoute - b.orderInRoute);
    const driver2Tasks = bhTasks.filter(t => t.assignedTo === drivers[1]?.id).sort((a,b) => a.orderInRoute - b.orderInRoute);
    
    return (
        <div className="flex h-full gap-4">
            <RouteColumn routeId="unassigned_bh" name="Não Atribuído (BH)" tasks={unassignedBH} onTaskMouseEnter={onTaskMouseEnter} onTaskMouseLeave={onTaskMouseLeave} />
            {drivers[0] && <RouteColumn routeId={drivers[0].id} name={`Rota BH - ${drivers[0].name}`} tasks={driver1Tasks} onOptimize={onOptimize} optimizingRouteId={optimizingRouteId} onTaskMouseEnter={onTaskMouseEnter} onTaskMouseLeave={onTaskMouseLeave} />}
            {drivers[1] && <RouteColumn routeId={drivers[1].id} name={`Rota BH - ${drivers[1].name}`} tasks={driver2Tasks} onOptimize={onOptimize} optimizingRouteId={optimizingRouteId} onTaskMouseEnter={onTaskMouseEnter} onTaskMouseLeave={onTaskMouseLeave} />}
        </div>
    );
};

export default AfternoonBlock;
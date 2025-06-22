import React from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import TaskCard from '../TaskCard';

const RouteColumn = ({ routeId, name, tasks }) => (
    <div className="bg-gray-200 rounded-xl flex-1 min-w-[350px] flex flex-col h-full">
        <div className="p-4 border-b border-gray-300">
            <h3 className="font-bold text-lg text-gray-800">{name}</h3>
            <p className="text-sm text-gray-500">{tasks.length} tarefa(s)</p>
        </div>
        <Droppable droppableId={routeId}>
            {(provided, snapshot) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className={`p-4 overflow-y-auto flex-grow ${snapshot.isDraggingOver ? 'bg-sky-100' : ''}`}>
                    {tasks.map((task, index) => <TaskCard key={`${task.order.id}-${task.type}`} task={task} order={task.order} index={index}/>)}
                    {provided.placeholder}
                </div>
            )}
        </Droppable>
    </div>
);

const MorningBlock = ({ tasks, drivers }) => {
    const entregasLafa = tasks.filter(t => t.assignedTo === 'entregas_lafa').sort((a,b) => a.orderInRoute - b.orderInRoute);
    const coletasFora = tasks.filter(t => t.assignedTo === 'coletas_fora').sort((a,b) => a.orderInRoute - b.orderInRoute);
    
    return (
        <div className="flex h-full gap-4">
            <RouteColumn routeId="entregas_lafa" name="Entregas Lafaiete" tasks={entregasLafa} />
            <RouteColumn routeId="coletas_fora" name="Coletas Lafaiete/Congonhas" tasks={coletasFora} />
        </div>
    );
};

export default MorningBlock;

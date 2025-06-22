import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
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

const AfternoonBlock = ({ tasks, drivers }) => {
    const unassignedBH = tasks.filter(t => t.city === 'BH' && !t.assignedTo);
    const driver1Tasks = tasks.filter(t => t.assignedTo === drivers[0]?.id).sort((a,b) => a.orderInRoute - b.orderInRoute);
    const driver2Tasks = tasks.filter(t => t.assignedTo === drivers[1]?.id).sort((a,b) => a.orderInRoute - b.orderInRoute);
    
    return (
        <div className="flex h-full gap-4">
            <RouteColumn routeId="unassigned_bh" name="Não Atribuído (BH)" tasks={unassignedBH} />
            {drivers[0] && <RouteColumn routeId={drivers[0].id} name={`Rota BH - ${drivers[0].name}`} tasks={driver1Tasks} />}
            {drivers[1] && <RouteColumn routeId={drivers[1].id} name={`Rota BH - ${drivers[1].name}`} tasks={driver2Tasks} />}
        </div>
    );
};

export default AfternoonBlock;

import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { GripVertical } from 'lucide-react';

const TaskCard = ({ task, order, index }) => {
    // Use taskName (pickupTask/deliveryTask) for draggable ID, fallback to task.type
    const taskIdentifier = task.taskName || (task.type === 'coleta' ? 'pickupTask' : 'deliveryTask');
    
    return (
        <Draggable draggableId={`${order.id}|${taskIdentifier}`} index={index}>
            {(provided) => (
                <div ref={provided.innerRef} {...provided.draggableProps} className="bg-white p-3 mb-3 rounded-lg shadow-sm border flex items-start">
                    <div {...provided.dragHandleProps} className="p-1 cursor-grab">
                        <GripVertical className="text-gray-400" />
                    </div>
                    <div className="ml-2">
                        <p className="font-semibold text-gray-800">{order.clientName}</p>
                        <p className={`text-xs font-bold uppercase ${task.type === 'coleta' ? 'text-blue-600' : 'text-red-600'}`}>{task.type} {task.city && `(${task.city})`}</p>
                        <p className="text-sm text-gray-600 mt-1">{task.address}</p>
                    </div>
                </div>
            )}
        </Draggable>
    );
};

export default TaskCard;

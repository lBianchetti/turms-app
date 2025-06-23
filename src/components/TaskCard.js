import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { GripVertical, MessageSquare } from 'lucide-react';

const TaskCard = ({ task, order, index, onMouseEnter, onMouseLeave }) => {
    const taskIdentifier = task.taskName || (task.type === 'coleta' ? 'pickupTask' : 'deliveryTask');
    
    return (
        <Draggable draggableId={`${order.id}|${taskIdentifier}`} index={index}>
            {(provided) => (
                <div 
                    ref={provided.innerRef} 
                    {...provided.draggableProps} 
                    onMouseEnter={() => onMouseEnter && onMouseEnter(task.id)}
                    onMouseLeave={() => onMouseLeave && onMouseLeave()}
                    className="bg-white p-3 mb-3 rounded-lg shadow-sm border flex items-start"
                >
                    <div {...provided.dragHandleProps} className="p-1 cursor-grab">
                        <GripVertical className="text-gray-400" />
                    </div>
                    <div className="ml-2 flex-grow">
                        <div className="flex justify-between items-start">
                           <p className="font-semibold text-gray-800">{order.clientName}</p>
                           {order.observations && (
                               <div title={order.observations} className="cursor-help">
                                   <MessageSquare className="w-4 h-4 text-amber-500" />
                               </div>
                           )}
                        </div>
                        <p className={`text-xs font-bold uppercase ${task.type === 'coleta' ? 'text-blue-600' : 'text-red-600'}`}>{task.type} {task.city && `(${task.city})`}</p>
                        <p className="text-sm text-gray-600 mt-1">{task.address}</p>
                    </div>
                </div>
            )}
        </Draggable>
    );
};

export default TaskCard;
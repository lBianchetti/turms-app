import React from 'react';
import { Truck } from 'lucide-react';

const TaskCard = ({ task, order, drivers, onAssignTask }) => {

    const assignedDriverId = task.routeId && !task.routeId.includes('_unassigned') ? task.routeId : '';

    return (
        <div className={`bg-white p-4 mb-3 rounded-lg shadow-sm border-l-4 ${task.type === 'coleta' ? 'border-blue-500' : 'border-red-500'}`}>
            <p className="font-semibold text-gray-800">{order.clientName}</p>
            <p className={`text-xs font-bold uppercase ${task.type === 'coleta' ? 'text-blue-600' : 'text-red-600'}`}>{task.type}</p>
            <p className="text-sm text-gray-600 mt-1">{task.address}</p>

            <div className="mt-3 pt-3 border-t border-gray-200">
                <label className="text-xs font-medium text-gray-500 flex items-center gap-1 mb-1">
                    <Truck size={14} />
                    Atribuir a:
                </label>
                <select
                    value={assignedDriverId}
                    onChange={(e) => onAssignTask(order.id, task.type, e.target.value)}
                    className="w-full text-sm p-1.5 border rounded-md bg-gray-50 hover:bg-gray-100"
                >
                    <option value="">-- Não Atribuído --</option>
                    {drivers.map(driver => (
                        <option key={driver.id} value={driver.id}>
                            {driver.name}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default TaskCard;

import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { GripVertical, MapPin } from 'lucide-react';

// Função para obter a cor da tag, para evitar repetição de código
const getTagChipStyle = (tag) => {
    switch(tag) {
        case 'Frágil': return 'bg-red-100 text-red-600';
        case 'Pesado': return 'bg-yellow-100 text-yellow-600';
        case 'Urgente': return 'bg-blue-100 text-blue-600';
        default: return 'bg-gray-100 text-gray-500';
    }
};

const OrderCard = ({ item, index, onMouseEnter, onMouseLeave }) => {
    return (
        <Draggable draggableId={item.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onMouseEnter={() => onMouseEnter(item.id)}
                    onMouseLeave={onMouseLeave}
                    className={`bg-white p-3 mb-3 rounded-lg shadow-sm border-l-4 transition-all duration-200 ${snapshot.isDragging ? 'border-sky-500 shadow-xl scale-105' : 'border-gray-300 hover:border-sky-400'}`}
                >
                    <div className="flex items-start">
                        <GripVertical className="text-gray-400 mr-2 mt-1 shrink-0 cursor-grab" />
                        <div className="flex-grow">
                            <p className="font-semibold text-gray-800 break-words">{item.clientName}</p>
                            
                            <div className="flex items-center mt-2 text-xs text-gray-600">
                                <MapPin className="w-4 h-4 text-blue-500 mr-1.5 shrink-0" />
                                <span className="break-all">O: {item.origin}</span>
                            </div>
                            
                            <div className="flex items-center mt-1 text-xs text-gray-600">
                                <MapPin className="w-4 h-4 text-red-500 mr-1.5 shrink-0" />
                                <span className="break-all">D: {item.destination}</span>
                            </div>

                            {item.tags && item.tags.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {item.tags.map(tag => (
                                        <span key={tag} className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getTagChipStyle(tag)}`}>
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
};

export default OrderCard;


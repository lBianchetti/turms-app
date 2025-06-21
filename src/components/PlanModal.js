import React from 'react';
import { Sparkles, X } from 'lucide-react';

const PlanModal = ({ setShow, plan, loading }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-full flex flex-col">
            <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                    <Sparkles className="text-yellow-400"/> Plano do Dia Sugerido
                </h2>
                <button onClick={() => setShow(false)} className="p-2 rounded-full hover:bg-gray-100">
                    <X className="w-6 h-6 text-gray-600" />
                </button>
            </div>
            <div className="p-8 overflow-y-auto">
                {loading ? (
                    <p className="text-center text-gray-600">Analisando pedidos e gerando o plano...</p>
                ) : (
                    <pre className="text-gray-700 whitespace-pre-wrap font-sans text-base leading-relaxed">{plan}</pre>
                )}
            </div>
        </div>
    </div>
);

export default PlanModal;
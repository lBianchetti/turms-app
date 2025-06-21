import React, { useState } from 'react';
import { Calculator, Loader } from 'lucide-react';
import { calculateFreight } from '../services/freightCalculator';

const FreightCalculator = ({ settings, weight, setWeight, size, setSize, destination, onValueCalculated }) => {
    const [calculating, setCalculating] = useState(false);
    const [error, setError] = useState('');

    const handleCalculate = () => {
        if (!settings || !weight || !destination) {
            setError("Para calcular, preencha o peso e o destino.");
            return;
        }
        setCalculating(true);
        setError('');

        // Simula um pequeno atraso para feedback visual
        setTimeout(() => {
            const result = calculateFreight(settings, {
                weight,
                size,
                destinationLabel: destination.label
            });
            onValueCalculated(result);
            setCalculating(false);
        }, 300);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
                    <input 
                        type="number" 
                        value={weight} 
                        onChange={(e) => setWeight(e.target.value)} 
                        placeholder="Ex: 50" 
                        className="w-full px-4 py-2 bg-gray-50 border rounded-lg"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tamanho</label>
                    <select 
                        value={size} 
                        onChange={(e) => setSize(e.target.value)} 
                        className="w-full px-4 py-2 bg-gray-50 border rounded-lg h-[42px]"
                    >
                        <option value="small">Pequeno</option>
                        <option value="medium">Médio</option>
                        <option value="large">Grande</option>
                    </select>
                </div>
            </div>
            <div className="flex items-end gap-3">
                <button 
                    type="button" 
                    onClick={handleCalculate} 
                    disabled={!settings || calculating} 
                    className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 disabled:bg-gray-300 h-[42px] w-[42px] flex items-center justify-center"
                >
                    {calculating ? <Loader className="w-6 h-6 animate-spin"/> : <Calculator size={24}/>}
                </button>
                {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
        </div>
    );
};

export default FreightCalculator;

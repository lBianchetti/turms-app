import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { DollarSign, Save } from 'lucide-react';

const appId = 'turms-local-dev';

const defaultSettings = {
    baseRate: 80,
    nightRate: 20,
    sizeRates: { small: 0, medium: 20, large: 50 },
    weightTiers: [
        { from: 0, to: 80, rate: 0 },
        { from: 80, to: 120, rate: 10 },
        { from: 120, to: 200, rate: 30 },
        { from: 200, to: 300, rate: 50 },
        { from: 300, to: 400, rate: 70 },
    ],
    zoneRates: [
        { zone: 'BH Central', rate: 10 },
        { zone: 'Contagem', rate: 20 },
        { zone: 'Betim', rate: 30 },
    ]
};

const FreightSettings = ({ user }) => {
    const [settings, setSettings] = useState(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('');

    const settingsDocPath = `artifacts/${appId}/users/${user.uid}/settings/freightRules`;

    useEffect(() => {
        const fetchSettings = async () => {
            const docRef = doc(db, settingsDocPath);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setSettings(docSnap.data());
            } else {
                // Se não existir, guarda as configurações padrão
                await setDoc(docRef, defaultSettings);
            }
            setLoading(false);
        };
        fetchSettings();
    }, [settingsDocPath]);

    const handleSave = async () => {
        setStatus('A guardar...');
        const docRef = doc(db, settingsDocPath);
        try {
            await setDoc(docRef, settings, { merge: true });
            setStatus('Guardado com sucesso!');
        } catch (error) {
            console.error("Erro ao guardar as configurações: ", error);
            setStatus('Erro ao guardar.');
        }
        setTimeout(() => setStatus(''), 2000);
    };

    const handleWeightChange = (index, field, value) => {
        const updatedTiers = [...settings.weightTiers];
        updatedTiers[index][field] = Number(value);
        setSettings({ ...settings, weightTiers: updatedTiers });
    };

    const handleZoneChange = (index, field, value) => {
        const updatedZones = [...settings.zoneRates];
        updatedZones[index][field] = field === 'rate' ? Number(value) : value;
        setSettings({ ...settings, zoneRates: updatedZones });
    };

    if (loading) return <p>A carregar configurações...</p>;

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-700 mb-4 flex items-center gap-3"><DollarSign />Valores Base</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
                    <div>
                        <label className="block text-sm font-medium text-gray-600">Taxa Mínima (R$)</label>
                        <input type="number" value={settings.baseRate} onChange={(e) => setSettings({...settings, baseRate: Number(e.target.value)})} className="w-full mt-1 p-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600">Adicional Noturno (R$)</label>
                        <input type="number" value={settings.nightRate} onChange={(e) => setSettings({...settings, nightRate: Number(e.target.value)})} className="w-full mt-1 p-2 border rounded-md" />
                    </div>
                </div>
            </div>
            
            <div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">Por Tamanho da Carga (R$)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-gray-50 rounded-lg">
                    <div>
                        <label className="block text-sm font-medium text-gray-600">Pequeno</label>
                        <input type="number" value={settings.sizeRates.small} onChange={(e) => setSettings({...settings, sizeRates: {...settings.sizeRates, small: Number(e.target.value)}})} className="w-full mt-1 p-2 border rounded-md" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-600">Médio</label>
                        <input type="number" value={settings.sizeRates.medium} onChange={(e) => setSettings({...settings, sizeRates: {...settings.sizeRates, medium: Number(e.target.value)}})} className="w-full mt-1 p-2 border rounded-md" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-600">Grande</label>
                        <input type="number" value={settings.sizeRates.large} onChange={(e) => setSettings({...settings, sizeRates: {...settings.sizeRates, large: Number(e.target.value)}})} className="w-full mt-1 p-2 border rounded-md" />
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">Por Faixa de Peso (kg)</h3>
                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                    {settings.weightTiers.map((tier, index) => (
                        <div key={index} className="grid grid-cols-3 gap-4 items-center">
                            <input type="number" placeholder="De" value={tier.from} onChange={e => handleWeightChange(index, 'from', e.target.value)} className="w-full p-2 border rounded-md"/>
                            <input type="number" placeholder="Até" value={tier.to} onChange={e => handleWeightChange(index, 'to', e.target.value)} className="w-full p-2 border rounded-md"/>
                            <input type="number" placeholder="Adicional R$" value={tier.rate} onChange={e => handleWeightChange(index, 'rate', e.target.value)} className="w-full p-2 border rounded-md"/>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">Por Zona de Destino (Bairro/Cidade)</h3>
                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                     {settings.zoneRates.map((zone, index) => (
                        <div key={index} className="grid grid-cols-2 gap-4 items-center">
                            <input type="text" placeholder="Nome da Zona" value={zone.zone} onChange={e => handleZoneChange(index, 'zone', e.target.value)} className="w-full p-2 border rounded-md"/>
                            <input type="number" placeholder="Adicional R$" value={zone.rate} onChange={e => handleZoneChange(index, 'rate', e.target.value)} className="w-full p-2 border rounded-md"/>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end items-center gap-4 pt-6">
                <span className="text-sm text-green-600">{status}</span>
                <button onClick={handleSave} className="bg-green-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-green-700 flex items-center gap-2">
                    <Save size={18} />
                    Guardar Todas as Configurações
                </button>
            </div>
        </div>
    );
};

export default FreightSettings;

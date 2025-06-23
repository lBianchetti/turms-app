import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { GoogleMap, HeatmapLayer } from '@react-google-maps/api';
import { Loader, MapPin, Search } from 'lucide-react';

const appId = 'turms-local-dev';

// Estilos para o mapa, para manter a consistência visual
const containerStyle = { width: '100%', height: '400px' };
const center = { lat: -19.916681, lng: -43.934493 };
const mapStyles = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
  { featureType: "administrative.land_parcel", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
  { featureType: "poi", elementType: "labels.text", stylers: [{ visibility: "off" }] },
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] },
  { featureType: "road.local", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
];

const AddressAnalyticsPage = ({ user, isLoaded }) => {
    const [allOrders, setAllOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!user) return;
        const unsubscribe = onSnapshot(collection(db, `artifacts/${appId}/users/${user.uid}/orders`), 
            (snapshot) => {
                setAllOrders(snapshot.docs.map(doc => doc.data()));
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, [user]);

    const addressFrequency = useMemo(() => {
        if (loading) return [];
        
        const frequencyMap = new Map();

        allOrders.forEach(order => {
            const processTask = (task) => {
                if (task && task.address && task.geo) {
                    const existing = frequencyMap.get(task.address);
                    if (existing) {
                        frequencyMap.set(task.address, { ...existing, count: existing.count + 1 });
                    } else {
                        frequencyMap.set(task.address, { count: 1, geo: task.geo });
                    }
                }
            };
            processTask(order.pickupTask);
            processTask(order.deliveryTask);
        });

        return Array.from(frequencyMap, ([address, data]) => ({ address, ...data }))
                    .sort((a, b) => b.count - a.count);

    }, [allOrders, loading]);

    const heatmapData = useMemo(() => {
        if (!isLoaded || addressFrequency.length === 0) return [];
        
        const points = [];
        addressFrequency.forEach(item => {
            // Adiciona o ponto no mapa com um "peso" igual à contagem
            points.push({
                location: new window.google.maps.LatLng(item.geo.lat, item.geo.lng),
                weight: item.count
            });
        });
        return points;
    }, [isLoaded, addressFrequency]);

    const filteredAddresses = useMemo(() => {
        return addressFrequency.filter(item => 
            item.address.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [addressFrequency, searchTerm]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <MapPin size={32} />
                    Análise de Endereços
                </h1>
            </div>
            
            <div className="w-full h-[400px] rounded-xl overflow-hidden shadow-lg bg-gray-300">
                {!isLoaded ? <div className="h-full w-full flex items-center justify-center bg-gray-200"><Loader className="w-16 h-16 text-sky-600 animate-spin" /></div> : 
                (<GoogleMap 
                    mapContainerStyle={containerStyle} 
                    center={center} 
                    zoom={12}
                    options={{ styles: mapStyles, disableDefaultUI: true, zoomControl: true }}
                >
                    <HeatmapLayer data={heatmapData} options={{ radius: 30, opacity: 0.8 }} />
                </GoogleMap>)}
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
                <div className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar endereço na lista..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border rounded-lg w-full focus:ring-sky-500 focus:border-sky-500"
                        />
                    </div>
                </div>
                {loading ? (
                    <div className="p-12 text-center"><Loader className="mx-auto w-12 h-12 animate-spin text-sky-500" /></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase w-10/12">Endereço</th>
                                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase w-2/12">Nº de Visitas</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredAddresses.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-800">{item.address}</td>
                                        <td className="px-6 py-4 text-center font-bold text-lg text-sky-600">{item.count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddressAnalyticsPage;
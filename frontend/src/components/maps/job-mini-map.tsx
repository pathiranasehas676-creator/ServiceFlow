'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Copy, Map as MapIcon, Navigation } from 'lucide-react';
import { toast } from 'sonner';

// Fix Leaflet icon issue
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface JobMiniMapProps {
    lat: number;
    lng: number;
    address?: string;
}

export default function JobMiniMap({ lat, lng, address }: JobMiniMapProps) {
    const handleNavigate = () => {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=$${lat},$${lng}`, '_blank');
    };

    const handleCopyCoords = () => {
        navigator.clipboard.writeText(`$${lat}, $${lng}`);
        toast.success('Coordinates copied to clipboard');
    };

    return (
        <div className="space-y-4">
            <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative z-0">
                <MapContainer center={[lat, lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[lat, lng]}>
                        <Popup>{address || 'Job Location'}</Popup>
                    </Marker>
                </MapContainer>
            </div>

            <div className="flex gap-3">
                <Button
                    onClick={handleNavigate}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold h-11 rounded-xl shadow-lg shadow-slate-200"
                >
                    <Navigation className="mr-2 h-4 w-4" /> Open in Google Maps
                </Button>
                <Button
                    variant="outline"
                    onClick={handleCopyCoords}
                    className="px-4 border-slate-200 h-11 rounded-xl"
                    title="Copy Coordinates"
                >
                    <Copy className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

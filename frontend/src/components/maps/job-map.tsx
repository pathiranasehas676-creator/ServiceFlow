'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Job } from '@/lib/types/worker';
import { formatDistance } from '@/lib/utils/haversine';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Briefcase, Navigation, Map as MapIcon } from 'lucide-react';
import Link from 'next/link';

// Fix Leaflet icon issue
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface JobMapProps {
    jobs: Job[];
    userLocation?: { lat: number; lng: number };
    onAcceptJob: (id: string) => void;
    isAccepting: boolean;
    radius?: number | null;
}

/**
 * Component to auto-center map when jobs change
 */
function RecenterMap({ jobs, userLocation }: { jobs: Job[], userLocation?: { lat: number, lng: number } }) {
    const map = useMap();
    if (jobs.length > 0) {
        const validJobs = jobs.filter(j => j.lat && j.lng);
        if (validJobs.length > 0) {
            const points: [number, number][] = validJobs.map(j => [j.lat!, j.lng!]);
            if (userLocation) points.push([userLocation.lat, userLocation.lng]);
            const bounds = L.latLngBounds(points);
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    } else if (userLocation) {
        map.setView([userLocation.lat, userLocation.lng], 13);
    }
    return null;
}

export default function JobMap({ jobs, userLocation, onAcceptJob, isAccepting, radius }: JobMapProps) {
    const center: [number, number] = userLocation ? [userLocation.lat, userLocation.lng] : [6.9271, 79.8612]; // Default Colombo

    return (
        <div className="h-[600px] w-full rounded-3xl overflow-hidden border-2 border-slate-100 shadow-2xl relative z-0">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
                <Badge className="bg-slate-900/80 backdrop-blur-md text-white font-black px-6 py-2 rounded-2xl shadow-2xl flex items-center gap-2 border-none">
                    <MapIcon className="h-4 w-4 text-indigo-400" />
                    SHOWING {jobs.length} JOBS {radius ? `WITHIN ${radius}KM` : 'NEARBY'}
                </Badge>
            </div>

            <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {userLocation && (
                    <>
                        <Marker
                            position={[userLocation.lat, userLocation.lng]}
                            icon={L.divIcon({
                                className: 'user-loc-icon',
                                html: `<div class="h-6 w-6 bg-indigo-600 rounded-full border-4 border-white shadow-[0_0_20px_rgba(79,70,229,0.5)] animate-pulse"></div>`,
                                iconSize: [24, 24],
                                iconAnchor: [12, 12]
                            })}
                        >
                            <Popup className="font-bold">You are here</Popup>
                        </Marker>

                        {radius && (
                            <Circle
                                center={[userLocation.lat, userLocation.lng]}
                                radius={radius * 1000}
                                pathOptions={{
                                    color: '#6366f1',
                                    fillColor: '#6366f1',
                                    fillOpacity: 0.05,
                                    weight: 1,
                                    dashArray: '5, 10'
                                }}
                            />
                        )}
                    </>
                )}

                {jobs.filter(j => j.lat && j.lng).map((job) => (
                    <Marker key={job.id} position={[job.lat!, job.lng!]}>
                        <Popup className="job-map-popup">
                            <div className="p-1 space-y-3 min-w-[200px]">
                                <div className="flex justify-between items-start">
                                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 font-bold text-[10px]">
                                        {job.district}
                                    </Badge>
                                    <span className="font-black text-emerald-600 text-sm">
                                        ${(job.budget / 100).toFixed(2)}
                                    </span>
                                </div>

                                <h3 className="font-bold text-slate-900 m-0 leading-tight">{job.title}</h3>

                                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                                    <MapPin className="h-3 w-3" />
                                    <span className="truncate">{job.location}</span>
                                </div>

                                {userLocation && job.lat && job.lng && (
                                    <div className="flex items-center gap-2 text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded-md">
                                        <Navigation className="h-3 w-3" />
                                        Distance: {(job as any).distance ? formatDistance((job as any).distance) : 'Calculating...'}
                                    </div>
                                )}

                                <div className="flex gap-2 pt-2">
                                    <Button variant="outline" size="sm" className="flex-1 h-8 text-[11px] font-bold" asChild>
                                        <Link href={`/worker/jobs/${job.id}`}>DETAILS</Link>
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="flex-1 h-8 text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700"
                                        onClick={() => onAcceptJob(job.id)}
                                        disabled={isAccepting}
                                    >
                                        {isAccepting ? 'ACCEPT...' : 'ACCEPT'}
                                    </Button>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                <RecenterMap jobs={jobs} userLocation={userLocation} />
            </MapContainer>
        </div>
    );
}

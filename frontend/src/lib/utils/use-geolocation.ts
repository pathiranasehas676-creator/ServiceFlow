'use client';

import { useState, useEffect, useCallback } from 'react';

export type GeolocationStatus = 'idle' | 'prompting' | 'granted' | 'denied' | 'error' | 'unsupported';

interface GeolocationState {
    coords: { lat: number; lng: number } | null;
    status: GeolocationStatus;
    error: string | null;
}

export function useGeolocation() {
    const [state, setState] = useState<GeolocationState>({
        coords: null,
        status: 'idle',
        error: null,
    });

    const requestLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setState(prev => ({ ...prev, status: 'unsupported' }));
            return;
        }

        setState(prev => ({ ...prev, status: 'prompting' }));

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setState({
                    coords: {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    },
                    status: 'granted',
                    error: null,
                });
            },
            (error) => {
                let status: GeolocationStatus = 'error';
                if (error.code === error.PERMISSION_DENIED) {
                    status = 'denied';
                }
                setState({
                    coords: null,
                    status,
                    error: error.message,
                });
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    }, []);

    useEffect(() => {
        requestLocation();
    }, [requestLocation]);

    return { ...state, requestLocation };
}

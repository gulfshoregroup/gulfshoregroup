import { useState, useEffect } from 'react';
import axios from 'axios';

let cachedCities: string[] | null = null;
let fetchPromise: Promise<string[]> | null = null;

export function useCities() {
    const [cities, setCities] = useState<string[]>(cachedCities || []);
    const [loading, setLoading] = useState(!cachedCities);

    useEffect(() => {
        if (cachedCities) return;
        if (!fetchPromise) {
            fetchPromise = axios.get('/api/v2/cities').then(res => {
                const names = res.data.data.map((c: any) => c.name).filter(Boolean);
                cachedCities = names;
                return names;
            }).catch(err => {
                console.error("Error fetching cities:", err);
                fetchPromise = null;
                return [];
            });
        }
        fetchPromise.then(names => {
            setCities(names);
            setLoading(false);
        });
    }, []);

    return { cities, loading };
}
